import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import * as look from '../../src/stops/neptune/look'

const d = new FilmDirector(plans)
const n = plans[plans.length - 1]!
const DEG = 180 / Math.PI
const seg = config.segments.find((x) => x.id === 'ending.retreat')!
const s = d.shotAt(seg.firstFrame, seg.start)
const st = s.sets[0]!
const inv = st.rotation.clone().invert()
const S = s.sun.dir.clone().applyQuaternion(inv)
const v = (x: THREE.Vector3): string => x.toArray().map((y) => y.toFixed(4)).join(' ')
console.log('sun local from world', v(S), 'plan.sunDir', v(n.sunDir), 'plan.lightDir', v(n.lightDir), 'angle sunDir/world', (S.angleTo(n.sunDir) * DEG).toFixed(4), 'light/world', (S.angleTo(n.lightDir) * DEG).toFixed(4))
const a = n.exitPose(seg.start)
const a2 = n.exitPose(seg.start + 1)
const A = a.position.clone().normalize()
console.log('exit pos', v(a.position), 'len', a.position.length().toFixed(4), 'vel', v(a2.position.clone().sub(a.position)), 'radial share', a2.position.clone().sub(a.position).normalize().dot(A).toFixed(4), 'fov', a.vfov)
console.log('phase at exit', (A.angleTo(S) * DEG).toFixed(2))
const N = new THREE.Vector3().crossVectors(A, S.clone().negate()).normalize()
const E1 = S.clone().negate()
const E2 = A.clone().addScaledVector(E1, -A.dot(E1)).normalize()
const E3 = new THREE.Vector3().crossVectors(E1, E2)
const comp = (x: THREE.Vector3): string => 'antiSun ' + x.dot(E1).toFixed(3) + ' exitSide ' + x.dot(E2).toFixed(3) + ' normal ' + x.dot(E3).toFixed(3)
const T = new THREE.Vector3().fromArray(look.triton.stage)
console.log('triton', v(T), 'len', T.length().toFixed(3), comp(T), 'angle to sun', (T.angleTo(S) * DEG).toFixed(1), 'azimuth from exit side', (Math.atan2(T.dot(E3), T.dot(E2)) * DEG).toFixed(1))
console.log('exit', comp(a.position))
const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(a.quaternion)
const up = new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion)
console.log('exit fw', comp(fw), 'up', comp(up))
console.log('ring normal', comp(new THREE.Vector3().fromArray(look.ring.normal).normalize()), 'spin axis', comp(n.axis), 'N', v(N))
const lb = config.segments.find((x) => x.id === 'ending.lookback')!
const b = d.shotAt(lb.firstFrame + 90, (lb.firstFrame + 90) / config.fps)
const bp = b.camera.position.clone().sub(st.origin).applyQuaternion(inv)
console.log('old lookback pos', comp(bp), 'len', bp.length().toFixed(3))
console.log('ending sky turn', d.sky.orbits[config.endingId]!.toArray().join(','))
console.log('old lookback quat world', b.camera.quaternion.toArray().join(','))
