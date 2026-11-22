import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
out vec3 vRay;
out vec2 vNdc;
void main() {
  vRay = transpose(mat3(viewMatrix)) * vec3((position.x + projectionMatrix[2][0]) / projectionMatrix[0][0], (position.y + projectionMatrix[2][1]) / projectionMatrix[1][1], -1.0);
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform mat3 uAim;
uniform vec4 uRect;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uLimb;
uniform vec2 uLimbEdge;
uniform vec4 uSmall;
uniform vec3 uPale;
uniform int uDiag;
in vec3 vRay;
in vec2 vNdc;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  vec3 p = uAim * normalize(vRay);
  vec2 uv = ((p.xy / max(-p.z, 1e-3) - uRect.xy) / uRect.zw - 0.5) / uSmall.x + 0.5;
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float k = uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  float r = length(uv - 0.5) / uLimb.w;
  vec3 shade = mix(vec3(1.0) - uLimb.rgb * (1.0 - sqrt(max(1.0 - r * r, 0.0))), vec3(1.0), smoothstep(uLimbEdge.x, uLimbEdge.y, r));
  vec3 c = inverseFilmic(textureGrad(uMap, uv, dFdx(uv), dFdy(uv)).rgb) * shade;
  c = mix(c, uPale * (dot(c, vec3(0.3, 0.5, 0.2)) * uSmall.z), uSmall.y);
  vec2 e = min(uv, 1.0 - uv);
  outColor = vec4(c * (k * smoothstep(0.0, uSmall.w, min(e.x, e.y))), 0.0);
  if (uDiag >= 2 || p.z > -1e-3 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
}`

export interface SunLimb { dark: [number, number, number]; edge: [number, number] }
export interface SunSmall { to: number; pale: [number, number, number]; lift: number; white: [number, number]; feather: number }

export class SunPlate {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly m4 = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()

  constructor(map: THREE.Texture, rect: [number, number, number, number], disc: number, limb: SunLimb, private readonly small: SunSmall, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uMap: { value: map }, uAim: { value: new THREE.Matrix3() }, uRect: { value: new THREE.Vector4(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]) }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uLimb: { value: new THREE.Vector4(limb.dark[0], limb.dark[1], limb.dark[2], disc) }, uLimbEdge: { value: new THREE.Vector2(limb.edge[0], limb.edge[1]) }, uSmall: { value: new THREE.Vector4(1, 0, 1, 1e-4) }, uPale: { value: new THREE.Vector3().fromArray(small.pale) }, uDiag: diag },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -10
  }

  update(aim: THREE.Quaternion, gain: number, vignette: number, aspect: number, shrink = 0): void {
    this.mesh.visible = gain > 0
    const u = this.material.uniforms
    const white = THREE.MathUtils.smoothstep(shrink, this.small.white[0], this.small.white[1])
    ;(u.uSmall!.value as THREE.Vector4).set(Math.pow(this.small.to, shrink), white, this.small.lift, 1e-4 + this.small.feather * Math.min(shrink * 6, 1))
    ;(u.uAim!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(this.q.copy(aim).invert()))
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
