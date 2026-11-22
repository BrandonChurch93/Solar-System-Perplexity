import * as THREE from 'three'
import { hash01, stream } from '../../core/random'

export interface FlightDef {
  count: number
  law: number[][]
  max: number
  color: number
  warm: number
  pale: number
  vivid: number[]
  level: number
  floor: number
  clouds: { count: number; lobes: number; widthDeg: number[]; step: number; gain: number[] }
  clusters: { count: number; radiusDeg: number[]; stars: number[]; lift: number; cool: number }
  glow: number
  glowTint: number[]
  haze: { tint: number[]; away: number; widthDeg: number }
  band: { off: number[]; dust: number[]; light: number[]; span: number[]; contrast: number; gain: number; level: number }
  deep: { count: number; law: number[][]; max: number; level: number; color: number; warm: number; vivid: number; even: number; lens: number; groups: { count: number; radiusDeg: number[]; stars: number[]; lift: number } }
  veil: { cool: number[]; neutral: number[]; level: number; floor: number; scale: number; span: number[]; lanes: number[]; dither: number; lens: number }
}

export interface FlightField {
  position: Float32Array
  star: Float32Array
  color: Float32Array
  glow: Float32Array
  veil: Float32Array
  deep: { position: Float32Array; star: Float32Array; color: Float32Array }
  width: number
  height: number
}

const MAP = [512, 256] as const
export const SIZE = [2.6, 2.2, 11] as const
export const FLIGHT_SIZE = 16

export interface StripDef {
  swap: number
  edge: number[]
  dither: number
  offLevel: number
  patchHold: number
  deep: { gain: number; tail: number; ref: number }
  stars: { gain: number; power: number; max: number; tint: number; lane: number; ref: number; jitter: number; halo: number; warm: number }
}

function clouds(def: FlightDef['veil']): (x: number, y: number, z: number) => number {
  const seed = stream('flight veil').int(1 << 20)
  const ease = (t: number): number => t * t * (3 - 2 * t)
  const noise = (x: number, y: number, z: number): number => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
    const fx = ease(x - ix), fy = ease(y - iy), fz = ease(z - iz)
    const at = (a: number, b: number, c: number): number => hash01(ix + a + seed, iy + b, iz + c)
    const lo = (at(0, 0, 0) * (1 - fx) + at(1, 0, 0) * fx) * (1 - fy) + (at(0, 1, 0) * (1 - fx) + at(1, 1, 0) * fx) * fy
    const hi = (at(0, 0, 1) * (1 - fx) + at(1, 0, 1) * fx) * (1 - fy) + (at(0, 1, 1) * (1 - fx) + at(1, 1, 1) * fx) * fy
    return lo * (1 - fz) + hi * fz
  }
  const fbm = (x: number, y: number, z: number, f: number, octaves: number, shift: number): number => {
    let sum = 0
    let amp = 1
    let total = 0
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise(x * f + 31.7 * o + shift, y * f + 11.3 * o - shift, z * f + 57.1 * o + shift)
      total += amp
      amp *= 0.5
      f *= 2.03
    }
    return sum / total
  }
  const [depth, width, scale] = def.lanes
  return (x, y, z) => THREE.MathUtils.smoothstep(fbm(x, y, z, def.scale, 4, 0), def.span[0]!, def.span[1]!) * (depth! + (1 - depth!) * THREE.MathUtils.smoothstep(Math.abs(2 * fbm(x, y, z, def.scale * scale!, 2, 211.3) - 1), 0, width!))
}

