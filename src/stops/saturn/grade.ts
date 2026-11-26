import * as THREE from 'three'
import { smooth } from '../../director/rig'
import model from './ringfield.json'
import skimJson from './skim.json'

// The grade of the rings by the height of the lens over the ring plane (skim.json light.grade). The far look
// of the rings is the tone of the picture of the hold; the near light of the model is fitted to the approved
// close image. With the lens high the rings keep the tone of the hold; as the lens comes down the far look goes
// over to the tone of the near light, so that one ring has one tone near and far, and the brightest ice of both
// is held under one ceiling. The grade is the same in the kept set (kept/rings.ts) and in the model (sheet.ts),
// so the two scenes hold one tone at every height, and it follows the height alone: nothing of it follows the
// clock or the distance from the lens.
const grade = skimJson.light.grade
const dusk = skimJson.light.dusk
const halo = skimJson.light.halo
const foot = skimJson.inner.foot
const tone = skimJson.light.tone
const [lo, hi] = skimJson.sky.heights as [number, number]

// How much of the grade shows with the lens at this height over the ring plane (planet radii, on either side
// of the plane): none at the upper height of the air of the stop (sky.heights) and above, where every height
// of the hold lies, all at the lower and under, where the whole skim lies; between them by the logarithm of
// the height, eased at both ends.
export const gradeShare = (height: number): number =>
  1 - smooth(Math.log(Math.max(Math.abs(height), 1e-6) / lo) / Math.log(hi / lo))

// A share by the height of the lens over the ring plane from knots (heights, planet radii, rising; the share at
// each): straight lines in the logarithm of the height between the knots, the first share under the first
// height and the last over the last.
const byHeight = (heights: number[], shares: number[], height: number): number => {
  const h = Math.max(Math.abs(height), 1e-6)
  const last = heights.length - 1
  if (h <= heights[0]!) return shares[0]!
  if (h >= heights[last]!) return shares[last]!
  let i = 0
  while (i < last - 1 && h >= heights[i + 1]!) i++
  return THREE.MathUtils.lerp(shares[i]!, shares[i + 1]!, Math.log(h / heights[i]!) / Math.log(heights[i + 1]! / heights[i]!))
}

// The one share of the light of the globe by the height of the lens (skim.json light.body). The two approved
// pictures show two terminators: the hero's twilight is broad, the close image's is narrow, its night near
// black and its bands paler. The film keeps both: the globe's own light in the hold, the close image's at the
// skim. Everything of the globe that differs between the two follows this one share and nothing else: the cut
// of the twilight zone and its lean, the floor of the night side, its grey, the colour of the last light, the
// tone of the bands by latitude, the calm of the small features and the day edge of the haze. The share is a
// step in the logarithm of the height over the whole flight: none at the upper height and above, where every
// height of the hold lies, all at the lower and under, where frame 3720 lies; flat at both ends, the same on
// the way down and on the way up. No number of the globe has a window of heights of its own.
//
// The step is given by knots (light.body.heights and share, made by assets-src/saturn/code/body_pace.py) and
// not by a formula, because the level on the screen does not follow the share in a straight line: measured on
// the rise, a place in the twilight at 8 to 16 N makes two fifths of its change in the first sixth of the
// share. The knots lay the share so that on the fastest passage of the lens through these heights, the rise,
// the place of the body that changes fastest changes evenly from frame to frame: the light then changes on the
// body as slowly as the flight allows at every height, and slower on the dive, which passes the same heights
// in more frames.
const body = skimJson.light.body
export const bodyShare = (height: number): number => byHeight(body.heights, body.share, height)

// How much of the tone of the rings by radius and of the thin inner ring by the view (iceZone) shows with the
// lens at this height (skim.json light.grade.by): none at the upper height of the air of the stop and above,
// all at the height of the approved close image and under. That tone is the largest change of the grade (the
// thin inner ring gains several times its light), so it comes in over the whole way down and not over the
// heights of the grade alone, and its knots are set so that the lens passes equal shares of it in equal times
// on the fastest way through these heights (the rise): the pattern of the rings then changes slowly on every
// frame of the dive and of the rise. It follows the height alone.
export const zoneShare = (height: number): number => byHeight(grade.by.heights, grade.by.share, height)


