import * as THREE from 'three'
import { Pass, floatTarget } from '../core/pass'
import type { PostParams } from '../core/types'
import { isRaw } from '../diagnostics/diag'

const DOWN = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uPrefilter;
in vec2 vUv;
out vec4 outColor;
vec3 pre(vec3 c) {
  if (uPrefilter < 0.5) return c;
  c = min(max(c, vec3(0.0)), vec3(64.0));
  float l = max(c.r, max(c.g, c.b));
  return c / (1.0 + l * 0.02);
}
void main() {
  vec2 t = uTexel;
  vec3 a = pre(texture(uTex, vUv + t * vec2(-2.0, 2.0)).rgb);
  vec3 b = pre(texture(uTex, vUv + t * vec2(0.0, 2.0)).rgb);
  vec3 c = pre(texture(uTex, vUv + t * vec2(2.0, 2.0)).rgb);
  vec3 d = pre(texture(uTex, vUv + t * vec2(-2.0, 0.0)).rgb);
  vec3 e = pre(texture(uTex, vUv).rgb);
  vec3 f = pre(texture(uTex, vUv + t * vec2(2.0, 0.0)).rgb);
  vec3 g = pre(texture(uTex, vUv + t * vec2(-2.0, -2.0)).rgb);
  vec3 h = pre(texture(uTex, vUv + t * vec2(0.0, -2.0)).rgb);
  vec3 i = pre(texture(uTex, vUv + t * vec2(2.0, -2.0)).rgb);
  vec3 j = pre(texture(uTex, vUv + t * vec2(-1.0, 1.0)).rgb);
  vec3 k = pre(texture(uTex, vUv + t * vec2(1.0, 1.0)).rgb);
  vec3 l = pre(texture(uTex, vUv + t * vec2(-1.0, -1.0)).rgb);
  vec3 m = pre(texture(uTex, vUv + t * vec2(1.0, -1.0)).rgb);
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  outColor = vec4(col, 1.0);
}`

const UP = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform float uRadius;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 t = uTexel * uRadius;
  vec3 s = texture(uTex, vUv + vec2(-t.x, t.y)).rgb + texture(uTex, vUv + vec2(t.x, t.y)).rgb + texture(uTex, vUv + vec2(-t.x, -t.y)).rgb + texture(uTex, vUv + vec2(t.x, -t.y)).rgb;
  s += 2.0 * (texture(uTex, vUv + vec2(0.0, t.y)).rgb + texture(uTex, vUv + vec2(0.0, -t.y)).rgb + texture(uTex, vUv + vec2(t.x, 0.0)).rgb + texture(uTex, vUv + vec2(-t.x, 0.0)).rgb);
  s += 4.0 * texture(uTex, vUv).rgb;
  outColor = vec4(s / 16.0 + texture(uBase, vUv).rgb, 1.0);
}`

const FINAL = /* glsl */ `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uBloomNorm;
uniform float uExposure;
uniform float uVignette;
uniform float uGrain;
uniform float uSaturation;
uniform float uContrast;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uFade;
uniform float uFrame;
uniform float uAspect;
uniform int uMode;
uniform sampler2D uStreak;
uniform float uFlare;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p, float s) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973) + s * 0.6180339);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 filmic(vec3 x) {
  x = max(x, vec3(0.0));
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
void main() {
  vec4 scene = texture(uScene, vUv);
  vec3 hdr = scene.rgb;
  if (uMode == 1) {
    outColor = vec4(toSrgb(hdr), 1.0);
    return;
  }
  if (uMode == 2) {
    outColor = vec4(clamp(hdr, 0.0, 1.0), 1.0);
    return;
  }
  vec3 bloom = texture(uBloom, vUv).rgb * uBloomNorm;
  hdr = mix(hdr, bloom, uBloomStrength);
  hdr += texture(uStreak, vUv).rgb * vec3(0.55, 0.78, 1.0) * uFlare * 0.35;
  hdr *= uExposure;
  vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r2 = dot(q, q);
  hdr *= mix(1.0, 1.0 / pow(1.0 + r2 * 0.9, 2.0), uVignette);
  vec3 c = filmic(hdr);
  c = toSrgb(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);
  c = (c - 0.5) * uContrast + 0.5;
  c = c * uGain + uLift * (1.0 - c);
  c *= uFade;
  vec2 px = gl_FragCoord.xy;
  float g = hash(px, uFrame) + hash(px + 17.0, uFrame + 3.0) - 1.0;
  float lum = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  float live = step(0.0001, uFade) * (uMode == 3 ? 0.0 : 1.0);
  c += g * uGrain * mix(0.6, 1.0, 1.0 - abs(lum - 0.35) * 1.4) * live;
  float d1 = hash(px + 61.0, uFrame + 7.0) + hash(px + 113.0, uFrame + 11.0) - 1.0;
  c += d1 / 255.0 * live;
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`

