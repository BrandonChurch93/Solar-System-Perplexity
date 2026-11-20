import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

export interface SkyAimArgs {
  stop: string
  along: number
  tilt: number
  lift: number
  tstop: string
  talong: number
  ttilt: number
  tlift: number
}

export interface SkyAim {
  quaternion: number[]
  turns: Record<string, number[]>
  patches: Record<string, { orbit: number[]; terrain: number[] }>
  frame: number
  terrainFrame: number
}

const pole = new THREE.Vector3(-0.44023326, -0.81460296, -0.37764626).normalize()
const center = new THREE.Vector3(-0.41465582, -0.25249158, 0.87424742)

export function aimAt(alongDeg: number, tiltDeg: number, liftDeg: number): THREE.Quaternion {
  const along = THREE.MathUtils.degToRad(alongDeg)
  const tilt = THREE.MathUtils.degToRad(tiltDeg)
  const lift = THREE.MathUtils.degToRad(liftDeg)
  const t1 = center.clone().addScaledVector(pole, -center.dot(pole)).normalize()
  const t2 = new THREE.Vector3().crossVectors(pole, t1)
  const onBand = t1.clone().multiplyScalar(Math.cos(along)).addScaledVector(t2, Math.sin(along))
  const tangent = t1.clone().multiplyScalar(-Math.sin(along)).addScaledVector(t2, Math.cos(along))
  const aim = onBand.clone().multiplyScalar(Math.cos(lift)).addScaledVector(pole, Math.sin(lift)).normalize()
  const upFlat = new THREE.Vector3().crossVectors(tangent, aim).negate().normalize()
  const right = tangent.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(upFlat, Math.sin(tilt)).normalize()
  const up = new THREE.Vector3().crossVectors(aim.clone().negate(), right).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, aim.clone().negate()))
}

function midFrame(id: string): number {
  const seg = config.segments.find((x) => x.id === id)
  if (!seg) throw new Error('no segment ' + id)
  return Math.floor((seg.firstFrame + seg.endFrame) / 2)
}

const round = (q: THREE.Quaternion): number[] => q.toArray().map((x) => Number(x.toFixed(7)))

export function skyAim(args: SkyAimArgs): SkyAim {
  const director = new FilmDirector(plans)
  const frame = midFrame(args.stop + '.hold')
  const cam = director.shotAt(frame, frame / config.fps).camera.quaternion.clone()
  const f = aimAt(args.along, args.tilt, args.lift).multiply(cam.invert())
  const terrainFrame = midFrame(args.tstop + '.terrain')
  const tcam = director.shotAt(terrainFrame, terrainFrame / config.fps).camera.quaternion.clone()
  const turn = tcam.multiply(aimAt(args.talong, args.ttilt, args.tlift).invert()).multiply(f)
  const patches = { [args.stop]: { orbit: round(aimAt(args.along, args.tilt, args.lift)), terrain: round(aimAt(args.talong, args.ttilt, args.tlift)) } }
  return { quaternion: round(f), turns: { [args.tstop]: round(turn) }, patches, frame, terrainFrame }
}
