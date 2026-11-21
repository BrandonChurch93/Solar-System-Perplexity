import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { StopPlan, type Fit } from '../../../src/director/moves'
import { plans } from '../../../src/director/plans'
import { params, plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const RAD = Math.PI / 180
const m = (fit as any).moons[0]
const home = new THREE.Vector3().fromArray(m.position)
const seg = plan.seg.rise
const tq = plan.turn(plan.coverCenter(seg))
const spot = (plan as any).spot.clone().applyQuaternion(tq) as THREE.Vector3
const heading = (plan as any).heading.clone().applyQuaternion(tq) as THREE.Vector3
const right = new THREE.Vector3().crossVectors(heading, spot).normalize()
const hold = plan.holdPos.clone().normalize()
const lat = (v: THREE.Vector3) => Math.asin(v.y) * DEG
const lon = (v: THREE.Vector3) => Math.atan2(v.x, v.z) * DEG
const args = process.argv.slice(2)
const ths = (args[0] ?? '30,40,50').split(',').map(Number)
const phs = (args[1] ?? '-30,0,30').split(',').map(Number)
const rolls = (args[2] ?? '4').split(',').map(Number)
const offs = (args[3] ?? '-0.3:0.1').split(',').map((s) => s.split(':').map(Number) as [number, number])
const frames = [5006, 5024, 5040, 5055, 5070, 5085, 5100, 5115, 5130]
const sunDir = plan.sunDir.clone()
for (const th of ths) for (const ph of phs) for (const roll of rolls) for (const off of offs) {
  const d = spot.clone().multiplyScalar(Math.cos(th * RAD)).addScaledVector(heading, -Math.sin(th * RAD) * Math.cos(ph * RAD)).addScaledVector(right, -Math.sin(th * RAD) * Math.sin(ph * RAD))
  const elev = lat(d) - lat(hold)
  const azim = ((lon(d) - lon(hold) + 540) % 360) - 180
  const p = new StopPlan('neptune', fit as Fit, { ...params, rise: { ...params.rise, azimuthDeg: azim, elevationDeg: elev, rollDeg: roll, offset: off } })
  const director = new FilmDirector(plans.map((x) => (x.id === 'neptune' ? p : x)))
  const out: string[] = []
  for (const f of frames) {
    const time = f / config.fps
    const shot: any = director.shotAt(f, time)
    const s = shot.sets.find((x: any) => x.id === 'neptune')
    const turn = new THREE.Quaternion().setFromAxisAngle(p.axis, THREE.MathUtils.degToRad(p.p.moonDegPerSecond) * (time - p.holdMid))
    const world = home.clone().applyQuaternion(turn).applyQuaternion(s.rotation).add(s.origin)
    const cam = shot.camera.position as THREE.Vector3
    const inv = (shot.camera.quaternion as THREE.Quaternion).clone().invert()
    const th2 = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
    const scr = (w: THREE.Vector3) => {
      const v = w.clone().applyQuaternion(inv)
      return v.z < 0 ? (0.5 + v.x / -v.z / (th2 * 16 / 9) / 2).toFixed(2) + ' ' + (0.5 - v.y / -v.z / th2 / 2).toFixed(2) : 'behind'
    }
    const sun = sunDir.clone().applyQuaternion(s.rotation)
    out.push(f + ' moon ' + scr(world.clone().sub(cam)) + (f <= 5024 ? ' sun ' + scr(sun) + ' planet ' + scr(s.origin.clone().sub(cam)) : ''))
  }
  const start = heading.clone().multiplyScalar(Math.cos(20 * RAD)).addScaledVector(spot, -Math.sin(20 * RAD))
  const endShot: any = director.shotAt(5024, 5024 / config.fps)
  const endSet = endShot.sets.find((x: any) => x.id === 'neptune')
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(endShot.camera.quaternion).applyQuaternion(endSet.rotation.clone().invert())
  const mm = out[1]!.match(/moon (-?[0-9.]+) (-?[0-9.]+)/)
  const seen = mm && Number(mm[1]) > 0.04 && Number(mm[1]) < 0.96 && Number(mm[2]) > 0.06 && Number(mm[2]) < 0.94
  if (args[4] === 'seen' && !seen) continue
  console.log('view turn ' + (fwd.angleTo(start) * DEG).toFixed(0) + ' phase ' + (d.angleTo(p.lightDir) * DEG).toFixed(0) + ' hold ' + (d.angleTo(hold) * DEG).toFixed(0))
  console.log('th ' + th + ' ph ' + ph + ' roll ' + roll + ' off ' + off.join(':') + ' elev ' + elev.toFixed(1) + ' azim ' + azim.toFixed(1) + '\n   ' + out.join(' | '))
}
