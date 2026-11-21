import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { StopPlan, type Fit } from '../../../src/director/moves'
import { plans } from '../../../src/director/plans'
import { params, plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const m = (fit as any).moons[0]
const home = new THREE.Vector3().fromArray(m.position)
const args = process.argv.slice(2)
const list = (s: string | undefined, d: string) => (s ?? d).split(',').map(Number)
const elevs = list(args[0], String(params.rise.elevationDeg))
const azims = list(args[1], String(params.rise.azimuthDeg))
const rolls = list(args[2], String(params.rise.rollDeg))
const offs = (args[3] ?? params.rise.offset.join(':')).split(',').map((s) => s.split(':').map(Number) as [number, number])
const dists = list(args[4], String(params.rise.distance))
const frames = list(args[5], '5006,5024,5055,5085,5115,5145,5230,5320')
const hold = plan.holdPos.clone().normalize()
console.log('per frame: moon x y (0 to 1), sun x y, planet x y and radius in frame heights')
for (const elev of elevs) for (const azim of azims) for (const roll of rolls) for (const off of offs) for (const distance of dists) {
  const p = new StopPlan('neptune', fit as Fit, { ...params, rise: { ...params.rise, azimuthDeg: azim, elevationDeg: elev, rollDeg: roll, offset: off, distance } })
  const director = new FilmDirector(plans.map((x) => (x.id === 'neptune' ? p : x)))
  const look = (f: number) => {
    const time = f / config.fps
    const shot: any = director.shotAt(f, time)
    const s = shot.sets.find((x: any) => x.id === 'neptune')
    const inv = (shot.camera.quaternion as THREE.Quaternion).clone().invert()
    const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
    const cam = shot.camera.position as THREE.Vector3
    const scr = (w: THREE.Vector3) => {
      const v = w.clone().applyQuaternion(inv)
      return v.z < 0 ? (0.5 + v.x / -v.z / (th * 16 / 9) / 2).toFixed(2) + ' ' + (0.5 - v.y / -v.z / th / 2).toFixed(2) : 'behind'
    }
    const turn = new THREE.Quaternion().setFromAxisAngle(p.axis, THREE.MathUtils.degToRad(p.p.moonDegPerSecond) * (time - p.holdMid))
    const moon = home.clone().applyQuaternion(turn).applyQuaternion(s.rotation).add(s.origin).sub(cam)
    const centre = (s.origin as THREE.Vector3).clone().sub(cam)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(shot.camera.quaternion).applyQuaternion((s.rotation as THREE.Quaternion).clone().invert())
    const pos = cam.clone().sub(s.origin).applyQuaternion((s.rotation as THREE.Quaternion).clone().invert())
    return { text: f + ' moon ' + scr(moon) + ' sun ' + scr(p.sunDir.clone().applyQuaternion(s.rotation)) + ' planet ' + scr(centre) + ' r ' + (Math.asin(Math.min(1 / centre.length(), 1)) / THREE.MathUtils.degToRad(shot.camera.vfov)).toFixed(2), fwd, pos }
  }
  let worst = 0
  let at = 0
  let total = 0
  let prev = look(4980).fwd
  const first = prev.clone()
  for (let f = 4981; f <= 5024; f++) {
    const cur = look(f).fwd
    const a = cur.angleTo(prev) * DEG
    total += a
    if (f > 4987 && a > worst) { worst = a; at = f }
    prev = cur
  }
  const end = look(5024)
  const d = end.pos.clone().normalize()
  console.log('elev ' + elev + ' azim ' + azim + ' roll ' + roll + ' off ' + off.join(':') + ' dist ' + distance + ': view turn ' + (first.angleTo(end.fwd) * DEG).toFixed(0) + ' path ' + total.toFixed(0) + ' worst after cover ' + worst.toFixed(2) + ' at ' + at + ' last ' + (look(5024).fwd.angleTo(look(5023).fwd) * DEG).toFixed(3) + ' phase ' + (d.angleTo(p.lightDir) * DEG).toFixed(0) + ' from hold ' + (d.angleTo(hold) * DEG).toFixed(0))
  for (const f of frames) console.log('   ' + look(f).text)
}