export function flightField(def: FlightDef): FlightField {
  const rnd = stream('flight stars')
  const uniform = (): THREE.Vector3 => {
    const z = rnd.range(-1, 1)
    const a = rnd.range(0, Math.PI * 2)
    const r = Math.sqrt(1 - z * z)
    return new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a))
  }
  const side = new THREE.Vector3()
  const up = new THREE.Vector3()
  const around = (c: THREE.Vector3, s: number): THREE.Vector3 => {
    const u = rnd.next()
    return tilt(c, Math.max(1 + s * Math.log(u + (1 - u) * Math.exp(-2 / s)), -1))
  }
  const tilt = (c: THREE.Vector3, cos: number): THREE.Vector3 => {
    const a = rnd.range(0, Math.PI * 2)
    side.set(Math.abs(c.y) < 0.9 ? 0 : 1, Math.abs(c.y) < 0.9 ? 1 : 0, 0).cross(c).normalize()
    up.crossVectors(c, side)
    const sin = Math.sqrt(Math.max(1 - cos * cos, 0))
    return c.clone().multiplyScalar(cos).addScaledVector(side, sin * Math.cos(a)).addScaledVector(up, sin * Math.sin(a))
  }
  const lobes: { c: THREE.Vector3; s: number; gain: number }[] = []
  const most = def.clouds.count * def.clouds.lobes
  for (let k = 0; k < def.clouds.count && lobes.length < most; k++) {
    let c = uniform()
    const gain = rnd.range(def.clouds.gain[0], def.clouds.gain[1])
    for (let j = 0; j < def.clouds.lobes && lobes.length < most; j++) {
      const w = THREE.MathUtils.degToRad(rnd.range(def.clouds.widthDeg[0], def.clouds.widthDeg[1]))
      lobes.push({ c, s: 1 - Math.cos(w), gain: gain * rnd.range(0.6, 1.4) })
      c = tilt(c, Math.cos(w * def.clouds.step * rnd.range(0.6, 1.4)))
    }
  }
  const weights = lobes.map((l) => l.gain * l.s)
  const total = weights.reduce((a, b) => a + b, 0)
  const pick = (): { c: THREE.Vector3; s: number } => {
    let x = rnd.next() * total
    for (let i = 0; i < lobes.length; i++) {
      x -= weights[i]!
      if (x <= 0) return lobes[i]!
    }
    return lobes[lobes.length - 1]!
  }
  const groups: { c: THREE.Vector3; s: number; n: number; cool: number }[] = []
  let grouped = 0
  for (let k = 0; k < def.clusters.count && lobes.length > 0; k++) {
    const l = pick()
    const n = Math.round(rnd.range(def.clusters.stars[0], def.clusters.stars[1]))
    groups.push({ c: around(l.c, l.s), s: 1 - Math.cos(THREE.MathUtils.degToRad(rnd.range(def.clusters.radiusDeg[0], def.clusters.radiusDeg[1]))), n, cool: rnd.next() })
    grouped += n
  }
  const count = def.count
  const free = Math.max(count - grouped, 0)
  const flat = lobes.length > 0 ? Math.round(free * def.floor) : free
  const position = new Float32Array(count * 3)
  const star = new Float32Array(count * 4)
  const color = new Float32Array(count * 3)
  const warm = new THREE.Color(1.0, 0.58, 0.34)
  const cool = new THREE.Color(0.5, 0.7, 1.0)
  const white = new THREE.Color(1, 1, 1)
  const c = new THREE.Color()
  const law = def.law.map(([b, share]) => [Math.log(b!), Math.log(share!)] as const)
  const bright = (u: number): number => {
    const x = Math.log(Math.max(u, 1e-9))
    let k = 0
    while (k < law.length - 2 && x < law[k + 1]![1]) k++
    const a = law[k]!
    const b = law[k + 1]!
    return Math.min(Math.exp(a[0] + (b[0] - a[0]) * (a[1] - x) / (a[1] - b[1])), def.max)
  }
  let at = 0
  const put = (p: THREE.Vector3, lift: number, bias: number): void => {
    if (at >= count) return
    position.set([p.x, p.y, p.z], at * 3)
    const b = Math.min(bright(rnd.next()) * lift, def.max)
    star.set([Math.min(SIZE[0] + SIZE[1] * Math.log2(1 + b), SIZE[2]), b, 1, 0], at * 4)
    const hue = rnd.next()
    const temp = Math.min(Math.max(rnd.next() + bias, 0), 1)
    if (hue < def.warm) c.copy(warm).lerp(white, Math.pow(temp, 0.6))
    else c.copy(white).lerp(cool, Math.pow(temp, 1.4))
    const k = def.color * (def.pale + (1 - def.pale) * THREE.MathUtils.smoothstep(b, def.vivid[0]!, def.vivid[1]!))
    color.set([Math.max(1 + (c.r - 1) * k, 0.05), Math.max(1 + (c.g - 1) * k, 0.05), Math.max(1 + (c.b - 1) * k, 0.05)], at * 3)
    at++
  }
  for (let i = 0; i < flat; i++) put(uniform(), 1, 0)
  for (let i = flat; i < free; i++) {
    const l = pick()
    put(around(l.c, l.s), 1, 0)
  }
  for (const g of groups) for (let i = 0; i < g.n; i++) put(around(g.c, g.s), def.clusters.lift, def.clusters.cool * g.cool)
  const inLobes = free - flat
  const amps = lobes.map((l, i) => (2 * inLobes * (weights[i]! / total)) / (l.s * count))
  const [width, height] = MAP
  const glow = new Float32Array(width * height)
  const veil = new Float32Array(width * height)
  const cloud = clouds(def.veil)
  let veilSum = 0
  let veilArea = 0
  for (let j = 0; j < height; j++) {
    const lat = ((j + 0.5) / height - 0.5) * Math.PI
    for (let i = 0; i < width; i++) {
      const lon = ((i + 0.5) / width - 0.5) * Math.PI * 2
      const x = Math.cos(lat) * Math.sin(lon)
      const y = Math.sin(lat)
      const z = Math.cos(lat) * Math.cos(lon)
      let sum = 0
      for (let k = 0; k < lobes.length; k++) {
        const l = lobes[k]!
        sum += amps[k]! * Math.exp((x * l.c.x + y * l.c.y + z * l.c.z - 1) / l.s)
      }
      glow[j * width + i] = sum
      const w = def.veil.floor + (1 - def.veil.floor) * cloud(x, y, z)
      veil[j * width + i] = w
      veilSum += w * Math.cos(lat)
      veilArea += Math.cos(lat)
    }
  }
  for (let i = 0; i < veil.length; i++) veil[i] = veil[i]! * veilArea / veilSum
  const veilLow = def.veil.floor * veilArea / veilSum
  const veilHigh = Math.max(veilArea / veilSum, veilLow + 1e-6)
  const dr = stream('flight deep')
  const dd = def.deep
  const deep = { position: new Float32Array(dd.count * 3), star: new Float32Array(dd.count * 4), color: new Float32Array(dd.count * 3) }
  const dl = dd.law.map(([b, share]) => [Math.log(b!), Math.log(share!)] as const)
  const rose = new THREE.Color(1.0, 0.42, 0.5)
  const amber = new THREE.Color(1.0, 0.62, 0.25)
  const azure = new THREE.Color(0.38, 0.6, 1.0)
  let n = 0
  const place = (x: number, y: number, z: number, lift: number): void => {
    deep.position.set([x, y, z], n * 3)
    const lx = Math.log(Math.max(dr.next(), 1e-9))
    let k = 0
    while (k < dl.length - 2 && lx < dl[k + 1]![1]) k++
    const b = Math.min(Math.exp(dl[k]![0] + (dl[k + 1]![0] - dl[k]![0]) * (dl[k]![1] - lx) / (dl[k]![1] - dl[k + 1]![1])) * lift, dd.max)
    deep.star.set([Math.min(SIZE[0] + SIZE[1] * Math.log2(1 + b), FLIGHT_SIZE), b, 1, 0], n * 4)
    const hue = dr.next()
    const temp = dr.next()
    if (hue < dd.warm) c.copy(warm).lerp(white, Math.pow(temp, 0.6))
    else c.copy(white).lerp(cool, Math.pow(temp, 1.4))
    const vivid = dr.next()
    if (vivid < 0.35 * dd.vivid) c.copy(rose)
    else if (vivid < 0.65 * dd.vivid) c.copy(amber)
    else if (vivid < dd.vivid) c.copy(azure)
    deep.color.set([Math.max(1 + (c.r - 1) * dd.color, 0.05), Math.max(1 + (c.g - 1) * dd.color, 0.05), Math.max(1 + (c.b - 1) * dd.color, 0.05)], n * 3)
    n++
  }
  const dense = (x: number, y: number, z: number): number => {
    const cell = Math.min(Math.floor((Math.asin(y) / Math.PI + 0.5) * height), height - 1) * width + Math.min(Math.floor((Math.atan2(x, z) / (2 * Math.PI) + 0.5) * width), width - 1)
    return dd.even + (1 - dd.even) * (veil[cell]! - veilLow) / (veilHigh - veilLow)
  }
  const any = (): [number, number, number] => {
    for (;;) {
      const y = dr.range(-1, 1)
      const a = dr.range(0, Math.PI * 2)
      const r = Math.sqrt(1 - y * y)
      const x = r * Math.cos(a)
      const z = r * Math.sin(a)
      if (dr.next() <= dense(x, y, z)) return [x, y, z]
    }
  }
  const normal = (): number => Math.sqrt(-2 * Math.log(Math.max(dr.next(), 1e-9))) * Math.cos(2 * Math.PI * dr.next())
  for (let g = 0; g < dd.groups.count && n < dd.count; g++) {
    const [gx, gy, gz] = any()
    const spread = THREE.MathUtils.degToRad(dr.range(dd.groups.radiusDeg[0]!, dd.groups.radiusDeg[1]!))
    const members = Math.round(dr.range(dd.groups.stars[0]!, dd.groups.stars[1]!))
    for (let m = 0; m < members && n < dd.count; m++) {
      const x = gx + spread * normal()
      const y = gy + spread * normal()
      const z = gz + spread * normal()
      const l = Math.hypot(x, y, z)
      place(x / l, y / l, z / l, dd.groups.lift)
    }
  }
  while (n < dd.count) {
    const [x, y, z] = any()
    place(x, y, z, 1)
  }
  return { position, star, color, glow, veil, deep, width, height }
}

