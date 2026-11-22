import * as THREE from 'three'
import { stream } from '../../core/random'

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
  band: { off: number[]; dust: number[]; light: number[]; span: number[]; contrast: number; gain: number }
}

export interface FlightField {
  position: Float32Array
  star: Float32Array
  color: Float32Array
  glow: Float32Array
  width: number
  height: number
}

const MAP = [512, 256] as const
const SIZE = [2.6, 2.2, 11] as const

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
    }
  }
  return { position, star, color, glow, width, height }
}
