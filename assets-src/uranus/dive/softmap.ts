import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { config } from '../../../src/config'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/uranus/plan'
import * as look from '../../../src/stops/uranus/look'
import fit from '../../../src/stops/uranus/fit.json'
import patches from '../../../src/stops/uranus/patches.json'

const W = 1920
const H = 1080
const STEP = 12
const [a0, a1, a2] = process.argv.slice(2, 5).map(Number)
const spotArg = process.argv[5] ? (JSON.parse(process.argv[5]) as number[]) : null
const widths = process.argv[6] ? (JSON.parse(process.argv[6]) as number[]) : patches.levels.map((l) => l.widthDeg)
const size = Number(process.argv[7] ?? 4096)
const rad = THREE.MathUtils.degToRad
const deg = THREE.MathUtils.radToDeg
const spot = spotArg ? new THREE.Vector3(Math.sin(rad(spotArg[0]!)) * Math.cos(rad(spotArg[1]!)), Math.sin(rad(spotArg[1]!)), Math.cos(rad(spotArg[0]!)) * Math.cos(rad(spotArg[1]!))) : new THREE.Vector3().fromArray(patches.spot).normalize()
const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
const north = spot.clone().cross(east)
const director = new FilmDirector(plans)
const globeBack = new THREE.Quaternion().fromArray(fit.globe.quaternion).invert()
const axisQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3().fromArray(look.shape.axis).normalize())
const axisBack = axisQ.clone().invert()
const centre = new THREE.Vector3().fromArray(look.shape.center)
const toBody = (v0: THREE.Vector3, isDir: boolean): THREE.Vector3 => {
  const v = v0.clone()
  if (!isDir) v.sub(centre)
  v.applyQuaternion(axisBack)
  v.set(v.x / look.shape.polar, v.y / look.shape.equator, v.z / look.shape.equator)
  return v.applyQuaternion(axisQ).applyQuaternion(globeBack)
}
const wrap = 8192 / (2 * Math.PI)
const smoothstep = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }
const scale = widths.map((w) => 1 / (2 * Math.tan(rad(w) / 2)))
for (let f = a0!; f <= a1!; f += a2 || 1) {
  const time = (f + 0.5 * config.shutterFraction) / config.fps
  const shot = director.shotAt(f, time)
  const st = shot.sets.find((s) => s.id === 'uranus')!
  const inv = st.rotation.clone().invert()
  const o = toBody(shot.camera.position.clone().sub(st.origin).applyQuaternion(inv), false)
  const cq = inv.clone().multiply(shot.camera.quaternion)
  const th = Math.tan(rad(shot.camera.vfov) / 2)
  const spin = plan.spin(time)
  const elapsed = time - plan.holdMid
  const k = look.globe.bandRate
  const hit = (x: number, y: number): THREE.Vector3 | null => {
    const d = toBody(new THREE.Vector3(((2 * x) / W - 1) * th * (W / H), (1 - (2 * y) / H) * th, -1).normalize().applyQuaternion(cq), true).normalize()
    const b = o.dot(d)
    const disc = b * b - (o.lengthSq() - 1)
    if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
    const p = o.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize()
    const turn = spin + elapsed * (k[0]! + k[1]! * Math.sin(k[2]! * Math.asin(p.y) + k[3]!))
    const c = Math.cos(turn)
    const s = Math.sin(turn)
    return new THREE.Vector3(c * p.x - s * p.z, p.y, s * p.x + c * p.z)
  }
  const gno = (q: THREE.Vector3): [number, number, number] => { const dn = q.dot(spot); return [q.dot(east) / Math.max(dn, 0.05), q.dot(north) / Math.max(dn, 0.05), dn] }
  let n = 0
  let soft = 0
  const by = widths.map(() => 0).concat(0)
  let lon0 = 999, lon1 = -999, lat0 = 999, lat1 = -999
  for (let y = STEP / 2; y < H; y += STEP) {
    for (let x = STEP / 2; x < W; x += STEP) {
      const a = hit(x, y)
      const bx = hit(x + 1, y)
      const cy = hit(x, y + 1)
      if (!a || !bx || !cy) continue
      n++
      let texels = Math.max(a.distanceTo(bx), a.distanceTo(cy)) * wrap
      const need = texels
      const g = gno(a)
      const g1 = gno(bx)
      const g2 = gno(cy)
      const gd = Math.max(Math.hypot(g1[0] - g[0], g1[1] - g[1]), Math.hypot(g2[0] - g[0], g2[1] - g[1]))
      let parent = texels
      let level = 0
      const ax = bx.clone().sub(a)
      const ay = cy.clone().sub(a)
      const aa = ax.lengthSq() + ay.lengthSq()
      const ad = ax.clone().cross(ay).length()
      const lean = Math.max((2 * ad) / Math.max(aa + Math.sqrt(Math.max(aa * aa - 4 * ad * ad, 0)), 1e-20), 1 / 16)
      if (g[2] > 0.3 && texels * lean < patches.fade[1]!) {
        for (let i = 0; i < widths.length; i++) {
          const qx = g[0] * scale[i]!
          const qy = g[1] * scale[i]!
          const w = smoothstep(0.5, 0.5 - patches.feather, Math.max(Math.abs(qx), Math.abs(qy))) * (1 - smoothstep(patches.fade[0]!, patches.fade[1]!, parent * lean))
          parent = gd * scale[i]! * size
          if (w >= 0.5) { texels = parent; level = i + 1 }
        }
      }
      if (texels < 1) {
        soft++
        by[level]!++
        const lon = deg(Math.atan2(a.x, a.z))
        const lat = deg(Math.asin(a.y))
        lon0 = Math.min(lon0, lon); lon1 = Math.max(lon1, lon); lat0 = Math.min(lat0, lat); lat1 = Math.max(lat1, lat)
        void need
      }
    }
  }
  const frac = n ? soft / n : 0
  console.log(`${f} ${st.view} alt ${(o.length() - 1).toFixed(3)} globe ${(n / ((W / STEP) * (H / STEP))).toFixed(2)} soft ${frac.toFixed(4)} by level ${by.map((v) => (n ? v / n : 0).toFixed(3)).join(' ')}${soft ? ` soft lon ${lon0.toFixed(1)} to ${lon1.toFixed(1)} lat ${lat0.toFixed(1)} to ${lat1.toFixed(1)}` : ''}`)
}
