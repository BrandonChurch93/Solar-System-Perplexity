import { config } from '../config'
import type { Engine } from '../core/engine'
import { DIAG_VIEWS } from '../diagnostics/diag'
import css from './menu.module.css'
import type { LiveHandle, Loading } from './modes'
import { segmentAtFrame } from './timeline'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

export function mountLoading(root: HTMLElement): Loading {
  const node = el('div', css.loading, 'Loading')
  root.appendChild(node)
  return { show: (on) => node.classList.toggle(css.on!, on) }
}

function timecode(frame: number): string {
  const s = Math.floor(frame / config.fps)
  const f = frame % config.fps
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + ':' + String(f).padStart(2, '0')
}

function link(mode: string): string {
  const p = new URLSearchParams(location.search)
  p.set('mode', mode)
  for (const k of ['frame', 'first', 'last', 'diag']) p.delete(k)
  return '?' + p.toString()
}

export function mountMenu(root: HTMLElement, engine: Engine, live: LiveHandle): void {
  const menu = el('aside', css.menu)
  const hint = el('button', css.hint, 'M  Menu')
  root.append(menu, hint)
  const toggle = (): void => {
    menu.classList.toggle(css.open!)
  }
  hint.addEventListener('click', toggle)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') toggle()
  })

  menu.append(el('h1', css.title, config.raw.name as string), el('p', css.sub, 'Drag to look around. Scroll to move in and out.'))

  menu.appendChild(el('div', css.label, 'Stop'))
  const stops = el('div', css.grid)
  const stopButtons = new Map<string, HTMLButtonElement>()
  for (const s of config.raw.stops as { id: string; name: string }[]) {
    const b = el('button', css.button, s.name)
    b.addEventListener('click', () => live.goStop(s.id, live.state.control.view))
    stopButtons.set(s.id, b)
    stops.appendChild(b)
  }
  menu.appendChild(stops)

  menu.appendChild(el('div', css.label, 'View'))
  const views = el('div', css.pair)
  const orbit = el('button', css.button, 'Orbit')
  const terrain = el('button', css.button, 'Terrain')
  orbit.addEventListener('click', () => live.goStop(live.state.control.stop, 'orbit'))
  terrain.addEventListener('click', () => live.goStop(live.state.control.stop, 'terrain'))
  views.append(orbit, terrain)
  menu.appendChild(views)

  menu.appendChild(el('div', css.label, 'Timeline'))
  const range = el('input', css.range)
  range.type = 'range'
  range.min = '0'
  range.max = String(config.frameCount - 1)
  range.step = '1'
  range.value = String(live.state.frame)
  const readout = el('div', css.readout)
  range.addEventListener('input', () => live.goFrame(Number(range.value)))
  menu.append(range, readout)

  menu.appendChild(el('div', css.label, 'Mode'))
  const modes = el('div', css.grid)
  for (const [id, name] of [['live', 'Live'], ['autopilot', 'Autopilot'], ['export', 'Export']] as const) {
    const a = el('a', css.button + (id === 'live' ? ' ' + css.active : ''), name)
    a.href = link(id)
    modes.appendChild(a)
  }
  menu.appendChild(modes)

  menu.appendChild(el('div', css.label, 'Picture'))
  const row = (name: string, options: { value: string; label: string }[], current: string, pick: (v: string) => void): void => {
    const r = el('label', css.row)
    r.appendChild(el('span', undefined, name))
    const s = el('select', css.select)
    for (const o of options) {
      const opt = el('option', undefined, o.label)
      opt.value = o.value
      if (o.value === current) opt.selected = true
      s.appendChild(opt)
    }
    s.addEventListener('change', () => pick(s.value))
    r.appendChild(s)
    menu.appendChild(r)
  }
  row('Format', Object.values(config.formats).map((f) => ({ value: f.id, label: f.width + ' x ' + f.height })), engine.format.id, (v) => {
    engine.setFormat(v)
    live.refresh()
  })
  row('Tier', Object.keys(config.tiers).map((t) => ({ value: t, label: t })), live.state.tier, (v) => {
    live.state.tier = v
    if (live.state.kind === 'frame') live.goFrame(live.state.frame)
  })
  row('Asset set', Object.keys(config.assetSets).map((t) => ({ value: t, label: t })), engine.assets, (v) => {
    engine.setAssets(v)
    live.refresh()
  })
  row('Diagnostic', DIAG_VIEWS.map((t) => ({ value: t, label: t })), engine.diag, (v) => {
    engine.diag = v
    if (live.state.kind === 'frame') live.goFrame(live.state.frame)
  })
  menu.appendChild(el('p', css.note, 'Tier applies to frames picked on the timeline. Free flight always draws one sample per frame.'))

  const sync = (): void => {
    const free = live.state.kind === 'free'
    for (const [id, b] of stopButtons) b.classList.toggle(css.active!, free && id === live.state.control.stop)
    orbit.classList.toggle(css.active!, free && live.state.control.view === 'orbit')
    terrain.classList.toggle(css.active!, free && live.state.control.view === 'terrain')
    const f = live.state.frame
    readout.textContent = free ? 'Free flight' : timecode(f) + '  frame ' + f + '  ' + segmentAtFrame(f).id
  }
  live.onChange = sync
  sync()
}
