// THE AIR LAW. One law, by the path, at every level and in the set (ruled 2026-11-25): what the eye gets from a point behind air is the
// point times the path's factor plus the air's light times one minus that factor. The sky and the stars are points behind air like the
// ground: they are times the factor of the whole path out of the shell. The eye's height enters through the path and nowhere else: no
// function here takes a height.
//
// A LEAF FILE: it imports nothing. It holds the chunk AIR_LAW_GLSL (GLSL ES 3.00 text: pure functions only, no uniform, no varying, no
// precision line) and its twins in TypeScript under the same names, which take plain numbers and [x, y, z] lists. A globe's shader and
// the set's shader take the chunk word for word.
//
// UNITS. Positions are measured from the planet's centre, in radii of its datum (the datum is the sphere of radius 1). a is the eye, or
// any point of the sight line before the air: the result is the same, and for an eye far out the place where the line enters the shell
// keeps the float's whole precision. b is the point seen. dir is a unit vector, the sight line of a path without an end.
//
// THE THREE NUMBERS, the same on a globe and in a set:
//   light        linear rgb, what a path of endless air shows, in the unit of the point's colour (before any gain; a caller that
//                multiplies its points by a gain multiplies the light by the same). A globe gives its number times its own day term.
//   density      optical depth per radius of level path at the datum. The column straight up from the datum is density * scaleHeight.
//   scaleHeight  radii. The air thins by e for every scaleHeight of height.
//
// THE FUNCTIONS:
//   airLawDepth(a, b, scaleHeight)       the air along the path from a to b: the integral of exp(-height / scaleHeight), a length in radii
//   airLawDepthOut(a, dir, scaleHeight)  the same from a along dir out of the shell
//   airLawFactor(depth, density)         exp(-density * depth): the share of the point that arrives
//   airLaw(point, light, factor)         point * factor + light * (1 - factor), with a floor at black and NO ceiling of its own
//   airLawFactorSeen(depth, seen, density, least)
//                                        for a point whose colour already holds the air of another path (a painted picture seen from
//                                        the picture's eye): factor(depth) / max(factor(seen), least). least 0: the colour is read as
//                                        the point behind the whole air of the path seen, so from the eye of the picture the factor
//                                        is 1 for any numbers and any depth. least 1: the colour holds no air, the plain law.
//                                        Between: the colour holds body * least + light * (1 - least) at the least, so the factor
//                                        never passes 1 / least. Where the present path is the shorter one the factor is over 1 and
//                                        airLaw may leave the range upward; that is the law, and no caller clamps it. The factor
//                                        itself ends at e to the AIR_LAW_MOST, which no picture reaches and no float overflows at.
//
// THE FORM. The air from a point at radius r along a line that leaves the vertical by the cosine c >= 0, out of the shell, is
//   up(r, c) = exp((1 - r) / H) * sqrt(pi) * w * H * erfcx(c * w),   w = sqrt(r / (2 H)) / sqrt(1 - c * c)
// (the height along the line taken to the second order of the length), and a path is a difference of such columns: rising,
// up(a) - up(b); descending, up(b) - up(a) with the cosines turned; with its lowest point inside, twice the level column at the lowest
// point minus the two ends. So a path cut in two adds up to the whole, the two ends may be swapped, and the three cases meet without a
// step. erfcx is a ratio of two polynomials (AIR_LAW_ERFCX): exact in value and slope at 0, exact far out, worst 1.2e-4 of itself.
//
// MEASURED (tests/air-law.test.ts holds every line):
//   against the numerical integral, paths of four kinds (a ground point within the horizon, a point in the air along any direction,
//   a path out of the shell, and the dive's short paths: eye 0.002 to 0.012 radii up, point 1e-4 to 1e-2 radii away, level or
//   shallow), eye from 3 scale heights under the datum to 50 radii, points down to 3 scale heights under the datum, no clamp at the
//   datum: the depth is off by at most airLawError(scaleHeight) = 0.003 + 0.7 * scaleHeight of itself. Worst seen: 0.2 percent up to
//   0.0045, 0.8 at 0.016, 2.7 at 0.05, 6.8 at 0.1.
//   in 32 bit (airLawDepth32 and airLawDepthOut32: the same lines with every step rounded to a float, as the shader computes):
//   against the twin in doubles the depth is off by at most airLawSingle(scaleHeight, depth) = 6e-6 + 4e-7 * depth / scaleHeight
//   radii (the second term is the float's step of a radius over the scale height, as a share of the depth). The dive's short paths
//   at 0.0045: under 2e-6 radii, so a short path is not a difference the float loses.
//   BOUNDS: scaleHeight from 0.0005 to 0.1 radii (AIR_LAW_SCALE_HEIGHT); the twins refuse a number outside. Deeper than 3 scale heights
//   under the datum nothing is measured; deeper than AIR_LAW_DEEP scale heights the height's term is held, so a line through the ball
//   gives a large finite depth and never an inf or a NaN.
//
// THE COST of a call, no loop, no array, no texture: airLawDepth 2 exp, 7 sqrt, 11 divisions for a rising or a descending path and
// 3 exp, 10 sqrt, 15 divisions with the lowest point inside; airLawDepthOut 1 exp, 3 sqrt, 5 divisions rising and 2 exp, 6 sqrt,
// 9 divisions descending; airLawFactor 1 exp; airLawFactorSeen 1 exp, and 1 log where a least is given; airLaw none.

