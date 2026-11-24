import * as THREE from 'three'
import { gradUniform } from '../../diagnostics/diag'
import { bufferFrame } from '../../core/frame'
import { FARSUN_FRAG, FARSUN_VERT, MAX_KNOTS, MAX_LOBES, MAX_LOOPS } from './shader'
import look from './look.json'
import { FACE } from './face'
import { loopsOff, wearShare } from './share'

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

export class FarSun {
  readonly material: THREE.ShaderMaterial
  readonly mesh: THREE.Mesh
  private readonly own: THREE.Mesh
  private readonly scene = new THREE.Scene()
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()
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
    const knotAt = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(0, 0, 1, 1))
    const knotBy = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(0, 1, 0, 0.1))
    const knotRay = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector4(1, 1, 0.1, 0))
    const knotOut = Array.from({ length: MAX_KNOTS }, () => new THREE.Vector2(1, 1))
    look.knot.at.slice(0, MAX_KNOTS).forEach((k, i) => {
      const ka = rad(k.at[0]!)
      const kd = rad(k.at[1]!)
      const kc = new THREE.Vector3(Math.cos(ka) * Math.cos(kd), Math.sin(ka) * Math.cos(kd), Math.sin(kd)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -look.spinAt)
      knotAt[i]!.set(kc.x, kc.y, kc.z, 1 / (k.width * k.width))
      knotBy[i]!.set(0, k.edge, 0, k.rays.radius)
      knotRay[i]!.set(k.rays.fine, k.rays.sharp, k.rays.reach, k.rays.cone)
      knotOut[i]!.set((k as { out?: number }).out ?? 1, (k as { body?: number }).body ?? 1)
    })
    const loopGain = Array.from({ length: MAX_LOOPS }, (_, i) => (look.loops[i] as { gain?: number } | undefined)?.gain ?? 1)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: FARSUN_VERT, fragmentShader: FARSUN_FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uDepth: { value: 0 }, uProj: { value: new THREE.Vector4(1, 1, 0, 0) }, uCam: { value: new THREE.Matrix3() }, uBody: { value: new THREE.Matrix3() }, uCentre: { value: new THREE.Vector3(0, 0, -10) },
        uSpin: { value: 0 }, uTime: { value: 0 }, uHoldTime: { value: 0 }, uWear: { value: 0 }, uOpacity: { value: 1 }, uGain: { value: 1 }, uLens: { value: new THREE.Vector2(0, 16 / 9) }, uPixel: { value: 0.001 }, uGrad: gradUniform, uMaster: { value: 1 },
        uMap: { value: null }, uGrade: { value: null }, uMapOn: { value: 0 }, uMapWidth: { value: 8192 },
        uHoldLimb: { value: new THREE.Vector2(1, 0) }, uHoldRim: { value: new THREE.Vector3() }, uHoldRimShape: { value: new THREE.Vector2(0.09, 2) }, uHoldRimBy: { value: new THREE.Vector4(0, 0, 0, 0) },
        uBoil: { value: new THREE.Vector4(0, 1, 0.01, 0) }, uQuiet: { value: new THREE.Vector2(0, 1) }, uHot: { value: new THREE.Vector3(1, 2, 0) }, uPulse: { value: new THREE.Vector4(0, 1, 0, 1) }, uCell: { value: new THREE.Vector4(0, 1, 1, 0) },
        uReach: { value: look.reach }, uLimbU: { value: new THREE.Vector3().fromArray(look.limb.u) }, uLimbV: { value: new THREE.Vector3().fromArray(look.limb.v) },
        uColour: { value: new THREE.Vector3().fromArray(look.body.colour) }, uBright: { value: 1 }, uHeat: { value: new THREE.Vector3().fromArray(look.body.heat) },
        uGrainScale: { value: new THREE.Vector3().fromArray(look.grain.scale) }, uGrainDepth: { value: new THREE.Vector3().fromArray(look.grain.depth) }, uGrainLife: { value: new THREE.Vector3().fromArray(look.grain.life) },
        uFace: { value: faceTexture() }, uFaceSize: { value: new THREE.Vector2(FACE.width, FACE.scale) }, uSpots: { value: new THREE.Vector4(0, 0, look.spots.power, look.spots.gain) }, uSpotLook: { value: new THREE.Vector4(look.spots.bright[0]!, look.spots.bright[1]!, look.spots.limb, 0) },
        uChromo: { value: new THREE.Vector4(look.chromosphere.height, look.chromosphere.gain, 0, 0) }, uChromoColour: { value: new THREE.Vector3().fromArray(look.chromosphere.colour) }, uSpicules: { value: new THREE.Vector2().fromArray(look.chromosphere.spicules) },
        uCorona: { value: new THREE.Vector4(look.corona.steps, look.corona.gain, look.corona.scale[0]!, look.corona.scale[1]!) }, uCoronaRays: { value: new THREE.Vector3(look.corona.rays[0]!, look.corona.rays[1]!, look.corona.far) },
        uCoronaFront: { value: look.corona.front }, uBurn: { value: new THREE.Vector4(1, 0, look.burn.fall, 0) }, uIrrColour: { value: new THREE.Vector3().fromArray(look.burn.colour) }, uHide: { value: new THREE.Vector2().fromArray(look.burn.hide) }, uWhite: { value: new THREE.Vector3(look.body.ceiling, look.body.ceiling, look.body.ceiling) }, uDesat: { value: new THREE.Vector3(look.burn.desat[0]!, look.burn.desat[1]!, 0) }, uHalo: { value: new THREE.Vector2(0, look.burn.tightFall) }, uHaloColour: { value: new THREE.Vector3().fromArray(look.burn.tightColour) },
        uFringe: { value: new THREE.Vector4(look.fringe.steps, look.fringe.top, look.fringe.gain, 0) }, uFringeShape: { value: new THREE.Vector4(look.fringe.height[0]!, look.fringe.height[1]!, look.fringe.scale, look.fringe.lean) }, uFringeColour: { value: new THREE.Vector3().fromArray(look.fringe.colour) }, uFringeLobe: { value: lobes }, uFringeLobeBy: { value: lobesBy }, uLoopGain: { value: loopGain }, uLoopRagged: { value: new Array<number>(MAX_LOOPS).fill(0) }, uHaloEdge: { value: look.burn.edge }, uKeep: { value: new THREE.Vector4(0, 0, 0, look.burn.keep.top) }, uLimbGlow: { value: new THREE.Vector2(0, look.burn.limb[1]!) }, uHeatFloor: { value: look.spots.floor[0]! }, uPlage: { value: new THREE.Vector2(look.plage.gain, look.plage.scale) }, uLoopLook: { value: new THREE.Vector3(1, 0, 0) }, uPromPale: { value: new THREE.Vector3().fromArray(look.prominence.pale) }, uFringeKnot: { value: knots }, uKnot: { value: knotAt }, uKnotBy: { value: knotBy }, uKnotRay: { value: knotRay }, uKnotOut: { value: knotOut }, uKnotLight: { value: new THREE.Vector4(look.knot.colour[0]!, look.knot.colour[1]!, look.knot.colour[2]!, look.knot.steps) }, uCoronaRim: { value: new THREE.Vector4(look.corona.rim[0]!, look.corona.rim[1]!, look.corona.rim[2]!, look.corona.rimTop) }, uChromoBurn: { value: look.chromosphere.burn }, uFringeFan: { value: new THREE.Vector3(look.fringe.strand.fan, look.fringe.strand.fine, look.fringe.strand.sharp) }, uFringeCurl: { value: new THREE.Vector3(look.fringe.strand.curl[0]!, look.fringe.strand.curl[1]!, look.fringe.strand.curl[2]!) }, uGlareInside: { value: look.glare.inside }, uCoronaNear: { value: new THREE.Vector3().fromArray(look.corona.near) }, uCoronaWide: { value: new THREE.Vector3().fromArray(look.corona.wide) },
        uProm: { value: new THREE.Vector4(look.prominence.steps, look.prominence.shell, look.prominence.gain, look.prominence.flow) }, uPromColour: { value: new THREE.Vector3().fromArray(look.prominence.colour) }, uPromHot: { value: new THREE.Vector3().fromArray(look.prominence.hot) },
        uLoopMid: { value: mid }, uLoopAlong: { value: along }, uLoopUp: { value: up }, uLoopShape: { value: shape }, uLoops: { value: Math.min(look.loops.length, MAX_LOOPS) },
        uGlare: { value: new THREE.Vector4(0, 0, look.glare.tight, look.glare.wide) }, uGlareColour: { value: new THREE.Vector3().fromArray(look.glare.colour) }, uParts: { value: PARTS.all },
      },
    })
    this.mesh = new THREE.Mesh(tri, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 50
    this.own = new THREE.Mesh(tri, this.material)
    this.own.frustumCulled = false
    this.scene.add(this.own)
  }

    wear(hold: FarSunHold | null): void {
    const u = this.material.uniforms
    u.uMapOn!.value = hold ? 1 : 0
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
    const worn = u.uMapOn!.value > 0 ? wearShare(distance) : 0
    u.uWear!.value = worn
    u.uOpacity!.value = opacity
    u.uGain!.value = 1 / view.exposure
    ;(u.uLens!.value as THREE.Vector2).set(view.vignette, view.aspect)
    const master = bufferFrame()
    u.uMaster!.value = master
    u.uPixel!.value = (2 * master) / (p[5]! * view.height)
    const far = 1 - wearShare(distance)
    const burnt = Math.pow(look.burn.gain, Math.min(Math.max(view.burn, 0), 1))
    u.uBright!.value = (look.body.bright[0]! + (look.body.bright[1]! - look.body.bright[0]!) * far) * burnt
    ;(u.uBurn!.value as THREE.Vector4).set(Math.pow(burnt, look.burn.gas), (look.burn.glow * (burnt - 1)) / (look.burn.gain - 1), look.burn.fall, Math.min(Math.max(view.burn, 0) * 2, 1) * far)
    const burn = Math.min(Math.max(view.burn, 0), 1)
    ;(u.uDesat!.value as THREE.Vector3).z = burn
    const keep = look.burn.keep.gain * burn
    u.uHeatFloor!.value = look.spots.floor[0]! + (look.spots.floor[1]! - look.spots.floor[0]!) * burn
    const gains = u.uLoopGain!.value as number[]
    const ragged = u.uLoopRagged!.value as number[]
    look.loops.slice(0, MAX_LOOPS).forEach((l, i) => {
      const by = l as { gain?: number; burn?: number; ragged?: number }
      gains[i] = (by.gain ?? 1) * Math.pow(burnt, by.burn ?? look.prominence.burn)
      ragged[i] = (by.ragged ?? 0) * burn
    })
    ;(u.uLoopLook!.value as THREE.Vector3).set(1 - (1 - look.prominence.thin) * burn, look.prominence.broken * burn, look.prominence.paleBy * burn)
    const knotBy = u.uKnotBy!.value as THREE.Vector4[]
    look.knot.at.slice(0, MAX_KNOTS).forEach((k, i) => {
      knotBy[i]!.x = (k.gain * (burnt - 1)) / (look.burn.gain - 1)
      knotBy[i]!.z = (k.rays.gain * (burnt - 1)) / (look.burn.gain - 1)
    })
    ;(u.uLimbGlow!.value as THREE.Vector2).x = look.burn.limb[0]! * burn
    ;(u.uKeep!.value as THREE.Vector4).set(keep * look.burn.keep.tint[0]!, keep * look.burn.keep.tint[1]!, keep * look.burn.keep.tint[2]!, look.burn.keep.top)
    ;(u.uFringe!.value as THREE.Vector4).z = look.fringe.gain * far
    ;(u.uWhite!.value as THREE.Vector3).set(look.body.ceiling + (look.burn.white[0]! - look.body.ceiling) * burn, look.body.ceiling + (look.burn.white[1]! - look.body.ceiling) * burn, look.body.ceiling + (look.burn.white[2]! - look.body.ceiling) * burn)
    ;(u.uHalo!.value as THREE.Vector2).x = (look.burn.tight * (burnt - 1)) / (look.burn.gain - 1)
    ;(u.uGlare!.value as THREE.Vector4).x = look.glare.gain[0]! + (look.glare.gain[1]! - look.glare.gain[0]!) * far
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
  }

  dispose(): void {
    this.material.dispose()
  }
}

export const farSun = new FarSun()