export interface BandFrame {
  repeats: number
  offset: number
  latSpan: number
  widen: number
  gal: number[]
}

export interface BandField {
  position: Float32Array
  star: Float32Array
  color: Float32Array
}

export function bandField(bytes: ArrayBuffer, frame: BandFrame, def: StripDef, field: FlightField): BandField {
  const view = new DataView(bytes)
  if (view.getUint32(0, true) !== 0x52545342) throw new Error('band stars: bad file')
  const total = view.getUint32(8, true)
  const st = def.stars
  const [edgeFrom, edgeTo, edgeNoise] = def.edge
  const w = 1 / frame.widen
  const g = frame.gal
  const rnd = stream('flight band')
  const count = total * frame.repeats
  const position = new Float32Array(count * 3)
  const star = new Float32Array(count * 4)
  const color = new Float32Array(count * 3)
  let n = 0
  for (let i = 0; i < total; i++) {
    const at = 12 + i * 10
    const u = view.getUint16(at, true) / 65536
    const v = view.getUint16(at + 2, true) / 65535
    const flux = Math.pow(2, view.getUint16(at + 4, true) / 2048 - 16)
    const bg = Math.pow(2, view.getUint8(at + 9) / 16 - 16)
    const target = v - 0.5
    let x = target
    for (let k = 0; k < 8; k++) x -= (w * x + (1 - w) * 4 * x * x * x - target) / (w + (1 - w) * 12 * x * x)
    const lat = x * frame.latSpan
    const level = Math.min(st.gain * Math.pow(flux, st.power), st.max)
    const base = Math.pow(Math.max(bg, 1e-5), 1 - st.lane) * Math.pow(st.ref, st.lane)
    const cr = view.getUint8(at + 6) / 63.75
    const cg = view.getUint8(at + 7) / 63.75
    const cb = view.getUint8(at + 8) / 63.75
    for (let r = 0; r < frame.repeats; r++) {
      const jitter = rnd.next()
      const a = ((u + r - frame.offset) / frame.repeats - 0.5) * Math.PI * 2
      const gx = Math.cos(lat) * Math.cos(a)
      const gy = Math.cos(lat) * Math.sin(a)
      const gz = Math.sin(lat)
      const px = g[0]! * gx + g[1]! * gy + g[2]! * gz
      const py = g[3]! * gx + g[4]! * gy + g[5]! * gz
      const pz = g[6]! * gx + g[7]! * gy + g[8]! * gz
      const cell = Math.min(Math.floor((Math.asin(Math.max(Math.min(py, 1), -1)) / Math.PI + 0.5) * field.height), field.height - 1) * field.width + Math.min(Math.floor((Math.atan2(px, pz) / (2 * Math.PI) + 0.5) * field.width), field.width - 1)
      const fade = 1 - THREE.MathUtils.smoothstep(Math.abs(x) + edgeNoise! * (field.veil[cell]! - 1) + st.jitter * (jitter - 0.5), edgeFrom!, edgeTo!)
      if (fade <= 0) continue
      position.set([px, py, pz], n * 3)
      star.set([level * fade, base, 0, 0], n * 4)
      color.set([cr, cg, cb], n * 3)
      n++
    }
  }
  return { position: position.subarray(0, n * 3), star: star.subarray(0, n * 4), color: color.subarray(0, n * 3) }
}
