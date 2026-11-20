import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import { EQUIRECT_GLSL } from '../space/sky'

export interface MoonBodyOptions {
  map: THREE.Texture
  mapWidth: number
  height: THREE.Texture
  heights: Float32Array
  heightSize: [number, number]
  lo: number
  hi: number
  radius: number
  gain: number
  ambient: [number, number, number]
  bounce: [number, number, number]
  sun: [number, number, number]
  segments?: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uHeight;
uniform float uMapWidth;
uniform float uStep;
uniform float uLo;
uniform float uHi;
uniform float uGain;
uniform float uSunGain;
uniform vec3 uSunTint;
uniform vec3 uAmbient;
uniform vec3 uBounce;
uniform vec3 uSunB;
uniform vec3 uBounceB;
in vec3 vLocal;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
vec3 surface(vec3 d) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return d * (uLo + (uHi - uLo) * textureLod(uHeight, vec2(u, v), 0.0).r);
}
void main() {
  vec3 d = normalize(vLocal);
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-3 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  vec3 a = surface(normalize(d + east * uStep)) - surface(normalize(d - east * uStep));
  vec3 b = surface(normalize(d + north * uStep)) - surface(normalize(d - north * uStep));
  vec3 n = normalize(cross(a, b));
  vec3 albedo = inverseFilmic(equirect(uMap, d).rgb);
  float ndl = max(dot(n, uSunB), 0.0);
  float nb = max(dot(n, uBounceB) * 0.6 + 0.4, 0.0);
  vec3 col = albedo * (uSunTint * ndl * uSunGain + uBounce * nb + uAmbient) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

export class MoonBody {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly inverse = new THREE.Quaternion()

  constructor(o: MoonBodyOptions) {
    const seg = o.segments ?? 448
    const geo = new THREE.SphereGeometry(1, seg, seg / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const [w, h] = o.heightSize
    const v = new THREE.Vector3()
    const at = (x: number, y: number): number => o.heights[Math.min(Math.max(y, 0), h - 1) * w + (((x % w) + w) % w)]!
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize()
      const fx = (Math.atan2(v.x, v.z) / (2 * Math.PI) + 0.5) * w - 0.5
      const fy = (Math.asin(Math.min(Math.max(v.y, -1), 1)) / Math.PI + 0.5) * h - 0.5
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const tx = fx - x0
      const ty = fy - y0
      const value = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty
      v.multiplyScalar(o.lo + (o.hi - o.lo) * value)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
    geo.computeBoundingSphere()
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uHeight: { value: o.height }, uMapWidth: { value: o.mapWidth }, uStep: { value: (2 * Math.PI) / w },
        uLo: { value: o.lo }, uHi: { value: o.hi }, uGain: { value: 1 }, uSunGain: { value: o.gain },
        uSunTint: { value: new THREE.Vector3().fromArray(o.sun) }, uAmbient: { value: new THREE.Vector3().fromArray(o.ambient) }, uBounce: { value: new THREE.Vector3().fromArray(o.bounce) },
        uSunB: { value: new THREE.Vector3(1, 0, 0) }, uBounceB: { value: new THREE.Vector3(0, 0, -1) },
        uDiag: diagUniform,
      },
    })
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.scale.setScalar(o.radius)
  }

  update(sunWorld: THREE.Vector3, bounceWorld: THREE.Vector3, worldRotation: THREE.Quaternion, gain: number): void {
    const u = this.material.uniforms
    this.inverse.copy(worldRotation).invert()
    ;(u.uSunB!.value as THREE.Vector3).copy(sunWorld).applyQuaternion(this.inverse)
    ;(u.uBounceB!.value as THREE.Vector3).copy(bounceWorld).applyQuaternion(this.inverse).normalize()
    u.uGain!.value = gain
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
