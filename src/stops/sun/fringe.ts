import * as THREE from 'three'
import { diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { STAGE_GLSL, stage } from './stage'
import haze from './haze.json'

export interface FringeLook {
  reachDeg: number
  gain: number
  flicker: { amount: number; rate: number; stretch: number }
}

const VERT = /* glsl */ `
out vec3 vRay;
out vec2 vScreen;
void main() {
  vec3 rv = vec3(position.x / projectionMatrix[0][0], position.y / projectionMatrix[1][1], -1.0);
  vRay = transpose(mat3(modelViewMatrix)) * rv;
  vScreen = position.xy;
  gl_Position = vec4(position.xy, 0.999999, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uPlate;
uniform sampler2D uHaze;
uniform float uHazeLod;
uniform float uHazeRows;
uniform int uDiag;
uniform float uGrad;
uniform float uLod;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform float uReach;
uniform vec3 uFlicker;
uniform vec3 uCam;
in vec3 vRay;
in vec2 vScreen;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${STAGE_GLSL}
const float HAZE_AZ = ${(2 * THREE.MathUtils.degToRad(haze.azDeg)).toFixed(8)};
const float HAZE_EL = ${THREE.MathUtils.degToRad(haze.elDeg).toFixed(8)};
const float HAZE_GAIN = ${haze.gain.toFixed(4)};
const float HAZE_RISE = ${THREE.MathUtils.degToRad(haze.riseDeg).toFixed(8)};
const float HAZE_UNDER = ${haze.under.toFixed(6)};
const vec2 HAZE_UNDER_EL = vec2(${THREE.MathUtils.degToRad(haze.underDeg[0]!).toFixed(8)}, ${THREE.MathUtils.degToRad(haze.underDeg[1]!).toFixed(8)});
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vRay);
  vec3 to = ST_CENTRE - uCam;
  float dist = length(to);
  vec3 c1 = to / dist;
  float el = (acos(clamp(dot(d, c1), -1.0, 1.0)) - asin(clamp(ST_RADIUS / dist, 0.0, 1.0))) * sqrt(max(dist * dist - ST_RADIUS * ST_RADIUS, 0.0)) / ST_RADIUS * tan(ST_ALPHA);
  vec3 col = vec3(0.0);
  float az = 0.0;
  for (int k = 0; k < ((el > -0.006 && el < HAZE_EL) ? 1 : 0); k++) {
    vec3 ref = vec3(0.0, 0.0, -1.0);
    vec3 e1 = normalize(ref - c1 * dot(ref, c1));
    az = atan(dot(d, cross(c1, e1)), dot(d, e1));
  }
  for (int k = 0; k < ((el > -0.006 && el < HAZE_EL) ? 1 : 0); k++) {
    float up = max(el, 0.0);
    float lod = min(uHazeLod + log2(max(uGrad, 1e-3)), log2(max(2.0 * up / HAZE_EL * uHazeRows, 1.0)));
    col = inverseFilmic(textureLod(uHaze, vec2(az / HAZE_AZ + 0.5, up / HAZE_EL), lod).rgb) / HAZE_GAIN - HAZE_UNDER * (1.0 - smoothstep(HAZE_UNDER_EL.x, HAZE_UNDER_EL.y, up));
  }
  for (int k = 0; k < ((el > -0.006 && el < uReach) ? 1 : 0); k++) {
    float t = uTime * uFlicker.y;
    float sway = 0.5 * sin(az * 37.0 + t) + 0.3 * sin(az * 83.0 - t * 1.3 + 1.7) + 0.2 * sin(az * 151.0 + t * 0.7 + 0.6);
    float rest = 0.5 * sin(az * 37.0) + 0.3 * sin(az * 83.0 + 1.7) + 0.2 * sin(az * 151.0 + 0.6);
    float lift = 1.0 + uFlicker.z * (sway - rest);
    float still = min(max(el, 0.0), HAZE_RISE);
    vec3 d0 = stLimbDir(d, c1, still + (max(el, 0.0) - still) / lift + min(el, 0.0));
    vec2 uv = stPlate(stImage(d0));
    float keep = step(0.02, -d0.z) * step(0.0, uv.y) * step(uv.y, 1.0);
    float phase2 = az * 113.0 + 2.5 * sin(az * 29.0) + el * 260.0;
    float beat = 1.0 + uFlicker.x * (sin(t * 1.9 + phase2) - sin(phase2)) * smoothstep(0.0, 0.004, el);
    col += inverseFilmic(textureLod(uPlate, uv, uLod + log2(max(uGrad, 1e-3))).rgb) * keep * max(beat, 0.0);
  }
  col = max(col, 0.0);
  vec2 vq = vScreen * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

export class Fringe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly gain: number
  private readonly texelsPerTan: number
  private readonly hazePerTan: number

  constructor(plate: THREE.Texture, veil: THREE.Texture, look: FringeLook) {
    const img = plate.image as unknown as { width: number }
    this.gain = look.gain
    this.texelsPerTan = img.width / (2 * stage.tan[0] * stage.canvas.span)
    this.hazePerTan = (veil.image as unknown as { height: number }).height / THREE.MathUtils.degToRad(haze.elDeg)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPlate: { value: plate }, uHaze: { value: veil }, uHazeLod: { value: 0 }, uHazeRows: { value: (veil.image as unknown as { height: number }).height }, uDiag: diagUniform, uGrad: gradUniform, uLod: { value: 0 },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uReach: { value: THREE.MathUtils.degToRad(look.reachDeg) },
        uFlicker: { value: new THREE.Vector3(look.flicker.amount, look.flicker.rate, look.flicker.stretch) },
        uCam: { value: new THREE.Vector3() },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.renderOrder = -5
    this.mesh.frustumCulled = false
  }

  update(camera: THREE.Vector3, time: number, gain: number, vignette: number, aspect: number, vfovDeg: number, heightPx: number, weight = 1): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    u.uTime!.value = time
    u.uGain!.value = this.gain * gain * weight
    this.mesh.visible = weight > 0
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    u.uLod!.value = this.lod(vfovDeg, heightPx)
    u.uHazeLod!.value = Math.log2(Math.max((this.hazePerTan * 2 * Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2)) / heightPx, 1))
  }

  lod(vfovDeg: number, heightPx: number): number {
    return Math.log2(Math.max((this.texelsPerTan * 2 * Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2)) / heightPx, 1))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
