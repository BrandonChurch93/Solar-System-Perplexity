import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, fineUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import deckJson from './deck.json'
import nearJson from './deck-near.json'
import cloudJson from './deck-cloud.json'

export interface DeckLook {
  flow: [number, number, number, number]
  limb: [number, number]
  edge: number
  inset: [number, number]
  lift: number
  sharp: number
  bloom: number
  detail: { tone: number; relief: number; fleck: number; scale: number; stretch: [number, number] }
  near: [number, number]
  cloud: { height: number; tile: number; stretch: number; group: number; cover: [number, number]; curve: [number, number]; drift: number; gain: number; shade: number; reach: [number, number]; tint: [number, number, number]; lit: [number, number] }
}

const COMMON = /* glsl */ `
uniform vec3 uCentre;
uniform float uRadius;
uniform vec3 uUp;
uniform vec3 uF0;
uniform vec3 uR0;
uniform vec4 uPolar;
uniform vec4 uFlow;
uniform vec2 uFlowDir;
uniform float uTime;
vec3 onSphere(vec3 p) {
  return uCentre + uRadius * normalize(p - uCentre);
}
vec3 advect(vec3 p) {
  float along = dot(p, uF0) * uFlowDir.y + dot(p, uR0) * uFlowDir.x;
  float across = dot(p, uF0) * uFlowDir.x - dot(p, uR0) * uFlowDir.y;
  float k = uTime * (uFlow.x + uFlow.y * sin(across * uFlow.z + uFlow.w) + 0.4 * uFlow.y * sin(across * uFlow.z * 2.7 + along * 0.11 + 1.3));
  return onSphere(p - (uF0 * uFlowDir.y + uR0 * uFlowDir.x) * k);
}
vec2 polar(vec3 p) {
  vec3 n = normalize(p - uCentre);
  float c = dot(n, uUp);
  vec3 t = n - uUp * c;
  float s = uRadius * atan(length(t), c);
  float psi = atan(dot(t, uR0), dot(t, uF0));
  return vec2(psi / uPolar.x * 0.5 + 0.5, log(max(s, 1e-4) / uPolar.y) / uPolar.z);
}`

const VERT = /* glsl */ `
uniform sampler2D uHeight;
uniform float uLift;
out vec3 vBase;
out vec3 vView;
out vec3 vClip;
${COMMON}
void main() {
  vec3 pa = advect(position);
  float h = textureLod(uHeight, clamp(polar(pa), 0.0, 1.0), 0.0).r * uLift;
  vec3 n = normalize(position - uCentre);
  vec3 di = normalize(position);
  float mu = dot(n, -di);
  vec3 p = position - di * h / max(mu, 0.3) * smoothstep(0.0, 0.2, mu);
  vBase = position;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const DECK_LIGHT_GLSL = /* glsl */ `
