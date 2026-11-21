import * as THREE from 'three'
import { config } from '../config'
import { stream } from '../core/random'
import type { RenderView, Shot } from '../core/types'
import { Flow, FLOW, type FlowDirector } from './travel/flow'

const VERT = /* glsl */ `
uniform mat3 uRot0;
uniform mat3 uRot1;
uniform vec3 uFlow0;
uniform vec3 uFlow1;
uniform vec3 uSun;
uniform vec3 uTint;
uniform vec2 uView;
uniform float uSpan;
uniform float uPixel;
uniform float uGain;
uniform vec4 uLens;
uniform float uLong;
uniform float uCap;
uniform vec2 uNear;
#ifdef OCCLUDE
uniform vec4 uRock[5];
out float vBehind;
#endif
in vec3 aBase;
in vec4 aSeed;
out vec2 vAt;
out vec3 vColor;
out vec3 vShape;
void main() {
  float span = aSeed.w < uNear.x ? uNear.y : uSpan;
  vec3 w0 = (fract(aBase - uFlow0 / span) - 0.5) * span;
  vec3 w1 = w0 - (uFlow1 - uFlow0);
  vec3 v0 = uRot0 * w0;
  vec3 v1 = uRot1 * w1;
  float d = 0.5 * (length(v0) + length(v1));
  vec4 c0 = projectionMatrix * vec4(v0, 1.0);
  vec4 c1 = projectionMatrix * vec4(v1, 1.0);
  vec2 s0 = c0.xy / c0.w * 0.5 * uView;
  vec2 s1 = c1.xy / c1.w * 0.5 * uView;
  vec2 along = s1 - s0;
  float len = length(along);
  vec2 dir = len > 1e-4 ? along / len : vec2(1.0, 0.0);
  float coc = uPixel * uLens.x * max(1.0 / d - 1.0 / uLens.y, 0.0);
  float core = uPixel * (uLens.z + uLens.w * aSeed.x);
  float r = sqrt(core * core + coc * coc);
  float soft = smoothstep(6.0, 14.0, r / uPixel);
  float pad = r * mix(1.7, 1.06, soft) + 1.0;
  vec2 q = vec2(position.x * len + (position.x * 2.0 - 1.0) * pad, position.y * pad);
  vec2 px = s0 + dir * q.x + vec2(-dir.y, dir.x) * q.y;
  float area = mix(1.428 * r * r + 1.195 * r * len, 2.6 * r * r + 1.8 * r * len, soft);
  float cosSun = dot(normalize(w0), uSun);
  float lobe = 0.5 + 0.5 * cosSun;
  float phase = 0.32 + 0.4 * pow(lobe, 3.0) + 0.5 * pow(lobe, 22.0);
  float fade = smoothstep(span * 0.5, span * 0.34, d) * smoothstep(0.06, 0.2, d);
  float energy = uGain * phase * fade * (0.1 + 0.9 * aSeed.y * aSeed.y * aSeed.y) / pow(max(d, 0.3), 1.3);
  bool ok = v0.z < -0.05 && v1.z < -0.05 && energy > 0.0;
  vAt = q;
  vShape = vec3(len, r, soft);
  float peak = energy * uPixel * uPixel / (area * (1.0 + len / (uLong * uPixel)));
  vColor = uTint * mix(vec3(1.0, 0.9, 0.78), vec3(0.92, 0.95, 1.0), aSeed.z * aSeed.z) * peak / (1.0 + peak / uCap);
  gl_Position = ok ? vec4(px / (0.5 * uView), 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
#ifdef OCCLUDE
  vec3 vm = 0.5 * (v0 + v1);
  float dm = length(vm);
  float behind = 0.0;
  for (int i = 0; i < 5; i++) {
    vec3 c = uRock[i].xyz;
    float rr = uRock[i].w;
    float along = dot(vm, c) / dm;
    float off = length(cross(vm, c)) / dm;
    float hit = along - sqrt(max(rr * rr - off * off, 0.0));
    if (rr > 0.0 && along > 0.0 && dm > hit && off < rr * 1.25) behind = 1.0;
  }
  vBehind = behind;
#endif
}`

const FRAG = /* glsl */ `
precision highp float;
in vec2 vAt;
in vec3 vColor;
in vec3 vShape;
#ifdef OCCLUDE
uniform sampler2D uMask;
uniform vec2 uView;
in float vBehind;
#endif
out vec4 outColor;
void main() {
  float dx = vAt.x - clamp(vAt.x, 0.0, vShape.x);
  float q = length(vec2(dx, vAt.y)) / vShape.y;
  float point = exp(-2.2 * q * q);
  float disc = 1.0 - smoothstep(0.45, 1.0, q);
  float t = clamp(vAt.x / max(vShape.x, 1e-4), 0.0, 1.0) * 2.0 - 1.0;
  float taper = mix(1.0, 1.5 * (1.0 - t * t), smoothstep(1.0, 4.0, vShape.x / vShape.y));
  outColor = vec4(vColor * taper * mix(point, disc, vShape.z), 0.0);
#ifdef OCCLUDE
  for (int k = 0; k < (vBehind > 0.5 ? 1 : 0); k++) outColor.rgb *= 1.0 - textureLod(uMask, gl_FragCoord.xy / uView, 0.0).a;
#endif
}`

