import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/uranus/plan'
import * as look from '../../../src/stops/uranus/look'
import fit from '../../../src/stops/uranus/fit.json'

const frame = Number(process.argv[2])
const size = Number(process.argv[3])
const out = process.argv[4]!
const reach = THREE.MathUtils.degToRad(look.face.reachDeg)
const director = new FilmDirector(plans)
const time = (frame + 0.25) / config.fps
const shot = director.shotAt(frame, time)
const set = shot.sets.find((s) => s.id === 'uranus')!
const inv = set.rotation.clone().invert()
const camera = new THREE.PerspectiveCamera(shot.camera.vfov, 16 / 9, 0.01, 1000)
camera.position.copy(shot.camera.position).sub(set.origin).applyQuaternion(inv)
camera.quaternion.copy(inv).multiply(shot.camera.quaternion)
camera.updateMatrixWorld(true)
camera.updateProjectionMatrix()

const shape = new THREE.Group()
shape.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3().fromArray(look.shape.axis).normalize())
shape.scale.set(look.shape.polar, look.shape.equator, look.shape.equator)
shape.position.fromArray(look.shape.center)
const upright = new THREE.Group()
upright.quaternion.copy(shape.quaternion).invert()
const mesh = new THREE.Group()
mesh.quaternion.fromArray(fit.globe.quaternion)
upright.add(mesh)
shape.add(upright)
shape.updateMatrixWorld(true)

const spin = plan.spin(time)
const elapsed = time - plan.holdMid
const k = look.globe.bandRate
const centre = new THREE.Vector3().fromArray(look.face.centre).normalize()
const east = new THREE.Vector3(0, 1, 0).cross(centre).normalize()
const up = centre.clone().cross(east)
const radius = 2 * Math.sin(reach / 2)
const data = new Float32Array(size * size * 3)
const d = new THREE.Vector3()
const p = new THREE.Vector3()
const n = new THREE.Vector3()
const eye = camera.position.clone()
const normal = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
for (let j = 0; j < size; j++) {
  for (let i = 0; i < size; i++) {
    const x = ((i + 0.5) / size * 2 - 1) * radius
    const y = (1 - (j + 0.5) / size * 2) * radius
    const rho = Math.hypot(x, y)
    const at = (j * size + i) * 3
    if (rho >= 2) { data[at] = -1; data[at + 1] = -1; data[at + 2] = -1; continue }
    const theta = 2 * Math.asin(rho / 2)
    d.copy(centre).multiplyScalar(Math.cos(theta)).addScaledVector(east, Math.sin(theta) * x / Math.max(rho, 1e-9)).addScaledVector(up, Math.sin(theta) * y / Math.max(rho, 1e-9))
    const lat = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))
    const a = -(spin + elapsed * (k[0] + k[1] * Math.sin(k[2] * lat + k[3])))
    const c = Math.cos(a), s = Math.sin(a)
    p.set(c * d.x - s * d.z, d.y, s * d.x + c * d.z)
    n.copy(p).applyMatrix3(normal).normalize()
    p.applyMatrix4(mesh.matrixWorld)
    const mu = n.dot(eye.clone().sub(p).normalize())
    p.project(camera)
    data[at] = (p.x * 0.5 + 0.5) * 1920
    data[at + 1] = (0.5 - p.y * 0.5) * 1080
    data[at + 2] = mu
  }
}
writeFileSync(out, Buffer.from(data.buffer))
console.log(frame, 'spin', spin.toFixed(4), 'elapsed', elapsed.toFixed(3), 'vfov', shot.camera.vfov.toFixed(3), 'radius', radius.toFixed(4))
