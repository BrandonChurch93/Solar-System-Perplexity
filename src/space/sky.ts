import * as THREE from 'three'
import { Pass } from '../core/pass'
import { stream } from '../core/random'
import type { SunState } from '../core/types'
import skyFrame from './skyframe.json'

export const EQUIRECT_GLSL = /* glsl */ `
const float PI = 3.141592653589793;
vec4 equirect(sampler2D tex, vec3 dir) {
  float u = atan(dir.x, dir.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
  float u2 = fract(u + 0.5) - 0.5;
  vec2 dx = vec2(abs(dFdx(u)) < abs(dFdx(u2)) ? dFdx(u) : dFdx(u2), dFdx(v));
  vec2 dy = vec2(abs(dFdy(u)) < abs(dFdy(u2)) ? dFdy(u) : dFdy(u2), dFdy(v));
  return textureGrad(tex, vec2(u, v), dx, dy);
}`

const SKY_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSky;
uniform mat4 uInvProj;
uniform mat3 uRot;
uniform mat3 uFrame;
uniform vec3 uTint;
uniform float uGamma;
uniform float uGrain;
uniform float uExposure;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunRadius;
uniform float uSunGlare;
in vec2 vUv;
out vec4 outColor;
${EQUIRECT_GLSL}
float cell(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.37, 0.73));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float grainAt(vec3 d, float f) {
  vec3 p = d * f;
  vec3 i = floor(p);
  vec3 t = p - i;
  t = t * t * (3.0 - 2.0 * t);
  float a = mix(mix(cell(i), cell(i + vec3(1, 0, 0)), t.x), mix(cell(i + vec3(0, 1, 0)), cell(i + vec3(1, 1, 0)), t.x), t.y);
  float b = mix(mix(cell(i + vec3(0, 0, 1)), cell(i + vec3(1, 0, 1)), t.x), mix(cell(i + vec3(0, 1, 1)), cell(i + vec3(1, 1, 1)), t.x), t.y);
  return mix(a, b, t.z);
}
void main() {
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(uRot * (v.xyz / v.w));
  vec3 sd = uFrame * dir;
  vec3 col = equirect(uSky, sd).rgb;
  float px = length(fwidth(sd));
  float fine = grainAt(sd, 1400.0) * smoothstep(0.5, 1.6, 1.0 / (px * 1400.0));
  float mid = grainAt(sd, 420.0) * smoothstep(0.5, 1.6, 1.0 / (px * 420.0));
  float wide = grainAt(sd, 90.0);
  float g = 0.5 * fine + 0.4 * mid + 0.1 * wide + 0.15;
  col *= mix(1.0, 0.35 + 1.25 * g, uGrain);
  col = pow(max(col, vec3(0.0)), vec3(uGamma)) * uTint * uExposure;
  if (uSunGlare > 0.0) {
    float ang = acos(clamp(dot(dir, uSunDir), -1.0, 1.0));
    float x = ang / uSunRadius;
    float edge = fwidth(x) + 1e-4;
    float disc = smoothstep(1.0 + edge, 1.0 - edge, x);
    float limb = 0.45 + 0.55 * sqrt(max(1.0 - x * x, 0.0));
    float coreR = clamp(uSunRadius * 0.35, 0.0012, 0.004);
    float core = 40.0 * exp(-(ang * ang) / (coreR * coreR));
    float o = max(x, 1.0);
    float big = clamp(sqrt(0.02 / uSunRadius), 0.4, 1.0);
    float corona = 1.3 * big * pow(o, -3.6) + 0.035 * pow(o, -1.6) * exp(-o * 0.2);
    col += uSunColor * uSunGlare * (disc * (limb * 3.6 * big + core) + (1.0 - disc) * corona);
  }
  outColor = vec4(col, 0.0);
}`

const STAR_VERT = /* glsl */ `
uniform float uPixel;
uniform float uExposure;
uniform sampler2D uSky;
uniform float uHasSky;
in vec4 aStar;
in vec3 aColor;
out vec3 vColor;
out float vSize;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 0.0);
  gl_Position = projectionMatrix * vec4(mv.xyz, 1.0);
  gl_Position.z = 0.0;
  float size = aStar.x * uPixel;
  vSize = size;
  gl_PointSize = size;
  float crowd = 1.0;
  if (uHasSky > 0.5) {
    vec3 d = normalize(position);
    vec2 uv = vec2(atan(d.x, d.z) / 6.283185307179586 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    float lum = dot(textureLod(uSky, uv, 1.0).rgb, vec3(0.3, 0.5, 0.2));
    crowd = mix(1.0, clamp(lum * 9.0, 0.25, 3.0), aStar.z);
  }
  vColor = aColor * aStar.y * crowd * uExposure;
}`

const STAR_FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vSize;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSize;
  float r2 = dot(p, p);
  float core = exp(-r2 / 0.55);
  float glow = 0.012 * exp(-r2 / (0.035 * vSize * vSize));
  outColor = vec4(vColor * (core + glow), 0.0);
}`

