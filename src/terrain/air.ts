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
//
// THE LIGHT BY HEIGHT, a second chunk: AIR_LAW_KNOTS_GLSL stands after the first and uses its airLawUp. A shader whose air has one
// light at every height takes the first chunk alone, and nothing above changes with the second. The air's light may fall with the
// height (a canyon's air lies in its walls' shadow): three knots, heights in radii over the datum, rising, and at each the share of
// the light that the air shows there. Straight lines between the knots; the lowest share is held under the lowest knot and the
// highest over the highest. The knots are heights of the air, never of the eye: the eye's height still enters through the path.
//   airLawShare(r, heights, shares)      the share of the light at the radius r
//   airLawGather(a, b, scaleHeight, density, heights, shares)
//                                        what the path from a to b gathers of the light, as a share of it: the sum along the path of
//                                        the share at each stretch's height times what the stretch takes from the factor. With every
//                                        share at 1 it is one minus the factor of the path.
//   airLawGatherOut(a, dir, scaleHeight, density, heights, shares)
//                                        the same from a along dir, to AIR_LAW_TOP scale heights over the datum or the highest knot
//   the law with it                      point * airLawFactor(depth, density) + light * gathered, for a point that holds no air (a
//                                        globe's ground, the sky and the stars)
//   airLawHeld(gathered, seen, density, least)
//                                        what a colour that already holds the air of the path seen holds of the light gathered
//                                        along that path: all of it, or with a least the part the least leaves (the colour holds
//                                        body * least + light * gathered * (1 - least) / (1 - factor seen) where the factor seen
//                                        is under the least)
//   airLawSeen(point, light, factor, gathered, held)
//                                        the law for such a colour: point * factor + light * (gathered - factor * held), with the
//                                        factor of airLawFactorSeen, gathered along the present path and held from the path seen.
//                                        From the eye of the picture the picture comes back for any numbers and any knots. A floor
//                                        at black and no ceiling of its own, like airLaw.
// ITS FORM. The line is cut where it crosses the three spheres of the knots: 12 places, the start, six crossings, four middles and
// the end. The depth of each piece is a difference of the columns above. Over the highest knot and under the lowest the share is
// one number. In a piece between two knots the share is read as a parabola along the piece through its two ends and its middle,
// and what the piece takes from the factor as an exponential along it, whose rate is read from what its two halves take.
// MEASURED (tests/air-law-knots.test.ts holds every line): against the numerical integral what a path gathers is off by at most
// airLawGatherError(scaleHeight, heights, shares) = 0.003 + 0.2 * scaleHeight + 0.03 * (the step of the share across a piece) * (the
// piece's height in scale heights), as a share of the light. Worst seen with a canyon of three knots 0.001 radii apart and the
// shares 0.3, 0.6, 1: 0.17 percent of the light at scale height 0.0045, 0.34 at 0.02, 0.87 at 0.001, 1.76 at 0.1 and 1.85 at 0.0005;
// with the shares 0.2 and 1 two scale heights apart 3.8 percent. So knots stand no further apart than a scale height where a
// percent of the light counts. There is no step where an end of the path, the eye or the lowest point of the line crosses the
// sphere of a knot. The gather has no twin in 32 bit: the shader is held against the twin in doubles in a WebGL2 browser
// (tests/air-law-gl.test.ts).
// ITS COST. A gather is one loop of the fixed count 12 and three local arrays of 12 floats, no texture: 13 columns, 12 exp for the
// factors, 4 log and up to 4 exp for the rates, in all about 29 exp, 43 sqrt and 110 divisions. A painted layer takes two gathers
// at each vertex of its mesh (airLawPathShare along the present path and along the picture's) and at each fragment its two depths
// alone; the sky takes one gather beside its depth at each fragment. MEASURED on the five judged frames of Mars at the final tier:
// the share at the vertices against the gathers at every fragment moves no channel of no pixel by more than 1 step of 255.

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
// The least step between two knots of the light by height, in radii (the divisor's floor).
export const AIR_LAW_KNOT_STEP = 1e-7
// A section between two knots: under this share of its first half's part its second half's part is not read (the float has lost
// it) and the section's own optical depth stands for the rate; and the most the rate is.
export const AIR_LAW_KNOT_HALF = 1e-4
export const AIR_LAW_KNOT_RATE = 60
// How many scale heights over the datum (or over the highest knot) a path out of the shell is gathered to.
export const AIR_LAW_TOP = 40
// The worst share the depth is off against the numerical integral, by the scale height.
export const airLawError = (scaleHeight: number): number => 0.003 + 0.7 * scaleHeight
// The worst the depth in 32 bit is off against the twin in doubles, in radii.
export const airLawSingle = (scaleHeight: number, depth: number): number => 6e-6 + (4e-7 * depth) / scaleHeight
// The light a path gathers with knots is off against the numerical integral by at most this share of the air's light: the depth's
// own error, and what a piece between two knots adds, which grows with the piece's height in scale heights and with the step of the
// share across it.
export const airLawGatherError = (scaleHeight: number, heights: readonly [number, number, number], shares: readonly [number, number, number]): number =>
  0.003 + 0.2 * scaleHeight + (0.03 * Math.max(Math.abs(shares[1] - shares[0]) * (heights[1] - heights[0]), Math.abs(shares[2] - shares[1]) * (heights[2] - heights[1]))) / scaleHeight

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