uniform sampler2D uLight;
uniform vec2 uLightSize;
vec3 deckLight(float mu, float psi) {
  float m = clamp(mu, 0.0, 1.0);
  float y = sqrt(max(1.0 - sqrt(max(1.0 - m * m, 0.0)), 0.0));
  vec2 uv = vec2((clamp(psi / uPolar.x * 0.5 + 0.5, 0.0, 1.0) * (uLightSize.x - 1.0) + 0.5) / uLightSize.x, (y * (uLightSize.y - 1.0) + 0.5) / uLightSize.y);
  return textureLod(uLight, uv, 0.0).rgb;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uFar;
uniform vec2 uColorSize;
uniform vec2 uFarSize;
uniform vec4 uWin;
uniform vec3 uCamL;
uniform vec2 uLimb;
uniform float uEdge;
uniform vec2 uInset;
uniform float uAMax;
uniform float uEps;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uFade;
uniform float uGrad;
uniform float uFine;
uniform vec2 uLens;
uniform float uSharp;
uniform float uBloom;
uniform vec4 uDetail;
uniform vec4 uBase;
uniform vec2 uSunG;
uniform sampler2D uNear;
uniform vec4 uNearWin;
uniform vec3 uNearMix;
uniform sampler2D uCloud;
uniform vec4 uCloudA;
uniform vec4 uCloudB;
uniform vec4 uCloudC;
uniform vec4 uCloudD;
uniform vec3 uCloudTint;
uniform vec2 uCloudLit;
in vec3 vBase;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${COMMON}
${DECK_LIGHT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
float cell(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float soft(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(cell(i), cell(i + vec2(1.0, 0.0)), u.x), mix(cell(i + vec2(0.0, 1.0)), cell(i + vec2(1.0, 1.0)), u.x), u.y);
}
float billow(vec2 g, float fw) {
  vec2 q = g + 0.45 * vec2(soft(g * 0.7 + 3.1), soft(g * 0.7 + 7.7));
  float s = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 4; i++) {
    s += a * (1.0 - smoothstep(0.12, 0.35, fw * f)) * (soft(q * f) - 0.5);
    q = mat2(0.8, 0.6, -0.6, 0.8) * q + 11.3;
    f *= 2.07;
    a *= 0.5;
  }
  return s;
}
vec2 cloudPlace(vec3 q) {
  vec3 rel = q - uCentre;
  vec2 g = vec2(dot(rel, uF0) * uFlowDir.y + dot(rel, uR0) * uFlowDir.x + uTime * uCloudA.w, dot(rel, uF0) * uFlowDir.x - dot(rel, uR0) * uFlowDir.y);
  g.y += 0.1 * sin(g.x * 1.3 + 1.7 * sin(g.y * 0.8 + 0.5));
  return g;
}
float cloudAt(vec2 g, float wide) {
  vec2 gr = g * uCloudA.z;
  float group = 0.62 * soft(gr + 0.37) + 0.38 * soft(mat2(0.8, 0.6, -0.6, 0.8) * gr * 2.3 + 7.1);
  vec2 uv = g * uCloudA.y * vec2(uCloudD.y, 1.0);
  vec2 fit = vec2(1.0, 1.0 - 2.0 * uCloudD.x);
  float t = textureGrad(uCloud, vec2(uv.x, uCloudD.x + fract(uv.y) * fit.y), dFdx(uv) * fit * (wide * uFine), dFdy(uv) * fit * (wide * uFine)).r;
  return t * smoothstep(uCloudC.z, uCloudC.w, t) * smoothstep(uCloudC.x, uCloudC.y, group);
}
void main() {
  vec3 p = onSphere(vBase);
  vec3 n = normalize(p - uCentre);
  vec3 pa = advect(p);
  vec3 na = normalize(pa - uCentre);
  vec3 di = normalize(pa);
  float muI = dot(na, -di);
  float psiI = atan(dot(di, uR0), dot(di, uF0));
  float z = max(-pa.z, 1e-4);
  vec2 uvT = (pa.xy / z - uWin.xy) / (uWin.zw - uWin.xy);
  vec2 e = min(uvT, 1.0 - uvT);
  float wT = step(0.0, -pa.z) * smoothstep(0.0, uEdge, e.y) * smoothstep(uInset.x, uInset.y, min(e.x, uvT.y)) * smoothstep(uLimb.x, uLimb.y, muI);
  vec2 uvS = polar(pa);
  vec3 dv = normalize(p - uCamL);
  float mu = dot(n, -dv);
  float psi = atan(dot(dv, uR0), dot(dv, uF0));
  vec3 lNow = deckLight(mu, psi);
  vec3 lImg = deckLight(muI, psiI);
  vec2 uvC = clamp(uvT, 0.0, 1.0);
  vec2 cx = dFdx(uvT) * uGrad;
  vec2 cy = dFdy(uvT) * uGrad;
  vec3 enc = textureGrad(uColor, uvC, cx, cy).rgb;
  enc = max(enc + uSharp * (enc - textureGrad(uColor, uvC, cx * 4.0, cy * 4.0).rgb), vec3(0.0));
  float plateT = diagTexels(uvT * uColorSize);
  vec2 uvN = (uvT - uNearWin.xy) / (uNearWin.zw - uNearWin.xy);
  vec2 eN = min(uvN, 1.0 - uvN);
  float wN = smoothstep(0.0, uNearMix.z, min(eN.x, eN.y)) * (1.0 - smoothstep(uNearMix.x, uNearMix.y, plateT * uFine));
  for (int k = 0; k < (wN > 0.0 ? 1 : 0); k++) {
    vec2 nx = cx / (uNearWin.zw - uNearWin.xy);
    vec2 ny = cy / (uNearWin.zw - uNearWin.xy);
    vec3 fine = textureGrad(uNear, uvN, nx, ny).rgb;
    fine = max(fine + uSharp * (fine - textureGrad(uNear, uvN, nx * 4.0, ny * 4.0).rgb), vec3(0.0));
    enc = mix(enc, fine, wN);
  }
  vec3 wide = vec3(0.0);
  for (int k = 2; k < 8; k++) {
    float span = exp2(float(k));
    wide += textureGrad(uColor, uvC, cx * span, cy * span).rgb;
  }
  vec3 lin = inverseFilmic(enc);
  vec3 low = inverseFilmic(wide / 6.0);
  lin = max(lin + uBloom * (lin - low), vec3(0.0));
  float lit = mix(1.0, smoothstep(uCloudLit.x, uCloudLit.y, dot(low, vec3(0.2126, 0.7152, 0.0722))), wT);
  vec3 aT = (lin + uEps) / (lImg + uEps);
  uvS.y = clamp(uvS.y, 0.002, 0.998);
  float ua = fract(uvS.x + 0.5) - 0.5;
  vec2 gx = vec2(abs(dFdx(uvS.x)) < abs(dFdx(ua)) ? dFdx(uvS.x) : dFdx(ua), dFdx(uvS.y));
  vec2 gy = vec2(abs(dFdy(uvS.x)) < abs(dFdy(ua)) ? dFdy(uvS.x) : dFdy(ua), dFdy(uvS.y));
  vec3 s = textureGrad(uFar, uvS, gx * uGrad, gy * uGrad).rgb;
  vec3 aS = s * s * uAMax;
  vec2 nd = vClip.xy / vClip.z;
  vec2 unit = uBase.x * vec2(uAspect, 1.0) / (uWin.zw - uWin.xy);
  vec2 ka = dFdx(uvT) / max(abs(dFdx(nd.x)), 1e-9) / unit * uLens.x;
  vec2 kb = dFdy(uvT) / max(abs(dFdy(nd.y)), 1e-9) / unit * uLens.y;
  float sq = dot(ka, ka) + dot(kb, kb);
  float dt = ka.x * kb.y - ka.y * kb.x;
  float thin = sqrt(max(0.5 * (sq - sqrt(max(sq * sq - 4.0 * dt * dt, 0.0))), 0.0));
  float farT = sqrt(max(dot(gx * uFarSize, gx * uFarSize), dot(gy * uFarSize, gy * uFarSize))) / max(abs(dFdy(nd.y)) * 540.0, 1e-9) * uLens.y;
  float wD = mix(1.0 - smoothstep(uBase.z, uBase.w, farT), 1.0 - smoothstep(uBase.z, uBase.w, thin), wT);
  vec3 rel = pa - uCentre;
  vec2 g = vec2(dot(rel, uF0) * uFlowDir.y + dot(rel, uR0) * uFlowDir.x, dot(rel, uF0) * uFlowDir.x - dot(rel, uR0) * uFlowDir.y) * vec2(0.55, 1.0) * uDetail.w;
  float fw = max(length(dFdx(g)), length(dFdy(g))) * uFine;
  float c0 = billow(g, fw);
  float c1 = billow(g + uSunG * 0.1, fw);
  float fl = smoothstep(0.08, 0.3, c0) * (1.0 - smoothstep(0.12, 0.35, fw * 4.0)) * smoothstep(0.5, 0.85, soft(g * 4.0 + 5.0));
  float shade = 1.0 + wD * (uDetail.x * 2.0 * c0 + uDetail.y * clamp((c0 - c1) * 5.0, -1.0, 1.0) + uDetail.z * fl);
  vec3 col = mix(aS, aT, wT) * lNow * max(shade, 0.3);
  vec3 oc = uCamL - uCentre;
  float rs = uRadius + uCloudA.x;
  float bq = dot(oc, dv);
  float disc = bq * bq - dot(oc, oc) + rs * rs;
  float tq = -bq - sqrt(max(disc, 0.0));
  vec3 q = uCamL + dv * tq;
  float muQ = dot(normalize(q - uCentre), -dv);
  float reach = smoothstep(uCloudB.z, uCloudB.w, muQ) * step(0.0, disc) * step(0.0, tq);
  vec2 gq = cloudPlace(q);
  float dq = cloudAt(gq, 1.0) * reach * lit;
  float veilA = clamp(dq * uCloudB.x, 0.0, 1.0);
  float under = clamp(cloudAt(cloudPlace(uCentre + rs * n), 4.0) * uCloudB.x, 0.0, 1.0) * smoothstep(uCloudB.z, uCloudB.w, mu) * lit;
  col *= 1.0 - uCloudB.y * under;
  col = col * (1.0 - veilA) + deckLight(muQ, psi) * uCloudTint * dq;
  float cloudT = diagTexels(gq * uCloudA.y * vec2(uCloudD.y, 1.0) * float(textureSize(uCloud, 0).x));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float texels = mix(sqrt(max(dot(gx * uFarSize, gx * uFarSize), dot(gy * uFarSize, gy * uFarSize))), plateT * (1.0 + wN * (float(textureSize(uNear, 0).x) / ((uNearWin.z - uNearWin.x) * uColorSize.x) - 1.0)), wT);
  texels = mix(texels, min(texels, cloudT), veilA);
  vec4 o = diagOut(vec4(col, 1.0), texels, 1.0, mix(vec3(0.2, 0.7, 0.75), vec3(0.85, 0.75, 0.3), wT), (pa - p).xz * 4.0, length(vView));
  outColor = vec4(o.rgb, uDiag >= 2 ? 1.0 : uFade);
  if (uDiag >= 2 && uFade < 0.5) discard;
}`

const HALO_VERT = /* glsl */ `
out vec3 vDir;
out vec3 vClip;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const HALO_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uHalo;
uniform vec2 uHaloSize;
uniform vec3 uNadir;
uniform float uAlpha;
uniform float uEpsMax;
uniform float uPsiMax;
uniform vec3 uF0;
uniform vec3 uR0;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uUnder;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
out vec4 outColor;
void main() {
  vec3 d = normalize(vDir);
  float eps = acos(clamp(dot(d, uNadir), -1.0, 1.0)) - uAlpha;
  float y = sqrt(clamp(eps / uEpsMax, 0.0, 1.0));
  float psi = atan(dot(d, uR0), dot(d, uF0));
  vec2 uv = vec2((clamp(psi / uPsiMax * 0.5 + 0.5, 0.0, 1.0) * (uHaloSize.x - 1.0) + 0.5) / uHaloSize.x, (y * (uHaloSize.y - 1.0) + 0.5) / uHaloSize.y);
  vec3 col = textureLod(uHalo, uv, 0.0).rgb * (1.0 - smoothstep(0.85, 1.0, y));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
  if (uDiag >= 2 || eps <= -uUnder) discard;
}`

export class Glow {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(halo: THREE.Texture, reach: number) {
    const j = deckJson
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      uniforms: {
        uHalo: { value: halo }, uHaloSize: { value: new THREE.Vector2().fromArray(j.haloSize) }, uNadir: { value: new THREE.Vector3(0, -1, 0) }, uAlpha: { value: 1.4 }, uEpsMax: { value: j.epsMax }, uPsiMax: { value: j.psiMax },
        uF0: { value: new THREE.Vector3().fromArray(j.f0) }, uR0: { value: new THREE.Vector3().fromArray(j.r0) }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uUnder: { value: 0 }, uDiag: diagUniform,
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(reach, 96, 48), this.material)
    this.mesh.renderOrder = 7
    this.mesh.frustumCulled = false
  }

  turn(q: THREE.Quaternion): void {
    const u = this.material.uniforms
    ;(u.uF0!.value as THREE.Vector3).fromArray(deckJson.f0).applyQuaternion(q)
    ;(u.uR0!.value as THREE.Vector3).fromArray(deckJson.r0).applyQuaternion(q)
  }

  update(camera: THREE.Vector3, centre: THREE.Vector3, radius: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    this.mesh.position.copy(camera)
    const to = (u.uNadir!.value as THREE.Vector3).copy(centre).sub(camera)
    const dist = to.length()
    to.divideScalar(dist)
    u.uAlpha!.value = Math.asin(Math.min(radius / dist, 1))
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}

export interface DeckTextures { color: THREE.Texture; near: THREE.Texture; cloud: THREE.Texture; far: THREE.Texture; height: THREE.Texture; light: THREE.Texture; halo: THREE.Texture }

export class Deck {
  readonly group = new THREE.Group()
  readonly mesh: THREE.Mesh
  readonly overlay: THREE.Mesh
  readonly haze: Glow
  readonly material: THREE.ShaderMaterial
  readonly overlayMaterial: THREE.ShaderMaterial
  private readonly centre = new THREE.Vector3().fromArray(deckJson.centre)
  private readonly unbloom: number

  constructor(t: DeckTextures, key: 'full' | 'web', look: DeckLook) {
    this.unbloom = look.bloom
    const j = deckJson
    const up = new THREE.Vector3().fromArray(j.up)
    const f0 = new THREE.Vector3().fromArray(j.f0)
    const r0 = new THREE.Vector3().fromArray(j.r0)
    const polar = new THREE.Vector4(j.psiMax, j.s0, Math.log(j.s1 / j.s0), 0)
    const flowDir = new THREE.Vector2(Math.cos(j.flowAngle), Math.sin(j.flowAngle))
    const sunL = new THREE.Vector3().fromArray(j.sun)
    const sunG = new THREE.Vector2(sunL.dot(f0) * flowDir.y + sunL.dot(r0) * flowDir.x, sunL.dot(f0) * flowDir.x - sunL.dot(r0) * flowDir.y).normalize()
    const shared = {
      uCentre: { value: this.centre }, uRadius: { value: j.radius }, uUp: { value: up }, uF0: { value: f0 }, uR0: { value: r0 }, uPolar: { value: polar },
      uFlow: { value: new THREE.Vector4().fromArray(look.flow) }, uFlowDir: { value: flowDir }, uTime: { value: 0 },
    }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...shared,
        uHeight: { value: t.height }, uLift: { value: look.lift }, uColor: { value: t.color }, uFar: { value: t.far }, uLight: { value: t.light },
        uLightSize: { value: new THREE.Vector2().fromArray(j.lightSize) }, uColorSize: { value: new THREE.Vector2().fromArray(j.imageSize[key]) }, uFarSize: { value: new THREE.Vector2().fromArray(j.farSize[key]) },
        uWin: { value: new THREE.Vector4().fromArray(j.window) }, uCamL: { value: new THREE.Vector3() }, uLimb: { value: new THREE.Vector2().fromArray(look.limb) }, uEdge: { value: look.edge }, uInset: { value: new THREE.Vector2().fromArray(look.inset) }, uAMax: { value: j.aMax }, uEps: { value: j.eps },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uFade: { value: 1 }, uDiag: diagUniform, uGrad: gradUniform, uFine: fineUniform, uLens: { value: new THREE.Vector2(1, 1) }, uSharp: { value: look.sharp }, uBloom: { value: 0 },
        uDetail: { value: new THREE.Vector4(look.detail.tone, look.detail.relief, look.detail.fleck, look.detail.scale) },
        uBase: { value: new THREE.Vector4(Math.tan(THREE.MathUtils.degToRad(j.vfovDeg) / 2), 0, look.detail.stretch[0], look.detail.stretch[1]) },
        uSunG: { value: sunG },
        uCloud: { value: t.cloud }, uCloudA: { value: new THREE.Vector4(look.cloud.height, 1 / look.cloud.tile, 1 / look.cloud.group, look.cloud.drift) },
        uCloudB: { value: new THREE.Vector4(look.cloud.gain, look.cloud.shade, look.cloud.reach[0], look.cloud.reach[1]) }, uCloudC: { value: new THREE.Vector4(look.cloud.cover[0], look.cloud.cover[1], look.cloud.curve[0], look.cloud.curve[1]) }, uCloudD: { value: new THREE.Vector4(cloudJson.gutter, 1 / look.cloud.stretch, 0, 0) },
        uCloudTint: { value: new THREE.Vector3().fromArray(look.cloud.tint) }, uCloudLit: { value: new THREE.Vector2().fromArray(look.cloud.lit) },
        uNear: { value: t.near }, uNearWin: { value: new THREE.Vector4().fromArray(nearJson.window) }, uNearMix: { value: new THREE.Vector3(look.near[0], look.near[1], nearJson.edge) },
      },
    })
    const nPsi = 720
    const nS = 480
    const positions = new Float32Array((nPsi + 1) * (nS + 2) * 3)
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    let k = 0
    for (let i = -1; i <= nS; i++) {
      const s = i < 0 ? 0 : j.s0 * Math.exp((i / nS) * Math.log(j.s1 / j.s0))
      const g = s / j.radius
      for (let a = 0; a <= nPsi; a++) {
        const psi = (a / nPsi * 2 - 1) * j.psiMax
        n.copy(up).multiplyScalar(Math.cos(g)).addScaledVector(f0, Math.cos(psi) * Math.sin(g)).addScaledVector(r0, Math.sin(psi) * Math.sin(g))
        p.copy(this.centre).addScaledVector(n, j.radius)
        positions[k++] = p.x
        positions[k++] = p.y
        positions[k++] = p.z
      }
    }
    const index = new Uint32Array(nPsi * (nS + 1) * 6)
    k = 0
    for (let i = 0; i <= nS; i++) {
      for (let a = 0; a < nPsi; a++) {
        const q = i * (nPsi + 1) + a
        index[k++] = q
        index[k++] = q + 1
        index[k++] = q + nPsi + 1
        index[k++] = q + 1
        index[k++] = q + nPsi + 2
        index[k++] = q + nPsi + 1
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.overlayMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { ...this.material.uniforms, uFade: { value: 0 } },
      side: THREE.FrontSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    })
    this.overlay = new THREE.Mesh(geometry, this.overlayMaterial)
    this.overlay.frustumCulled = false
    this.overlay.renderOrder = 6
    this.overlay.visible = false
    this.haze = new Glow(t.halo, 2000)
    this.group.add(this.mesh, this.overlay, this.haze.mesh)
  }

  update(camera: THREE.Vector3, elapsed: number, gain: number, vignette: number, aspect: number, fade = 1, bloom = 0, lens: [number, number] = [1, 1]): void {
    const u = this.material.uniforms
    ;(u.uLens!.value as THREE.Vector2).set(lens[0], lens[1])
    u.uBloom!.value = this.unbloom * bloom / (1 - bloom)
    ;(u.uCamL!.value as THREE.Vector3).copy(camera)
    u.uTime!.value = elapsed
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = fade >= 1
    this.overlay.visible = fade > 0 && fade < 1
    this.overlayMaterial.uniforms.uFade!.value = fade
    this.haze.update(camera, this.centre, deckJson.radius, gain * fade, vignette, aspect)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.haze.dispose()
    this.material.dispose()
    this.overlayMaterial.dispose()
  }
}
