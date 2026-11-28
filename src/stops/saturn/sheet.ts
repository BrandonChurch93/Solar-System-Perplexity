import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import azimuth from './azimuth.json'
import { RING_FIELD_GLSL, type RingField } from './field'
import { DUST_AIR_GLSL, ICE_GRADE_GLSL, gradeUniforms } from './grade'
import { ICE_GLSL, type Ice } from './ice'
import * as keptLook from './kept/look'
import { HASH_GLSL } from './kept/rings'
import model from './ringfield.json'
import ringsJson from './rings.json'
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
uniform vec4 uInner;
uniform vec4 uInner2;
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
// (away: how far past the rim, 0 to 1; gap: the share that is a gap there; least: the share of the depth a
// gap keeps)
// (waves: the three widths of the sets and their seed; fit: the least softness of a plateau's edge in cells,
// that softness in footprints, the strength of the thin lines at the edges, the softness of a gap's edge)
float sheetBandsOf(float r, float fp, float away, float gap, float least, vec4 waves, vec4 fit) {
  float at = mix(-fit.w, gap, away);
  float mean = least + (1.0 - least) * clamp(1.0 - at, 0.0, 1.0);
  float k = 1.0;
  for (int i = 0; i < 3; i++) {
    float wave = i == 0 ? waves.x : (i == 1 ? waves.y : waves.z);
    float seen = clamp(wave / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    vec2 h;
    float b;
    vec3 q = ringOctave(r / wave + uOuterGaps.w * float(i), uint(waves.w) + uint(i), max(fit.x, fit.y * fp / wave), 0.0, h, b);
    float open = least + (1.0 - least) * smoothstep(at - fit.w, at + fit.w, q.x * 0.5 + 0.5);
    k *= mix(mean, open * exp(fit.z * q.z), seen);
  }
  return k;
}
float sheetBands(float r, float fp, float away, float gap, float least) {
  return sheetBandsOf(r, fp, away, gap, least, uOuterWaves, vec4(uOuterBands.y, uOuterGaps.z, uOuterGaps.y, uOuterBands.z));
}
float sheetOuterBands(float r, float fp) {
  return sheetBands(r, fp, clamp((r - uOuter.x) / uOuterBands.w, 0.0, 1.0), uOuterBands.x, uOuterGaps.x);
}
// The inner rim (uInner.x) is no edge of the plane: inside it a thin sheet of dust and ice goes on toward the
// globe, with the depth uInner.y at the rim falling to uInner.z at the cloud tops (skim.json inner.depth, the
// depth straight through the plane), in ringlets of its own (the same plateaus as past the outer rim), of dark
// ice of its own: where it is too deep to see through it returns uInner2.x (skim.json inner.ice) of what the
// ice of the thin inner ring at uInnerBands.z returns there, the same at every radius. It is one body with the
// ring: the same depth and the same ice at every height of the lens, covered by the one law of cover, so the
// hold's steep view sees all but through it, with little light of its own against the black, and the skim's
// flat view sees it as a grey veil that takes light from the globe behind it. It ends over the foot of the ring
// (skim.json inner.join: from so far inward of the rim to so far outward of it), where the ring's own ice
// rises from nothing to more than the sheet's, so the depth of the plane has neither a gap nor a ridge there.
float sheetInner(float r) {
  return mix(uInner.y, uInner.z, clamp((uInner.x - r) / (uInner.x - 1.0), 0.0, 1.0)) * (1.0 - smoothstep(uInner.x - ${skim.inner.join[0]!.toFixed(6)}, uInner.x + ${skim.inner.join[1]!.toFixed(6)}, r));
}
// the brightness that depth returns where the model was measured
float sheetOuterLum(float depth) {
  return uOuter2.w * ringSat(depth * uRfLight.x);
}
// the radius the colour of the ice is read at: past the rim the ice has the colour of the rim
// and inside the inner rim the colour of the ice just outside it
float sheetInkRadius(float r) {
  return r - max(r - uOuterInk.x, 0.0) * uOuterInk.y + max(uInner2.y - r, 0.0) * uInner2.z;
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
${DUST_AIR_GLSL}
uniform vec3 uSunL;
uniform vec4 uFlatten;
uniform vec3 uEven;
uniform vec3 uInnerBands;
uniform vec4 uInnerRings;
uniform vec4 uInnerWaves;
uniform vec4 uInnerFit;
// uOnly 1: the plane holds the thin sheet inside the inner rim alone (the set of the kept build draws the ring
// itself, set.ts). sheetThin: the share of the thin inner sheet in the depth of the plane at the last point
// sheetAt was asked for, and sheetGlow: the share of the thin inner sheet in the brightness there
uniform float uOnly;
float sheetThin = 0.0;
float sheetGlow = 0.0;
// sheetFine: what the caller sets before it asks for a point, for the ringlets' amplitude by radius (grade.ts
// iceFine): the power less one, the width of a zone in footprints, the least and the most of the ratio that
// counts. With the power 0 (the hold, and wherever the amplitude is 1) nothing of it runs
vec4 sheetFine = vec4(0.0);
void sheetAt(vec2 q, float r, float fp, float fpl, out float tau, out float lum, out float thin, out vec4 ink, out vec3 tint, out vec2 wide) {
  vec2 knots = ringKnots(r, fp);
  // the ringlets' amplitude by radius: the light of the model's own profile over the light of its zone
  for (int k = 0; k < (abs(sheetFine.x) > 0.0 ? 1 : 0); k++) knots.y *= pow(clamp(knots.y / max(ringKnots(r, fp * sheetFine.y).y, 1e-6), sheetFine.z, sheetFine.w), sheetFine.x);
  wide = ringKnots(r, uFlatten.z);
  float rc = sheetInkRadius(r);
  ink = ringInk(rc);
  thin = ringThin(rc);
  // near the sheet the bands of the dense rings stand out less from their zone than from afar (uEven: the
  // power on the brightness of a band this wide over its zone's, 1 from afar, and how far from 1 that ratio
  // counts); the ringlets narrower than a band keep their contrast
  float band = ringKnots(r, max(fp, uEven.z)).y;
  knots.y *= pow(clamp(band / max(wide.y, 1e-4), 1.0 / uEven.y, uEven.y), (uEven.x - 1.0) * (1.0 - thin));
  float more = sheetOuter(r);
  for (int k = 0; k < (more > 0.0 ? 1 : 0); k++) more *= sheetOuterBands(r, fp);
  knots += vec2(more, sheetOuterLum(more));
  knots *= 1.0 - uOnly;
  float dust = sheetInner(r);
  float glow = 0.0;
  for (int k = 0; k < (dust > 0.0 ? 1 : 0); k++) {
    dust *= sheetBands(r, fp, clamp((uInner.x - r) / uInner2.w, 0.0, 1.0), uInnerBands.x, uInnerBands.y);
    // the stuff of the thin inner ring: what the ice at uInnerBands.z returns where it is too deep to see through
    vec2 like = ringKnots(uInnerBands.z, uFlatten.z);
    // the dust lies in ringlets of its own, finer than the plateaus of its depth: darker and lighter ones about
    // the same mean (uInnerRings: the share that is dark, the share of its light a dark one keeps, how far
    // they show; uInnerWaves: their three widths and their seed; uInnerFit: their edges, as sheetBandsOf
    // takes them)
    float gapMean = uInnerRings.y + (1.0 - uInnerRings.y) * clamp(1.0 - uInnerRings.x, 0.0, 1.0);
    float rings = mix(1.0, sheetBandsOf(r, fp, 1.0, uInnerRings.x, uInnerRings.y, uInnerWaves, uInnerFit) / (gapMean * gapMean * gapMean), uInnerRings.z);
    // the dust by the globe lies in the long twilight of the globe, where the Sun's light comes through the
    // globe's air (grade.ts dustAir, on the globe made round)
    rings *= dustAir(vec3(q.x, 0.0, q.y), normalize(vec3(uSunL.x, uSunL.y / uPolar, uSunL.z)));
    glow = uInner2.x * like.y / max(ringSat(like.x * uRfLight.x), 1e-4) * ringSat(dust * uRfLight.x) * rings;
    knots += vec2(dust, glow);
  }
  sheetThin = dust / max(knots.x, 1e-9);
  sheetGlow = glow / max(knots.y, 1e-9);
  tau = knots.x;
  lum = knots.y;
  // and the ringlets of the ladder by the same amplitude
  ringFine(r, fp, fpl, ink.a * (1.0 + sheetFine.x), thin, dot(q / r, normalize(uSunL.xz)), tau, lum, tint);
}`

// The far look of the sheet: the sheet as the set of the kept build draws it once its picture of the hold has
// become the plain radial profile (kept/rings.ts with no pose, no polar picture and no closeness), from the
// same profile with the same numbers (kept/look.ts). In the dive the model shows this look while the kept set
// still draws a share of the takes (skim.json handover.kept), so the two scenes are one picture there, and
// leaves it for its own light as the lens closes in. Needs RING_FIELD_GLSL (the kept profile), HASH_GLSL and
// INVERSE_FILMIC_GLSL.
export const SHEET_FAR_GLSL = /* glsl */ `
uniform vec2 uKEdge;
uniform vec4 uKFit;
uniform vec3 uKTone;
uniform vec3 uKFloorHold;
uniform vec4 uKFloorTone;
uniform float uKAzGain[25];
uniform float uKAzRadii[5];
uniform vec3 uKShadowL;
uniform vec3 uKPenumbra;
uniform vec2 uKPenumbraFar;
uniform vec2 uKSolid;
uniform vec2 uKShadeRamp;
uniform vec3 uKGraze;
uniform float uKSine;
uniform float uKDeep;
uniform vec4 uKOver;
uniform vec4 uKStrand;
uniform float uKSheetR[9];
uniform float uKSheetT[9];
uniform float uKWedgeG[9];
uniform vec4 uKSheetGlow;
uniform vec4 uKSheetFit;
uniform vec4 uKMottle;
uniform float uKFillet;
${ICE_GRADE_GLSL}
float keptAzRow(int i, vec4 h) {
  return uKAzGain[i * 5] + uKAzGain[i * 5 + 1] * h.x + uKAzGain[i * 5 + 2] * h.y + uKAzGain[i * 5 + 3] * h.z + uKAzGain[i * 5 + 4] * h.w;
}
float keptAzGain(float r, float phi) {
  int i = 0;
  for (int k = 1; k < 4; k++) if (r >= uKAzRadii[k]) i = k;
  float t = clamp((r - uKAzRadii[i]) / (uKAzRadii[i + 1] - uKAzRadii[i]), 0.0, 1.0);
  vec4 h = vec4(cos(phi), sin(phi), cos(2.0 * phi), sin(2.0 * phi));
  return clamp(mix(keptAzRow(i, h), keptAzRow(i + 1, h), t), 0.4, 1.7);
}
// Each of the two reads its own uniform array where it lives (see sheetThrough in kept/rings.ts for the reason).
float keptThrough(float r) {
  int i = 0;
  for (int k = 1; k < 8; k++) if (r >= uKSheetR[k]) i = k;
  return mix(uKSheetT[i], uKSheetT[i + 1], clamp((r - uKSheetR[i]) / (uKSheetR[i + 1] - uKSheetR[i]), 0.0, 1.0));
}
float keptWedge(float r) {
  int i = 0;
  for (int k = 1; k < 8; k++) if (r >= uKSheetR[k]) i = k;
  return mix(uKWedgeG[i], uKWedgeG[i + 1], clamp((r - uKSheetR[i]) / (uKSheetR[i + 1] - uKSheetR[i]), 0.0, 1.0));
}
// how far the sheet of the far look is lit at the place along and beside the axis of the globe's shadow, mw the
// pixel's width of miss
float keptLit(float along, float miss, float mw) {
  return along > 0.0 ? 1.0 : smoothstep(uKPenumbra.x - mw, uKPenumbra.y + mw + uKPenumbra.z * max(-along, 0.0) + uKPenumbraFar.y * max(-along - uKPenumbraFar.x, 0.0), miss);
}
// how far a view ray counts as passing the globe (1) and not ending on it (0): bb its nearest distance to the
// globe's centre in the globe's own measure, bw the pixel's width of bb. A ray counts as passing from where the
// globe's own soft edge begins (uKGraze.z pixels inside its outline), so no star shows in that edge
float keptEdge(float bb, float bw) {
  return smoothstep(1.0 - (uKGraze.z + 1.0) * bw, 1.0 - uKGraze.z * bw, bb);
}
// The one law of cover (skim.json handover.kept): the ring is one body at every height of the lens, so a view
// ray that crosses its plane is covered by 1 - exp(-depth / sine), sine that of the angle between the ray and
// the plane, floored only against the division (uKSine). The depth at a radius is the kept ring's own: what
// gives the kept opacity at the sine of the hold's eye (uKFloorTone.w). keptRise: the power that law puts on
// what the kept ring lets through, for a ray at the cosine mu to the normal of the plane
float keptRise(float mu) {
  return uKFloorTone.w / max(mu, uKSine);
}
// where the sheet lies in front of the lit globe (r: radius, lit: how far the ice there is out of the globe's
// shadow, fore: in front of the globe, bb with its width bw: how the view ray passes the globe, fw: the width
// of the inner rim), as the kept set has it (kept/rings.ts)
float keptFront(float r, float lit, bool fore, float bb, float bw, float fw) {
  float keep = max(smoothstep(uKSheetFit.x, uKSheetFit.y, r), 1.0 - smoothstep(1.0 - bw, 1.0 + bw, bb));
  return fore ? (1.0 - smoothstep(1.0 - bw, 1.0 + bw, bb)) * lit * smoothstep(uKEdge.x - fw, uKEdge.x + fw, r) * mix(1.0, keep, smoothstep(1.0 - bw, 1.0 + bw, bb)) * (1.0 - smoothstep(uKEdge.y - 0.002, uKEdge.y + 0.002, r)) : 0.0;
}
// the cover of the sheet there: the kept ring lets uKSheetT of the lit globe through at the sine of the hold's
// eye, and by the one law less where the view runs flatter over the plane and more where it runs steeper. The
// far look and the model near the sheet both draw it, at every height of the lens
float keptVeil(float r, float mu, float front) {
  return (1.0 - pow(keptThrough(r), keptRise(mu))) * front;
}
// the opacity of the shaded plane, which lets no sky through from the globe on (sheet.json shadow.solid, as the
// set of the kept build has it, kept/rings.ts): no star shows between the night side and the shaded rings. past:
// keptEdge of the view ray; where the ray ends on the globe the true depth counts, so the night side is the
// body's own ellipse behind the empty space and behind thin ice
float keptShade(float r, float along, float miss, float mw, float past) {
  return uKSolid.x * uKSolid.y * (1.0 - keptLit(along, miss, mw)) * (1.0 - smoothstep(uKEdge.y - 0.002, uKEdge.y + 0.002, r)) * smoothstep(uKShadeRamp.x, uKShadeRamp.y, r) * past;
}
// colour and opacity of the far look at radius r and azimuth phi. x: the place in the profile, texels: profile
// texels a pixel, mu: cosine of the view to the normal, along and miss: the place along and beside the axis of
// the globe's shadow with mw the pixel's width of miss, fore: in front of the globe, od and bb with its width
// bw: how the view ray passes the globe, day: how far the globe behind is in daylight, fw: the width of the
// inner rim, grad: the scale of the gradients, unlit: the lens is on the side away from the Sun
vec4 keptSheet(float r, float phi, float x, float texels, float mu, float along, float miss, float mw, bool fore, float od, float bb, float bw, float day, float fw, float grad, bool unlit) {
  const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
  vec4 s = keptProf(x, texels * grad * uKFit.w);
  float body = smoothstep(uKEdge.x - 0.004, uKEdge.x + 0.004, r) * (1.0 - smoothstep(uKEdge.y - 0.002, uKEdge.y + 0.002, r));
  float ramp = smoothstep(uKFit.y, uKFit.z, r);
  // no star shows through any part of the sheet that holds ice: where the view ray passes the globe the depth
  // of the sheet counts uViewFit.w times (sheet.json starCover); the globe shows through by the depth itself.
  // The opacity goes by the one law of cover (keptRise): no height of the lens and no clock is in it
  float cover = mix(1.0, uViewFit.w, uKSolid.x * body * keptEdge(bb, bw));
  float a = 1.0 - pow(1.0 - min(max(s.a, uKFit.x * body * ramp), 0.999), keptRise(mu) * cover);
  vec3 c = inverseFilmic(s.rgb) * uKTone * keptAzGain(r, phi);
  float tu = (phi + uKMottle.z * pow(max(r, 1.0) / 1.86, -1.5) * uKMottle.w) / 6.283185307;
  float inB = smoothstep(1.5, 1.6, r) * (1.0 - smoothstep(1.88, 1.95, r));
  c *= 1.0 - uKMottle.x * inB * smoothstep(0.55, 0.9, vnoise(vec2(tu * 36.0, r * 3.0), 36)) + uKMottle.y * (vnoise(vec2(tu * 640.0, r * 70.0), 640) - 0.5);
  // the grade of the rings by the height of the lens (grade.ts); nothing of it runs at the heights of the hold
  for (int j = 0; j < (uGrade.x > 0.0 ? 1 : 0); j++) {
    c = iceGrade(c, r) * iceView(mu, r) * iceZone(r, mu);
    // the ringlets' amplitude by radius (grade.ts iceFine): the light of the profile at the pixel over the
    // light of its zone, the same in the kept set (kept/rings.ts)
    float fine = iceFine(r);
    for (int i = 0; i < (abs(fine) > 0.0 ? 1 : 0); i++) c *= iceRinglets(dot(inverseFilmic(s.rgb), luma), dot(inverseFilmic(keptProf(x, max(texels * grad * uKFit.w, 1.0) * uGradeFine.x).rgb), luma), fine);
  }
  float lit = keptLit(along, miss, mw);
  // what the globe behind the sheet adds to the look of the ice in front of it (the strands over the globe, the
  // sheet in front of the lit globe and its glow), as the kept set has it at every height of the lens
  float over = fore ? smoothstep(-0.05, 0.0, od) * smoothstep(uKEdge.x, uKEdge.x + uKOver.x, r) * lit : 0.0;
  float sheet = keptFront(r, lit, fore, bb, bw, fw);
  a = max(a, keptVeil(r, mu, sheet));
  a = max(a, keptShade(r, along, miss, mw, keptEdge(bb, bw)));
  vec3 wedge = uKSheetGlow.rgb * (1.0 - smoothstep(uKSheetFit.z, uKSheetFit.w, bb)) * keptWedge(r) * sheet * day;
  for (int j = 0; j < (over > 0.0 ? 1 : 0); j++) {
    float sx = (uKStrand.x + (r - uKEdge.x) * uKStrand.y - uKSpan.x) * uKSpan.y;
    float sl = texels * grad * uKStrand.y * 1.5;
    float zone = over * (1.0 - smoothstep(uKOver.y, uKOver.w, r));
    float st = clamp(pow(max(dot(keptProf(sx, sl).rgb, luma), 1e-3) / max(dot(keptProf(sx, sl * 24.0).rgb, luma), 1e-3), uKStrand.z), 0.5, 1.6);
    c *= mix(1.0, uKStrand.w * st, zone);
  }
  float dense = smoothstep(0.0, 0.6, dot(c, luma));
  c = mix(uKFloorHold * (uKFloorTone.x + uKFloorTone.y * dense) * ramp * body, c, lit);
  for (int j = 0; j < (unlit ? 1 : 0); j++) c *= uKFloorTone.z * (0.25 + 3.0 * s.a * (1.0 - s.a)) / max(s.a, 0.05);
  return vec4(c + wedge, a);
}`

// The plane is no mesh. A mesh of the plane passes behind the lens when the lens is near it; the rasteriser
// then cuts every triangle on its own where it meets the plane of the lens, and the cut edges of two
// neighbours need not meet: a slit along a spoke of the mesh, one frame long, with the sky in it. So the pass
// is one triangle over the whole picture and the point of the plane under a pixel is where the ray from the
// lens through that pixel meets the plane (the same point the mesh gave). position: the corner in the
// picture (-1 to 1 across and up). vRay: that ray in the frame of the rings, as long as one unit of depth;
// vRayV: the same in the frame of the lens; vEye: the lens in the frame of the rings.
const VERT = /* glsl */ `
out vec2 vNdc;
out vec3 vRay;
out vec3 vRayV;
flat out vec3 vEye;
void main() {
  vNdc = position.xy;
  vRayV = vec3((position.x + projectionMatrix[2][0]) / projectionMatrix[0][0], (position.y + projectionMatrix[2][1]) / projectionMatrix[1][1], -1.0);
  mat4 back = inverse(modelViewMatrix);
  vRay = mat3(back) * vRayV;
  vEye = back[3].xyz;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vNdc;
in vec3 vRay;
in vec3 vRayV;
flat in vec3 vEye;
uniform vec3 uCamL;
uniform vec2 uBounds;
uniform float uPolar;
uniform int uPass;
uniform float uGrad;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uFinest;
uniform float uSat;
uniform vec4 uThinFar;
uniform vec4 uThinFar2;
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
${HASH_GLSL}
${INVERSE_FILMIC_GLSL}
${SHEET_FAR_GLSL}
void main() {
  // where the ray through the pixel meets the plane; a ray that does not meet it, or meets it very far
  // away, gets a point far outside the ice, so that no number here grows past what a float holds
  bool met = vRay.y * vEye.y < 0.0;
  float depth = met ? min(-vEye.y / vRay.y, 1e6) : 1e6;
  vec2 q = vEye.xz + vRay.xz * depth;
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
  // every width that is counted in pixels is counted in pixels of the master (ringLookPixel, the film's own
  // factor): the footprint the ladder is filtered with, the texels of the far look, the feathers of the
  // globe's shadow and outline. A frame of any size is then the same picture
  float fp = ringFootprint(length(vec2(ringLookPixel(pixel), sweep.x * uIceFit.x)), uGrad);
  float fpl = ringFootprint(length(vec2(ringLookPixel(pixel), sweep.x * uIceFit.x)), uGrad);
  vec3 cs = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
  vec3 ds = vec3(ray.x, ray.y / uPolar, ray.z);
  bool front = -dot(cs, ds) > dot(ds, ds);
  // past the span of the model there is ice only when the lens is near
  bool mine = met && r >= uBounds.x && r <= uBounds.y && front == (uPass == 1) && (uIceOrbit.z > 0.0 || r < uRfSpan.x + 1.0 / uRfSpan.y);
  // what the far look needs of the pixel's gradients: the globe's shadow and how the view ray passes the globe
  vec3 ks = normalize(vec3(uKShadowL.x, uKShadowL.y / uPolar, uKShadowL.z));
  float kAlong = dot(P, ks);
  float kMiss = length(P - ks * kAlong);
  float kMw = 0.75 * ringLookPixel(length(vec2(dFdx(kMiss), dFdy(kMiss))));
  float oa = dot(ds, ds);
  float ob = dot(cs, ds);
  float od = (ob * ob - oa * (dot(cs, cs) - 1.0)) / oa;
  float bb = sqrt(max(1.0 - od, 0.0));
  float bw = max(ringLookPixel(length(vec2(dFdx(bb), dFdy(bb)))), 1e-5);
  // the shaded plane does not end at the globe's outline: it goes on under the globe's own soft edge (lip: a
  // place inside the inner end of the plane whose view ray passes the globe within that edge, as keptEdge has
  // it), in both sets alike (kept/rings.ts). Without it the sky had a window between the plane and the globe's
  // outline at the two ends of the equator, and a star behind the plane flashed up as the outline passed it.
  // Such a place lies inside the globe, so it is drawn behind the globe in both halves of the plane
  bool lip = met && r < uBounds.x && uPass == 0 && bb > 1.0 - (uKGraze.z + 1.0) * bw;
  float kx = (r - uKSpan.x) * uKSpan.y;
  // one look from far to near: the sheet keeps the far look wherever it lies far from the lens, and the model's
  // own light, with all it adds, shows only on the part of the sheet the lens has come near (skim.json
  // handover.kept.reach, by the logarithm of the distance), so nothing changes with time alone
  // (the thin sheet inside the inner rim is no part of the far look: the model draws it at every height and
  // every distance, below, so the far look by the distance begins at the rim. With uOnly the plane holds that
  // thin sheet alone and no far look)
  float wfar = max(uRfFar, smoothstep(uRfReach.x, uRfReach.y, log(max(length(ray), 1e-6))) * smoothstep(uInner.x, uInner.x + uInner.w, r)) * (1.0 - uOnly);
  vec4 farLook = vec4(0.0);
  for (int k = 0; k < ((mine && wfar > 0.0 && kx > 0.0 && kx < 1.0) ? 1 : 0); k++) {
    vec3 on = cs + ds * ((-ob - sqrt(max(od * oa, 0.0))) / oa);
    float day = smoothstep(-0.05, 0.25, dot(normalize(vec3(on.x, on.y / uPolar, on.z)), normalize(uSunL)));
    farLook = keptSheet(r, atan(q.y, q.x), kx, ringLookPixel(pixel) * uKSpan.y * float(uKProfN), abs(ray.y) / length(ray), kAlong, kMiss, kMw, front, od, bb, bw, day, max(uKFillet, 1.5 * ringLookPixel(pixel)), uGrad, uSunL.y * uCamL.y < 0.0);
  }
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  // what of the model's own light is the thin sheet inside the inner rim: its colour and its cover
  vec4 inside = vec4(0.0);
  for (int k = 0; k < ((mine && (wfar < 1.0 || r < uInner.x + uInner.w)) ? 1 : 0); k++) {
    float tau;
    float lum;
    float thin;
    vec4 ink;
    vec3 tint;
    vec2 wide;
    // the ringlets' amplitude by radius, as in the far look (grade.ts iceFine)
    for (int j = 0; j < (uGrade.x > 0.0 ? 1 : 0); j++) sheetFine = vec4(iceFine(r), uGradeFine);
    sheetAt(q, r, fp, fpl, tau, lum, thin, ink, tint, wide);
    // the light of the thin sheet inside the inner rim is kept apart from the ring's: nothing the near light of
    // the ring gains or loses by the height of the lens (its gain, its tint, its saturation, the evening of its
    // zones, the grade) touches it
    float dustLum = lum * sheetGlow;
    lum -= dustLum;
    float turn = atan(q.y, q.x) / 6.2831853;
    // the spokes show only near the sheet
    float spokes = 0.0;
    for (int j = 0; j < (uIceOrbit.z > 0.0 ? 1 : 0); j++) spokes = iceSpokes(r, turn);
    lum *= exp(spokes * uIceOrbit.z);
    // near the sheet the broad zones of the dense rings are evener than from afar
    lum *= pow(clamp(wide.y / uFlatten.x, 1.0 / uFlatten.w, uFlatten.w), uFlatten.y * (1.0 - thin));
    // the sand of the sheet and its sparks, as the sheet is seen from afar
    vec2 sand = iceSand(r, turn, 1.0 / max(pixel, 1e-9), length(toPixel * vec2(-q.y, q.x)) / r, thin, sweep);
    // the thin sheet inside the inner rim is powder with no grain to see
    for (int j = 0; j < (uInner.y > 0.0 ? 1 : 0); j++) sand *= smoothstep(uInner.x - uInner.w, uInner.x, r);
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
    // the globe's shadow on the ring is cast from one direction in every look and at every height of the lens:
    // that of shadow.json, the one the far look takes (uKShadowL)
    vec3 lit = globeShadow(P, uKShadowL, uPolar);
    // stars do not show through any part of the sheet that holds ice; the globe shows through by the depth
    // itself, at every height of the lens
    float bn = dot(cs, ds) / length(ds);
    float behind = front ? 1.0 - smoothstep(uShadowFit.z, uShadowFit.w, sqrt(max(dot(cs, cs) - bn * bn, 0.0))) : 0.0;
    // at the inner rim the ice counts by its true depth against the sky too
    float true1 = max(behind, 1.0 - smoothstep(uInner.x - uInner.w, uInner.x + uInner.w, r));
    // the model's depth counts uKDeep times (skim.json handover.kept view / model): the depth of the one law of
    // cover. The thin sheet inside the inner rim counts by its own depth alone against the sky and the globe
    // alike (sheetThin: its share of the depth): its cover is 1 - exp(-depth / sine) with the depth of
    // skim.json inner.depth, the depth that shades the globe too (grade.ts dustShade), and a star behind it is
    // dimmed by the depth along its ray and no more
    alpha = 1.0 - exp(-left / mu * mix(uKDeep * mix(uViewFit.w, 1.0, true1), 1.0, sheetThin));
    inside.a = alpha * sheetThin;
    // in front of the lit globe the sheet covers as the kept ring does there, by the one law of cover (keptVeil)
    alpha = max(alpha, keptVeil(r, mu, keptFront(r, keptLit(kAlong, kMiss, kMw), front, bb, bw, max(uKFillet, 1.5 * ringLookPixel(pixel)))) * (1.0 - uOnly));
    vec3 under = mix(uFloor, vec3(1.0), lit) * uShade.z;
    // the sheet and the white sparks of its brightest grains
    col = lum * (seen * law) * (tone + mix(tone, vec3(1.0), uIceOrbit.w) * (sand.y * uIceFit.y));
    // the brightest ice under the ceiling of the grade and the thin zones by the view, as in the far look
    // (grade.ts)
    for (int j = 0; j < (uGrade.x > 0.0 ? 1 : 0); j++) col = iceHeld(col) * iceView(mu, r) * iceZone(r, mu);
    // the thin sheet inside the inner rim: the light of its own ice by the angles of the Sun and of the view
    // alone, with the colour, the saturation and the gain the ring has from afar (uThinFar: the far tint of the
    // dense ice and the far saturation; uThinFar2: the far tint of the thin ice and the far gain), the same in
    // every take of the stop and at every height of the lens
    vec3 own = dustLum * (seen * law) * mix(vec3(1.0), ink.rgb, uThinFar.w * mix(1.0, min(law, 1.0), thin * uViewFit.z)) * tint * mix(uThinFar.rgb, uThinFar2.rgb, thin) * mix(uFloor, vec3(1.0), lit) * uThinFar2.w;
    col = col * under + own;
    inside.rgb = own;
  }
  // the far look gives way to the model's own light where the lens has closed in. The thin sheet inside the
  // inner rim is no part of that handover: it is the model's at every height of the lens and every distance,
  // by the one law of cover alone, so it is taken out of the model's light before the two are weighed and put
  // back whole after it (where the plane holds none of it this is the plain mix)
  col = inside.rgb + mix(col - inside.rgb, farLook.rgb, wfar);
  alpha = inside.a + mix(alpha - inside.a, farLook.a, wfar);
  // the shaded plane lets no star through from the globe on, at every height of the lens
  for (int k = 0; k < ((mine && uOnly < 0.5) ? 1 : 0); k++) alpha = max(alpha, keptShade(r, kAlong, kMiss, kMw, keptEdge(bb, bw)));
  for (int k = 0; k < ((lip && uOnly < 0.5) ? 1 : 0); k++) {
    col = vec3(0.0);
    alpha = keptShade(max(r, uKShadeRamp.y), kAlong, kMiss, kMw, keptEdge(bb, bw));
  }
  vec2 vq = vNdc * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  alpha *= uWeight;
  outColor = diagOut(vec4(col, alpha), texels, 1.0, uLayer, vec2(0.0), length(vRayV) * depth);
  if ((mine == false && (lip == false || alpha <= 0.0)) || (uDiag >= 2 && alpha < 0.5)) discard;
}`

// the brightness of a sheet too deep to see through, inside the rim, where the model was measured: the middle
// value of the knots there, so that a bright line at the rim does not set it
function rimLum(): number {
  const span = model.span as [number, number]
  const light = 1 / model.muSun + 1 / model.muHero
  const found: number[] = []
  for (let i = 0; i < model.knots; i++) {
    const r = span[0] + ((span[1] - span[0]) * (i + 0.5)) / model.knots
    if (r < model.outer - skim.outer.inset * skim.outer.rimReach || r > model.outer - skim.outer.inset) continue
    found.push(model.lum[i]! / (1 - Math.exp(-model.tau[i]! * light)))
  }
  found.sort((a, b) => a - b)
  return found.length > 0 ? found[found.length >> 1]! : 0
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
  // the thin sheet inside the inner rim: skim.json inner.depth is its depth straight through the plane at the rim
  // and at the cloud tops. Its cover, its own light and the shade it casts on the globe all go by that depth
  // itself (its share of the cover takes no uKDeep, main below; grade.ts dustShadeAt)
  private readonly inner = new THREE.Vector4(model.inner, skim.inner.depth[0]!, skim.inner.depth[1]!, skim.inner.fade)
  private readonly inner2 = new THREE.Vector4(skim.inner.ice, model.inner + skim.inner.inset, 1, skim.inner.bands.over)
  private readonly reach = Math.max((model.span as [number, number])[1], skim.outer.end[1]!)
  private readonly bounds = new THREE.Vector2((model.span as [number, number])[0], this.reach)

  private readonly farShadow = new THREE.Vector3(1, 0.2, 0)
  private readonly farPenumbra = new THREE.Vector3().fromArray(keptLook.rings.penumbra)
  private readonly farSolid = new THREE.Vector2(0, keptLook.rings.shadeSolid[0])
  private readonly farMottle = new THREE.Vector4(keptLook.rings.spokes, keptLook.rings.clumps, 0, 0)
  private readonly farGrade = gradeUniforms()

  constructor(field: RingField, ice: Ice, polar: number) {
    const kl = keptLook.rings
    // one triangle over the whole picture (VERT); the plane is drawn from the globe (set) to where the ice
    // past the rim ends (bounds)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    this.uniforms = {
      ...field.uniforms,
      ...ice.uniforms,
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uBounds: { value: this.bounds }, uOnly: { value: 0 }, uThinFar: { value: new THREE.Vector4(skim.light.tint.far.dense[0], skim.light.tint.far.dense[1], skim.light.tint.far.dense[2], skim.light.ringSaturation[0]) },
      uThinFar2: { value: new THREE.Vector4(skim.light.tint.far.thin[0], skim.light.tint.far.thin[1], skim.light.tint.far.thin[2], look.gain[0]! * skim.light.rings[0]!) },
      uGrad: gradUniform, uDiag: diagUniform, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      uFinest: { value: field.finest },
      uShade: { value: new THREE.Vector4(look.view.dense, look.view.thin, look.gain[0], look.unlit) },
      uViewFit: { value: new THREE.Vector4(look.view.clamp[0], look.view.clamp[1], look.grey, look.starCover) },
      uPhase: { value: look.phase.deg.map((deg, k) => new THREE.Vector3(deg, look.phase.dense[k], look.phase.thin[k])) },
      uSat: { value: 1 },
      uTintDense: { value: new THREE.Vector3(1, 1, 1) },
      uTintThin: { value: new THREE.Vector3(1, 1, 1) },
      uFlatten: { value: new THREE.Vector4(1, 0, 0.04, 2) }, uEven: { value: new THREE.Vector3(1, 2, 0.01) },
      uShadowFit: { value: new THREE.Vector4(look.shadow.soft[0], look.shadow.soft[1], look.limb[0], look.limb[1]) },
      uShadowReach: { value: new THREE.Vector3().fromArray(look.shadow.reach) },
      uFloor: { value: new THREE.Vector3().fromArray(look.shadow.floor) },
      uLayer: { value: new THREE.Vector3().fromArray(look.layer) },
      uOuter: { value: this.outer },
      uOuter2: { value: new THREE.Vector4(skim.outer.length[1], skim.outer.end[0], skim.outer.end[1], rimLum()) },
      uOuterInk: { value: this.outerInk },
      uInner: { value: this.inner }, uInner2: { value: this.inner2 }, uInnerBands: { value: new THREE.Vector3(skim.inner.bands.gap, skim.inner.bands.floor, skim.inner.like) },
      uInnerRings: { value: new THREE.Vector4(skim.inner.rings.gap, skim.inner.rings.floor, skim.inner.rings.amount, 0) },
      uInnerWaves: { value: new THREE.Vector4(skim.inner.rings.waves[0], skim.inner.rings.waves[1], skim.inner.rings.waves[2], skim.inner.rings.seed) },
      uInnerFit: { value: new THREE.Vector4(skim.inner.rings.soft, skim.inner.rings.filter, skim.inner.rings.lines, skim.inner.rings.width) },
      uDustAir: { value: new THREE.Vector2(skim.inner.air.depth, skim.inner.air.height) },
      uOuterBands: { value: new THREE.Vector4(skim.outer.bands.gap, skim.outer.bands.soft, skim.outer.bands.width, skim.outer.bands.over) },
      uOuterWaves: { value: new THREE.Vector4(skim.outer.bands.waves[0], skim.outer.bands.waves[1], skim.outer.bands.waves[2], skim.outer.bands.seed) },
      uOuterGaps: { value: new THREE.Vector4(skim.outer.bands.floor, skim.outer.bands.lines, skim.outer.bands.filter, skim.outer.bands.shift) },
      uKEdge: { value: new THREE.Vector2(ringsJson.inner, ringsJson.outer) },
      uKFit: { value: new THREE.Vector4(kl.floorAlpha, kl.floorRamp[0], kl.floorRamp[1], kl.lodBias) },
      uKTone: { value: new THREE.Vector3().fromArray(kl.heroTone) },
      uKFloorHold: { value: new THREE.Vector3().fromArray(kl.floorHold) },
      uKFloorTone: { value: new THREE.Vector4(kl.floorTone[0], kl.floorTone[1], kl.unlit, skim.handover.kept.view) },
      uKAzGain: { value: azimuth.coeffs.flat() }, uKAzRadii: { value: azimuth.radii },
      uKShadowL: { value: this.farShadow }, uKPenumbra: { value: this.farPenumbra }, uKPenumbraFar: { value: new THREE.Vector2().fromArray(kl.penumbraFar) },
      uKSolid: { value: this.farSolid }, uKShadeRamp: { value: new THREE.Vector2().fromArray(kl.shadeRamp) }, uKGraze: { value: new THREE.Vector3().fromArray(kl.graze) }, uKSine: { value: skim.handover.kept.floor }, uKDeep: { value: skim.handover.kept.view / skim.handover.kept.model },
      uKOver: { value: new THREE.Vector4().fromArray(kl.over) },
      uKStrand: { value: new THREE.Vector4(kl.strand[0], kl.strand[1], kl.strand[2], kl.overTone[2]) },
      uKSheetR: { value: kl.sheetRadii }, uKSheetT: { value: kl.sheetThrough }, uKWedgeG: { value: kl.wedgeGain },
      uKSheetGlow: { value: new THREE.Vector4().fromArray(kl.sheetGlow) },
      uKSheetFit: { value: new THREE.Vector4(kl.sheetFit[0], kl.sheetFit[1], kl.wedgeIn[0], kl.wedgeIn[1]) },
      uKMottle: { value: this.farMottle },
      ...this.farGrade,
      uKFillet: { value: kl.fillet[3] },
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

  // near: how near the lens is to the sheet (0 in the hold, 1 in the skim): the ice past the rim shows by it.
  // The thin sheet inside the inner rim is the same at every height (skim.json inner.depth): nothing of it is set
  // here, and its colour is that of the ice just outside the rim in every take (inner2.z is 1 from the start)
  set(near: number): void {
    // the ice past the rim grows out of the rim: its depth and the lengths over which it thins out both come
    // with the nearness (skim.json outer.grow), so no band of it shows away from the rim before the rim has it
    const deep = Math.pow(near, skim.outer.grow.depth)
    const wide = Math.max(Math.pow(near, skim.outer.grow.length), skim.outer.grow.least)
    this.outer.y = skim.outer.depth[0]! * deep
    this.outer.w = skim.outer.depth[1]! * deep
    this.outer.z = skim.outer.length[0]! * wide
    ;(this.uniforms.uOuter2!.value as THREE.Vector4).x = skim.outer.length[1]! * wide
    this.outerInk.y = Math.min(near * skim.outer.inkBy, 1)
    this.bounds.x = skim.inner.end
  }

  // The numbers the kept set gives its rings for this take, for the far look (SHEET_FAR_GLSL; its weight is
  // the field's, field.ts). shadow: the axis of the globe's shadow the kept set draws, soft: how far the
  // shadow's edge is the soft one of the dive, solid: how far the shaded sheet has become solid, spin: the rate
  // of the orbits (radians a second), time: seconds from the middle of the hold, grade and zone: the shares of
  // the grade and of its tone by radius at the height of the lens (grade.ts)
  far(shadow: THREE.Vector3, soft: number, solid: number, spin: number, time: number, grade: number, zone: number): void {
    const kl = keptLook.rings
    this.farShadow.copy(shadow)
    this.farPenumbra.set(THREE.MathUtils.lerp(kl.penumbra[0], kl.penumbraAway[0], soft), THREE.MathUtils.lerp(kl.penumbra[1], kl.penumbraAway[1], soft), THREE.MathUtils.lerp(kl.penumbra[2], kl.penumbraAway[2], soft))
    this.farSolid.x = solid
    this.farMottle.z = spin
    this.farMottle.w = time
    this.farGrade.uGrade.value.x = grade
    this.farGrade.uGradeLow.value.w = zone
  }

  // thin: the plane holds the thin sheet inside the inner rim alone, for a take in which the set of the kept
  // build draws the ring itself (set.ts): the same thin sheet, by the same law, in every take of the stop
  only(thin: boolean): void {
    this.uniforms.uOnly!.value = thin ? 1 : 0
    this.bounds.y = thin ? model.inner : this.reach
  }

  dispose(): void {
    this.geometry.dispose()
    for (const m of this.materials) m.dispose()
  }
}
