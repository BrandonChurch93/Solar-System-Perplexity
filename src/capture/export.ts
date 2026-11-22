import { config, type FormatDef } from '../config'
import type { Engine } from '../core/engine'
import { clipRange, setsForFrame } from '../director/timeline'
import { FilmEncoder, chooseFallback, chooseH264, type CodecChoice, type EncodeSpec, type Sink } from './encoder'
import css from './export.module.css'

export interface MemorySample { frame: number; textureBytes: number; loaded: string[]; jsHeap: number | null }

export interface ExportStatus {
  state: 'idle' | 'running' | 'done' | 'error'
  framesDone: number
  framesTotal: number
  message: string
  memory: MemorySample[]
  codec: string
  h264: boolean
  file: string
  format: string
  tier: string
  assets: string
  first: number
  last: number
  sink: string
  seconds: number
}

type Win = Window & { exportStatus?: ExportStatus; exportResult?: Uint8Array; showcase?: { ready: Promise<void> }; showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle> }

interface CheckResult { text: string; level: 'ok' | 'warn' | 'bad' }

interface Plan { format: FormatDef; tier: string; assets: string; stop: string | null; first: number; last: number; file: string; spec: EncodeSpec }

const MB = 1024 * 1024
const MEMORY_EVERY = 15
const MAX_QUEUE = 4

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}

const channel = new MessageChannel()
const pending: (() => void)[] = []
channel.port1.onmessage = () => pending.shift()?.()
function yieldNow(): Promise<void> {
  return new Promise((resolve) => {
    pending.push(resolve)
    channel.port2.postMessage(0)
  })
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--'
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return (h > 0 ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(r).padStart(2, '0')
}

function formatKey(id: string): 'master' | 'uhd' | 'preview' {
  const k = config.formatKeys
  if (id === k.uhd) return 'uhd'
  if (id === k.preview) return 'preview'
  return 'master'
}

let carried: Promise<string[]> | null = null
function hostSets(): Promise<string[]> {
  carried ??= fetch(new URL('site.json', document.baseURI).href, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { sets?: string[] } | null) => (j && Array.isArray(j.sets) ? j.sets.filter((x) => !!config.assetSets[x]) : Object.keys(config.assetSets)))
    .catch(() => Object.keys(config.assetSets))
  return carried
}

function skyBytesFor(assets: string): number {
  const w = config.assetSets[assets]!.skyWidth
  return w * (w / 2) * 4 * (4 / 3) + w * (w / 4) * 4 * (4 / 3) + (w / 2) * (w / 8) * 4
}

