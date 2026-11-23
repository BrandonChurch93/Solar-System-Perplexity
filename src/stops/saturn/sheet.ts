import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { RING_FIELD_GLSL, type RingField } from './field'
import { ICE_GLSL, type Ice } from './ice'
import model from './ringfield.json'
import look from './sheet.json'
import skim from './skim.json'

export const GLOBE_SHADOW_GLSL = /* glsl */ `
uniform vec4 uShadowFit;
uniform vec3 uShadowReach;
vec3 globeShadow(vec3 P, vec3 sunL, float polar) {
  vec3 ps = vec3(P.x, P.y / polar, P.z);
  vec3 ss = normalize(vec3(sunL.x, sunL.y / polar, sunL.z));
  float b = dot(ps, ss);
  float d = length(ps - ss * b);
  float w = uShadowFit.x + uShadowFit.y * max(-b, 0.0);
  vec3 lit = smoothstep(vec3(1.0) - w * uShadowReach, vec3(1.0 + w), vec3(d));
  return b < 0.0 ? lit : vec3(1.0);
}`

// Near the sheet its outer rim is no edge: past the rim the ice goes on outward and thins out, fast at first
// and then as a long thin veil that ends softly. Needs RING_FIELD_GLSL.
export const SHEET_OUTER_GLSL = /* glsl */ `
uniform vec4 uOuter;
uniform vec4 uOuter2;
uniform vec2 uOuterInk;
// the depth that adds to the sheet at radius r: none inside the rim, and none in the hold
float sheetOuter(float r) {
  float past = r - uOuter.x;
  return past > 0.0 ? (uOuter.y * exp(-past / uOuter.z) + uOuter.w * exp(-past / uOuter2.x)) * (1.0 - smoothstep(uOuter2.y, uOuter2.z, r)) : 0.0;
}
// past the rim the ice lies in ringlets of its own: three sets of plateaus, all open at the rim, with more and
// wider gaps the further out, seen with the footprint fp; a set finer than the footprint counts by its mean
uniform vec4 uOuterBands;
uniform vec4 uOuterWaves;
uniform vec4 uOuterGaps;
float sheetOuterBands(float r, float fp) {
  float at = mix(-uOuterBands.z, uOuterBands.x, clamp((r - uOuter.x) / uOuterBands.w, 0.0, 1.0));
  float mean = uOuterGaps.x + (1.0 - uOuterGaps.x) * clamp(1.0 - at, 0.0, 1.0);
  float k = 1.0;
  for (int i = 0; i < 3; i++) {
    float wave = i == 0 ? uOuterWaves.x : (i == 1 ? uOuterWaves.y : uOuterWaves.z);
    float seen = clamp(wave / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    vec2 h;
    float b;
    vec3 q = ringOctave(r / wave + uOuterGaps.w * float(i), uint(uOuterWaves.w) + uint(i), max(uOuterBands.y, uOuterGaps.z * fp / wave), 0.0, h, b);
    float open = uOuterGaps.x + (1.0 - uOuterGaps.x) * smoothstep(at - uOuterBands.z, at + uOuterBands.z, q.x * 0.5 + 0.5);
    k *= mix(mean, open * exp(uOuterGaps.y * q.z), seen);
  }
  return k;
}
// the brightness that depth returns where the model was measured
float sheetOuterLum(float depth) {
  return uOuter2.w * ringSat(depth * uRfLight.x);
}
// the radius the colour of the ice is read at: past the rim the ice has the colour of the rim
float sheetInkRadius(float r) {
  return r - max(r - uOuterInk.x, 0.0) * uOuterInk.y;
}`

// How the brightness of the sheet goes with the angles of the Sun and of the view.
export const SHEET_LAW_GLSL = /* glsl */ `
uniform vec4 uShade;
uniform vec4 uViewFit;
uniform vec3 uPhase[${look.phase.deg.length}];
// what the sheet returns at a phase angle over what it returns where the model was measured, for a dense
// sheet (x) and a thin one (y): straight lines between the knots, flat outside
vec2 phaseGain(float deg) {
  vec2 g = uPhase[0].yz;
  for (int k = 1; k < ${look.phase.deg.length}; k++) g = mix(g, uPhase[k].yz, clamp((deg - uPhase[k - 1].x) / (uPhase[k].x - uPhase[k - 1].x), 0.0, 1.0));
  return g;
}
// the factor on the brightness for a sheet that is thin (1) or dense (0), seen at the cosine mu, lit at the
// cosine mu0, at the phase angle deg
float sheetLaw(float thin, float mu, float mu0, float deg) {
  vec2 byPhase = phaseGain(deg);
  return pow(clamp((uRfLight.y + uRfLight.z) / (mu0 + mu), uViewFit.x, uViewFit.y), mix(uShade.x, uShade.y, thin)) * mix(byPhase.x, byPhase.y, thin);
}`

