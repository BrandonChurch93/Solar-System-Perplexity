// How far a cell's middle travels against how much its ground changes, read from the table of the life alone (no
// picture): for every cell alive over one second of film (frames 60 to 90, 75 to 105, 90 to 120), the way of its
// middle in that second as a share of its own radius, and the change of its radius as a share of it; the same for the cells with a radius over 0.05 stage units.
// The middle is where the cell's crown and pattern hang: the centroid of its ground moved toward its site by
// dome.anchor of lab.json, as in the ground.
//   npx tsx assets-src/sun/lab/slide.ts
import { EDGES, SLOTS, TILE, cellsAt, newCells } from '../../../src/stops/sun/lab/sim'
import lab from '../../../src/stops/sun/lab/lab.json'

const an = (lab.dome as { anchor?: number[] }).anchor ?? [0, 0.5]
const wrap = (v: number): number => (v > TILE / 2 ? v - TILE : v < -TILE / 2 ? v + TILE : v)
const middle = (c: ReturnType<typeof newCells>, i: number): [number, number] => {
  const d = c.diagram
  let sx = wrap(c.x[i]! - d.mid[i * 2]!) * an[0]!
  let sy = wrap(c.y[i]! - d.mid[i * 2 + 1]!) * an[0]!
  let most = 0
  for (let e = 0; e < d.count[i]!; e++) most = Math.max(most, sx * d.edges[(i * EDGES + e) * 2]! + sy * d.edges[(i * EDGES + e) * 2 + 1]!)
  if (most > an[1]!) { sx *= an[1]! / most; sy *= an[1]! / most }
  return [d.mid[i * 2]! + sx, d.mid[i * 2 + 1]! + sy]
}

const a = newCells()
const b = newCells()
const ways: number[] = []
const grows: number[] = []
const bigWays: number[] = []
const bigGrows: number[] = []
for (const f0 of [60, 75, 90]) {
  cellsAt(f0 / 30, a)
  const am = new Float64Array(SLOTS * 2)
  for (let i = 0; i < SLOTS; i++) if (a.diagram.on[i]) { const m = middle(a, i); am[i * 2] = m[0]; am[i * 2 + 1] = m[1] }
  const ao = Uint8Array.from(a.diagram.on)
  const aa = Float32Array.from(a.diagram.area)
  const on = Uint8Array.from(a.live)
  const seed = Float32Array.from(a.seed)
  cellsAt((f0 + 30) / 30, b)
  for (let i = 0; i < SLOTS; i++) {
    if (!on[i] || !b.live[i] || !ao[i] || !b.diagram.on[i] || seed[i] !== b.seed[i] || aa[i]! <= 1e-5 || b.diagram.area[i]! <= 1e-5) continue
    const m = middle(b, i)
    const dx = wrap(m[0] - am[i * 2]!)
    const dy = wrap(m[1] - am[i * 2 + 1]!)
    const r0 = Math.sqrt(aa[i]! / Math.PI)
    const r1 = Math.sqrt(b.diagram.area[i]! / Math.PI)
    ways.push(Math.hypot(dx, dy) / r0)
    grows.push(Math.abs(r1 - r0) / r0)
    if (r0 > 0.05) {
      bigWays.push(Math.hypot(dx, dy) / r0)
      bigGrows.push(Math.abs(r1 - r0) / r0)
    }
  }
}
const q = (v: number[], p: number) => [...v].sort((x, y) => x - y)[Math.floor(p * (v.length - 1))]!.toFixed(3)
console.log(`cells over 0.05 wide ${bigWays.length} | way: median ${q(bigWays, 0.5)} 90th ${q(bigWays, 0.9)} largest ${q(bigWays, 1)} | change of the radius: median ${q(bigGrows, 0.5)} 90th ${q(bigGrows, 0.9)} largest ${q(bigGrows, 1)}`)
console.log(`cells ${ways.length} | way of the middle in 1 s, share of the radius: median ${q(ways, 0.5)} 90th ${q(ways, 0.9)} largest ${q(ways, 1)} | change of the radius in 1 s: median ${q(grows, 0.5)} 90th ${q(grows, 0.9)} largest ${q(grows, 1)}`)