// erfcx(x) for x >= 0 is (1 + a1 x + a2 x^2) / (1 + b1 x + b2 x^2 + b3 x^3). b1 = a1 + 2 / sqrt(pi) gives the slope at 0 and
// b3 = sqrt(pi) * a2 the value far out; a1, a2 and b2 are fitted.
export const AIR_LAW_ERFCX = [0.83822, 0.2756124, 0.83822 + 2 / Math.sqrt(Math.PI), 1.488938, Math.sqrt(Math.PI) * 0.2756124] as const
// The scale heights the law is measured for, in radii.
export const AIR_LAW_SCALE_HEIGHT = [0.0005, 0.1] as const
// How many scale heights under the datum the height's term is held at (against the float's largest number).
export const AIR_LAW_DEEP = 60
// The least of 1 - c * c (a line straight up) and the least radius (a point at the centre).
export const AIR_LAW_LEAST = [1e-12, 1e-6] as const
// The most the exponent of airLawFactorSeen is (the factor ends at e to this, 9.5e19, against the float's largest number).
export const AIR_LAW_MOST = 46
// The worst share the depth is off against the numerical integral, by the scale height.
export const airLawError = (scaleHeight: number): number => 0.003 + 0.7 * scaleHeight
// The worst the depth in 32 bit is off against the twin in doubles, in radii.
export const airLawSingle = (scaleHeight: number, depth: number): number => 6e-6 + (4e-7 * depth) / scaleHeight

const ROOT_PI = Math.sqrt(Math.PI)
const glsl = (v: number): string => {
  const s = String(Number(v.toPrecision(9)))
  return /[.e]/.test(s) ? s : s + '.0'
}
const [A1, A2, B1, B2, B3] = AIR_LAW_ERFCX
const [FLAT, CORE] = AIR_LAW_LEAST

