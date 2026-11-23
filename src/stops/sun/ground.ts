import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'
import { APRON_GLSL } from './apron'
import { GRADE_GLSL } from './grade'
import { LIFE_GLSL, lifeUniforms, type LifeMaps } from './life'
import { STAGE_GLSL, stage } from './stage'
import fieldData from './field.json'
import lifeData from './life.json'

export interface GroundLook {
  cap: number
  rings: number
  sectors: number
  cell: number
  apron: { amount: number; cell: number; calm: number; out: [number, number]; edge: [number, number] }
  band: [number, number]
  own: { ring: [number, number]; side: number; near: number; up: [number, number]; rough: [number, number] }
  lift: [number, number]
  even: { from: [number, number]; tint: [number, number, number]; far: [number, number]; dim: number }
  glowReach: [number, number]
  site: [number, number]
  field: { grid: number; sharp: number; fine: { below: [number, number]; scale: number; gain: number; soft: number } }
  glow: [number, number]
  twinkle: { amount: number; rate: number; spread: number }
  inflow: { amount: number; waves: number; rate: number; inner: number; outer: number }
}

export interface SeetheLook { amount: number; rate: number; spread: number; near: [number, number]; far: number; crown: [number, number] }

const VERT = /* glsl */ `
out vec3 vStage;
out vec3 vView;
out vec3 vClip;
void main() {
  vStage = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const frag = (seethe: boolean): string => /* glsl */ `
