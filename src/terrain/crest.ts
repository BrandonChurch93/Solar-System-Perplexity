// The crests of a relief. A relief is a painting laid on a mesh by a map of the distances from the painting's eye. Where the ground
// steps (a crest in front of the ground behind it) the map holds no edge: it holds the step as a ramp a few texels wide, and the mesh
// draws that ramp as a wall between the two sides. When the eye leaves the painting's own place the two sides move apart or over one
// another and the wall is drawn out with the painting's texels on it. What is here finds the ramps and says, for every texel of a
// ramp and of a band around it, how far the near side is and how far the far side is, how much of the texel belongs to the near side
// and where the far side's ground lies that stands for what the near side hides. The relief (src/terrain/relief.ts) draws the cells
// of a ramp twice from it, as a sheet of the near side and a sheet of the far side, each rigid with its own side.
// Everything is by place in the map; nothing reads a clock or an eye.

// step: the least step of the inverse distance (1 over the relief's unit) that makes a ramp: what the two ends of the ramp differ
// by, beyond what ground as even as its two sides does anyway over the way between them. An end is the first ground along the way
// across the step where the inverse distance does no more across one cell of the layer's mesh, to within the same number, than it
// goes on doing further out: what a side does anyway is its own, and a steady slope is as even as a plain. walk: how far a ramp may
// reach from one of its texels to either end, in texels of the map; a slope that is wider is no step and stays as it is. A second
// step within a cell of the first is one ramp with it, and the ground between them is no end. under: how far the far sheet goes on
// under the near side, in texels of the map (as far as the two sides are drawn apart at the worst, or a gap opens between them),
// from a ramp on along its way to the near side: beside the ramp, not beyond its ends. out: how far the near side's paint reaches
// beyond the middle of the step, in texels of the map: the near side is cut there. A painting's own border between the two grounds
// seldom lies on the middle of the map's ramp; what lies between the middle and the cut rides with the near side. Left out: 0, the
// cut on the middle. boxes: the parts of the map a ramp is looked for in, each [left, top, right, bottom] in texels (a texel counts
// when left <= x < right and top <= y < bottom); a ramp's texels outside every box stay the mesh's wall. Left out: the whole map.
// at: the crests that are cut, each named by a point [x, y] in texels: the ramp that has a texel within one cell of the point, as far
// as its texels hang together (inside the boxes, if there are any); a ramp no point names stays the mesh's wall, and a point with no
// ramp beside it names nothing. Left out: every ramp. Two ramps that lie nearer to one another than a few cells are not to be
// named both: a texel between them goes with the nearer one, and the sheets of the other get its distances.
// Where a ramp ends (the step falls under the least, a box ends, no point names what goes on) there is no other side beyond the
// end: on along the crest's line both sheets have the ground's own distance, and the cut goes on along the height of the step's
// middle as far as the ground has that height.
export interface CrestNumbers { step: number; walk: number; under: number; out?: number; boxes?: [number, number, number, number][]; at?: [number, number][] }

// How many texels of the map the byte of the near side's share runs over, half to either side of the cut: the share is kept as the
// distance to the cut, so that whoever draws it can cut it as sharp as its own pixel is, whatever size a texel has on its screen.
export const CREST_SPAN = 8
// How far beyond the cut the near side may still draw, in texels of the map: a pixel and a half (its edge lies a pixel beyond the
// cut and is soft over one pixel), on a screen where a texel is three eighths of a pixel at the least. Where a layer is drawn
// smaller than that, the faint outer end of the near side's edge is left out.
export const CREST_REACH = 4
// How far behind the near side's own ground the far sheet lies at the least, as a share of the distance. By its place a texel
// beside a ramp is the near side's, and its ground may still lie further than the far end of the ramp (a hollow, the ground
// beyond a ramp's end): there the far sheet keeps a thousandth behind it, so it never lies before the ground it goes under.
export const CREST_BEHIND = 1e-3