// The dusk of the globe (skim.json light.dusk), by the one share of the globe's light (bodyShare). In the hold
// the boundary of day and night is the one the picture of the hold has; at the skim the twilight zone is cut
// down (the two cosines of the Sun's angle between which the day ends, and how much of that cut shows,
// dusk.amount), the night floor sinks (the factor dusk.night), the night side loses its colour (dusk.grey, and
// the power of the cut that share follows: above one the colour goes later than the light, so the last light
// keeps its brown) and the last light takes the colour factor dusk.tint (the clouds between the cosines
// dusk.tint.from and dusk.tint.to of the Sun's angle take it, whole at the first), as in the approved close
// image. Each number is a pair, hold and skim, with a straight line by the share between: one share for all,
// so no part of the dusk has heights of its own. Sets uDusk (the two cosines, the amount of the cut, the factor
// on the night floor), uDuskGrey and the share in uDuskTint. The kept set and the model both call it with the
// height of the lens, so the two scenes hold one globe at every height.
export const duskAt = (height: number, into: THREE.Vector4, grey: THREE.Vector2, tint: THREE.Vector4): void => {
  const w = bodyShare(height)
  tint.w = w
  // the cut of the twilight slides (dusk.slide): its two cosines go with the share from a pair in the night past
  // the hold's last light to the close image's pair (by one less the power slide.power of what is left of the
  // share), and the cut shows whole from the share slide.whole on, by a straight line under it. The terminator
  // of the hold is a crisp ridge of the globe's own light just past the boundary; with the cut fading in on
  // fixed cosines the ridge and the cut twilight stood side by side at part strength over the whole way, two
  // ends of the day in one place, where the inner edge of the ring crosses them and the lens moves fastest.
  // Now the day ends at one place over most of the way and that place moves off the ridge near the hold
  const way = 1 - Math.pow(1 - w, dusk.slide.power)
  const cut = Math.min(w / dusk.slide.whole, 1)
  into.set(THREE.MathUtils.lerp(dusk.slide.from, dusk.from, way), THREE.MathUtils.lerp(dusk.slide.to, dusk.to, way), THREE.MathUtils.lerp(dusk.amount[0]!, dusk.amount[1]!, cut), THREE.MathUtils.lerp(dusk.night[0]!, dusk.night[1]!, w))
  grey.set(THREE.MathUtils.lerp(dusk.grey[0]!, dusk.grey[1]!, w), dusk.greyPower)
}

// The lean of the boundary of day and night on the globe (skim.json light.dusk.lean): at the skim the boundary
// stands more upright, as in the approved close image, where it lies later by the equator and earlier toward
// the pole. The cosine of the Sun's angle on the clouds gets lean.low more by the equator and falls by
// lean.fall toward the pole between the two sines of the latitude lean.lat, times the one share of the globe's
// light (bodyShare), so none of it in the hold. The kept set and the model both call it with the height of the
// lens.
export const leanAt = (height: number, into: THREE.Vector4): void => {
  const w = bodyShare(height)
  into.set(dusk.lean.low * w, dusk.lean.fall * w, dusk.lean.lat[0]!, dusk.lean.lat[1]!)
}

// The haze round the globe by the one share of the globe's light (skim.json light.halo.day; bodyShare): the
// two cosines of the Sun's angle between which the day light of the haze comes in. With the lens high the haze
// keeps its own (far: what the shell was built with, the look of the hold); as the lens comes down to the
// plane the glow of the limb draws back toward the Sun, so it dies away along the limb well before the
// terminator, as in the approved close image. The kept set and the model both call it with the height of the
// lens, so the two scenes hold one haze at every height.
export const hazeDayAt = (height: number, far: THREE.Vector2, into: THREE.Vector2): void => {
  const w = bodyShare(height)
  into.set(THREE.MathUtils.lerp(far.x, halo.day[0]!, w), THREE.MathUtils.lerp(far.y, halo.day[1]!, w))
}

