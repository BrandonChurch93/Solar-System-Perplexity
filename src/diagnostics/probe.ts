import type { ViewKind } from '../core/types'
import { forceSide } from '../director/handover'

// dump: the place picture itself, one frame sized window of it at a time and one picture pixel per frame pixel, for tools that lay it back onto the
// body. x and y are the window's top left corner in picture pixels. 'image' is the picture's scene value through the film curve (no sky, no lens,
// no exposure, no grade), 'alpha' its cover. Use it with the ungraded view, which writes the values through the display curve alone: a plate made
// from it and read back through the inverse film curve is the scene value again.
export interface PlaceDump { x: number; y: number; what: 'image' | 'alpha' }

export interface Probe { view: string; side: ViewKind | null; shut: boolean; time: number | null; place: boolean; mask: boolean; picture: boolean; dump?: PlaceDump }

export function parseProbe(diag: string): Probe {
  const parts = diag.split('/').map((s) => s.trim()).filter((s) => s.length > 0)
  const out: Probe = { view: parts[0] ?? 'beauty', side: null, shut: false, time: null, place: true, mask: false, picture: false }
  for (const part of parts.slice(1)) {
    const [key, value] = part.split('=')
    if (key === 'side' && (value === 'orbit' || value === 'terrain')) out.side = value
    else if (key === 'shut') out.shut = true
    else if (key === 't' && value !== undefined && Number.isFinite(Number(value))) {
      out.time = Number(value)
      out.shut = true
    } else if (key === 'noplace') out.place = false
    else if (key === 'mask') out.mask = true
    else if (key === 'picture') out.picture = true
    else if (key === 'dump' && value !== undefined) {
      const [x, y, what] = value.split(',')
      if (!Number.isInteger(Number(x)) || !Number.isInteger(Number(y)) || (what !== 'image' && what !== 'alpha')) throw new Error('unknown diagnostic option ' + part)
      out.picture = true
      out.dump = { x: Number(x), y: Number(y), what }
    } else throw new Error('unknown diagnostic option ' + part)
  }
  return out
}

export function applyProbe(p: Probe | null): void {
  forceSide(p ? p.side : null)
}

export function probeString(p: Partial<Probe>): string {
  const parts = [p.view ?? 'beauty']
  if (p.side) parts.push('side=' + p.side)
  if (p.time !== null && p.time !== undefined) parts.push('t=' + p.time)
  else if (p.shut) parts.push('shut')
  if (p.place === false) parts.push('noplace')
  if (p.mask) parts.push('mask')
  if (p.dump) parts.push('dump=' + p.dump.x + ',' + p.dump.y + ',' + p.dump.what)
  else if (p.picture) parts.push('picture')
  return parts.join('/')
}