export class Sky {
  private readonly pass: Pass
  private readonly stars: THREE.Points
  private readonly starScene = new THREE.Scene()
  private readonly rot = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()
  private texture: THREE.Texture | null = null

  constructor(count: number) {
    this.pass = new Pass(SKY_FRAG, {
      uSky: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uRot: { value: this.rot }, uTint: { value: new THREE.Vector3().fromArray(skyFrame.grade.tint) }, uGamma: { value: skyFrame.grade.gamma }, uGrain: { value: skyFrame.grade.grain }, uFrame: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().fromArray(skyFrame.quaternion))) }, uExposure: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 0, 1) }, uSunColor: { value: new THREE.Vector3(1, 1, 1) }, uSunRadius: { value: 0.01 }, uSunGlare: { value: 0 },
    })
    const rnd = stream('stars')
    const pos = new Float32Array(count * 3)
    const star = new Float32Array(count * 4)
    const col = new Float32Array(count * 3)
    const pole = new THREE.Vector3(0.45, 0.82, 0.35).normalize()
    const v = new THREE.Vector3()
    const warm = new THREE.Color(1.0, 0.58, 0.34)
    const cool = new THREE.Color(0.5, 0.7, 1.0)
    const white = new THREE.Color(1, 1, 1)
    const c = new THREE.Color()
    let i = 0
    while (i < count) {
      const z = rnd.range(-1, 1)
      const a = rnd.range(0, Math.PI * 2)
      const s = Math.sqrt(1 - z * z)
      v.set(s * Math.cos(a), z, s * Math.sin(a))
      const lat = v.dot(pole)
      const band = Math.exp(-Math.pow(lat / 0.2, 2)) + 0.35 * Math.exp(-Math.pow(lat / 0.5, 2))
      if (rnd.next() > 0.3 + 0.7 * Math.min(band, 1)) continue
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
      const bright = Math.min(0.045 * Math.pow(Math.max(rnd.next(), 1e-6), -0.72), 14)
      star[i * 4] = Math.min(2.6 + 2.2 * Math.log2(1 + bright), 11)
      star[i * 4 + 1] = bright
      star[i * 4 + 2] = 1 - Math.min(bright * 2, 1)
      const temp = rnd.next()
      if (temp < 0.5) c.copy(warm).lerp(white, Math.pow(temp * 2, 0.6))
      else c.copy(white).lerp(cool, Math.pow((temp - 0.5) * 2, 1.4))
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
      i++
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aStar', new THREE.BufferAttribute(star, 4))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uPixel: { value: 1 }, uExposure: { value: 1 }, uSky: { value: null }, uHasSky: { value: 0 } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
    this.stars = new THREE.Points(geo, mat)
    this.stars.frustumCulled = false
    this.stars.quaternion.fromArray(skyFrame.quaternion).invert()
    this.starScene.add(this.stars)
  }

  setTexture(t: THREE.Texture): void {
    this.texture = t
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera, skyQuaternion: THREE.Quaternion, exposure: number, height: number, sun: SunState): void {
    const saved = camera.quaternion.clone()
    const savedPos = camera.position.clone()
    camera.quaternion.copy(skyQuaternion)
    camera.position.set(0, 0, 0)
    camera.updateMatrixWorld(true)
    const u = this.pass.material.uniforms
    u.uSky!.value = this.texture
    ;(u.uInvProj!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    this.rot.setFromMatrix4(this.m4.makeRotationFromQuaternion(skyQuaternion))
    u.uExposure!.value = exposure
    ;(u.uSunDir!.value as THREE.Vector3).copy(sun.dir)
    ;(u.uSunColor!.value as THREE.Vector3).set(sun.color.r, sun.color.g, sun.color.b)
    u.uSunRadius!.value = sun.angularRadius
    u.uSunGlare!.value = sun.glare
    if (this.texture) this.pass.render(renderer, target)
    const su = (this.stars.material as THREE.ShaderMaterial).uniforms
    su.uSky!.value = this.texture
    su.uHasSky!.value = this.texture ? 1 : 0
    su.uPixel!.value = height / 1080
    su.uExposure!.value = exposure
    renderer.setRenderTarget(target)
    renderer.render(this.starScene, camera)
    camera.quaternion.copy(saved)
    camera.position.copy(savedPos)
    camera.updateMatrixWorld(true)
  }
}
