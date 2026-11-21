import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'

export interface VeilLook {
  sheets: { lowest: number; step: number; size: number; near: [number, number, number]; gamma: number; top: number; holes: [number, number]; deep: number; edge: [number, number]; thin: number; ramp: number; fan: [number, number, number, number]; wave: number; haze: number; sunward: [number, number]; shift: [number, number]; dense: number; ceiling: [number, number]; solid: [number, number] }
  fog: [number, number, number]
  fogOrbit: [number, number, number]
  pad: number
  mean: [number, number, number]
  light: [number, number]
  lit: [number, number, number]
  litTerrain: [number, number, number]
  haze: [number, number, number]
  hazeTerrain: [number, number, number]
  edgePx: number
}

export interface AirCarry { map: THREE.Texture; fwd: THREE.Vector3; right: THREE.Vector3; span: THREE.Vector3; cut: THREE.Vector3; gain: number; soft: number; tint: [number, number, number] }

const COUNT = 4

const VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform mat4 uInvProj;
uniform mat3 uRot;
uniform vec3 uCam;
uniform float uRush;
uniform vec4 uFan;
uniform float uWave;
uniform float uBend;
uniform float uRamp;
uniform vec3 uCentre;
uniform float uPx;
uniform float uAmount;
uniform vec4 uSheet;
uniform vec4 uForm;
uniform vec3 uFade;
uniform vec4 uTone;
uniform sampler2D uClouds;
uniform vec3 uUp;
uniform vec3 uE1;
uniform vec3 uE2;
uniform vec4 uLight;
uniform vec3 uMean;
uniform vec3 uSunCam;
uniform vec2 uSunward;
uniform vec3 uLit;
uniform vec3 uHaze;
uniform float uGain;
uniform float uGamma;
uniform float uPad;
uniform float uDense;
uniform vec2 uCeil;
uniform vec2 uSolid;
uniform vec3 uFog;
uniform float uTall;
uniform sampler2D uAir;
uniform float uAirW;
uniform vec3 uAirFwd;
uniform vec3 uAirRight;
uniform vec3 uSpan;
uniform vec3 uCut;
uniform float uAirGain;
uniform float uAirSoft;
uniform vec3 uAirTint;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${NOISE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec4 far = uInvProj * vec4(vNdc, 0.0, 1.0);
  vec3 ray = normalize(far.xyz / far.w);
  float cc = dot(uCentre, uCentre);
  float reach = dot(uCentre, ray);
  float miss = reach > 0.0 ? sqrt(max(cc - reach * reach, 0.0)) : sqrt(cc);
  float mask = clamp((1.0 - miss) / (uPx * sqrt(max(cc - 1.0, 1e-8))) + 0.5, 0.0, 1.0);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  for (int pass = 0; pass < (mask > 0.0 && uAmount > 0.0 ? 1 : 0); pass++) {
    vec3 d = uRot * ray;
    vec3 nadir = -normalize(uCam);
    float cn = clamp(dot(d, nadir), -1.0, 1.0);
    vec3 aside = d - nadir * cn;
    float bent = acos(cn) * uBend;
    d = nadir * cos(bent) + aside / max(length(aside), 1e-6) * sin(bent);
    float b = dot(uCam, d);
    float c2 = dot(uCam, uCam);
    float h = max(sqrt(c2) - 1.0, 1e-7);
    float level = log(h / uSheet.x) / log(uSheet.y);
    float top = floor(level);
    float through = 1.0;
    float toSun = max(dot(ray, uSunCam), 0.0);
    float sunward = 1.0 + uSunward.x * pow(toSun, uSunward.y);
    vec3 fog = uHaze * (uFog.x + uFog.y * pow(toSun, uFog.z));
    float horizon = sqrt(max(c2 - 1.0, 1e-8));
    float bar = uForm.x - uForm.z * pow(uAmount, uRamp);
    float open = smoothstep(0.0, uSolid.x, uAmount);
    vec3 below = normalize(uCam);
    vec2 foot0 = vec2(dot(below, uE1), dot(below, uE2)) * 2.0 / (1.0 + max(dot(below, uUp), -0.5));
    for (int j = 0; j < ${COUNT}; j++) {
      float i = top - float(j);
      float x = level - i;
      float a = uSheet.x * pow(uSheet.y, i);
      float r = 1.0 + a;
      float t = -b - sqrt(max(b * b - c2 + r * r, 0.0));
      vec3 p = (uCam + d * t) / r;
      vec2 st = vec2(dot(p, uE1), dot(p, uE2)) * 2.0 / (1.0 + max(dot(p, uUp), -0.5)) / (uSheet.z * a);
      vec2 uv = st.x * uLight.xy + st.y * vec2(-uLight.y, uLight.x) + uLight.zw * i;
      vec2 gx = dFdx(uv);
      vec2 gy = dFdy(uv);
      vec2 out2 = st - foot0 / (uSheet.z * a);
      vec2 fan = vec2(atan(out2.y, out2.x), log(max(length(out2), 1e-6)));
      float lump = vnoise(vec3(st * uForm.w, i * 3.7));
      fan.x += (lump - 0.5) * uWave;
      for (int k = 0; k < (uRush > 0.0 ? 1 : 0); k++) {
        float lines = 0.65 * vnoise(vec3(fan * uFan.xy, i * 3.7)) + 0.35 * vnoise(vec3(fan * uFan.xy * vec2(uFan.z, 1.0) + 7.3, i * 5.1));
        lump = mix(lump, lines, uRush);
      }
      float wide = 1.0 + uRush * uFan.w;
      vec3 tex = textureGrad(uClouds, vec2(uv.x, (fract(uv.y) + uPad) * uTall), gx * vec2(1.0, uTall) * wide, gy * vec2(1.0, uTall) * wide).rgb;
      float n = sqrt(clamp(dot(tex, vec3(0.2126, 0.7152, 0.0722)) / uTone.y, 0.0, 1.0)) - 0.5 + (lump - 0.5) * uTone.x;
      float al = smoothstep(bar, bar + uForm.y, n) * open * uDense * smoothstep(uFade.x, uFade.y, x) * (1.0 - smoothstep(uFade.z, ${COUNT.toFixed(1)}, x)) * (1.0 - smoothstep(uCeil.x, uCeil.y, a));
      float misted = 1.0 - (1.0 - uTone.w * smoothstep(0.1, 0.9, t / horizon)) * (1.0 - uTone.z * smoothstep(uFade.x, uFade.z, x));
      vec3 c = mix(uLit * pow(tex / uMean, vec3(uGamma)) * sunward, fog, misted);
      col += through * al * c;
      through *= 1.0 - al;
    }
    float solid = smoothstep(uSolid.x, uSolid.y, uAmount);
    col += through * solid * fog;
    through *= 1.0 - solid;
    alpha = (1.0 - through) * mask;
    col *= mask * uGain;
  }
  for (int pass = 0; pass < (mask < 1.0 && uAirW > 0.0 ? 1 : 0); pass++) {
    vec3 up = -uCentre / sqrt(cc);
    float s = clamp(dot(ray, up), -1.0, 1.0);
    float elev = asin(s) + acos(min(1.0 / sqrt(cc), 1.0));
    vec3 along = ray - up * s;
    float az = atan(dot(along, uAirRight), dot(along, uAirFwd));
    vec2 uv = vec2(clamp(az / uSpan.x * 0.5 + 0.5, 0.0, 1.0), pow(clamp(elev / uSpan.y, 0.0, 1.0), uSpan.z));
    vec3 glow = inverseFilmic(textureLod(uAir, uv, 0.0).rgb);
    float lum = dot(glow, vec3(0.2126, 0.7152, 0.0722));
    float kept = 1.0 / (1.0 + uAirSoft * (1.0 - uAirW) * lum);
    glow = mix(lum * uAirTint, glow, kept) * kept;
    float cut = uCut.z * smoothstep(uCut.x, uCut.y, dot(glow, vec3(0.3, 0.5, 0.2)));
    float w = uAirW * (1.0 - mask);
    col += glow * uAirGain * w;
    alpha += cut * w;
  }
  vec2 vq = vNdc * 0.5 * vec2(uAspect, 1.0);
  col /= mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, alpha);
}`

export class Veil {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly m = new THREE.Matrix4()
  private readonly a = new THREE.Vector3()
  private readonly b = new THREE.Vector3()

  constructor(private readonly look: VeilLook, clouds: THREE.Texture, air: AirCarry, diag: THREE.IUniform<number>) {
    const s = look.sheets
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uInvProj: { value: new THREE.Matrix4() }, uRot: { value: new THREE.Matrix3() }, uCam: { value: new THREE.Vector3(0, 0, 2) }, uRush: { value: 0 }, uFan: { value: new THREE.Vector4().fromArray(s.fan) }, uWave: { value: s.wave }, uBend: { value: 1 }, uRamp: { value: s.ramp }, uCentre: { value: new THREE.Vector3(0, 0, -2) }, uPx: { value: 0.001 }, uAmount: { value: 0 },
        uSheet: { value: new THREE.Vector4(s.lowest, s.step, s.size, 0) }, uFade: { value: new THREE.Vector3().fromArray(s.near) }, uForm: { value: new THREE.Vector4(s.edge[0], s.edge[1], s.thin, s.holes[1]) }, uTone: { value: new THREE.Vector4(s.holes[0], s.top, s.deep, s.haze) }, uGamma: { value: s.gamma }, uDense: { value: s.dense }, uCeil: { value: new THREE.Vector2().fromArray(s.ceiling) }, uSolid: { value: new THREE.Vector2().fromArray(s.solid) }, uFog: { value: new THREE.Vector3() }, uPad: { value: look.pad }, uTall: { value: 1 / (1 + 2 * look.pad) },
        uClouds: { value: clouds }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uE1: { value: new THREE.Vector3(1, 0, 0) }, uE2: { value: new THREE.Vector3(0, 0, 1) }, uLight: { value: new THREE.Vector4(look.light[0], look.light[1], s.shift[0], s.shift[1]) }, uMean: { value: new THREE.Vector3().fromArray(look.mean) },
        uSunCam: { value: new THREE.Vector3(0, 0, -1) }, uSunward: { value: new THREE.Vector2().fromArray(s.sunward) },
        uLit: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Vector3() }, uGain: { value: 1 },
        uAir: { value: air.map }, uAirW: { value: 0 }, uAirFwd: { value: new THREE.Vector3(0, 0, -1) }, uAirRight: { value: new THREE.Vector3(1, 0, 0) }, uSpan: { value: air.span }, uCut: { value: air.cut }, uAirGain: { value: air.gain }, uAirSoft: { value: air.soft }, uAirTint: { value: new THREE.Vector3().fromArray(air.tint) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diag,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.visible = false
  }

  hide(): void {
    this.mesh.visible = false
  }

  update(camera: THREE.PerspectiveCamera, width: number, height: number, centre: THREE.Vector3, eye: THREE.Vector3, rush: number, bend: number, turn: THREE.Quaternion, amount: number, side: number, frame: { up: THREE.Vector3; e1: THREE.Vector3; e2: THREE.Vector3 }, sunCam: THREE.Vector3, air: number, airFwd: THREE.Vector3, airRight: THREE.Vector3, gain: number, airGain: number, vignette: number): void {
    const on = amount > 0 || air > 0
    this.mesh.visible = on
    if (!on) return
    const u = this.material.uniforms
    const l = this.look
    ;(u.uInvProj!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse)
    ;(u.uRot!.value as THREE.Matrix3).setFromMatrix4(this.m.makeRotationFromQuaternion(turn))
    ;(u.uCam!.value as THREE.Vector3).copy(eye)
    u.uRush!.value = rush
    u.uBend!.value = bend
    ;(u.uCentre!.value as THREE.Vector3).copy(centre)
    u.uPx!.value = l.edgePx * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / height
    u.uAmount!.value = amount
    ;(u.uUp!.value as THREE.Vector3).copy(frame.up)
    ;(u.uE1!.value as THREE.Vector3).copy(frame.e1)
    ;(u.uE2!.value as THREE.Vector3).copy(frame.e2)
    ;(u.uSunCam!.value as THREE.Vector3).copy(sunCam)
    ;(u.uLit!.value as THREE.Vector3).copy(this.a.fromArray(l.litTerrain)).lerp(this.b.fromArray(l.lit), side)
    ;(u.uHaze!.value as THREE.Vector3).copy(this.a.fromArray(l.hazeTerrain)).lerp(this.b.fromArray(l.haze), side)
    ;(u.uFog!.value as THREE.Vector3).copy(this.a.fromArray(l.fog)).lerp(this.b.fromArray(l.fogOrbit), side)
    u.uGain!.value = gain
    u.uAirW!.value = air
    ;(u.uAirFwd!.value as THREE.Vector3).copy(airFwd)
    ;(u.uAirRight!.value as THREE.Vector3).copy(airRight)
    u.uAirGain!.value = airGain
    u.uVignette!.value = vignette
    u.uAspect!.value = width / height
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
