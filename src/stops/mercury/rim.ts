import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
out vec2 vUv;
out vec3 vClip;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec2 vUv;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float k = uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(inverseFilmic(textureLod(uMap, vUv, 0.0).rgb) * k, 0.0);
  if (uDiag >= 2) discard;
}`

export class Rim {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, points: Float32Array, columns: number, diag: THREE.IUniform<number>) {
    if (points.length !== columns * 6) throw new Error('rim mesh size mismatch')
    const uv = new Float32Array(columns * 4)
    const index = new Uint32Array((columns - 1) * 6)
    for (let i = 0; i < columns; i++) {
      uv.set([i / (columns - 1), 1, i / (columns - 1), 0], i * 4)
      if (i < columns - 1) index.set([i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3], i * 6)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uMap: { value: map }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diag },
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -4
  }

  update(gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
