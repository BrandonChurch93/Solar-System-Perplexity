import * as THREE from 'three'
import type { RenderView } from '../core/types'
import { smooth } from '../director/rig'

const VERT = /* glsl */ `
uniform float uSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uSize;
uniform float uHalo;
uniform float uWide;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * uSize;
  float r2 = dot(p, p);
  float core = uWide > 0.0 ? exp(-r2 / uWide) : exp(-r2 / 0.9);
  outColor = vec4(uColor * (core + uHalo * exp(-r2 / (0.02 * uSize * uSize))), 0.0);
}`

const YOUNG = { from: 2, fade: 0.6, wide: 0.3, gone: [8, 12] }

export class FarPoint {
  readonly points: THREE.Points
  private readonly material: THREE.ShaderMaterial
  private readonly geometry: THREE.BufferGeometry

  constructor() {
    this.material = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: { uColor: { value: new THREE.Vector3() }, uSize: { value: 4 }, uHalo: { value: 0.07 }, uWide: { value: 0 } }, blending: THREE.AdditiveBlending, premultipliedAlpha: true, depthTest: false, depthWrite: false, transparent: true })
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
  }

  update(radiusPx: number, view: RenderView, tint: [number, number, number], gain: number): void {
    const lit = view.farLight
    const px = (radiusPx * 1080) / view.format.height
    const far = lit === undefined ? 1 - smooth((radiusPx - 0.0015 * view.format.height) / (0.014 * view.format.height)) : lit * Math.exp(-YOUNG.fade * Math.max(px - YOUNG.from, 0)) * (1 - smooth((px - YOUNG.gone[0]) / (YOUNG.gone[1] - YOUNG.gone[0])))
    this.material.uniforms.uHalo!.value = lit === undefined ? 0.07 : 0
    this.material.uniforms.uWide!.value = lit === undefined ? 0 : 0.9 + YOUNG.wide * radiusPx * radiusPx
    this.points.visible = far > 0 && view.diag === 'beauty'
    this.material.uniforms.uSize!.value = Math.max(15, (30 * view.format.height) / 1080)
    ;(this.material.uniforms.uColor!.value as THREE.Vector3).fromArray(tint).addScalar(0.35).multiplyScalar(far * gain * (5 + 9 * Math.min(radiusPx, 1)))
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
