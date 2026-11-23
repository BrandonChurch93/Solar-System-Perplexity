import * as THREE from 'three'
import ice from './ice.json'

const WAKES = ice.wakes.cell.length
const SPOKES = ice.spokes.at.length
const STONES = ice.stones.cell.length
const GRAINS = ice.grain.layers.length

// The ice of the sheet that can be seen piece by piece. Needs RING_FIELD_GLSL. Everything lies on rows in radius
// that each turn at the orbital rate of their radius. Stones are balls of ice lit by the Sun, from grains the
// size of a pixel to blocks: the ones that rest on the sheet stand half out of it, packed closely, and the large
// ones throw a shadow on it; the others float on levels above it, pass in front of it with parallax and throw
// their shadows down on it. Wakes are long soft patches of the sheet, darker or brighter. Spokes are soft radial
// smudges on the dense ring that turn with the globe.
export const ICE_GLSL = /* glsl */ `
uniform vec4 uIceOrbit;
uniform vec4 uIceFit;
uniform vec4 uIceFit2;
uniform vec4 uIceCell[${WAKES}];
uniform vec4 uIceShape[${WAKES}];
uniform vec4 uIceTone[${WAKES}];
uniform vec4 uSpokeFit;
uniform vec4 uSpoke[${SPOKES}];
uniform vec4 uStoneFit;
uniform vec4 uStoneLit;
uniform vec4 uStoneLook;
uniform vec4 uStoneFar;
uniform vec4 uStoneRim;
uniform vec3 uStoneTint;
uniform vec4 uStoneCell[${STONES}];
uniform vec4 uStoneSize[${STONES}];
uniform vec4 uStoneKind[${STONES}];
uniform vec4 uStoneForm[${STONES}];
uniform vec4 uStoneFacet;
uniform vec4 uStoneGlow;
uniform vec4 uGrainFit;
uniform vec4 uGrainSpark;
uniform vec4 uGrain[${GRAINS}];
// the six axes through the corners of an icosahedron: a block of ice has a pair of faces square to each
const vec3 ICE_AXIS[6] = vec3[6](vec3(0.0, 0.5257311, 0.8506508), vec3(0.0, -0.5257311, 0.8506508), vec3(0.5257311, 0.8506508, 0.0), vec3(-0.5257311, 0.8506508, 0.0), vec3(0.8506508, 0.0, 0.5257311), vec3(0.8506508, 0.0, -0.5257311));
// How far the orbit of radius rc has turned, in full circles: Kepler's third law, counted from the orbit that
// keeps pace with the globe.
float iceTurn(float rc) {
  float s = uIceOrbit.y / rc;
  return uIceOrbit.x * s * sqrt(s);
}
// One row of the sand: a smooth random value along the orbit of the row. cr and ct are the sizes of a cell
// across and along the orbit.
float iceGrainRow(float row, float cr, float ct, float turn, uint seed) {
  float rc = (row + 0.5) * cr;
  uint hr = ringPcg(uint(int(row)) + seed);
  float n = max(floor(6.2831853 * rc / ct), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  float f = smoothstep(uGrainFit.z, 1.0 - uGrainFit.z, x - col);
  float next = col + 1.0 < n ? col + 1.0 : 0.0;
  uint hc = ringPcg(hr + 17u);
  return mix(ringUnit(ringPcg(uint(int(col)) + hc)), ringUnit(ringPcg(uint(int(next)) + hc)), f);
}
// The sand of the sheet at radius r (turn its azimuth over a full circle). The sand has grains of many sizes,
// each size a field of smooth noise that lies in the sheet with every row on its own orbit; a size is a pair,
// across and along the orbit, of doublings of the finest. What shows at a point is the sand whose grains are
// the given number of pixels across and along there (pxR and pxT are the pixels of one radius in the two
// directions), blended between the sizes next to that; where the sheet is so far that the coarsest sand is
// finer than that, the sand merges into the sheet. Returns how far the sand moves the logarithm of the
// brightness (x) and the white sparks of its brightest grains (y).
vec2 iceGrain(float r, float turn, float pxR, float pxT, float thin) {
  vec2 sum = vec2(0.0);
  for (int g = 0; g < ${GRAINS}; g++) {
    vec2 want = log2(uGrain[g].x / (uGrainFit.x * vec2(pxR, pxT)));
    vec2 at = clamp(want, 0.0, uGrainFit.y);
    vec2 lo = floor(at);
    vec2 f = at - lo;
    float seen = 1.0 - smoothstep(0.0, 1.0, max(want.x, want.y) - uGrainFit.y);
    float level = 0.0;
    float norm = 0.0;
    float spark = 0.0;
    for (int k = 0; k < (seen > 0.0 ? 4 : 0); k++) {
      vec2 pick = vec2(float(k & 1), float(k >> 1));
      vec2 share = mix(1.0 - f, f, pick);
      float w = share.x * share.y;
      vec2 size = uGrainFit.x * exp2(lo + pick);
      uint seed = ringPcg(uint(int(lo.x + pick.x) * 16 + int(lo.y + pick.y)) + uint(g) * 977u + 7001u);
      float u = r / size.x - 0.5;
      float row = floor(u);
      float v = mix(iceGrainRow(row, size.x, size.y, turn, seed), iceGrainRow(row + 1.0, size.x, size.y, turn, seed), smoothstep(uGrainFit.z, 1.0 - uGrainFit.z, u - row));
      level += w * (v * 2.0 - 1.0);
      norm += w * w;
      spark += w * smoothstep(uGrainSpark.z, uGrainSpark.w, v);
    }
    sum += seen * vec2(mix(uGrain[g].y, uGrain[g].z, thin) * level / sqrt(max(norm, 1e-6)), uGrain[g].w * mix(uGrainSpark.x, uGrainSpark.y, thin) * spark);
  }
  return sum;
}
// One class of wakes at the point q of the plane (radius r, turn its azimuth over a full circle). toPixel turns
// an offset on the plane (radii) into pixels. Returns how much of the pixel a wake covers (x) and the wake's
// tone from -1 dark to 1 bright (y).
vec2 iceWake(int c, int sub, vec2 q, float r, float turn, mat2 toPixel, float soft) {
  vec4 cell = uIceCell[c];
  vec4 shape = uIceShape[c];
  // each class is two sets of rows, the second half a row out from the first
  float shift = 0.5 * float(sub);
  float row = floor(r / cell.x + shift);
  float rc = (row + 0.5 - shift) * cell.x;
  uint hr = ringPcg(uint(int(row)) + ringPcg(uint(c * 2 + sub) + 911u));
  float n = max(floor(6.2831853 * rc / (cell.x * cell.y)), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  uint h = ringPcg(uint(int(col)) + ringPcg(hr + 17u));
  vec3 a = ringBits(h);
  vec3 b = ringBits(ringPcg(h + 3u));
  // the wake's half sizes in radii, across and along its long axis, and its centre inside the cell
  float across = mix(shape.x, shape.y, a.z) * cell.x;
  float along = across * cell.y;
  float reach = max(across * shape.w, along * abs(shape.z)) + across;
  float my = min(reach / cell.x, 0.5);
  float mx = min(along / (cell.x * cell.y), 0.5);
  float dt = (x - col - mix(mx, 1.0 - mx, a.x)) * (6.2831853 * rc / n);
  float dr = r - (row - shift + mix(my, 1.0 - my, a.y)) * cell.x;
  // the same offset along and across the wake's long axis, pitched to the orbit
  vec2 d = vec2(dt * shape.w + dr * shape.z, dr * shape.w - dt * shape.z) / vec2(along, across);
  float s = length(d);
  vec2 er = q / r;
  vec2 et = vec2(-er.y, er.x);
  // the wake's smaller half size in pixels: its edge is filtered by that, and a wake under a pixel fades out
  float px = min(across * length(toPixel * (er * shape.w - et * shape.z)), along * length(toPixel * (et * shape.w + er * shape.z)));
  float w = soft / max(px, 1e-4);
  float cover = clamp((1.0 + w - s) / (2.0 * w + uIceTone[c].w), 0.0, 1.0);
  cover = cover * cover * (3.0 - 2.0 * cover) * smoothstep(uIceFit.x, uIceFit.y, px);
  float tone = b.y * 2.0 - 1.0;
  return b.x < cell.z ? vec2(cover, sign(tone) * mix(uIceFit2.x, 1.0, abs(tone))) : vec2(0.0);
}
// The spokes at radius r, azimuth turn: how far they move the logarithm of the brightness.
float iceSpokes(float r, float turn) {
  float band = smoothstep(uSpokeFit.x, uSpokeFit.x + uSpokeFit.z, r) * (1.0 - smoothstep(uSpokeFit.y - uSpokeFit.z, uSpokeFit.y, r));
  float sum = 0.0;
  for (int k = 0; k < (band > 0.0 ? ${SPOKES} : 0); k++) {
    vec4 s = uSpoke[k];
    float d = fract(turn + uIceOrbit.x - s.x - s.z * (r - uSpokeFit.x) + 0.5) - 0.5;
    sum += s.w * exp(-d * d / (s.y * s.y));
  }
  return sum * band * uSpokeFit.w;
}
// Wakes and spokes at q (radius r, turn its azimuth over a full circle): the factor on the brightness (x) and
// the factor on the optical depth (y). pixelsPerRadius is the smaller scale of toPixel: a class of wakes whose
// cells are under a pixel is skipped. amount is the strength of the fine structure there. Both show only near
// the sheet (uIceOrbit.z).
vec2 iceMarks(vec2 q, float r, float turn, mat2 toPixel, float pixelsPerRadius, float soft, float amount) {
  float ln = 0.0;
  float spokes = 0.0;
  for (int j = 0; j < (uIceOrbit.z > 0.0 ? 1 : 0); j++) {
    for (int c = 0; c < ${WAKES}; c++) {
      bool seen = uIceCell[c].x * uIceShape[c].y * pixelsPerRadius > uIceFit.x;
      for (int k = 0; k < (seen ? 1 : 0); k++) {
        for (int sub = 0; sub < 2; sub++) {
          vec2 g = iceWake(c, sub, q, r, turn, toPixel, soft);
          ln += g.x * (g.y > 0.0 ? uIceTone[c].y : uIceTone[c].x) * g.y;
        }
      }
    }
    spokes = iceSpokes(r, turn);
  }
  ln *= uIceOrbit.z * amount;
  return vec2(exp(ln + spokes * uIceOrbit.z), exp(ln * uIceFit.z));
}
// The stone of class c, set sub, in whose cell the point p of its level lies (turn the azimuth of p over a full
// circle). Returns its radius in radii, 0 where the cell is empty; e is the offset from its centre to p on the
// level, bits three numbers of its own, id the number of its cell.
float iceStone(int c, int sub, vec2 p, float turn, out vec2 e, out vec3 bits, out uint id) {
  vec4 cell = uStoneCell[c];
  float r = length(p);
  float shift = 0.5 * float(sub);
  float row = floor(r / cell.x + shift);
  float rc = (row + 0.5 - shift) * cell.x;
  uint hr = ringPcg(uint(int(row)) + ringPcg(uint(c * 2 + sub) + 4099u));
  float n = max(floor(6.2831853 * rc / (cell.x * cell.y)), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  id = ringPcg(uint(int(col)) + ringPcg(hr + 17u));
  vec3 a = ringBits(id);
  bits = ringBits(ringPcg(id + 3u));
  float R = mix(uStoneSize[c].x, uStoneSize[c].y, a.z * a.z) * cell.x;
  // the centre keeps this far from the walls of its cell
  float my = min(R * uStoneKind[c].z / cell.x, 0.5);
  float mx = min(R * uStoneKind[c].z / (cell.x * cell.y), 0.5);
  float dt = (x - col - mix(mx, 1.0 - mx, a.x)) * (6.2831853 * rc / n);
  float dr = r - (row - shift + mix(my, 1.0 - my, a.y)) * cell.x;
  vec2 er = p / r;
  e = vec2(-er.y, er.x) * dt + er * dr;
  // stones are where the sheet is: fewer where it is thin, none in a gap
  float deep = ringDepth(rc, cell.x) / uStoneFit.w;
  float there = 1.0 - exp(-deep * deep);
  return ringUnit(ringPcg(id + 29u)) < cell.z * there ? R : 0.0;
}
// The vector v turned about the unit axis k by the angle whose cosine and sine are cs.
vec3 iceSpin(vec3 v, vec3 k, vec2 cs) {
  return v * cs.x + cross(k, v) * cs.y + k * (dot(k, v) * (1.0 - cs.x));
}
// A stone of class c and radius R seen along the ray D (unit, from the lens) that crosses the stone's level at
// the offset e2 from its centre. Dc is D no flatter than the floor, S the way to the Sun, per the pixels of one
// radius across the ray, soft the half width of the filter in pixels, id the number of its cell. Returns the
// share of the pixel the stone covers (x) and, weighted by it, its light over the light of the sheet (y) and
// its gloss (z). A small stone is a ball; a large one is a block with twelve faces, each at its own distance
// from the centre, that tumbles about an axis of its own.
vec3 iceLit(int c, float R, vec2 e2, vec3 bits, uint id, vec3 D, vec3 Dc, vec3 S, float per, float soft, bool resting) {
  vec3 e = vec3(e2.x, 0.0, e2.y);
  float ed = dot(e, Dc);
  float miss = length(e - Dc * ed);
  float px = R * per;
  float w = 2.0 * soft * R / max(px, 1e-4);
  float fade = smoothstep(uIceFit.x, uIceFit.y, px);
  float tone = 1.0 + (bits.y - 0.5) * uStoneLook.x;
  // a stone turned to mirror the Sun is white all over
  float flash = bits.z < uStoneSize[c].z ? uStoneSize[c].w : 0.0;
  bool block = uStoneForm[c].x > 0.5;
  vec3 seen = vec3(0.0);
  // a ball. A resting one is the half above the sheet: on the near side its foot ends it
  float edge = resting && ed < 0.0 ? R - length(e2) : R - miss;
  float cover = R > 0.0 && block == false ? clamp(edge / w + 0.5, 0.0, 1.0) * fade : 0.0;
  for (int k = 0; k < (cover > 0.0 ? 1 : 0); k++) {
    vec3 nrm = normalize(e + Dc * (-ed - sqrt(max(R * R - miss * miss, 0.0))));
    // ice against the light: its edge glows
    float rim = uStoneRim.x * pow(1.0 - max(dot(nrm, -Dc), 0.0), uStoneRim.y);
    float light = mix(1.0, uStoneLit.x + uStoneLit.y * max(dot(nrm, S), 0.0) + rim, uStoneKind[c].x) * tone;
    float gloss = (pow(max(dot(reflect(D, nrm), S), 0.0), uStoneLit.z) + flash) * uStoneLit.w;
    seen = vec3(1.0, light, gloss) * cover;
  }
  // a block
  for (int k = 0; k < (R > 0.0 && block && miss < R ? 1 : 0); k++) {
    vec3 axis = normalize(bits * 2.0 - 1.0 + vec3(0.0, 0.0, 1e-3));
    float angle = 6.2831853 * (ringUnit(ringPcg(id + 71u)) + uIceOrbit.x * uStoneFacet.z * (bits.x * 2.0 - 1.0));
    vec2 cs = vec2(cos(angle), sin(angle));
    vec3 o = iceSpin(e, axis, cs);
    vec3 d = iceSpin(Dc, axis, cs);
    float t0 = -1e9;
    float t1 = 1e9;
    vec3 face = vec3(0.0, 1.0, 0.0);
    float shadeOfFace = 0.5;
    for (int a = 0; a < 6; a++) {
      vec3 pick = ringBits(ringPcg(id + uint(a) * 7u + 101u));
      float oa = dot(o, ICE_AXIS[a]);
      float da = dot(d, ICE_AXIS[a]);
      float inv = 1.0 / (abs(da) > 1e-6 ? da : 1e-6);
      float ta = (R * mix(uStoneFacet.x, uStoneFacet.y, pick.x) - oa) * inv;
      float tb = (-R * mix(uStoneFacet.x, uStoneFacet.y, pick.y) - oa) * inv;
      float enter = min(ta, tb);
      if (enter > t0) {
        t0 = enter;
        face = da > 0.0 ? -ICE_AXIS[a] : ICE_AXIS[a];
        shadeOfFace = da > 0.0 ? pick.z : fract(pick.z * 7.0);
      }
      t1 = min(t1, max(ta, tb));
    }
    // the part of the ray inside the block and, for a resting one, above the sheet. Thin ice is clear, so the
    // edge of a block is soft by the length of ice the ray crosses
    float chord = (resting ? min(t1, 0.0) : t1) - t0;
    float solid = clamp(chord / (uStoneFacet.w * w), 0.0, 1.0) * fade;
    vec3 sun = iceSpin(S, axis, cs);
    float light = (uStoneLit.x + uStoneLit.y * max(dot(face, sun), 0.0)) * mix(1.0, 0.5 + shadeOfFace, uStoneGlow.z) + uStoneGlow.x * exp(-max(chord, 0.0) / (R * uStoneGlow.y));
    float gloss = (pow(max(dot(reflect(d, face), sun), 0.0), uStoneLit.z) + flash) * uStoneLit.w;
    seen = vec3(1.0, mix(1.0, light, uStoneKind[c].x) * tone, gloss) * solid;
  }
  return seen;
}
// How much of the Sun's light a stone of radius R keeps from the point of the sheet at the offset e2 from the
// point under its centre: the ray from there to the Sun (Sc, no flatter than the floor) passes through the ball.
float iceShade(float R, vec2 e2, vec3 Sc, float per, float soft, bool resting) {
  vec3 e = vec3(e2.x, 0.0, e2.y);
  float es = dot(e, Sc);
  float px = R * per;
  float w = 2.0 * soft * R / max(px, 1e-4);
  float shade = resting && es > 0.0 ? R - length(e2) : R - length(e - Sc * es);
  return R > 0.0 ? clamp(shade / w + 0.5, 0.0, 1.0) * smoothstep(uIceFit.x, uIceFit.y, px) : 0.0;
}
// Everything the stones do at the point q of the sheet (turn its azimuth over a full circle), seen from cam
// along the ray D (unit) with the Sun at S: shade is the share of the Sun's light that stones keep from the
// sheet there, rest the stones that rest on the sheet (cover and, weighted by it, light, gloss and the share of
// the light that is the stone's own white rather than the sheet's colour), raised the stones above it over
// everything else, colour times cover and cover. per is the pixels of one radius across
// the ray at q, sat how much colour the ice keeps.
void iceStones(vec2 q, float turn, vec3 cam, vec3 D, vec3 S, float per, float soft, float sat, out float shade, out vec4 rest, out vec4 raised) {
  // rays no flatter to the plane than the floors: that bounds how far a stone and its shadow reach on the plane
  float dm = max(abs(D.y), uStoneFit.y);
  vec2 dv = normalize(D.xz);
  vec3 Dc = vec3(dv * sqrt(1.0 - dm * dm), D.y < 0.0 ? -dm : dm);
  float sm = max(abs(S.y), uStoneFit.z);
  vec2 sv = normalize(S.xz);
  vec3 Sc = vec3(sv * sqrt(1.0 - sm * sm), S.y < 0.0 ? -sm : sm);
  float r = length(q);
  vec2 et = vec2(-q.y, q.x) / r;
  // a shadow lies flat on the sheet: its smaller size on screen is the stone's seen at the slant of the view
  float slant = abs(D.y);
  shade = 0.0;
  rest = vec4(0.0);
  raised = vec4(0.0);
  for (int c = 0; c < ${STONES}; c++) {
    float h = uStoneCell[c].w;
    bool resting = h == 0.0;
    // a level shows from above, and only while the lens is well clear of it
    float clear = resting ? 1.0 : smoothstep(uStoneFar.y, uStoneFar.z, cam.y / h);
    float near = resting ? 1.0 : 1.0 - h / cam.y;
    float at = per / max(near, 1e-3);
    bool shown = clear > 0.0 && uStoneCell[c].x * uStoneSize[c].y * at > uIceFit.x;
    for (int k = 0; k < (shown && resting ? 1 : 0); k++) {
      // stones that rest on the sheet lie closely, so a stone can show over the cell behind it and shade the
      // cell on its far side from the Sun: look in the cell of q, in the next one toward the lens and, for a
      // class that throws shadows, in the next one toward the Sun
      float stride = uStoneCell[c].x * uStoneFit.x;
      uint first = 0u;
      for (int j = 0; j < (uStoneKind[c].y > 0.0 ? 3 : 2); j++) {
        vec2 off = j == 0 ? vec2(0.0) : (j == 1 ? -dv : sv) * stride;
        vec2 e2;
        vec3 bits;
        uint id;
        float R = iceStone(c, 0, q + off, turn + dot(off, et) / (6.2831853 * r), e2, bits, id);
        e2 -= off;
        bool again = j > 0 && id == first;
        first = j == 0 ? id : first;
        for (int i = 0; i < (again == false && j < 2 ? 1 : 0); i++) {
          vec3 seen = iceLit(c, R, e2, bits, id, D, Dc, S, per, soft, true);
          rest = rest * (1.0 - seen.x) + vec4(seen, seen.y * uStoneKind[c].w);
        }
        for (int i = 0; i < (again == false && j != 1 && uStoneKind[c].y > 0.0 ? 1 : 0); i++) shade = max(shade, iceShade(R, e2, Sc, per * slant, soft, true));
      }
    }
    for (int k = 0; k < (shown && resting == false ? 1 : 0); k++) {
      // a floating stone crosses the ray where the ray crosses its level; it is partly ice of the sheet under
      // it, with its colour and brightness, and partly clean ice of its own
      vec2 qv = mix(cam.xz, q, near);
      float tv = atan(qv.y, qv.x) / 6.2831853;
      float rr = length(qv);
      vec3 body = mix(mix(vec3(1.0), ringInk(rr).rgb, sat) * ringKnots(rr, uStoneCell[c].x).y, uStoneTint * uStoneFar.x, uStoneKind[c].w);
      for (int sub = 0; sub < 2; sub++) {
        vec2 e2;
        vec3 bits;
        uint id;
        float R = iceStone(c, sub, qv, tv, e2, bits, id);
        vec3 seen = iceLit(c, R, e2, bits, id, D, Dc, S, at, soft, false) * clear;
        raised = raised * (1.0 - seen.x) + vec4(body * seen.y + mix(body, vec3(uStoneFar.x), uIceOrbit.w) * seen.z, seen.x);
        for (int i = 0; i < (uStoneKind[c].y > 0.0 ? 1 : 0); i++) {
          // the shadow it throws down on the sheet: the ray from q to the Sun crosses the level at qs
          vec2 qs = q + S.xz / S.y * h;
          R = iceStone(c, sub, qs, atan(qs.y, qs.x) / 6.2831853, e2, bits, id);
          float down = iceShade(R, e2, Sc, per * slant, soft, false) * clear;
          shade = shade + down * (1.0 - shade);
        }
      }
    }
  }
}`