export interface CrestField {
  width: number
  height: number
  // 1 where the texel lies on a ramp, 0 elsewhere.
  ramp: Uint8Array
  // How many texels a texel that is no ramp lies from the nearest ramp, capped at 255; 0 on a ramp.
  away: Uint8Array
  // 1 where the texel lies on the near side of the step's middle: on a ramp by its distance, in the band beside a ramp by the side
  // of the ramp it lies beside (by place, whatever its own distance is), in the band past a ramp's end (on along the crest's line,
  // no further across it than beyond the end) by its distance again, against the middle of the step at that end. 0 on the far
  // side and outside the band.
  side: Uint8Array
  // The distance of the near sheet and of the far sheet. Outside the band of a ramp and past a ramp's end both are the map's own,
  // to the bit; beside a ramp the side a texel lies on has the map's own and the other side has the distance of that side's end of
  // the nearest ramp (the far sheet under a texel of the near side at least CREST_BEHIND behind the texel's own ground).
  near: Float32Array
  far: Float32Array
  // 1 where the far sheet goes on under the near side: the texels of the near side that lie on the way of a ramp's texel to its near
  // end or on that way carried on, no more than the number under from the ramp.
  beneath: Uint8Array
  // Where the texel lies to the cut, 0 to 255: the cut is the line of the step's middle moved out by the number out, and the byte is
  // the distance to it, 127.5 on the cut, rising toward the near side, CREST_SPAN texels from 0 to 255 and held beyond.
  share: Uint8Array
  // From the texel to the far end of its ramp, in texels of the map, x to the right and y down: where the far side's ground is read
  // that stands in for what the near side covers. 0 where the texel is the far side's own and out of the cut's reach.
  toFarX: Float32Array
  toFarY: Float32Array
  // From the texel to the near end of its ramp: where the relief asks whether the near side is ground at all (a layer's map goes on
  // outside its matte, and a step between ground and no ground is a rim, not a crest). 0 away from a ramp: the texel asks itself.
  toNearX: Float32Array
  toNearY: Float32Array
  // The longest of those ways along one axis, at least 1: the scale they are kept at.
  reach: number
  // How many texels lie on a ramp.
  ramps: number
}

// The least or the greatest of a square window of the given radius around every texel, the window cut at the sides of the map.
export function slide(src: Float32Array, width: number, height: number, radius: number, greatest: boolean): Float32Array {
  const pass = (from: Float32Array, to: Float32Array, count: number, lines: number, stride: number, lineStride: number): void => {
    const queue = new Int32Array(count)
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride
      let head = 0
      let tail = 0
      let next = 0
      for (let i = 0; i < count; i++) {
        const last = Math.min(count - 1, i + radius)
        for (; next <= last; next++) {
          const v = from[base + next * stride]!
          while (tail > head && (greatest ? from[base + queue[tail - 1]! * stride]! <= v : from[base + queue[tail - 1]! * stride]! >= v)) tail--
          queue[tail++] = next
        }
        while (queue[head]! < i - radius) head++
        to[base + i * stride] = from[base + queue[head]! * stride]!
      }
    }
  }
  const rows = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  pass(src, rows, width, height, 1, width)
  pass(rows, out, height, width, width, 1)
  return out
}

// The mean of a square window of the given radius around every texel, the window cut at the sides of the map.
export function boxMean(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  const sums = new Float64Array((width + 1) * (height + 1))
  for (let y = 0; y < height; y++) {
    let row = 0
    for (let x = 0; x < width; x++) {
      row += src[y * width + x]!
      sums[(y + 1) * (width + 1) + x + 1] = sums[y * (width + 1) + x + 1]! + row
    }
  }
  const out = new Float32Array(src.length)
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius)
    const y1 = Math.min(height, y + radius + 1)
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius)
      const x1 = Math.min(width, x + radius + 1)
      const sum = sums[y1 * (width + 1) + x1]! - sums[y0 * (width + 1) + x1]! - sums[y1 * (width + 1) + x0]! + sums[y0 * (width + 1) + x0]!
      out[y * width + x] = sum / ((x1 - x0) * (y1 - y0))
    }
  }
  return out
}

