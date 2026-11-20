import * as THREE from 'three'
import { stream } from '../core/random'

const VERT = /* glsl */ `
uniform vec3 uOffset;
uniform float uSpan;
uniform float uPixel;
uniform float uIntensity;
in float aSeed;
out float vLight;
out float vSize;
void main() {
  vec3 p = (fract(position - uOffset / uSpan) - 0.5) * uSpan;
  vec4 mv = viewMatrix * vec4(p, 0.0);
  float d = length(mv.xyz);
  gl_Position = projectionMatrix * vec4(mv.xyz, 1.0);
  gl_Position.z = 0.0;
  float size = clamp(uPixel * (0.6 + aSeed) * 3.2 / d, 1.6, 14.0 * uPixel);
  vSize = size;
  gl_PointSize = size;
  vLight = uIntensity * smoothstep(uSpan * 0.5, uSpan * 0.3, d) * smoothstep(0.08, 0.5, d) * (0.35 + 0.65 * aSeed) * min(1.0, 4.0 / (size * size));
}`

const FRAG = /* glsl */ `
precision highp float;
in float vLight;
in float vSize;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float a = exp(-dot(p, p) * 3.0);
  outColor = vec4(vec3(1.0, 0.94, 0.84) * a * vLight, 0.0);
}`

const SPAN = 9

export class Dust {
  private readonly points: THREE.Points
  private readonly scene = new THREE.Scene()
  private readonly material: THREE.ShaderMaterial

  constructor(count: number) {
    const rnd = stream('dust')
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rnd.next()
      pos[i * 3 + 1] = rnd.next()
      pos[i * 3 + 2] = rnd.next()
      seed[i] = rnd.next()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uOffset: { value: new THREE.Vector3() }, uSpan: { value: SPAN }, uPixel: { value: 1 }, uIntensity: { value: 0 } },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
    this.points = new THREE.Points(geo, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera, offset: THREE.Vector3, intensity: number, height: number): void {
    const u = this.material.uniforms
    ;(u.uOffset!.value as THREE.Vector3).copy(offset)
    u.uPixel!.value = height / 1080
    u.uIntensity!.value = intensity
    renderer.setRenderTarget(target)
    renderer.render(this.scene, camera)
  }
}
