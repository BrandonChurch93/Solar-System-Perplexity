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
const [lo, hi] = skimJson.sky.heights as [number, number]

// How much of the grade shows with the lens at this height over the ring plane (planet radii, on either side
// of the plane): none at the upper height of the air of the stop (sky.heights) and above, where every height
// of the hold lies, all at the lower and under, where the whole skim lies; between them by the logarithm of
// the height, eased at both ends.
export const gradeShare = (height: number): number =>
  1 - smooth(Math.log(Math.max(Math.abs(height), 1e-6) / lo) / Math.log(hi / lo))

// uGrade: the share, one over the pivot, the power of the toe, one over the ceiling. uGradeZone: the two radii
// between which the thin zones begin, the share of its colour the ice of the dense ring loses and the share
// the ice of the thin zones loses.
export const gradeUniforms = (): { uGrade: { value: THREE.Vector4 }; uGradeZone: { value: THREE.Vector4 } } => ({
  uGrade: { value: new THREE.Vector4(0, 1 / grade.pivot, grade.toe, 1 / grade.ceiling) },
  uGradeZone: { value: new THREE.Vector4(grade.zone[0], grade.zone[1], grade.grey[0], grade.grey[1]) },
})

// iceHeld: the brightest ice is held under the ceiling, its colour kept. iceGrade: the far look at the radius r
// (planet radii); outward of the dense ring the ice darker than the pivot sinks by a power of its light over
// the pivot, then the ceiling, then the ice loses a share of its colour. Every term is the identity at the
// share 0; the callers skip the call there, so a frame without the grade keeps its bytes.
export const ICE_GRADE_GLSL = /* glsl */ `
uniform vec4 uGrade;
uniform vec4 uGradeZone;
vec3 iceHeld(vec3 c) {
  float high = dot(c, vec3(0.2126, 0.7152, 0.0722)) * uGrade.w;
  return c / sqrt(1.0 + uGrade.x * high * high);
}
vec3 iceGrade(vec3 c, float r) {
  const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
  float zone = smoothstep(uGradeZone.x, uGradeZone.y, r);
  c *= pow(min(max(dot(c, luma), 1e-6) * uGrade.y, 1.0), uGrade.z * uGrade.x * zone);
  c = iceHeld(c);
  return mix(c, vec3(dot(c, luma)), uGrade.x * mix(uGradeZone.z, uGradeZone.w, zone));
}`
