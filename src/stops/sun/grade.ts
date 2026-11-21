export const GRADE_GLSL = /* glsl */ `
uniform sampler2D uGrade;
vec3 gradeEncode(vec3 c) {
  return mix(12.92 * c, 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 gradeDecode(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
vec3 grade(vec3 shown, float row) {
  vec3 e = clamp(gradeEncode(shown), 0.0, 1.0) * (255.0 / 256.0) + 0.5 / 256.0;
  float y = (row + 0.5) / 4.0;
  return gradeDecode(vec3(textureLod(uGrade, vec2(e.r, y), 0.0).r, textureLod(uGrade, vec2(e.g, y), 0.0).g, textureLod(uGrade, vec2(e.b, y), 0.0).b));
}`
