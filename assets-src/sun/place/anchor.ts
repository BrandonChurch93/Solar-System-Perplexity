import * as THREE from 'three'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
// The anchor's numbers (MAIL 1268 point 3): where the place stands on the globe and in the stage, and the frame in
// which the globe lays a picture about it (globe.ts: uSpotN, uSpotE, uSpotU; g = (d.E, d.U) / d.N for a unit d from
// the ball's centre in the map's frame).
const f = (v: THREE.Vector3 | THREE.Quaternion): string => v.toArray().map((x) => x.toFixed(6)).join(', ')
const spot = plan.normal.clone().normalize()
const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
const north = spot.clone().cross(east)
const tq = plan.turn(plan.anchorTime)
console.log('anchor time', plan.anchorTime.toFixed(6), 's')
console.log('map frame: N', f(spot), '| E', f(east), '| U', f(north))
console.log('turn at the anchor time (map frame to globe frame)', f(tq))
console.log('toStage (globe frame at the anchor time to stage)', f(plan.toStage))
console.log('stage centre', f(stage.centre), 'radius', stage.radius)
const toS = (v: THREE.Vector3): THREE.Vector3 => v.clone().applyQuaternion(tq).applyQuaternion(plan.toStage)
console.log('stage frame: N', f(toS(spot)), '| E', f(toS(east)), '| U', f(toS(north)))
console.log('the anchor on the stage ball', f(toS(spot).multiplyScalar(stage.radius).add(stage.centre)))