export function mountExport(engine: Engine, params: URLSearchParams): void {
  const win = window as Win
  const raw = config.raw
  const auto = params.get('auto') === '1'
  const allowFallback = params.get('fallback') === '1' || auto
  const status: ExportStatus = { state: 'idle', framesDone: 0, framesTotal: 0, message: '', memory: [], codec: '', h264: false, file: '', format: '', tier: '', assets: '', first: 0, last: 0, sink: '', seconds: 0 }
  win.exportStatus = status

  const k = config.formatKeys
  const formatIds = [k.master, k.uhd]
  const askedFormat = params.get('format')
  if (askedFormat && config.formats[askedFormat] && !formatIds.includes(askedFormat)) formatIds.push(askedFormat)
  const askedTier = params.get('tier')
  const askedAssets = params.get('assets')
  const askedStop = params.get('stop')
  const firstParam = params.get('first')
  const lastParam = params.get('last')

  let format = askedFormat && config.formats[askedFormat] ? askedFormat : k.master
  let tier = askedTier && config.tiers[askedTier] ? askedTier : 'final'
  let assets = askedAssets && config.assetSets[askedAssets] ? askedAssets : 'full'
  let range = askedStop && config.stopIds.includes(askedStop) ? askedStop : 'film'

  const page = el('div', css.page)
  const inner = el('div', css.inner)
  page.appendChild(inner)
  const header = el('header', css.header)
  header.append(el('h1', css.title, 'Export the film'), el('p', css.lead, 'Renders every frame on this machine, encodes it and saves one video file. Keep this tab in front until it finishes.'))
  inner.appendChild(header)

  const panel = el('section', css.panel)
  inner.appendChild(panel)

  const radioGroup = (title: string, name: string, items: { value: string; label: string; note: string }[], current: string, onPick: (v: string) => void): { root: HTMLFieldSetElement; inputs: HTMLInputElement[] } => {
    const fs = el('fieldset', css.group)
    fs.appendChild(el('legend', css.legend, title))
    const wrap = el('div', css.options)
    const inputs: HTMLInputElement[] = []
    for (const it of items) {
      const label = el('label', css.option)
      const input = el('input')
      input.type = 'radio'
      input.name = name
      input.value = it.value
      input.checked = it.value === current
      input.addEventListener('change', () => input.checked && onPick(it.value))
      inputs.push(input)
      label.append(input, el('span', css.optionName, it.label), el('span', css.optionNote, it.note))
      wrap.appendChild(label)
    }
    fs.appendChild(wrap)
    return { root: fs, inputs }
  }

  const formatName = (id: string): string => (id === k.master ? 'Master' : id === k.uhd ? 'Ultra HD' : id === k.preview ? 'Preview' : id)
  const formats = radioGroup('Format', 'format', formatIds.map((id) => ({ value: id, label: formatName(id), note: config.formats[id]!.width + ' by ' + config.formats[id]!.height })), format, (v) => {
    format = v
    void refresh()
  })
  panel.appendChild(formats.root)

  const rangeFs = el('fieldset', css.group)
  rangeFs.appendChild(el('legend', css.legend, 'Range'))
  const rangeSelect = el('select', css.select)
  rangeSelect.setAttribute('aria-label', 'Range')
  const filmOpt = el('option', undefined, 'The whole film, ' + clock(config.durationSeconds))
  filmOpt.value = 'film'
  rangeSelect.appendChild(filmOpt)
  for (const s of config.stops) {
    const r = clipRange(s.id)
    const o = el('option', undefined, s.name + ' clip, ' + clock((r.endFrame - r.firstFrame) / config.fps))
    o.value = s.id
    rangeSelect.appendChild(o)
  }
  rangeSelect.value = range
  rangeSelect.addEventListener('change', () => {
    range = rangeSelect.value
    void refresh()
  })
  const rangeNote = el('p', css.optionNote + ' ' + css.rangeNote)
  rangeNote.hidden = firstParam === null && lastParam === null
  rangeFs.append(rangeSelect, rangeNote)
  panel.appendChild(rangeFs)

  const tierNames: Record<string, string> = { draft: 'Draft', review: 'Review', final: 'Final' }
  const tiers = radioGroup('Quality', 'tier', Object.keys(config.tiers).map((id) => {
    const t = config.tiers[id]!
    return { value: id, label: tierNames[id] ?? id, note: t.samplesPerFrame + (t.fastSamplesPerFrame !== t.samplesPerFrame ? ' to ' + t.fastSamplesPerFrame : '') + (t.samplesPerFrame === 1 && t.fastSamplesPerFrame === 1 ? ' sample' : ' samples') + ' a frame' }
  }), tier, (v) => {
    tier = v
    void refresh()
  })
  panel.appendChild(tiers.root)

  const checksFs = el('fieldset', css.group)
  checksFs.appendChild(el('legend', css.legend, 'Before starting'))
  const checkList = el('ul', css.checks)
  checksFs.appendChild(checkList)
  panel.appendChild(checksFs)

  const actions = el('div', css.actions)
  const startBtn = el('button', css.button, 'Start export')
  startBtn.type = 'button'
  const webBtn = el('button', css.button + ' ' + css.secondary, 'Use the web set instead')
  webBtn.type = 'button'
  webBtn.hidden = true
  actions.append(startBtn, webBtn)
  panel.appendChild(actions)

  const monitorWrap = el('section', css.monitorWrap)
  const monitor = el('div', css.monitor)
  monitor.setAttribute('aria-label', 'Progress monitor')
  monitor.appendChild(engine.canvas)
  const bar = el('div', css.bar)
  const fill = el('div', css.fill)
  bar.appendChild(fill)
  const stats = el('dl', css.stats)
  const stat = (label: string): HTMLElement => {
    const box = el('div', css.stat)
    const v = el('dd', css.statValue, '--')
    box.append(el('dt', css.statLabel, label), v)
    stats.appendChild(box)
    return v
  }
  const doneEl = stat('Frames done')
  const elapsedEl = stat('Elapsed')
  const remainEl = stat('Remaining')
  const message = el('p', css.message)
  message.setAttribute('role', 'status')
  monitorWrap.append(monitor, bar, stats, message)
  inner.appendChild(monitorWrap)

  ;(document.getElementById('ui') ?? document.body).appendChild(page)

  const say = (text: string, kind: 'plain' | 'error' | 'done' = 'plain'): void => {
    message.textContent = text
    message.className = css.message + (kind === 'error' ? ' ' + css.messageError : kind === 'done' ? ' ' + css.messageDone : '')
    status.message = text
  }

  const plan = (): Plan => {
    const f = config.formats[format]!
    let first = 0
    let last = config.frameCount - 1
    let stop: string | null = null
    if (range !== 'film') {
      const r = clipRange(range)
      first = r.firstFrame
      last = r.endFrame - 1
      stop = range
    }
    if (firstParam !== null && Number.isFinite(Number(firstParam))) first = Math.max(first, Math.floor(Number(firstParam)))
    if (lastParam !== null && Number.isFinite(Number(lastParam))) last = Math.min(last, Math.floor(Number(lastParam)))
    const key = formatKey(f.id)
    const file = stop ? raw.export.files.clip.split('{stop}').join(stop) : raw.export.files[key]
    return { format: f, tier, assets, stop, first, last, file, spec: { width: f.width, height: f.height, fps: config.fps, bitrate: raw.export.bitrateMbps * 1e6 } }
  }

  let codec: CodecChoice | null = null
  let blocked = true
  let running = false
  let refreshId = 0

  const refresh = async (): Promise<void> => {
    const id = ++refreshId
    const p = plan()
    startBtn.disabled = true
    const results: CheckResult[] = []
    const h264 = await chooseH264(p.spec)
    let chosen = h264
    let fatal = false
    if (h264) results.push({ level: 'ok', text: 'This browser can encode H.264 video at ' + p.format.width + ' by ' + p.format.height + '.' })
    else {
      const fb = allowFallback ? await chooseFallback(p.spec) : null
      if (fb) {
        chosen = fb
        results.push({ level: 'warn', text: 'This browser cannot encode H.264 video at this size. It will use ' + fb.label + ' instead, which is a test file only.' })
      } else {
        fatal = true
        results.push({ level: 'bad', text: 'This browser cannot encode H.264 video at ' + p.format.width + ' by ' + p.format.height + '. Try a current desktop Chrome or Edge.' })
      }
    }
    const here = await hostSets()
    if (id !== refreshId) return
    if (here.includes(assets) === false && here.length > 0) {
      assets = here.includes('web') ? 'web' : here[0]!
      results.push({ level: 'warn', text: 'This copy of the site carries the ' + here.join(' and ') + ' texture set only, so the export uses it. The full set comes with the repository.' })
    }
    const set = config.assetSets[assets]!
    const largest = Math.max(set.wrapMapWidth, set.reliefWidth, set.skyWidth)
    const gl = engine.renderer.getContext()
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    let setFits = true
    if (maxTex >= largest) results.push({ level: 'ok', text: 'This machine accepts textures of ' + largest + ' pixels, the largest in the ' + assets + ' set.' })
    else {
      setFits = false
      fatal = true
      results.push({ level: 'bad', text: 'This machine only accepts textures up to ' + maxTex + ' pixels, and the ' + assets + ' set needs ' + largest + '.' })
    }
    const needBytes = 2 * set.maxSetMemoryMb * MB + skyBytesFor(assets)
    const needGb = needBytes / (1024 * MB)
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (typeof dm !== 'number') results.push({ level: 'warn', text: 'The memory of this machine could not be checked. The ' + assets + ' set needs about ' + needGb.toFixed(1) + ' GB for two stops and the sky.' })
    else if (dm * 1024 * MB >= needBytes) results.push({ level: 'ok', text: 'This machine reports ' + dm + ' GB of memory, enough for two stops and the sky (about ' + needGb.toFixed(1) + ' GB).' })
    else {
      setFits = false
      fatal = true
      results.push({ level: 'bad', text: 'This machine reports ' + dm + ' GB of memory, and the ' + assets + ' set needs about ' + needGb.toFixed(1) + ' GB for two stops and the sky.' })
    }
    const frames = p.last - p.first + 1
    if (frames < 1) {
      fatal = true
      results.push({ level: 'bad', text: 'The chosen range has no frames.' })
    }
    if (id !== refreshId) return
    checkList.replaceChildren(...results.map((r) => {
      const li = el('li', css.check + ' ' + css[r.level])
      li.append(el('span', css.dot), el('span', undefined, r.text))
      return li
    }))
    codec = chosen
    blocked = fatal
    webBtn.hidden = setFits || assets === 'web'
    startBtn.disabled = fatal || running
    status.framesTotal = Math.max(frames, 0)
    rangeNote.textContent = 'Limited to frames ' + p.first + ' to ' + p.last + ' for testing.'
    doneEl.textContent = '0 of ' + Math.max(frames, 0)
    if (!running && status.state === 'idle') say(fatal ? 'Export cannot start until the problem above is solved.' : 'Ready. The file will be saved as ' + p.file + '.', fatal ? 'error' : 'plain')
  }

  webBtn.addEventListener('click', () => {
    assets = 'web'
    void refresh()
  })

  let lost = false
  engine.canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    lost = true
  })

  const lock = (disabled: boolean): void => {
    for (const i of [...formats.inputs, ...tiers.inputs]) i.disabled = disabled
    rangeSelect.disabled = disabled
    webBtn.disabled = disabled
    startBtn.disabled = disabled || blocked
  }

  const run = async (sink: Sink): Promise<void> => {
    const p = plan()
    const choice = codec
    if (!choice || blocked) return
    running = true
    lock(true)
    const total = p.last - p.first + 1
    Object.assign(status, { state: 'running', framesDone: 0, framesTotal: total, memory: [], codec: choice.codec, h264: choice.h264, file: p.file, format: p.format.id, tier: p.tier, assets: p.assets, first: p.first, last: p.last, sink: sink.kind, seconds: 0 })
    delete win.exportResult
    let wake: WakeLockSentinel | null = null
    try {
      wake = await navigator.wakeLock?.request('screen')
    } catch {
      wake = null
    }
    if (!auto) monitorWrap.scrollIntoView({ block: 'start', behavior: 'smooth' })
    say(wake ? 'Loading.' : 'Loading. The screen may sleep, since this browser refused to keep it awake. Rendering carries on while the tab stays open.')
    const t0 = performance.now()
    let encoder: FilmEncoder | null = null
    try {
      await win.showcase?.ready
      engine.setFormat(p.format.id)
      engine.setAssets(p.assets)
      encoder = new FilmEncoder(choice, p.spec, sink)
      const sample = (frame: number): void => {
        const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
        status.memory.push({ frame, textureBytes: engine.sets.totalBytes(), loaded: engine.sets.loadedIds(), jsHeap: mem ? mem.usedJSHeapSize : null })
      }
      for (let f = p.first; f <= p.last; f++) {
        if (lost) throw new Error('lost')
        const wanted = setsForFrame(f)
        for (const id of engine.sets.loadedIds()) if (!wanted.includes(id)) engine.sets.free(id)
        await engine.renderFrame(f, p.tier)
        if (lost || engine.renderer.getContext().isContextLost()) throw new Error('lost')
        const i = f - p.first
        encoder.encodeCanvas(engine.canvas, i)
        if (i % MEMORY_EVERY === 0 || f === p.last) sample(f)
        await encoder.drainTo(MAX_QUEUE, yieldNow)
        status.framesDone = i + 1
        const elapsed = (performance.now() - t0) / 1000
        doneEl.textContent = status.framesDone + ' of ' + total
        elapsedEl.textContent = clock(elapsed)
        remainEl.textContent = clock((elapsed / status.framesDone) * (total - status.framesDone))
        fill.style.width = ((100 * status.framesDone) / total).toFixed(2) + '%'
        if (status.framesDone === 1 || status.framesDone % 10 === 0) say('Rendering frame ' + f + '.')
        await yieldNow()
      }
      say('Finishing the file.')
      const bytes = await encoder.finish(total)
      status.seconds = (performance.now() - t0) / 1000
      if (bytes) {
        if (auto) win.exportResult = bytes
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'video/mp4' }))
        const a = el('a')
        a.href = url
        a.download = p.file
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      }
      status.state = 'done'
      elapsedEl.textContent = clock(status.seconds)
      remainEl.textContent = clock(0)
      say('Done. ' + total + ' frames saved as ' + p.file + ' in ' + clock(status.seconds) + '.' + (choice.h264 ? '' : ' This file is not H.264.'), 'done')
    } catch (e) {
      await encoder?.abort()
      status.state = 'error'
      const text = lost || (e instanceof Error && e.message === 'lost')
        ? 'The graphics card stopped responding, so the browser dropped the picture. The export stopped and no file was saved. Close other heavy tabs or apps and start again.'
        : 'The export stopped because of an error, and no file was saved: ' + (e instanceof Error ? e.message : String(e))
      say(text, 'error')
    } finally {
      try {
        await wake?.release()
      } catch {
        wake = null
      }
      running = false
      lock(false)
    }
  }

  startBtn.addEventListener('click', () => {
    if (running || blocked) return
    const p = plan()
    if (typeof win.showSaveFilePicker === 'function') {
      win.showSaveFilePicker({ suggestedName: p.file, types: [{ description: 'Video', accept: { 'video/mp4': ['.mp4'] } }] })
        .then((h) => h.createWritable())
        .then((stream) => run({ kind: 'disk', stream }))
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === 'AbortError') say('No file was chosen, so nothing started.')
          else void run({ kind: 'memory' })
        })
    } else void run({ kind: 'memory' })
  })

  void refresh().then(() => {
    if (auto && !blocked) void run({ kind: 'memory' })
    else if (auto) status.state = 'error'
  })
}