export interface Ice { uniforms: Record<string, THREE.IUniform>; set(spinRadians: number, near: number): void }

export function iceField(): Ice {
  const c = ice.wakes
  const k = ice.spokes
  const s = ice.stones
  const orbit = new THREE.Vector4(0, ice.orbit.syncRadius, 0, ice.glintWhite)
  const grainSpark = new THREE.Vector4()
  const grain = ice.grain.layers.map(() => new THREE.Vector4())
  const set = (spinRadians: number, near: number): void => {
    orbit.x = spinRadians / (2 * Math.PI)
    orbit.z = near
    const mix = THREE.MathUtils.lerp
    const g = ice.grain
    grainSpark.set(mix(g.spark.dense[0]!, g.spark.dense[1]!, near), mix(g.spark.thin[0]!, g.spark.thin[1]!, near), g.spark.from, g.spark.to)
    g.layers.forEach((l, i) => grain[i]!.set(l.pixels, l.dense * mix(g.far, 1, near), l.thin * mix(g.far, 1, near), l.sparks))
  }
  set(0, 0)
  return {
    uniforms: {
      uIceOrbit: { value: orbit },
      uIceFit: { value: new THREE.Vector4(ice.fade[0], ice.fade[1], ice.tau, ice.filter) },
      uIceFit2: { value: new THREE.Vector4(ice.weakest, 0, 0, 0) },
      uIceCell: { value: c.cell.map((size, k) => new THREE.Vector4(size, c.aspect[k], c.share[k], 0)) },
      uIceShape: { value: c.cell.map((_, k) => new THREE.Vector4(c.size[k]![0], c.size[k]![1], Math.sin(THREE.MathUtils.degToRad(c.pitchDeg[k]!)), Math.cos(THREE.MathUtils.degToRad(c.pitchDeg[k]!)))) },
      uIceTone: { value: c.cell.map((_, k) => new THREE.Vector4(c.dark[k], c.bright[k], 0, c.soft[k])) },
      uSpokeFit: { value: new THREE.Vector4(k.span[0], k.span[1], k.edge, k.strength) },
      uSpoke: { value: k.at.map((at, j) => new THREE.Vector4(at / 360, k.widthDeg[j]! / 360, k.leanDegPerRadius[j]! / 360, k.tone[j])) },
      uStoneFit: { value: new THREE.Vector4(s.step, s.viewFloor, s.sunFloor, s.presence) },
      uStoneLit: { value: new THREE.Vector4(s.ambient, s.direct, s.glossPower, s.gloss) },
      uStoneLook: { value: new THREE.Vector4(s.tone, 0, 0, s.shadow) },
      uStoneFar: { value: new THREE.Vector4(s.lum, s.clear[0], s.clear[1], 0) },
      uStoneRim: { value: new THREE.Vector4(s.rim, s.rimPower, 0, 0) },
      uStoneTint: { value: new THREE.Vector3().fromArray(s.ice) },
      uStoneForm: { value: s.cell.map((_, k) => new THREE.Vector4(s.block[k], 0, 0, 0)) },
      uStoneFacet: { value: new THREE.Vector4(s.faces[0], s.faces[1], s.tumble, s.edge) },
      uStoneGlow: { value: new THREE.Vector4(s.glow, s.glowDepth, s.faceTone, 0) },
      uGrainFit: { value: new THREE.Vector4(ice.grain.finest, ice.grain.doublings, ice.grain.hard, ice.grain.tau) },
      uGrainSpark: { value: grainSpark },
      uGrain: { value: grain },
      uStoneCell: { value: s.cell.map((size, k) => new THREE.Vector4(size, s.aspect[k], s.share[k], s.height[k])) },
      uStoneSize: { value: s.cell.map((_, k) => new THREE.Vector4(s.size[k]![0], s.size[k]![1], s.glintShare[k], s.glint[k])) },
      uStoneKind: { value: s.cell.map((_, k) => new THREE.Vector4(s.depth[k], s.throws[k], s.reach[k], s.white[k])) },
    },
    // the turn of the orbit that keeps pace with the globe, in full circles since the middle of the hold, and
    // how near the lens is to the sheet (0 in the hold, 1 in the skim): wakes and spokes show only near it,
    // and the sand has its share far of its strength in the hold and its own sparks there
    set,
  }
}
