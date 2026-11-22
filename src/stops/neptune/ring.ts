import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface RingParams {
  normal: [number, number, number]
  centre: [number, number, number]
  inner: number
  outer: number
  color: [number, number, number]
  gain: number
  forward: number
  forwardPower: number
  map: THREE.Texture
  mapScale: number
  bands: THREE.Texture
  bandUnit: [number, number, number]
  bandHold: [number, number, number]
  bandAway: [number, number, number]
  grain?: { map: THREE.Texture; repeat: [number, number]; fine: number; amount: number; top: number }
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vPos;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform sampler2D uMap;
uniform float uMapScale;
uniform sampler2D uBands;
uniform vec3 uBandGain;
uniform vec3 uColor;
uniform float uGain;
uniform vec3 uSunL;
uniform vec3 uSunW;
uniform vec2 uForward;
uniform float uTurn;
uniform vec2 uRange;
uniform vec3 uCentre;
uniform float uHome;
uniform sampler2D uGrain;
uniform vec4 uGrainShape;
uniform float uGrainTop;
in vec3 vLocal;
in vec3 vPos;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  float r = length(vLocal.xy);
  float az = atan(vLocal.y, vLocal.x) - uTurn;
  vec2 uv = vec2(az / 6.283185307 + 0.5, (r - uRange.x) / (uRange.y - uRange.x));
  vec3 q0 = vLocal / max(r, 1e-4);
  vec2 gx = vec2(dot(dFdx(vLocal.xy), vec2(-q0.y, q0.x)) / (6.283185307 * r), dFdx(r) / (uRange.y - uRange.x));
  vec2 gy = vec2(dot(dFdy(vLocal.xy), vec2(-q0.y, q0.x)) / (6.283185307 * r), dFdy(r) / (uRange.y - uRange.x));
  vec3 code = textureGrad(uMap, uv, gx, gy).rgb;
  vec3 band = textureGrad(uBands, uv, gx, gy).rgb;
  vec3 strands = code * code * uMapScale * uHome + uColor * dot(band * band, uBandGain);
  for (int k = 0; k < (uGrainShape.w > 0.0 ? 1 : 0); k++) {
    vec2 coarse = uGrainShape.xy;
    vec2 fine = coarse * uGrainShape.z;
    float g = textureGrad(uGrain, uv * coarse, gx * coarse, gy * coarse).r * textureGrad(uGrain, uv * fine + 0.37, gx * fine, gy * fine).r * uGrainTop * uGrainTop;
    strands *= mix(1.0, g, uGrainShape.w);
  }
  float edge = smoothstep(uRange.x, uRange.x + 0.03, r) * (1.0 - smoothstep(uRange.y - 0.03, uRange.y, r));
  vec3 q = vLocal + uCentre;
  float b = dot(q, uSunL);
  float miss = sqrt(max(dot(q, q) - b * b, 0.0));
  float shadow = b < 0.0 ? smoothstep(0.985, 1.025, miss) : 1.0;
  vec3 dir = normalize(vPos);
  float phase = 1.0 + uForward.x * pow(max(dot(dir, uSunW), 0.0), uForward.y);
  outColor = vec4(strands * edge * mix(0.006 + 0.994 * shadow, 1.0, uHome) * phase * uGain, 0.0);
}`

export class Ring {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly inverse = new THREE.Quaternion()
  private readonly tilt = new THREE.Quaternion()
  private readonly gain: number
  private readonly bandUnit: [number, number, number]
  private readonly bandHold: [number, number, number]
  private readonly bandAway: [number, number, number]
  private readonly centre: THREE.Vector3
  private readonly untilt = new THREE.Quaternion()
  private readonly grain: number

  constructor(p: RingParams) {
    this.gain = p.gain
    this.grain = p.grain?.amount ?? 0
    this.bandUnit = p.bandUnit
    this.bandHold = p.bandHold
    this.bandAway = p.bandAway
    this.centre = new THREE.Vector3().fromArray(p.centre)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDiag: diagUniform, uMap: { value: p.map }, uMapScale: { value: p.mapScale }, uBands: { value: p.bands }, uBandGain: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Vector3().fromArray(p.color) }, uGain: { value: 1 }, uSunL: { value: new THREE.Vector3(1, 0, 0) }, uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uForward: { value: new THREE.Vector2(p.forward, p.forwardPower) }, uTurn: { value: 0 }, uRange: { value: new THREE.Vector2(p.inner, p.outer) }, uCentre: { value: new THREE.Vector3() },
        uHome: { value: 1 },
        uGrain: { value: p.grain?.map ?? p.bands }, uGrainShape: { value: new THREE.Vector4(p.grain?.repeat[0] ?? 1, p.grain?.repeat[1] ?? 1, p.grain?.fine ?? 1, 0) }, uGrainTop: { value: p.grain?.top ?? 1 },
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.RingGeometry(p.inner, p.outer, 512, 2), this.material)
    this.tilt.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().fromArray(p.normal).normalize())
    this.mesh.quaternion.copy(this.tilt)
    this.untilt.copy(this.tilt).invert()
    this.mesh.renderOrder = 3
  }

  update(light: THREE.Vector3, rotation: THREE.Quaternion, turn: number, home: number, gain: number): void {
    const u = this.material.uniforms
    this.mesh.position.copy(this.centre).multiplyScalar(home)
    ;(u.uCentre!.value as THREE.Vector3).copy(this.mesh.position).applyQuaternion(this.untilt)
    ;(u.uSunW!.value as THREE.Vector3).copy(light)
    this.inverse.copy(rotation).multiply(this.tilt).invert()
    ;(u.uSunL!.value as THREE.Vector3).copy(light).applyQuaternion(this.inverse)
    u.uTurn!.value = turn
    const bands = u.uBandGain!.value as THREE.Vector3
    for (let k = 0; k < 3; k++) bands.setComponent(k, this.bandUnit[k]! * (this.bandAway[k]! + (this.bandHold[k]! - this.bandAway[k]!) * home))
    u.uHome!.value = home
    ;(u.uGrainShape!.value as THREE.Vector4).w = this.grain * (1 - home)
    u.uGain!.value = gain * this.gain
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