export const AIR_LAW_GLSL = /* glsl */ `
float airLawErfcx(float x) {
  return (1.0 + x * (${glsl(A1)} + ${glsl(A2)} * x)) / (1.0 + x * (${glsl(B1)} + x * (${glsl(B2)} + ${glsl(B3)} * x)));
}
float airLawUp(float r, float c, float h) {
  float w = sqrt(0.5 * r / h) / sqrt(max(1.0 - c * c, ${glsl(FLAT)}));
  return exp(min((1.0 - r) / h, ${glsl(AIR_LAW_DEEP)})) * ${glsl(ROOT_PI)} * w * h * airLawErfcx(c * w);
}
float airLawDepth(vec3 a, vec3 b, float scaleHeight) {
  vec3 d = b - a;
  float len = length(d);
  if (len <= 0.0) return 0.0;
  d /= len;
  float ra = max(length(a), ${glsl(CORE)});
  float rb = max(length(b), ${glsl(CORE)});
  float ca = dot(d, a) / ra;
  float cb = dot(d, b) / rb;
  if (ca >= 0.0) return max(airLawUp(ra, ca, scaleHeight) - airLawUp(rb, cb, scaleHeight), 0.0);
  if (cb <= 0.0) return max(airLawUp(rb, -cb, scaleHeight) - airLawUp(ra, -ca, scaleHeight), 0.0);
  vec3 n = ra < rb ? a : b;
  float low = length(n - d * dot(d, n));
  return max(2.0 * airLawUp(low, 0.0, scaleHeight) - airLawUp(ra, -ca, scaleHeight) - airLawUp(rb, cb, scaleHeight), 0.0);
}
float airLawDepthOut(vec3 a, vec3 dir, float scaleHeight) {
  float ra = max(length(a), ${glsl(CORE)});
  float ca = dot(dir, a) / ra;
  if (ca >= 0.0) return airLawUp(ra, ca, scaleHeight);
  float low = length(a - dir * dot(dir, a));
  return max(2.0 * airLawUp(low, 0.0, scaleHeight) - airLawUp(ra, -ca, scaleHeight), 0.0);
}
float airLawFactor(float depth, float density) {
  return exp(-density * depth);
}
float airLawFactorSeen(float depth, float seen, float density, float least) {
  float held = density * seen;
  if (least > 0.0) held = min(held, -log(least));
  return exp(min(held - density * depth, ${glsl(AIR_LAW_MOST)}));
}
vec3 airLaw(vec3 point, vec3 light, float factor) {
  return max(point * factor + light * (1.0 - factor), vec3(0.0));
}`

export type AirVec = readonly [number, number, number]
type Round = (v: number) => number

const whole: Round = (v) => v
const single: Round = Math.fround

function measured(scaleHeight: number): void {
  if (!(scaleHeight >= AIR_LAW_SCALE_HEIGHT[0] && scaleHeight <= AIR_LAW_SCALE_HEIGHT[1])) throw new RangeError('the air law is measured for a scale height of ' + AIR_LAW_SCALE_HEIGHT[0] + ' to ' + AIR_LAW_SCALE_HEIGHT[1] + ' radii, not ' + scaleHeight)
}

// The same lines as the chunk, one for one. R rounds every step: not at all for the twin in doubles, to a float for the twin in 32 bit.
function dot3(a: AirVec, b: AirVec, R: Round): number {
  return R(R(R(a[0] * b[0]) + R(a[1] * b[1])) + R(a[2] * b[2]))
}

function len3(a: AirVec, R: Round): number {
  return R(Math.sqrt(dot3(a, a, R)))
}

function erfcx(x: number, R: Round): number {
  const top = R(1 + R(x * R(R(A1) + R(R(A2) * x))))
  const bottom = R(1 + R(x * R(R(B1) + R(x * R(R(B2) + R(R(B3) * x))))))
  return R(top / bottom)
}

function up(r: number, c: number, h: number, R: Round): number {
  const w = R(R(Math.sqrt(R(R(0.5 * r) / h))) / R(Math.sqrt(Math.max(R(1 - R(c * c)), R(FLAT)))))
  const e = R(Math.exp(Math.min(R(R(1 - r) / h), AIR_LAW_DEEP)))
  return R(R(R(R(e * R(ROOT_PI)) * w) * h) * erfcx(R(c * w), R))
}

