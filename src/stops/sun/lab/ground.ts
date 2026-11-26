import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../../post/chain'
import { config } from '../../../config'
import { GRADE_GLSL } from '../grade'
import { STAGE_GLSL, stage } from '../stage'
import { formatUniform } from '../format'
import { plan } from '../plan'
import ramp from '../convect.json'
import place from '../place.json'
import lab from './lab.json'
import { EDGES, SLOTS, TILE, cellsAt, newCells } from './sim'

/**
 * The close ground of the Sun as things. Every cell of a power diagram of moving sites (sim.ts, a life simulated
 * once and read by the frame's time alone) is a dome of real triangles over its own ground: it hangs over its foot,
 * so two neighbours cut into each other and the lane between them is the crease where they meet, and a near dome
 * hides the foot of a far one by depth. Nothing is lit: every bit of light is the matter's own heat, mapped to a
 * colour by the ramp of convect.json. A dome is hot on its crown and cooler down its flanks and in the creases,
 * combed into fibres that fan from near its crown to its rim, and joined to its neighbour where a field of the
 * place says so. Where a cell is too small in the picture to be a thing, the floor shows a map of the same cells.
 */

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))

const CURVE_GLSL = (() => {
  const k = lab.heat.curve as number[][]
  let out = ''
  for (let i = 1; i < k.length; i++) {
    const [x0, y0] = k[i - 1] as [number, number]
    const [x1, y1] = k[i] as [number, number]
    const line = `${y0.toFixed(5)} + (h - ${x0.toFixed(5)}) * ${((y1 - y0) / (x1 - x0)).toFixed(5)}`
    out += i < k.length - 1 ? `  if (h < ${x1.toFixed(5)}) return ${line};\n` : `  return ${line};\n`
  }
  return out
})()

