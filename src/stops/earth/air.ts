import * as THREE from 'three'

export interface AirLook {
  top: number
  heights: number[]
  colors: number[][]
  dir: [number, number, number]
  day: [number, number]
  rim: [number, number, number]
  rimNight: [number, number, number]
  night: [number, number, number]
  nightHeight: number
  inner: number
  innerStrength: number
}

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
in vec3 vClip;
uniform vec3 uCam;
uniform vec3 uGlowDir;
uniform vec2 uDay;
uniform vec3 uColor[3];
uniform vec3 uHeight;
uniform vec3 uRim;
uniform vec3 uRimNight;
uniform vec3 uNightColor;
uniform float uNightHeight;
uniform vec2 uInner;
uniform float uGain;
uniform float uWide;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt = sqrt(max(r * r - b * b, 0.0));
  vec3 at = b > 0.0 ? normalize(uCam + dir * b) : uCam / r;
  float h = (b > 0.0 ? rt : r) - 1.0;
  float day = smoothstep(uDay.x, uDay.y, dot(at, uGlowDir));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float lens = uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  if (h < 0.0) {
    float k = exp(h / uInner.x) * uInner.y;
    vec3 col = mix(uRimNight, uRim, day);
    float cover = k * mix(0.5, 1.0, day);
    outColor = vec4(col * cover * lens, cover);
    return;
  }
  float up = b > 0.0 ? 1.0 : clamp(1.0 + b / r, 0.0, 1.0);
  vec3 glow = uColor[0] * exp(-h / uHeight.x) + (uColor[1] * exp(-h / uHeight.y) + uColor[2] * exp(-h / uHeight.z)) * uWide;
  vec3 col = glow * day + uNightColor * exp(-h / uNightHeight);
  outColor = vec4(col * up * lens, 0.0);
}`

export class Air {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(p: AirLook, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCam: { value: new THREE.Vector3(0, 0, 3) },
        uGlowDir: { value: new THREE.Vector3().fromArray(p.dir).normalize() },
        uDay: { value: new THREE.Vector2(p.day[0], p.day[1]) },
        uColor: { value: p.colors.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
        uHeight: { value: new THREE.Vector3(p.heights[0], p.heights[1], p.heights[2]) },
        uRim: { value: new THREE.Vector3().fromArray(p.rim) },
        uRimNight: { value: new THREE.Vector3().fromArray(p.rimNight) },
        uNightColor: { value: new THREE.Vector3().fromArray(p.night) },
        uNightHeight: { value: p.nightHeight },
        uInner: { value: new THREE.Vector2(p.inner, p.innerStrength) },
        uGain: { value: 1 }, uWide: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uDiag: diag,
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
