import * as THREE from 'three'
import { gradUniform } from '../../diagnostics/diag'
import { bufferFrame } from '../../core/frame'
import { FARSUN_FRAG, FARSUN_VERT, MAX_KNOTS, MAX_LOBES, MAX_LOOPS, MAX_STREAMERS, MAX_TONGUES } from './shader'
import look from './look.json'
import { FACE } from './face'
import { HOLD } from './hold'
import { loopsOff } from './share'

export { discShare, globeShare, wearShare } from './share'

export interface FarSunHold {
  map: THREE.Texture
  grade: THREE.Texture
  mapWidth: number
  limb: [number, number]
  rim: { color: [number, number, number]; width: number; power: number; by: [number, number, number, number] }
  boil: { reach: number; period: number; step: number; max: number; quiet: [number, number] }
  hot: { from: number; to: number; boost: number }
  pulse: { amount: number; rate: number; from: number; to: number }
  cell: { amount: number; rate: number; scale: number; fine: number }
  gas?: FarSunGas
}

export interface FarSunGas {
  corona: THREE.Texture
  coronaLook: { inner: number; outer: number; gain: number; edge: number; wave: { amount: number; scale: number; speed: number; sway: number }; drift: number; hide: { from: number; to: number; amount: number } }
  prominence: THREE.Texture
  flow: THREE.Texture
  prominenceLook: { half: number; plane: number; speed: number; period: number; surge: number }
  turn: THREE.Quaternion
  arcade?: { object: THREE.Object3D; draw(view: { time: number; camera: THREE.PerspectiveCamera; gain: number; vignette: number; aspect: number; height: number; wear: number }): void }
}

export interface FarSunView {
  camera: THREE.PerspectiveCamera
  centre: THREE.Vector3
  body: THREE.Quaternion
  spin: number
  time: number
  holdTime: number
  exposure: number
  burn: number
  vignette: number
  aspect: number
  height: number
}

const tri = new THREE.BufferGeometry()
tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
const UP = new THREE.Vector3(0, 1, 0)
const ONE = new THREE.Vector3(1, 1, 1)
const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

export const PARTS = { body: 1, corona: 2, loops: 4, glare: 8, all: 15 }

function faceTexture(): THREE.DataTexture {
  const raw = atob(FACE.data)
  const data = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i)
  const tex = new THREE.DataTexture(data, FACE.width, FACE.height, THREE.RedFormat, THREE.UnsignedByteType)
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.unpackAlignment = 1
  tex.needsUpdate = true
  return tex
}

function holdTexture(): THREE.DataTexture {
  const raw = atob(HOLD.data)
  const data = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i)
  const tex = new THREE.DataTexture(data, HOLD.width, HOLD.height, THREE.RGFormat, THREE.UnsignedByteType)
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.unpackAlignment = 1
  tex.needsUpdate = true
  return tex
}

export function holdFrame(spin: number): { eye: THREE.Vector3; axis: THREE.Vector3; x: THREE.Vector3; y: THREE.Vector3 } {
  const turn = (v: THREE.Vector3): THREE.Vector3 => v.applyAxisAngle(new THREE.Vector3(0, 1, 0), spin - look.spinAt)
  const eye = new THREE.Vector3().fromArray(HOLD.eye)
  const limb = 1 / Math.sqrt(eye.lengthSq() - 1)
  const axis = eye.clone().normalize().negate()
  const x = axis.clone().cross(new THREE.Vector3(0, 1, 0)).normalize()
  const y = x.clone().cross(axis)
  return { eye: turn(eye), axis: turn(axis), x: turn(x.divideScalar(limb)), y: turn(y.divideScalar(limb)) }
}

export function wornAt(burn: number): number {
  const { split, worn } = look.burn
  const b = Math.min(Math.max(burn, 0), 1)
  const held = b <= split ? 1 - (1 - worn.at) * Math.pow(b / split, worn.ease[0]!) : worn.at - worn.fall[0]! * Math.pow((b - split) / (1 - split), worn.ease[1]!) - worn.fall[1]! * Math.pow((b - split) / (1 - split), worn.ease[2]!)
  const t = Math.min(Math.max((b - worn.end[0]!) / (worn.end[1]! - worn.end[0]!), 0), 1)
  return held * (1 - t * t * (3 - 2 * t))
}

export function faceLaw(burn: number): { flat: number; power: number; plage: number } {
  const late = Math.min(Math.max((burn - look.burn.split) / (1 - look.burn.split), 0), 1)
  const between = (ends: number[]): number => (late < 1 ? ends[0]! + (ends[1]! - ends[0]!) * late : ends[1]!)
  return { flat: look.spots.flat[0]! * late, power: between(look.spots.power), plage: between(look.plage.gain) }
}

