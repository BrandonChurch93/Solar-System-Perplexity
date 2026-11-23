import type { ViewKind } from '../core/types'
import { forceSide } from '../director/handover'

export interface Probe { view: string; side: ViewKind | null; shut: boolean; time: number | null; place: boolean; mask: boolean; picture: boolean }

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
    else throw new Error('unknown diagnostic option ' + part)
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
  if (p.picture) parts.push('picture')
  return parts.join('/')
}
