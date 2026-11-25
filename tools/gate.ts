import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, linkDist, loadConfig, readRecord } from './lib/common'
import { computeHashes } from './lib/hashes'
import { type Units, unitNote } from './gate/units'
import { DETERMINISM, WARM_SELF, determinismFrames, keptDeterminism, keptWarm, pinnedBrowser, readKept, toolHash, warmSelfFrames } from './gate/kept'
import { openCapture, renderPng } from './lib/browser'
import { decodePng } from './lib/frames'
import { decodeFramePng, psnrPng } from './lib/encode'
import { needs } from '../src/core/caps'
import { judgedFrames, setsForFrame, stopSegments } from '../src/director/timeline'

const cfg = loadConfig()
const a = args()
const phase = Number(a.phase ?? 0)
const only = a.only ? a.only.split(',') : null

interface Result { id: string; pass: boolean; note: string }
const results: Result[] = []

function run(cmd: string, argv: string[]): { ok: boolean; out: string } {
  const r = spawnSync(cmd, argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 })
  return { ok: r.status === 0, out: ((r.stdout ?? '') + (r.stderr ?? '')).replace(/\x1b\[[0-9;]*m/g, '') }
}

function tracked(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean)
}

function pngSize(b: Buffer): [number, number] {
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

function probe(file: string): { frames: number; width: number; height: number; fps: string } | null {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate', '-of', 'json', file], { encoding: 'utf8' })
  if (r.status !== 0) return null
  const s = (JSON.parse(r.stdout) as { streams: { nb_read_frames: string; width: number; height: number; r_frame_rate: string }[] }).streams[0]
  if (!s) return null
  return { frames: Number(s.nb_read_frames), width: s.width, height: s.height, fps: s.r_frame_rate }
}

function sameHashes(r: { engineHash: string; stopHashes: Record<string, string> } | null, h: { engine: string; stops: Record<string, string> }): string {
  if (!r) return 'no record'
  if (r.engineHash !== h.engine) return 'engine hash ' + r.engineHash + ' is not the current ' + h.engine
  const stale = cfg.stopIds.filter((s) => r.stopHashes[s] !== h.stops[s])
  return stale.length ? 'stale stop hashes: ' + stale.join(',') : ''
}

function progressSection(name: string): string {
  const text = readFileSync(join(ROOT, 'kit/PROGRESS.md'), 'utf8')
  return text.split('## ' + name)[1]?.split('\n## ')[0] ?? ''
}

function finishedStops(): string[] {
  if (a['g15-stops']) return a['g15-stops'].split(',')
  const rows = progressSection('Stops').split('\n').filter((l) => l.startsWith('|'))
  const out: string[] = []
  for (const r of rows) {
    const c = r.split('|').map((x) => x.trim())
    if (cfg.stopIds.includes(c[1] ?? '') && /^finished/.test(c[2] ?? '')) out.push(c[1]!)
  }
  return out
}

function fileNames(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string, rel: string): void => {
    if (!existsSync(d)) return
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n)
      if (statSync(p).isDirectory()) walk(p, rel + n + '/')
      else out.push(rel + n)
    }
  }
  walk(dir, '')
  return out
}