precision highp float;
uniform sampler2D uPlate;
uniform sampler2D uApron;
uniform vec2 uApronSize;
uniform float uApronOn;
uniform float uApronOut;
uniform float uApronEdge;
uniform vec2 uApronCell;
uniform sampler2D uGlow;
uniform sampler2D uField;
uniform vec4 uFieldSize;
uniform vec4 uFieldFine;
uniform vec2 uFieldFineMore;
uniform vec4 uOwn;
uniform vec4 uUp;
uniform vec2 uLift;
uniform vec4 uEven;
uniform vec4 uEvenTint;
uniform vec2 uGlowReach;
uniform vec2 uSite;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform vec2 uSize;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform float uCellSize;
uniform vec3 uTwinkle;
uniform vec4 uHazeLow;
uniform vec4 uHazeWind;
uniform vec4 uHazeScale;
uniform vec4 uHazeSteep;
uniform vec4 uHazeTint;
uniform vec4 uInflow;
uniform vec2 uInflowRate;${seethe ? `
uniform vec4 uSeethe;
uniform vec3 uSeetheNear;
uniform vec2 uCrown;
float seethe = 0.0;` : ''}
uniform vec3 uCam;
uniform vec2 uBand;
uniform float uLod;
uniform vec3 uSpot;
uniform vec3 uSpotE;
uniform vec3 uSpotN;
uniform vec2 uShow;
uniform float uMixed;
in vec3 vStage;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${STAGE_GLSL}
${APRON_GLSL}
${NOISE_GLSL}
${GRADE_GLSL}
${LIFE_GLSL}
float lumAt(sampler2D map, vec2 uv, float lod) {
  return dot(textureLod(map, uv, lod).rgb, vec3(0.3, 0.5, 0.2));
}
vec2 fieldShift(vec2 id) {
  float lo = uFieldSize.z / uFieldSize.x + 0.02;
  return mix(vec2(lo), vec2(1.0 - lo), vec2(vhash(vec3(id, 3.7)), vhash(vec3(id.yx + 17.3, 9.1))));
}
vec3 fieldTap(vec2 g, vec2 id, vec2 dx, vec2 dy) {
  vec2 at = uFieldSize.z * vec2(id.x + 0.5 * id.y, 0.8660254 * id.y);
  return textureGrad(uField, (g - at) / uFieldSize.x + fieldShift(id), dx, dy).rgb;
}
vec3 fieldAt(vec2 g, vec2 dx, vec2 dy) {
  vec2 s = mat2(1.0, 0.0, -0.57735027, 1.15470054) * (g / uFieldSize.z);
  vec2 base = floor(s);
  vec3 t = vec3(fract(s), 0.0);
  t.z = 1.0 - t.x - t.y;
  bool lower = t.z > 0.0;
  vec3 wt = lower ? vec3(t.z, t.y, t.x) : vec3(-t.z, 1.0 - t.y, 1.0 - t.x);
  vec2 a = lower ? base : base + vec2(1.0, 1.0);
  vec2 b = lower ? base + vec2(0.0, 1.0) : base + vec2(1.0, 0.0);
  vec2 c = lower ? base + vec2(1.0, 0.0) : base + vec2(0.0, 1.0);
  wt = pow(wt, vec3(uFieldSize.w));
  wt /= wt.x + wt.y + wt.z;
  vec3 mean = textureLod(uField, vec2(0.5), 20.0).rgb;
  vec3 sum = wt.x * fieldTap(g, a, dx, dy) + wt.y * fieldTap(g, b, dx, dy) + wt.z * fieldTap(g, c, dx, dy);
  return max(mean + (sum - mean) / sqrt(dot(wt, wt)), vec3(0.0));
}
void main() {
  vec3 at = vStage;
  vec3 lay = vStage - ST_DOWN;
  vec2 gnd = vec2(dot(lay, ST_RIGHT), dot(lay, ST_FWD));
  float ring = length(gnd);
  vec2 fromApex = gnd - ST_FOLD.yz;
  float phi = atan(fromApex.x, fromApex.y);
  float dist = length(at);
  float graze = clamp(dot(normalize(at - ST_CENTRE), -at / dist), 0.0, 1.0);
  vec3 normal = normalize(vStage - ST_CENTRE);
  float now = clamp(dot(normal, normalize(uCam - vStage)), 0.0, 1.0);
  float lift = smoothstep(uLift.x, uLift.y, now - graze);
  float edge = ring;
  for (int k = 0; k < (lift > 0.0 ? 1 : 0); k++) edge += lift * uUp.z * (vnoise(vec3(gnd * uUp.w, 1.7)) + 0.5 * vnoise(vec3(gnd * uUp.w * 2.7, 5.3)) - 0.75);
  float own = (1.0 - smoothstep(mix(uOwn.x, uUp.x, lift), mix(uOwn.y, uUp.y, lift), edge)) * smoothstep(0.0, uOwn.z, min(ST_PHI.y - phi, phi - ST_PHI.x)) * smoothstep(ST_FOLD.x, ST_FOLD.x + uOwn.w, gnd.y);
  vec2 arc = gnd * (ST_RADIUS * asin(min(ring / ST_RADIUS, 1.0)) / max(ring, 1e-4));
  vec2 uvF = arc / uFieldSize.x;
  vec2 dxF = dFdx(uvF) * uGrad;
  vec2 dyF = dFdy(uvF) * uGrad;
  vec2 uv = stPlate(stImage(at));
  vec2 dx = dFdx(uv) * uGrad;
  vec2 dy = dFdy(uv) * uGrad;
  vec2 ab = apImage(vStage);
  vec2 uvB = apUv(ab);
  vec2 dxB = dFdx(uvB) * uGrad;
  vec2 dyB = dFdy(uvB) * uGrad;
  float w = apWeight(vStage, ab) * uApronOn;
  float bare = (1.0 - own) * (1.0 - w);
  float texF = diagTexels(uvF * uFieldSize.y);
  // a finer level of the field where the camera of the rise comes so near that the field would be enlarged:
  // the field's own fine structure at a smaller size, as a ratio over its own soft copy
  float finer = uFieldFine.x * (1.0 - smoothstep(uFieldFine.y, uFieldFine.z, texF));
  float texels = bare > 0.5 ? texF * mix(1.0, uFieldFine.w, step(0.5, finer)) : mix(diagTexels(uv * uSize), diagTexels(uvB * uApronSize), step(0.5, w));
  vec3 rel = vStage - uSpot;
  vec3 up = cross(uSpotE, uSpotN);
  rel -= up * dot(rel, up);
  float r = length(rel);
  float psi = atan(dot(rel, uSpotN), dot(rel, uSpotE));
  float band = smoothstep(uInflow.z * 0.85, uInflow.z * 1.35, r) * (1.0 - smoothstep(uInflow.w * 0.7, uInflow.w, r));
  float strand = 9.0 * sin(psi * 23.0) + 7.0 * sin(psi * 57.0 + 1.3) + 5.0 * sin(psi * 131.0 + 0.4);
  float wave = r / uInflow.w * uInflow.y * 6.283185307179586 + strand;
  float inflow = 1.0 + uInflow.x * band * (0.6 * (sin(wave - uTime * uInflowRate.x) - sin(wave)) + 0.4 * (sin(wave * 2.3 - uTime * uInflowRate.y) - sin(wave * 2.3)));
  float spot = 1.0 - smoothstep(uInflow.w * 0.88, uInflow.w * 1.12, r);
  float inner = 0.0;
  float seen = 0.0;
  vec3 col = vec3(0.0);
  vec2 moved = vec2(0.0);
  vec2 gq = gnd * uTwinkle.z;
  float beat = vnoise(vec3(gq, uTime * uTwinkle.y)) - vnoise(vec3(gq, 0.0)) + 0.5 * (vnoise(vec3(gq * 2.3 + 7.3, uTime * uTwinkle.y * 1.7 + 3.1)) - vnoise(vec3(gq * 2.3 + 7.3, 3.1)));
  inflow *= max(1.0 + uTwinkle.x * beat, 0.35);${seethe ? `
  for (int k = 0; k < (uSeethe.x > 0.0 ? 1 : 0); k++) {
    vec2 sq = gnd * uSeethe.z;
    float tick = uSeethe.w * uSeethe.y;
    seethe = uSeethe.x * (vnoise(vec3(sq, tick)) + 0.5 * vnoise(vec3(sq * 2.1 + 3.7, tick * 1.6 + 1.9)) - 0.75) * mix(uSeetheNear.z, 1.0, 1.0 - smoothstep(uSeetheNear.x, uSeetheNear.y, length(vStage - uCam)));
  }` : ''}
  for (int k = 0; k < ((w < 1.0 && own > 0.0) ? 1 : 0); k++) {
    float tone = clamp(stLimb(now) / stLimb(graze), 0.25, 5.0);
    float cellU = uCellSize / dist / (2.0 * ST_TAN.x * ST_CANVAS.z);
    vec2 cell = vec2(cellU, cellU * max(graze, 0.08) * uSize.x / uSize.y);
    seen = lifeSeen(dx, dy, uSize);
    vec4 s = vec4(alive(uPlate, uCellsPlate, uSwellPlate, arc / uCellSize, uv, dx, dy, cell, 1.0, uTime, seen, spot, inner, moved), 1.0);${seethe ? `
    for (int j = 0; j < (seethe != 0.0 ? 1 : 0); j++) {
      float lod = log2(max(cell.y * uSize.y * 0.25, 1.0));
      s.rgb *= 1.0 + seethe * smoothstep(uCrown.x, uCrown.y, lumAt(uPlate, uv, lod) / max(lumAt(uPlate, uv, lod + 2.0), 1e-3));
    }` : ''}
    vec3 even = mix(vec3(1.0), uEvenTint.rgb, smoothstep(uEven.x, uEven.y, ring)) * mix(1.0, uEvenTint.w, smoothstep(uEven.z, uEven.w, ring));
    col = s.rgb * max(s.a * inflow, 0.0) * tone * mix(vec3(1.0), even, lift);
  }
  for (int k = 0; k < (bare > 0.0 ? 1 : 0); k++) {
    float tone = clamp(stLimb(now) / stLimb(${fieldData.tone}), 0.25, 5.0);
    vec3 f = inverseFilmic(fieldAt(arc, dxF, dyF));
    for (int j = 0; j < (finer > 0.0 ? 1 : 0); j++) {
      vec2 g2 = arc * uFieldFine.w + vec2(5.3, 2.9);
      vec3 hi = inverseFilmic(fieldAt(g2, dxF * uFieldFine.w, dyF * uFieldFine.w));
      vec3 lo = inverseFilmic(fieldAt(g2, dxF * uFieldFine.w * uFieldFineMore.y, dyF * uFieldFine.w * uFieldFineMore.y));
      f *= mix(1.0, pow(clamp(dot(hi, vec3(0.3, 0.5, 0.2)) / max(dot(lo, vec3(0.3, 0.5, 0.2)), 1e-4), 0.25, 4.0), uFieldFineMore.x), finer);
    }
    col = mix(f * max(inflow, 0.0) * tone, col, own);
  }
  for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) {
    vec3 toEye = AP_EYE - vStage;
    float away = length(toEye);
    float seen = clamp(dot(normal, toEye / away), 0.0, 1.0);
    float tone = clamp(stLimb(now) / stLimb(seen), 0.25, 5.0);
    float cellU = uApronCell.x / away / (2.0 * AP_TAN.x);
    vec2 cell = vec2(cellU, cellU * max(seen, 0.08) * uApronSize.x / uApronSize.y);
    vec2 m;
    float in2;
    float seen2 = lifeSeen(dxB, dyB, uApronSize);
    vec4 s = vec4(alive(uApron, uCellsApron, uSwellApron, arc / uCellSize, uvB, dxB, dyB, cell, uCellSize / uApronCell.x, uTime, seen2, spot, in2, m), 1.0);${seethe ? `
    for (int j = 0; j < (seethe != 0.0 ? 1 : 0); j++) {
      float lod = log2(max(cell.y * uApronSize.y * 0.25, 1.0));
      s.rgb *= 1.0 + seethe * smoothstep(uCrown.x, uCrown.y, lumAt(uApron, uvB, lod) / max(lumAt(uApron, uvB, lod + 2.0 + uApronCell.y), 1e-3));
    }` : ''}
    inner = mix(inner, in2, w);
    seen = mix(seen, seen2, w);
    col = mix(col, s.rgb * max(s.a * inflow, 0.0) * tone, w);
    moved = mix(moved, m, w);
  }
  for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
    float px = 1.0 / max(max(length(dFdx(arc)), length(dFdy(arc))), 1e-9) / uLifeFade.z;
    float tone = clamp(stLimb(now) / stLimb(graze), 0.25, 5.0);
    float lane = (1.0 - smoothstep(uLifeGrainMore.x, uLifeGrainMore.y, inner)) * seen * (1.0 - bare) * (1.0 - spot);
    vec2 q = vec2(dot(rel, uSpotE), dot(rel, uSpotN)) / uInflow.z;
    col *= 1.0 + uLifeStream.x * seen * lifeStream(q, px * uInflow.z, uTime);
    col += uLifeGrainTint.rgb * (uLifeGrain.x * tone * lifeGrains(arc, lane, px * uLifeGrain.y, uTime));
    col += uLifeDotsTint.rgb * (uLifeDots.x * tone * seen * lifeDots(q, px * uInflow.z * uLifeDots.y, uTime));
  }
  vec3 to = ST_CENTRE - uCam;
  float away = length(to);
  vec3 c1 = to / away;
  vec3 ray = normalize(vStage - uCam);
  float el = (acos(clamp(dot(ray, c1), -1.0, 1.0)) - asin(clamp(ST_RADIUS / away, 0.0, 1.0))) * sqrt(max(away * away - ST_RADIUS * ST_RADIUS, 0.0)) / ST_RADIUS * tan(ST_ALPHA);
  float limb = smoothstep(uBand.x, uBand.y, el);
  vec2 gb = stImage(vStage);
  for (int k = 0; k < (limb > 0.0 ? 1 : 0); k++) {
    vec2 far = stImage(stLimbDir(ray, c1, el));
    col = mix(col, inverseFilmic(textureLod(uPlate, stPlate(far), uLod).rgb), limb);
    gb = mix(gb, far, limb);
  }
  gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
  // a thin glowing haze low over the ground: a layer at its own height, so it shifts against the cells as the
  // camera flies, and drifts on its own wind. It is thin: seen from steeply above there is none of it.
  for (int k = 0; k < ((uHazeLow.x > 0.0 && now < uHazeSteep.y && limb < 1.0) ? 1 : 0); k++) {
    vec3 hp = vStage + normalize(uCam - vStage) * (uHazeLow.y / max(now, uHazeLow.w)) - ST_DOWN;
    vec2 hq = (vec2(dot(hp, ST_RIGHT), dot(hp, ST_FWD)) - uHazeWind.xy * uTime) * uHazeScale.xy;
    float hn = (vnoise(vec3(hq, uTime * uHazeWind.z)) + 0.5 * vnoise(vec3(hq * 2.3 + 5.1, uTime * uHazeWind.z * 1.6 + 2.7))) / 1.5;
    float thick = smoothstep(uHazeScale.z, uHazeScale.w, hn) * min(1.0 / max(now, 1e-3), uHazeLow.z);
    float veil = (1.0 - exp(-uHazeLow.x * thick)) * (1.0 - smoothstep(uHazeSteep.x, uHazeSteep.y, now)) * (1.0 - limb);
    col = mix(col, inverseFilmic(uHazeTint.rgb) * uHazeTint.w, veil);
  }
  for (int k = 0; k < ((vStage.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); k++) {
    float landed = uLandOn * exp(-dot(vStage - uLand.xyz, vStage - uLand.xyz) * uLand.w) + uKickOn * exp(-dot(vStage - uKick.xyz, vStage - uKick.xyz) * uKick.w);
    col *= 1.0 + textureLod(uGlow, gb, 0.0).rgb * (uGlowBeat * (1.0 - lift * smoothstep(uGlowReach.x, uGlowReach.y, ring)) * (1.0 + landed));
    col += uLandVeil * landed;
  }
  for (int k = 0; k < (uFlashOn.x + uFlashOn.y > 0.0 ? 1 : 0); k++) {
    float pool = exp(-dot(vStage - uFlash.xyz, vStage - uFlash.xyz) * uFlash.w);
    col = col * (1.0 + uFlashOn.x * pool) + uLandVeil * (uFlashOn.y * pool);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float shown = 1.0;
  for (int k = 0; k < (uMixed > 0.5 ? 1 : 0); k++) {
    shown = mix(uShow.x, uShow.y, 1.0 - smoothstep(uSite.x, uSite.y, r)) * step(0.0, dot(normal, uCam - vStage));
  }
  outColor = diagOut(vec4(col, shown), texels, 1.0, vec3(0.9, 0.5, 0.1), moved * 4.0, length(vView));
}`

export class Ground {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly pulse: [number, number]
  private readonly out: [number, number]
  private readonly edge: [number, number]
  private readonly seethe: SeetheLook | undefined

  constructor(plate: THREE.Texture, apron: THREE.Texture, field: THREE.Texture, glow: THREE.Texture, grade: THREE.Texture, look: GroundLook, life: LifeMaps, seethe?: SeetheLook) {
    this.seethe = seethe
    const img = plate.image as unknown as { width: number; height: number }
    const second = apron.image as unknown as { width: number; height: number }
    this.pulse = look.glow
    this.out = look.apron.out
    this.edge = look.apron.edge
    const up = stage.down.clone().negate()
    const e1 = new THREE.Vector3(1, 0, 0).addScaledVector(up, -up.x).normalize()
    const e2 = up.clone().cross(e1)
    const spot = stage.onGround(stage.spot[0], stage.spot[1])
    const spotUp = spot.clone().sub(stage.centre).normalize()
    const spotE = new THREE.Vector3(1, 0, 0).addScaledVector(spotUp, -spotUp.x).normalize()
    const spotN = spotUp.clone().cross(spotE)
    const edge = stage.onGround(stage.spot[0] + stage.umbra[0], stage.spot[1])
    const umbra = edge.distanceTo(spot)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: frag(seethe !== undefined),
      uniforms: {
        uGrade: { value: grade }, uPlate: { value: plate }, uApron: { value: apron }, uApronSize: { value: new THREE.Vector2(second.width, second.height) }, uApronOn: { value: look.apron.amount }, uApronOut: { value: 0 }, uApronEdge: { value: 1 }, uApronCell: { value: new THREE.Vector2(look.apron.cell, look.apron.calm) }, uGlow: { value: glow }, uField: { value: field }, uFieldSize: { value: new THREE.Vector4(fieldData.size, (field.image as unknown as { width: number }).width, look.field.grid, look.field.sharp) }, uFieldFine: { value: new THREE.Vector4(0, look.field.fine.below[0], look.field.fine.below[1], look.field.fine.scale) }, uFieldFineMore: { value: new THREE.Vector2(look.field.fine.gain, look.field.fine.soft) }, uOwn: { value: new THREE.Vector4(look.own.ring[0], look.own.ring[1], look.own.side, look.own.near) }, uUp: { value: new THREE.Vector4(look.own.up[0], look.own.up[1], look.own.rough[0], look.own.rough[1]) }, uLift: { value: new THREE.Vector2(...look.lift) }, uEven: { value: new THREE.Vector4(look.even.from[0], look.even.from[1], look.even.far[0], look.even.far[1]) }, uEvenTint: { value: new THREE.Vector4(...look.even.tint, look.even.dim) }, uGlowReach: { value: new THREE.Vector2(...look.glowReach) }, uSite: { value: new THREE.Vector2(...look.site) }, uBox: { value: new THREE.Vector4(...stage.loopsBox) }, uGlowBeat: { value: 1 }, uLand: { value: new THREE.Vector4(0, 0, 1, 1) }, uLandOn: { value: 0 }, uKick: { value: new THREE.Vector4(0, 0, 1, 1) }, uKickOn: { value: 0 }, uFlash: { value: new THREE.Vector4(0, 0, 1, 1) }, uFlashOn: { value: new THREE.Vector2() }, uLandVeil: { value: new THREE.Vector3() }, uSize: { value: new THREE.Vector2(img.width, img.height) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uCellSize: { value: look.cell },
        ...lifeUniforms(life),
        uHazeLow: { value: new THREE.Vector4(lifeData.haze.amount, lifeData.haze.height, lifeData.haze.cap, lifeData.haze.floor) }, uHazeWind: { value: new THREE.Vector4(lifeData.haze.wind[0]!, lifeData.haze.wind[1]!, lifeData.haze.churn, 0) }, uHazeScale: { value: new THREE.Vector4(lifeData.haze.scale[0]!, lifeData.haze.scale[1]!, lifeData.haze.cut[0]!, lifeData.haze.cut[1]!) }, uHazeSteep: { value: new THREE.Vector4(lifeData.haze.steep[0]!, lifeData.haze.steep[1]!, 0, 0) }, uHazeTint: { value: new THREE.Vector4(lifeData.haze.tint[0]!, lifeData.haze.tint[1]!, lifeData.haze.tint[2]!, lifeData.haze.level) },
        uTwinkle: { value: new THREE.Vector3(look.twinkle.amount, look.twinkle.rate, look.twinkle.spread) },
        uInflow: { value: new THREE.Vector4(look.inflow.amount, look.inflow.waves, umbra * look.inflow.inner, umbra * look.inflow.outer) },
        uInflowRate: { value: new THREE.Vector2(look.inflow.rate, look.inflow.rate * 1.7) },
        uCam: { value: new THREE.Vector3() }, uBand: { value: new THREE.Vector2(-THREE.MathUtils.degToRad(look.band[0]), -THREE.MathUtils.degToRad(look.band[1])) }, uLod: { value: 0 }, uSpot: { value: spot }, uSpotE: { value: spotE }, uSpotN: { value: spotN }, uShow: { value: new THREE.Vector2(1, 1) }, uMixed: { value: 0 },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    if (seethe) {
      this.material.uniforms.uSeethe = { value: new THREE.Vector4(0, seethe.rate, seethe.spread, 0) }
      this.material.uniforms.uSeetheNear = { value: new THREE.Vector3(seethe.near[0], seethe.near[1], seethe.far) }
      this.material.uniforms.uCrown = { value: new THREE.Vector2(seethe.crown[0], seethe.crown[1]) }
    }
    const rings = look.rings
    const sectors = look.sectors
    const cap = THREE.MathUtils.degToRad(look.cap)
    const positions = new Float32Array((rings + 1) * sectors * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i <= rings; i++) {
      const theta = cap * (i / rings)
      for (let j = 0; j < sectors; j++) {
        const phi = (j / sectors) * Math.PI * 2
        p.copy(up).multiplyScalar(Math.cos(theta)).addScaledVector(e1, Math.sin(theta) * Math.cos(phi)).addScaledVector(e2, Math.sin(theta) * Math.sin(phi)).multiplyScalar(stage.radius).add(stage.centre)
        p.toArray(positions, (i * sectors + j) * 3)
      }
    }
    const index: number[] = []
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = i * sectors + j
        const b = i * sectors + ((j + 1) % sectors)
        const c = a + sectors
        const d = b + sectors
        index.push(a, c, b, b, c, d)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(index)
    this.material.side = THREE.DoubleSide
    this.material.blendEquation = THREE.AddEquation
    this.material.blendSrc = THREE.SrcAlphaFactor
    this.material.blendDst = THREE.OneMinusSrcAlphaFactor
    this.material.blendSrcAlpha = THREE.OneFactor
    this.material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
  }

  show(mixed: boolean, weight: number, site: number): void {
    const m = this.material
    m.transparent = mixed
    m.blending = mixed ? THREE.CustomBlending : THREE.NormalBlending
    m.depthTest = !mixed
    m.depthWrite = !mixed
    ;(m.uniforms.uShow!.value as THREE.Vector2).set(weight, site)
    m.uniforms.uMixed!.value = mixed ? 1 : 0
    this.mesh.visible = !mixed || weight > 0 || site > 0
  }

  land(reach: number, veil: [number, number, number]): void {
    ;(this.material.uniforms.uLandVeil!.value as THREE.Vector3).fromArray(veil)
    const feet = stage.feet as [number, number][]
    const at = (foot: [number, number], into: THREE.Vector4): void => {
      const p = stage.onGround(foot[0], foot[1])
      into.set(p.x, p.y, p.z, 1 / (reach * reach))
    }
    at(feet[1]!, this.material.uniforms.uLand!.value as THREE.Vector4)
    at(feet[0]!, this.material.uniforms.uKick!.value as THREE.Vector4)
  }

  flash(span: number): void {
    const feet = stage.feet as [number, number][]
    const a = stage.onGround(feet[0]![0], feet[0]![1])
    const b = stage.onGround(feet[1]![0], feet[1]![1])
    const p = stage.onGround((feet[0]![0] + feet[1]![0]) / 2, (feet[0]![1] + feet[1]![1]) / 2)
    const reach = span * a.distanceTo(b)
    ;(this.material.uniforms.uFlash!.value as THREE.Vector4).set(p.x, p.y, p.z, 1 / (reach * reach))
  }

  update(camera: THREE.Vector3, time: number, gain: number, vignette: number, aspect: number, lod: number, lit: number, open = 0, since = 0, beat = 0, land = 0, kick = 0, flash = 0, veil = 0): void {
    const u = this.material.uniforms
    u.uLandOn!.value = land
    u.uKickOn!.value = kick
    ;(u.uFlashOn!.value as THREE.Vector2).set(flash, veil)
    if (this.seethe) {
      const v = u.uSeethe!.value as THREE.Vector4
      v.x = this.seethe.amount * open
      v.w = since
    }
    u.uLod!.value = lod
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    u.uTime!.value = time
    u.uApronOut!.value = THREE.MathUtils.smoothstep(time, this.out[0], this.out[1])
    u.uApronEdge!.value = THREE.MathUtils.smoothstep(time, this.edge[0], this.edge[1])
    u.uGlowBeat!.value = stage.litMax * (1 + lit) * (1 + this.pulse[0] * (0.6 * Math.sin(time * this.pulse[1]) + 0.4 * Math.sin(time * this.pulse[1] * 1.83))) * (1 + beat)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