function strandLobes(by: THREE.Vector4[]): number[] {
  const at = by.map((l, i) => (l.w !== 0 ? i : -1)).filter((i) => i >= 0)
  return Array.from({ length: by.length }, (_, i) => at[i] ?? 0)
}

export class FarSun {
  readonly material: THREE.ShaderMaterial
  readonly mesh: THREE.Mesh
  readonly carry = new THREE.Group()
  private arcade: FarSunGas['arcade'] | null = null
  private eye: THREE.PerspectiveCamera | null = null
  private away = 1
  private readonly own: THREE.Mesh
  private readonly scene = new THREE.Scene()
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()
  private readonly spun = new THREE.Quaternion()
  private readonly v = new THREE.Vector3()
  parts = PARTS.all
  alone = false

  constructor() {
    const vec3s = (): THREE.Vector3[] => Array.from({ length: MAX_LOOPS }, () => new THREE.Vector3())
    const mid = vec3s()
    const along = vec3s()
    const up = vec3s()
    const shape = Array.from({ length: MAX_LOOPS }, () => new THREE.Vector4(1, 1, 1, 0))
    const rad = THREE.MathUtils.degToRad
    const z = new THREE.Vector3(0, 0, 1)
    look.loops.forEach((l, i) => {
      const angle = rad(l.at[0]!)
      const depth = rad(l.at[1]!)
      const c = new THREE.Vector3(Math.cos(angle) * Math.cos(depth), Math.sin(angle) * Math.cos(depth), Math.sin(depth))
      const t1 = new THREE.Vector3().crossVectors(z, c).normalize()
      const t2 = new THREE.Vector3().crossVectors(c, t1)
      const chord = t1.clone().multiplyScalar(Math.cos(rad(l.turn))).addScaledVector(t2, Math.sin(rad(l.turn)))
      const half = Math.tan(rad(l.span) / 2)
      const a = c.clone().addScaledVector(chord, -half).normalize()
      const b = c.clone().addScaledVector(chord, half).normalize()
      const centre = a.clone().add(b).multiplyScalar(0.5)
      const e = b.clone().sub(a)
      const halfChord = e.length() / 2
      e.normalize()
      const side = new THREE.Vector3().crossVectors(e, c).normalize()
      const lift = c.clone().addScaledVector(e, -c.dot(e)).normalize()
      const upward = lift.clone().multiplyScalar(Math.cos(l.lean)).addScaledVector(side, Math.sin(l.lean)).normalize()
      const spun = (p: THREE.Vector3): THREE.Vector3 => p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
      mid[i]!.copy(spun(centre))
      if (loopsOff.includes(i)) mid[i]!.set(0, 0, 1e4)
      along[i]!.copy(spun(e))
      up[i]!.copy(spun(upward))
      shape[i]!.set(halfChord, l.height, l.width, i * 1.37)
    })
    const lobes = Array.from({ length: MAX_LOBES }, () => new THREE.Vector4(0, 0, 1, 1))
    const lobesBy = Array.from({ length: MAX_LOBES }, () => new THREE.Vector4(0, 0, 1, 0))
    const knots = Array.from({ length: MAX_LOBES }, () => new THREE.Vector3(0, 1, 1))
    look.fringe.lobes.slice(0, MAX_LOBES).forEach((l, i) => {
      const la = rad(l.at[0]!)
      const ld = rad(l.at[1]!)
      const lc = new THREE.Vector3(Math.cos(la) * Math.cos(ld), Math.sin(la) * Math.cos(ld), Math.sin(ld)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
      lobes[i]!.set(lc.x, lc.y, lc.z, 1 / (rad(l.width) * rad(l.width)))
      lobesBy[i]!.set(l.gain, l.tall, l.reach, l.strands)
      const k = (l as { knot?: number[] }).knot
      if (k) knots[i]!.set(k[0]!, 1 / (rad(k[1]!) * rad(k[1]!)), k[2]!)
    })
    const tongueFoot = Array.from({ length: MAX_TONGUES }, () => new THREE.Vector4(0, 0, 1, 1))
    const tongueAxis = Array.from({ length: MAX_TONGUES }, () => new THREE.Vector4(0, 0, 1, 1))
    const tongueBy = Array.from({ length: MAX_TONGUES }, () => new THREE.Vector4(0, 1, 1, 1))
    const tongueStrand = Array.from({ length: MAX_TONGUES }, () => new THREE.Vector2(0, 1))
    const placed = (lon: number, lat: number): THREE.Vector3 => new THREE.Vector3(Math.cos(rad(lon)) * Math.cos(rad(lat)), Math.sin(rad(lon)) * Math.cos(rad(lat)), Math.sin(rad(lat))).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
    look.fringe.tongues.slice(0, MAX_TONGUES).forEach((t, i) => {
      const foot = placed(t.at[0]!, t.at[1]!)
      const axis = placed(t.tip[0]!, t.tip[1]!).multiplyScalar(1 + t.tip[2]!).sub(foot)
      const long = axis.length()
      axis.normalize()
      tongueFoot[i]!.set(foot.x, foot.y, foot.z, t.width)
      tongueAxis[i]!.set(axis.x, axis.y, axis.z, long)
      tongueBy[i]!.set(t.gain, t.taper, t.fine, t.sharp)
      tongueStrand[i]!.set(t.strand, t.fade)
    })
    const streamer = Array.from({ length: MAX_STREAMERS }, () => new THREE.Vector4(0, 0, 1, 1))
    const streamerBy = Array.from({ length: MAX_STREAMERS }, () => new THREE.Vector2(0, 1))
    ;(look.corona.streamers as { at: number[]; width: number; gain: number; scale: number }[]).slice(0, MAX_STREAMERS).forEach((t, i) => {
      const foot = placed(t.at[0]!, t.at[1]!)
      streamer[i]!.set(foot.x, foot.y, foot.z, 1 / (rad(t.width) * rad(t.width)))
      streamerBy[i]!.set(t.gain, t.scale)
    })
    const hairBy = (look.fringe as { hair?: { at: number[]; steps: number; top: number; way?: number; all?: number[]; tuft?: number[]; colour?: number[]; fine: number; sharp: number; thick: number; fan: number; curl: number[] } }).hair
    const sheet = new THREE.Vector4(0, 0, 1, 0)
    const hair = Array.from({ length: MAX_LOBES }, () => new THREE.Vector2(0, 0.1))
    if (hairBy) {
      const sa = rad(hairBy.at[0]!)
      const sd = rad(hairBy.at[1]!)
      const sc = new THREE.Vector3(Math.cos(sa) * Math.cos(sd), Math.sin(sa) * Math.cos(sd), Math.sin(sd)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
      sheet.set(sc.x, sc.y, sc.z, 0)
      look.fringe.lobes.slice(0, MAX_LOBES).forEach((l, i) => {
        const h = (l as { hair?: number[] }).hair
        if (h) hair[i]!.set(h[0]!, h[1]!)
      })
    }
    const knotAt = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(0, 0, 1, 1))
    const knotBy = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(0, 1, 0, 0.1))
    const knotRay = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(1, 1, 0.1, 0))
    const knotOut = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector2(1, 1))
    const knotLimb = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector2(1, 0))
    const knotAxis = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(0, 0, 1, 1))
    look.knot.at.slice(0, MAX_KNOTS).forEach((k, i) => {
      const ka = rad(k.at[0]!)
      const kd = rad(k.at[1]!)
      const kc = new THREE.Vector3(Math.cos(ka) * Math.cos(kd), Math.sin(ka) * Math.cos(kd), Math.sin(kd)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
      knotAt[i]!.set(kc.x, kc.y, kc.z, 1 / (k.width * k.width))
      knotBy[i]!.set(0, k.edge, 0, k.rays.radius)
      knotRay[i]!.set(k.rays.fine, k.rays.sharp, k.rays.reach, k.rays.cone)
      knotOut[i]!.set((k as { out?: number }).out ?? 1, (k as { body?: number }).body ?? 1)
      const kl = (k as { limb?: number[] }).limb
      if (kl) knotLimb[i]!.set(kl[0]!, kl[1]!)
      const lean = k.rays as { axis?: number[]; from?: number }
      const ac = lean.axis ? new THREE.Vector3(Math.cos(rad(lean.axis[0]!)) * Math.cos(rad(lean.axis[1]!)), Math.sin(rad(lean.axis[0]!)) * Math.cos(rad(lean.axis[1]!)), Math.sin(rad(lean.axis[1]!))).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt) : kc
      knotAxis[i]!.set(ac.x, ac.y, ac.z, lean.from ?? 1)
    })
    const loopGain = Array.from({ length: MAX_LOOPS }, (_, i) => (look.loops[i] as { gain?: number } | undefined)?.gain ?? 1)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: FARSUN_VERT, fragmentShader: FARSUN_FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uDepth: { value: 0 }, uProj: { value: new THREE.Vector4(1, 1, 0, 0) }, uCam: { value: new THREE.Matrix3() }, uBody: { value: new THREE.Matrix3() }, uCentre: { value: new THREE.Vector3(0, 0, -10) },
        uSpin: { value: 0 }, uTime: { value: 0 }, uHoldTime: { value: 0 }, uWear: { value: 0 }, uOpacity: { value: 1 }, uGain: { value: 1 }, uLens: { value: new THREE.Vector2(0, 16 / 9) }, uPixel: { value: 0.001 }, uGrad: gradUniform, uMaster: { value: 1 },
        uMap: { value: null }, uGrade: { value: null }, uMapOn: { value: 0 }, uMapWidth: { value: 8192 },
        uGasOn: { value: 0 }, uGasMap: { value: null }, uPromMap: { value: null }, uPromFlow: { value: null }, uGasTurn: { value: new THREE.Matrix3() }, uGasRange: { value: new THREE.Vector2(1, 2) },
        uGasBy: { value: new THREE.Vector3(1, 1, 0) }, uGasWave: { value: new THREE.Vector4() }, uGasHide: { value: new THREE.Vector3(0, 1, 0) }, uPromPlane: { value: new THREE.Vector4(1, 0, 1, 0) }, uPromMove: { value: new THREE.Vector3(0, 1, 0) },
        uHoldLimb: { value: new THREE.Vector2(1, 0) }, uHoldRim: { value: new THREE.Vector3() }, uHoldRimShape: { value: new THREE.Vector2(0.09, 2) }, uHoldRimBy: { value: new THREE.Vector4(0, 0, 0, 0) },
        uBoil: { value: new THREE.Vector4(0, 1, 0.01, 0) }, uQuiet: { value: new THREE.Vector2(0, 1) }, uHot: { value: new THREE.Vector3(1, 2, 0) }, uPulse: { value: new THREE.Vector4(0, 1, 0, 1) }, uCell: { value: new THREE.Vector4(0, 1, 1, 0) },
        uReach: { value: look.reach }, uLimbU: { value: new THREE.Vector3().fromArray(look.limb.u) }, uLimbV: { value: new THREE.Vector3().fromArray(look.limb.v) },
        uColour: { value: new THREE.Vector3().fromArray(look.body.colour) }, uBright: { value: 1 }, uHeat: { value: new THREE.Vector3().fromArray(look.body.heat) },
        uGrainScale: { value: new THREE.Vector3().fromArray(look.grain.scale) }, uGrainDepth: { value: new THREE.Vector3().fromArray(look.grain.depth) }, uGrainLife: { value: new THREE.Vector3().fromArray(look.grain.life) },
        uFace: { value: faceTexture() }, uFaceSize: { value: new THREE.Vector2(FACE.width, FACE.scale) }, uSpots: { value: new THREE.Vector4(look.spots.flat[0]!, look.spots.flat[1]!, look.spots.power[1]!, look.spots.gain) }, uSpotLook: { value: new THREE.Vector4(look.spots.bright[0]!, look.spots.bright[1]!, look.spots.limb, look.spots.flat[2]!) },
        uChromo: { value: new THREE.Vector4(look.chromosphere.height, look.chromosphere.gain, 0, 0) }, uChromoColour: { value: new THREE.Vector3().fromArray(look.chromosphere.colour) }, uSpicules: { value: new THREE.Vector2().fromArray(look.chromosphere.spicules) },
        uCorona: { value: new THREE.Vector4(look.corona.steps, look.corona.gain, look.corona.scale[0]!, look.corona.scale[1]!) }, uCoronaRays: { value: new THREE.Vector3(look.corona.rays[0]!, look.corona.rays[1]!, look.corona.far) },
        uCoronaFront: { value: look.corona.front }, uBurn: { value: new THREE.Vector4(1, 0, look.burn.fall, 0) }, uIrrColour: { value: new THREE.Vector3().fromArray(look.burn.colour) }, uHide: { value: new THREE.Vector2().fromArray(look.burn.hide) }, uWhite: { value: new THREE.Vector3(look.body.ceiling, look.body.ceiling, look.body.ceiling) }, uDesat: { value: new THREE.Vector3(look.burn.desat[0]!, look.burn.desat[1]!, 0) }, uHalo: { value: new THREE.Vector2(0, look.burn.tightFall) }, uHaloColour: { value: new THREE.Vector3().fromArray(look.burn.tightColour) },
        uFringe: { value: new THREE.Vector4(look.fringe.steps, look.fringe.top, look.fringe.gain, 0) }, uFringeShape: { value: new THREE.Vector4(look.fringe.height[0]!, look.fringe.height[1]!, look.fringe.scale, look.fringe.lean) }, uFringeColour: { value: new THREE.Vector3().fromArray(look.fringe.colour) }, uFringeLobe: { value: lobes }, uFringeLobeBy: { value: lobesBy }, uStrandLobe: { value: strandLobes(lobesBy) }, uStrandLobes: { value: lobesBy.filter((l) => l.w !== 0).length }, uTongueFoot: { value: tongueFoot }, uTongueAxis: { value: tongueAxis }, uTongueBy: { value: tongueBy }, uTongueStrand: { value: tongueStrand }, uTongues: { value: look.fringe.tongues.length }, uStreamer: { value: streamer }, uStreamerBy: { value: streamerBy }, uStreamers: { value: look.corona.streamers.length }, uStreamerRays: { value: look.corona.streamerRays }, uLoopGain: { value: loopGain }, uLoopRagged: { value: new Array<number>(MAX_LOOPS).fill(0) }, uLoopSheath: { value: Array.from({ length: MAX_LOOPS }, () => new THREE.Vector3(0, 1, 1)) }, uLoopRope: { value: Array.from({ length: MAX_LOOPS }, (_, i) => { const r = (look.loops[i] as { rope?: number[] } | undefined)?.rope; return new THREE.Vector3(r?.[0] ?? 1, r?.[1] ?? 0, r?.[2] ?? 0) }) }, uHaloEdge: { value: look.burn.edge }, uKeep: { value: new THREE.Vector4(0, 0, 0, look.burn.keep.top) }, uKeepFloor: { value: (look.burn.keep as { floor?: number }).floor ?? 0 }, uKeepSoft: { value: 1 }, uKeepWarm: { value: new THREE.Vector4().fromArray((look.burn.keep as { warm?: number[] }).warm ?? [0, 1, 0, 0]) }, uKeepWarmAt: { value: new THREE.Vector2().fromArray((look.burn.keep as { warmAt?: number[] }).warmAt ?? [0.35, 0.65]) }, uKeepCoarse: { value: new THREE.Vector3().fromArray((look.burn.keep as { coarse?: number[] }).coarse ?? [0, 1, 1]) }, uLimbGlow: { value: new THREE.Vector3(0, look.burn.limb[1]!, look.burn.limb[2] ?? 0) }, uHeatFloor: { value: look.spots.floor[0]! }, uPlage: { value: new THREE.Vector2(look.plage.gain[1]!, look.plage.scale) }, uLoopLook: { value: new THREE.Vector3(1, 0, 0) }, uPromPale: { value: new THREE.Vector3().fromArray(look.prominence.pale) }, uFringeKnot: { value: knots }, uKnot: { value: knotAt }, uKnotBy: { value: knotBy }, uKnotRay: { value: knotRay }, uKnotOut: { value: knotOut }, uKnotLimb: { value: knotLimb }, uKnotAxis: { value: knotAxis }, uKnotShade: { value: new THREE.Vector2().fromArray((look.knot as { shade?: number[] }).shade ?? [0, 0]) }, uKnotShadeColour: { value: new THREE.Vector3().fromArray(look.knot.shadeColour) }, uKnotClump: { value: new THREE.Vector3().fromArray((look.knot as { clump?: number[] }).clump ?? [0, 0.2, 0]) }, uKnotLight: { value: new THREE.Vector4(look.knot.colour[0]!, look.knot.colour[1]!, look.knot.colour[2]!, look.knot.steps) }, uCoronaRim: { value: new THREE.Vector4(look.corona.rim[0]!, look.corona.rim[1]!, look.corona.rim[2]!, look.corona.rimTop) }, uChromoBurn: { value: look.chromosphere.burn }, uFringeFan: { value: new THREE.Vector3(look.fringe.strand.fan, look.fringe.strand.fine, look.fringe.strand.sharp) }, uFringeSheet: { value: sheet }, uFringeHair: { value: hair }, uFringeHairBy: { value: new THREE.Vector4(hairBy?.fine ?? 60, hairBy?.sharp ?? 10, hairBy?.thick ?? 0, hairBy?.fan ?? 0) }, uFringeHairCurl: { value: new THREE.Vector3().fromArray(hairBy?.curl ?? [0, 6, 3]) }, uFringeHairTop: { value: new THREE.Vector3(hairBy?.steps ?? 1, hairBy?.top ?? 0.1, hairBy?.way ?? 0) }, uFringeHairAll: { value: new THREE.Vector2().fromArray(hairBy?.all ?? [0, 0.1]) }, uFringeHairTuft: { value: new THREE.Vector3().fromArray(hairBy?.tuft ?? [0, 1, 1]) }, uFringeHairColour: { value: new THREE.Vector3().fromArray(hairBy?.colour ?? look.fringe.colour) }, uGlareEnd: { value: (look.glare as { end?: number }).end ?? 0 }, uGlareSpread: { value: (look.glare as { spread?: number }).spread ?? 1.5 }, uFringeWay: { value: new THREE.Vector2().fromArray((look.fringe as { way?: number[] }).way ?? [0, 0]) }, uFringeSpike: { value: new THREE.Vector3().fromArray((look.fringe as { spike?: number[] }).spike ?? [40, 24, 8]) }, uFringeCurl: { value: new THREE.Vector3(look.fringe.strand.curl[0]!, look.fringe.strand.curl[1]!, look.fringe.strand.curl[2]!) }, uGlareInside: { value: look.glare.inside }, uCoronaNear: { value: new THREE.Vector3().fromArray(look.corona.near) }, uCoronaWide: { value: new THREE.Vector3().fromArray(look.corona.wide) },
        uProm: { value: new THREE.Vector4(look.prominence.steps, look.prominence.shell, look.prominence.gain, look.prominence.flow) }, uPromColour: { value: new THREE.Vector3().fromArray(look.prominence.colour) }, uPromHot: { value: new THREE.Vector3().fromArray(look.prominence.hot) },
        uLoopMid: { value: mid }, uLoopAlong: { value: along }, uLoopUp: { value: up }, uLoopShape: { value: shape }, uLoops: { value: Math.min(look.loops.length, MAX_LOOPS) },
        uGlare: { value: new THREE.Vector4(0, 0, look.glare.tight, look.glare.wide) }, uGlareColour: { value: new THREE.Vector3().fromArray(look.glare.colour) }, uParts: { value: PARTS.all },
        uHold: { value: holdTexture() }, uHoldEye: { value: new THREE.Vector3(0, 0, 5) }, uHoldAxis: { value: new THREE.Vector3(0, 0, -1) }, uHoldX: { value: new THREE.Vector3(1, 0, 0) }, uHoldY: { value: new THREE.Vector3(0, 1, 0) },
        uHoldBox: { value: new THREE.Vector4(HOLD.box[0], HOLD.box[1], 1 / (HOLD.box[2] - HOLD.box[0]), 1 / (HOLD.box[3] - HOLD.box[1])) }, uHoldBy: { value: new THREE.Vector4(0, 0, look.hold.edge[0]!, look.hold.edge[1]!) }, uHoldDepth: { value: look.hold.depth }, uHoldLoops: { value: look.hold.loops },
      },
    })
    this.mesh = new THREE.Mesh(tri, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 50
    this.carry.renderOrder = 51
    this.carry.matrixAutoUpdate = false
    this.carry.matrixWorldAutoUpdate = false
    this.mesh.add(this.carry)
    this.own = new THREE.Mesh(tri, this.material)
    this.own.frustumCulled = false
    this.scene.add(this.own)
  }

    wear(hold: FarSunHold | null): void {
    const u = this.material.uniforms
    u.uMapOn!.value = hold ? 1 : 0
    const gas = hold?.gas
    if (this.arcade && this.arcade.object.parent === this.carry) this.carry.remove(this.arcade.object)
    this.arcade = gas?.arcade ?? null
    u.uGasOn!.value = gas ? 1 : 0
    u.uGasMap!.value = gas?.corona ?? null
    u.uPromMap!.value = gas?.prominence ?? null
    u.uPromFlow!.value = gas?.flow ?? null
    if (gas) {
      const c = gas.coronaLook
      const p = gas.prominenceLook
      ;(u.uGasTurn!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(gas.turn))
      ;(u.uGasRange!.value as THREE.Vector2).set(c.inner, c.outer)
      ;(u.uGasBy!.value as THREE.Vector3).set(c.gain, Math.max(c.edge, 1e-6), c.drift)
      ;(u.uGasWave!.value as THREE.Vector4).set(c.wave.amount, c.wave.scale, c.wave.speed, c.wave.sway)
      ;(u.uGasHide!.value as THREE.Vector3).set(c.hide.from, c.hide.to, c.hide.amount)
      ;(u.uPromPlane!.value as THREE.Vector4).set(p.half, p.plane, 1, 0)
      ;(u.uPromMove!.value as THREE.Vector3).set(p.speed, p.period, p.surge)
    }
    if (!hold) {
      u.uMap!.value = null
      u.uGrade!.value = null
      return
    }
    u.uMap!.value = hold.map
    u.uGrade!.value = hold.grade
    u.uMapWidth!.value = hold.mapWidth
    ;(u.uHoldLimb!.value as THREE.Vector2).set(hold.limb[0], hold.limb[1])
    ;(u.uHoldRim!.value as THREE.Vector3).fromArray(hold.rim.color)
    ;(u.uHoldRimShape!.value as THREE.Vector2).set(hold.rim.width, hold.rim.power)
    ;(u.uHoldRimBy!.value as THREE.Vector4).fromArray(hold.rim.by)
    ;(u.uBoil!.value as THREE.Vector4).set(hold.boil.reach, hold.boil.period, hold.boil.step, hold.boil.max)
    ;(u.uQuiet!.value as THREE.Vector2).fromArray(hold.boil.quiet)
    ;(u.uHot!.value as THREE.Vector3).set(hold.hot.from, hold.hot.to, hold.hot.boost)
    ;(u.uPulse!.value as THREE.Vector4).set(hold.pulse.amount, hold.pulse.rate, hold.pulse.from, hold.pulse.to)
    ;(u.uCell!.value as THREE.Vector4).set(hold.cell.amount, hold.cell.rate, hold.cell.scale, hold.cell.fine)
  }

  set(view: FarSunView, opacity: number, depth: number): number {
    const u = this.material.uniforms
    const distance = view.centre.length()
    const p = view.camera.projectionMatrix.elements
    ;(u.uProj!.value as THREE.Vector4).set(p[0]!, p[5]!, p[8]!, p[9]!)
    ;(u.uCam!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(view.camera.quaternion))
    ;(u.uBody!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(view.body).invert()))
    ;(u.uCentre!.value as THREE.Vector3).copy(view.centre)
    u.uSpin!.value = view.spin
    u.uTime!.value = view.time
    u.uHoldTime!.value = view.holdTime
    const worn = u.uMapOn!.value > 0 ? wornAt(view.burn) : 0
    u.uWear!.value = worn
    const arcade = this.arcade
    if (arcade && worn > 0 && opacity > 0) {
      this.carry.matrixWorld.compose(view.centre, this.q.copy(view.body).multiply(this.spun.setFromAxisAngle(UP, view.spin)), ONE)
      if (arcade.object.parent !== this.carry) this.carry.add(arcade.object)
      this.carry.updateMatrixWorld(true)
      arcade.draw({ time: view.time, camera: view.camera, gain: 1 / view.exposure, vignette: view.vignette, aspect: view.aspect, height: view.height, wear: worn })
      this.eye = view.camera
      this.away = view.centre.length()
    } else {
      if (arcade && arcade.object.parent === this.carry) this.carry.remove(arcade.object)
      this.eye = null
    }
    u.uOpacity!.value = opacity
    u.uGain!.value = 1 / view.exposure
    ;(u.uLens!.value as THREE.Vector2).set(view.vignette, view.aspect)
    const master = bufferFrame()
    u.uMaster!.value = master
    u.uPixel!.value = (2 * master) / (p[5]! * view.height)
    const far = 1 - worn
    const from = (near: number, own: number): number => (far < 1 ? near + (own - near) * far : own)
    const gasWorn = look.corona.worn
    ;(u.uCorona!.value as THREE.Vector4).set(look.corona.steps, from(gasWorn.gain, look.corona.gain), from(gasWorn.scale[0]!, look.corona.scale[0]!), from(gasWorn.scale[1]!, look.corona.scale[1]!))
    ;(u.uCoronaNear!.value as THREE.Vector3).set(from(gasWorn.near[0]!, look.corona.near[0]!), from(gasWorn.near[1]!, look.corona.near[1]!), from(gasWorn.near[2]!, look.corona.near[2]!))
    ;(u.uCoronaWide!.value as THREE.Vector3).set(from(gasWorn.wide[0]!, look.corona.wide[0]!), from(gasWorn.wide[1]!, look.corona.wide[1]!), from(gasWorn.wide[2]!, look.corona.wide[2]!))
    const burnt = Math.pow(look.burn.gain, Math.min(Math.max(view.burn, 0), 1))
    u.uBright!.value = (look.body.bright[0]! + (look.body.bright[1]! - look.body.bright[0]!) * Math.min(Math.max(view.burn, 0) / look.burn.split, 1)) * burnt
    ;(u.uBurn!.value as THREE.Vector4).set(Math.pow(burnt, look.burn.gas), (look.burn.glow * (burnt - 1)) / (look.burn.gain - 1), look.burn.fall, Math.min(Math.max(view.burn, 0) * 2, 1) * far)
    const burn = Math.min(Math.max(view.burn, 0), 1)
    ;(u.uDesat!.value as THREE.Vector3).z = burn
    const keep = look.burn.keep.gain * burn
    u.uHeatFloor!.value = look.spots.floor[0]! + (look.spots.floor[1]! - look.spots.floor[0]!) * burn
    const face = faceLaw(burn)
    const spots = u.uSpots!.value as THREE.Vector4
    spots.x = face.flat
    spots.z = face.power
    ;(u.uPlage!.value as THREE.Vector2).x = face.plage
    const gains = u.uLoopGain!.value as number[]
    const ragged = u.uLoopRagged!.value as number[]
    const sheath = u.uLoopSheath!.value as THREE.Vector3[]
    look.loops.slice(0, MAX_LOOPS).forEach((l, i) => {
      const by = l as { gain?: number; burn?: number; ragged?: number; sheath?: number[] }
      gains[i] = (by.gain ?? 1) * Math.pow(burnt, by.burn ?? look.prominence.burn) * from(look.prominence.worn[0]!, 1)
      ragged[i] = (by.ragged ?? 0) * burn
      sheath[i]!.set((by.sheath?.[0] ?? 0) * burn, by.sheath?.[1] ?? 1, by.sheath?.[2] ?? 1)
    })
    ;(u.uPromHot!.value as THREE.Vector3).set(from(look.prominence.wornHot[0]!, look.prominence.hot[0]!), from(look.prominence.wornHot[1]!, look.prominence.hot[1]!), from(look.prominence.wornHot[2]!, look.prominence.hot[2]!))
    ;(u.uLoopLook!.value as THREE.Vector3).set((1 - (1 - look.prominence.thin) * burn) * from(look.prominence.worn[1]!, 1), look.prominence.broken * burn, look.prominence.paleBy * burn)
    const knotBy = u.uKnotBy!.value as THREE.Vector4[]
    look.knot.at.slice(0, MAX_KNOTS).forEach((k, i) => {
      knotBy[i]!.x = (k.gain * (burnt - 1)) / (look.burn.gain - 1)
      knotBy[i]!.z = (k.rays.gain * (burnt - 1)) / (look.burn.gain - 1)
    })
    ;(u.uLimbGlow!.value as THREE.Vector3).x = look.burn.limb[0]! * burn
    u.uKeepSoft!.value = 1 + ((look.burn.keep as { soft?: number }).soft ?? 0) * burn
    ;(u.uKeepWarm!.value as THREE.Vector4).x = ((look.burn.keep as { warm?: number[] }).warm?.[0] ?? 0) * burn
    ;(u.uKeep!.value as THREE.Vector4).set(keep * look.burn.keep.tint[0]!, keep * look.burn.keep.tint[1]!, keep * look.burn.keep.tint[2]!, look.burn.keep.top)
    ;(u.uFringe!.value as THREE.Vector4).z = look.fringe.gain * far
    ;(u.uWhite!.value as THREE.Vector3).set(look.body.ceiling + (look.burn.white[0]! - look.body.ceiling) * burn, look.body.ceiling + (look.burn.white[1]! - look.body.ceiling) * burn, look.body.ceiling + (look.burn.white[2]! - look.body.ceiling) * burn)
    ;(u.uHalo!.value as THREE.Vector2).x = (look.burn.tight * (burnt - 1)) / (look.burn.gain - 1)
    ;(u.uGlare!.value as THREE.Vector4).x = look.glare.gain[0]! + (look.glare.gain[1]! - look.glare.gain[0]!) * far
    const frame = holdFrame(view.spin)
    ;(u.uHoldEye!.value as THREE.Vector3).copy(frame.eye)
    ;(u.uHoldAxis!.value as THREE.Vector3).copy(frame.axis)
    ;(u.uHoldX!.value as THREE.Vector3).copy(frame.x)
    ;(u.uHoldY!.value as THREE.Vector3).copy(frame.y)
    const marked = ((burnt - 1) / (look.burn.gain - 1)) * far
    ;(u.uHoldBy!.value as THREE.Vector4).set((look.hold.face * marked) / HOLD.face, (look.hold.gas * marked) / HOLD.gas, look.hold.edge[0]!, look.hold.edge[1]!)
    u.uParts!.value = this.parts
    u.uDepth!.value = depth
    return distance
  }

  depthOf(view: FarSunView): number {
    const front = Math.max(view.centre.length() - 1.02, view.camera.near * 1.001)
    this.v.set(0, 0, -front).applyMatrix4(view.camera.projectionMatrix)
    return Math.min(Math.max(this.v.z, -1), 1)
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget): void {
    this.material.depthTest = false
    renderer.setRenderTarget(target)
    renderer.render(this.scene, flat)
    const eye = this.eye
    if (eye && this.arcade && this.arcade.object.parent === this.carry) {
      const near = eye.near
      const far = eye.far
      const clear = renderer.autoClear
      const gl = renderer.getContext()
      const front = this.away - look.reach
      eye.near = front > 0 ? front : near
      eye.far = this.away + look.reach
      eye.updateProjectionMatrix()
      renderer.autoClear = false
      gl.depthRange(0, 0)
      renderer.render(this.carry, eye)
      gl.depthRange(0, 1)
      renderer.autoClear = clear
      eye.near = near
      eye.far = far
      eye.updateProjectionMatrix()
    }
  }

  dispose(): void {
    this.material.dispose()
  }
}

export const farSun = new FarSun()
