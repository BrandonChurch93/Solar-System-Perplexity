import * as THREE from 'three'
import ice from './ice.json'

const WAKES = ice.wakes.cell.length
const SPOKES = ice.spokes.at.length
const STONES = ice.stones.cell.length

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
uniform vec4 uStoneCell[${STONES}];
uniform vec4 uStoneSize[${STONES}];
uniform vec4 uStoneKind[${STONES}];
// How far the orbit of radius rc has turned, in full circles: Kepler's third law, counted from the orbit that
// keeps pace with the globe.
float iceTurn(float rc) {
  float s = uIceOrbit.y / rc;
  return uIceOrbit.x * s * sqrt(s);
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
  float there = 1.0 - exp(-ringDepth(rc, cell.x) / uStoneFit.w);
  return ringUnit(ringPcg(id + 29u)) < cell.z * there ? R : 0.0;
}
// A stone of class c and radius R seen along the ray D (unit, from the lens) that crosses the stone's level at
// the offset e2 from its centre. Dc is D no flatter than the floor, S the way to the Sun, per the pixels of one
// radius across the ray, soft the half width of the filter in pixels. Returns the share of the pixel the stone
// covers (x) and, weighted by it, its light over the light of the sheet (y) and its gloss (z).
vec3 iceLit(int c, float R, vec2 e2, vec3 bits, vec3 D, vec3 Dc, vec3 S, float per, float soft, bool resting) {
  vec3 e = vec3(e2.x, 0.0, e2.y);
  float ed = dot(e, Dc);
  vec3 m = e - Dc * ed;
  float miss = length(m);
  // an outline with three lobes of its own
  vec3 u1 = normalize(vec3(-Dc.z, 0.0, Dc.x));
  vec3 u2 = cross(Dc, u1);
  vec2 z = miss > 1e-12 ? vec2(dot(m, u1), dot(m, u2)) / miss : vec2(1.0, 0.0);
  vec2 z3 = vec2(z.x * (z.x * z.x - 3.0 * z.y * z.y), z.y * (3.0 * z.x * z.x - z.y * z.y));
  float Rr = R * (1.0 + uStoneLook.y * dot(z3, bits.yz * 2.0 - 1.0));
  float px = R * per;
  float w = 2.0 * soft * R / max(px, 1e-4);
  // a resting stone is the half of the ball above the sheet: on the near side its foot ends it
  float edge = resting && ed < 0.0 ? Rr - length(e2) : Rr - miss;
  float cover = R > 0.0 ? clamp(edge / w + 0.5, 0.0, 1.0) * smoothstep(uIceFit.x, uIceFit.y, px) : 0.0;
  vec3 seen = vec3(0.0);
  for (int k = 0; k < (cover > 0.0 ? 1 : 0); k++) {
    float t = -ed - sqrt(max(Rr * Rr - miss * miss, 0.0));
    vec3 nrm = normalize(e + Dc * t);
    nrm = normalize(nrm + uStoneLook.z * sin(nrm.zxy * uIceFit2.y + bits * 6.2831853));
    float light = mix(1.0, uStoneLit.x + uStoneLit.y * max(dot(nrm, S), 0.0), uStoneKind[c].x) * (1.0 + (bits.y - 0.5) * uStoneLook.x);
    float gloss = pow(max(dot(reflect(D, nrm), S), 0.0), uStoneLit.z) * uStoneLit.w * (bits.z < uStoneSize[c].z ? uStoneSize[c].w : 1.0);
    seen = vec3(1.0, light, gloss) * cover;
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
// sheet there, rest the stones that rest on the sheet (cover and, weighted by it, light and gloss), raised the
// stones above it over everything else, colour times cover and cover. per is the pixels of one radius across
// the ray at q, sat how much colour the ice keeps.
void iceStones(vec2 q, float turn, vec3 cam, vec3 D, vec3 S, float per, float soft, float sat, out float shade, out vec3 rest, out vec4 raised) {
  // rays no flatter to the plane than the floors: that bounds how far a stone and its shadow reach on the plane
  float dm = max(abs(D.y), uStoneFit.y);
  vec2 dv = normalize(D.xz);
  vec3 Dc = vec3(dv * sqrt(1.0 - dm * dm), D.y < 0.0 ? -dm : dm);
  float sm = max(abs(S.y), uStoneFit.z);
  vec2 sv = normalize(S.xz);
  vec3 Sc = vec3(sv * sqrt(1.0 - sm * sm), S.y < 0.0 ? -sm : sm);
  float r = length(q);
  vec2 et = vec2(-q.y, q.x) / r;
  shade = 0.0;
  rest = vec3(0.0);
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
          vec3 seen = iceLit(c, R, e2, bits, D, Dc, S, per, soft, true);
          rest = rest * (1.0 - seen.x) + seen;
        }
        for (int i = 0; i < (again == false && j != 1 && uStoneKind[c].y > 0.0 ? 1 : 0); i++) shade = max(shade, iceShade(R, e2, Sc, per, soft, true));
      }
    }
    for (int k = 0; k < (shown && resting == false ? 1 : 0); k++) {
      // a floating stone crosses the ray where the ray crosses its level; it is ice of the sheet under it: its
      // colour, and most of its brightness
      vec2 qv = mix(cam.xz, q, near);
      float tv = atan(qv.y, qv.x) / 6.2831853;
      // the shadow it throws down on the sheet: the ray from q to the Sun crosses the level at qs
      vec2 qs = q + S.xz / S.y * h;
      float ts = atan(qs.y, qs.x) / 6.2831853;
      float rr = length(qv);
      vec3 tone = mix(vec3(1.0), ringInk(rr).rgb, sat);
      float lum = mix(ringKnots(rr, uStoneCell[c].x).y, uStoneFar.x, uStoneFar.w);
      for (int sub = 0; sub < 2; sub++) {
        vec2 e2;
        vec3 bits;
        uint id;
        float R = iceStone(c, sub, qv, tv, e2, bits, id);
        vec3 seen = iceLit(c, R, e2, bits, D, Dc, S, at, soft, false) * clear;
        raised = raised * (1.0 - seen.x) + vec4(lum * (tone * seen.y + mix(tone, vec3(1.0), uIceOrbit.w) * seen.z), seen.x);
        R = iceStone(c, sub, qs, ts, e2, bits, id);
        float down = iceShade(R, e2, Sc, per, soft, false) * clear;
        shade = shade + down * (1.0 - shade);
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
  return {
    uniforms: {
      uIceOrbit: { value: orbit },
      uIceFit: { value: new THREE.Vector4(ice.fade[0], ice.fade[1], ice.tau, ice.filter) },
      uIceFit2: { value: new THREE.Vector4(ice.weakest, s.roughPitch, 0, 0) },
      uIceCell: { value: c.cell.map((size, k) => new THREE.Vector4(size, c.aspect[k], c.share[k], 0)) },
      uIceShape: { value: c.cell.map((_, k) => new THREE.Vector4(c.size[k]![0], c.size[k]![1], Math.sin(THREE.MathUtils.degToRad(c.pitchDeg[k]!)), Math.cos(THREE.MathUtils.degToRad(c.pitchDeg[k]!)))) },
      uIceTone: { value: c.cell.map((_, k) => new THREE.Vector4(c.dark[k], c.bright[k], 0, c.soft[k])) },
      uSpokeFit: { value: new THREE.Vector4(k.span[0], k.span[1], k.edge, k.strength) },
      uSpoke: { value: k.at.map((at, j) => new THREE.Vector4(at / 360, k.widthDeg[j]! / 360, k.leanDegPerRadius[j]! / 360, k.tone[j])) },
      uStoneFit: { value: new THREE.Vector4(s.step, s.viewFloor, s.sunFloor, s.presence) },
      uStoneLit: { value: new THREE.Vector4(s.ambient, s.direct, s.glossPower, s.gloss) },
      uStoneLook: { value: new THREE.Vector4(s.tone, s.lobes, s.rough, s.shadow) },
      uStoneFar: { value: new THREE.Vector4(s.lum, s.clear[0], s.clear[1], s.own) },
      uStoneCell: { value: s.cell.map((size, k) => new THREE.Vector4(size, s.aspect[k], s.share[k], s.height[k])) },
      uStoneSize: { value: s.cell.map((_, k) => new THREE.Vector4(s.size[k]![0], s.size[k]![1], s.glintShare[k], s.glint[k])) },
      uStoneKind: { value: s.cell.map((_, k) => new THREE.Vector4(s.depth[k], s.throws[k], s.reach[k], 0)) },
    },
    // the turn of the orbit that keeps pace with the globe, in full circles since the middle of the hold, and
    // how near the lens is to the sheet (0 in the hold, 1 in the skim): wakes and spokes show only near it
    set: (spinRadians, near) => { orbit.x = spinRadians / (2 * Math.PI); orbit.z = near },
  }
}