// THE LIGHT BY HEIGHT, a second chunk for whoever gives the air's light knots: it stands after AIR_LAW_GLSL and uses its airLawUp.
// A shader without knots takes the first chunk alone and holds no word of this one.
export const AIR_LAW_KNOTS_GLSL = /* glsl */ `
float airLawShare(float r, vec3 heights, vec3 shares) {
  float h = r - 1.0;
  float under = mix(shares.x, shares.y, clamp((h - heights.x) / max(heights.y - heights.x, ${glsl(AIR_LAW_KNOT_STEP)}), 0.0, 1.0));
  float over = mix(shares.y, shares.z, clamp((h - heights.y) / max(heights.z - heights.y, ${glsl(AIR_LAW_KNOT_STEP)}), 0.0, 1.0));
  return h < heights.y ? under : over;
}
float airLawMean(vec3 t, vec3 k, float thick) {
  float a = t.x - t.y;
  float b = t.y - t.z;
  float y = clamp(b > ${glsl(AIR_LAW_KNOT_HALF)} * a ? 2.0 * log(max(a, 1e-30) / b) : thick, -${glsl(AIR_LAW_KNOT_RATE)}, ${glsl(AIR_LAW_KNOT_RATE)});
  float one = 0.5 + y * (y * y / 720.0 - 1.0 / 12.0);
  float two = 1.0 / 3.0 + y * (y * (1.0 / 360.0 + y / 720.0) - 1.0 / 12.0);
  if (abs(y) >= 0.5) {
    float e = 1.0 / (exp(y) - 1.0);
    one = 1.0 / y - e;
    two = 2.0 / (y * y) - (1.0 + 2.0 / y) * e;
  }
  return clamp(k.x + one * (4.0 * k.y - 3.0 * k.x - k.z) + two * (2.0 * k.x - 4.0 * k.y + 2.0 * k.z), min(k.x, min(k.y, k.z)), max(k.x, max(k.y, k.z)));
}
float airLawGatherLine(float low, float start, float end, float scaleHeight, float density, vec3 heights, vec3 shares) {
  vec3 reach = sqrt(max((1.0 + heights - low) * (1.0 + heights + low), 0.0));
  float level = 2.0 * airLawUp(low, 0.0, scaleHeight);
  float x[12];
  x[0] = start;
  x[1] = clamp(-reach.z, start, end);
  x[3] = clamp(-reach.y, start, end);
  x[5] = clamp(-reach.x, start, end);
  x[6] = clamp(reach.x, start, end);
  x[8] = clamp(reach.y, start, end);
  x[10] = clamp(reach.z, start, end);
  x[11] = end;
  x[2] = 0.5 * (x[1] + x[3]);
  x[4] = 0.5 * (x[3] + x[5]);
  x[7] = 0.5 * (x[6] + x[8]);
  x[9] = 0.5 * (x[8] + x[10]);
  float t[12];
  float k[12];
  float o[12];
  float before = 0.0;
  float last = start;
  float depth = 0.0;
  for (int i = 0; i < 12; i++) {
    float r = sqrt(low * low + x[i] * x[i]);
    float u = airLawUp(r, abs(x[i]) / r, scaleHeight);
    if (i > 0) depth += max(x[i] > 0.0 ? (last > 0.0 ? before - u : level - before - u) : u - before, 0.0);
    before = u;
    last = x[i];
    o[i] = density * depth;
    t[i] = exp(-o[i]);
    k[i] = airLawShare(r, heights, shares);
  }
  return shares.z * (t[0] - t[1]) + airLawMean(vec3(t[1], t[2], t[3]), vec3(k[1], k[2], k[3]), o[3] - o[1]) * (t[1] - t[3]) + airLawMean(vec3(t[3], t[4], t[5]), vec3(k[3], k[4], k[5]), o[5] - o[3]) * (t[3] - t[5]) + shares.x * (t[5] - t[6]) + airLawMean(vec3(t[6], t[7], t[8]), vec3(k[6], k[7], k[8]), o[8] - o[6]) * (t[6] - t[8]) + airLawMean(vec3(t[8], t[9], t[10]), vec3(k[8], k[9], k[10]), o[10] - o[8]) * (t[8] - t[10]) + shares.z * (t[10] - t[11]);
}
float airLawGather(vec3 a, vec3 b, float scaleHeight, float density, vec3 heights, vec3 shares) {
  vec3 d = b - a;
  float len = length(d);
  if (len <= 0.0) return 0.0;
  d /= len;
  vec3 n = dot(a, a) < dot(b, b) ? a : b;
  float start = dot(d, a);
  return airLawGatherLine(max(length(n - d * dot(d, n)), ${glsl(CORE)}), start, max(dot(d, b), start), scaleHeight, density, heights, shares);
}
float airLawGatherOut(vec3 a, vec3 dir, float scaleHeight, float density, vec3 heights, vec3 shares) {
  float start = dot(dir, a);
  float low = max(length(a - dir * start), ${glsl(CORE)});
  float top = 1.0 + max(heights.z, 0.0) + ${glsl(AIR_LAW_TOP)} * scaleHeight;
  return airLawGatherLine(low, start, max(sqrt(max((top - low) * (top + low), 0.0)), start), scaleHeight, density, heights, shares);
}
float airLawPathShare(vec3 a, vec3 b, float scaleHeight, float density, vec3 heights, vec3 shares) {
  float took = 1.0 - airLawFactor(airLawDepth(a, b, scaleHeight), density);
  return clamp(airLawGather(a, b, scaleHeight, density, heights, shares) / max(took, 1e-30), min(shares.x, min(shares.y, shares.z)), max(shares.x, max(shares.y, shares.z)));
}
float airLawHeld(float gathered, float seen, float density, float least) {
  if (least > 0.0) gathered *= min((1.0 - least) / max(1.0 - exp(-density * seen), 1e-30), 1.0);
  return gathered;
}
vec3 airLawSeen(vec3 point, vec3 light, float factor, float gathered, float held) {
  return max(point * factor + light * (gathered - factor * held), vec3(0.0));
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

// THE LIGHT BY HEIGHT. Three knots: heights in radii over the datum, rising, and the share of the air's light at each. Straight lines
// between the knots, held under the lowest and over the highest.
export type AirKnots = readonly [number, number, number]

const unit = (v: number): number => Math.min(Math.max(v, 0), 1)

// The share of the air's light at the radius r.
export function airLawShare(r: number, heights: AirKnots, shares: AirKnots): number {
  const h = r - 1
  const under = shares[0] + (shares[1] - shares[0]) * unit((h - heights[0]) / Math.max(heights[1] - heights[0], AIR_LAW_KNOT_STEP))
  const over = shares[1] + (shares[2] - shares[1]) * unit((h - heights[1]) / Math.max(heights[2] - heights[1], AIR_LAW_KNOT_STEP))
  return h < heights[1] ? under : over
}

// The mean share of a section between two knots. The share is read as a parabola along the section through its two ends and its
// middle, and what the section takes from the factor as an exponential along it, whose rate is read from what its two halves take
// (thick: the section's optical depth, which stands for the rate where the second half's part is lost). Without a rate this is
// Simpson's rule. Held between the three shares.
function meanShare(t: AirKnots, k: AirKnots, thick: number): number {
  const a = t[0] - t[1]
  const b = t[1] - t[2]
  const y = Math.min(Math.max(b > AIR_LAW_KNOT_HALF * a ? 2 * Math.log(Math.max(a, 1e-30) / b) : thick, -AIR_LAW_KNOT_RATE), AIR_LAW_KNOT_RATE)
  let one = 0.5 + y * ((y * y) / 720 - 1 / 12)
  let two = 1 / 3 + y * (y * (1 / 360 + y / 720) - 1 / 12)
  if (Math.abs(y) >= 0.5) {
    const e = 1 / (Math.exp(y) - 1)
    one = 1 / y - e
    two = 2 / (y * y) - (1 + 2 / y) * e
  }
  const mean = k[0] + one * (4 * k[1] - 3 * k[0] - k[2]) + two * (2 * k[0] - 4 * k[1] + 2 * k[2])
  return Math.min(Math.max(mean, Math.min(k[0], k[1], k[2])), Math.max(k[0], k[1], k[2]))
}

function gatherLine(low: number, start: number, end: number, h: number, density: number, heights: AirKnots, shares: AirKnots): number {
  const reach = heights.map((v) => Math.sqrt(Math.max((1 + v - low) * (1 + v + low), 0)))
  const level = 2 * up(low, 0, h, whole)
  const cut = (v: number): number => Math.min(Math.max(v, start), end)
  const x: number[] = new Array<number>(12).fill(0)
  x[0] = start
  x[1] = cut(-reach[2]!)
  x[3] = cut(-reach[1]!)
  x[5] = cut(-reach[0]!)
  x[6] = cut(reach[0]!)
  x[8] = cut(reach[1]!)
  x[10] = cut(reach[2]!)
  x[11] = end
  x[2] = 0.5 * (x[1]! + x[3]!)
  x[4] = 0.5 * (x[3]! + x[5]!)
  x[7] = 0.5 * (x[6]! + x[8]!)
  x[9] = 0.5 * (x[8]! + x[10]!)
  const t: number[] = []
  const k: number[] = []
  const o: number[] = []
  let before = 0
  let last = start
  let depth = 0
  for (let i = 0; i < 12; i++) {
    const r = Math.sqrt(low * low + x[i]! * x[i]!)
    const u = up(r, Math.abs(x[i]!) / r, h, whole)
    if (i > 0) depth += Math.max(x[i]! > 0 ? (last > 0 ? before - u : level - before - u) : u - before, 0)
    before = u
    last = x[i]!
    o.push(density * depth)
    t.push(Math.exp(-o[i]!))
    k.push(airLawShare(r, heights, shares))
  }
  const part = (i: number): number => meanShare([t[i]!, t[i + 1]!, t[i + 2]!], [k[i]!, k[i + 1]!, k[i + 2]!], o[i + 2]! - o[i]!) * (t[i]! - t[i + 2]!)
  return shares[2] * (t[0]! - t[1]!) + part(1) + part(3) + shares[0] * (t[5]! - t[6]!) + part(6) + part(8) + shares[2] * (t[10]! - t[11]!)
}

// What the path from a to b gathers of the air's light, as a share of it, where each stretch of air shines with the share of its own
// height. With the three shares at 1 this is one minus the factor of the path.
export function airLawGather(a: AirVec, b: AirVec, scaleHeight: number, density: number, heights: AirKnots, shares: AirKnots): number {
  measured(scaleHeight)
  const span: AirVec = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = len3(span, whole)
  if (!(len > 0)) return 0
  const d: AirVec = [span[0] / len, span[1] / len, span[2] / len]
  const n = dot3(a, a, whole) < dot3(b, b, whole) ? a : b
  const start = dot3(d, a, whole)
  return gatherLine(Math.max(lowest(n, d, whole), CORE), start, Math.max(dot3(d, b, whole), start), scaleHeight, density, heights, shares)
}

// The same from a along the unit vector dir out of the shell.
export function airLawGatherOut(a: AirVec, dir: AirVec, scaleHeight: number, density: number, heights: AirKnots, shares: AirKnots): number {
  measured(scaleHeight)
  const start = dot3(dir, a, whole)
  const low = Math.max(lowest(a, dir, whole), CORE)
  const top = 1 + Math.max(heights[2], 0) + AIR_LAW_TOP * scaleHeight
  return gatherLine(low, start, Math.max(Math.sqrt(Math.max((top - low) * (top + low), 0)), start), scaleHeight, density, heights, shares)
}

// The share of the light along the path from a to b: what the path gathers over what it takes from the factor, a number between the
// lowest and the highest share. With every share alike it is that share. It changes slowly from one point of the ground to the
// next where one minus the factor does not, so a mesh may take it at its vertices and the factor at every fragment (see ITS COST).
export function airLawPathShare(a: AirVec, b: AirVec, scaleHeight: number, density: number, heights: AirKnots, shares: AirKnots): number {
  const took = 1 - airLawFactor(airLawDepth(a, b, scaleHeight), density)
  return Math.min(Math.max(airLawGather(a, b, scaleHeight, density, heights, shares) / Math.max(took, 1e-30), Math.min(shares[0], shares[1], shares[2])), Math.max(shares[0], shares[1], shares[2]))
}

// What a colour that already holds the air of the path seen holds of the light gathered along it: all of it, or with a least the
// share of it that the least leaves (the colour holds body * least + light * mean share * (1 - least) at the least).
export function airLawHeld(gathered: number, seen: number, density: number, least: number): number {
  return least > 0 ? gathered * Math.min((1 - least) / Math.max(1 - Math.exp(-density * seen), 1e-30), 1) : gathered
}

// The law for such a colour with the light by height: the colour times the factor of airLawFactorSeen plus the light times what the
// present path gathers less the factor times what the colour holds. A floor at black, no ceiling.
export function airLawSeen(point: AirVec, light: AirVec, factor: number, gathered: number, held: number): [number, number, number] {
  const more = gathered - factor * held
  return [Math.max(point[0] * factor + light[0] * more, 0), Math.max(point[1] * factor + light[1] * more, 0), Math.max(point[2] * factor + light[2] * more, 0)]
}