// The tone of the globe by its latitude, by the one share of the globe's light (skim.json light.tone;
// bodyShare): in the hold the globe keeps the colours of the picture of the hold; at the skim its bands have
// the palette of the approved close image (paler, a grey blue band toward the pole, its own run of cream and
// ochre bands), and the small features of the map stand out less: the map is mixed with itself averaged over
// tone.calm.texels of its texels by tone.calm.amount, and the boost of its small features (look.globe.fine) is
// taken back by tone.calm.fine. The factors stand in a row of texels, one knot each (they are too many for a
// list of uniforms), read texel by texel with a straight line between. Sets uLatFit: the share, one over the
// step of the knots (radians), the share of the averaged map, the texels it is averaged over. The kept set and
// the model both call it with the height of the lens, so the two scenes hold one globe at every height.
const latToneRow = (): THREE.DataTexture => {
  const data = new Float32Array(tone.gain.length * 4)
  tone.gain.forEach((g, i) => data.set([g[0]!, g[1]!, g[2]!, 1], i * 4))
  const row = new THREE.DataTexture(data, tone.gain.length, 1, THREE.RGBAFormat, THREE.FloatType)
  row.minFilter = THREE.NearestFilter
  row.magFilter = THREE.NearestFilter
  row.generateMipmaps = false
  row.needsUpdate = true
  return row
}
export const latToneUniforms = (): { uLatTone: { value: THREE.DataTexture }; uLatFit: { value: THREE.Vector4 }; uLatFirst: { value: number } } => ({
  uLatTone: { value: latToneRow() },
  uLatFit: { value: new THREE.Vector4(0, 180 / (Math.PI * tone.step), 0, tone.calm.texels) },
  uLatFirst: { value: (tone.first * Math.PI) / 180 },
})
export const latToneAt = (height: number, into: THREE.Vector4): void => {
  const w = bodyShare(height)
  into.x = w
  into.z = tone.calm.amount * w
}
// the share of the boost of the small features of the map that is left with the lens at this height
export const fineShare = (height: number): number => 1 - tone.calm.fine * bodyShare(height)

// latTone: the factor on the colour of the globe at the latitude lat (radians, either side of the equator):
// straight lines between the knots of skim.json light.tone.gain, flat outside them, to the power of the share.
export const LAT_TONE_GLSL = /* glsl */ `
uniform sampler2D uLatTone;
uniform vec4 uLatFit;
uniform float uLatFirst;
vec3 latTone(float lat) {
  float q = clamp((abs(lat) - uLatFirst) * uLatFit.y, 0.0, float(${tone.gain.length - 1}));
  float i = min(floor(q), float(${tone.gain.length - 2}));
  return pow(mix(texelFetch(uLatTone, ivec2(int(i), 0), 0).rgb, texelFetch(uLatTone, ivec2(int(i) + 1, 0), 0).rgb, q - i), vec3(uLatFit.x));
}`

// The dust in front of the foot of the globe (skim.json inner.foot): a layer with a soft thickness that the view
// runs a long way through with the lens low over the plane. Its depth is one number at every height of the lens
// (inner.foot.depth), and that number is 0: what lies inside the inner rim is the thin sheet in the plane itself
// (sheet.ts sheetInner), not a layer on the globe. Sets uDust: the depth of the dust on the view at the plane, and the two heights over the plane (planet
// radii) between which it ends. The kept set and the model both call it, so the two scenes hold one globe.
export const dustAt = (into: THREE.Vector4): void => {
  into.set(foot.depth, foot.height[0]!, foot.height[1]!, 0)
}

// The shade of the thin sheet inside the inner rim on the globe (skim.json inner.depth): the matter that stands
// in front of the globe shades it, by the same depth and the same law of cover as on the view's ray (the Sun's
// light is left exp(-tau(r) / |sin e|) of, e the Sun's height over the plane, r where the Sun's ray to the
// clouds crosses the plane). No share and no height of the lens: the shade follows the depth alone. The depth
// is the mean of the sheet's plateaus (inner.bands, sheet.ts sheetBands). Sets uDustShade: that depth at the
// rim and by the globe, the rim, the length inward of the rim from which the sheet ends (inner.join; it ends as
// in sheet.ts sheetInner, over the foot of the ring). The kept set and the model both call it.
export const dustShadeAt = (into: THREE.Vector4): void => {
  const bands = skimJson.inner.bands
  const mean = Math.pow(bands.floor + (1 - bands.floor) * (1 - bands.gap), 3)
  into.set(skimJson.inner.depth[0]! * mean, skimJson.inner.depth[1]! * mean, model.inner, skimJson.inner.join[0]!)
}

// dustShade: the share of the Sun's light that reaches the point P (planet radii, the plane of the rings at
// y 0) through the thin sheet inside the inner rim (the depth of sheet.ts sheetInner); 1 where the Sun's ray to
// P does not cross the plane.
export const DUST_SHADE_GLSL = /* glsl */ `
uniform vec4 uDustShade;
float dustShade(vec3 P, vec3 sun) {
  float t = -P.y / (abs(sun.y) > 1e-4 ? sun.y : 1e-4);
  float rq = length(P.xz + sun.xz * max(t, 0.0));
  float tau = mix(uDustShade.x, uDustShade.y, clamp((uDustShade.z - rq) / (uDustShade.z - 1.0), 0.0, 1.0)) * (1.0 - smoothstep(uDustShade.z - uDustShade.w, uDustShade.z + ${skimJson.inner.join[1]!.toFixed(6)}, rq));
  return t > 0.0 ? exp(-tau / max(abs(sun.y), 0.02)) : 1.0;
}`

