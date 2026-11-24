import * as THREE from 'three'
import { smooth } from '../../director/rig'
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
const [lo, hi] = skimJson.sky.heights as [number, number]

// How much of the grade shows with the lens at this height over the ring plane (planet radii, on either side
// of the plane): none at the upper height of the air of the stop (sky.heights) and above, where every height
// of the hold lies, all at the lower and under, where the whole skim lies; between them by the logarithm of
// the height, eased at both ends.
export const gradeShare = (height: number): number =>
  1 - smooth(Math.log(Math.max(Math.abs(height), 1e-6) / lo) / Math.log(hi / lo))

// The dusk of the globe by the same share (skim.json light.dusk): with the lens high the globe keeps the light
// of the hold; as the lens comes down to the plane its twilight zone narrows and its night side sinks and loses
// its colour, as in the approved close image. Sets uDusk (the two cosines of the Sun's angle between which the
// day ends, how much of that cut shows, the factor on the night floor) and uDuskGrey (the share of its colour
// the night side loses, and the power of the cut that share follows: above one the colour goes later than the
// light, so the last light keeps its brown). The kept set and the model both call it with the height of the
// lens, so the two scenes hold one globe at every height.
export const duskAt = (height: number, into: THREE.Vector4, grey: THREE.Vector2): void => {
  const w = gradeShare(height)
  into.set(dusk.from, dusk.to, THREE.MathUtils.lerp(dusk.amount[0]!, dusk.amount[1]!, w), THREE.MathUtils.lerp(dusk.night[0]!, dusk.night[1]!, w))
  grey.set(THREE.MathUtils.lerp(dusk.grey[0]!, dusk.grey[1]!, w), dusk.greyPower)
}

// The haze round the globe by the same share (skim.json light.halo.day): the two cosines of the Sun's angle
// between which the day light of the haze comes in. With the lens high the haze keeps its own (far: what the
// shell was built with, the look of the hold); as the lens comes down to the plane the glow of the limb draws
// back toward the Sun, so it dies away along the limb well before the terminator, as in the approved close
// image. The kept set and the model both call it with the height of the lens, so the two scenes hold one haze
// at every height.
export const hazeDayAt = (height: number, far: THREE.Vector2, into: THREE.Vector2): void => {
  const w = gradeShare(height)
  into.set(THREE.MathUtils.lerp(far.x, halo.day[0]!, w), THREE.MathUtils.lerp(far.y, halo.day[1]!, w))
}

// The dust in front of the foot of the globe by the same share (skim.json inner.foot): the dust inside the
// inner rim of the rings is a layer with a soft thickness, and with the lens low over the plane the view runs
// a long way through it in front of the foot of the globe, so a soft dark band lies along the foot and the
// dark inner ring runs into the planet, as in the approved close image. With the lens high the view crosses
// the layer steeply and nothing of it shows. Sets uDust: the depth of the dust on the view at the plane, and
// the two heights over the plane (planet radii) between which it ends. The kept set and the model both call
// it with the height of the lens, so the two scenes hold one globe at every height.
export const dustAt = (height: number, into: THREE.Vector4): void => {
  into.set(foot.depth * gradeShare(height), foot.height[0]!, foot.height[1]!, 0)
}

// uGrade: the share, one over the pivot, the power of the toe, one over the ceiling. uGradeZone: the two radii
// between which the thin zones begin, the share of its colour the ice of the dense ring loses and the share
// the ice of the thin zones loses. uGradeView: the factor on the far look of the dense ring, and for the thin
// zones the cosine of the view from which they gain, the power of that gain and the most it gives.
export const gradeUniforms = (): { uGrade: { value: THREE.Vector4 }; uGradeZone: { value: THREE.Vector4 }; uGradeView: { value: THREE.Vector4 }; uGradeRadial: { value: THREE.Vector3[] }; uGradeSpan: { value: THREE.Vector2 }; uGradeLow: { value: THREE.Vector4 }; uGradeLowZone: { value: THREE.Vector2 } } => ({
  uGrade: { value: new THREE.Vector4(0, 1 / grade.pivot, grade.toe, 1 / grade.ceiling) },
  uGradeZone: { value: new THREE.Vector4(grade.zone[0], grade.zone[1], grade.grey[0], grade.grey[1]) },
  uGradeView: { value: new THREE.Vector4(grade.dense, grade.view.cosine, grade.view.power, grade.view.most) },
  uGradeRadial: { value: grade.radial.gain.map((g) => new THREE.Vector3().fromArray(g)) },
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
uniform vec3 uGradeRadial[${grade.radial.gain.length}];
uniform vec2 uGradeSpan;
uniform vec4 uGradeLow;
uniform vec2 uGradeLowZone;
// iceZone: the tone of the rings by radius (skim.json light.grade.radial) and the thin inner ring by the angle
// of the view (light.grade.low; mu: the cosine of the view to the normal of the plane), by the share of the
// grade
vec3 iceZone(float r, float mu) {
  float x = clamp((r - uGradeSpan.x) * uGradeSpan.y, 0.0, ${(grade.radial.gain.length - 1).toFixed(1)});
  int i = int(min(floor(x), ${(grade.radial.gain.length - 2).toFixed(1)}));
  float low = mix(1.0, max(pow(clamp(mu / uGradeLow.x, 0.0, 1.0), uGradeLow.y), uGradeLow.z), 1.0 - smoothstep(uGradeLowZone.x, uGradeLowZone.y, r));
  return mix(vec3(1.0), mix(uGradeRadial[i], uGradeRadial[i + 1], x - float(i)) * low, uGrade.x);
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
