import * as THREE from 'three'
import { config } from '../config'
import { captureRate, shutterSpan, spanMid } from '../core/clock'
import { stream } from '../core/random'
import type { RenderView, Shot } from '../core/types'
import { Flow, FLOW, type FlowDirector } from './travel/flow'

const VERT = /* glsl */ `
uniform mat3 uRot;
uniform vec3 uFlow0;
uniform vec3 uFlow1;
uniform vec3 uSun;
uniform vec2 uView;
uniform float uPixel;
uniform float uGain;
uniform float uTime;
uniform vec2 uSpan;
uniform vec4 uCore;
uniform vec4 uLevel;
uniform vec4 uGlint;
uniform vec3 uWarm;
uniform vec3 uCool;
uniform float uShare;
uniform vec3 uSide;
in vec3 aBase;
in vec4 aSeed;
in vec4 aGrain;
out vec2 vAt;
out vec3 vColor;
out vec2 vShape;
void main() {
  float span = uSpan.x * pow(uSpan.y, aSeed.w);
  vec3 w0 = (fract(aBase - uFlow0 / span) - 0.5) * span;
  vec3 w1 = w0 - (uFlow1 - uFlow0);
  vec3 v0 = uRot * w0;
  vec3 v1 = uRot * w1;
  float d = 0.5 * (length(v0) + length(v1));
  vec4 c0 = projectionMatrix * vec4(v0, 1.0);
  vec4 c1 = projectionMatrix * vec4(v1, 1.0);
  vec2 s0 = c0.xy / c0.w * 0.5 * uView;
  vec2 s1 = c1.xy / c1.w * 0.5 * uView;
  vec2 along = s1 - s0;
  float len = length(along);
  vec2 dir = len > 1e-4 ? along / len : vec2(1.0, 0.0);
  float sigma = uPixel * mix(uCore.x, uCore.y, aGrain.x);
  float tau = uCore.z * len;
  float wide = sqrt(sigma * sigma + tau * tau);
  float cosSun = dot(normalize(w0), uSun);
  float lobe = 0.5 + 0.5 * cosSun;
  float phase = uSide.x + uSide.y * pow(lobe, 3.0) + uSide.z * pow(lobe, 22.0);
  float fade = smoothstep(span * 0.5, span * 0.34, d) * smoothstep(0.06, 0.2, d);
  float turn = fract(aGrain.z + uTime * mix(uGlint.z, uGlint.w, aGrain.w));
  float swing = 0.5 + 0.5 * cos(6.2831853 * turn);
  float tumble = aGrain.y < uGlint.x ? 0.55 + uGlint.y * pow(swing, 8.0) : 0.8 + 0.4 * swing;
  float still = uGain * (uLevel.x + uLevel.y * pow(aSeed.y, uLevel.z)) * phase * fade * tumble;
  still *= step(fract(aSeed.x * 13.7 + aSeed.z * 7.3), uShare);
  float cap = still / uLevel.w;
  still /= sqrt(sqrt(1.0 + cap * cap * cap * cap));
  float reach = len / (uCore.w * uPixel);
  float peak = still * sigma / wide / (1.0 + reach * reach);
  bool ok = v0.z < -0.05 && v1.z < -0.05 && peak > 0.1;
  vec2 q = vec2((position.x * 2.0 - 1.0) * (3.2 * wide + 1.0), position.y * (3.2 * sigma + 1.0));
  vec2 px = 0.5 * (s0 + s1) + dir * q.x + vec2(-dir.y, dir.x) * q.y;
  vec3 tint = mix(uWarm, uCool, aSeed.z * aSeed.z);
  vAt = q;
  vShape = vec2(0.5 / (wide * wide), 0.5 / (sigma * sigma));
  vColor = tint / dot(tint, vec3(0.2126, 0.7152, 0.0722)) * peak / (0.46 + (sigma / uPixel - 0.42));
  gl_Position = ok ? vec4(px / (0.5 * uView), 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uView;
uniform vec4 uDisc;
uniform vec3 uRay;
uniform float uUnit;
in vec2 vAt;
in vec3 vColor;
in vec2 vShape;
out vec4 outColor;
void main() {
  vec3 ray = normalize(vec3((gl_FragCoord.xy / uView * 2.0 - 1.0) * uRay.xy, -1.0));
  float off = atan(length(cross(ray, uDisc.xyz)), dot(ray, uDisc.xyz));
  float clear = smoothstep(uDisc.w, uDisc.w + 2.0 * uRay.z, off);
  outColor = vec4(vColor * (uUnit * clear * exp(-vAt.x * vAt.x * vShape.x - vAt.y * vAt.y * vShape.y)), 0.0);
}`

export const DUST = { span: [2.2, 48], share: 1, core: [0.42, 0.58], taper: 0.27, long: 28, level: [4.4, 5.6, 2.5], side: [0.8, 0.3, 0.3], cap: 8.5, response: 0.5, glint: [0.18, 2.2], spin: [0.25, 0.9], warm: [1, 0.86, 0.68], cool: [0.86, 0.93, 1], unit: 0.00052, disc: [1.12, 2] }