// dustAir: the share of the Sun's light that reaches the dust at the point p (planet radii, the globe made round,
// its middle at 0) through the air of the globe, sun the direction of the Sun there. The dust inside the inner
// rim lies in the long twilight of the globe (skim.json inner.air): the air thins by e over the height uDustAir.y
// and has the depth uDustAir.x straight up from the ground, and the Sun's ray to p crosses it on a slant: from p
// outward where the Sun stands over the horizon of p, and past the globe where it stands under it, where the
// ray that touches the ground gets nothing through. The two cases meet where the Sun stands on the horizon,
// so the light has no edge anywhere. (The slant of an air that thins by e: the whole ray past the globe
// crosses sqrt(2 pi x) times the depth straight up at its nearest point, x that point's distance from the
// middle in heights of the air, and the half ray from p outward the share of it that the scaled error
// function gives, taken by its upper bound 2 / (sqrt(pi) (y + sqrt(y y + 4 / pi))).) By the place and the angle
// of the Sun alone. The sheet (sheet.ts) and the dust in front of the foot of the globe (globe.ts) both call it.
export const DUST_AIR_GLSL = /* glsl */ `
uniform vec2 uDustAir;
float dustAirSlant(float x, float c) {
  float y = sqrt(0.5 * x) * c;
  return sqrt(2.0 * x) / (y + sqrt(y * y + 4.0 / 3.14159265));
}
float dustAir(vec3 p, vec3 sun) {
  float r = max(length(p), 1.0);
  float sb = dot(p, sun);
  float own = exp((1.0 - r) / uDustAir.y) * dustAirSlant(r / uDustAir.y, abs(sb) / r);
  float d = sqrt(max(r * r - sb * sb, 1e-6));
  float whole = 2.0 * exp(min((1.0 - d) / uDustAir.y, 30.0)) * sqrt(0.5 * 3.14159265 * d / uDustAir.y);
  return exp(-uDustAir.x * max(sb < 0.0 ? whole - own : own, 0.0));
}`

// uGrade: the share, one over the pivot, the power of the toe, one over the ceiling. uGradeLow: the cosine, the
// power and the least of the thin inner ring by the view, and the share of iceZone (zoneShare; the callers set
// it wherever they set the share of the grade). uGradeZone: the two radii
// between which the thin zones begin, the share of its colour the ice of the dense ring loses and the share
// the ice of the thin zones loses. uGradeView: the factor on the far look of the dense ring, and for the thin
// zones the cosine of the view from which they gain, the power of that gain and the most it gives.
// uGradeRadial: the tone by radius (red, green, blue) and, in its fourth place, the ringlets' amplitude by
// radius (light.grade.radial.fine.gain). uGradeFine: the width of a zone in footprints of the pixel, and the
// least and the most of the light of a pixel over its zone's that counts.
export const gradeUniforms = (): { uGrade: { value: THREE.Vector4 }; uGradeZone: { value: THREE.Vector4 }; uGradeView: { value: THREE.Vector4 }; uGradeRadial: { value: THREE.Vector4[] }; uGradeFine: { value: THREE.Vector3 }; uGradeSpan: { value: THREE.Vector2 }; uGradeLow: { value: THREE.Vector4 }; uGradeLowZone: { value: THREE.Vector2 } } => ({
  uGrade: { value: new THREE.Vector4(0, 1 / grade.pivot, grade.toe, 1 / grade.ceiling) },
  uGradeZone: { value: new THREE.Vector4(grade.zone[0], grade.zone[1], grade.grey[0], grade.grey[1]) },
  uGradeView: { value: new THREE.Vector4(grade.dense, grade.view.cosine, grade.view.power, grade.view.most) },
  uGradeRadial: { value: grade.radial.gain.map((g, i) => new THREE.Vector4(g[0]!, g[1]!, g[2]!, grade.radial.fine.gain[i]!)) },
  uGradeFine: { value: new THREE.Vector3(grade.radial.fine.wide, grade.radial.fine.ratio[0]!, grade.radial.fine.ratio[1]!) },
  uGradeSpan: { value: new THREE.Vector2(grade.radial.first, 1 / grade.radial.step) },
  uGradeLow: { value: new THREE.Vector4(grade.low.cosine, grade.low.power, grade.low.least, 0) },
  uGradeLowZone: { value: new THREE.Vector2().fromArray(grade.low.zone) },
})

