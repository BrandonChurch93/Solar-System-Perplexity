// opt7.ts dive|rise GENERATIONS SEED: a search for the paces of a move with a soft largest value (so every step near the limit
// pulls, not only the worst) and a diagonal evolution strategy. START (file or JSON) gives the paces to begin from; FLAT names the
// measures that get two shares (level topped). It writes nothing: the best paces are printed as JSON.
import { judge, loadStart, fresh } from './sm'
import { e3, maxRate, earlyLimit } from './e3'
import { loadConfig } from '../../../../tools/lib/common'
import skimJson from '../../../../src/stops/saturn/skim.json'
import { plan } from '../../../../src/stops/saturn/plan'
const cfg = loadConfig()
const S = cfg.raw.smooth
const kind = (process.argv[2] ?? 'rise') as 'dive' | 'rise'
const gens = Number(process.argv[3] ?? 200)
const seed0 = Number(process.argv[4] ?? 1)
const measures = ['reach', 'climb', 'round', 'view']
const flat = (process.env.FLAT ?? 'reach,climb,round,view').split(',')
loadStart(kind)
const h: any = (skimJson as any).handover[kind]
const names: string[] = []
let x: number[] = []
const shape: Record<string, 'flat' | 'peak'> = {}
for (const m of measures) {
  const pk = h[m].peak
  const r = h[m].round
  const isFlat = Array.isArray(pk) || flat.includes(m)
  shape[m] = isFlat ? 'flat' : 'peak'
  if (isFlat) {
    names.push(m + '.a', m + '.w', m + '.r0', m + '.ra', m + '.rb', m + '.r3')
    if (Array.isArray(pk)) { const t = typeof r === 'number' ? [r, r, r, r] : r; x.push(pk[0], pk[1] - pk[0], t[0], t[1], t[2], t[3]) }
    else { const t = typeof r === 'number' ? [r, r, r] : r; x.push(pk, 0, t[0], t[1], t[1], t[2]) }
  } else {
    names.push(m + '.peak', m + '.r0', m + '.rt', m + '.r1')
    const t = typeof r === 'number' ? [r, r, r] : r
    x.push(pk, t[0], t[1], t[2])
  }
}
const LOW = Number(process.env.LOW ?? 0.03)
const E3M = Number(process.env.E3M ?? 0.97)
const isShare = (n: string): boolean => n.endsWith('.a') || n.endsWith('.peak')
const lo = names.map((n) => (isShare(n) ? 0.08 : n.endsWith('.w') ? 0 : LOW))
const hi = names.map((n) => (isShare(n) ? 0.85 : n.endsWith(".w") ? 0.8 : Number(process.env.HI ?? 0.4)))
let s = seed0 * 7919 + 13
const rnd = (): number => { s = (s * 1103515245 + 12345) % 2147483648; return (s + 0.5) / 2147483648 }
const gauss = (): number => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd())
const r3 = (q: number): number => Number(q.toFixed(3))
const clamp = (v: number[]): number[] => v.map((q, i) => Math.min(hi[i]!, Math.max(lo[i]!, q)))
const apply = (v: number[]): void => {
  let i = 0
  for (const m of measures) {
    if (shape[m] === 'flat') {
      const a = v[i]!
      const b = Math.min(a + v[i + 1]!, 0.95)
      h[m].peak = [r3(a), r3(b)]
      h[m].round = [v[i + 2]!, v[i + 3]!, v[i + 4]!, v[i + 5]!].map(r3)
      i += 6
    } else {
      h[m].peak = r3(v[i]!)
      h[m].round = [v[i + 1]!, v[i + 2]!, v[i + 3]!].map(r3)
      i += 4
    }
  }
  ;(plan as any).diveLaw = null
  ;(plan as any).riseLaw = null
  fresh()
}
const LAMBDA = Number(process.env.LAMBDA ?? 0.05)
let BETA = Number(process.env.BETA ?? 40)
const evalAt = (v: number[]): { soft: number; hard: number; text: string } => {
  try { return evalRaw(v) } catch (err) { return { soft: 50, hard: 50, text: 'refused: ' + String(err).slice(0, 90) } }
}
const evalRaw = (v: number[]): { soft: number; hard: number; text: string } => {
  apply(v)
  const ratios: number[] = []
  let hard = 0
  let rough = 1
  const t: string[] = []
  for (const { r, w, res } of judge(kind, [1, 2])) {
    let ws = 0
    for (let i = 0; i < res.step.length; i++) {
      const k = w.k0 + i
      const q = res.step[i]
      if (q !== null && q !== undefined && k - r >= w.own.first - 1 - 2 * r && k <= w.own.end + 2 * r) { ratios.push(q / S.path.maxStep); if (q > ws) ws = q }
    }
    if (process.env.MEANCAP && res.name === 'speed' && res.mean > Number(process.env.MEANCAP)) { const q = 1 + (res.mean / Number(process.env.MEANCAP) - 1); ratios.push(q); hard = Math.max(hard, q) }
    if (res.name === 'speed' && r === 1) t.push('speed mean ' + res.mean.toFixed(2))
    const f = res.fallBeforePeak.value / S.path.maxRebound
    const c = res.climbAfterPeak.value / S.path.maxRebound
    ratios.push(f, c)
    const m = res.mean > 0 ? Math.max(ws / S.path.maxStep, f, c) : 99
    hard = Math.max(hard, m)
    t.push(res.name + '@' + r + ' ' + ws.toFixed(3) + ' ' + res.fallBeforePeak.value.toFixed(3) + ' ' + res.climbAfterPeak.value.toFixed(3))
    if (r === 1) {
      const o: number[] = []
      for (let k = w.own.first - 1; k <= w.own.end; k++) { const q = res.over[k - w.k0]; if (q !== null && q !== undefined) o.push(q) }
      let up = 0, down = 0, sum = 0
      for (let i = 1; i < o.length; i++) { const d = o[i]! - o[i - 1]!; up = Math.max(up, d); down = Math.max(down, -d); if (i > 1) sum += Math.abs(d - (o[i - 1]! - o[i - 2]!)) }
      rough = Math.max(rough, sum / (2 * (up + down)))
    }
  }
  const e = e3(kind)
  const er = e.fastest / (maxRate * E3M)
  ratios.push(er)
  hard = Math.max(hard, er)
  if (kind === 'dive') { const q = (earlyLimit / E3M) / Math.max(e.early, 1e-6); ratios.push(q); hard = Math.max(hard, q) }
  if (e.back > 0) { ratios.push(2); hard = Math.max(hard, 2) }
  // the sky's proof (plan.ts skyProof): the rise stays sky.hero.reach from the path of the hold and is under the lower of
  // sky.lift.heights at its change of view
  {
    const P: any = plan
    const fps = cfg.fps
    const seg = P.seg.rise
    let near = Infinity
    for (let k = 0; k <= 150; k++) near = Math.min(near, P.fromHold(P.flight(seg.start + ((seg.end - seg.start) * k) / 150).position))
    const need = (skimJson as any).sky.hero.reach + (skimJson as any).sky.hero.slack + Number(process.env.SKYM ?? 0.02)
    const q = near < need ? 1 + (need - near) * 6 : near / need - 0.2 > 1 ? 0 : 0
    if (near < need) { ratios.push(q); hard = Math.max(hard, q) }
    let ok = true
    try { P.skyProof() } catch { ok = false }
    if (!ok && near >= need) { ratios.push(1.5); hard = Math.max(hard, 1.5) }
    t.push('hold ' + near.toFixed(3) + (ok ? '' : ' PROOF FAILS'))
    void fps
  }
  let sum = 0
  for (const q of ratios) sum += Math.exp(BETA * (q - hard))
  const soft = hard + Math.log(sum) / BETA + LAMBDA * (rough - 1)
  return { soft, hard, text: t.join(' | ') + ' | e3 ' + e.fastest.toFixed(3) + ' rough ' + rough.toFixed(2) }
}
const n = x.length
let mean = clamp(x)
let sigma = Number(process.env.SIGMA ?? 0.03)
let D = names.map(() => 1)
const lam = Number(process.env.POP ?? 14)
const mu = Math.floor(lam / 2)
const wts = Array.from({ length: mu }, (_, i) => Math.log(mu + 0.5) - Math.log(i + 1))
const wsum = wts.reduce((a, b) => a + b, 0)
for (let i = 0; i < mu; i++) wts[i]! /= wsum
const mueff = 1 / wts.reduce((a, b) => a + b * b, 0)
const cs = (mueff + 2) / (n + mueff + 5)
const ds = 1 + cs + 2 * Math.max(0, Math.sqrt((mueff - 1) / (n + 1)) - 1)
const ccov = Math.min(1, (2 / ((n + 1.3) ** 2 + mueff)) * (n + 2) / 3 + 0.15)
const chiN = Math.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n))
let ps = names.map(() => 0)
let best = { ...evalAt(mean), v: mean.slice() }
let bestHard = { ...best }
console.log('start soft', best.soft.toFixed(3), 'hard', best.hard.toFixed(3), best.text)
for (let g = 0; g < gens; g++) {
  if (g > 0 && g % Number(process.env.STAGE ?? 80) === 0) { BETA = Math.min(BETA * 1.6, 400); best = { ...evalAt(best.v), v: best.v } }
  const pop: { z: number[]; v: number[]; soft: number; hard: number; text: string }[] = []
  for (let k = 0; k < lam; k++) {
    const z = names.map(() => gauss())
    const v = clamp(mean.map((m, i) => m + sigma * D[i]! * z[i]!))
    const zz = v.map((q, i) => (q - mean[i]!) / (sigma * D[i]!))
    const e = evalAt(v)
    pop.push({ z: zz, v, ...e })
    if (e.soft < best.soft) best = { ...e, v }
    if (e.hard < bestHard.hard) { bestHard = { ...e, v }; if (process.env.TRACE) console.log(g, 'hard', e.hard.toFixed(3), 'soft', e.soft.toFixed(3), e.text) }
  }
  pop.sort((a, b) => a.soft - b.soft)
  const zm = names.map((_, i) => pop.slice(0, mu).reduce((a, p, j) => a + wts[j]! * p.z[i]!, 0))
  mean = clamp(mean.map((m, i) => m + sigma * D[i]! * zm[i]!))
  ps = ps.map((p, i) => (1 - cs) * p + Math.sqrt(cs * (2 - cs) * mueff) * zm[i]!)
  const pn = Math.sqrt(ps.reduce((a, b) => a + b * b, 0))
  sigma = Math.min(0.08, Math.max(0.0008, sigma * Math.exp((cs / ds) * (pn / chiN - 1))))
  D = D.map((d, i) => { const v2 = pop.slice(0, mu).reduce((a, p, j) => a + wts[j]! * p.z[i]! * p.z[i]!, 0); return Math.min(4, Math.max(0.25, d * Math.sqrt(1 - ccov + ccov * v2))) })
  if (g % 20 === 19) console.log('gen', g + 1, 'sigma', sigma.toFixed(4), 'beta', BETA.toFixed(0), 'best hard', bestHard.hard.toFixed(3), 'best soft', best.soft.toFixed(3))
}
for (const [tag, b] of [['soft', best], ['hard', bestHard]] as const) {
  const e = evalAt(b.v)
  console.log('final by', tag, 'hard', e.hard.toFixed(3), 'soft', e.soft.toFixed(3), e.text)
  console.log(JSON.stringify(Object.fromEntries(measures.map((m) => [m, { peak: h[m].peak, round: h[m].round }]))))
}
