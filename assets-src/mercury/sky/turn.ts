import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { handoverOf, skyTurnWeight } from '../../../src/director/handover'
import { Plan } from '../../../src/stops/mercury/plan'

const KNOTS = Number(process.argv[2] ?? 49)
const plan = new Plan()
const fps = config.fps
const height = (kind: 'dive' | 'rise', t: number): number => plan.path(kind, t).position.length() - 1
const at = (s: number[], x: number): number => {
  const n = s.length
  const k = Math.min(Math.max(x, 0), 1) * (n - 1)
  const i = Math.min(Math.floor(k), n - 2)
  const f = k - i
  const p0 = s[Math.max(i - 1, 0)]!
  const p1 = s[i]!
  const p2 = s[i + 1]!
  const p3 = s[Math.min(i + 2, n - 1)]!
  return Math.min(Math.max(0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f), 0), 1)
}
const out: Record<string, { from: number; to: number; shares: number[] }> = {}
for (const kind of ['dive', 'rise'] as const) {
  const seg = config.segments.find((x) => x.stop === 'mercury' && x.kind === kind)!
  const h = handoverOf('mercury', kind)!
  const high = kind === 'dive' ? seg.start : seg.end
  const low = kind === 'dive' ? h.firstFrame / fps : (h.lastFrame + 1) / fps
  const from = Math.log(height(kind, low))
  const to = Math.log(height(kind, high))
  const shares: number[] = []
  for (let i = 0; i < KNOTS; i++) {
    const want = from + ((to - from) * i) / (KNOTS - 1)
    let a = low
    let b = high
    for (let n = 0; n < 60; n++) {
      const m = (a + b) / 2
      if (Math.log(height(kind, m)) < want) a = m
      else b = m
    }
    shares.push(Number(skyTurnWeight(seg, (a + b) / 2).toFixed(6)))
  }
  shares[0] = 1
  shares[KNOTS - 1] = 0
  let worst = 0
  let where = 0
  let back = 0
  const steps = Math.round(Math.abs(high - low) * fps * 8)
  let last = -1
  for (let i = 0; i <= steps; i++) {
    const t = low + ((high - low) * i) / steps
    const got = at(shares, (Math.log(height(kind, t)) - from) / (to - from))
    const d = Math.abs(got - skyTurnWeight(seg, t))
    if (d > worst) {
      worst = d
      where = t * fps
    }
    if (last >= 0) back = Math.max(back, got - last)
    last = got
  }
  console.log(kind, 'heights', Math.exp(from).toFixed(5), 'to', Math.exp(to).toFixed(5), 'knots', KNOTS, 'worst difference from the course by the clock', worst.toFixed(5), 'at frame', where.toFixed(2), 'largest step back', back.toFixed(6))
  out[kind] = { from: Number(from.toFixed(6)), to: Number(to.toFixed(6)), shares }
}
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(out) + '\n')
