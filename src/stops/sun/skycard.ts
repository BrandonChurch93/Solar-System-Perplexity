import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
uniform vec2 uTan;
out vec2 vUv;
out vec2 vScreen;
void main() {
  vUv = uv;
  vec3 d = mat3(viewMatrix) * mat3(modelMatrix) * vec3(position.xy * uTan, -1.0);
  gl_Position = projectionMatrix * vec4(d, 1.0);
  gl_Position.z = gl_Position.w * 0.999999;
  vScreen = gl_Position.xy / gl_Position.w;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform int uDiag;
uniform float uGain;
uniform float uWeight;
uniform float uEdge;
uniform float uVignette;
uniform float uAspect;
in vec2 vUv;
in vec2 vScreen;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec2 dx = dFdx(vUv) * 0.25;
  vec2 dy = dFdy(vUv) * 0.25;
  vec3 t = 0.25 * (texture(uMap, vUv + dx + dy).rgb + texture(uMap, vUv - dx + dy).rgb + texture(uMap, vUv + dx - dy).rgb + texture(uMap, vUv - dx - dy).rgb);
  vec2 e = min(vUv, 1.0 - vUv);
  float inside = smoothstep(0.0, uEdge, min(e.x, e.y));
  vec2 vq = vScreen * 0.5 * vec2(uAspect, 1.0);
  vec3 col = inverseFilmic(t) * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, inside * uWeight);
}`

export interface SkyCardDef { file: string; vfovDeg: number; margin: number; gain: number }

export class SkyCard {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly gain: number

  constructor(map: THREE.Texture, def: SkyCardDef) {
    const wide = 1 + 2 * def.margin
    const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2) * wide
    this.gain = def.gain
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uDiag: diagUniform, uTan: { value: new THREE.Vector2((t * 16) / 9, t) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uEdge: { value: def.margin / wide }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.renderOrder = -10
    this.mesh.frustumCulled = false
  }

  update(weight: number, exposure: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    u.uWeight!.value = weight
    u.uGain!.value = this.gain * exposure
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = weight > 0
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