// cell: how many texels of the map one cell of the layer's mesh is wide.
export function crestField(dist: Float32Array, width: number, height: number, cell: number, numbers: CrestNumbers): CrestField {
  const out = numbers.out ?? 0
  const boxes = numbers.boxes
  if (boxes && !boxes.every((q) => q.length === 4 && q.every((v) => Number.isFinite(v)) && q[2] > q[0] && q[3] > q[1])) throw new Error('the crests of a relief: a box is [left, top, right, bottom] in texels of the map, right over left and bottom over top, not ' + JSON.stringify(boxes))
  const at = numbers.at
  if (at && !at.every((q) => q.length === 2 && q.every((v) => Number.isFinite(v)))) throw new Error('the crests of a relief: a crest is named by a point [x, y] in texels of the map, not ' + JSON.stringify(at))
  if (!(numbers.step > 0) || !(numbers.walk >= 1) || !(numbers.under >= 0) || !(out >= 0 && out <= cell)) throw new Error('the crests of a relief need a step over 0, a walk of 1 texel or more, an under of 0 or more and an out from 0 to one cell of the mesh (' + cell + ' texels: paint that reaches further is no matter of the cut, the map is to be made anew), not ' + JSON.stringify(numbers))
  const n = width * height
  if (dist.length !== n) throw new Error('the crests of a relief: the map is ' + dist.length + ' long, not ' + width + ' by ' + height)
  const r = Math.max(1, Math.round(cell / 2))
  const inv = new Float32Array(n)
  for (let i = 0; i < n; i++) inv[i] = 1 / dist[i]!
  // What the inverse distance does across one cell, around every texel: on even ground the same all around, at a step more by the step.
  const range = slide(inv, width, height, r, true)
  const least = slide(inv, width, height, r, false)
  for (let i = 0; i < n; i++) range[i] = range[i]! - least[i]!
  // A first sieve, by squares: where the range is no more than a step over its least as far as a ramp may reach all round, no way
  // across can find a step, and the texel is not walked from. What is and what is not a ramp is said by the ways below alone.
  const even = slide(range, width, height, r + Math.ceil(numbers.walk), false)
  const zone = new Uint8Array(n)
  for (let i = 0; i < n; i++) zone[i] = range[i]! - even[i]! > numbers.step ? 1 : 0
  // The way across a ramp: the slope of the inverse distance, evened over a cell. It points to the near side.
  const gx = new Float32Array(n)
  const gy = new Float32Array(n)
  for (let y = 0; y < height; y++) {
    const ya = Math.max(0, y - 1)
    const yb = Math.min(height - 1, y + 1)
    for (let x = 0; x < width; x++) {
      const xa = Math.max(0, x - 1)
      const xb = Math.min(width - 1, x + 1)
      const i = y * width + x
      gx[i] = xb > xa ? (inv[y * width + xb]! - inv[y * width + xa]!) / (xb - xa) : 0
      gy[i] = yb > ya ? (inv[yb * width + x]! - inv[ya * width + x]!) / (yb - ya) : 0
    }
  }
  const ux = boxMean(gx, width, height, r)
  const uy = boxMean(gy, width, height, r)
  // From a texel along that way to the first texel of even ground on that side, or -1: the ramp is wider than a walk, or the texel
  // is even ground on that side itself. Even ground is where the range falls no further, by no more than a step, as far as the way
  // goes on (the reach of a ramp and half a cell beyond; at the rim of the map the way goes on along the rim). What a side does
  // anyway is its own: a slope is as even as a plain, and a steady slope beside a plain is no ramp without an end.
  const far0 = Math.floor(numbers.walk + r)
  const wayAt = new Int32Array(far0 + r + 1)
  // What the side does anyway from the end on: the least range on the way beyond the end the last call found.
  let evenThere = 0
  const end = (start: number, sign: number): number => {
    let px = start % width
    let py = (start - px) / width
    let dx = 0
    let dy = 0
    let count = 0
    for (let k = 0; k <= far0 + r; k++) {
      const i = Math.round(py) * width + Math.round(px)
      wayAt[count++] = i
      const m = Math.hypot(ux[i]!, uy[i]!)
      if (m > 0) {
        dx = (sign * ux[i]!) / m
        dy = (sign * uy[i]!) / m
      } else if (dx === 0 && dy === 0) break
      px = Math.min(width - 1, Math.max(0, px + dx))
      py = Math.min(height - 1, Math.max(0, py + dy))
    }
    // The step itself lies where the range is greatest within a cell along the way (a texel beside a ramp sees it rise first);
    // the end lies beyond that.
    let top = 0
    for (let k = 1; k < count && k <= 2 * r; k++) if (range[wayAt[k]!]! > range[wayAt[top]!]!) top = k
    let least = Infinity
    let found = -1
    for (let k = count - 1; k >= 0; k--) {
      const v = range[wayAt[k]!]!
      if (v < least) least = v
      if (v - least > numbers.step) continue
      if (k === 0) return -1
      if (k >= top && k <= count - 1 - r) {
        found = k
        evenThere = least
      }
    }
    return found < 0 ? -1 : wayAt[found]!
  }
  const ramp = new Uint8Array(n)
  const endNear = new Int32Array(n).fill(-1)
  const endFar = new Int32Array(n).fill(-1)
  const near = new Float32Array(dist)
  const far = new Float32Array(dist)
  // The middle of the step by the distance alone: on a ramp, the near side's share of the texel were it cut there, soft over one
  // texel along the slope.
  const middle = new Float32Array(n)
  let ramps = 0
  for (let i = 0; i < n; i++) {
    if (!zone[i]) continue
    const a = end(i, 1)
    if (a < 0) continue
    const evenNear = evenThere
    const b = end(i, -1)
    if (b < 0) continue
    // The step itself: what the two ends differ by, less what ground as even as the two sides would do anyway over the way between
    // them (the sides beyond the ends: the range at an end still holds up to a step of the ramp's foot).
    const ax = a % width
    const bx = b % width
    const way = Math.hypot(ax - bx, (a - ax) / width - (b - bx) / width)
    if (!(inv[a]! - inv[b]! - (way * (evenNear + evenThere)) / (4 * r) > numbers.step)) continue
    if (boxes && !boxes.some((q) => i % width >= q[0] && i % width < q[2] && (i - (i % width)) / width >= q[1] && (i - (i % width)) / width < q[3])) continue
    ramp[i] = 1
    endNear[i] = a
    endFar[i] = b
    ramps++
    near[i] = dist[a]!
    far[i] = dist[b]!
    const mid = (inv[a]! + inv[b]!) / 2
    const g = Math.hypot(gx[i]!, gy[i]!)
    middle[i] = g > 0 ? Math.min(1, Math.max(0, 0.5 + (inv[i]! - mid) / g)) : inv[i]! >= mid ? 1 : 0
  }
  if (at) {
    // The crests the points name: every ramp texel that hangs together, by a side or a corner, with one within a cell of a point.
    const named = new Uint8Array(n)
    const open: number[] = []
    for (const q of at) {
      for (let y = Math.max(0, Math.floor(q[1] - cell)); y <= Math.min(height - 1, Math.ceil(q[1] + cell)); y++) {
        for (let x = Math.max(0, Math.floor(q[0] - cell)); x <= Math.min(width - 1, Math.ceil(q[0] + cell)); x++) {
          const i = y * width + x
          if (!ramp[i] || named[i] || Math.hypot(x + 0.5 - q[0], y + 0.5 - q[1]) > cell) continue
          named[i] = 1
          open.push(i)
        }
      }
    }
    while (open.length > 0) {
      const i = open.pop()!
      const x = i % width
      const y = (i - x) / width
      for (let v = Math.max(0, y - 1); v <= Math.min(height - 1, y + 1); v++) {
        for (let u = Math.max(0, x - 1); u <= Math.min(width - 1, x + 1); u++) {
          const k = v * width + u
          if (!ramp[k] || named[k]) continue
          named[k] = 1
          open.push(k)
        }
      }
    }
    for (let i = 0; i < n; i++) {
      if (!ramp[i] || named[i]) continue
      ramp[i] = 0
      endNear[i] = -1
      endFar[i] = -1
      near[i] = dist[i]!
      far[i] = dist[i]!
      middle[i] = 0
      ramps--
    }
  }
  // The band: every texel within reach of a ramp goes with the ramp texel nearest to it (two sweeps over the map that hand the
  // nearest on from texel to texel), and lies on the side that texel lies on.
  const from = new Int32Array(n).fill(-1)
  const least2 = new Float32Array(n).fill(Infinity)
  for (let i = 0; i < n; i++) {
    if (!ramp[i]) continue
    from[i] = i
    least2[i] = 0
  }
  const hand = (j: number, x: number, y: number, k: number): void => {
    const s = from[k]!
    if (s < 0) return
    const sx = s % width
    const sy = (s - sx) / width
    const d = (x - sx) * (x - sx) + (y - sy) * (y - sy)
    if (d < least2[j]!) {
      least2[j] = d
      from[j] = s
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = y * width + x
      if (x > 0) hand(j, x, y, j - 1)
      if (y === 0) continue
      hand(j, x, y, j - width)
      if (x > 0) hand(j, x, y, j - width - 1)
      if (x < width - 1) hand(j, x, y, j - width + 1)
    }
    for (let x = width - 2; x >= 0; x--) hand(y * width + x, x, y, y * width + x + 1)
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const j = y * width + x
      if (x < width - 1) hand(j, x, y, j + 1)
      if (y === height - 1) continue
      hand(j, x, y, j + width)
      if (x < width - 1) hand(j, x, y, j + width + 1)
      if (x > 0) hand(j, x, y, j + width - 1)
    }
    for (let x = 1; x < width; x++) hand(y * width + x, x, y, y * width + x - 1)
  }
  const band = Math.min(254, Math.ceil(numbers.under) + Math.ceil(cell * 1.5) + 2)
  const away = new Uint8Array(n)
  for (let j = 0; j < n; j++) {
    const d = Math.ceil(Math.sqrt(least2[j]!) - 1e-6)
    if (d > band) from[j] = -1
    else away[j] = d
  }
  // The side of a texel of the band. Beside a ramp (the way across its nearest ramp texel leads to it, to within half a right
  // angle) it is the side of the ramp it lies on, by place, and the other side's sheet has the distance of that side's end there.
  // Past a ramp's end (no way across leads to it: it lies on along the crest's line, where no step was found) there is no other
  // side: both sheets keep the map's own distance, and the texel is the near side's where its own ground lies nearer than the
  // middle of the step at the end, soft over one texel along its slope as on a ramp. So the cut goes on from a ramp's end along
  // the height of the step's middle, as far as the ground has that height, and where it does not the cut ends with the ramp.
  const side = new Uint8Array(n)
  const past = new Uint8Array(n)
  for (let j = 0; j < n; j++) {
    const s = from[j]!
    if (s < 0) {
      away[j] = 255
      continue
    }
    if (ramp[j]) {
      side[j] = middle[j]! >= 0.5 ? 1 : 0
      continue
    }
    const x = j % width
    const sx = s % width
    const vx = x - sx
    const vy = (j - x) / width - (s - sx) / width
    const m = Math.hypot(ux[s]!, uy[s]!)
    const across = m > 0 ? (vx * ux[s]! + vy * uy[s]!) / m : 0
    const along = m > 0 ? Math.abs(vx * uy[s]! - vy * ux[s]!) / m : Math.hypot(vx, vy)
    if (along <= Math.abs(across) + 0.5) {
      side[j] = across >= 0 ? 1 : 0
      if (side[j]) far[j] = Math.max(dist[endFar[s]!]!, dist[j]! * (1 + CREST_BEHIND))
      else near[j] = dist[endNear[s]!]!
      continue
    }
    past[j] = 1
    const mid = (inv[endNear[s]!]! + inv[endFar[s]!]!) / 2
    const g = Math.hypot(gx[j]!, gy[j]!)
    middle[j] = g > 0 ? Math.min(1, Math.max(0, 0.5 + (inv[j]! - mid) / g)) : inv[j]! >= mid ? 1 : 0
    side[j] = middle[j]! >= 0.5 ? 1 : 0
  }
  // Where the far sheet goes on under the near side: from every texel of a ramp along its way to its near end and on in that line.
  // The band goes on beyond a ramp's ends, where no step is; nothing is put under the ground there.
  const beneath = new Uint8Array(n)
  const most = Math.ceil(numbers.under + numbers.walk + r) + 2
  for (let s = 0; s < n; s++) {
    if (!ramp[s]) continue
    const a = endNear[s]!
    const sx = s % width
    const sy = (s - sx) / width
    const ax = a % width
    const wx = ax - sx
    const wy = (a - ax) / width - sy
    const m = Math.hypot(wx, wy)
    if (!(m > 0)) continue
    for (let k = 1; k <= most; k++) {
      const px = Math.round(sx + (wx / m) * k)
      const py = Math.round(sy + (wy / m) * k)
      if (px < 0 || py < 0 || px >= width || py >= height) break
      const j = py * width + px
      if (ramp[j] || !side[j]) continue
      if (away[j]! > numbers.under) break
      beneath[j] = 1
    }
  }
  // The line of the middle, as pieces between the points where it crosses from one texel to the next, and how far every texel
  // within the cut's reach lies from it.
  const level = (i: number): number => (ramp[i] || past[i] ? middle[i]! - 0.5 : side[i] ? 0.5 : -0.5)
  const reachCut = Math.ceil(out + CREST_SPAN / 2 + 1)
  const off = new Float32Array(n).fill(Infinity)
  const piece = (x0: number, y0: number, x1: number, y1: number): void => {
    const ex = x1 - x0
    const ey = y1 - y0
    const ee = ex * ex + ey * ey
    const ya = Math.max(0, Math.floor(Math.min(y0, y1)) - reachCut)
    const yb = Math.min(height - 1, Math.ceil(Math.max(y0, y1)) + reachCut)
    const xa = Math.max(0, Math.floor(Math.min(x0, x1)) - reachCut)
    const xb = Math.min(width - 1, Math.ceil(Math.max(x0, x1)) + reachCut)
    for (let y = ya; y <= yb; y++) {
      for (let x = xa; x <= xb; x++) {
        const t = ee > 0 ? Math.min(1, Math.max(0, ((x - x0) * ex + (y - y0) * ey) / ee)) : 0
        const d = Math.hypot(x - x0 - t * ex, y - y0 - t * ey)
        const i = y * width + x
        if (d < off[i]!) off[i] = d
      }
    }
  }
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const i = y * width + x
      if (from[i]! < 0 || from[i + 1]! < 0 || from[i + width]! < 0 || from[i + width + 1]! < 0) continue
      const a = level(i)
      const b = level(i + 1)
      const c = level(i + width)
      const d = level(i + width + 1)
      const an = a >= 0
      const bn = b >= 0
      const cn = c >= 0
      const dn = d >= 0
      if (an === bn && an === cn && an === dn) continue
      // Where the line crosses the four edges of the square between the four texels: top, bottom, left, right.
      const top = an !== bn ? x + a / (a - b) : NaN
      const bottom = cn !== dn ? x + c / (c - d) : NaN
      const left = an !== cn ? y + a / (a - c) : NaN
      const right = bn !== dn ? y + b / (b - d) : NaN
      if (an !== bn && cn !== dn && an !== cn && bn !== dn) {
        // Two corners against two across: the middle of the four says which pair hangs together.
        if (a + b + c + d >= 0 === an) {
          piece(top, y, x + 1, right)
          piece(x, left, bottom, y + 1)
        } else {
          piece(top, y, x, left)
          piece(bottom, y + 1, x + 1, right)
        }
        continue
      }
      const px: number[] = []
      const py: number[] = []
      if (an !== bn) { px.push(top); py.push(y) }
      if (cn !== dn) { px.push(bottom); py.push(y + 1) }
      if (an !== cn) { px.push(x); py.push(left) }
      if (bn !== dn) { px.push(x + 1); py.push(right) }
      piece(px[0]!, py[0]!, px[1]!, py[1]!)
    }
  }
  const share = new Uint8Array(n)
  const toFarX = new Float32Array(n)
  const toFarY = new Float32Array(n)
  const toNearX = new Float32Array(n)
  const toNearY = new Float32Array(n)
  const farReach = Math.ceil(out) + 2
  const nearReach = Math.ceil(cell * 1.5) + 2
  let reach = 1
  for (let j = 0; j < n; j++) {
    const s = from[j]!
    if (s < 0) continue
    // Beyond the reach of the line a texel is all its own side's (the line lies further than the byte runs).
    const d = off[j]!
    share[j] = Math.round(Math.min(1, Math.max(0, 0.5 + ((side[j] ? d : -d) + out) / CREST_SPAN)) * 255)
    const x = j % width
    const y = (j - x) / width
    const a = endNear[s]!
    const b = endFar[s]!
    const ax = a % width
    const ay = (a - ax) / width
    const bx = b % width
    const by = (b - bx) / width
    if (side[j] || ramp[j] || away[j]! <= farReach) {
      // The far side's ground is read as far beyond the far end as the cut is moved out, on the line from the near end to the far
      // end: the far end is the first even ground, and that may lie as near to the middle as the cut does.
      const across = Math.hypot(bx - ax, by - ay)
      const more = across > 0 ? out / across : 0
      toFarX[j] = Math.min(width - 1, Math.max(0, bx + (bx - ax) * more)) - x
      toFarY[j] = Math.min(height - 1, Math.max(0, by + (by - ay) * more)) - y
      reach = Math.max(reach, Math.abs(toFarX[j]!), Math.abs(toFarY[j]!))
    }
    if (ramp[j] || away[j]! <= nearReach) {
      toNearX[j] = ax - x
      toNearY[j] = ay - y
      reach = Math.max(reach, Math.abs(toNearX[j]!), Math.abs(toNearY[j]!))
    }
  }
  return { width, height, ramp, away, side, near, far, beneath, share, toFarX, toFarY, toNearX, toNearY, reach, ramps }
}

