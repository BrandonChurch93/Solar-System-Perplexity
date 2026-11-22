import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface AuroraLook {
  pa: number[]
  top: number
  low: number
  eye: number[]
  sway: number[]
  wave: number[]
  stretch: number[]
  fade: number[]
  calm: number[]
  tail: number[]
  day: number[]
}

export const AURORA_GLSL = /* glsl */ `
uniform sampler2D uAurora;
uniform mat3 uAuroraTurn;
uniform vec3 uAuroraAxis;
uniform vec4 uAuroraSpan;
uniform float uAuroraGain;
uniform float uAuroraClock;
uniform vec3 uAuroraSway;
uniform vec3 uAuroraWave;
uniform vec3 uAuroraStretch;
uniform vec2 uAuroraTail;
uniform vec2 uAuroraDay;
uniform vec3 uAuroraSun;
${INVERSE_FILMIC_GLSL}
float auroraWob(float a, float t) {
  return 0.5 * sin(7.0 * a - 1.3 * t + 1.7 * sin(3.0 * a)) + 0.3 * sin(uAuroraWave.y * a - uAuroraWave.z * t + 2.3 * sin(5.0 * a + 1.0)) + 0.2 * sin(29.0 * a + 1.7 * t + 1.1 * sin(2.0 * a));
}
vec3 aurora(vec3 at, float h, float away) {
  vec3 ac = uAuroraTurn * at;
  vec3 p = ac - uAuroraAxis * dot(ac, uAuroraAxis);
  float pa = atan(p.x - uAuroraAxis.x * p.z / uAuroraAxis.z, p.y - uAuroraAxis.y * p.z / uAuroraAxis.z);
  float along = (pa - uAuroraSpan.x) / (uAuroraSpan.y - uAuroraSpan.x);
  float a = along * 6.2831853;
  float tall = 1.0 + uAuroraStretch.x * (sin(uAuroraStretch.y * a + uAuroraStretch.z * uAuroraClock) - sin(uAuroraStretch.y * a));
  float hs = h > 0.0 ? h / tall : h;
  float lift = max(hs, 0.0) / uAuroraSpan.w;
  float u = along + uAuroraSway.x * lift * (sin(uAuroraSway.y * a + uAuroraSway.z * uAuroraClock + 4.0 * lift) - sin(uAuroraSway.y * a + 4.0 * lift));
  vec2 uv = vec2(u, (hs - uAuroraSpan.z) / (uAuroraSpan.w - uAuroraSpan.z));
  vec2 gx = dFdx(uv);
  vec2 gy = dFdy(uv);
  vec3 col = vec3(0.0);
  bool lit = uAuroraGain > 0.0 && along > 0.0 && along < 1.0 && uv.y > 0.0 && uv.y < 1.0;
  for (int k = 0; k < (lit ? 1 : 0); k++) {
    float bright = 1.0 + uAuroraWave.x * (auroraWob(a, uAuroraClock) - auroraWob(a, 0.0));
    float ends = 1.0 - away * max(smoothstep(uAuroraTail.x, uAuroraTail.y, along), smoothstep(uAuroraDay.x, uAuroraDay.y, dot(ac, uAuroraSun)));
    col = inverseFilmic(textureGrad(uAurora, uv, gx, gy).rgb) * (bright * ends * uAuroraGain);
  }
  return col;
}`

export class Aurora {
  readonly uniforms: Record<string, THREE.IUniform>
  readonly turn = new THREE.Quaternion()

  private readonly look: AuroraLook
  private readonly back = new THREE.Quaternion()
  private readonly spin = new THREE.Matrix4()

  constructor(p: AuroraLook, map: THREE.Texture) {
    this.look = p
    const rad = THREE.MathUtils.degToRad
    this.uniforms = {
      uAurora: { value: map }, uAuroraTurn: { value: new THREE.Matrix3() }, uAuroraAxis: { value: new THREE.Vector3().fromArray(p.eye).normalize() },
      uAuroraSpan: { value: new THREE.Vector4(rad(p.pa[0]!), rad(p.pa[1]!), p.low, p.top) }, uAuroraGain: { value: 0 }, uAuroraClock: { value: 0 },
      uAuroraSway: { value: new THREE.Vector3().fromArray(p.sway) }, uAuroraWave: { value: new THREE.Vector3().fromArray(p.wave) }, uAuroraStretch: { value: new THREE.Vector3().fromArray(p.stretch) },
      uAuroraTail: { value: new THREE.Vector2().fromArray(p.tail) }, uAuroraDay: { value: new THREE.Vector2().fromArray(p.day) }, uAuroraSun: { value: new THREE.Vector3(0, 0, 1) },
    }
  }

  update(clock: number, gain: number, sun: THREE.Vector3): void {
    const u = this.uniforms
    const c = this.look.calm
    const x = Math.min(Math.max((Math.abs(clock) - c[0]!) / (c[1]! - c[0]!), 0), 1)
    const lively = 1 + (c[2]! - 1) * x * x * (3 - 2 * x)
    ;(u.uAuroraSway!.value as THREE.Vector3).x = this.look.sway[0]! * lively
    ;(u.uAuroraWave!.value as THREE.Vector3).x = this.look.wave[0]! * lively
    ;(u.uAuroraStretch!.value as THREE.Vector3).x = this.look.stretch[0]! * lively
    u.uAuroraClock!.value = clock
    u.uAuroraGain!.value = gain
    this.back.copy(this.turn).invert()
    ;(u.uAuroraTurn!.value as THREE.Matrix3).setFromMatrix4(this.spin.makeRotationFromQuaternion(this.back))
    ;(u.uAuroraSun!.value as THREE.Vector3).copy(sun).applyQuaternion(this.back)
  }
}