export interface DustSun { dir: THREE.Vector3; angularRadius: number; glare: number }

export class Dust {
  private readonly mesh: THREE.Mesh
  private readonly scene = new THREE.Scene()
  private readonly material: THREE.ShaderMaterial
  private flow: Flow | null = null
  private owner: FlowDirector | null = null
  private readonly inverse = new THREE.Quaternion()
  private readonly m4 = new THREE.Matrix4()

  constructor(count: number) {
    const rnd = stream('dust')
    const base = new Float32Array(count * 3)
    const seed = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      base[i * 3] = rnd.next()
      base[i * 3 + 1] = rnd.next()
      base[i * 3 + 2] = rnd.next()
      seed[i * 4] = rnd.next()
    }
    const more = stream('dust.look')
    for (let i = 0; i < count; i++) for (let k = 1; k < 4; k++) seed[i * 4 + k] = more.next()
    const fine = stream('dust.grain')
    const grain = new Float32Array(count * 4)
    for (let i = 0; i < grain.length; i++) grain[i] = fine.next()
    const geo = new THREE.InstancedBufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3))
    geo.setIndex([0, 1, 2, 0, 2, 3])
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3))
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4))
    geo.setAttribute('aGrain', new THREE.InstancedBufferAttribute(grain, 4))
    geo.instanceCount = count
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRot: { value: new THREE.Matrix3() },
        uFlow0: { value: new THREE.Vector3() },
        uFlow1: { value: new THREE.Vector3() },
        uSun: { value: new THREE.Vector3(0, 0, 1) },
        uView: { value: new THREE.Vector2(1, 1) },
        uPixel: { value: 1 },
        uGain: { value: 0 },
        uTime: { value: 0 },
        uUnit: { value: 0 },
        uShare: { value: DUST.share },
        uSide: { value: new THREE.Vector3().fromArray(DUST.side) },
        uSpan: { value: new THREE.Vector2(DUST.span[0], DUST.span[1]! / DUST.span[0]!) },
        uCore: { value: new THREE.Vector4(DUST.core[0], DUST.core[1], DUST.taper, DUST.long) },
        uLevel: { value: new THREE.Vector4(DUST.level[0], DUST.level[1], DUST.level[2], DUST.cap) },
        uGlint: { value: new THREE.Vector4(DUST.glint[0], DUST.glint[1], DUST.spin[0], DUST.spin[1]) },
        uWarm: { value: new THREE.Vector3().fromArray(DUST.warm) },
        uCool: { value: new THREE.Vector3().fromArray(DUST.cool) },
        uDisc: { value: new THREE.Vector4(0, 0, 1, -1) },
        uRay: { value: new THREE.Vector3(1, 1, 1) },
      },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
      stencilRef: 0,
      stencilFuncMask: 0xff,
      stencilWriteMask: 0,
    })
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, director: FlowDirector, shot: Shot, view: RenderView, sun: DustSun): void {
    if (this.owner !== director) {
      this.owner = director
      this.flow = new Flow(director, FLOW.ease)
    }
    const u = this.material.uniforms
    const seg = shot.segment
    const frame = Math.min(Math.max(shot.frame, seg.firstFrame), seg.endFrame - 1 / captureRate())
    const live = !FLOW.kinds.includes(seg.kind)
    const mid = live ? shot : director.shotAt(frame, (frame + spanMid()) / config.fps)
    const rot = u.uRot!.value as THREE.Matrix3
    rot.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.inverse.copy(mid.camera.quaternion).invert()))
    this.flow!.at(seg, frame, 0, u.uFlow0!.value as THREE.Vector3)
    this.flow!.at(seg, frame, shutterSpan() * FLOW.stepsPerFrame, u.uFlow1!.value as THREE.Vector3)
    ;(u.uSun!.value as THREE.Vector3).copy(shot.sun.dir)
    const height = target.height
    ;(u.uView!.value as THREE.Vector2).set(target.width, height)
    u.uPixel!.value = height / 1080
    u.uTime!.value = mid.time
    u.uGain!.value = Math.pow(shot.dust / config.raw.travel.dust.level, DUST.response)
    u.uUnit!.value = DUST.unit / Math.max(shot.post.exposure, 1e-3)
    const e = view.camera.projectionMatrix.elements
    const pixel = 2 / (e[5]! * height)
    ;(u.uRay!.value as THREE.Vector3).set(1 / e[0]!, 1 / e[5]!, pixel)
    const disc = u.uDisc!.value as THREE.Vector4
    const at = this.inverse.copy(mid.camera.quaternion).invert()
    const d = new THREE.Vector3().copy(sun.dir).applyQuaternion(at).normalize()
    disc.set(d.x, d.y, d.z, sun.glare > 0 ? sun.angularRadius * DUST.disc[0]! + DUST.disc[1]! * pixel : -1)
    renderer.setRenderTarget(target)
    renderer.render(this.scene, view.camera)
  }
}