export const DUST = { span: 7, near: 0.35, nearSpan: 2.4, pan: 0.3, gain: 150, bokeh: 6.5, focus: 1.5, core: 0.85, coreSpread: 1.6, long: 40, cap: 0.4, tint: [1, 0.93, 0.82] }

export interface DustCover { mask: THREE.Texture; rocks: THREE.Vector4[] }

export class Dust {
  private readonly mesh: THREE.Mesh
  private readonly scene = new THREE.Scene()
  private readonly material: THREE.ShaderMaterial
  private readonly masked: THREE.ShaderMaterial
  private flow: Flow | null = null
  private owner: FlowDirector | null = null
  private readonly inverse = new THREE.Quaternion()
  private readonly held = new THREE.Quaternion()
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
    const geo = new THREE.InstancedBufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3))
    geo.setIndex([0, 1, 2, 0, 2, 3])
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3))
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4))
    geo.instanceCount = count
    const params: THREE.ShaderMaterialParameters = {
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRot0: { value: new THREE.Matrix3() },
        uRot1: { value: new THREE.Matrix3() },
        uFlow0: { value: new THREE.Vector3() },
        uFlow1: { value: new THREE.Vector3() },
        uSun: { value: new THREE.Vector3(0, 0, 1) },
        uTint: { value: new THREE.Vector3().fromArray(DUST.tint) },
        uView: { value: new THREE.Vector2(1, 1) },
        uSpan: { value: DUST.span },
        uPixel: { value: 1 },
        uGain: { value: 0 },
        uLong: { value: DUST.long },
        uCap: { value: DUST.cap },
        uNear: { value: new THREE.Vector2(DUST.near, DUST.nearSpan) },
        uLens: { value: new THREE.Vector4(DUST.bokeh, DUST.focus, DUST.core, DUST.coreSpread) },
      },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
    }
    this.material = new THREE.ShaderMaterial(params)
    this.masked = new THREE.ShaderMaterial({ ...params, defines: { OCCLUDE: 1 }, uniforms: { ...this.material.uniforms, uMask: { value: null }, uRock: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4()) } } })
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  private turn(q: THREE.Quaternion, out: THREE.Matrix3): void {
    out.setFromMatrix4(this.m4.makeRotationFromQuaternion(this.inverse.copy(q).invert()))
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, director: FlowDirector, shot: Shot, view: RenderView, cover: DustCover | null = null): void {
    if (this.owner !== director) {
      this.owner = director
      this.flow = new Flow(director)
    }
    const u = this.material.uniforms
    const seg = shot.segment
    const frame = Math.min(Math.max(shot.frame, seg.firstFrame), seg.endFrame - 1)
    const live = !FLOW.kinds.includes(seg.kind)
    const t0 = frame / config.fps
    const mid = live ? shot : director.shotAt(frame, t0 + (0.5 * config.shutterFraction) / config.fps)
    const open = live ? shot : director.shotAt(frame, t0)
    const close = live ? shot : director.shotAt(frame, t0 + config.shutterFraction / config.fps)
    this.turn(this.held.copy(mid.camera.quaternion).slerp(open.camera.quaternion, DUST.pan), u.uRot0!.value as THREE.Matrix3)
    this.turn(this.held.copy(mid.camera.quaternion).slerp(close.camera.quaternion, DUST.pan), u.uRot1!.value as THREE.Matrix3)
    this.flow!.at(seg, frame, 0, u.uFlow0!.value as THREE.Vector3)
    this.flow!.at(seg, frame, Math.round(config.shutterFraction * FLOW.stepsPerFrame), u.uFlow1!.value as THREE.Vector3)
    ;(u.uSun!.value as THREE.Vector3).copy(shot.sun.dir)
    const height = target.height
    ;(u.uView!.value as THREE.Vector2).set(target.width, height)
    u.uPixel!.value = height / 1080
    u.uGain!.value = (DUST.gain * shot.dust) / Math.max(shot.post.exposure, 1e-3)
    this.mesh.material = cover ? this.masked : this.material
    if (cover) {
      this.masked.uniforms.uMask!.value = cover.mask
      const rocks = this.masked.uniforms.uRock!.value as THREE.Vector4[]
      rocks.forEach((v, i) => (cover.rocks[i] ? v.copy(cover.rocks[i]) : v.set(0, 0, 0, 0)))
    }
    renderer.setRenderTarget(target)
    renderer.render(this.scene, view.camera)
  }
}
