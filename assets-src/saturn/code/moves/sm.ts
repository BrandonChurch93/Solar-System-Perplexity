import { readFileSync } from 'node:fs'
import { loadConfig } from '../../../../tools/lib/common'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import { MIN_POINTS, curves, ringPlane, sampleWindow, type Kind } from '../../../../tools/smooth/camera'
import { judgeCurve } from '../../../../tools/smooth/path'
import skimJson from '../../../../src/stops/saturn/skim.json'
import { plan, params } from '../../../../src/stops/saturn/plan'

// AT: the share of the rise at which the engine changes the view, tried here before skim.json is touched
if (process.env.AT) (params as any).handover.rise.at = Number(process.env.AT)
if (process.env.ATDIVE) (params as any).handover.dive.at = Number(process.env.ATDIVE)
const cfg = loadConfig()
const S = cfg.raw.smooth
const master = cfg.formats[cfg.formatKeys.master]!
let film = new FilmDirector(plans)
// the film lays the way out of a stop from the rise's own end (its carried speed), so a change of the paces needs a new film
export function fresh(): void { film = new FilmDirector(plans) }
const ground = ringPlane(plan as any)
const UNITS: [string, string, number | null][] = [['fall', 'rate', null], ['turn', 'turn', S.path.floors.turnDeg], ['speed', 'speed', S.path.floors.speedPx]]

export function setParam(path: string, value: number): void {
  const keys = path.split('.')
  let o: any = (skimJson as any).handover
  for (const k of keys.slice(0, -1)) o = o[k]
  o[keys[keys.length - 1]!] = value
  ;(plan as any).diveLaw = null
  ;(plan as any).riseLaw = null
  fresh()
}

// START holds a JSON text {measure: {peak, round}} or the name of a file with it: the paces of the move to begin from
export function loadStart(kind: Kind): void {
  const t = process.env.START
  if (!t) return
  const text = t.trim().startsWith('{') ? t : readFileSync(t, 'utf8')
  const o = JSON.parse(text)
  const h: any = (skimJson as any).handover[kind]
  for (const m of Object.keys(o)) { h[m].peak = o[m].peak; h[m].round = o[m].round }
  ;(plan as any).diveLaw = null
  ;(plan as any).riseLaw = null
  fresh()
}

export function judge(kind: Kind, rates = [1, 2]) {
  const out: any[] = []
  for (const r of rates) {
    const w = sampleWindow(cfg, film, plan, kind, r, S.reachFrames)!
    const c: any = curves(w, plan as any, master.width, master.height, S.path.ringPx, 'picture', 8, ground)
    for (const [key, name, floor] of UNITS) out.push({ r, w, res: judgeCurve(name, '', c[key], w.k0, r, w.own, S.path, floor, key === 'speed' ? { values: c.ring, min: MIN_POINTS } : null) })
  }
  return out
}

export function cost(kind: Kind, rates = [1, 2]): { cost: number; parts: string } {
  let worst = 0
  const parts: string[] = []
  for (const { r, w, res } of judge(kind, rates)) {
    let ws = 0
    for (let i = 0; i < res.step.length; i++) { const k = w.k0 + i; const v = res.step[i]; if (v !== null && k - r >= w.own.first - 1 - 2 * r && k <= w.own.end + 2 * r && v > ws) ws = v }
    const s = ws / S.path.maxStep
    const f = res.fallBeforePeak.value / S.path.maxRebound
    const c = res.climbAfterPeak.value / S.path.maxRebound
    const m = res.mean > 0 ? Math.max(s, f, c) : 99
    worst = Math.max(worst, m)
    parts.push(res.name + '@' + r + ' step ' + (res.worstStep?.value ?? 9).toFixed(3) + ' f' + Math.floor((res.worstStep?.k ?? 0) / r) + ' pk ' + (res.peak?.value ?? 0).toFixed(2) + ' f' + (res.peak?.frame ?? 0) + ' fall ' + res.fallBeforePeak.value.toFixed(3) + ' climb ' + res.climbAfterPeak.value.toFixed(3) + ' mean ' + res.mean.toPrecision(4))
  }
  return { cost: worst, parts: parts.join('\n  ') }
}

if (process.argv[1]!.endsWith('sm.ts')) {
  const kind = (process.argv[2] ?? 'dive') as Kind
  loadStart(kind)
  let rows = false
  for (const a of process.argv.slice(3)) {
    if (a === 'rows') { rows = true; continue }
    const [k, v] = a.split('=')
    setParam(k!, Number(v))
  }
  const c = cost(kind)
  console.log(kind, 'cost', c.cost.toFixed(3), '\n  ' + c.parts)
  if (rows) {
    const j = judge(kind, [1])
    const w = j[0].w
    const lead = w.firstFrame - w.k0
    for (let i = 0; i < w.frames; i++) {
      const f = w.firstFrame + i
      console.log(f, j.map((x: any) => (x.res.over[i + lead] ?? NaN).toFixed(3) + ' (' + (x.res.step[i + lead] ?? NaN).toFixed(3) + ')').join('  '))
    }
  }
}