// The sheet at the point q of the plane (radius r), seen with the footprint fp (radii): its optical depth and
// its brightness where the model was measured, with the ringlets on them; how far it returns light as a thin
// sheet (1) or a dense one (0); the colour of the ice with the strength of the finer structure; the factor
// the ringlets there put on the colour; and the depth and the brightness of the model averaged over the width
// of the zones (uFlatten.z). Needs RING_FIELD_GLSL and SHEET_OUTER_GLSL. The sheet and the grains near the
// lens (grains.ts) both read the ice here, so a grain has the colour of the ringlet it lies in.
export const SHEET_AT_GLSL = /* glsl */ `
uniform vec3 uSunL;
uniform vec4 uFlatten;
void sheetAt(vec2 q, float r, float fp, out float tau, out float lum, out float thin, out vec4 ink, out vec3 tint, out vec2 wide) {
  vec2 knots = ringKnots(r, fp);
  float more = sheetOuter(r);
  for (int k = 0; k < (more > 0.0 ? 1 : 0); k++) more *= sheetOuterBands(r, fp);
  knots += vec2(more, sheetOuterLum(more));
  float rc = sheetInkRadius(r);
  ink = ringInk(rc);
  thin = ringThin(rc);
  tau = knots.x;
  lum = knots.y;
  ringFine(r, fp, ink.a, thin, dot(q / r, normalize(uSunL.xz)), tau, lum, tint);
  wide = ringKnots(r, uFlatten.z);
}`

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
uniform vec3 uCamL;
uniform float uPolar;
uniform int uPass;
uniform float uGrad;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uFinest;
uniform float uSat;
uniform vec3 uTintDense;
uniform vec3 uTintThin;
uniform vec3 uFloor;
uniform vec3 uLayer;
out vec4 outColor;
${DIAG_GLSL}
${RING_FIELD_GLSL}
${GLOBE_SHADOW_GLSL}
${ICE_GLSL}
${SHEET_OUTER_GLSL}
${SHEET_LAW_GLSL}
${SHEET_AT_GLSL}
void main() {
  vec2 q = vLocal.xz;
  float r = length(q);
  float pixel = length(vec2(dFdx(r), dFdy(r)));
  vec2 qx = dFdx(q);
  vec2 qy = dFdy(q);
  float det = qx.x * qy.y - qx.y * qy.x;
  mat2 toPixel = mat2(qy.y, -qx.y, -qy.x, qx.x) / (abs(det) > 1e-24 ? det : 1e-24);
  float texels = diagTexels(q / uFinest);
  vec3 P = vec3(q.x, 0.0, q.y);
  vec3 ray = P - uCamL;
  // during one take the pixel's point slides over the ice: the ringlets are filtered by the pixel and by that
  vec2 sweep = iceSweep(q, r, ray);
  float fp = ringFootprint(length(vec2(pixel, sweep.x * uIceFit.x)), uGrad);
  vec3 cs = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
  vec3 ds = vec3(ray.x, ray.y / uPolar, ray.z);
  bool front = -dot(cs, ds) > dot(ds, ds);
  // past the span of the model there is ice only when the lens is near
  bool mine = front == (uPass == 1) && (uIceOrbit.z > 0.0 || r < uRfSpan.x + 1.0 / uRfSpan.y);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  for (int k = 0; k < (mine ? 1 : 0); k++) {
    float tau;
    float lum;
    float thin;
    vec4 ink;
    vec3 tint;
    vec2 wide;
    sheetAt(q, r, fp, tau, lum, thin, ink, tint, wide);
    float turn = atan(q.y, q.x) / 6.2831853;
    // the spokes show only near the sheet
    float spokes = 0.0;
    for (int j = 0; j < (uIceOrbit.z > 0.0 ? 1 : 0); j++) spokes = iceSpokes(r, turn);
    lum *= exp(spokes * uIceOrbit.z);
    // near the sheet the broad zones of the dense rings are evener than from afar
    lum *= pow(clamp(wide.y / uFlatten.x, 1.0 / uFlatten.w, uFlatten.w), uFlatten.y * (1.0 - thin));
    // the sand of the sheet and its sparks, as the sheet is seen from afar
    vec2 sand = iceSand(r, turn, 1.0 / max(pixel, 1e-9), length(toPixel * vec2(-q.y, q.x)) / r, thin, sweep);
    lum *= exp(sand.x);
    tau *= exp(sand.x * uIceFit.z);
    float dist = length(ray);
    float mu = max(abs(ray.y) / dist, 1e-3);
    float mu0 = max(abs(uSunL.y), 0.02);
    bool same = uCamL.y * uSunL.y > 0.0;
    // near the lens a share of the ice is seen grain by grain (grains.ts): the sheet is what is left of it, and
    // it lies in the shade of those grains
    float taken = grainTaken(grainCells(tau), dist);
    float left = tau - taken;
    float shade = exp(-taken / mu0);
    float seen = same ? shade * ringSat(left * (1.0 / mu0 + 1.0 / mu)) / max(ringSat(tau * uRfLight.x), 1e-6) : uShade.w * exp(-tau / mu0) * ringSat(tau / mu) / max(ringSat(tau * uRfLight.x), 1e-6);
    float deg = degrees(acos(clamp(dot(ray, uSunL) / -dist, -1.0, 1.0)));
    float law = sheetLaw(thin, mu, mu0, deg);
    vec3 tone = mix(vec3(1.0), ink.rgb, uSat * mix(1.0, min(law, 1.0), thin * uViewFit.z)) * tint * mix(uTintDense, uTintThin, thin);
    vec3 lit = globeShadow(P, uSunL, uPolar);
    // stars do not show through any part of the sheet that holds ice; the globe shows through by the true depth
    float bn = dot(cs, ds) / length(ds);
    float behind = front ? 1.0 - smoothstep(uShadowFit.z, uShadowFit.w, sqrt(max(dot(cs, cs) - bn * bn, 0.0))) : 0.0;
    alpha = 1.0 - exp(-left / mu * mix(uViewFit.w, 1.0, behind));
    vec3 under = mix(uFloor, vec3(1.0), lit) * uShade.z;
    // the sheet and the white sparks of its brightest grains
    col = lum * (seen * law) * under * (tone + mix(tone, vec3(1.0), uIceOrbit.w) * (sand.y * uIceFit.y));
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  alpha *= uWeight;
  outColor = diagOut(vec4(col, alpha), texels, 1.0, uLayer, vec2(0.0), length(vView));
  if (mine == false || (uDiag >= 2 && alpha < 0.5)) discard;
}`

// the brightness of a sheet too deep to see through, just inside the rim, where the model was measured
function rimLum(): number {
  const span = model.span as [number, number]
  const light = 1 / model.muSun + 1 / model.muHero
  let sum = 0
  let count = 0
  for (let i = 0; i < model.knots; i++) {
    const r = span[0] + ((span[1] - span[0]) * i) / (model.knots - 1)
    if (r < model.outer - skim.outer.inset * 3 || r > model.outer - skim.outer.inset) continue
    sum += model.lum[i]! / (1 - Math.exp(-model.tau[i]! * light))
    count++
  }
  return sum / Math.max(count, 1)
}

// the depth of the sheet at radius r with the lens near it: the model inside the rim, past it the ice that
// thins out (the same law as sheetOuter in the shader)
export function sheetDepth(r: number): number {
  const span = model.span as [number, number]
  const x = ((r - span[0]) / (span[1] - span[0])) * (model.knots - 1)
  let tau = 0
  if (x >= 0 && x <= model.knots - 1) {
    const i = Math.min(Math.floor(x), model.knots - 2)
    tau = model.tau[i]! + (model.tau[i + 1]! - model.tau[i]!) * (x - i)
  }
  const o = skim.outer
  const past = r - model.outer
  if (past > 0) {
    const end = Math.min(Math.max((r - o.end[0]!) / (o.end[1]! - o.end[0]!), 0), 1)
    tau += (o.depth[0]! * Math.exp(-past / o.length[0]!) + o.depth[1]! * Math.exp(-past / o.length[1]!)) * (1 - end * end * (3 - 2 * end))
  }
  return tau
}

export class Sheet {
  readonly group = new THREE.Group()
  readonly materials: THREE.ShaderMaterial[] = []
  readonly uniforms: Record<string, THREE.IUniform>
  private readonly geometry: THREE.BufferGeometry
  private readonly outer = new THREE.Vector4(model.outer, 0, skim.outer.length[0], 0)
  private readonly outerInk = new THREE.Vector2(model.outer - skim.outer.inset, 0)

  constructor(field: RingField, ice: Ice, polar: number) {
    const seg = look.segments
    const span = model.span as [number, number]
    const inner = span[0]
    const outer = Math.max(span[1], skim.outer.end[1]!) / Math.cos(Math.PI / seg)
    const pos = new Float32Array((seg + 1) * 2 * 3)
    const index: number[] = []
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2
      pos.set([Math.cos(a) * inner, 0, Math.sin(a) * inner], i * 6)
      pos.set([Math.cos(a) * outer, 0, Math.sin(a) * outer], i * 6 + 3)
    }
    for (let i = 0; i < seg; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.geometry.setIndex(index)
    this.uniforms = {
      ...field.uniforms,
      ...ice.uniforms,
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uGrad: gradUniform, uDiag: diagUniform, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      uFinest: { value: field.finest },
      uShade: { value: new THREE.Vector4(look.view.dense, look.view.thin, look.gain[0], look.unlit) },
      uViewFit: { value: new THREE.Vector4(look.view.clamp[0], look.view.clamp[1], look.grey, look.starCover) },
      uPhase: { value: look.phase.deg.map((deg, k) => new THREE.Vector3(deg, look.phase.dense[k], look.phase.thin[k])) },
      uSat: { value: 1 },
      uTintDense: { value: new THREE.Vector3(1, 1, 1) },
      uTintThin: { value: new THREE.Vector3(1, 1, 1) },
      uFlatten: { value: new THREE.Vector4(1, 0, 0.04, 2) },
      uShadowFit: { value: new THREE.Vector4(look.shadow.soft[0], look.shadow.soft[1], look.limb[0], look.limb[1]) },
      uShadowReach: { value: new THREE.Vector3().fromArray(look.shadow.reach) },
      uFloor: { value: new THREE.Vector3().fromArray(look.shadow.floor) },
      uLayer: { value: new THREE.Vector3().fromArray(look.layer) },
      uOuter: { value: this.outer },
      uOuter2: { value: new THREE.Vector4(skim.outer.length[1], skim.outer.end[0], skim.outer.end[1], rimLum()) },
      uOuterInk: { value: this.outerInk },
      uOuterBands: { value: new THREE.Vector4(skim.outer.bands.gap, skim.outer.bands.soft, skim.outer.bands.width, skim.outer.bands.over) },
      uOuterWaves: { value: new THREE.Vector4(skim.outer.bands.waves[0], skim.outer.bands.waves[1], skim.outer.bands.waves[2], skim.outer.bands.seed) },
      uOuterGaps: { value: new THREE.Vector4(skim.outer.bands.floor, skim.outer.bands.lines, skim.outer.bands.filter, skim.outer.bands.shift) },
    }
    for (const pass of [0, 1]) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { ...this.uniforms, uPass: { value: pass } },
        side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      })
      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.frustumCulled = false
      mesh.renderOrder = pass === 0 ? 2 : 6
      this.materials.push(material)
      this.group.add(mesh)
    }
  }

  // near: how near the lens is to the sheet (0 in the hold, 1 in the skim): the ice past the rim shows by it
  set(near: number): void {
    this.outer.y = skim.outer.depth[0]! * near
    this.outer.w = skim.outer.depth[1]! * near
    this.outerInk.y = Math.min(near * skim.outer.inkBy, 1)
  }

  dispose(): void {
    this.geometry.dispose()
    for (const m of this.materials) m.dispose()
  }
}