// The field as the two textures the sheets read, four bytes a texel. The cut: the distance to the cut, the way to the far end along x
// and along y (128 is no way, 1 and 255 are the reach to either side), and 255. The back: the way to the near end along x and
// along y in the same measure, 0 and 255.
export function crestTexels(field: CrestField): { cut: Uint8Array; back: Uint8Array } {
  const n = field.width * field.height
  const cut = new Uint8Array(n * 4)
  const back = new Uint8Array(n * 4)
  const k = 127 / field.reach
  for (let i = 0; i < n; i++) {
    cut[i * 4] = field.share[i]!
    cut[i * 4 + 1] = 128 + Math.round(field.toFarX[i]! * k)
    cut[i * 4 + 2] = 128 + Math.round(field.toFarY[i]! * k)
    cut[i * 4 + 3] = 255
    back[i * 4] = 128 + Math.round(field.toNearX[i]! * k)
    back[i * 4 + 1] = 128 + Math.round(field.toNearY[i]! * k)
    back[i * 4 + 3] = 255
  }
  return { cut, back }
}

// Which cells of a mesh of nx by ny cells over the map are drawn as sheets: 1 a cell that holds a texel of a ramp (or touches one by
// a texel) or a texel of the far side that the near side may reach beside a ramp (the cut, and CREST_REACH texels more for the pixel
// the cut is soft over), drawn as a near sheet and a far sheet in place of the mesh's own cell; 2 a cell of the near side that holds
// a texel the far sheet goes under (beneath of the field), which keeps the mesh's own cell and gets the far sheet under it; 0 every
// other cell. out: the number out the field was made with.
export function crestCells(field: CrestField, nx: number, ny: number, out = 0): Uint8Array {
  const { width, height, ramp, away, side, share, beneath } = field
  const taken = Math.ceil(out) + CREST_REACH
  const least = Math.round(Math.max(0, 0.5 - CREST_REACH / CREST_SPAN) * 255)
  const cells = new Uint8Array(nx * ny)
  for (let cj = 0; cj < ny; cj++) {
    const y0 = Math.max(0, Math.floor((cj * height) / ny) - 1)
    const y1 = Math.min(height - 1, Math.ceil(((cj + 1) * height) / ny))
    for (let ci = 0; ci < nx; ci++) {
      const x0 = Math.max(0, Math.floor((ci * width) / nx) - 1)
      const x1 = Math.min(width - 1, Math.ceil(((ci + 1) * width) / nx))
      let kind = 0
      for (let y = y0; y <= y1 && kind !== 1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * width + x
          if (ramp[i] || (!side[i] && share[i]! > least && away[i]! <= taken)) {
            kind = 1
            break
          }
          if (beneath[i]) kind = 2
        }
      }
      cells[cj * nx + ci] = kind
    }
  }
  return cells
}