function rampTexture(): THREE.DataTexture {
  const stops = ramp.ramp.stops as number[][]
  const levels = ramp.ramp.levels as number[]
  const n = 256
  const px = new Float32Array(n * 4)
  const lo = stops[0]!
  const hi = ramp.tone.white as number[]
  for (let i = 0; i < n; i++) {
    const l = i / (n - 1)
    let c: number[]
    if (l <= levels[0]!) c = lo.map((v) => (v * l) / levels[0]!)
    else if (l >= levels[levels.length - 1]!) {
      const k = (l - levels[levels.length - 1]!) / (1 - levels[levels.length - 1]!)
      c = stops[stops.length - 1]!.map((v, j) => v + (hi[j]! - v) * k)
    } else {
      let j = 0
      while (levels[j + 1]! < l) j++
      const k = (l - levels[j]!) / (levels[j + 1]! - levels[j]!)
      c = stops[j]!.map((v, m) => v + (stops[j + 1]![m]! - v) * k)
    }
    px[i * 4] = srgbToLinear(c[0]!)
    px[i * 4 + 1] = srgbToLinear(c[1]!)
    px[i * 4 + 2] = srgbToLinear(c[2]!)
    px[i * 4 + 3] = 1
  }
  const t = new THREE.DataTexture(px, n, 1, THREE.RGBAFormat, THREE.FloatType)
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

const T = lab.tubes
const Q = (lab.heat as { cushion?: { navel: number[]; fibre: number[]; patch: number[]; blob: number[]; grain?: number[]; seam?: number[]; rim?: number[]; petal?: number[] } }).cushion
const CU = (lab.dome as { base?: number[] }).base
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
const up = stage.down.clone().negate()
const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
const right = fwd.clone().cross(up).normalize()

function chart(p: THREE.Vector3, out: THREE.Vector2): THREE.Vector2 {
  const dx = p.x - stage.centre.x
  const dy = p.y - stage.centre.y
  const dz = p.z - stage.centre.z
  const l = Math.hypot(dx, dy, dz)
  const cu = (dx * up.x + dy * up.y + dz * up.z) / l
  const cr = (dx * right.x + dy * right.y + dz * right.z) / l
  const cf = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / l
  const ring = Math.hypot(cr, cf)
  const arc = stage.radius * Math.atan2(ring, cu)
  return out.set(ring > 1e-9 ? (cr / ring) * arc : 0, ring > 1e-9 ? (cf / ring) * arc : 0)
}

const SHAPE_GLSL = /* glsl */ `
uniform vec4 uLabSpot;
uniform vec4 uLabPit;
uniform vec4 uLabPitAt;
uniform vec4 uLabJoin;
uniform vec4 uLabFar;
uniform vec4 uLabHeat;
uniform vec4 uLabHeatMore;
uniform vec3 uLabEye;
uniform sampler2D uLabMap;
${STAGE_GLSL}
// the ground is combed toward the spot: a place of the cells' own chart lies nearer the spot on the ground, the
// more the nearer it is, so round cells become long strands that all end in the pit
vec2 labWarp(vec2 g) {
  vec2 d = g - uLabSpot.xy;
  float s = length(d);
  float r = s;
  for (int k = 0; k < 8; k++) {
    float e = uLabSpot.z * exp(-(r * r) / (uLabSpot.w * uLabSpot.w));
    r = clamp(r - (r + e - s) / (1.0 - 2.0 * r * e / (uLabSpot.w * uLabSpot.w)), 0.0, s);
  }
  return uLabSpot.xy + d * (r / max(s, 1e-6));
}
float labPit(vec2 real) {
  return uLabPit.x * (1.0 - smoothstep(uLabPit.y * uLabPit.w, uLabPit.z * uLabPit.w, length(real - uLabPitAt.xy)));
}
// the umbra is the floor of the pit
float labUmbra(vec2 real) {
  return 1.0 - smoothstep(0.7 * uLabPit.w, 1.0 * uLabPit.w, length(real - uLabPitAt.xy));
}
// the lobes of a dome: its top is broken into a few lobes round sites of its own, 1 in the crease between two
// lobes, 0 on a lobe. d: the place on the dome, 0 at the crown to 1 at the foot
float labLobes(vec2 d, float seed, float thin) {
  float f1 = 9.0;
  float f2 = 9.0;
  vec2 q = d + 0.07 * sin(d.yx * 9.0 + seed);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float an = 6.2831853 * fract(seed * 0.6180339 + fk * 0.2137 + 0.37 * fract(seed * 1.31 * (fk + 1.0)));
    float ra = 0.2 + 0.5 * fract(seed * 1.7321 + fk * 0.6113);
    float l = length(q - ra * vec2(cos(an), sin(an)));
    if (l < f1) { f2 = f1; f1 = l; } else if (l < f2) f2 = l;
  }
  float c = 1.0 - smoothstep(0.0, thin, f2 - f1);
  return c * c;
}
float h1(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y);
}
float vnq(vec2 p, float per) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, per);
  float x1 = mod(i.x + 1.0, per);
  return mix(mix(h1(vec2(x0, i.y)), h1(vec2(x1, i.y)), f.x), mix(h1(vec2(x0, i.y + 1.0)), h1(vec2(x1, i.y + 1.0)), f.x), f.y);
}
// the body of a cell is its tubes: a few tubes of gas side by side round the middle, each rising at the dimple,
// arching over and plunging into the lane. d: the place on the dome (0 at the crown, 1 at the foot), q: the way
// along a tube less the way the gas has run, so the sway of the tubes is carried outward and comes new from the
// middle. x: across the tube, -1 and 1 in the grooves, 0 on its crest; y: the tube's number; z: how many; w: the
// turn round the cell as the tubes lie, 0 to 1
vec2 labFan(vec2 d, float seed) {
  vec2 c = ${(T.off ?? 0).toFixed(3)} * (0.12 + 0.3 * fract(seed * 7.13)) * vec2(cos(6.2831853 * fract(seed * 3.71)), sin(6.2831853 * fract(seed * 3.71)));
  return d - c * max(1.0 - dot(d, d), 0.0) / (1.0 - dot(c, c));
}
vec4 labTubes(vec2 dd, float seed, float q) {
  float n = floor(${T.count[0]!.toFixed(1)} + ${(T.count[1]! - T.count[0]! + 1).toFixed(1)} * fract(seed * 5.317));
  vec2 d = labFan(dd, seed);
  float rho = length(d);
  float th = atan(d.y, d.x) / 6.2831853 + 0.5 + (fract(seed * 3.713) - 0.5) * ${T.twist.toFixed(2)} * rho;
  float sway = ${T.sway[0]!.toFixed(2)} * (vnq(vec2(th * n + 3.0, q * ${T.sway[2]!.toFixed(2)} + seed * 17.0), n) - 0.5) + ${T.sway[1]!.toFixed(2)} * (vnq(vec2(th * 3.0, q * ${(T.sway[2]! * 0.5).toFixed(2)} + seed * 5.0), 3.0) - 0.5);
  float ph = th * n + sway * smoothstep(0.0, 0.3, rho);
  float i = floor(ph);
  return vec4(2.0 * (ph - i) - 1.0, mod(i, n), n, ph / n);
}
// how wide a tube stands at a place: it thins toward the lane (edge: the way to the cell's border, 1 on it)
float labTubeWide(float edge) {
  return mix(1.0, ${T.finger[1]!.toFixed(2)}, smoothstep(${T.finger[0]!.toFixed(2)}, 1.05, edge));
}
// an old cell's tubes part: two or three of its grooves open from the rim to the middle, down to the floor, and
// the cell falls into two or three. 1 in the open groove
float labPart(vec4 tb, float edge, float age, float seed) {
  float old = smoothstep(${lab.heat.breaks[0]!.toFixed(2)}, ${lab.heat.breaks[1]!.toFixed(2)}, age);
  float m = floor(tb.z / (2.0 + floor(2.0 * fract(seed * 9.173))) + 0.5);
  float g = mod(tb.y + step(0.0, tb.x) + floor(seed * 37.0), tb.z);
  float sel = step(mod(g, m), 0.5);
  float front = 1.1 - 1.25 * old;
  return sel * step(1e-3, old) * smoothstep(front, front + 0.3, edge) * (1.0 - smoothstep(0.0, ${T.part.toFixed(2)}, 1.0 - abs(tb.x)));
}
// the height of the body at a place as a share of the smooth dome's: the tube's round back, its grooves, the
// swellings that ride outward along it, the dimple where the gas wells up
float labTubeBody(vec4 tb, float rho, float edge, float age, float seed, float q, float fit) {
  float x = abs(tb.x) / labTubeWide(edge);
  float crest = sqrt(max(1.0 - x * x, 0.0));
  float bump = 1.0 + ${T.bump[0]!.toFixed(2)} * (2.0 * vnq(vec2(tb.y + floor(seed * 91.0), q * ${T.bump[1]!.toFixed(2)} + seed * 13.0), tb.z) - 1.0) * smoothstep(0.1, 0.4, rho);
  float depth = ${T.depth.toFixed(2)} * mix(${T.crown.toFixed(2)}, 1.0, smoothstep(${T.from[0]!.toFixed(2)}, ${T.from[1]!.toFixed(2)}, rho)) * smoothstep(0.03, 0.2, rho) * fit + ${((1 - T.depth) * T.finger[2]!).toFixed(3)} * smoothstep(${T.finger[0]!.toFixed(2)}, 1.05, edge);
  float f = 1.0 - depth + depth * crest * bump;
  f *= 1.0 - labPart(tb, edge, age, seed);
  return f * (1.0 - ${T.dimple[0]!.toFixed(2)} * exp(-rho * rho / ${(T.dimple[1]! * T.dimple[1]!).toFixed(4)}));
}
// where two cells are of one piece: a field of the place, the same for both sides of a border. 0 a full crease,
// 1 the two run into each other
float labJoin(vec2 chartPlace) {
  return smoothstep(0.36, 0.64, 0.65 * vn(chartPlace * uLabJoin.x + 31.7) + 0.35 * vn(chartPlace * uLabJoin.x * 2.3 - 11.3));
}
#ifdef LAB_FRAG
// the penumbra: threads about the spot, the same for every cell they cross, each of its own length and bend.
// x: how much of the place is penumbra, y: its heat, z: what the umbra's dark leaves, w: under 0 inside the torn
// edge of the umbra
// a rank of tongues round the spot: n side by side, each a drop with its head toward the umbra, of its own length,
// bend and heat. x: its heat, y: the lot of its column
vec2 labTongue(float turnS, float lr, float n, float rows, float salt, float flow) {
  float uu = (turnS / 6.2831853 + 0.5) * n;
  float col = mod(floor(uu), n);
  float fu = fract(uu) - 0.5;
  float lot = h1(vec2(col, salt));
  float v = lr * rows + 3.0 * lot - flow;
  float row = floor(v);
  float fv = fract(v);
  float id = h1(vec2(col + 17.0 * row, salt + row));
  float wide = 0.5 * (0.2 + 0.8 * smoothstep(0.0, 0.5, fv)) * (1.0 - 0.5 * smoothstep(0.7, 1.0, fv));
  float bend = 0.3 * (h1(vec2(col * 1.7 + row, salt + 9.0)) - 0.5) * (fv - 0.4);
  float x = abs(fu + bend) / max(wide, 1e-3);
  float body = 1.0 - smoothstep(0.3, 1.0, x);
  return vec2(body * mix(1.0, 0.45, smoothstep(0.05, 0.95, fv)) * mix(0.5, 1.0, id) * step(0.08, id), lot);
}
vec4 labPen(vec2 chartPlace, float real, float pit, float flow, vec2 gx, vec2 gy) {
  vec2 sp = chartPlace - uLabSpot.xy;
  float turnS = atan(sp.y, sp.x);
  float rs = real / uLabPit.w;
  float rp = pit / uLabPit.w;
  turnS += 0.06 * (vn(vec2(turnS * 7.0, rs * 1.3)) - 0.5) + 0.02 * sin(rs * 5.0 + turnS * 9.0);
  float pa = vn(vec2(turnS * 9.0, rs * 0.5 - flow));
  float lr = log2(max(rs, 0.6));
  float oct = floor(lr);
  float mixO = smoothstep(0.25, 0.75, lr - oct);
  float f0 = exp2(oct);
  float pb = mix(vn(vec2(turnS * 52.0 * f0 + 3.0, lr * 9.0 - flow)), vn(vec2(turnS * 104.0 * f0 + 3.0, lr * 9.0 - flow)), mixO);
  float pc = mix(vn(vec2(turnS * 110.0 * f0 + 7.0, lr * 15.0 - flow)), vn(vec2(turnS * 220.0 * f0 + 7.0, lr * 15.0 - flow)), mixO);
  float pd = vn(vec2(turnS * 26.0 * f0, lr * 3.1 - flow));
  // a thread is as wide in the picture as the picture is across it, however flat the look along it
  vec2 across = vec2(-sp.y, sp.x) / max(dot(sp, sp), 1e-8);
  float wp = length(vec2(dot(gx, across), dot(gy, across)));
  float kpb = 1.0 - smoothstep(0.5, 1.1, wp * 52.0 * mix(f0, 2.0 * f0, mixO));
  float kpc = 1.0 - smoothstep(0.5, 1.1, wp * 110.0 * mix(f0, 2.0 * f0, mixO));
  float kpd = 1.0 - smoothstep(0.5, 1.1, wp * 26.0 * f0);
  // the threads lie side by side about the spot, dark and bright by turns, three sizes, each of its own length
  float la = mix(0.3, smoothstep(0.46, 0.64, pb), kpb);
  float lb = mix(0.3, smoothstep(0.46, 0.64, pc), kpc);
  float ld = mix(0.5, smoothstep(0.35, 0.65, pd), kpd);
  pb = mix(0.5, pb, kpb);
  pc = mix(0.5, pc, kpc);
  vec2 t1 = labTongue(turnS, lr, ${lab.spot.tongues[0]!.toFixed(1)}, ${lab.spot.ranks[0]!.toFixed(2)}, 3.0, flow);
  vec2 t2 = labTongue(turnS, lr, ${lab.spot.tongues[1]!.toFixed(1)}, ${lab.spot.ranks[1]!.toFixed(2)}, 11.0, flow);
  float kt1 = 1.0 - smoothstep(0.25, 0.6, wp * ${(lab.spot.tongues[0]! / 6.2831853).toFixed(3)});
  float kt2 = 1.0 - smoothstep(0.25, 0.6, wp * ${(lab.spot.tongues[1]! / 6.2831853).toFixed(3)});
  float strand = max(mix(0.22, t1.x, kt1), 0.9 * mix(0.22, t2.x, kt2)) * mix(0.7, 1.15, lb) * mix(0.8, 1.1, la);
  float pen = 1.0 - smoothstep(-0.5, 0.5, rs - uLabJoin.y - uLabJoin.z * (pb - 0.5) - 0.5 * uLabJoin.z * (vn(chartPlace * 23.0 + 1.7) - 0.5));
  float tongue = smoothstep(0.62, 0.8, pa) * smoothstep(0.5, 0.7, pc);
  float bundle = uLabHeatMore.z * mix(mix(${lab.spot.gap[0]!.toFixed(3)}, ${lab.spot.gap[1]!.toFixed(3)}, smoothstep(1.2, 3.0, rp)), ${lab.spot.hot.toFixed(2)}, strand) * mix(0.6, 1.1, smoothstep(0.3, 0.7, pa)) * mix(0.5, 1.0, smoothstep(1.0, 2.2, rs));
  return vec4(pen, bundle, mix(0.04, 1.0, smoothstep(0.72 + 0.3 * t1.y, 0.88 + 0.4 * t1.y, rp + 0.2 * (pa - 0.5))), rp - 1.14 - 0.1 * (pb - 0.5) - 0.06 * (pc - 0.5));
}
#endif
// the width of a mean cell at a place in pixels of a 1080 frame
float labPx(vec3 here) {
  return uLabFar.z / max(distance(here, uLabEye), 1e-4);
}
// the same as the eye has it: a cell seen along the ground is as flat in the picture as the look is flat
float labSeen(vec3 here) {
  float mu = abs(dot(normalize(here - ST_CENTRE), normalize(uLabEye - here)));
  return labPx(here) * min(mu + ${lab.far.lie.toFixed(2)}, 1.0);
}
#if defined(LAB_FRAG) && !defined(LAB_MAP)
// the ground where its cells are too small in the picture to be things: the same cells at the same places, seen
// from above (a map of the tile drawn from the same table at the same time), with the same penumbra
vec3 labFarSeen = vec3(0.0);
float labFar(vec2 chartPlace, float real, float flow, vec4 pn, vec2 gx, vec2 gy) {
  vec4 m = textureGrad(uLabMap, chartPlace / uLabFar.w, gx / uLabFar.w, gy / uLabFar.w);
  float mapped = m.r;
  labFarSeen = vec3(m.r, m.b, 1.0 - pn.x);
  return uLabHeat.x + mix(max(mapped - uLabHeat.x, 0.0), uLabHeat.y * pn.y, pn.x) * pn.z;
}
#endif
vec3 labBall(vec2 g, float h) {
  float arc = length(g);
  float al = arc / ST_RADIUS;
  vec2 u = arc > 1e-6 ? g / arc : vec2(1.0, 0.0);
  vec3 dir = -ST_DOWN * cos(al) + sin(al) * (ST_RIGHT * u.x + ST_FWD * u.y);
  return ST_CENTRE + dir * (ST_RADIUS + h);
}`

const DOME_VERT = /* glsl */ `
precision highp float;
uniform sampler2D uLabCells;
uniform sampler2D uLabList;
uniform vec2 uLabMesh;
uniform vec4 uLabDome;
uniform vec4 uLabMore;
uniform vec4 uLabTime;
out vec3 vS;
out vec3 vPos;
out vec3 vN;
out vec3 vView;
out vec3 vClip;
out float vReal;
out float vPit;
out float vDeep;
out float vCorner;
out float vJunc;
out float vEdge;
out float vTall;
out vec2 vG;
flat out float vSink;
flat out vec2 vAxis;
flat out vec4 vCell;
flat out vec4 vMore;
${SHAPE_GLSL}
vec2 edges[${EDGES}];
vec2 mid;
float rad;
float high;
float seed;
float age;
float tubes;
float real;
float pitAway;
float deep;
float tall;
float sink = 0.0;
float corner;
float junc;
float edge;
vec3 dome(vec3 s) {
  float a = acos(clamp(s.z, -1.0, 1.0));
  vec2 u = length(s.xy) > 1e-6 ? normalize(s.xy) : vec2(1.0, 0.0);
  float inv = 0.0;
  float invP = 0.0;
  float m1 = 0.0;
  float m2 = 0.0;
  vec2 ea = vec2(0.0);
  vec2 eb = vec2(0.0);
  for (int j = 0; j < ${EDGES}; j++) {
    float e = max(dot(u, edges[j]) * rad, 0.0);
    inv += pow(e, uLabDome.z);
    float e2 = e * e;
    float e4 = e2 * e2;
    invP += e4 * e4;
    if (e > m1) { m2 = m1; m1 = e; eb = ea; ea = edges[j]; } else if (e > m2) { m2 = e; eb = edges[j]; }
  }
  corner = m2 / max(m1, 1e-6);
  float r = rad * pow(max(inv, 1e-9), -1.0 / uLabDome.z);
  float f = (cos(a) - cos(uLabDome.x)) / (1.0 - cos(uLabDome.x));
  float wide = sin(a) / sin(uLabDome.x);
  float groove = labLobes(u * (a / uLabDome.x), seed, 0.3) * (1.0 - smoothstep(0.6, 1.0, a / uLabDome.x));
  float top = 1.0 - pow(max(1.0 - f, 0.0), uLabDome.w);
#if ${CU ? 1 : 0}
  // the rings of the mesh lie along the border, so the rim of a body is a clean line at any level of the mesh
  r = rad * pow(max(invP, 1e-9), -0.125);
#endif
  vec2 place = mid + u * (r * wide * uLabMore.x);
  // the way from the place to the point where this cell and its two nearest neighbours meet: the same point and
  // the same way for all three, so a pit there is one pit
  float det = ea.x * eb.y - ea.y * eb.x;
  junc = m2 > 0.0 && abs(det) > 1e-6 ? 1.0 - smoothstep(0.0, ${CU ? (CU[8] ?? 0.03).toFixed(4) : '0.03'}, length(u * (r * wide * uLabMore.x) - vec2(eb.y - ea.y, ea.x - eb.x) / det)) : 0.0;
  // the dome is a round body that reaches over the border of its cell into its neighbours: the sheet is the upper
  // side of all of them, a lane the valley where two bodies meet. edge: the way to the cell's own border, 1 on it
  edge = r * wide * uLabMore.x / max(rad * pow(max(invP, 1e-9), -0.125), 1e-6);
  // the borders are no straight lines: the ground itself is pushed about a little by a field of the place, the
  // same for both sides of a border
  place += ${lab.join.wobble.toFixed(4)} * (vec2(vn(place * 13.0 + 3.1) + 0.5 * vn(place * 29.0 - 7.0), vn(place * 13.0 - 21.7) + 0.5 * vn(place * 29.0 + 15.3)) - 0.75);
  vG = place;
#ifdef LAB_MAP
  vec2 g = place;
  real = 1e3;
  pitAway = 1e3;
  float low = 1.0;
#else
  vec2 g = labWarp(place);
  real = length(g - uLabSpot.xy);
  pitAway = length(g - uLabPitAt.xy);
  float low = mix(uLabMore.z, 1.0, smoothstep(uLabPit.w * 1.7, uLabPit.w * 3.8, real)) * (1.0 - sink);
#endif
  // where the field of the place joins two cells, both stand on one level there and the crease between them is gone
  float rho = a / uLabDome.x;
  float level = min(uLabMore.w * (0.5 + 0.5 * labJoin(place)), ${lab.join.most.toFixed(2)} * high) * low;
#if ${CU ? 1 : 0}
  // every body stands on the height of the place at its own border (a field of the place, the same for both sides),
  // so two neighbours meet on their border and no body lies over another's ground
  float base = ${CU ? CU[0]!.toFixed(4) : '0.0'} * (1.0 + ${CU ? CU[1]!.toFixed(2) : '0.0'} * (vn(place * ${CU ? CU[2]!.toFixed(1) : '1.0'} + 51.0) - 0.5) + ${CU ? CU[3]!.toFixed(2) : '0.0'} * labJoin(place)) * (1.0 - ${CU ? (CU[7] ?? 0).toFixed(2) : '0.0'} * junc) * low;
  float shape = pow(max(1.0 - pow(min(edge, 1.0), ${CU ? CU[4]!.toFixed(2) : '2.0'}), 0.0), ${CU ? (1 / CU[5]!).toFixed(4) : '0.5'}) * (1.0 - uLabMore.y * groove) * (1.0 - ${CU ? (CU[7] ?? 0).toFixed(2) : '0.0'} * junc);
#if ${T.on ? 1 : 0}
  float run = -${lab.fibre.slow.toFixed(2)} * log(1.0 - min(rho, ${(lab.fibre.slow * 0.95).toFixed(3)}) / ${lab.fibre.slow.toFixed(2)});
  float q = run - uLabTime.x * uLabTime.y;
  float tr = length(labFan(u * rho, seed));
  float tn = floor(${T.count[0]!.toFixed(1)} + ${(T.count[1]! - T.count[0]! + 1).toFixed(1)} * fract(seed * 5.317));
  shape *= mix(1.0, labTubeBody(labTubes(u * rho, seed, q), tr, edge, age, seed, q, smoothstep(2.0, 4.0, 6.2831853 * tr / (tn * max(uLabMesh.x, uLabMesh.y * rho)))), tubes);
#endif
  float h = edge <= 1.0 ? base + max(high * low - base, ${CU ? (CU[9] ?? 0).toFixed(2) : '0.0'} * base) * shape : base * max(1.0 - ${CU ? CU[6]!.toFixed(1) : '1.0'} * (edge - 1.0), 0.0);
  deep = shape;
  tall = h;
#else
  float body = high * low * (f < 0.0 ? f : top) * (1.0 - uLabMore.y * groove);
#if ${T.on ? 1 : 0}
  float run = -${lab.fibre.slow.toFixed(2)} * log(1.0 - min(rho, ${(lab.fibre.slow * 0.95).toFixed(3)}) / ${lab.fibre.slow.toFixed(2)});
  float q = run - uLabTime.x * uLabTime.y;
  float tr = length(labFan(u * rho, seed));
  float tn = floor(${T.count[0]!.toFixed(1)} + ${(T.count[1]! - T.count[0]! + 1).toFixed(1)} * fract(seed * 5.317));
  body *= mix(1.0, labTubeBody(labTubes(u * rho, seed, q), tr, edge, age, seed, q, smoothstep(2.0, 4.0, 6.2831853 * tr / (tn * max(uLabMesh.x, uLabMesh.y * rho)))), tubes);
#endif
  float soft = 0.35 * high * low + 1e-6;
  float t = clamp(0.5 + 0.5 * (body - level) / soft, 0.0, 1.0);
  float h = mix(max(body, level), mix(level, body, t) + soft * t * (1.0 - t), min(level / soft, 1.0));
  deep = (h - level) / max(high * low - level, 1e-5);
  tall = h;
#endif
#ifdef LAB_MAP
  return labBall(g, h);
#else
  return labBall(g, h - labPit(g));
#endif
}
void main() {
  int wideList = textureSize(uLabList, 0).x;
  vec4 aCell = texelFetch(uLabList, ivec2(gl_InstanceID % wideList, gl_InstanceID / wideList), 0);
  int id = int(aCell.x + 0.5);
  vec4 c0 = texelFetch(uLabCells, ivec2(0, id), 0);
  vec4 c1 = texelFetch(uLabCells, ivec2(1, id), 0);
  for (int k = 0; k < ${EDGES / 2}; k++) {
    vec4 e = texelFetch(uLabCells, ivec2(2 + k, id), 0);
    edges[2 * k] = e.xy;
    edges[2 * k + 1] = e.zw;
  }
  mid = c0.xy + aCell.yz;
  // a cell that comes into the umbra shrinks to nothing: the threads end over the pit, each at its own place
  float keep = 1.0;
  rad = c0.z * keep;
  high = c0.w * keep;
  for (int k = 0; k < ${EDGES}; k++) edges[k] /= max(keep, 1e-3);
  seed = c1.x;
  age = c1.y;
#ifndef LAB_MAP
  float seenPx = labPx(labBall(labWarp(mid), 0.0));
  sink = 1.0 - smoothstep(uLabFar.x, uLabFar.y, seenPx);
  // a cell too small in the picture for its mesh to carry tubes is a smooth dome
  tubes = smoothstep(${T.px[0]!.toFixed(1)}, ${T.px[1]!.toFixed(1)}, seenPx * 2.0 * rad / ${lab.far.cell.toFixed(4)});
#else
  tubes = 0.0;
#endif
  float a = position.x * uLabDome.x;
  vec3 s = vec3(sin(a) * cos(position.y), sin(a) * sin(position.y), cos(a));
  // the root of the fibres lies on the side of the lens (the point under the stage's camera), turned a little
  // from cell to cell; near the spot it lies on the far side from the pit
  float turn = 6.2831853 * (vn(mid * 1.3 + 7.7) + vn(mid * 0.31 + 2.2)) + (fract(c1.x * 0.6180339) - 0.5) * 1.2;
  vec2 away = -normalize(mid + vec2(0.0, 1e-3));
  away = vec2(away.x * cos(turn) - away.y * sin(turn), away.x * sin(turn) + away.y * cos(turn));
  vec2 toSpot = uLabSpot.xy - mid;
  float ds = length(toSpot);
  vec2 axis = normalize(mix(toSpot / max(ds, 1e-5), away, smoothstep(uLabSpot.z * 1.7, uLabSpot.z * 2.8, ds)));
  vec3 t1 = normalize(cross(s, vec3(0.3, 0.9, 0.31)));
  vec3 t2 = cross(s, t1);
  vec3 p1 = dome(normalize(s + 0.03 * t1));
  vec3 p2 = dome(normalize(s + 0.03 * t2));
  vec3 p = dome(s);
  vS = s;
  vPos = p;
  vec3 lie = cross(p1 - p, p2 - p);
  vN = dot(lie, lie) > 1e-24 ? normalize(lie) : normalize(p - ST_CENTRE);
  vAxis = axis;
  vCell = vec4(c1.x, c1.y, rad, high);
  vMore = vec4(ds, c1.z, tubes, 0.0);
  vReal = real;
  vPit = pitAway;
  vDeep = deep;
  vCorner = corner;
  vJunc = junc;
  vEdge = edge;
  vTall = tall;
  vSink = sink;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
#ifdef LAB_MAP
  gl_Position = vec4(vG / uLabFar.w * 2.0 - 1.0, 0.9 - tall * 12.0, 1.0);
#endif
}`

const TAIL_GLSL = /* glsl */ `
uniform sampler2D uRamp;
uniform sampler2D uGlow;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uGlowPlain, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform float uGroundMost;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uLabKeep;
uniform vec4 uLabAway;
uniform vec3 uLabAwayTint;
uniform vec4 uLabHaze;
uniform vec4 uLabHazeTint;
uniform vec4 uLabGas;
uniform sampler2D uLabGlobe;
uniform mat3 uLabToMap;
uniform vec4 uLabTone;
uniform vec3 uLabToneAt;
uniform vec4 uLabToneFar;
uniform vec3 uLabToneWide;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${GRADE_GLSL}
vec3 thrown(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uGroundMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uGroundMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}
// heat: the temperature of the matter at the place, 0 black to 1 the white of the ramp, above 1 brighter than the
// picture's white (it blooms). A thin glowing haze lies low over the ground: the lower the place and the flatter
// the look, the more of it is in the way. The lights that the opening throws on the ground, the exposure and the
// vignette follow as on the standing ground
// (c) the thin gas over the ground glows along the path to the eye, by the heat of the ground under it: a skin that
// lies on the domes and a pool that fills the low places between them. The sight line from the place to the eye is
// walked through the layer in steps (finer near the place); at each step the ground under it is read from the map
// of the tile (its heat and its height, the comb toward the spot undone). x: the mean heat of the gas that glows,
// y: how much gas lies in the way. A function of the place and the eye alone
#if ${lab.gas.steps} > 0
vec2 labGas(vec3 here) {
  vec3 toEye = uLabEye - here;
  float dist = length(toEye);
  vec3 dir = toEye / max(dist, 1e-6);
  float mu = max(dot(normalize(here - ST_CENTRE), dir), 0.03);
  float over0 = length(here - ST_CENTRE) - ST_RADIUS;
  float span = min(max(${lab.gas.top.toFixed(3)} - over0, 0.0) / mu, dist);
  float lit = 0.0;
  float tau = 0.0;
  float texel = ${(lab.far.map / lab.sim.tile * lab.far.cell).toFixed(3)} / uLabFar.z;
  for (int k = 0; k < ${lab.gas.steps}; k++) {
    float t0 = span * float(k * k) / ${(lab.gas.steps * lab.gas.steps).toFixed(1)};
    float t1 = span * float((k + 1) * (k + 1)) / ${(lab.gas.steps * lab.gas.steps).toFixed(1)};
    vec3 q = here + dir * (0.5 * (t0 + t1));
    vec3 dq = q - ST_CENTRE;
    float lq = length(dq);
    dq /= lq;
    vec2 lie = vec2(dot(dq, ST_RIGHT), dot(dq, ST_FWD));
    float ring = length(lie);
    vec2 g = ring > 1e-7 ? lie / ring * (atan(ring, -dot(dq, ST_DOWN)) * ST_RADIUS) : vec2(0.0);
    vec2 ds = g - uLabSpot.xy;
    float r = length(ds);
    vec2 cp = uLabSpot.xy + ds * ((r + uLabSpot.z * exp(-(r * r) / (uLabSpot.w * uLabSpot.w))) / max(r, 1e-6));
    float lod = log2(max(max(distance(q, uLabEye) / mu, t1 - t0) * texel, 1.0));
    vec4 m = textureLod(uLabMap, cp / uLabFar.w, lod);
    float away = length(g - uLabPitAt.xy);
    float thin = 0.05 + 0.95 * smoothstep(uLabPit.w * 2.0, uLabPit.w * 3.5, away);
    float ground = m.g * mix(${lab.dome.pen.toFixed(3)}, 1.0, smoothstep(uLabPit.w * 1.7, uLabPit.w * 3.8, r)) - labPit(g);
    float up = lq - ST_RADIUS;
    float dens = uLabGas.x * exp(-max(up - ground, 0.0) / uLabGas.y) + uLabGas.z * exp(-max(up + labPit(g), 0.0) / uLabGas.w);
    float dt = (t1 - t0) * thin * dens;
    lit += exp(-tau) * (1.0 - exp(-dt)) * m.r;
    tau += dt;
  }
  return vec2(lit / max(1.0 - exp(-tau), 1e-5), tau);
}
#endif
// the large tone of the place is the globe's: the light of the globe's own map there, taken so wide that no
// detail of it shows (uLabToneAt: the level of the map and the size of its texel there), against the map's middle
// light, as a share of the heat
float labLight(vec2 muv, float lod) {
  vec2 texel = uLabToneAt.yz * exp2(lod - uLabToneAt.x);
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 4; k++) sum += textureLod(uLabGlobe, muv + texel * (vec2(float(k & 1), float(k >> 1)) - 0.5), lod).rgb;
  return max(dot(sum, vec3(0.3, 0.5, 0.2)) * 0.25, 1e-4);
}
float labTone(vec3 here, float band) {
  vec3 md = uLabToMap * normalize(here - ST_CENTRE);
  vec2 muv = vec2(atan(md.x, md.z) / 6.283185307179586 + 0.5, asin(clamp(md.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
  float tone = clamp(pow(labLight(muv, uLabToneAt.x) / uLabTone.x, uLabTone.y), uLabTone.z, uLabTone.w);
#ifndef LAB_BAKE
  // the ground is the globe's own ground: near and far it carries the map's light between two widths (uLabToneFar:
  // the level of the fine width, the level of one pixel at one pixel a cell, the level of the broad width), never
  // finer than a pixel, so that the globe seen from far and the ground seen from near are one pattern
  // at the surface the broad light of the ground is the close picture's own (even), at the hold it is the map's:
  // one share joins them (uLabToneFar.w), a smooth step in the logarithm of the lens's height
  float lod = max(uLabToneFar.x, uLabToneFar.y - log2(max(labSeen(here), 1e-3)));
  if (lod < uLabToneFar.z) tone *= mix(1.0, clamp(pow(labLight(muv, lod) / labLight(muv, uLabToneFar.z), uLabToneWide.x), uLabToneWide.y, uLabToneWide.z), band * uLabToneFar.w);
#endif
  return tone;
}
// the one curve from the heat of the sheet to the heat the ramp shows (lab.json heat.curve: pairs, straight between)
float labCurve(float h) {
${CURVE_GLSL}}
// many cells in one pixel: the light of the pixel is the mean of the cells' lights, not the light of their mean
// heat. The map carries both (red: the heat, blue: the heat through the curve); share: how much of the far map is
// in the pixel
float labMean = 1.0;
#if defined(LAB_FRAG) && !defined(LAB_MAP)
void labMeans(float share) {
  labMean = mix(1.0, clamp(labFarSeen.y / max(labCurve(labFarSeen.x), 1e-4), 0.5, 1.5), share * labFarSeen.z);
}
#endif
vec4 labOut(float heat, float thin, vec3 here, vec3 clip, vec3 view) {
  heat = labCurve(uLabHeat.x + (heat - uLabHeat.x) * labTone(here, (thin - 0.1) / 0.9)) * labMean;
  vec3 shown = texture(uRamp, vec2(clamp(heat, 0.0, 1.0), 0.5)).rgb;
  vec3 col = inverseFilmic(grade(shown, 0.0)) * (1.0 + uLabHazeTint.w * max(heat - 1.0, 0.0));
  vec3 upHere = normalize(here - ST_CENTRE);
  float over = length(here - ST_CENTRE) - ST_RADIUS;
  float mu = max(dot(upHere, normalize(uLabEye - here)), 0.0);
#if ${lab.gas.steps} > 0
  vec2 gas = labGas(here);
  float tau = gas.y;
  vec3 glow = texture(uRamp, vec2(clamp(gas.x * uLabHaze.z, 0.0, 1.0), 0.5)).rgb;
  col = col * exp(-tau * ${lab.gas.dim.toFixed(2)}) + inverseFilmic(grade(glow, 0.0)) * (1.0 + uLabHazeTint.w * max(gas.x * uLabHaze.z - 1.0, 0.0)) * (1.0 - exp(-tau));
#else
  float tau = thin * uLabHaze.x * exp(-max(over, 0.0) / uLabHaze.y) / pow(max(mu, 0.02), uLabHaze.w);
  col = col * exp(-tau * 0.6) + inverseFilmic(grade(uLabHazeTint.rgb, 0.0)) * (uLabHaze.z * mix(${lab.haze.own.toFixed(2)}, 1.0, clamp(heat, 0.0, 1.0)) * (1.0 - exp(-tau)));
#endif
  vec2 gb = stImage(here);
  gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
  for (int k = 0; k < ((here.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); k++) {
    float landed = uLandOn * exp(-dot(here - uLand.xyz, here - uLand.xyz) * uLand.w) + uKickOn * exp(-dot(here - uKick.xyz, here - uKick.xyz) * uKick.w);
    vec3 glowMap = textureLod(uGlow, gb, 0.0).rgb;
    col = thrown(col * (1.0 + glowMap * uGlowPlain), col * (1.0 + glowMap * (uGlowBeat * (1.0 + landed))));
    col = thrown(col, col + uLandVeil * landed);
  }
  for (int k = 0; k < (uFlashOn.x + uFlashOn.y > 0.0 ? 1 : 0); k++) {
    float pool = exp(-dot(here - uFlash.xyz, here - uFlash.xyz) * uFlash.w);
    col = thrown(col, col * (1.0 + uFlashOn.x * pool) + uLandVeil * (uFlashOn.y * pool));
  }
  vec2 vq = clip.xy / clip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  // on the globe's side the ground gives way to the globe's own face by the distance from the eye alone, as the
  // standing ground does (place.json onGlobe), reddened by the way to the eye before it leaves
  float away = distance(here, uLabEye) / ST_RADIUS;
  float near = uLabAway.y > 0.0 ? 1.0 - smoothstep(log(uLabAway.x), log(uLabAway.y), log(max(away, 1e-5))) : 1.0;
  col *= uLabAway.w > 0.0 ? mix(vec3(1.0), uLabAwayTint, smoothstep(log(uLabAway.z), log(uLabAway.w), log(max(away, 1e-5)))) : vec3(1.0);
  float held = uLabKeep * near;
  if (uLabKeep <= 0.0 || (uDiag >= 2 && held < 0.5)) discard;
  return diagOut(vec4(col * held, held), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(view));
}`

const DOME_FRAG = /* glsl */ `
precision highp float;
#define LAB_FRAG
uniform vec4 uLabDome;
uniform vec4 uLabCount;
uniform vec4 uLabHeatB;
uniform vec4 uLabMore;
uniform vec4 uLabTime;
in vec3 vS;
in vec3 vPos;
in vec3 vN;
in vec3 vView;
in vec3 vClip;
in float vReal;
in float vPit;
in float vDeep;
in float vCorner;
in float vJunc;
in float vEdge;
in float vTall;
in vec2 vG;
flat in float vSink;
flat in vec2 vAxis;
flat in vec4 vCell;
flat in vec4 vMore;
out vec4 outColor;
${SHAPE_GLSL}
${TAIL_GLSL}
float vnp(vec2 p, float per) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, per);
  float x1 = mod(i.x + 1.0, per);
  return mix(mix(h1(vec2(x0, i.y)), h1(vec2(x1, i.y)), f.x), mix(h1(vec2(x0, i.y + 1.0)), h1(vec2(x1, i.y + 1.0)), f.x), f.y);
}
// the heat that wells up in a cell and spreads: lumps of hotter and cooler gas that are born small about the middle,
// grow outward with the gas and fade at the rim, two generations at any time, one fading in as the other fades out.
// d: the place on the dome (0 at the crown, 1 at the foot), t: the time in seconds
float labWell(vec2 d, float seed, float t) {
  float sum = 0.0;
  for (int k = 0; k < 2; k++) {
    float at = t / ${lab.heat.spread[0]!.toFixed(2)} + 0.5 * float(k) + seed * 7.0;
    float ph = fract(at);
    float gen = floor(at);
    vec2 q = d * exp(-${lab.heat.spread[1]!.toFixed(2)} * (ph - 0.5));
    vec2 o = vec2(37.0 * fract(gen * 0.6180339 + seed), 91.0 * fract(gen * 0.3819660 + seed * 3.0));
    float n = 0.6 * vn(q * ${lab.heat.spread[2]!.toFixed(2)} + o) + 0.4 * vn(q * ${(lab.heat.spread[2]! * 2.3).toFixed(2)} - o);
    sum += n * (1.0 - abs(2.0 * ph - 1.0));
  }
  return sum;
}
// small hot points on a cell: places where the hot gas under the cooler top is seen, a few px wide. They are born
// about the cell, ride outward with its gas and go, two generations at any time, so none comes on or goes off
// faster than a cell lives. q: the place from the cell's middle in units of the stage, px: a pixel in those units
float labSparks(vec2 q, float seed, float t, float px) {
  float sum = 0.0;
  for (int k = 0; k < 2; k++) {
    float at = t / ${(lab.heat.spark?.[3] ?? 6).toFixed(2)} + 0.5 * float(k) + seed * 3.0;
    float ph = fract(at);
    float gen = floor(at);
    float zoom = exp(-${(lab.heat.spark?.[4] ?? 1).toFixed(2)} * (ph - 0.5)) / ${(lab.heat.spark?.[1] ?? 0.012).toFixed(4)};
    vec2 g = q * zoom + vec2(17.0 * fract(gen * 0.6180339 + seed), 29.0 * fract(gen * 0.3819660 + seed * 5.0));
    vec2 i = floor(g);
    vec2 c = i + 0.3 + 0.4 * vec2(h1(i + 3.1), h1(i + 7.7));
    float r = clamp(px * zoom * (${(lab.heat.spark?.[6] ?? 1.2).toFixed(2)} + ${(lab.heat.spark?.[7] ?? 1.6).toFixed(2)} * h1(i + 5.0)), 0.02, 0.3);
    sum += step(${(1 - (lab.heat.spark?.[2] ?? 0.2)).toFixed(3)}, h1(i + 11.0)) * (1.0 - smoothstep(${(lab.heat.spark?.[8] ?? 0.4).toFixed(2)} * r, r, length(g - c))) * min(2.0 - abs(4.0 * ph - 2.0), 1.0) * (1.0 - smoothstep(0.12, 0.3, px * zoom));
  }
  return min(sum, 1.0);
}
void main() {
  vec3 s = normalize(vS);
  float seed = vCell.x;
  float a = acos(clamp(s.z, -1.0, 1.0));
  float rho = a / uLabDome.x;
  vec2 u = length(s.xy) > 1e-6 ? normalize(s.xy) : vec2(1.0, 0.0);
  vec2 d = u * rho;
  float groove = labLobes(d, seed, 0.3);
  float join = labJoin(vG);
  float vein = labLobes(d, seed, 0.09) * smoothstep(0.2, 0.6, rho) * smoothstep(0.3, 0.55, vn(vG * uLabJoin.w * 4.3 + 77.0));
  float flow = uLabTime.x * uLabTime.y;
  // the fibres run from the middle of the cell to its lane and bend a little on their way; the gas runs along
  // them, so their pattern moves that way with the time
  float off = uLabTime.z;
#if ${T.on ? 1 : 0}
  vec2 v = labFan(d, seed);
  float tr = length(v);
#else
  vec2 v = d + vAxis * off;
#endif
  float along = length(v) / (1.0 + off);
  float ang = atan(vAxis.x * v.y - vAxis.y * v.x, dot(vAxis, v));
  float run = -${lab.fibre.slow.toFixed(2)} * log(1.0 - min(along, ${(lab.fibre.slow * 0.95).toFixed(3)}) / ${lab.fibre.slow.toFixed(2)});
  ang += 0.15 * sin(along * 4.0 + seed) * along + ${lab.fibre.bend.toFixed(2)} * (vn(vG * uLabJoin.w * 2.5 + 3.3) + 0.5 * vn(vG * uLabJoin.w * 6.1 - 8.7) - 0.75) * along;
  float turn = ang / 6.2831853 + 0.5;
#if ${T.on ? 1 : 0}
  // the strands lie along the tubes
  vec4 tb = labTubes(d, seed, run - flow);
  turn = tb.w;
#endif
  float qSize = ${((lab.fibre as { size?: number }).size ?? 0) > 0 ? 'clamp(vCell.z / ' + ((lab.fibre as { size?: number }).size ?? 1).toFixed(4) + ', 0.4, 3.0)' : '1.0'};
  vec3 per = max(floor(uLabCount.xyz * 6.2831853 * qSize + 0.5), 3.0);
  vec2 across = vec2(-v.y, v.x) / max(dot(v, v), 1e-8);
  float wa = length(vec2(dot(dFdx(v), across), dot(dFdy(v), across)));
  float fa = vnp(vec2(turn * per.x + floor(seed * 31.0), (run - flow) * qSize * ${lab.fibre.along[0]!.toFixed(2)} + seed), per.x);
  float fb = vnp(vec2(turn * per.y + floor(seed * 77.0), (run - flow) * qSize * ${lab.fibre.along[1]!.toFixed(2)} - seed), per.y);
  float fc = vnp(vec2(turn * per.z + floor(seed * 13.0), (run - flow) * qSize * ${lab.fibre.along[2]!.toFixed(2)} + seed * 2.0), per.z);
  float ka = 1.0 - smoothstep(0.17, 0.33, wa * per.x / 6.2831853);
  float kb = 1.0 - smoothstep(0.17, 0.33, wa * per.y / 6.2831853);
  float kc = 1.0 - smoothstep(0.17, 0.33, wa * per.z / 6.2831853);
  // the fibres are rays of the fan: hot threads with cooler matter between them, three sizes
  float ridge = 1.0 - abs(2.0 * fc - 1.0);
  float ridgeB = 1.0 - abs(2.0 * fb - 1.0);
  float bunch = smoothstep(0.3, 0.7, 0.6 * mix(0.5, fb, kb) + 0.4 * mix(0.5, fa, ka));
  float ridgeA = 1.0 - abs(2.0 * fa - 1.0);
  // knots of hotter gas ride outward along the strands: the flow from the middle to the lane is seen in them
  float bead = vnp(vec2(turn * per.y + floor(seed * 41.0), (run - flow) * ${lab.fibre.beads[1]!.toFixed(2)} + seed * 3.0), per.y);
  float thread = clamp(mix(0.3, max(max(ridge * ridge * ridge, 0.7 * ridgeB * ridgeB * ridgeB * ridgeB), ${lab.fibre.thick.toFixed(2)} * mix(0.5, ridgeA * ridgeA, ka)), kc) * (0.45 + 0.9 * bunch) * (1.0 + ${lab.fibre.beads[0]!.toFixed(2)} * kb * (2.0 * smoothstep(0.25, 0.75, bead) - 1.0)), 0.0, 1.0);
#ifdef LAB_MAP
  vec4 pn = vec4(0.0, 0.0, 1.0, 1.0);
#else
  vec4 pn = labPen(vG, vReal, vPit, flow, dFdx(vG), dFdy(vG));
  if (pn.w < 0.0) discard;
#endif
  float pen = pn.x;
  float age = vCell.y;
  // a cell is born cool and small in the lane and warms as its ground grows; it cools as it goes
  float life = mix(${lab.heat.life[0]!.toFixed(2)}, ${lab.heat.life[1]!.toFixed(2)}, smoothstep(${lab.heat.life[2]!.toFixed(2)}, ${lab.heat.life[3]!.toFixed(2)}, age)) * mix(${lab.heat.born[0]!.toFixed(2)}, 1.0, smoothstep(${lab.heat.born[1]!.toFixed(2)}, ${lab.heat.born[2]!.toFixed(2)}, vMore.y));
  // the heat of a cell: the heat of the place, which runs over the borders, combed into hot fibres with cooler
  // matter between them and many small hot points along the fibres
  float wide = 0.6 * vn(vG * uLabJoin.w + 5.3) + 0.4 * vn(vG * uLabJoin.w * 2.3 - 17.1);
  float mott = 0.4 * vn(vG * uLabJoin.w * 3.7 + 9.1) + 0.35 * vn(vG * uLabJoin.w * 8.3 - 4.7) + 0.25 * vn(vG * uLabJoin.w * 17.0 + 2.9);
  // (a) the heat of the sheet: hottest where the gas wells up, in the middle of a cell, falling evenly to the lane
  // where it sinks. The edge of the hot middle is drawn out into the fibres, bright with dark between them; where
  // the field of the place joins two cells the heat runs over the border. The lane is where the heat falls: a thin
  // dark line in the bottom of the valley, wide where three cells meet, gone where two cells are of one piece
  float plan = min(vEdge, 1.5);
  vec2 b1 = ${lab.heat.stray.toFixed(2)} * (0.12 + 0.3 * fract(seed * 7.13)) * vec2(cos(6.2831853 * fract(seed * 3.71)), sin(6.2831853 * fract(seed * 3.71)));
  vec2 b2 = ${lab.heat.stray.toFixed(2)} * (0.25 + 0.35 * fract(seed * 5.37)) * vec2(cos(6.2831853 * fract(seed * 9.19)), sin(6.2831853 * fract(seed * 9.19)));
  float r1 = ${lab.heat.wide.toFixed(2)} * (0.24 + 0.2 * fract(seed * 2.31));
  float r2 = ${lab.heat.wide.toFixed(2)} * (0.16 + 0.16 * fract(seed * 4.87));
  vec2 b3 = ${lab.heat.stray.toFixed(2)} * (0.3 + 0.35 * fract(seed * 6.91)) * vec2(cos(6.2831853 * fract(seed * 1.93)), sin(6.2831853 * fract(seed * 1.93)));
  float r3 = ${lab.heat.wide.toFixed(2)} * (0.14 + 0.14 * fract(seed * 8.43));
  float blotch = max(max(exp(-dot(d - b1, d - b1) / (r1 * r1)), 0.9 * exp(-dot(d - b2, d - b2) / (r2 * r2))), 0.8 * exp(-dot(d - b3, d - b3) / (r3 * r3)));
#if ${CU ? 1 : 0}
  float fall = plan;
#else
  float fall = max(plan, min(sin(a) / sin(uLabDome.x) * uLabMore.x * ${lab.heat.round.toFixed(3)}, 1.5));
#endif
  float rise = mix(blotch * pow(max(1.0 - fall * fall, 0.0), uLabHeatB.x), 1.0, ${lab.join.merge.toFixed(2)} * smoothstep(0.55, 0.95, join));
  float fan = 0.1 * mix(0.5, fa, ka) + 0.35 * mix(0.5, fb, kb) + 0.55 * mix(0.5, fc, kc);
#if ${T.on ? 1 : 0}
  // the flanks of a cell are hotter than its top in a few broad lobes round it: the gas that has cooled on the top
  // lies over the hot gas there no more
  float ring = ${(lab.heat.ring?.[0] ?? 0).toFixed(2)} * smoothstep(${(lab.heat.ring?.[1] ?? 0.3).toFixed(2)}, ${(lab.heat.ring?.[2] ?? 0.8).toFixed(2)}, plan) * smoothstep(0.3, 0.7, vnq(vec2(tb.w * ${(lab.heat.ring?.[3] ?? 3).toFixed(1)} + floor(seed * 23.0), seed * 11.0), ${(lab.heat.ring?.[3] ?? 3).toFixed(1)}));
#else
  float ring = 0.0;
#endif
  float x = ${(lab.heat.blot ?? 1).toFixed(2)} * rise + ring + 2.0 * uLabHeatB.y * smoothstep(0.1, 0.5, along) * (fan - 0.5) + uLabHeat.z * (mix(mott, labWell(d, seed, uLabTime.x), ${lab.heat.spread[3]!.toFixed(2)}) - 0.5);
  float middle = smoothstep(${lab.heat.patch[0]!.toFixed(2)}, ${lab.heat.patch[1]!.toFixed(2)}, x);
  float top = mix(uLabHeatB.w, 1.0, middle) * (${lab.heat.tone[0]!.toFixed(2)} + ${lab.heat.tone[1]!.toFixed(2)} * wide);
  // the gas wells up in a dimple a little cooler than the crest round it
  top *= 1.0 - ${lab.heat.dimple[0]!.toFixed(2)} * exp(-rho * rho / ${(lab.heat.dimple[1]! * lab.heat.dimple[1]!).toFixed(4)});
  float cell = top * mix(1.0, mix(${lab.fibre.cold.toFixed(2)}, uLabHeat.w, thread), uLabHeatB.z * smoothstep(${(T.on ? T.silk[0]! : 0.04).toFixed(2)}, ${(T.on ? T.silk[1]! : 0.4).toFixed(2)}, along));
  cell *= 1.0 + ${(2 * lab.heat.fine[0]!).toFixed(3)} * (labWell(d * ${lab.heat.fine[1]!.toFixed(2)}, seed + 0.37, uLabTime.x) - 0.5);
#if ${Q && T.on ? 1 : 0}
  // a cell as a cushion: its light is one broad soft blob with an uneven outline, lobed round the cell, moved by
  // the swells that ride outward and fringed by the fine fibres; round it the gas is cooler down to the seam. On
  // the top lie soft cooler patches that ride outward too, and a cooler navel where the gas wells up
  float qWell = labWell(d * ${(Q?.patch[1] ?? 0.5).toFixed(2)}, seed, uLabTime.x);
  float qLobe = vnq(vec2(tb.w * ${(Q?.blob[6] ?? 4).toFixed(1)} + floor(seed * 23.0), seed * 11.0), ${(Q?.blob[6] ?? 4).toFixed(1)});
  float qEdge = ${(Q?.blob[0] ?? 0.6).toFixed(3)} + ${(Q?.blob[1] ?? 0).toFixed(3)} * (qLobe - 0.5) + ${(Q?.blob[2] ?? 0).toFixed(3)} * (qWell - 0.5) + ${(Q?.blob[3] ?? 0).toFixed(3)} * (fan - 0.5) * smoothstep(${(Q?.fibre[1] ?? 0.05).toFixed(2)}, ${(Q?.fibre[2] ?? 0.4).toFixed(2)}, tr);
  float qBlob = 1.0 - smoothstep(qEdge - ${(Q?.blob[4] ?? 0.2).toFixed(3)}, qEdge + ${(Q?.blob[4] ?? 0.2).toFixed(3)}, plan);
  float qPatch = smoothstep(${(Q?.patch[2] ?? 0.5).toFixed(2)}, ${(Q?.patch[3] ?? 0.7).toFixed(2)}, labWell(d * qSize * ${((Q?.patch[1] ?? 0.5) * 1.7).toFixed(2)}, seed + 0.53, uLabTime.x));
  cell = (${lab.heat.tone[0]!.toFixed(2)} + ${lab.heat.tone[1]!.toFixed(2)} * wide) * mix(${(Q?.navel[0] ?? 1).toFixed(2)}, 1.0, smoothstep(0.0, ${(Q?.navel[1] ?? 0.4).toFixed(2)}, tr)) * mix(${(Q?.blob[5] ?? 0.4).toFixed(2)}, 1.0, qBlob) * (1.0 - ${(Q?.patch[0] ?? 0).toFixed(2)} * qPatch) * max(1.0 + smoothstep(${(Q?.fibre[1] ?? 0.05).toFixed(2)}, ${(Q?.fibre[2] ?? 0.4).toFixed(2)}, tr) * (${(2 * (Q?.fibre[0] ?? 0)).toFixed(3)} * (fan - 0.5) + ${(Q?.fibre[3] ?? 0).toFixed(3)} * (thread - 0.3)), 0.25) * (1.0 + ${(2 * (Q?.grain?.[0] ?? 0)).toFixed(3)} * (labWell(d * qSize * ${(Q?.grain?.[1] ?? 2).toFixed(2)}, seed + 0.37, uLabTime.x) - 0.5)) * (1.0 + ${(Q?.rim?.[0] ?? 0).toFixed(2)} * smoothstep(${(Q?.rim?.[1] ?? 0.5).toFixed(2)}, ${(Q?.rim?.[2] ?? 0.75).toFixed(2)}, plan) * (smoothstep(${(Q?.rim?.[3] ?? 0.45).toFixed(2)}, ${(Q?.rim?.[4] ?? 0.7).toFixed(2)}, mix(0.5, fc, kc)) - ${(Q?.rim?.[5] ?? 0.35).toFixed(2)}));
  float qRise = ${(Q?.petal?.[6] ?? 0).toFixed(3)} * smoothstep(${(Q?.petal?.[7] ?? 0.3).toFixed(2)}, 1.0, plan);
  float qPa = vnp(vec2(turn * per.y + floor(seed * 19.0), (run - flow) * qSize * ${(Q?.petal?.[1] ?? 3).toFixed(2)} + seed * 5.0), per.y);
  float qPb = vnp(vec2(turn * per.z + floor(seed * 47.0), (run - flow) * qSize * ${(Q?.petal?.[2] ?? 5).toFixed(2)} - seed * 3.0), per.z);
  cell *= 1.0 - ${(Q?.petal?.[0] ?? 0).toFixed(3)} * smoothstep(${(Q?.fibre[1] ?? 0.05).toFixed(2)}, ${(Q?.fibre[2] ?? 0.4).toFixed(2)}, tr) * (1.0 - smoothstep(${(Q?.petal?.[3] ?? 0.4).toFixed(2)} + qRise, ${(Q?.petal?.[4] ?? 0.6).toFixed(2)} + qRise, ${(1 - (Q?.petal?.[5] ?? 0.5)).toFixed(2)} * mix(0.5, qPa, kb) + ${(Q?.petal?.[5] ?? 0.5).toFixed(2)} * mix(0.5, qPb, kc)));
#endif
  float c0 = ${lab.heat.crease[0]!.toFixed(3)} * (vn(vG * uLabJoin.w * 2.9 + 41.0) + 0.5 * vn(vG * uLabJoin.w * 7.3 - 13.0)) / 1.5;
  float deep = isnan(vDeep) || isinf(vDeep) ? 1.0 : vDeep;
  float lane = smoothstep(c0 * (1.0 - join), c0 * (1.0 - join) + ${lab.heat.crease[1]!.toFixed(3)}, deep);
  
  float edgeD = 1.0 - plan;
  float laneWide = (${lab.heat.lane[0]!.toFixed(3)} + ${lab.heat.lane[1]!.toFixed(3)} * smoothstep(0.4, 0.75, c0 / ${lab.heat.crease[0]!.toFixed(3)})) * (1.0 - 0.7 * join);
#if ${T.on ? 1 : 0}
  float laneTube = ${T.finger[3]!.toFixed(2)} * (1.0 - smoothstep(0.0, 0.8, 1.0 - abs(tb.x)));
#else
  float laneTube = 0.0;
#endif
  // an old cell's rim breaks: the dark threads between its lobes grow from the rim to the middle and darken, so it
  // falls into pieces before it fades
  float old = smoothstep(${lab.heat.breaks[0]!.toFixed(2)}, ${lab.heat.breaks[1]!.toFixed(2)}, age);
  float veins = labLobes(d, seed, 0.05 + 0.3 * rho + 0.12 * old) * smoothstep(mix(0.1, 0.0, old), mix(0.6, 0.2, old), rho);
  cell *= (1.0 - mix(${lab.heat.vein.toFixed(2)}, ${lab.heat.breaks[2]!.toFixed(2)}, old) * veins) * (1.0 - ${lab.heat.groove.toFixed(2)} * groove * smoothstep(0.1, 0.5, rho)) * (${Q?.seam ? 1 : 0} > 0 ? 1.0 : mix(${lab.heat.crease[2]!.toFixed(2)}, 1.0, smoothstep(${(lab.heat.lane[3] ?? 0).toFixed(2)} * laneWide, laneWide, edgeD + ${lab.heat.lane[2]!.toFixed(2)} * laneWide * (fan - 0.5) - laneTube))) * mix(${lab.heat.shade[0]!.toFixed(2)}, 1.0, smoothstep(0.0, ${lab.heat.shade[1]!.toFixed(2)} * (0.4 + 1.2 * smoothstep(0.3, 0.8, c0 / ${lab.heat.crease[0]!.toFixed(3)})), max(1.0 - fall, 0.0)));
#if ${T.on ? 1 : 0}
  // the heat of a tube: hot on its crest, cold in the groove between two tubes, where the gas of both sinks a
  // little; a groove finer than a pixel is the mean of both
  float tSeen = 1.0 - smoothstep(0.25, 0.6, wa * tb.z / 6.2831853);
  float tAcross = smoothstep(0.0, ${T.heat[2]!.toFixed(2)}, 1.0 - abs(tb.x) / labTubeWide(plan));
  cell *= mix(1.0, mix(${T.heat[0]!.toFixed(2)}, ${T.heat[1]!.toFixed(2)}, tAcross), tSeen * mix(${T.crown.toFixed(2)}, 1.0, smoothstep(${T.from[0]!.toFixed(2)}, ${T.from[1]!.toFixed(2)}, tr)) * smoothstep(0.03, 0.2, tr));
  // broad swells of hotter and cooler gas ride outward with the flow, a few round the cell; they come new from the
  // middle and go down at the lane, so the cell's mean light does not follow them
  cell *= 1.0 + ${T.lump[0]!.toFixed(2)} * (2.0 * vnq(vec2(tb.w * ${T.lump[2]!.toFixed(1)} + floor(seed * 57.0), (run - flow) * ${T.lump[1]!.toFixed(2)} + seed * 7.0), ${T.lump[2]!.toFixed(1)}) - 1.0) * smoothstep(0.0, 0.25, tr);
  cell *= mix(1.0, ${lab.heat.crease[2]!.toFixed(2)}, labPart(tb, plan, age, seed));
#endif
  // the folds between the streams that run from the middle to each lane: dark threads toward the places where
  // three cells meet
  cell *= 1.0 - ${lab.heat.fold[0]!.toFixed(2)} * smoothstep(${lab.heat.fold[1]!.toFixed(2)}, 1.0, vCorner + 0.08 * (fan - 0.5)) * smoothstep(0.15, 0.6, plan);
  cell *= 1.0 - ${(lab.heat.pit ?? 0).toFixed(2)} * vJunc;
  float bundle = pn.y;
  float warm = uLabHeat.y * cell * life * mix(${lab.heat.near.toFixed(2)}, 1.0, smoothstep(2.4, 4.0, vReal / uLabPit.w));
  warm = warm < ${lab.heat.knee[0]!.toFixed(2)} ? warm : ${lab.heat.knee[0]!.toFixed(2)} + ${(lab.heat.knee[1]! - lab.heat.knee[0]!).toFixed(3)} * (1.0 - exp(-(warm - ${lab.heat.knee[0]!.toFixed(2)}) / ${(lab.heat.knee[1]! - lab.heat.knee[0]!).toFixed(3)}));
#if ${Q?.seam ? 1 : 0}
  // the seam: on the border both cells have the heat of the place, the same from either side, so no line stands
  // there; the cell's own heat comes in over the lane's width, sooner along a fibre
  float qSeam = smoothstep(0.0, laneWide, edgeD);
  qSeam = clamp(qSeam + ${(4 * lab.heat.lane[2]!).toFixed(2)} * (fan - 0.5) * qSeam * (1.0 - qSeam), 0.0, 1.0);
  warm = mix(uLabHeat.y * ${lab.heat.crease[2]!.toFixed(2)} * (${(Q?.seam?.[0] ?? 0.7).toFixed(2)} + ${(Q?.seam?.[1] ?? 0.6).toFixed(2)} * vn(vG * ${(Q?.seam?.[2] ?? 40).toFixed(1)} + 23.0)) * (1.0 - ${(lab.heat.pit ?? 0).toFixed(2)} * vJunc), warm, qSeam);
#endif
  float heat = pen > 0.999 ? uLabHeat.y * bundle : mix(warm, uLabHeat.y * bundle, pen);
  // small hot points in the lanes
  vec2 gq = vG * 90.0;
  vec2 gi = floor(gq);
  float lit = step(${lab.heat.points.toFixed(2)}, h1(gi + 17.0)) * (1.0 - smoothstep(0.1, 0.16 + 0.26 * h1(gi + 3.0), length(gq - gi - 0.3 - 0.4 * vec2(h1(gi), h1(gi + 5.0)))));
  heat += uLabHeatMore.w * lit * (1.0 - smoothstep(0.02, 0.2, edgeD)) * (1.0 - pen);
  // thin hot threads stand in the bottom of the lane, here and there
  heat += ${lab.heat.thin[0]!.toFixed(2)} * (1.0 - smoothstep(0.0, ${lab.heat.thin[1]!.toFixed(3)}, abs(edgeD))) * smoothstep(0.58, 0.78, vn(vG * ${lab.heat.thin[2]!.toFixed(1)} + 11.0)) * (1.0 - pen);
  vec2 sq = d * vCell.z;
  heat += ${(lab.heat.spark?.[0] ?? 0).toFixed(2)} * labSparks(sq, seed, uLabTime.x, max(length(dFdx(sq)), length(dFdy(sq)))) * mix(${(lab.heat.spark?.[5] ?? 0.3).toFixed(2)}, 1.0, smoothstep(${(lab.heat.spark?.[9] ?? 0.45).toFixed(2)}, ${(lab.heat.spark?.[10] ?? 0.85).toFixed(2)}, plan)) * (1.0 - ${(lab.heat.spark?.[11] ?? 1).toFixed(2)} * smoothstep(0.93, 1.0, plan)) * (1.0 - pen);
  heat *= pn.z;
  // (b) the angle of view: the ground has no lamp. A look that meets the surface aslant meets shallower, cooler gas:
  // the heat times a darkening by the angle between the surface's normal and the eye (heat.graze: at a look along
  // the surface, and the cosine at which it is 1). In the valley between two cells the normal is the ground's own
#ifdef LAB_MAP
  float law = 1.0;
  float lawFar = 1.0;
#else
  vec3 up = normalize(vPos - ST_CENTRE);
  vec3 toEye = normalize(uLabEye - vPos);
  vec3 nn = normalize(mix(vN, up, max(smoothstep(${lab.dome.soft[0]!.toFixed(2)}, ${lab.dome.soft[1]!.toFixed(2)}, plan), vSink)));
  float lawFar = mix(${lab.heat.graze[0]!.toFixed(2)}, 1.0, clamp(abs(dot(up, toEye)) / ${lab.heat.graze[1]!.toFixed(2)}, 0.0, 1.0));
  float law = mix(lawFar, mix(${lab.heat.graze[0]!.toFixed(2)}, 1.0, clamp(abs(dot(nn, toEye)) / ${lab.heat.graze[1]!.toFixed(2)}, 0.0, 1.0)), ${(lab.heat.graze[2] ?? 1).toFixed(2)});
#endif
  heat = uLabHeat.x + heat * law;
#ifdef LAB_MAP
  outColor = vec4(heat, vTall, labCurve(heat), 1.0);
#else
  vec2 gx = dFdx(vG);
  vec2 gy = dFdy(vG);
  if (vSink > 0.0) {
    heat = mix(heat, uLabHeat.x + (labFar(vG, vReal, flow, pn, gx, gy) - uLabHeat.x) * lawFar, vSink);
    labMeans(vSink);
  }
  outColor = labOut(heat, 0.1 + 0.9 * smoothstep(uLabPit.w * 2.0, uLabPit.w * 3.5, vPit), vPos, vClip, vView);
#endif
}`

const FLOOR_VERT = /* glsl */ `
precision highp float;
out vec3 vPos;
out vec2 vG;
out vec3 vView;
out vec3 vClip;
${SHAPE_GLSL}
void main() {
#ifdef LAB_PIT
  vec2 g = uLabPitAt.xy + position.x * vec2(cos(position.y), sin(position.y));
#else
  vec2 g = position.x * vec2(cos(position.y), sin(position.y));
#endif
  vec3 p = labBall(g, -0.004 - labPit(g));
  vG = g;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FLOOR_FRAG = /* glsl */ `
precision highp float;
#define LAB_FRAG
uniform vec4 uLabTime;
in vec3 vPos;
in vec2 vG;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${SHAPE_GLSL}
${TAIL_GLSL}
void main() {
#ifdef LAB_PIT
  if (length(vG - uLabPitAt.xy) > uLabPitAt.z + 0.02) discard;
#else
  if (length(vG - uLabPitAt.xy) < uLabPitAt.z) discard;
#endif
  float um = labUmbra(vG);
  vec2 q = (vG - uLabPitAt.xy) * 26.0;
  float dots = sin(q.x * 1.7 + 2.0 * sin(q.y * 1.3)) * sin(q.y * 2.1 + 1.5 * sin(q.x * 0.9));
  float heat = 0.5 * uLabHeat.x + um * (${lab.spot.floor[0]!.toFixed(3)} + ${lab.spot.floor[1]!.toFixed(3)} * max(dots, 0.0));
  // where the cells are too small to be things the floor is the ground: the place in the cells' own chart (the
  // comb toward the spot undone), the map of the cells there
  vec2 ds = vG - uLabSpot.xy;
  float r = length(ds);
  vec2 chartPlace = uLabSpot.xy + ds * ((r + uLabSpot.z * exp(-(r * r) / (uLabSpot.w * uLabSpot.w))) / max(r, 1e-6));
  float flow = uLabTime.x * uLabTime.y;
#ifdef LAB_BAKE
  float far = 1.0;
#else
  float seen = labSeen(vPos);
  float far = 1.0 - smoothstep(uLabFar.x, uLabFar.y, seen);
#endif
  vec2 gx = dFdx(chartPlace);
  vec2 gy = dFdy(chartPlace);
  vec4 pn = labPen(chartPlace, r, length(vG - uLabPitAt.xy), flow, gx, gy);
  // between the threads of the penumbra the floor is the same threads, a little deeper and cooler
  heat = mix(heat, uLabHeat.x + uLabHeat.y * pn.y * pn.z, max(pn.x, 1.0 - smoothstep(uLabPit.w * 1.7, uLabPit.w * 3.8, r)) * smoothstep(0.75, 0.95, length(vG - uLabPitAt.xy) / uLabPit.w));
  #ifdef LAB_BAKE
  float blur = 1.0;
#else
  // a cell smaller in the picture than a few pixels is no grain but the mean of the map there
  float blur = mix(${lab.far.blur[2]!.toFixed(1)}, 1.0, smoothstep(${lab.far.blur[0]!.toFixed(1)}, ${lab.far.blur[1]!.toFixed(1)}, seen));
#endif
  if (far > 0.0 && pn.w > 0.0) {
    heat = mix(heat, labFar(chartPlace, r, flow, pn, gx * blur, gy * blur), far);
    labMeans(far);
  }
#ifdef LAB_BAKE
  // the far twin: the ground from straight above, no law of the view, no gas, none of the flare's lights, as the
  // display colour of the picture
  heat = labCurve(uLabHeat.x + (heat - uLabHeat.x) * labTone(vPos, 0.0)) * labMean;
  vec3 lit = inverseFilmic(grade(texture(uRamp, vec2(clamp(heat, 0.0, 1.0), 0.5)).rgb, 0.0)) * (1.0 + uLabHazeTint.w * max(heat - 1.0, 0.0));
  lit = clamp((lit * (2.51 * lit + 0.03)) / (lit * (2.43 * lit + 0.59) + 0.14), 0.0, 1.0);
  outColor = vec4(mix(lit * 12.92, 1.055 * pow(lit, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), lit)), 1.0);
#else
  float mu = abs(dot(normalize(vPos - ST_CENTRE), normalize(uLabEye - vPos)));
  heat = uLabHeat.x + (heat - uLabHeat.x) * mix(${lab.heat.graze[0]!.toFixed(2)}, 1.0, clamp(mu / ${lab.heat.graze[1]!.toFixed(2)}, 0.0, 1.0));
  outColor = labOut(heat, 0.1 + 0.9 * smoothstep(uLabPit.w * 2.0, uLabPit.w * 3.5, length(vG - uLabPitAt.xy)), vPos, vClip, vView);
#endif
}`

// the thin gas over the ground seen against the sky beyond the limb: the same haze as over the ground (labOut), by
// the nearest way of the sight line past the ball alone
const AIR_VERT = /* glsl */ `
precision highp float;
out vec3 vPos;
out vec3 vView;
${SHAPE_GLSL}
void main() {
  vec3 p = ST_CENTRE + position * (ST_RADIUS + ${(lab.haze.air[0]! * 8).toFixed(4)});
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const AIR_FRAG = /* glsl */ `
precision highp float;
#define LAB_FRAG
#define LAB_MAP
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${SHAPE_GLSL}
${TAIL_GLSL}
void main() {
  vec3 oc = uLabEye - ST_CENTRE;
  vec3 dir = normalize(vPos - uLabEye);
  float b = dot(oc, dir);
  float past = sqrt(max(dot(oc, oc) - b * b, 0.0)) - ST_RADIUS;
  // the ground's own edge is a mesh and stands a part of a pixel inside the ball's: the gas is drawn over that part
  if (uDiag >= 2 || b > 0.0 || past < -1.5 * fwidth(past) || uLabKeep <= 0.0) discard;
  past = max(past, 0.0);
  float tau = ${lab.haze.air[1]!.toFixed(3)} * exp(-past / ${lab.haze.air[0]!.toFixed(4)});
  vec3 col = inverseFilmic(grade(uLabHazeTint.rgb, 0.0)) * (uLabHaze.z * mix(${lab.haze.own.toFixed(2)}, 1.0, ${lab.haze.air[2]!.toFixed(3)}) * (1.0 - exp(-tau)));
  col *= uGain;
  float away = -b / ST_RADIUS;
  float near = uLabAway.y > 0.0 ? 1.0 - smoothstep(log(uLabAway.x), log(uLabAway.y), log(max(away, 1e-5))) : 1.0;
  col *= uLabAway.w > 0.0 ? mix(vec3(1.0), uLabAwayTint, smoothstep(log(uLabAway.z), log(uLabAway.w), log(max(away, 1e-5)))) : vec3(1.0);
  outColor = vec4(col * (uLabKeep * near), 0.0);
}`

type Shared = Record<string, THREE.IUniform>

const WEIGHED = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor } as const

