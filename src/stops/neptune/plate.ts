import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
out vec3 vView;
out vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec2 uMapSize;
uniform float uGain;
in vec2 vUv;
in vec3 vView;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec2 uv = vUv * 3.0 - 1.0;
  vec3 col = inverseFilmic(texture(uMap, uv).rgb) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexels(uv * uMapSize), 1.0, vec3(0.85, 0.3, 0.25), vec2(0.0), length(vView));
}`

const DISTANCE = 10

export class Plate {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, t: { vfov: number; forward: number; side: number; rise: number; yawDeg: number; pitchDeg: number }) {
    const size = map.image as unknown as { width: number; height: number }
    this.material = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: { uMap: { value: map }, uMapSize: { value: new THREE.Vector2(size.width, size.height) }, uGain: { value: 1 }, uDiag: diagUniform } })
    const overscan = 1 + (0.5 * t.forward + 0.5 * Math.abs(t.side) + 0.5 * Math.abs(t.rise)) / DISTANCE + Math.tan(THREE.MathUtils.degToRad(0.5 * Math.max(Math.abs(t.yawDeg), Math.abs(t.pitchDeg))))
    const h = 2 * DISTANCE * Math.tan(THREE.MathUtils.degToRad(t.vfov) / 2) * overscan
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * (size.width / size.height) * 3, h * 3), this.material)
    this.mesh.position.set(0, 0, -DISTANCE)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
