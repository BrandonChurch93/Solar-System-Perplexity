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
  return uLabPit.x * (1.0 - smoothstep(uLabPit.y * uLabPit.w, uLabPit.z * uLabPit.w, length(real - uLabSpot.xy)));
}
// the umbra is a pit of its own under the funnel's wall
float labUmbra(vec2 real) {
  return 1.0 - smoothstep(0.55 * uLabPit.w, 1.05 * uLabPit.w, length(real - uLabSpot.xy));
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
// where two cells are of one piece: a field of the place, the same for both sides of a border. 0 a full crease,
// 1 the two run into each other
float labJoin(vec2 chartPlace) {
  return smoothstep(0.36, 0.64, 0.65 * vn(chartPlace * uLabJoin.x + 31.7) + 0.35 * vn(chartPlace * uLabJoin.x * 2.3 - 11.3));
}
#ifdef LAB_FRAG
// the penumbra: threads about the spot, the same for every cell they cross, each of its own length and bend.
// x: how much of the place is penumbra, y: its heat, z: what the umbra's dark leaves, w: under 0 inside the torn
// edge of the umbra
vec4 labPen(vec2 chartPlace, float real, float flow, vec2 fine) {
  vec2 sp = chartPlace - uLabSpot.xy;
  float turnS = atan(sp.y, sp.x);
  float rs = real / uLabPit.w;
  turnS += 0.06 * (vn(vec2(turnS * 7.0, rs * 1.3)) - 0.5) + 0.02 * sin(rs * 5.0 + turnS * 9.0);
  float pa = vn(vec2(turnS * 13.0, rs * 0.5 - flow));
  float pb = vn(vec2(turnS * 45.0 + 3.0, rs * 0.9 - flow));
  float pc = vn(vec2(turnS * 100.0 + 7.0, rs * 1.9 - flow));
  float pd = vn(vec2(turnS * 220.0, rs * 3.1 - flow));
  float wp = length(fine) / max(length(sp), 1e-4);
  float kpb = 1.0 - smoothstep(0.5, 1.1, wp * 45.0);
  float kpc = 1.0 - smoothstep(0.5, 1.1, wp * 100.0);
  float kpd = 1.0 - smoothstep(0.5, 1.1, wp * 220.0);
  // a thread is a level line of the field about the spot: thin near the umbra, wider where it ends among the cells
  float wl = mix(0.03, 0.1, smoothstep(1.3, 3.4, rs));
  float la = mix(2.0 * wl, 1.0 - smoothstep(0.3 * wl, wl, abs(pb - 0.5)), kpb);
  float lb = mix(2.0 * wl, 1.0 - smoothstep(0.3 * wl, wl, abs(pc - 0.47)), kpc);
  float ld = mix(2.0 * wl, 1.0 - smoothstep(0.3 * wl, wl, abs(pd - 0.53)), kpd);
  pb = mix(0.5, pb, kpb);
  pc = mix(0.5, pc, kpc);
  float strand = max(la, max(0.8 * lb, 0.55 * ld));
  float bed = smoothstep(0.35, 0.7, 0.5 * pb + 0.5 * pc);
  float pen = 1.0 - smoothstep(-0.5, 0.5, rs - uLabJoin.y - uLabJoin.z * (pb - 0.5) - 0.5 * uLabJoin.z * (vn(chartPlace * 23.0 + 1.7) - 0.5));
  float tongue = smoothstep(0.62, 0.8, pa) * smoothstep(0.5, 0.7, pc);
  float bundle = uLabHeatMore.z * mix(0.05 + 0.22 * bed, 1.15, strand) * mix(0.5, 1.1, smoothstep(0.3, 0.7, pa)) * mix(0.25, 1.0, smoothstep(1.0, 3.0, rs));
  return vec4(pen, bundle, mix(0.08, 1.0, max(smoothstep(0.95, 2.2, rs), 0.8 * tongue)), rs - 0.84 - 0.2 * pb - 0.12 * pc + 0.4 * tongue);
}
#endif
// the width of a mean cell at a place in pixels of a 1080 frame
float labPx(vec3 here) {
  return uLabFar.z / max(distance(here, uLabEye), 1e-4);
}
#if defined(LAB_FRAG) && !defined(LAB_MAP)
// the ground where its cells are too small in the picture to be things: the same cells at the same places, seen
// from above (a map of the tile drawn from the same table at the same time), with the same penumbra
float labFar(vec2 chartPlace, float real, float flow, vec4 pn, vec2 gx, vec2 gy) {
  float mapped = textureGrad(uLabMap, chartPlace / uLabFar.w, gx / uLabFar.w, gy / uLabFar.w).r;
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
uniform vec4 uLabDome;
uniform vec4 uLabMore;
out vec3 vS;
out vec3 vPos;
out vec3 vN;
out vec3 vView;
out vec3 vClip;
out float vReal;
out float vDeep;
out float vCorner;
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
float real;
float deep;
float tall;
float sink = 0.0;
float corner;
vec3 dome(vec3 s) {
  float a = acos(clamp(s.z, -1.0, 1.0));
  vec2 u = length(s.xy) > 1e-6 ? normalize(s.xy) : vec2(1.0, 0.0);
  float inv = 0.0;
  float m1 = 0.0;
  float m2 = 0.0;
  for (int j = 0; j < ${EDGES}; j++) {
    float e = max(dot(u, edges[j]) * rad, 0.0);
    inv += pow(e, uLabDome.z);
    if (e > m1) { m2 = m1; m1 = e; } else if (e > m2) m2 = e;
  }
  corner = m2 / max(m1, 1e-6);
  float r = rad * pow(max(inv, 1e-9), -1.0 / uLabDome.z);
  float f = (cos(a) - cos(uLabDome.x)) / (1.0 - cos(uLabDome.x));
  float wide = sin(a) / sin(uLabDome.x);
  float groove = labLobes(u * (a / uLabDome.x), seed, 0.3) * (1.0 - smoothstep(0.6, 1.0, a / uLabDome.x));
  float top = 1.0 - pow(max(1.0 - f, 0.0), uLabDome.w);
  vec2 place = mid + u * (r * wide * uLabMore.x);
  // the borders are no straight lines: the ground itself is pushed about a little by a field of the place, the
  // same for both sides of a border
  place += ${lab.join.wobble.toFixed(4)} * (vec2(vn(place * 13.0 + 3.1) + 0.5 * vn(place * 29.0 - 7.0), vn(place * 13.0 - 21.7) + 0.5 * vn(place * 29.0 + 15.3)) - 0.75);
  vG = place;
#ifdef LAB_MAP
  vec2 g = place;
  real = 1e3;
  float low = 1.0;
#else
  vec2 g = labWarp(place);
  real = length(g - uLabSpot.xy);
  float low = mix(uLabMore.z, 1.0, smoothstep(uLabPit.w * 1.7, uLabPit.w * 3.8, real)) * (1.0 - sink);
#endif
  // where the field of the place joins two cells, both stand on one level there and the crease between them is gone
  float rho = a / uLabDome.x;
  float level = min(uLabMore.w, 0.7 * high) * low * labJoin(place) * (1.0 - 0.3 * rho * rho * rho * rho);
  float body = high * low * (f < 0.0 ? f : top) * (1.0 - uLabMore.y * groove);
  float soft = 0.35 * high * low + 1e-6;
  float t = clamp(0.5 + 0.5 * (body - level) / soft, 0.0, 1.0);
  float h = mix(max(body, level), mix(level, body, t) + soft * t * (1.0 - t), min(level / soft, 1.0));
  deep = h / max(high * low, 1e-6);
  tall = h;
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
#ifndef LAB_MAP
  sink = 1.0 - smoothstep(uLabFar.x, uLabFar.y, labPx(labBall(labWarp(mid), 0.0)));
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
  vN = normalize(cross(p1 - p, p2 - p));
  vAxis = axis;
  vCell = vec4(c1.x, c1.y, rad, high);
  vMore = vec4(ds, 0.0, 0.0, 0.0);
  vReal = real;
  vDeep = deep;
  vCorner = corner;
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
vec4 labOut(float heat, float thin, vec3 here, vec3 clip, vec3 view) {
  vec3 shown = texture(uRamp, vec2(clamp(heat, 0.0, 1.0), 0.5)).rgb;
  vec3 col = inverseFilmic(grade(shown, 0.0)) * (1.0 + uLabHazeTint.w * max(heat - 1.0, 0.0));
  vec3 upHere = normalize(here - ST_CENTRE);
  float over = length(here - ST_CENTRE) - ST_RADIUS;
  float mu = max(dot(upHere, normalize(uLabEye - here)), 0.0);
  float tau = thin * uLabHaze.x * exp(-max(over, 0.0) / uLabHaze.y) / pow(max(mu, 0.02), uLabHaze.w);
  col = col * exp(-tau * 0.6) + inverseFilmic(grade(uLabHazeTint.rgb, 0.0)) * (uLabHaze.z * (1.0 - exp(-tau)));
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
  if (held <= 0.0 || (uDiag >= 2 && held < 0.5)) discard;
  return diagOut(vec4(col * held, held), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(view));
}`

const DOME_FRAG = /* glsl */ `
precision highp float;
#define LAB_FRAG
uniform vec4 uLabDome;
uniform vec4 uLabCount;
uniform vec4 uLabHeatB;
uniform vec4 uLabTime;
in vec3 vS;
in vec3 vPos;
in vec3 vN;
in vec3 vView;
in vec3 vClip;
in float vReal;
in float vDeep;
in float vCorner;
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
void main() {
  vec3 s = normalize(vS);
  float seed = vCell.x;
  float a = acos(clamp(s.z, -1.0, 1.0));
  float rho = a / uLabDome.x;
  vec2 u = length(s.xy) > 1e-6 ? normalize(s.xy) : vec2(1.0, 0.0);
  vec2 d = u * rho;
  float groove = labLobes(d, seed, 0.3);
  float join = labJoin(vG);
  float flow = uLabTime.x * uLabTime.y;
  // the fibres fan out from a root at the foot of the dome and bend a little on their way; the matter runs along
  // them from the root, so their pattern moves that way with the time
  float off = uLabTime.z;
  vec2 v = d + vAxis * off;
  float along = length(v) / (1.0 + off);
  float ang = atan(vAxis.x * v.y - vAxis.y * v.x, dot(vAxis, v));
  ang += 0.15 * sin(along * 4.0 + seed) * along + 0.5 * (vn(vG * uLabJoin.w * 2.5 + 3.3) - 0.5) * along;
  float turn = ang / 6.2831853 + 0.5;
  vec3 per = floor(uLabCount.xyz * 6.2831853 + 0.5);
  float wa = length(fwidth(v)) / max(length(v), 1e-4);
  float fa = vnp(vec2(turn * per.x + floor(seed * 31.0), (along - flow) * 1.2 + seed), per.x);
  float fb = vnp(vec2(turn * per.y + floor(seed * 77.0), (along - flow) * 2.0 - seed), per.y);
  float fc = vnp(vec2(turn * per.z + floor(seed * 13.0), (along - flow) * 3.0 + seed * 2.0), per.z);
  float ka = 1.0 - smoothstep(0.5, 1.1, wa * uLabCount.x);
  float kb = 1.0 - smoothstep(0.5, 1.1, wa * uLabCount.y);
  float kc = 1.0 - smoothstep(0.5, 1.1, wa * uLabCount.z);
  // the fibres are rays of the fan: hot threads with cooler matter between them, three sizes
  float thread = smoothstep(0.45, 0.6, 0.12 * mix(0.5, fa, ka) + 0.38 * mix(0.5, fb, kb) + 0.5 * mix(0.5, fc, kc));
#ifdef LAB_MAP
  vec4 pn = vec4(0.0, 0.0, 1.0, 1.0);
#else
  vec4 pn = labPen(vG, vReal, flow, fwidth(vG));
  if (pn.w < 0.0) discard;
#endif
  float pen = pn.x;
  float age = vCell.y;
  float life = mix(1.15, 0.7, smoothstep(0.3, 0.85, age));
  // the heat of a cell: the heat of the place, which runs over the borders, combed into hot fibres with cooler
  // matter between them and many small hot points along the fibres; cold at the root, in thin veins that leave
  // the root and die inside the cell, in the creases and at the rim where the cell does not join its neighbour
  float wide = 0.6 * vn(vG * uLabJoin.w + 5.3) + 0.4 * vn(vG * uLabJoin.w * 2.3 - 17.1);
  float mott = 0.45 * vn(vG * uLabJoin.w * 3.7 + 9.1) + 0.35 * vn(vG * uLabJoin.w * 8.3 - 4.7) + 0.2 * vn(vG * uLabJoin.w * 19.0 + 2.9);
  float comb = vnp(vec2(turn * floor(per.x * 0.5) + floor(seed * 53.0), (along - flow) * 2.5 + seed * 3.0), floor(per.x * 0.5));
  float blot = smoothstep(0.38, 0.64, 0.6 * mott + 0.4 * comb);
  float plan = sin(a) / sin(uLabDome.x);
  float bulge = mix(1.0 - plan * plan, 1.0, 0.7 * join);
  float top = mix(uLabHeatB.w, 1.0, pow(bulge, uLabHeatB.x)) * (0.7 + 0.6 * wide) * (uLabHeat.z + (1.0 - uLabHeat.z) * blot);
  float amp = mix(uLabHeatB.z, uLabHeatB.y, smoothstep(0.15, 0.8, rho)) * smoothstep(0.1, 0.45, along);
  float cell = top * mix(1.0, mix(0.42, uLabHeat.w, thread), amp);
  float points = smoothstep(0.72, 0.9, vnp(vec2(turn * per.z + floor(seed * 41.0), (along - flow) * 22.0 + seed * 5.7), per.z)) * thread * kc;
  cell += uLabHeatMore.x * points * top;
  float root = smoothstep(0.02, uLabCount.w, along + 0.1 * (fa - 0.5));
  // the dark between the cells is the depth of the crease itself: two domes meet at a height of their own from
  // place to place, lowest where three meet, so the dark is wide and soft there, thin along a border and gone
  // where a field of the place lifts it or where two cells are of one piece
  float c0 = ${lab.heat.crease[0]!.toFixed(3)} + ${lab.heat.crease[2]!.toFixed(3)} * (vn(vG * uLabJoin.w * 2.9 + 41.0) + 0.5 * vn(vG * uLabJoin.w * 7.3 - 13.0) - 0.75);
  float open = smoothstep(c0, c0 + ${lab.heat.crease[1]!.toFixed(3)}, vDeep);
  float rim = 1.0 - open;
  float shade = mix(0.02, 1.0, smoothstep(c0 - 0.03, c0 + 0.1, vDeep)) * mix(0.3, 1.0, open) * mix(mix(0.5, 1.0, thread), 1.0, open);
  cell *= mix(1.0 - uLabTime.w, 1.0, root) * (1.0 - 0.2 * groove * (1.0 - join)) * shade;
  float bundle = pn.y * (1.0 - 0.25 * rim);
  float heat = uLabHeat.y * mix(cell * life, bundle, pen);
  // small hard points of light on the rim of a dome, against the dark of the crease
  vec2 gq = vG * 230.0;
  vec2 gi = floor(gq);
  float lit = step(0.88, h1(gi + 17.0)) * (1.0 - smoothstep(0.05, 0.12 + 0.3 * h1(gi + 3.0), length(gq - gi - 0.3 - 0.4 * vec2(h1(gi), h1(gi + 5.0)))));
  heat += uLabHeatMore.w * lit * smoothstep(0.03, 0.14, vDeep) * (1.0 - smoothstep(0.3, 0.55, vDeep)) * (1.0 - pen);
  heat *= pn.z;
  // matter that wells up is hot where it comes up and cools as it turns over: the flanks of a dome and of its
  // lobes are cooler than their tops, by the lie of the surface alone
  float upward = dot(normalize(vN), normalize(vPos - ST_CENTRE));
  heat = uLabHeat.x + heat * mix(mix(uLabHeatMore.y, 1.0, max(join, pen)), 1.0, smoothstep(0.15, 0.9, abs(upward)));
#ifdef LAB_MAP
  outColor = vec4(heat, 0.0, 0.0, 1.0);
#else
  vec2 gx = dFdx(vG);
  vec2 gy = dFdy(vG);
  if (vSink > 0.0) heat = mix(heat, labFar(vG, vReal, flow, pn, gx, gy), vSink);
  outColor = labOut(heat, 1.0, vPos, vClip, vView);
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
  vec2 g = position.x * vec2(cos(position.y), sin(position.y));
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
  float um = labUmbra(vG);
  vec2 q = (vG - uLabSpot.xy) * 26.0;
  float dots = sin(q.x * 1.7 + 2.0 * sin(q.y * 1.3)) * sin(q.y * 2.1 + 1.5 * sin(q.x * 0.9));
  float heat = 0.012 + um * (0.02 + 0.035 * max(dots, 0.0));
  // where the cells are too small to be things the floor is the ground: the place in the cells' own chart (the
  // comb toward the spot undone), the map of the cells there
  vec2 ds = vG - uLabSpot.xy;
  float r = length(ds);
  vec2 chartPlace = uLabSpot.xy + ds * ((r + uLabSpot.z * exp(-(r * r) / (uLabSpot.w * uLabSpot.w))) / max(r, 1e-6));
  float flow = uLabTime.x * uLabTime.y;
  float far = 1.0 - smoothstep(uLabFar.x, uLabFar.y, labPx(vPos));
  vec4 pn = labPen(chartPlace, r, flow, fwidth(chartPlace));
  vec2 gx = dFdx(chartPlace);
  vec2 gy = dFdy(chartPlace);
  // between the threads of the penumbra the floor is the same threads, a little deeper and cooler
  if (pn.w > 0.0) heat = mix(heat, uLabHeat.x + 0.55 * uLabHeat.y * pn.y * pn.z, pn.x);
  if (far > 0.0 && pn.w > 0.0) heat = mix(heat, labFar(chartPlace, r, flow, pn, gx, gy), far);
  outColor = labOut(heat, 0.1 + 0.9 * smoothstep(uLabPit.w * 2.0, uLabPit.w * 3.5, length(vG - uLabSpot.xy)), vPos, vClip, vView);
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

export class LabGround {
  readonly mesh = new THREE.Group()
  private readonly uniforms: Shared
  private readonly floorMaterial: THREE.ShaderMaterial
  private readonly floorLaid: THREE.ShaderMaterial
  private under!: THREE.Mesh
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
  private readonly at = new THREE.Vector2()
  private readonly ball = new THREE.Sphere()
  private readonly spot = new THREE.Vector2()
  private readonly umbra: number
  private readonly order: { d: number; i: number; ox: number; oy: number }[][] = [[], [], []]
  private readonly map = new THREE.WebGLRenderTarget(lab.far.map, lab.far.map, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, depthBuffer: true, stencilBuffer: false, generateMipmaps: true, anisotropy: 16 })
  private readonly mapScene = new THREE.Scene()
  private readonly mapEye = new THREE.Camera()
  private readonly mapList = new THREE.DataTexture(new Float32Array(128 * 128 * 4), 128, 128, THREE.RGBAFormat, THREE.FloatType)
  private mapGeometry: THREE.InstancedBufferGeometry | null = null
  private mapTime = Number.NaN
  private readonly start = (plan.seg.terrain.end - plan.seg.terrain.start) / 2 + config.shutterFraction / (2 * config.fps)

  constructor(shared: Shared) {
    const keep = ['uGrade', 'uGlow', 'uBox', 'uLand', 'uKick', 'uFlash', 'uGlowBeat', 'uGlowPlain', 'uLandOn', 'uKickOn', 'uFlashOn', 'uLandVeil', 'uGroundMost', 'uGain', 'uVignette', 'uAspect']
    const uniforms: Shared = {}
    for (const name of keep) uniforms[name] = shared[name]!
    const mid = stage.onGround(stage.spot[0], stage.spot[1])
    chart(mid, this.spot)
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
      uLabPit: { value: new THREE.Vector4(lab.spot.depth, lab.spot.wall[0]!, lab.spot.wall[1]!, this.umbra) },
      uLabHeat: { value: new THREE.Vector4(ht.floor, ht.body, ht.cool, ht.hot) },
      uLabHeatMore: { value: new THREE.Vector4(ht.knot, ht.edge, ht.pen, ht.glint) },
      uLabHeatB: { value: new THREE.Vector4(ht.core, ht.thread[0]!, ht.thread[1]!, ht.rim) },
      uLabTime: { value: new THREE.Vector4(0, lab.heat.well, f.offset, f.dark) },
      uLabMore: { value: new THREE.Vector4(d.over, d.lobe, d.pen, lab.join.level) },
      uLabJoin: { value: new THREE.Vector4(lab.join.scale, lab.spot.strand[0]!, lab.spot.strand[1]!, lab.join.heat) },
      uLabHaze: { value: new THREE.Vector4(hz.amount, hz.scale, hz.level, hz.power) },
      uLabHazeTint: { value: new THREE.Vector4(hz.tint[0]!, hz.tint[1]!, hz.tint[2]!, ht.bloom) },
      uLabCount: { value: new THREE.Vector4(f.counts[0]!, f.counts[1]!, f.counts[2]!, f.root) },
      uLabFar: { value: new THREE.Vector4(lab.far.px[0]!, lab.far.px[1]!, 1, TILE) },
      uLabMap: { value: this.map.texture },
    }
    this.uniforms = all
    this.floorMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide })
    this.floorLaid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, ...WEIGHED })
    this.parts.push(this.floorMaterial, this.floorLaid)
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
      const material = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: { ...all, uLabList: { value: list } }, side: THREE.DoubleSide })
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
        const drawn = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, defines: { LAB_MAP: 1 }, uniforms: { ...all, uLabList: { value: this.mapList }, uLabMap: { value: null } }, side: THREE.DoubleSide })
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
  }

  /** time: seconds from the middle of the terrain segment, as the standing ground takes it. eye: the eye in the
   * stage's own frame. */
  update(time: number, eye: THREE.Vector3, keep = 1, onGlobe = false): void {
    this.mesh.visible = keep > 0
    this.uniforms.uLabKeep!.value = keep
    const away = place.onGlobe.away
    const red = place.onGlobe.red.over
    ;(this.uniforms.uLabAway!.value as THREE.Vector4).set(onGlobe ? away[0]! : 0, onGlobe ? away[1]! : 0, onGlobe ? red[0]! : 0, onGlobe ? red[1]! : 0)
    this.under.material = onGlobe ? this.floorLaid : this.floorMaterial
    for (const lv of this.levels) lv.mesh.material = onGlobe ? lv.laid : lv.plain
    ;(this.uniforms.uLabEye!.value as THREE.Vector3).copy(eye)
    if (keep <= 0) return
    ;(this.uniforms.uLabTime!.value as THREE.Vector4).x = time + this.start
    cellsAt(time + this.start, this.cells)
    const c = this.cells
    const d = c.diagram
    const px = this.cellData
    for (let i = 0; i < SLOTS; i++) {
      const o = i * 32
      if (!d.on[i]) {
        px[o + 2] = 0
        continue
      }
      const r = Math.sqrt(d.area[i]! / Math.PI)
      const u = c.u[i]!
      const young = 1 + lab.dome.young * (1 - Math.min(Math.max((u - 0.2) / 0.35, 0), 1))
      px[o] = d.mid[i * 2]!
      px[o + 1] = d.mid[i * 2 + 1]!
      px[o + 2] = r
      px[o + 3] = lab.dome.height * r * young
      px[o + 4] = c.seed[i]!
      px[o + 5] = u
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
    const focal = 540 / Math.tan(THREE.MathUtils.degToRad(fov) / 2)
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
      renderer.setRenderTarget(this.map)
      renderer.render(this.mapScene, this.mapEye)
      renderer.setRenderTarget(target)
      renderer.xr.enabled = xr
    }
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
          if (arc > horizon || Math.hypot(gx - this.spot.x, gy - this.spot.y) < 0.3 * this.umbra) continue
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

  dispose(): void {
    for (const part of this.parts) part.dispose()
    this.ramp.dispose()
    this.cellTexture.dispose()
  }
}