interface Level {
  geometry: THREE.InstancedBufferGeometry
  list: THREE.DataTexture
  data: Float32Array
  mesh: THREE.Mesh
  count: number
  plain: THREE.ShaderMaterial
  laid: THREE.ShaderMaterial
}

interface Bake {
  deg: number
  size: number
  data?: Uint8Array
  axes?: number[]
}

export class LabGround {
  readonly mesh = new THREE.Group()
  private readonly uniforms: Shared
  private readonly floorMaterial: THREE.ShaderMaterial
  private readonly floorLaid: THREE.ShaderMaterial
  private readonly pitMaterial: THREE.ShaderMaterial
  private readonly pitLaid: THREE.ShaderMaterial
  private under!: THREE.Mesh
  private fine!: THREE.Mesh
  private readonly ramp = rampTexture()
  private readonly cells = newCells()
  private readonly cellData = new Float32Array(SLOTS * 8 * 4)
  private readonly cellTexture: THREE.DataTexture
  private readonly levels: Level[] = []
  private readonly parts: { dispose(): void }[] = []
  private readonly screen = new THREE.Matrix4()
  private readonly back = new THREE.Matrix4()
  private readonly frustum = new THREE.Frustum()
  private readonly eye = new THREE.Vector3()
  private readonly size = new THREE.Vector2()
  private readonly at = new THREE.Vector2()
  private readonly ball = new THREE.Sphere()
  private readonly spot = new THREE.Vector2()
  private readonly umbra: number
  private pitBack = 1
  private readonly order: { d: number; i: number; ox: number; oy: number }[][] = [[], [], []]
  private readonly map = new THREE.WebGLRenderTarget(lab.far.map, lab.far.map, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, depthBuffer: true, stencilBuffer: false, generateMipmaps: true, anisotropy: 16 })
  private readonly mapScene = new THREE.Scene()
  private readonly wipe = new THREE.Color()
  private readonly mapEye = new THREE.Camera()
  private readonly mapList = new THREE.DataTexture(new Float32Array(128 * 128 * 4), 128, 128, THREE.RGBAFormat, THREE.FloatType)
  private mapGeometry: THREE.InstancedBufferGeometry | null = null
  private mapTime = Number.NaN
  private readonly start = (plan.seg.terrain.end - plan.seg.terrain.start) / 2 + config.shutterFraction / (2 * config.fps)

  private readonly bakeScene = new THREE.Scene()
  private readonly toStage: THREE.Matrix3

  /** shared: the uniforms of the standing ground's material that the flare and the grade write. map: the globe's
   * own map; toStage: the turn from the map's axes to the stage's. */
  constructor(shared: Shared, map: THREE.Texture, toStage: THREE.Matrix3) {
    this.toStage = toStage.clone()
    const mapWide = (map.image as unknown as { width: number }).width
    const toneLod = Math.log2(Math.max((mapWide * lab.far.tone.deg) / 360, 1))
    const toneTexel = Math.pow(2, toneLod) / mapWide
    const keep = ['uGrade', 'uGlow', 'uBox', 'uLand', 'uKick', 'uFlash', 'uGlowBeat', 'uGlowPlain', 'uLandOn', 'uKickOn', 'uFlashOn', 'uLandVeil', 'uGroundMost', 'uGain', 'uVignette', 'uAspect']
    const uniforms: Shared = {}
    for (const name of keep) uniforms[name] = shared[name]!
    const mid = stage.onGround(stage.spot[0], stage.spot[1])
    chart(mid, this.spot)
    this.pitBack = 1 + lab.spot.back / this.spot.length()
    this.umbra = stage.onGround(stage.spot[0] + stage.umbra[0], stage.spot[1]).distanceTo(mid) * lab.spot.umbra
    this.cellTexture = new THREE.DataTexture(this.cellData, 8, SLOTS, THREE.RGBAFormat, THREE.FloatType)
    this.cellTexture.minFilter = THREE.NearestFilter
    this.cellTexture.magFilter = THREE.NearestFilter
    const d = lab.dome
    const f = lab.fibre
    const ht = lab.heat
    const hz = lab.haze
    const all = {
      ...uniforms,
      uDiag: diagUniform,
      uRamp: { value: this.ramp },
      uLabCells: { value: this.cellTexture },
      uLabEye: { value: new THREE.Vector3() },
      uLabKeep: { value: 1 },
      uLabAway: { value: new THREE.Vector4(0, 0, 0, 0) },
      uLabAwayTint: { value: new THREE.Vector3().fromArray(place.onGlobe.red.tint) },
      uLabDome: { value: new THREE.Vector4(THREE.MathUtils.degToRad(d.arc), d.height, d.round, d.flat) },
      uLabSpot: { value: new THREE.Vector4(this.spot.x, this.spot.y, lab.spot.pull, lab.spot.wide) },
      uLabPitAt: { value: new THREE.Vector4(this.spot.x * (1 + lab.spot.back / this.spot.length()), this.spot.y * (1 + lab.spot.back / this.spot.length()), 0.5, 0) },
      uLabPit: { value: new THREE.Vector4(lab.spot.depth, lab.spot.wall[0]!, lab.spot.wall[1]!, this.umbra) },
      uLabHeat: { value: new THREE.Vector4(ht.floor, ht.body, ht.cool, ht.hot) },
      uLabHeatMore: { value: new THREE.Vector4(ht.knot, ht.edge, ht.pen, ht.glint) },
      uLabHeatB: { value: new THREE.Vector4(ht.core, ht.thread[0]!, ht.thread[1]!, ht.rim) },
      uLabTime: { value: new THREE.Vector4(0, lab.heat.well, f.offset, f.dark) },
      uLabMore: { value: new THREE.Vector4(d.over, d.lobe, d.pen, lab.join.level) },
      uLabJoin: { value: new THREE.Vector4(lab.join.scale, lab.spot.strand[0]!, lab.spot.strand[1]!, lab.join.heat) },
      uLabHaze: { value: new THREE.Vector4(hz.amount, hz.scale, hz.level, hz.power) },
      uLabGas: { value: new THREE.Vector4(lab.gas.skin[0]!, lab.gas.skin[1]!, lab.gas.pool[0]!, lab.gas.pool[1]!) },
      uLabHazeTint: { value: new THREE.Vector4(hz.tint[0]!, hz.tint[1]!, hz.tint[2]!, ht.bloom) },
      uLabCount: { value: new THREE.Vector4(f.counts[0]!, f.counts[1]!, f.counts[2]!, f.root) },
      uLabFar: { value: new THREE.Vector4(lab.far.px[0]!, lab.far.px[1]!, 1, TILE) },
      uLabMap: { value: this.map.texture },
      uLabGlobe: { value: map },
      uLabToMap: { value: toStage.clone().transpose() },
      uLabTone: { value: new THREE.Vector4(lab.far.tone.level, lab.far.tone.power, lab.far.tone.range[0]!, lab.far.tone.range[1]!) },
      uLabToneAt: { value: new THREE.Vector3(toneLod, toneTexel, toneTexel * 2) },
      uLabToneFar: { value: new THREE.Vector4(Math.log2(Math.max((mapWide * lab.far.tone.far.deg) / 360, 1)), Math.log2((lab.far.cell * mapWide) / (2 * Math.PI * stage.radius)), Math.log2(Math.max((mapWide * lab.far.tone.far.broad) / 360, 1)), 0) },
      uLabToneWide: { value: new THREE.Vector3(lab.far.tone.far.power, lab.far.tone.far.range[0]!, lab.far.tone.far.range[1]!) },
    }
    this.uniforms = all
    this.floorMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide })
    this.pitMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, defines: { LAB_PIT: 1 }, uniforms: all, side: THREE.DoubleSide })
    this.pitLaid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, defines: { LAB_PIT: 1 }, uniforms: all, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, ...WEIGHED })
    this.floorLaid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, ...WEIGHED })
    this.parts.push(this.floorMaterial, this.floorLaid, this.pitMaterial, this.pitLaid)
    this.mesh.renderOrder = -6

    const none = new THREE.BufferGeometry()
    none.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
    none.setDrawRange(0, 0)
    const quiet = new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false, depthWrite: false })
    const first = new THREE.Mesh(none, quiet)
    first.frustumCulled = false
    first.renderOrder = -7
    first.onBeforeRender = (renderer, _scene, camera) => this.pick(renderer, camera)
    this.mesh.add(first)
    this.parts.push(none, quiet)

    const caps = [64, 128, 512]
    for (let l = 0; l < 3; l++) {
      const rings = lab.lod.rings[l]!
      const sectors = lab.lod.sectors[l]!
      const pos = new Float32Array((rings + 1) * (sectors + 1) * 3)
      for (let i = 0; i <= rings; i++) {
        for (let j = 0; j <= sectors; j++) {
          const k = (i * (sectors + 1) + j) * 3
          pos[k] = i / rings
          pos[k + 1] = (j / sectors) * Math.PI * 2
        }
      }
      const index = new Uint16Array(rings * sectors * 6)
      let n = 0
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < sectors; j++) {
          const a = i * (sectors + 1) + j
          const b = a + 1
          const c = a + sectors + 1
          index[n++] = a
          index[n++] = c
          index[n++] = b
          index[n++] = b
          index[n++] = c
          index[n++] = c + 1
        }
      }
      const geometry = new THREE.InstancedBufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geometry.setIndex(new THREE.BufferAttribute(index, 1))
      const data = new Float32Array(caps[l]! * caps[l]! * 4)
      const list = new THREE.DataTexture(data, caps[l]!, caps[l]!, THREE.RGBAFormat, THREE.FloatType)
      list.minFilter = THREE.NearestFilter
      list.magFilter = THREE.NearestFilter
      geometry.instanceCount = 0
      const material = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: { ...all, uLabList: { value: list }, uLabMesh: { value: new THREE.Vector2(1 / rings, (Math.PI * 2) / sectors) } }, side: THREE.DoubleSide })
      const laid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: material.uniforms, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, ...WEIGHED })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.frustumCulled = false
      mesh.renderOrder = -6 + l * 0.01
      this.mesh.add(mesh)
      this.levels.push({ geometry, list, data, mesh, count: 0, plain: material, laid })
      this.parts.push(geometry, material, laid, list)
      if (l === 2) {
        // the map of the tile: every cell once more from above (and again across the tile's edges), with the same
        // shader, its heat alone
        const flat = new THREE.InstancedBufferGeometry()
        flat.setAttribute('position', geometry.getAttribute('position'))
        flat.setIndex(geometry.getIndex())
        flat.instanceCount = 0
        this.mapList.minFilter = THREE.NearestFilter
        this.mapList.magFilter = THREE.NearestFilter
        const drawn = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, defines: { LAB_MAP: 1 }, uniforms: { ...all, uLabList: { value: this.mapList }, uLabMesh: { value: new THREE.Vector2(1 / rings, (Math.PI * 2) / sectors) }, uLabMap: { value: null } }, side: THREE.DoubleSide })
        const over = new THREE.Mesh(flat, drawn)
        over.frustumCulled = false
        this.mapScene.add(over)
        this.mapGeometry = flat
        this.parts.push(flat, drawn, this.mapList, this.map)
      }
    }

    const arcs = [0]
    const most = THREE.MathUtils.degToRad(100) * stage.radius
    while (arcs[arcs.length - 1]! < most) {
      const a = arcs[arcs.length - 1]!
      arcs.push(a + Math.max(0.03, a * 0.035))
    }
    const sectors = 256
    const pos = new Float32Array(arcs.length * (sectors + 1) * 3)
    for (let i = 0; i < arcs.length; i++) {
      for (let j = 0; j <= sectors; j++) {
        const k = (i * (sectors + 1) + j) * 3
        pos[k] = arcs[i]!
        pos[k + 1] = (j / sectors) * Math.PI * 2
      }
    }
    const index = new Uint32Array((arcs.length - 1) * sectors * 6)
    let n = 0
    for (let i = 0; i < arcs.length - 1; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = i * (sectors + 1) + j
        const b = a + 1
        const c = a + sectors + 1
        index[n++] = a
        index[n++] = c
        index[n++] = b
        index[n++] = b
        index[n++] = c
        index[n++] = c + 1
      }
    }
    const floor = new THREE.BufferGeometry()
    floor.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    floor.setIndex(new THREE.BufferAttribute(index, 1))
    const under = new THREE.Mesh(floor, this.floorMaterial)
    under.frustumCulled = false
    under.renderOrder = -5.9
    this.mesh.add(under)
    this.under = under
    this.parts.push(floor)
    const pr = 128
    const ps = 256
    const pp = new Float32Array((pr + 1) * (ps + 1) * 3)
    for (let i = 0; i <= pr; i++) {
      for (let j = 0; j <= ps; j++) {
        const k = (i * (ps + 1) + j) * 3
        pp[k] = (i / pr) * 0.6
        pp[k + 1] = (j / ps) * Math.PI * 2
      }
    }
    const pi = new Uint32Array(pr * ps * 6)
    n = 0
    for (let i = 0; i < pr; i++) {
      for (let j = 0; j < ps; j++) {
        const a = i * (ps + 1) + j
        const b = a + 1
        const c = a + ps + 1
        pi[n++] = a
        pi[n++] = c
        pi[n++] = b
        pi[n++] = b
        pi[n++] = c
        pi[n++] = c + 1
      }
    }
    const disc = new THREE.BufferGeometry()
    disc.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    disc.setIndex(new THREE.BufferAttribute(pi, 1))
    const fine = new THREE.Mesh(disc, this.pitMaterial)
    fine.frustumCulled = false
    fine.renderOrder = -5.89
    this.mesh.add(fine)
    this.fine = fine
    this.parts.push(disc)
    const shell = new THREE.SphereGeometry(1, 192, 96)
    const airMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: AIR_VERT, fragmentShader: AIR_FRAG, uniforms: all, side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false, ...WEIGHED })
    const air = new THREE.Mesh(shell, airMaterial)
    air.frustumCulled = false
    const late = new THREE.Group()
    late.renderOrder = 1
    late.add(air)
    this.mesh.add(late)
    this.parts.push(shell, airMaterial)
    const flat = { glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide, depthTest: false, depthWrite: false } as const
    const bakeFloor = new THREE.ShaderMaterial({ ...flat, defines: { LAB_BAKE: 1 } })
    const bakePit = new THREE.ShaderMaterial({ ...flat, defines: { LAB_BAKE: 1, LAB_PIT: 1 } })
    const wideBake = new THREE.Mesh(floor, bakeFloor)
    const fineBake = new THREE.Mesh(disc, bakePit)
    wideBake.frustumCulled = false
    fineBake.frustumCulled = false
    fineBake.renderOrder = 1
    this.bakeScene.add(wideBake, fineBake)
    this.parts.push(bakeFloor, bakePit)
  }

  /** time: seconds from the middle of the terrain segment, as the standing ground takes it. eye: the eye in the
   * stage's own frame. */
  update(time: number, eye: THREE.Vector3, keep = 1, onGlobe = false): void {
    this.mesh.visible = keep > 0
    this.uniforms.uLabKeep!.value = keep
    const g = globalThis as { labGone?: boolean; labStay?: boolean; labFlat?: boolean }
    const away = g.labGone ? [1e-4, 2e-4] : g.labStay ? [1e3, 2e3] : lab.far.away
    ;(this.uniforms.uLabFar!.value as THREE.Vector4).x = g.labFlat ? 1e5 : lab.far.px[0]!
    ;(this.uniforms.uLabFar!.value as THREE.Vector4).y = g.labFlat ? 2e5 : lab.far.px[1]!
    const red = place.onGlobe.red.over
    ;(this.uniforms.uLabAway!.value as THREE.Vector4).set(onGlobe ? away[0]! : 0, onGlobe ? away[1]! : 0, onGlobe ? red[0]! : 0, onGlobe ? red[1]! : 0)
    this.under.material = onGlobe ? this.floorLaid : this.floorMaterial
    this.fine.material = onGlobe ? this.pitLaid : this.pitMaterial
    for (const lv of this.levels) lv.mesh.material = onGlobe ? lv.laid : lv.plain
    ;(this.uniforms.uLabEye!.value as THREE.Vector3).copy(eye)
    const over = Math.max(eye.distanceTo(stage.centre) - stage.radius, 1e-3)
    const hs = lab.far.tone.far.heights
    const band = (globalThis as { labBand?: number }).labBand
    ;(this.uniforms.uLabToneFar!.value as THREE.Vector4).w = band ?? smooth(Math.log(hs[0]!), Math.log(hs[1]!), Math.log(over))
    if (keep <= 0) return
    const now = time + this.start + ((globalThis as { labAhead?: number }).labAhead ?? 0)
    ;(this.uniforms.uLabTime!.value as THREE.Vector4).x = now
    cellsAt(now, this.cells)
    const c = this.cells
    const d = c.diagram
    const px = this.cellData
    for (let i = 0; i < SLOTS; i++) {
      const o = i * 32
      if (!d.on[i]) {
        px.fill(0, o, o + 32)
        continue
      }
      const r = Math.sqrt(d.area[i]! / Math.PI)
      const u = c.u[i]!
      const young = 1 + lab.dome.young * (1 - Math.min(Math.max((u - 0.2) / 0.35, 0), 1))
      px[o] = d.mid[i * 2]!
      px[o + 1] = d.mid[i * 2 + 1]!
      px[o + 2] = r
      px[o + 3] = lab.dome.height * r * young * (lab.dome.born[0]! + (1 - lab.dome.born[0]!) * smooth(lab.dome.born[1]!, lab.dome.born[2]!, r / Math.max(c.full[i]!, 1e-6)))
      px[o + 4] = c.seed[i]!
      px[o + 5] = u
      px[o + 6] = Math.min(r / Math.max(c.full[i]!, 1e-6), 1)
      for (let e = 0; e < EDGES; e++) {
        const on = e < d.count[i]!
        px[o + 8 + e * 2] = on ? d.edges[(i * EDGES + e) * 2]! : 0
        px[o + 9 + e * 2] = on ? d.edges[(i * EDGES + e) * 2 + 1]! : 0
      }
    }
    this.cellTexture.needsUpdate = true
  }

  private warp(x: number, y: number, out: THREE.Vector2): THREE.Vector2 {
    const dx = x - this.spot.x
    const dy = y - this.spot.y
    const s = Math.hypot(dx, dy)
    const w2 = lab.spot.wide * lab.spot.wide
    let r = s
    for (let k = 0; k < 8; k++) {
      const e = lab.spot.pull * Math.exp(-(r * r) / w2)
      r = Math.min(Math.max(r - (r + e - s) / (1 - (2 * r * e) / w2), 0), s)
    }
    const k = r / Math.max(s, 1e-6)
    return out.set(this.spot.x + dx * k, this.spot.y + dy * k)
  }

  /** Which cells are drawn in this pass and how finely: by what the camera sees and by their size in the picture. */
  private pick(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    this.mesh.updateWorldMatrix(true, false)
    this.screen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.mesh.matrixWorld)
    this.frustum.setFromProjectionMatrix(this.screen, THREE.WebGLCoordinateSystem, (camera as THREE.Camera & { reversedDepth?: boolean }).reversedDepth === true)
    this.back.copy(this.mesh.matrixWorld).invert()
    const eye = this.eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(this.back)
    const from = chart(eye, this.at)
    const ex = from.x
    const ey = from.y
    const high = Math.max(eye.distanceTo(stage.centre) - stage.radius, 1e-3)
    const horizon = stage.radius * Math.acos(Math.min(stage.radius / (stage.radius + high), 1)) + 0.6
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 55
    const view = (camera as THREE.PerspectiveCamera).view
    const target = renderer.getRenderTarget()
    const tall = view?.enabled ? view.fullHeight : target ? target.height : renderer.getDrawingBufferSize(this.size).y
    const focal = tall / 2 / Math.tan(THREE.MathUtils.degToRad(fov) / 2)
    const d = this.cells.diagram
    const mean = lab.far.cell * focal
    ;(this.uniforms.uLabFar!.value as THREE.Vector4).z = mean
    const time = (this.uniforms.uLabTime!.value as THREE.Vector4).x
    if (time !== this.mapTime && this.mapGeometry) {
      this.mapTime = time
      const md = this.mapList.image.data as Float32Array
      let n = 0
      for (let i = 0; i < SLOTS && n < 128 * 128 - 4; i++) {
        if (!d.on[i]) continue
        const r = Math.sqrt(d.area[i]! / Math.PI) * 3.2
        const x = d.mid[i * 2]!
        const y = d.mid[i * 2 + 1]!
        const ax = x < r ? 1 : x > TILE - r ? -1 : 0
        const ay = y < r ? 1 : y > TILE - r ? -1 : 0
        for (let c = 0; c < 4; c++) {
          const ox = c & 1 ? ax : 0
          const oy = c & 2 ? ay : 0
          if ((c & 1 && !ax) || (c & 2 && !ay)) continue
          md[n * 4] = i
          md[n * 4 + 1] = ox * TILE
          md[n * 4 + 2] = oy * TILE
          n++
        }
      }
      this.mapGeometry.instanceCount = n
      this.mapList.needsUpdate = true
      const target = renderer.getRenderTarget()
      const xr = renderer.xr.enabled
      renderer.xr.enabled = false
      const alpha = renderer.getClearAlpha()
      renderer.getClearColor(this.wipe)
      renderer.setRenderTarget(this.map)
      renderer.setClearColor(0x000000, 0)
      renderer.clear(true, true, true)
      renderer.render(this.mapScene, this.mapEye)
      renderer.setClearColor(this.wipe, alpha)
      renderer.setRenderTarget(target)
      renderer.xr.enabled = xr
    }
    const bake = (globalThis as { labBake?: Bake }).labBake
    if (bake && !bake.data) this.bake(renderer, bake)
    for (const o of this.order) o.length = 0
    const t0 = Math.floor((ex - horizon) / TILE)
    const t1 = Math.floor((ex + horizon) / TILE)
    const s0 = Math.floor((ey - horizon) / TILE)
    const s1 = Math.floor((ey + horizon) / TILE)
    const p = new THREE.Vector3()
    const w = new THREE.Vector2()
    const reach = (arc: number): number => {
      const chord = 2 * stage.radius * Math.sin(Math.min(Math.max(arc - lab.spot.pull - 0.1, 0) / (2 * stage.radius), Math.PI / 2))
      return mean / Math.sqrt(high * high + chord * chord) - lab.far.px[0]!
    }
    for (let ty = s0; ty <= s1; ty++) {
      for (let tx = t0; tx <= t1; tx++) {
        const ox = tx * TILE
        const oy = ty * TILE
        // a tile or a cell whose nearest ground is too far for a cell to be a thing is left out before any more work
        const nx = Math.max(ox - ex, 0, ex - ox - TILE)
        const ny = Math.max(oy - ey, 0, ey - oy - TILE)
        if (reach(Math.hypot(nx, ny)) < 0) continue
        for (let i = 0; i < SLOTS; i++) {
          if (!d.on[i]) continue
          const mx = d.mid[i * 2]! + ox
          const my = d.mid[i * 2 + 1]! + oy
          if (reach(Math.hypot(mx - ex, my - ey)) < 0) continue
          if (Math.hypot(mx - this.spot.x, my - this.spot.y) < 3.2 * lab.spot.wide) this.warp(mx, my, w)
          else w.set(mx, my)
          const gx = w.x
          const gy = w.y
          const arc = Math.hypot(gx - ex, gy - ey)
          if (arc > horizon || Math.hypot(gx - this.spot.x * this.pitBack, gy - this.spot.y * this.pitBack) < 0.3 * this.umbra) continue
          const r = Math.sqrt(d.area[i]! / Math.PI)
          const full = Math.hypot(gx, gy)
          const al = full / stage.radius
          const sn = full > 1e-6 ? Math.sin(al) / full : 0
          const cs = Math.cos(al)
          p.set(
            stage.centre.x + stage.radius * (up.x * cs + sn * (right.x * gx + fwd.x * gy)),
            stage.centre.y + stage.radius * (up.y * cs + sn * (right.y * gx + fwd.y * gy)),
            stage.centre.z + stage.radius * (up.z * cs + sn * (right.z * gx + fwd.z * gy)),
          )
          this.ball.center.copy(p)
          this.ball.radius = r * 3.2
          if (!this.frustum.intersectsSphere(this.ball)) continue
          const dist = p.distanceTo(eye)
          const size = (2 * r * focal) / dist
          if (mean / dist < lab.far.px[0]!) continue
          const level = size > lab.lod.px[0]! ? 0 : size > lab.lod.px[1]! ? 1 : 2
          this.order[level]!.push({ d: dist, i, ox, oy })
        }
      }
    }
    for (let l = 0; l < 3; l++) {
      const list = this.order[l]!
      list.sort((a, b) => a.d - b.d || a.i - b.i)
      const lv = this.levels[l]!
      const count = Math.min(list.length, lv.data.length / 4)
      for (let k = 0; k < count; k++) {
        const it = list[k]!
        lv.data[k * 4] = it.i
        lv.data[k * 4 + 1] = it.ox
        lv.data[k * 4 + 2] = it.oy
      }
      lv.count = count
      lv.geometry.instanceCount = count
      lv.list.needsUpdate = true
    }
    void formatUniform
  }

  /** The far twin for the globe: the ground where its cells are no things, from straight above every point, in a
   * square picture laid gnomonic about the spot with the map's north up and east to the right, seen from outside
   * (FAR-TWIN.md of the Sun's builder). An eye in the middle of the ball looks out at the spot; the picture is
   * turned left to right so that it is the view from outside. */
  private bake(renderer: THREE.WebGLRenderer, bake: Bake): void {
    const ax = lab.far.level.axes
    const s = new THREE.Vector3().fromArray(ax.spot)
    const east = new THREE.Vector3().fromArray(ax.east)
    const north = new THREE.Vector3().fromArray(ax.north)
    const mid = s.clone().applyMatrix3(this.toStage).multiplyScalar(stage.radius).add(stage.centre)
    const eye = new THREE.PerspectiveCamera(bake.deg, 1, 1, 100)
    eye.position.copy(stage.centre)
    eye.up.copy(north).applyMatrix3(this.toStage)
    eye.lookAt(mid)
    eye.updateMatrixWorld(true)
    eye.projectionMatrix.elements[0]! *= -1
    eye.projectionMatrixInverse.copy(eye.projectionMatrix).invert()
    const to = new THREE.WebGLRenderTarget(bake.size, bake.size, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false })
    const target = renderer.getRenderTarget()
    const xr = renderer.xr.enabled
    const auto = renderer.autoClear
    renderer.xr.enabled = false
    renderer.autoClear = true
    renderer.setRenderTarget(to)
    renderer.render(this.bakeScene, eye)
    const data = new Uint8Array(bake.size * bake.size * 4)
    renderer.readRenderTargetPixels(to, 0, 0, bake.size, bake.size, data)
    renderer.setRenderTarget(target)
    renderer.xr.enabled = xr
    renderer.autoClear = auto
    to.dispose()
    bake.data = data
    bake.axes = [...s.toArray(), ...east.toArray(), ...north.toArray()]
  }

  dispose(): void {
    for (const part of this.parts) part.dispose()
    this.ramp.dispose()
    this.cellTexture.dispose()
  }
}