// iceHeld: the brightest ice is held under the ceiling, its colour kept. iceGrade: the far look at the radius r
// (planet radii); the dense ring takes its factor, outward of the dense ring the ice darker than the pivot
// sinks by a power of its light over the pivot, then the ceiling, then the ice loses a share of its colour.
// iceView: the factor on the far look and on the near light alike for a view at the cosine mu to the normal of
// the plane: outward of the dense ring the ice seen more steeply than the cosine of the grade keeps its
// brightness toward the lens, as a plane of ice does. Every term is the identity at the share 0; the callers
// skip the call there, so a frame without the grade keeps its bytes.
export const ICE_GRADE_GLSL = /* glsl */ `
uniform vec4 uGrade;
uniform vec4 uGradeZone;
uniform vec4 uGradeView;
uniform vec4 uGradeRadial[${grade.radial.gain.length}];
uniform vec3 uGradeFine;
uniform vec2 uGradeSpan;
uniform vec4 uGradeLow;
uniform vec2 uGradeLowZone;
// iceZone: the tone of the rings by radius (skim.json light.grade.radial) and the thin inner ring by the angle
// of the view (light.grade.low; mu: the cosine of the view to the normal of the plane), by its own share
// (uGradeLow.w): the factor to the power of the share, so equal steps of the share are equal steps of the tone,
// and the factor itself at the share 1
vec3 iceZone(float r, float mu) {
  float x = clamp((r - uGradeSpan.x) * uGradeSpan.y, 0.0, ${(grade.radial.gain.length - 1).toFixed(1)});
  int i = int(min(floor(x), ${(grade.radial.gain.length - 2).toFixed(1)}));
  float low = mix(1.0, max(pow(clamp(mu / uGradeLow.x, 0.0, 1.0), uGradeLow.y), uGradeLow.z), 1.0 - smoothstep(uGradeLowZone.x, uGradeLowZone.y, r));
  vec3 full = mix(uGradeRadial[i].rgb, uGradeRadial[i + 1].rgb, x - float(i)) * low;
  return uGradeLow.w < 1.0 ? pow(full, vec3(uGradeLow.w)) : full;
}
// iceFine: the ringlets' amplitude by radius (skim.json light.grade.radial.fine), a term of the same law by
// radius as the tone and with its share (uGradeLow.w): the tone moves the level of a zone, this the contrast
// of the ringlets inside it, so a zone that the tone makes brighter or darker keeps ringlets one can see.
// Returns the power, less one, on the light of a pixel over the light of its zone (a zone: uGradeFine.x
// footprints of the pixel along the radius): 0 where the amplitude is 1 and at the share 0, so the callers
// skip the work there and a frame without it keeps its bytes. iceRinglets: the factor that power puts on the
// light, from the light of the pixel (fine) and of its zone (wide)
float iceFine(float r) {
  float x = clamp((r - uGradeSpan.x) * uGradeSpan.y, 0.0, ${(grade.radial.gain.length - 1).toFixed(1)});
  int i = int(min(floor(x), ${(grade.radial.gain.length - 2).toFixed(1)}));
  return pow(mix(uGradeRadial[i].a, uGradeRadial[i + 1].a, x - float(i)), uGradeLow.w) - 1.0;
}
float iceRinglets(float fine, float wide, float power) {
  return pow(clamp(fine / max(wide, 1e-6), uGradeFine.y, uGradeFine.z), power);
}
vec3 iceHeld(vec3 c) {
  float high = dot(c, vec3(0.2126, 0.7152, 0.0722)) * uGrade.w;
  return c / sqrt(1.0 + uGrade.x * high * high);
}
float iceView(float mu, float r) {
  return pow(clamp(mu / uGradeView.y, 1.0, uGradeView.w), uGradeView.z * uGrade.x * smoothstep(uGradeZone.x, uGradeZone.y, r));
}
vec3 iceGrade(vec3 c, float r) {
  const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
  float zone = smoothstep(uGradeZone.x, uGradeZone.y, r);
  c *= pow(uGradeView.x, uGrade.x * (1.0 - zone));
  c *= pow(min(max(dot(c, luma), 1e-6) * uGrade.y, 1.0), uGrade.z * uGrade.x * zone);
  c = iceHeld(c);
  return mix(c, vec3(dot(c, luma)), uGrade.x * mix(uGradeZone.z, uGradeZone.w, zone));
}`
