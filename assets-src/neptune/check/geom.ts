import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'
const p = plan as any
const DEG = 180 / Math.PI
const RAD = Math.PI / 180
const seg = plan.seg.rise
const centre = seg.start + (plan.coverCenter(seg) - seg.start)
const tq = plan.turn(centre)
const spot = p.spot.clone().applyQuaternion(tq) as THREE.Vector3
const heading = p.heading.clone().applyQuaternion(tq) as THREE.Vector3
const right = new THREE.Vector3().crossVectors(heading, spot).normalize()
const hold = plan.holdPos.clone().normalize()
const sun = plan.sunDir.clone()
const up = new THREE.Vector3().crossVectors(sun, new THREE.Vector3(0, 1, 0)).normalize()
const back = sun.clone().applyAxisAngle(up, 44 * RAD).multiplyScalar(-1)
const lat = (v: THREE.Vector3) => Math.asin(v.y) * DEG
const lon = (v: THREE.Vector3) => Math.atan2(v.x, v.z) * DEG
const line = (name: string, d: THREE.Vector3) => {
  const view = d.clone().negate()
  const start = heading.clone().multiplyScalar(Math.cos(20 * RAD)).addScaledVector(spot, -Math.sin(20 * RAD))
  console.log(name.padEnd(16), 'elev', (lat(d) - lat(hold)).toFixed(1).padStart(6), 'azim', (((lon(d) - lon(hold) + 540) % 360) - 180).toFixed(1).padStart(7), ' spot', (d.angleTo(spot) * DEG).toFixed(0).padStart(3), ' phase', (d.angleTo(plan.lightDir) * DEG).toFixed(0).padStart(4), ' to lookback', (d.angleTo(back) * DEG).toFixed(0).padStart(4), ' hold', (d.angleTo(hold) * DEG).toFixed(0).padStart(3), ' view turn', (view.angleTo(start) * DEG).toFixed(0).padStart(3))
}
console.log('cover centre', centre.toFixed(3), 'frame', (centre * config.fps).toFixed(1))
line('now', plan.exitPose(seg.end).position.clone().normalize())
line('hold', hold)
const ths = process.argv[2] ? process.argv[2].split(',').map(Number) : [30, 40, 50, 60]
const phs = process.argv[3] ? process.argv[3].split(',').map(Number) : [-60, -30, 0, 30, 60]
for (const th of ths) for (const ph of phs) {
  const d = spot.clone().multiplyScalar(Math.cos(th * RAD)).addScaledVector(heading, -Math.sin(th * RAD) * Math.cos(ph * RAD)).addScaledVector(right, -Math.sin(th * RAD) * Math.sin(ph * RAD))
  line('th ' + th + ' ph ' + ph, d)
}