// The ring round the cells that have a far sheet: a cell of kind 0 that touches a cell of kind 1 or 2, by a side or by a corner,
// becomes 3. It keeps the mesh's own cell and gets the far sheet under it like a cell of kind 2, and over it that sheet comes up
// from where it lies under the near side to the mesh's own ground (crestRim). So what lies under the near side is shut all round:
// an eye that looks in under the near side further than the number under has reckoned with sees the far sheet's fill come up to
// the ground, and never past it. Beside the far side of a ramp the ring draws nothing (the far sheet under a kept cell draws
// under the near side alone).
export function crestRing(kinds: Uint8Array, nx: number, ny: number): Uint8Array {
  const ring = new Uint8Array(kinds)
  for (let cj = 0; cj < ny; cj++) {
    for (let ci = 0; ci < nx; ci++) {
      if (kinds[cj * nx + ci]) continue
      let touches = false
      for (let v = Math.max(0, cj - 1); v <= Math.min(ny - 1, cj + 1) && !touches; v++) {
        for (let u = Math.max(0, ci - 1); u <= Math.min(nx - 1, ci + 1); u++) {
          const kind = kinds[v * nx + u]!
          if (kind === 1 || kind === 2) {
            touches = true
            break
          }
        }
      }
      if (touches) ring[cj * nx + ci] = 3
    }
  }
  return ring
}