function lowest(n: AirVec, d: AirVec, R: Round): number {
  const t = dot3(d, n, R)
  return len3([R(n[0] - R(d[0] * t)), R(n[1] - R(d[1] * t)), R(n[2] - R(d[2] * t))], R)
}

function pathDepth(a0: AirVec, b0: AirVec, h0: number, R: Round): number {
  const a: AirVec = [R(a0[0]), R(a0[1]), R(a0[2])]
  const b: AirVec = [R(b0[0]), R(b0[1]), R(b0[2])]
  const h = R(h0)
  const span: AirVec = [R(b[0] - a[0]), R(b[1] - a[1]), R(b[2] - a[2])]
  const len = len3(span, R)
  if (!(len > 0)) return 0
  const d: AirVec = [R(span[0] / len), R(span[1] / len), R(span[2] / len)]
  const ra = Math.max(len3(a, R), R(CORE))
  const rb = Math.max(len3(b, R), R(CORE))
  const ca = R(dot3(d, a, R) / ra)
  const cb = R(dot3(d, b, R) / rb)
  if (ca >= 0) return Math.max(R(up(ra, ca, h, R) - up(rb, cb, h, R)), 0)
  if (cb <= 0) return Math.max(R(up(rb, -cb, h, R) - up(ra, -ca, h, R)), 0)
  const low = lowest(ra < rb ? a : b, d, R)
  return Math.max(R(R(R(2 * up(low, 0, h, R)) - up(ra, -ca, h, R)) - up(rb, cb, h, R)), 0)
}

function pathOut(a0: AirVec, dir0: AirVec, h0: number, R: Round): number {
  const a: AirVec = [R(a0[0]), R(a0[1]), R(a0[2])]
  const dir: AirVec = [R(dir0[0]), R(dir0[1]), R(dir0[2])]
  const h = R(h0)
  const ra = Math.max(len3(a, R), R(CORE))
  const ca = R(dot3(dir, a, R) / ra)
  if (ca >= 0) return up(ra, ca, h, R)
  const low = lowest(a, dir, R)
  return Math.max(R(R(2 * up(low, 0, h, R)) - up(ra, -ca, h, R)), 0)
}

// The air along the path from a to b, a length in radii. a and b from the planet's centre, in radii.
export function airLawDepth(a: AirVec, b: AirVec, scaleHeight: number): number {
  measured(scaleHeight)
  return pathDepth(a, b, scaleHeight, whole)
}

// The air from a along the unit vector dir out of the shell, a length in radii.
export function airLawDepthOut(a: AirVec, dir: AirVec, scaleHeight: number): number {
  measured(scaleHeight)
  return pathOut(a, dir, scaleHeight, whole)
}

// The two depths with every step rounded to a float, as the shader computes them.
export function airLawDepth32(a: AirVec, b: AirVec, scaleHeight: number): number {
  measured(scaleHeight)
  return pathDepth(a, b, scaleHeight, single)
}

export function airLawDepthOut32(a: AirVec, dir: AirVec, scaleHeight: number): number {
  measured(scaleHeight)
  return pathOut(a, dir, scaleHeight, single)
}

// The share of a point that arrives through a depth of air.
export function airLawFactor(depth: number, density: number): number {
  return Math.exp(-density * depth)
}

// The factor for a point whose colour already holds the air of the path seen (see the head of the file).
export function airLawFactorSeen(depth: number, seen: number, density: number, least: number): number {
  const held = least > 0 ? Math.min(density * seen, -Math.log(least)) : density * seen
  return Math.exp(Math.min(held - density * depth, AIR_LAW_MOST))
}

// The law: the point times the factor plus the light times one minus the factor. A floor at black, no ceiling.
export function airLaw(point: AirVec, light: AirVec, factor: number): [number, number, number] {
  return [Math.max(point[0] * factor + light[0] * (1 - factor), 0), Math.max(point[1] * factor + light[1] * (1 - factor), 0), Math.max(point[2] * factor + light[2] * (1 - factor), 0)]
}