async function noInterface(mode: string, format: string): Promise<string[]> {
  const s = await openCapture({ dist: DIST, format, assets: 'web', mode })
  const bad: string[] = []
  try {
    if (mode === 'capture') await renderPng(s.page, cfg.hookFrame, 'draft')
    else {
      await s.page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      await s.page.waitForTimeout(3000)
    }
    const dom = await s.page.evaluate(() => {
      const c = document.querySelector('canvas')
      const bodyBg = getComputedStyle(document.body).backgroundColor
      const issues: string[] = []
      if (!c) return { issues: ['no canvas'], rect: null, bg: bodyBg }
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        if (el === c) continue
        const name = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '')
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (!(r.width > 0 && r.height > 0) || cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
        if (el.contains(c)) {
          const border = ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(cs.getPropertyValue('border-' + k.toLowerCase() + '-width')) > 0 && cs.getPropertyValue('border-' + k.toLowerCase() + '-style') !== 'none')
          const text = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '')
          const paints = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== bodyBg) || cs.backgroundImage !== 'none' || border || cs.boxShadow !== 'none' || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || text
          if (paints) issues.push(name + ' around the canvas paints something')
          continue
        }
        issues.push(name + ' has a visible box ' + Math.round(r.width) + 'x' + Math.round(r.height))
      }
      const r = c.getBoundingClientRect()
      return { issues, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, bg: bodyBg }
    })
    for (const i of dom.issues) bad.push(mode + ' ' + format + ': ' + i)
    const m = /rgba?\((\d+), (\d+), (\d+)/.exec(dom.bg)
    if (!m || !dom.rect) bad.push(mode + ' ' + format + ': cannot read page background')
    else {
      const bg = [Number(m[1]), Number(m[2]), Number(m[3])]
      const shot = decodePng(await s.page.screenshot({ type: 'png' }))
      const x0 = Math.floor(dom.rect.x) - 1
      const y0 = Math.floor(dom.rect.y) - 1
      const x1 = Math.ceil(dom.rect.x + dom.rect.w) + 1
      const y1 = Math.ceil(dom.rect.y + dom.rect.h) + 1
      let off = 0
      let outside = 0
      for (let y = 0; y < shot.height; y++)
        for (let x = 0; x < shot.width; x++) {
          if (x >= x0 && x < x1 && y >= y0 && y < y1) continue
          outside++
          const i = (y * shot.width + x) * shot.channels
          if (Math.abs(shot.data[i]! - bg[0]!) > 1 || Math.abs(shot.data[i + 1]! - bg[1]!) > 1 || Math.abs(shot.data[i + 2]! - bg[2]!) > 1) off++
        }
      if (off > 0) bad.push(mode + ' ' + format + ': ' + off + ' of ' + outside + ' pixels outside the canvas are not the page background')
    }
  } finally {
    await s.close()
  }
  return bad
}

function measureCheck(id: 'G5' | 'G13' | 'G17'): Result {
  const h = ensureBuild()
  const dir = join(WORK, 'measure')
  const stops = a.stop ? a.stop.split(',') : existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.json')).map((n) => n.slice(0, -5)) : []
  if (stops.length === 0) return { id, pass: false, note: 'no measures in out/work/measure; run npm run measure -- --stop ID' }
  const notes: string[] = []
  let pass = true
  for (const stop of stops) {
    const file = join(dir, stop + '.json')
    if (!existsSync(file)) {
      pass = false
      notes.push(stop + ' not measured')
      continue
    }
    const m = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown> & { engineHash: string; stopHash: string; every: number }
    const r = m[id] as { pass: boolean } | undefined
    const fresh = m.engineHash === h.engine && m.stopHash === h.stops[stop]
    const ok = !!r && r.pass && fresh && (id !== 'G13' || m.every === 1)
    if (!ok) pass = false
    notes.push(stop + ' ' + (!r ? 'not measured' : !fresh ? 'stale' : r.pass ? (id === 'G13' && m.every !== 1 ? 'sampled only' : 'pass') : 'fail'))
  }
  return { id, pass, note: notes.join('; ') }
}

