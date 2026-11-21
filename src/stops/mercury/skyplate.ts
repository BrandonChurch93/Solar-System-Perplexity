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
uniform vec3 uLens;
uniform float uGain;
uniform float uWeight;
uniform vec4 uGround;
uniform vec2 uBand;
uniform vec3 uSunAt;
uniform vec3 uHole;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vRay;
in vec2 vNdc;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 ray = normalize(vRay);
  vec3 p = uAim * ray;
  vec2 uv = p.xy / max(-p.z, 1e-4) / uLens.xy * 0.5 + 0.5;
  vec2 e = min(uv, 1.0 - uv);
  float inside = step(1e-4, -p.z) * smoothstep(0.0, uLens.z, min(e.x, e.y)) * uWeight;
  float hole = uHole.x * (1.0 - smoothstep(uHole.y, uHole.z, acos(clamp(dot(ray, uSunAt), -1.0, 1.0))));
  if (inside <= 0.0 && hole <= 0.0) discard;
  vec3 c = vec3(0.0);
  float alpha = 0.0;
  for (int i = 0; i < (inside > 0.0 ? 1 : 0); i++) {
    vec2 gx = dFdx(uv);
    vec2 gy = dFdy(uv);
    vec2 dx = gx * 0.25;
    vec2 dy = gy * 0.25;
    vec3 t = 0.25 * (textureGrad(uMap, uv + dx + dy, gx, gy).rgb + textureGrad(uMap, uv - dx + dy, gx, gy).rgb + textureGrad(uMap, uv + dx - dy, gx, gy).rgb + textureGrad(uMap, uv - dx - dy, gx, gy).rgb);
    vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
    float k = uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
    float above = smoothstep(-uBand.y, uBand.y, dot(normalize(p), uGround.xyz) + uGround.w);
    alpha = inside * mix(above, 1.0, uBand.x);
    c = inverseFilmic(t) * k;
  }
  float cover = 1.0 - (1.0 - hole) * (1.0 - alpha);
  outColor = vec4(c * (alpha / max(cover, 1e-6)), cover);
}`

export class SkyPlate {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly m4 = new THREE.Matrix4()

  constructor(map: THREE.Texture, tan: [number, number], edge: number, up: THREE.Vector3, sinDip: number, soft: number, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uMap: { value: map }, uAim: { value: new THREE.Matrix3() }, uLens: { value: new THREE.Vector3(tan[0], tan[1], edge) }, uGain: { value: 1 }, uWeight: { value: 0 }, uGround: { value: new THREE.Vector4(up.x, up.y, up.z, sinDip) }, uBand: { value: new THREE.Vector2(0, soft) }, uSunAt: { value: new THREE.Vector3(0, 0, 1) }, uHole: { value: new THREE.Vector3(0, 1, 2) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diag },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -11
    this.mesh.visible = false
  }

  update(toPatch: THREE.Quaternion, weight: number, band: number, gain: number, vignette: number, aspect: number, sun: THREE.Vector3, hole: number, from: number, to: number): void {
    this.mesh.visible = weight > 0 || hole > 0
    if (!this.mesh.visible) return
    const u = this.material.uniforms
    ;(u.uAim!.value as THREE.Matrix3).setFromMatrix4(this.m4.makeRotationFromQuaternion(toPatch))
    u.uWeight!.value = weight
    ;(u.uBand!.value as THREE.Vector2).x = band
    ;(u.uSunAt!.value as THREE.Vector3).copy(sun)
    ;(u.uHole!.value as THREE.Vector3).set(hole, from, to)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
