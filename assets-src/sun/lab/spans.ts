// How fast a cell comes and goes, read from the table of the life alone (no picture): for every cell that is born or
// ends in the terrain segment, the film frames it takes from half of its largest ground to nothing (and from
// nothing to half), and the largest share of its largest ground that it loses or gains in 8 film frames.
//   npx tsx assets-src/sun/lab/spans.ts
import { SLOTS, cellsAt, newCells } from '../../../src/stops/sun/lab/sim'

const fps = 30
const frames = 180
const c = newCells()
const area = new Float32Array(frames * SLOTS)
const seed = new Float32Array(frames * SLOTS)
for (let f = 0; f < frames; f++) {
  cellsAt(f / fps, c)
  for (let i = 0; i < SLOTS; i++) {
    area[f * SLOTS + i] = c.live[i] && c.diagram.on[i] ? c.diagram.area[i]! : 0
    seed[f * SLOTS + i] = c.live[i] ? c.seed[i]! : 0
  }
}
const ends: number[] = []
const starts: number[] = []
const loss: number[] = []
const gain: number[] = []
const bigEnds: number[] = []
const bigLoss: number[] = []
const lives: number[] = []
for (let i = 0; i < SLOTS; i++) {
  let f = 0
  while (f < frames) {
    const s = seed[f * SLOTS + i]!
    let g = f
    while (g < frames && seed[g * SLOTS + i] === s) g++
    if (s !== 0) {
      let most = 0
      for (let k = f; k < g; k++) most = Math.max(most, area[k * SLOTS + i]!)
      if (most > 0) {
        const r = Math.sqrt(most / Math.PI)
        let first = f
        while (first < g && area[first * SLOTS + i] === 0) first++
        let last = g - 1
        while (last >= f && area[last * SLOTS + i] === 0) last--
        const whole = f > 0 && g < frames
        if (whole) lives.push(last - first + 1)
        if (g < frames || last < g - 1) {
          let k = last
          while (k >= f && area[k * SLOTS + i]! < 0.5 * most) k--
          if (k >= f) {
            ends.push(last + 1 - k)
            if (r > 0.06) bigEnds.push(last + 1 - k)
          }
          let worst = 0
          for (let q = f; q + 8 <= Math.min(last + 1, frames - 1); q++) worst = Math.max(worst, (area[q * SLOTS + i]! - area[(q + 8) * SLOTS + i]!) / most)
          loss.push(worst)
          if (r > 0.06) bigLoss.push(worst)
        }
        if (f > 0) {
          let k = first
          while (k < g && area[k * SLOTS + i]! < 0.5 * most) k++
          if (k < g) starts.push(k - first + 1)
          let worst = 0
          for (let q = Math.max(first - 1, 0); q + 8 < g; q++) worst = Math.max(worst, (area[(q + 8) * SLOTS + i]! - area[q * SLOTS + i]!) / most)
          gain.push(worst)
        }
      }
    }
    f = g
  }
}
const pct = (v: number[], ps: number[]): string => {
  const s = [...v].sort((a, b) => a - b)
  return ps.map((p) => s[Math.min(Math.floor((p / 100) * s.length), s.length - 1)]!.toFixed(2)).join(' ')
}
const ps = [0, 1, 5, 25, 50, 75, 95, 100]
console.log('percentiles 0 1 5 25 50 75 95 100')
console.log('film frames from half of the largest ground to nothing, ' + ends.length + ' ends: ' + pct(ends, ps))
console.log('the same for cells over 0.06 units of radius, ' + bigEnds.length + ': ' + pct(bigEnds, ps))
console.log('film frames from nothing to half of the largest ground, ' + starts.length + ' births: ' + pct(starts, ps))
console.log('largest share of the largest ground lost in 8 film frames: ' + pct(loss, ps))
console.log('the same for cells over 0.06 units of radius: ' + pct(bigLoss, ps))
console.log('largest share of the largest ground gained in 8 film frames: ' + pct(gain, ps))
console.log('film frames a cell is seen, ' + lives.length + ' whole lives in the segment: ' + pct(lives, ps))
