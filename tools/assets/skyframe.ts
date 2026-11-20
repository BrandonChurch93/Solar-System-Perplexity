import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const a = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, '').split('=')))
const stop = a.stop ?? 'mars'
const along = THREE.MathUtils.degToRad(Number(a.along ?? 140))
const tilt = THREE.MathUtils.degToRad(Number(a.tilt ?? -18))
const lift = THREE.MathUtils.degToRad(Number(a.lift ?? 0))
const pole = new THREE.Vector3(-0.44023326, -0.81460296, -0.37764626).normalize()
const center = new THREE.Vector3(-0.41465582, -0.25249158, 0.87424742)
const t1 = center.clone().addScaledVector(pole, -center.dot(pole)).normalize()
const t2 = new THREE.Vector3().crossVectors(pole, t1)
const onBand = t1.clone().multiplyScalar(Math.cos(along)).addScaledVector(t2, Math.sin(along))
const tangent = t1.clone().multiplyScalar(-Math.sin(along)).addScaledVector(t2, Math.cos(along))
const aim = onBand.clone().multiplyScalar(Math.cos(lift)).addScaledVector(pole, Math.sin(lift)).normalize()
const flat = tangent.clone()
const upFlat = new THREE.Vector3().crossVectors(flat, aim).negate().normalize()
const right = flat.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(upFlat, Math.sin(tilt)).normalize()
const up = new THREE.Vector3().crossVectors(aim.clone().negate(), right).normalize()
const s = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, aim.clone().negate()))
const director = new FilmDirector(plans)
const seg = config.segments.find((x) => x.id === stop + '.hold')!
const frame = Math.floor((seg.firstFrame + seg.endFrame) / 2)
const shot = director.shotAt(frame, frame / config.fps)
const f = s.clone().multiply(shot.camera.quaternion.clone().invert())
writeFileSync('src/space/skyframe.json', JSON.stringify({ quaternion: f.toArray().map((x) => Number(x.toFixed(7))), grade: { tint: [Number(a.r ?? 1.1), Number(a.g ?? 1.4), Number(a.b ?? 1.8)], gamma: Number(a.gamma ?? 1.7), grain: Number(a.grain ?? 0.8) }, fitted: { stop, frame, alongDeg: Number(a.along ?? 150), tiltDeg: Number(a.tilt ?? -12), liftDeg: Number(a.lift ?? 0) } }, null, 1) + '\n')
console.log('sky frame', f.toArray(), 'from frame', frame)
