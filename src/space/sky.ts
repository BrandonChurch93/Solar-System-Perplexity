import * as THREE from 'three'
import { Pass } from '../core/pass'
import { stream } from '../core/random'
import type { SunState } from '../core/types'

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
uniform float uExposure;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunRadius;
uniform float uSunGlare;
in vec2 vUv;
out vec4 outColor;
${EQUIRECT_GLSL}
void main() {
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(uRot * (v.xyz / v.w));
  vec3 col = equirect(uSky, dir).rgb * uExposure;
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
  vColor = aColor * aStar.y * uExposure;
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
      uSky: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uRot: { value: this.rot }, uExposure: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 0, 1) }, uSunColor: { value: new THREE.Vector3(1, 1, 1) }, uSunRadius: { value: 0.01 }, uSunGlare: { value: 0 },
    })
    const rnd = stream('stars')
    const pos = new Float32Array(count * 3)
    const star = new Float32Array(count * 4)
    const col = new Float32Array(count * 3)
    const pole = new THREE.Vector3(0.45, 0.82, 0.35).normalize()
    const v = new THREE.Vector3()
    let i = 0
    while (i < count) {
      const z = rnd.range(-1, 1)
      const a = rnd.range(0, Math.PI * 2)
      const s = Math.sqrt(1 - z * z)
      v.set(s * Math.cos(a), z, s * Math.sin(a))
      const band = Math.exp(-Math.pow(v.dot(pole) / 0.28, 2))
      if (rnd.next() > 0.3 + 0.7 * band) continue
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
      const mag = Math.pow(rnd.next(), 5.5)
      const bright = 0.05 + 2.4 * mag + (mag > 0.9 ? 6 * (mag - 0.9) * 10 : 0)
      star[i * 4] = 3.0 + 7.0 * Math.pow(mag, 3)
      star[i * 4 + 1] = bright
      const temp = rnd.next()
      const warm = new THREE.Color(1.0, 0.82, 0.62)
      const cool = new THREE.Color(0.7, 0.82, 1.0)
      const c = temp < 0.5 ? warm.lerp(new THREE.Color(1, 1, 1), temp * 2) : new THREE.Color(1, 1, 1).lerp(cool, (temp - 0.5) * 2)
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
      uniforms: { uPixel: { value: 1 }, uExposure: { value: 1 } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
    this.stars = new THREE.Points(geo, mat)
    this.stars.frustumCulled = false
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
    su.uPixel!.value = height / 1080
    su.uExposure!.value = exposure
    renderer.setRenderTarget(target)
    renderer.render(this.starScene, camera)
    camera.quaternion.copy(saved)
    camera.position.copy(savedPos)
    camera.updateMatrixWorld(true)
  }
}