const checks: Record<string, () => Promise<Result> | Result> = {
  G5: () => measureCheck('G5'),
  G13: () => measureCheck('G13'),
  G17: () => measureCheck('G17'),
  G6: async () => {
    ensureBuild()
    const bad: string[] = []
    bad.push(...(await noInterface('autopilot', cfg.formatKeys.master)))
    bad.push(...(await noInterface('capture', cfg.formatKeys.master)))
    bad.push(...(await noInterface('capture', cfg.formatKeys.preview)))
    let exportNote = 'no export proof yet'
    const proof = join(WORK, 'export', cfg.raw.export.files.preview)
    const rec = readRecord(proof)
    if (rec) {
      const frame = rec.first ?? 0
      const s = await openCapture({ dist: DIST, format: rec.format, assets: rec.assets })
      const { png } = await renderPng(s.page, frame, rec.tier)
      await s.close()
      const dir = join(WORK, 'gate')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'g6-still.png'), png)
      decodeFramePng(proof, 0, join(dir, 'g6-export.png'))
      const v = psnrPng(join(dir, 'g6-export.png'), join(dir, 'g6-still.png'))
      exportNote = 'export frame ' + frame + ' PSNR ' + v.toFixed(1) + ' dB against its still'
      if (!(v >= 30)) bad.push(exportNote)
    }
    return { id: 'G6', pass: bad.length === 0, note: bad.length === 0 ? 'autopilot and capture show only the canvas; ' + exportNote : bad.slice(0, 6).join('; ') }
  },
  G8: () => {
    const h = ensureBuild()
    const file = join(ROOT, 'out/preview.mp4')
    const f = cfg.formats[cfg.formatKeys.preview]!
    const p = probe(file)
    if (!p) return { id: 'G8', pass: false, note: 'out/preview.mp4 missing or unreadable' }
    const bad: string[] = []
    if (p.fps !== cfg.fps + '/1') bad.push('fps ' + p.fps)
    if (p.frames !== cfg.frameCount) bad.push(p.frames + ' frames, want ' + cfg.frameCount)
    if (p.width !== f.width || p.height !== f.height) bad.push(p.width + 'x' + p.height)
    const size = statSync(file).size
    if (size > cfg.raw.repo.maxFileMb * 1e6) bad.push((size / 1e6).toFixed(1) + ' MB is over the file limit')
    const rec = existsSync(file + '.json') ? (JSON.parse(readFileSync(file + '.json', 'utf8')) as { engineHash: string; stopHashes: Record<string, string>; format: string; extra?: { g5?: { frames: { frame: number }[]; failed: number[] } } }) : null
    const stale = sameHashes(rec, h)
    if (stale) bad.push(stale)
    const g5 = rec?.extra?.g5
    const have = new Set((g5?.frames ?? []).map((x) => x.frame))
    let missing = 0
    for (let i = 0; i < cfg.frameCount; i++) if (!have.has(i)) missing++
    if (!g5 || missing > 0) bad.push('record lacks G5 for ' + (g5 ? missing : cfg.frameCount) + ' frames')
    const open = progressSection('Open items')
    const unlisted = (g5?.failed ?? []).filter((n) => !new RegExp('frame ' + n + '(?![0-9])').test(open))
    if (unlisted.length) bad.push(unlisted.length + ' G5 failures not under Open items, first ' + unlisted.slice(0, 5).join(','))
    return { id: 'G8', pass: bad.length === 0, note: bad.length === 0 ? p.frames + ' frames ' + p.width + 'x' + p.height + ' ' + p.fps + ', ' + (size / 1e6).toFixed(1) + ' MB, G5 failures ' + (g5?.failed.length ?? 0) + ' all listed' : bad.join('; ') }
  },
  G9: () => {
    const h = ensureBuild()
    const file = join(WORK, 'export', cfg.raw.export.files.preview)
    const p = probe(file)
    if (!p) return { id: 'G9', pass: false, note: 'out/work/export/' + cfg.raw.export.files.preview + ' missing; run npm run proof' }
    const rec = readRecord(file)
    const stale = sameHashes(rec, h)
    const f = cfg.formats[cfg.formatKeys.preview]!
    const bad: string[] = []
    if (stale) bad.push(stale)
    if (p.frames <= 0) bad.push('no frames')
    if (p.width !== f.width || p.height !== f.height) bad.push(p.width + 'x' + p.height)
    if (p.fps !== cfg.fps + '/1') bad.push('fps ' + p.fps)
    const proof = (rec?.extra ?? {}) as { pass?: boolean; errors?: string[] }
    if (proof.pass !== true) bad.push('the newest npm run proof did not pass: ' + ((proof.errors ?? []).join('; ') || 'its record has no result'))
    return { id: 'G9', pass: bad.length === 0, note: bad.length === 0 ? 'proof ' + p.frames + ' frames ' + p.width + 'x' + p.height + ' ' + p.fps + ' from the current build' : bad.join('; ') }
  },
  G15: async () => {
    const bad: string[] = []
    let worst = 0
    for (let i = 0; i < cfg.frameCount; i++) {
      const n = setsForFrame(i).length
      worst = Math.max(worst, n)
      if (n > cfg.raw.sets.maxLoaded) {
        bad.push('frame ' + i + ' needs ' + n + ' sets')
        if (bad.length > 5) break
      }
    }
    const done = finishedStops()
    const mem: string[] = []
    if (done.length) ensureBuild()
    for (const stop of done) {
      const base = join(ROOT, 'public/assets', stop)
      const web = fileNames(join(base, 'web'))
      const full = fileNames(join(base, 'full'))
      const onlyWeb = web.filter((x) => !full.includes(x))
      const onlyFull = full.filter((x) => !web.includes(x))
      if (web.length === 0 && full.length === 0) bad.push(stop + ' has no files in public/assets/' + stop + '/web or /full')
      if (onlyWeb.length || onlyFull.length) bad.push(stop + ' web and full differ: ' + [...onlyWeb.map((x) => 'web only ' + x), ...onlyFull.map((x) => 'full only ' + x)].slice(0, 4).join(', '))
      const seg = stopSegments(stop).find((x) => x.kind === 'hold') ?? stopSegments(stop)[0]!
      for (const set of Object.keys(cfg.assetSets)) {
        const s = await openCapture({ dist: DIST, format: cfg.formatKeys.master, assets: set })
        try {
          await renderPng(s.page, seg.firstFrame, 'draft')
          const m = await s.page.evaluate(() => (window as unknown as { showcase: { memory(): { perSet: Record<string, number> } } }).showcase.memory())
          const bytes = m.perSet[stop] ?? 0
          const limit = cfg.assetSets[set]!.maxSetMemoryMb * 1e6
          mem.push(stop + '/' + set + ' ' + (bytes / 1e6).toFixed(0) + ' MB')
          if (!(stop in m.perSet)) bad.push(stop + '/' + set + ' was not reported by the loader')
          else if (bytes > limit) bad.push(stop + '/' + set + ' uses ' + (bytes / 1e6).toFixed(0) + ' MB, limit ' + cfg.assetSets[set]!.maxSetMemoryMb)
        } finally {
          await s.close()
        }
      }
    }
    return { id: 'G15', pass: bad.length === 0, note: (bad.length === 0 ? 'at most ' + worst + ' sets per frame; ' : bad.slice(0, 6).join('; ') + '; ') + 'finished stops: ' + (done.length ? mem.join(', ') : 'none yet') }
  },
  G1: () => {
    const r = run('npm', ['run', 'build', '--silent'])
    if (r.ok) linkDist()
    return { id: 'G1', pass: r.ok, note: r.ok ? 'build clean' : r.out.slice(-600) }
  },
  G2: () => {
    const file = join(WORK, 'gate-units.json')
    mkdirSync(WORK, { recursive: true })
    rmSync(file, { force: true })
    const r = run('npx', ['vitest', 'run', '--reporter=json', '--outputFile=' + file])
    let report: Units | null = null
    try {
      report = JSON.parse(readFileSync(file, 'utf8')) as Units
    } catch {
      report = null
    }
    return { id: 'G2', ...unitNote(report, r.ok, r.out, ROOT) }
  },
  G3: () => {
    const h = computeHashes(ROOT)
    const build = { engineHash: h.engine, stopHashes: h.stops, browser: pinnedBrowser(ROOT) }
    const listed = (JSON.parse(readFileSync(join(ROOT, 'src/core/warm.json'), 'utf8')) as { frames: number[] }).frames
    const kd = keptDeterminism(readKept(join(WORK, 'determinism', 'result.json')), { ...build, ...DETERMINISM, format: formatId(cfg, DETERMINISM.format), tool: toolHash(ROOT, 'tools/determinism.ts'), frames: determinismFrames(cfg.segments) })
    const kw = keptWarm(readKept(join(WORK, 'warm', 'self.json')), { ...build, ...WARM_SELF, format: cfg.formatKeys.preview, tool: toolHash(ROOT, 'tools/warmcheck.ts'), ...warmSelfFrames(cfg.segments, listed) })
    const part = (name: string, k: { why: string; machine: string; lines: string[] }, argv: string[], last: number): { ok: boolean; lines: string[] } => {
      if (!k.why) return { ok: true, lines: [name + ': the record of this build is reused, made on ' + k.machine + ', nothing is drawn here', ...k.lines.slice(-last)] }
      const r = run('npx', ['tsx', ...argv])
      return { ok: r.ok, lines: [name + ': run here (' + k.why + ')', ...r.out.trim().split('\n').slice(-last)] }
    }
    const r = part('determinism', kd, ['tools/determinism.ts'], 6)
    const w = part('warm', kw, ['tools/warmcheck.ts', '--self'], 4)
    return { id: 'G3', pass: r.ok && w.ok, note: r.lines.concat(w.lines).join('; ') }
  },
  G4: async () => {
    ensureBuild()
    const notes: string[] = []
    let pass = true
    for (const f of Object.values(cfg.formats)) {
      const s = await openCapture({ dist: DIST, format: f.id, assets: 'web' })
      const info = await s.page.evaluate(() => (window as unknown as { showcase: { info(): { frameCount: number } } }).showcase.info())
      const { png } = await renderPng(s.page, cfg.hookFrame, 'draft')
      await s.close()
      const [w, h] = pngSize(png)
      const ok = w === f.width && h === f.height && info.frameCount === cfg.fps * cfg.durationSeconds
      if (!ok) pass = false
      notes.push(f.id + ' ' + w + 'x' + h + ' frames ' + info.frameCount)
    }
    return { id: 'G4', pass, note: notes.join('; ') }
  },
  G7: () => {
    const computed = judgedFrames().map((j) => j.frame)
    const progress = readFileSync(join(ROOT, 'kit/PROGRESS.md'), 'utf8')
    const section = progress.split('## Judged frames')[1]?.split('\n## ')[0] ?? ''
    const listed = new Set((section.match(/\|\s*(\d+)\s*\|/g) ?? []).map((x) => Number(x.replace(/\D/g, ''))))
    const missing = computed.filter((f) => !listed.has(f))
    return { id: 'G7', pass: missing.length === 0, note: missing.length === 0 ? computed.length + ' judged frames listed' : 'not listed: ' + missing.join(',') }
  },
  G10: () => {
    const p = cfg.raw.platform
    const m = cfg.raw.formats.master
    const clipsOk = cfg.stopIds.every((id) => {
      const segs = cfg.segments.filter((s) => s.stop === id && s.kind !== 'travel')
      return segs[segs.length - 1]!.end - segs[0]!.start <= p.loopsAtOrUnderSeconds
    })
    const pass = m.width <= p.maxWidth && m.height <= p.maxHeight && cfg.fps <= p.maxFps && cfg.raw.export.bitrateMbps <= p.maxBitrateMbps && clipsOk
    return { id: 'G10', pass, note: m.width + 'x' + m.height + ' ' + cfg.fps + ' fps ' + cfg.raw.export.bitrateMbps + ' Mbps, clips ' + (clipsOk ? 'fit' : 'too long') }
  },
  G11: () => {
    const assets = readFileSync(join(ROOT, 'ASSETS.md'), 'utf8')
    const bad: string[] = []
    const walk = (dir: string, fn: (p: string) => void): void => {
      if (!existsSync(dir)) return
      for (const n of readdirSync(dir)) {
        const p = join(dir, n)
        if (statSync(p).isDirectory()) walk(p, fn)
        else fn(p)
      }
    }
    walk(join(ROOT, 'public/assets/third-party'), (p) => {
      const rel = p.slice(ROOT.length + 1)
      if (!assets.includes(rel)) bad.push(rel)
    })
    const recipes: Record<string, string> = {}
    walk(join(ROOT, 'assets-src'), (p) => {
      if (p.endsWith('RECIPE.md')) recipes[p] = readFileSync(p, 'utf8')
    })
    const all = Object.values(recipes).join('\n')
    walk(join(ROOT, 'public/assets'), (p) => {
      const rel = p.slice(ROOT.length + 1)
      if (rel.startsWith('public/assets/third-party/')) return
      const generic = rel.replace(/\/(web|full)\//, '/<set>/')
      if (!all.includes(rel) && !all.includes(generic)) bad.push(rel)
    })
    return { id: 'G11', pass: bad.length === 0, note: bad.length === 0 ? 'every asset has a row or a recipe' : 'missing: ' + bad.slice(0, 8).join(', ') }
  },
  G12: () => {
    const files = tracked()
    const bad: string[] = []
    let total = 0
    for (const f of files) {
      const p = join(ROOT, f)
      if (!existsSync(p)) continue
      const size = statSync(p).size
      total += size
      if (size > cfg.raw.repo.maxFileMb * 1e6) bad.push(f + ' is over the file limit')
      if (f.startsWith('references/cache/') || f.startsWith('out/work/')) bad.push(f + ' must not be tracked')
      if (/(^|\/)\.env|id_rsa|\.pem$|credentials/i.test(f)) bad.push(f + ' looks like a secret')
    }
    if (total > cfg.raw.repo.maxTreeGb * 1e9) bad.push('tree is ' + (total / 1e9).toFixed(2) + ' GB')
    const manifest = join(ROOT, 'references/approved/MANIFEST.sha256')
    for (const line of readFileSync(manifest, 'utf8').split('\n')) {
      const m = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim())
      if (!m) continue
      const candidates = [join(ROOT, m[2]!), join(ROOT, 'references/approved', m[2]!)]
      const p = candidates.find((c) => existsSync(c))
      if (!p) bad.push('missing ' + m[2])
      else if (createHash('sha256').update(readFileSync(p)).digest('hex') !== m[1]) bad.push('changed ' + m[2])
    }
    const text = spawnSync('git', ['grep', '-I', '-l', '-E', '(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16})'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
    if (text) bad.push('secret pattern in ' + text.split('\n').join(', '))
    return { id: 'G12', pass: bad.length === 0, note: bad.length === 0 ? files.length + ' tracked files, ' + (total / 1e9).toFixed(2) + ' GB' : bad.slice(0, 8).join('; ') }
  },
  G14: () => {
    const caps = JSON.parse(readFileSync(join(ROOT, 'config/webgl-caps.json'), 'utf8')) as { limits: Record<string, number>; extensions: string[] }
    const bad: string[] = []
    for (const f of [cfg.formatKeys.master, cfg.formatKeys.preview]) {
      const n = needs('full', f)
      for (const e of n.extensions) if (!caps.extensions.includes(e)) bad.push(e)
      for (const [k, v] of Object.entries(n.limits)) if ((caps.limits[k] ?? 0) < v) bad.push(k + ' needs ' + v)
    }
    const src = run('git', ['grep', '-h', '-o', '-E', "getExtension\\('[A-Za-z0-9_]+'\\)", '--', 'src'])
    const used = new Set((src.out.match(/'([A-Za-z0-9_]+)'/g) ?? []).map((x) => x.slice(1, -1)))
    for (const e of used) if (!caps.extensions.includes(e)) bad.push('source asks for ' + e)
    const uhd = needs('full', cfg.formatKeys.uhd)
    const uhdOk = Object.entries(uhd.limits).every(([k, v]) => (caps.limits[k] ?? 0) >= v)
    return { id: 'G14', pass: bad.length === 0, note: bad.length === 0 ? 'needs are inside the recorded set' + (uhdOk ? '' : ' (uhd is outside it here and is not gated)') : bad.join('; ') }
  },
  G16: () => {
    const p = probe(join(ROOT, 'out/roughcut.mp4'))
    const f = cfg.formats[cfg.formatKeys.preview]!
    const pass = !!p && p.frames === cfg.frameCount && p.width === f.width && p.height === f.height
    return { id: 'G16', pass, note: p ? p.frames + ' frames ' + p.width + 'x' + p.height + ' ' + p.fps : 'out/roughcut.mp4 missing' }
  },
}

const machine = ['G1', 'G2', 'G3', 'G4', 'G6', 'G7', 'G10', 'G11', 'G12', 'G14', 'G15']
const byPhase: Record<number, string[]> = {
  0: ['G1', 'G2', 'G3', 'G4', 'G14'],
  1: ['G1', 'G2', 'G12', 'G16'],
  2: [...machine, 'G8', 'G9'],
  3: machine,
  4: machine,
  5: [...machine, 'G8'],
  6: [...machine, 'G8', 'G9', 'G16'],
}
const list = only ?? byPhase[phase] ?? Object.keys(checks)
for (const id of list) {
  const fn = checks[id]
  if (!fn) {
    results.push({ id, pass: false, note: 'check not built yet' })
    continue
  }
  try {
    results.push(await fn())
  } catch (e) {
    results.push({ id, pass: false, note: String(e).slice(0, 400) })
  }
  const r = results[results.length - 1]!
  console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.note)
}
mkdirSync(join(WORK, 'gate'), { recursive: true })
writeFileSync(join(WORK, 'gate', 'phase-' + phase + '.json'), JSON.stringify(results, null, 1))
process.exit(results.every((r) => r.pass) ? 0 : 1)