const STREAK = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform float uThreshold;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = -20; i <= 20; i++) {
    float w = exp(-abs(float(i)) / 7.0);
    vec3 c = texture(uTex, vUv + uStep * float(i)).rgb;
    float l = max(c.r, max(c.g, c.b));
    sum += c * max(l - uThreshold, 0.0) / max(l, 1e-4) * w;
    total += w;
  }
  outColor = vec4(sum / total, 1.0);
}`

export const INVERSE_FILMIC_GLSL = /* glsl */ `
vec3 inverseFilmic(vec3 y) {
  y = clamp(y, 0.0, 0.985);
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  vec3 k = d * y - b;
  return (-k - sqrt(max(k * k - 4.0 * (c * y - a) * e * y, 0.0))) / (2.0 * (c * y - a));
}`

const LEVELS = 6
const STREAK_LEVEL = 3

export class PostChain {
  private downs: THREE.WebGLRenderTarget[] = []
  private ups: THREE.WebGLRenderTarget[] = []
  private readonly down: Pass
  private readonly up: Pass
  private readonly final: Pass
  private readonly streak: Pass
  private streaks: THREE.WebGLRenderTarget[] = []
  private width = 0
  private height = 0

  constructor() {
    this.down = new Pass(DOWN, { uTex: { value: null }, uTexel: { value: new THREE.Vector2() }, uPrefilter: { value: 0 } })
    this.up = new Pass(UP, { uTex: { value: null }, uBase: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1 } })
    this.final = new Pass(FINAL, {
      uScene: { value: null }, uBloom: { value: null }, uBloomStrength: { value: 0.1 }, uBloomNorm: { value: 1 / LEVELS }, uExposure: { value: 1 },
      uVignette: { value: 0.5 }, uGrain: { value: 0.01 }, uSaturation: { value: 1 }, uContrast: { value: 1 }, uLift: { value: new THREE.Vector3() }, uGain: { value: new THREE.Vector3(1, 1, 1) },
      uFade: { value: 1 }, uFrame: { value: 0 }, uAspect: { value: 16 / 9 }, uMode: { value: 0 }, uStreak: { value: null }, uFlare: { value: 0 },
    })
    this.streak = new Pass(STREAK, { uTex: { value: null }, uStep: { value: new THREE.Vector2() }, uThreshold: { value: 0 } })
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return
    this.disposeTargets()
    this.width = width
    this.height = height
    let w = width
    let h = height
    for (let i = 0; i < LEVELS; i++) {
      w = Math.max(2, Math.ceil(w / 2))
      h = Math.max(2, Math.ceil(h / 2))
      this.downs.push(floatTarget(w, h, THREE.HalfFloatType))
      this.ups.push(floatTarget(w, h, THREE.HalfFloatType))
      if (i === STREAK_LEVEL) this.streaks.push(floatTarget(w, h, THREE.HalfFloatType), floatTarget(w, h, THREE.HalfFloatType))
    }
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Texture, p: PostParams, frame: number, diag: string): void {
    const d = this.down.material.uniforms
    const u = this.up.material.uniforms
    let src = scene
    let sw = this.width
    let sh = this.height
    for (let i = 0; i < LEVELS; i++) {
      d.uTex!.value = src
      ;(d.uTexel!.value as THREE.Vector2).set(1 / sw, 1 / sh)
      d.uPrefilter!.value = i === 0 ? 1 : 0
      this.down.render(renderer, this.downs[i]!)
      src = this.downs[i]!.texture
      sw = this.downs[i]!.width
      sh = this.downs[i]!.height
    }
    let acc: THREE.Texture = this.downs[LEVELS - 1]!.texture
    for (let i = LEVELS - 2; i >= 0; i--) {
      const below = i === LEVELS - 2 ? this.downs[LEVELS - 1]! : this.ups[i + 1]!
      u.uTex!.value = acc
      u.uBase!.value = this.downs[i]!.texture
      ;(u.uTexel!.value as THREE.Vector2).set(1 / below.width, 1 / below.height)
      u.uRadius!.value = p.bloomRadius
      this.up.render(renderer, this.ups[i]!)
      acc = this.ups[i]!.texture
    }
    const st = this.streak.material.uniforms
    const level = this.downs[STREAK_LEVEL]!
    st.uTex!.value = level.texture
    ;(st.uStep!.value as THREE.Vector2).set(1 / level.width, 0)
    st.uThreshold!.value = 14
    this.streak.render(renderer, this.streaks[0]!)
    st.uTex!.value = this.streaks[0]!.texture
    ;(st.uStep!.value as THREE.Vector2).set(3 / level.width, 0)
    st.uThreshold!.value = 0
    this.streak.render(renderer, this.streaks[1]!)
    const f = this.final.material.uniforms
    f.uStreak!.value = this.streaks[1]!.texture
    f.uFlare!.value = p.flare
    f.uScene!.value = scene
    f.uBloom!.value = acc
    f.uBloomStrength!.value = p.bloomStrength
    f.uExposure!.value = p.exposure
    f.uVignette!.value = p.vignette
    f.uGrain!.value = p.grain
    f.uSaturation!.value = p.saturation
    f.uContrast!.value = p.contrast
    ;(f.uLift!.value as THREE.Vector3).fromArray(p.lift)
    ;(f.uGain!.value as THREE.Vector3).fromArray(p.gain)
    f.uFade!.value = p.fade
    f.uFrame!.value = frame % 4096
    f.uAspect!.value = this.width / this.height
    f.uMode!.value = diag === 'ungraded' ? 1 : diag === 'nograin' ? 3 : isRaw(diag) ? 2 : 0
    this.final.render(renderer, null)
  }

  private disposeTargets(): void {
    for (const t of this.downs) t.dispose()
    for (const t of this.ups) t.dispose()
    for (const t of this.streaks) t.dispose()
    this.streaks = []
    this.downs = []
    this.ups = []
  }
}

export function defaultPost(): PostParams {
  return { exposure: 1, bloomStrength: 0.08, bloomRadius: 1, vignette: 0.45, grain: 0.012, saturation: 1, contrast: 1, lift: [0, 0, 0], gain: [1, 1, 1], fade: 1, flare: 0 }
}
