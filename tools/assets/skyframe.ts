import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const a = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, '').split('=')))
const stop = a.stop ?? 'mars'
const pole = new THREE.Vector3(-0.44023326, -0.81460296, -0.37764626).normalize()
const center = new THREE.Vector3(-0.41465582, -0.25249158, 0.87424742)
function aimAt(alongDeg: number, tiltDeg: number, liftDeg: number): THREE.Quaternion {
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
const along = Number(a.along ?? 158)
const tilt = Number(a.tilt ?? -8)
const lift = Number(a.lift ?? 2)
const s = aimAt(along, tilt, lift)
const director = new FilmDirector(plans)
const seg = config.segments.find((x) => x.id === stop + '.hold')!
const frame = Math.floor((seg.firstFrame + seg.endFrame) / 2)
const shot = director.shotAt(frame, frame / config.fps)
const f = s.clone().multiply(shot.camera.quaternion.clone().invert())
const terrain = { stop: a.tstop ?? 'mars', alongDeg: Number(a.talong ?? 60), tiltDeg: Number(a.ttilt ?? 0), liftDeg: Number(a.tlift ?? 33) }
const tseg = config.segments.find((x) => x.id === terrain.stop + '.terrain')!
const tframe = Math.floor((tseg.firstFrame + tseg.endFrame) / 2)
const tcam = director.shotAt(tframe, tframe / config.fps).camera.quaternion.clone()
const turn = tcam.multiply(aimAt(terrain.alongDeg, terrain.tiltDeg, terrain.liftDeg).invert()).multiply(f)
const round = (q: THREE.Quaternion): number[] => q.toArray().map((x) => Number(x.toFixed(7)))
writeFileSync('src/space/skyframe.json', JSON.stringify({ quaternion: round(f), turns: { [terrain.stop]: round(turn) }, grade: { tint: [Number(a.r ?? 0.95), Number(a.g ?? 1.38), Number(a.b ?? 1.6)], gamma: Number(a.gamma ?? 1.7), floor: [Number(a.fr ?? 0.004), Number(a.fg ?? 0.008), Number(a.fb ?? 0.011)] }, band: { repeats: Number(a.repeats ?? 2), offsetDeg: Number(a.boffset ?? 0), latSpanDeg: Number(a.blat ?? 33.75), fadeStart: Number(a.bfade ?? 0.34), gain: Number(a.bgain ?? 1), gamma: Number(a.bgamma ?? 1.3), regionRef: Number(a.bregion ?? 0.1), offGain: Number(a.boff ?? 0.6), tint: [Number(a.br ?? 1), Number(a.bg ?? 1), Number(a.bb ?? 1)], saturation: Number(a.bsat ?? 1), crowdRef: Number(a.bcrowd ?? 0.016), crowdLod: Number(a.blod ?? 2), terrainGain: Number(a.btgain ?? 1), cleanRadius: Number(a.bclean ?? 0), cleanKeep: Number(a.bkeep ?? 1), cleanBlur: Number(a.bblur ?? 1), widen: Number(a.bwiden ?? 1), fadeEnd: Number(a.bfadeend ?? 0.49) }, stars: { brightness: Number(a.sbright ?? 0.012), slope: Number(a.sslope ?? 1), countScale: Number(a.scount ?? 1), bandWidth: Number(a.swidth ?? 0.2), halo: Number(a.shalo ?? 0.35), floor: Number(a.sfloor ?? 0.3), micro: Number(a.smicro ?? 0), microWidth: Number(a.smwidth ?? 0.1), microBright: Number(a.smbright ?? 0.003), vivid: Number(a.svivid ?? 0.2), core: Number(a.score ?? 0.55), terrainGain: Number(a.stgain ?? 1), terrainCrowd: Number(a.stcrowd ?? 0.25) }, fitted: { stop, frame, alongDeg: along, tiltDeg: tilt, liftDeg: lift, terrain: { ...terrain, frame: tframe } } }, null, 1) + '\n')
console.log('sky frame', round(f), 'from frame', frame, 'terrain turn', round(turn), 'from frame', tframe)
