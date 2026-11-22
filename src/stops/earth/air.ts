import * as THREE from 'three'
import { AURORA_GLSL, type Aurora } from './aurora'

export interface AirLook {
  top: number
  heights: number[]
  colors: number[][]
  powers: number[]
  dir: number[]
  dayFrom: number
  line: number[]
  linePower: number
  lineWidth: number
  lineAt: number
  mapRows: number[]
  rim: number[]
  rimNight: number[]
  inner: number
  innerStrength: number
  lineAway: number[]
  innerWide: number[]
  nightLine: number[]
  nightGlow: number[]
  nightAt: number[]
  nightSide: number[]
  lineEnd: number[]
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vClip;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vLocal;
in vec3 vClip;
uniform vec3 uCam;
uniform sampler2D uMap;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uPhysical;
uniform vec3 uGlowDir;
uniform float uDayFrom;
uniform vec3 uColor[4];
uniform vec4 uHeight;
uniform vec4 uPower;
uniform vec4 uLine;
uniform vec3 uLineShape;
uniform vec2 uRows;
uniform vec3 uRim;
uniform vec3 uRimNight;
uniform vec2 uInner;
uniform vec2 uInnerWide;
uniform float uTop;
uniform float uGain;
uniform float uWide;
uniform float uAway;
uniform vec2 uLineAway;
uniform vec2 uNightLine;
uniform vec4 uNightGlow;
uniform vec2 uNightAt;
uniform vec2 uNightSide;
uniform vec2 uLineEnd;
uniform float uFree;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
out vec4 outColor;
${AURORA_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vLocal - uCam);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt = sqrt(max(r * r - b * b, 0.0));
  vec3 at = b > 0.0 ? normalize(uCam + dir * b) : uCam / r;
  float h = (b > 0.0 ? rt : r) - 1.0;
  float x = clamp((dot(at, uGlowDir) - uDayFrom) / (1.0 - uDayFrom), 0.0, 1.0);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float lens = uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float turn = atan(dot(at, uRight), dot(at, uUp)) / 6.2831853;
  float rise = sqrt(clamp(h / uTop, 0.0, 1.0));
  vec4 seen = mix(texture(uMap, vec2(turn, clamp(rise, 0.008, 0.992) * uRows.x)) * 4.0, vec4(1.0), uPhysical);
  float lw = (h - uLineShape.z) / (uLineShape.x * (1.0 + uLineAway.x * uAway));
  vec3 line = uLine.rgb * (pow(x, uLine.w) * exp(-lw * lw) * seen.a * (1.0 - uLineAway.y * uAway) * smoothstep(uLineEnd.x, uLineEnd.y, x));
  vec4 held = texture(uMap, vec2(turn, uRows.y));
  float dusk = 1.0 - smoothstep(uNightSide.x, uNightSide.y, x);
  float nd = min(min(h, 0.0) - uNightAt.x, 0.0) / uNightAt.y;
  float shell = exp(-nd * nd) * (h > 0.0 ? exp(-h / uNightGlow.w) * uFree : 1.0);
  vec3 night = uNightGlow.rgb * (mix(max(held.a - 0.125, 0.0) * uNightLine.x, uNightLine.y * dusk, uFree) * shell);
  vec3 curtain = aurora(at, h, uAway);
  if (h < 0.0) {
    vec3 rim = mix(held.rgb * held.rgb * 4.0, mix(uRimNight, uRim, smoothstep(0.42, 0.68, x)), uPhysical);
    float hw = h / uInnerWide.x;
    float cover = exp(h / uInner.x) * uInner.y + exp(-hw * hw) * uInnerWide.y;
    outColor = vec4((rim * cover + line + night + curtain) * lens, cover);
    return;
  }
  float up = b > 0.0 ? 1.0 : clamp(1.0 + b / r, 0.0, 1.0);
  vec4 fall = exp(-h / uHeight) * pow(vec4(x), uPower) * vec4(1.0, 1.0, uWide, uWide);
  vec3 glow = uColor[0] * fall.x + uColor[1] * fall.y + uColor[2] * fall.z + uColor[3] * fall.w;
  float edge = 1.0 - smoothstep(0.7 * uTop, 0.98 * uTop, h);
  outColor = vec4((glow * seen.rgb * edge + line + night + curtain) * up * lens, 0.0);
}`

export class Air {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(p: AirLook, map: THREE.Texture, diag: THREE.IUniform<number>, curtain: Aurora) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCam: { value: new THREE.Vector3(0, 0, 3) },
        uMap: { value: map },
        uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) },
        uPhysical: { value: 0 },
        uGlowDir: { value: new THREE.Vector3().fromArray(p.dir).normalize() },
        uDayFrom: { value: p.dayFrom },
        uColor: { value: p.colors.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uHeight: { value: new THREE.Vector4().fromArray(p.heights) },
        uPower: { value: new THREE.Vector4().fromArray(p.powers) },
        uLine: { value: new THREE.Vector4(p.line[0], p.line[1], p.line[2], p.linePower) },
        uLineShape: { value: new THREE.Vector3(p.lineWidth, 0.5, p.lineAt) },
        uRows: { value: new THREE.Vector2(p.mapRows[0]! / (p.mapRows[0]! + p.mapRows[1]!), (p.mapRows[0]! + 0.5 * p.mapRows[1]!) / (p.mapRows[0]! + p.mapRows[1]!)) },
        uRim: { value: new THREE.Vector3().fromArray(p.rim) },
        uRimNight: { value: new THREE.Vector3().fromArray(p.rimNight) },
        uInner: { value: new THREE.Vector2(p.inner, p.innerStrength) },
        uInnerWide: { value: new THREE.Vector2().fromArray(p.innerWide) },
        uTop: { value: p.top },
        uGain: { value: 1 }, uWide: { value: 1 }, uAway: { value: 0 }, uFree: { value: 0 }, uNightLine: { value: new THREE.Vector2().fromArray(p.nightLine) }, uNightGlow: { value: new THREE.Vector4().fromArray(p.nightGlow) }, uNightAt: { value: new THREE.Vector2().fromArray(p.nightAt) }, uNightSide: { value: new THREE.Vector2().fromArray(p.nightSide) }, uLineEnd: { value: new THREE.Vector2().fromArray(p.lineEnd) }, uLineAway: { value: new THREE.Vector2(p.lineAway[0], p.lineAway[1]) }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uDiag: diag,
        ...curtain.uniforms,
      },
      side: THREE.BackSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1 + p.top, 160, 80), this.material)
    this.mesh.renderOrder = 5
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