// Where the far sheet ends: the vertices of a mesh of nx by ny cells (nx + 1 in a row, row after row) that have a cell with no far
// sheet (kind 0, after the ring and after whatever the relief has taken out) among the cells around them. There the far sheet
// takes the mesh's own distance (under a kept cell CREST_BEHIND behind it), so its rim lies on the ground all the way round.
// The rim of the map is no such end: there the sheets end with the map, each on its own distance, as the mesh's two grounds do,
// and from the painting's own eye their last cells give the painting back like every other.
export function crestRim(kinds: Uint8Array, nx: number, ny: number): Uint8Array {
  const rim = new Uint8Array((nx + 1) * (ny + 1))
  const bare = (ci: number, cj: number): boolean => ci >= 0 && cj >= 0 && ci < nx && cj < ny && kinds[cj * nx + ci] === 0
  for (let cj = 0; cj <= ny; cj++) {
    for (let ci = 0; ci <= nx; ci++) {
      if (bare(ci - 1, cj - 1) || bare(ci, cj - 1) || bare(ci - 1, cj) || bare(ci, cj)) rim[cj * (nx + 1) + ci] = 1
    }
  }
  return rim
}

// Where the sheets end against the mesh's own wall: the vertices of a mesh of nx by ny cells (nx + 1 in a row, row after row) that
// are an end of a side between a cell drawn as sheets (kind 1 of crestCells, after whatever the relief has taken out of them) and a
// cell that is not, along which both grounds may show: a texel beside the side that the near side may reach and a texel beside it
// on the far side of the cut. Beside a ramp no such side is: the cells of the far side within the near side's reach are sheets
// themselves. It is where a ramp ends with a step left (its box ends, the ramp breaks, no point names what goes on, the relief
// keeps a cell for itself): beyond that side the mesh draws the step as its wall. At these vertices both sheets take the mesh's
// own distance, so over their last cell they close onto the wall like a zip and no eye sees between them and the mesh. A side
// on the rim of the map is no such side: no wall lies beyond it, and the sheets end there with the map.
export function crestEnds(field: CrestField, kinds: Uint8Array, nx: number, ny: number): Uint8Array {
  const { width, height, share } = field
  const least = Math.round(Math.max(0, 0.5 - CREST_REACH / CREST_SPAN) * 255)
  const ends = new Uint8Array((nx + 1) * (ny + 1))
  const sheets = (ci: number, cj: number): boolean => ci >= 0 && cj >= 0 && ci < nx && cj < ny && kinds[cj * nx + ci] === 1
  // Both grounds along a line of the mesh from (x0, y0) to (x1, y1) in texels: the texels a sampler reads along it.
  const both = (x0: number, y0: number, x1: number, y1: number): boolean => {
    const xa = Math.min(width - 1, Math.max(0, Math.floor(Math.min(x0, x1) - 0.5)))
    const xb = Math.min(width - 1, Math.max(0, Math.floor(Math.max(x0, x1) - 0.5) + 1))
    const ya = Math.min(height - 1, Math.max(0, Math.floor(Math.min(y0, y1) - 0.5)))
    const yb = Math.min(height - 1, Math.max(0, Math.floor(Math.max(y0, y1) - 0.5) + 1))
    let near = false
    let far = false
    for (let y = ya; y <= yb; y++) {
      for (let x = xa; x <= xb; x++) {
        const v = share[y * width + x]!
        if (v > least) near = true
        if (v < 128) far = true
        if (near && far) return true
      }
    }
    return false
  }
  for (let cj = 0; cj <= ny; cj++) {
    for (let ci = 0; ci <= nx; ci++) {
      // The side under the vertex (ci, cj) to the right, between the cells above and below it, and the side down from it,
      // between the cells left and right of it.
      if (ci < nx && cj > 0 && cj < ny && sheets(ci, cj - 1) !== sheets(ci, cj) && both((ci * width) / nx, (cj * height) / ny, ((ci + 1) * width) / nx, (cj * height) / ny)) {
        ends[cj * (nx + 1) + ci] = 1
        ends[cj * (nx + 1) + ci + 1] = 1
      }
      if (cj < ny && ci > 0 && ci < nx && sheets(ci - 1, cj) !== sheets(ci, cj) && both((ci * width) / nx, (cj * height) / ny, (ci * width) / nx, ((cj + 1) * height) / ny)) {
        ends[cj * (nx + 1) + ci] = 1
        ends[(cj + 1) * (nx + 1) + ci] = 1
      }
    }
  }
  return ends
}
