import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface VeilLook {
  normal: [number, number, number]
  range: [number, number]
  max: number
  dive: [number, number]
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vClip;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec3 uE1;
uniform vec3 uE2;
uniform vec3 uRange;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vLocal;
in vec3 vClip;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec2 q = vec2(dot(vLocal, uE1), dot(vLocal, uE2));
  float r = max(length(q), 1e-4);
  float span = uRange.y - uRange.x;
  float v = (r - uRange.x) / span;
  vec2 qx = dFdx(q);
  vec2 qy = dFdy(q);
  float turn = 1.0 / (6.2831853 * r * r);
  vec2 gx = vec2((q.x * qx.y - q.y * qx.x) * turn, -dot(q, qx) / (r * span));
  vec2 gy = vec2((q.x * qy.y - q.y * qy.x) * turn, -dot(q, qy) / (r * span));
  vec3 t = textureGrad(uMap, vec2(atan(q.y, q.x) / 6.2831853, 1.0 - v), gx, gy).rgb;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float lens = mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(t * t * (uRange.z * uGain * step(0.0, v) * step(v, 1.0) / lens), 0.0);
}`

export class Veil {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly geometry: THREE.BufferGeometry

  constructor(map: THREE.Texture, look: VeilLook) {
    const n = new THREE.Vector3().fromArray(look.normal).normalize()
    const e1 = new THREE.Vector3(0, 0, 1).cross(n).normalize()
    const e2 = n.clone().cross(e1)
    const segments = 96
    const inner = look.range[0] * Math.cos(Math.PI / segments) * 0.999
    const outer = look.range[1] * 1.001
    const position = new Float32Array((segments + 1) * 6)
    const index: number[] = []
    const p = new THREE.Vector3()
    for (let k = 0; k <= segments; k++) {
      const a = (k / segments) * 2 * Math.PI
      p.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a))
      position.set([p.x * inner, p.y * inner, p.z * inner, p.x * outer, p.y * outer, p.z * outer], k * 6)
      if (k < segments) index.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2)
    }
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.setIndex(index)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uE1: { value: e1 }, uE2: { value: e2 }, uRange: { value: new THREE.Vector3(look.range[0], look.range[1], look.max) },
        uGain: { value: 0 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 2
  }

  update(gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.material.dispose()
    this.geometry.dispose()
  }
}
