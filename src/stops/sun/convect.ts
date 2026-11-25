import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'
import { GRADE_GLSL } from './grade'
import { STAGE_GLSL, stage } from './stage'
import data from './convect.json'
import place from './place.json'
import { fullSize } from './texels'
import { formatUniform } from './format'

/**
 * The close ground of the Sun as a convecting surface made by functions of a ground point and of time. No picture
 * is read for it and nothing is carried from frame to frame.
 *
 * Cells are the cells of a weighted diagram of seeds. Every lattice square holds two seeds whose lives run half a
 * life apart. A seed is born at nil weight (its cell is empty then), grows, may part into two halves with a lane
 * that grows in from the rim, sinks back to nil weight and is swallowed by its neighbours; the next life starts at
 * another place.
 *
 * The ground is a slab of glowing gas and no surface. The mesh is only a smooth lid over the slab. Once a sample
 * the cell diagram is drawn into a buffer in the picture's own projection: the heat of the gas at every place,
 * the height of its top over the ball (domes over sunken lanes, the funnel of the sunspot) and two fields of
 * threads. For every pixel the eye's ray is then marched through the slab and gathers light and loses sight by
 * what the buffer holds: dense hot gas inside a cell, hotter the deeper, threads of denser brighter gas at two
 * depths, cooler gas in the lanes, thin glowing air over the tops. A place is bright because it is hot and for no
 * other reason: there is no direction of light in it, no gleam and no shadow. Near cells hide far ones because
 * the look is used up in them, and a long look through the air melts the far cells into a bright band.
 */

type V2 = [number, number]

const chart = (p: THREE.Vector3): V2 => {
  const lay = p.clone().sub(stage.down)
  const up = stage.down.clone().negate()
  const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
  const right = fwd.clone().cross(up).normalize()
  const gx = lay.dot(right)
  const gy = lay.dot(fwd)
  const ring = Math.hypot(gx, gy)
  const k = (stage.radius * Math.asin(Math.min(ring / stage.radius, 1))) / Math.max(ring, 1e-4)
  return [gx * k, gy * k]
}

export const CONVECT_GLSL = /* glsl */ `
uniform vec4 uCvCell;
uniform vec4 uCvLife;
uniform vec4 uCvGrow;
uniform vec4 uCvLane;
uniform vec4 uCvBulb;
uniform vec4 uCvBulbMore;
uniform vec4 uCvTongue;
uniform vec4 uCvDome;
uniform vec4 uCvGloss;
uniform vec4 uCvWarp;
uniform vec4 uCvSpot;
uniform vec4 uCvPit;
uniform vec4 uCvFibre;
uniform vec4 uCvPetal;
uniform vec4 uCvPetalMore;
uniform vec4 uCvThread;
uniform vec4 uCvWarpMore;
uniform vec4 uCvGap;
uniform vec4 uCvSwallow;
uniform vec4 uCvLine;
uniform vec4 uCvPatch;
uniform vec4 uCvTight;
uniform vec4 uCvCurl;
uniform vec4 uCvSpotMore;
uniform vec4 uCvStream;
uniform vec4 uCvPull;
uniform float uCvTime;
vec3 cvH3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
// What the last look at the diagram leaves for the threads of the lanes: the distances to the three nearest lanes
// of the cell (lattice units, cvNear.x the least) and the ways up from the two nearest (unit length).
// cvFan: the way up from the lane net by a softer measure than e (uCvLine.w to a lattice unit), not of unit
// length: it turns from one lane's way up to the next over a span, not at a line.
vec3 cvNear;
vec2 cvUp1;
vec2 cvUp2;
vec2 cvFan;
// How many times narrower a cell is drawn across at the place of the last look at the cells (see cvPull).
float cvPulled;
// The diagram of the cells at q (lattice units) and time t (seconds). wrap: the lattice repeats after so many
// squares along x (0: it does not repeat).
// e: distance to the nearest lane and ge: its gradient (lattice units), rel: q minus the cell's own middle,
// own: x the age of the cell's life from 0 to 1, y a number of its own, z its weight.
void cvDiagram(vec2 q, float t, float wrap, out float e, out vec2 ge, out vec2 rel, out vec3 own) {
  vec2 base = floor(q);
  vec2 sp[36];
  float so[36];
  float sm[36];
  float sa[36];
  vec3 si[36];
  int n = 0;
  int bi = 0;
  float best = 1e9;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      vec2 hid = vec2(wrap > 0.0 ? mod(id.x, wrap) : id.x, id.y);
      vec3 hc = cvH3(vec3(hid, 3.1));
      float period = mix(uCvLife.x, uCvLife.y, hc.y);
      for (int s = 0; s < 2; s++) {
        float life = t / period + hc.x + 0.5 * float(s);
        float nth = floor(life);
        float x = life - nth;
        vec3 h1 = cvH3(vec3(hid, nth * 2.0 + float(s) + 11.7));
        vec3 h2 = cvH3(vec3(hid.yx + 37.2, nth * 2.0 + float(s) + 5.3));
        vec2 c = id + 0.5 + uCvCell.y * (h1.xy - 0.5) + uCvWarp.w * (h2.yz - 0.5) * (x - 0.5);
        float ang = 6.2831853 * h1.z;
        vec2 u = vec2(cos(ang), sin(ang));
        float parts = step(h2.x, uCvLife.z);
        float apart = uCvCell.w * smoothstep(0.45, 0.85, x) * parts;
        // the cell's weight in the diagram: its rim moves at an even pace while it grows and while it is
        // swallowed, and at both ends of the life the cell is empty for certain
        float w = smoothstep(0.0, uCvLife.w, x) * (1.0 - smoothstep(1.0 - uCvLife.w, 1.0, x));
        float grown = clamp(x / uCvGrow.x, 0.0, 1.0);
        float left = clamp((1.0 - x) / uCvGrow.y, 0.0, 1.0);
        // cells are of many sizes: each has a share of its own in the diagram for the whole of its life
        // (a cell is emptied and filled over a span of seconds, not over a share of its life: a short life must
        // not close in a frame or two. The share falls to nil with no slope where the cell is whole)
        float o = uCvWarpMore.w * (fract(h1.x * 13.7 + h1.y * 5.3) - 0.5) + uCvCell.z * (pow(1.0 - grown, uCvGrow.z) + pow(1.0 - left, uCvGrow.z)) + uCvGrow.w * (pow(1.0 - clamp(x * period / uCvSwallow.x, 0.0, 1.0), uCvSwallow.y) + pow(1.0 - clamp((1.0 - x) * period / uCvSwallow.x, 0.0, 1.0), uCvSwallow.y));
        float m = smoothstep(0.3, 0.55, x) * parts;
        for (int k = 0; k < 2; k++) {
          vec2 at = c + u * (apart * (k == 0 ? 1.0 : -1.0));
          vec2 d = q - at;
          float D = dot(d, d) + o;
          sp[n] = at;
          so[n] = o;
          sm[n] = m;
          sa[n] = ang;
          si[n] = vec3(x, h2.y, w);
          if (D < best) {
            best = D;
            bi = n;
          }
          n++;
        }
      }
    }
  }
  vec2 s1 = sp[bi];
  float acc = 0.0;
  vec2 gacc = vec2(0.0);
  vec3 m = vec3(1e9);
  vec2 u1 = vec2(1.0, 0.0);
  vec2 u2 = vec2(0.0, 1.0);
  vec2 facc = vec2(0.0);
  float sharp = uCvLane.w;
  for (int i = 0; i < 36; i++) {
    if (i == bi) continue;
    float ej;
    vec2 gj;
    if (i / 2 == bi / 2) {
      // the other half of the same cell: the lane between the halves runs through the cell's middle, and it is
      // there (still shallow) before the halves part
      vec2 u = vec2(cos(sa[i]), sin(sa[i]));
      float side = dot(q - 0.5 * (s1 + sp[i]), u);
      ej = abs(side) + (1.0 - sm[i]) * uCvLane.z;
      gj = u * sign(side);
    } else {
      vec2 ds = s1 - sp[i];
      float len = max(length(ds), 1e-4);
      vec2 dq = q - sp[i];
      ej = (dot(dq, dq) + so[i] - best) / (2.0 * len);
      gj = ds / len;
    }
    float wt = exp(-sharp * min(ej, 4.0));
    acc += wt;
    gacc += wt * gj;
    // (a cell that has not parted yet has its two halves in one place: that is one lane, not two)
    if (i - (i / 2) * 2 == 1 && all(equal(sp[i], sp[i - 1]))) continue;
    facc += exp(-uCvLine.w * min(ej, 4.0)) * gj;
    if (ej < m.x) {
      m = vec3(ej, m.x, m.y);
      u2 = u1;
      u1 = gj;
    } else if (ej < m.y) {
      m = vec3(m.x, ej, m.y);
      u2 = gj;
    } else if (ej < m.z) {
      m.z = ej;
    }
  }
  cvNear = m;
  cvUp1 = u1;
  cvUp2 = u2;
  cvFan = facc;
  e = max(-log(max(acc, 1e-30)) / sharp, 0.0);
  ge = gacc / max(acc, 1e-30);
  own = si[bi];
  rel = q - s1 - uCvLane.y * vec2(cos(own.y * 40.0), sin(own.y * 40.0)) * own.z;
}
// The chart of the ground's cells: lattice units, and it wanders a little so no lane is straight.
float cvTight(vec2 p) {
  // 1 near the place, the distance over uCvTight.x to the power uCvTight.y far from it, with no edge between
  return pow(1.0 + pow(length(p) / uCvTight.x, uCvTight.z), uCvTight.y / uCvTight.z);
}
// Round the sunspot the cells are the same diagram in a chart drawn tighter toward the spot's middle: a cell there
// is narrow across and long toward the spot, the more the nearer, and far from the spot the chart is the ground's
// own. So the penumbra is no layer of its own and has no outer line. uCvPull: x the distance from the spot's middle
// where the stretch sets in, y the share of its width that a cell keeps along the way in (1 over y is how long it
// is drawn against its width close to the middle), z how soon the stretch sets in, w a turn of the chart with the
// way in, so no fibre is a straight spoke. Returned: how many times narrower a cell is drawn across at the
// distance r from the spot's middle.
float cvPull(float r) {
  return pow(1.0 + pow(uCvPull.x / max(r, 1e-4), uCvPull.z), (1.0 - uCvPull.y) / uCvPull.z);
}
vec2 cvChart(vec2 p, float t) {
  vec2 d = p - uCvSpot.xy;
  float pull = cvPull(length(d));
  float turn = uCvPull.w * log(pull);
  vec2 dt = vec2(cos(turn) * d.x - sin(turn) * d.y, sin(turn) * d.x + cos(turn) * d.y);
  // away from the place the cells are smaller: the chart is drawn tighter with the distance on the ground
  vec2 q = (uCvSpot.xy + dt * pull) * cvTight(p) / uCvCell.x;
  q += uCvWarp.x * (vec2(vnoise(vec3(q * uCvWarp.y, t * uCvWarp.z)), vnoise(vec3(q.yx * uCvWarp.y + 31.7, t * uCvWarp.z + 7.3))) - 0.5);
  q += uCvWarpMore.x * (vec2(vnoise(vec3(q * uCvWarpMore.y + 13.1, t * uCvWarpMore.z)), vnoise(vec3(q.yx * uCvWarpMore.y + 57.9, t * uCvWarpMore.z + 3.1))) - 0.5);
  return q;
}
// The cells at ground point p (stage units) and time t (seconds): the diagram in a chart that wanders a little.
// e: distance to the nearest lane (stage units), ge: its gradient, rel: p minus the cell's own middle in lattice
// units, own: as in the diagram.
void cvCells(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own) {
  float L = uCvCell.x;
  cvDiagram(cvChart(p, t), t, 0.0, e, ge, rel, own);
  float gap = uCvGap.x * (1.0 - uCvGap.z + 2.0 * uCvGap.z * vnoise(vec3(p * uCvGap.y, 1.7 + t * 0.05)));
  // (across a cell that is drawn narrower the lane is as much nearer)
  cvPulled = cvPull(length(p - uCvSpot.xy));
  e = max(e * L / cvPulled - gap, 0.0);
}
// A pattern carried outward from the cell's middle. Two takes of it, half a turn apart: each is carried for one
// turn and then begins again nearer the middle, and it has no weight at the moment it begins again.
float cvCarried(vec2 rel, float r, vec2 u, float key, float t, float scale, float turn, float speed) {
  float reach = smoothstep(0.0, 0.3, r);
  float acc = 0.0;
  float norm = 0.0;
  for (int k = 0; k < 2; k++) {
    float ph = t / turn + 0.5 * float(k) + key * 3.0;
    float nth = floor(ph);
    float x = ph - nth;
    float w = 1.0 - abs(2.0 * x - 1.0);
    vec2 q = rel - u * (speed * turn * (x - 0.5) * reach);
    acc += w * (vnoise(vec3(q * scale, nth * 7.3 + key * 31.0 + float(k) * 3.7)) - 0.5);
    norm += w * w;
  }
  return 0.5 + acc / sqrt(norm);
}
// Plasma that runs outward in a cell. x: the lumps of the cell's top (they are relief too): round tops with
// creases between them, carried outward. y: fine threads fixed in angle round the middle that travel out.
float cvLumps(vec2 rel, float key, float t) {
  float r = length(rel);
  vec2 u = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  float a1 = 2.0 * cvCarried(rel, r, u, key, t, uCvPetal.y, uCvPetal.z, uCvPetal.w) - 1.0;
  float a2 = 2.0 * cvCarried(rel, r, u, key + 0.37, t, uCvPetalMore.x, uCvPetalMore.y, uCvPetalMore.z) - 1.0;
  float l1 = min(sqrt(a1 * a1 + uCvGap.w), 1.0);
  float l2 = min(sqrt(a2 * a2 + uCvGap.w), 1.0);
  return 0.65 * l1 * (2.0 - l1) + 0.35 * l2 * (2.0 - l2);
}
// Broad areas of hotter and cooler gas inside a cell, carried outward by its flow (0 to 1, 0.5 in the mean).
float cvPatch(vec2 rel, float key, float t) {
  float r = length(rel);
  vec2 u = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  return cvCarried(rel, r, u, key + 0.71, t, uCvPatch.w, uCvPetal.z, uCvPetal.w);
}
vec2 cvPetal(vec2 rel, float key, float t) {
  // the flow lines are no spokes: the chart they are drawn in is bent by a slow field of the cell's own, so they
  // curl and branch on their way out and meet in no point
  vec2 bent = rel + uCvCurl.x * (vec2(vnoise(vec3(rel * uCvCurl.y, key * 13.0 + t * uCvCurl.z)), vnoise(vec3(rel.yx * uCvCurl.y + 7.7, key * 5.0 - t * uCvCurl.z))) - 0.5);
  float r = length(bent);
  vec2 u = r > 1e-5 ? bent / r : vec2(1.0, 0.0);
  float n3 = vnoise(vec3(u * uCvThread.x, r * uCvThread.y - t * uCvThread.z) + vec3(key * 41.0, 9.0, 0.0));
  // the threads stand in locks: a few broad strands of many fine ones, with dark gaps between the locks
  float n4 = vnoise(vec3(u * uCvThread.x * 0.4 + 5.7, r * uCvThread.y * 0.5 - t * uCvThread.z * mix(0.7, 0.5, uCvTravel.y)) + vec3(key * 23.0, 3.0, 0.0));
  // (uCvCurl.w: how dark the gaps between the locks are; uCvTight.w: how thin a thread is against the dark
  // beside it)
  float thread = pow(1.0 - abs(2.0 * n3 - 1.0), uCvTight.w) * mix(1.0 - uCvCurl.w, 1.0, smoothstep(0.2, 0.7, n4)) * 1.35;
  float open = smoothstep(0.02, 0.14, r);
  return vec2(cvLumps(rel, key, t), mix(0.35, thread * thread, open));
}
// The share of the way from the cell's middle (0) to its lane (1) at a place r lattice units from the middle and e
// stage units from the lane. It is the same for a small cell and a wide one, so every cell is a whole bulb.
float cvWay(float r, float e) {
  return r / (r + e / uCvCell.x + 1e-5);
}
// Height of the cells over the ball at p (stage units), with the parts the colour needs.
float cvDome(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own, out vec2 petal) {
  cvCells(p, t, e, ge, rel, own);
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float across = e * cvPulled / uCvCell.x;
  float way = cvWay(r, across * uCvCell.x);
  // the cells are bulbs: each is a round dome that stands on its border. Its top is broad, its flank turns down
  // over the outer part of the way to the lane and meets the lane upright, so a near bulb stands before the foot of
  // the one behind it (uCvDome.w and uCvGloss.x: the two powers of the round, 1 minus the way to the lane to the
  // one, then to the other). A wide cell stands taller than a small one (uCvDome.y: the half width that stands
  // uCvDome.z tall), each has a height of its own (uCvGloss.y: the share by which it differs) and its top swells
  // and sinks with a beat of its own (uCvBulb.x the share, uCvBulb.y the rate)
  float cap = pow(max(1.0 - pow(way, uCvDome.w), 0.0), uCvGloss.x);
  float size = clamp((r + across) / uCvDome.y, 0.35, 1.6);
  float beat = 1.0 + uCvBulb.x * sin(t * uCvBulb.y * (0.7 + 0.6 * fract(own.y * 3.7)) + own.y * 40.0);
  float tall = uCvDome.z * size * (1.0 - uCvGloss.y + 2.0 * uCvGloss.y * fract(own.y * 7.31)) * mix(0.5, 1.0, own.z) * beat + uCvDome.x;
  // where three cells meet the ground falls into a pit (uCvBulb.z: its half width in lattice units, uCvBulb.w: its
  // depth)
  float pit3 = exp(-cvNear.y / uCvBulb.z);
  petal = cvPetal(rel, own.y, t);
  float old = smoothstep(0.5, 1.0, own.x);
  // a smaller cell stands lower by the same share, and so does a cell drawn narrower
  return ((tall + uCvPetal.x * (petal.x - 0.4)) * cap - uCvPetalMore.w * old * exp(-r2 / 0.02) * cap - uCvBulb.w * pit3 - uCvDome.z * uCvLane.x) / (cvTight(p) * cvPulled);
}
// The sunspot at ground point p, by place alone. It is no layer of its own: its fibres are the cells of the one
// diagram, drawn long toward the spot by the chart. Returned: x the share of the funnel's fall there (0 outside
// the penumbra, 1 at the umbra), y the share of the pit under the umbra, z the distance from the spot's middle over
// the umbra's own radius that way (the umbra is no circle), w how deep in the penumbra the place lies: it rises
// from 0 well outside over a wide span, with no line.
vec4 cvSpot(vec2 p) {
  vec2 d = p - uCvSpot.xy;
  float r = length(d);
  vec2 u = r > 1e-5 ? d / r : vec2(1.0, 0.0);
  float lobes = vnoise(vec3(u * 1.3 + 4.7, 0.5)) + 0.5 * vnoise(vec3(u * 3.1 + 1.9, 2.5)) - 0.75;
  float outer = uCvSpot.w * (1.0 + uCvFibre.w * lobes);
  float umbra = uCvSpot.z * (1.0 + 0.4 * uCvFibre.w * lobes);
  float fall = 1.0 - smoothstep(umbra, outer, r);
  float pit = 1.0 - smoothstep(umbra * uCvPit.z, umbra * uCvPit.w, r);
  return vec4(fall, pit, r / umbra, 1.0 - smoothstep(0.3 * outer, 1.3 * outer, r));
}`

const VERT = /* glsl */ `
precision highp float;
uniform vec4 uCvMesh;
uniform vec4 uCvSlab;
out vec2 vG;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
${STAGE_GLSL}
void main() {
  // the mesh lies still over the ground: rings round the point under the stage's camera. It is the smooth lid of
  // the slab of gas, uCvSlab.x over the ball as far as the gas is marched; beyond, it is the ball itself
  float arc = position.x;
  vec2 g = arc * vec2(cos(position.y), sin(position.y));
  float alpha = arc / ST_RADIUS;
  vec3 dir = -ST_DOWN * cos(alpha) + sin(alpha) * (ST_RIGHT * cos(position.y) + ST_FWD * sin(position.y));
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, arc);
  vec3 p = ST_CENTRE + dir * (ST_RADIUS + uCvSlab.x * real);
  vG = g;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

/** The picture of one sample: the eye's ray is marched through the slab of gas that the bake describes. */
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCvEye;
uniform sampler2D uRamp;
uniform sampler2D uGlow;
uniform sampler2D uCvBaked;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uGlowPlain, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform float uGroundMost;
uniform vec2 uGlowReach;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uCvFall;
uniform vec4 uCvKnee;
uniform vec4 uCvLimbTint;
uniform vec4 uCvVeil;
uniform vec3 uCvVeilTint;
uniform vec4 uCvMesh;
uniform float uCvKeep;
uniform vec4 uCvAway;
uniform vec3 uCvAwayTint;
uniform mat4 uCvBake;
uniform mat4 uCvClip;
uniform vec4 uCvSlab;
uniform vec4 uCvSlabMore;
uniform vec4 uCvCool;
uniform vec4 uCvCoolMore;
uniform vec4 uCvAir;
uniform vec4 uCvStrand;
uniform vec4 uCvStep;
in vec2 vG;
in vec3 vPos;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${STAGE_GLSL}
${GRADE_GLSL}
vec3 thrown(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uGroundMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uGroundMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}
// What the bake holds for the ground straight under a point p: x the heat of the gas there, y the height of its
// top over the ball, z and w two fields of threads.
vec2 cvPlace(vec3 p) {
  vec4 c = uCvBake * vec4(ST_CENTRE + normalize(p - ST_CENTRE) * ST_RADIUS, 1.0);
  return c.xy / c.w * 0.5 + 0.5;
}
vec4 cvRead(vec3 p) {
  return textureLod(uCvBaked, cvPlace(p), 0.0);
}
// The gas at the height h over a place the bake holds as b. take: the share of the light it takes per unit of the
// way through it. give: the light it gives. Inside a cell the gas is dense and hot, the hotter the deeper under
// its top (the top fades out over uCvSlab.z each way, it has no hard face). Over the tops lies thin air that glows by
// the heat under it and thins out with the height. Between the cells, up to uCvCool.x over the ball, lies cooler
// gas that takes light and gives little. The threads are denser, brighter gas: of the two fields the one and the
// other at two depths under the top, so a look through the gas sees threads of several depths
// (the sunspot's funnel holds none of the cooler gas: it lies between cells alone, where the ground is not far
// under the lanes' own level, uCvCoolMore.w)
void cvGas(vec4 b, float h, out float take, out float give) {
  float d = b.y - h;
  float inside = smoothstep(-uCvSlab.z, uCvSlab.z, d);
  // (a thread is no curtain from the top of the gas to its floor: the one field lies in a thin layer just under
  // the top, the other in a layer uCvStrand.z deeper)
  float lay1 = (d / uCvStrand.z - 0.3) / 0.35;
  float lay2 = (d / uCvStrand.z - 1.3) / 0.35;
  float strand = (b.z - uCvStrand.w) * exp(-lay1 * lay1) + (b.w - uCvStrand.w) * exp(-lay2 * lay2);
  float dense = inside * max(1.0 + uCvStrand.y * strand, 0.15) / uCvSlab.w;
  float air = (1.0 - inside) * exp(min(d, 0.0) / uCvAir.y) / uCvAir.x;
  float cool = (1.0 - inside) * (1.0 - smoothstep(uCvCool.x - uCvCool.y, uCvCool.x + uCvCool.y, h)) * (1.0 - smoothstep(0.0, uCvCoolMore.x, -d)) * smoothstep(uCvCoolMore.w - 0.004, uCvCoolMore.w, b.y) / uCvCool.z;
  float deep = 1.0 - exp(-max(d, 0.0) / uCvSlabMore.z);
  float hot = b.x * mix(uCvSlabMore.y, 1.0, deep) * max(1.0 + uCvStrand.x * strand, 0.0);
  take = dense + air + cool;
  give = (dense * hot + air * b.x * uCvAir.z + cool * uCvCool.w) / max(take, 1e-6);
}
// The march of one look. cvRd: the way of the look, cvS: how far along it the march has come, cvUv and cvD: the
// place in the bake of the ground under that point and the depth of the point under the top of the gas, cvB: what
// the bake holds there. cvLight: the light gathered, cvLeft: the share of the look not yet taken, cvSeen: how far
// along the look half of it was taken (under 0: not yet).
vec3 cvRd;
float cvS;
vec2 cvUv;
float cvD;
vec4 cvB;
float cvLight;
float cvLeft;
float cvSeen;
// One cut of the look, from where the march stands to the way s along it. The gas has parts finer than a cut:
// its threads lie in thin layers under its top, and the ground under the look moves over the bake as the look goes
// down, the more the nearer the ground is. A cut that steps over them draws a stipple that changes with the eye.
// So a cut is taken in as many equal parts as it needs: one for every uCvStep.x texels of the bake that the ground
// under it moves and for every uCvStep.y that the depth under the top of the gas changes, at most uCvStep.z. A cut
// that lies in the thin air alone, more than uCvStep.w over the tops, or that has no light left to take is taken
// whole. twice: a look that only grazes the slab goes as long again through the air beyond.
void cvCut(float s, float twice) {
  vec3 p1 = vPos + cvRd * s;
  vec2 uv1 = cvPlace(p1);
  vec4 b1 = textureLod(uCvBaked, uv1, 0.0);
  float d1 = b1.y - (length(p1 - ST_CENTRE) - ST_RADIUS);
  int parts = 1;
  if (cvLeft > 0.003 && max(d1, cvD) > -uCvStep.w) {
    float moved = length((uv1 - cvUv) * vec2(textureSize(uCvBaked, 0)));
    parts = int(clamp(ceil(max(moved / uCvStep.x, abs(d1 - cvD) / uCvStep.y)), 1.0, uCvStep.z));
  }
  float ds = (s - cvS) / float(parts);
  for (int j = 0; j < parts; j++) {
    vec3 p = vPos + cvRd * (cvS + ds * (float(j) + 0.5));
    vec4 b = cvRead(p);
    float take;
    float give;
    cvGas(b, length(p - ST_CENTRE) - ST_RADIUS, take, give);
    float a = 1.0 - exp(-take * ds * twice);
    cvLight += cvLeft * a * give;
    cvLeft *= 1.0 - a;
    if (cvSeen < 0.0 && cvLeft < 0.5) cvSeen = max(cvS + ds * float(j + 1), 0.0);
  }
  cvS = s;
  cvUv = uv1;
  cvD = d1;
  cvB = b1;
}
void main() {
  vec3 dir = normalize(vPos - ST_CENTRE);
  vec3 rd = normalize(vPos - uCvEye);
  // the far side of the lid is not drawn: a ray that only grazes the slab is marched from its near side
  if (dot(dir, rd) > 0.0) discard;
  vec3 o = vPos - ST_CENTRE;
  float ro = length(o);
  float bq = dot(o, rd);
  float hTop = ro - ST_RADIUS;
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, length(vG));
  float hBot = -uCvSlab.y * real;
  // the lowest the ray comes over the ball: a ray that does not reach the floor of the slab goes on through the
  // air over the limb, as long again as it came
  float hMin = sqrt(max(ro * ro - bq * bq, 0.0)) - ST_RADIUS;
  bool grazes = hMin > hBot;
  float low = grazes ? hMin : hBot;
  // the ray is cut at level heights over the ball (not at equal steps of its own length), so the cuts lie still on
  // the gas whatever the eye does
  int n = int(uCvSlabMore.x);
  float dh = (hTop - low) / float(n);
  cvRd = rd;
  cvS = 0.0;
  cvUv = cvPlace(vPos);
  cvB = textureLod(uCvBaked, cvUv, 0.0);
  cvD = cvB.y - hTop;
  cvLight = 0.0;
  cvLeft = 1.0;
  cvSeen = -1.0;
  for (int k = 0; k < n; k++) {
    float hk = hTop - dh * float(k + 1);
    cvCut(-bq - sqrt(max(bq * bq - (hTop - hk) * (2.0 * ST_RADIUS + hTop + hk), 0.0)), grazes ? 2.0 : 1.0);
  }
  // the sunspot's funnel goes deeper than the slab of the cells: there the march goes on to the funnel's depth
  float pit = 0.0;
  if (!grazes) {
    // (not only where the ground lies under the slab's floor: wherever the top of the gas stands less than
    // uCvSlabMore.w over that floor, since there the slab's floor would cut the look short in gas that has not yet
    // taken it, and the place would show the full heat of its depth as a flat bright sheet with a line round it)
    float under = hBot - cvB.y;
    int m = under > -uCvSlabMore.w ? int(uCvCoolMore.y) : 0;
    float dp = (uCvCoolMore.z + hBot) * real / max(float(m), 1.0);
    for (int k = 0; k < m; k++) {
      float hk = hBot - dp * float(k + 1);
      cvCut(-bq - sqrt(max(bq * bq - (hTop - hk) * (2.0 * ST_RADIUS + hTop + hk), 0.0)), 1.0);
    }
    // (how far the ground lies under the slab's floor, by place: the thin layer over the ground thins out there)
    pit = smoothstep(uCvKnee.z, uCvKnee.w, under);
    // under the slab the gas is deep and takes all light: what is left of the look ends in the heat of the place
    cvLight += cvLeft * cvB.x;
    cvLeft = 0.0;
    // (far from the place the slab has no thickness and the way through it is nil give or take the last bit of a
    // number: it must not read as a look that was never used up)
    if (cvSeen < 0.0) cvSeen = max(cvS, 0.0);
  }
  float light = cvLight;
  float left = cvLeft;
  float sSeen = cvSeen;
  float seen = 1.0 - left;
  float lum = light / max(seen, 1e-4);
  vec3 toEye = -rd;
  float muFlat = clamp(dot(dir, toEye), 0.0, 1.0);
  // the light falls toward the limb: the flatter the ball itself is seen, the less of the deep hot gas shows
  lum *= 1.0 - uCvFall.x * pow(1.0 - muFlat, uCvFall.y);
  // the brightest light is held under white by a knee (no part of the ground burns out)
  lum = lum > uCvKnee.x ? uCvKnee.x + (lum - uCvKnee.x) / (1.0 + (lum - uCvKnee.x) / uCvKnee.y) : lum;
  vec3 shown = texture(uRamp, vec2(clamp(lum, 0.0, 1.0), 0.5)).rgb;
  // seen flat, toward the limb, the same light is more gold than amber
  shown *= mix(vec3(1.0), uCvLimbTint.rgb, pow(1.0 - muFlat, uCvLimbTint.w));
  // below the ramp's darkest class the lanes and the pit go on toward black
  shown *= 1.0 - uCvFall.z * (1.0 - smoothstep(0.0, uCvFall.w, lum));
  vec3 col = inverseFilmic(grade(shown, 0.0));
  // a thin glowing layer over the ground: the longer the way through it, the more of it
  float through = 1.0 / max(muFlat, 0.02);
  float veil = 1.0 - exp(-uCvVeil.x * max(through - uCvVeil.w, 0.0));
  // (it glows: its light is added to the ground's, so the far cells keep their own dark and bright under it; the
  // spot's pit holds little of it)
  col += inverseFilmic(grade(uCvVeilTint, 0.0)) * (uCvVeil.y * clamp(veil, 0.0, uCvVeil.z) * (1.0 - 0.85 * pit));

  vec3 here = vPos;
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
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  // seen from the globe's side the ground gives way to the globe's own face by the distance from the eye alone, from
  // uCvAway.x to uCvAway.y radii of the ball (even steps in the logarithm): the far side of the ball first, the
  // place under the eye last. It is one ball at every height, cells where it is near and the globe's own face where
  // it is far, and no height of the eye weighs two pictures against each other over the whole frame
  // (and before it leaves, the ground far from the eye takes the colour of the globe's face: its light is reddened
  // by the way to the eye, by uCvAwayTint at the most, from uCvAway.z to uCvAway.w radii)
  float away = length(vPos + rd * max(sSeen, 0.0) - uCvEye) / ST_RADIUS;
  float near = uCvAway.y > 0.0 ? 1.0 - smoothstep(log(uCvAway.x), log(uCvAway.y), log(max(away, 1e-5))) : 1.0;
  col *= uCvAway.w > 0.0 ? mix(vec3(1.0), uCvAwayTint, smoothstep(log(uCvAway.z), log(uCvAway.w), log(max(away, 1e-5)))) : vec3(1.0);
  if (uCvKeep <= 0.0 || (uDiag >= 2 && uCvKeep * near < 0.5)) discard;
  // what stands behind the gas is hidden where the look has lost half its way through it; a look that leaves the
  // slab over the limb hides nothing
  vec4 at = uCvClip * vec4(vPos + rd * max(sSeen, 0.0), 1.0);
  gl_FragDepth = sSeen < 0.0 ? 1.0 : clamp(0.5 * at.z / at.w + 0.5, 0.0, 1.0);
  // (the light is given already weighed by how much of the look the gas holds: the picture behind keeps the rest)
  float held = seen * uCvKeep * near;
  outColor = diagOut(vec4(col * held, held), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(vView));
}`

const BAKE_VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/** The cell diagram of one sample, drawn once into a buffer in the picture's own projection (a little wider than
 * the picture): for the ground under every pixel the heat of the gas, the height of its top over the ball and two
 * fields of threads. The march of the picture reads it. */
const BAKE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCvEye;
uniform vec3 uCvRay0;
uniform vec3 uCvRayX;
uniform vec3 uCvRayY;
uniform vec4 uCvHeat;
uniform vec4 uCvTone;
uniform vec4 uCvGrain;
uniform vec4 uCvTravel;
uniform vec4 uCvWideOpen;
uniform vec4 uCvWell;
uniform vec4 uCvFarMore;
uniform vec4 uCvPoints;
uniform vec4 uCvUmbra;
uniform vec4 uCvFibreLook;
uniform vec4 uCvStrands;
uniform vec4 uCvUmbra2;
uniform vec4 uCvFar;
uniform vec4 uCvFlat;
uniform vec4 uCvMesh;
uniform vec4 uCvStrand;
uniform vec4 uCvThreadFar;
uniform vec4 uCvThin;
uniform vec4 uCvHeatMore;
uniform sampler2D uCvMap;
uniform mat3 uCvToMap;
uniform vec4 uCvWide;
uniform vec4 uCvWideMore;
uniform vec4 uCvWideFar;
uniform vec4 uCvWideBand;
uniform vec4 uCvWideCell;
in vec2 vNdc;
out vec4 outColor;
${STAGE_GLSL}
${NOISE_GLSL}
${CONVECT_GLSL}
// The fibres of the sunspot, by place alone: long strands of hot gas that run toward the spot's middle, bend over
// the lip of its funnel and hang down into the dark. u: the way from the spot's middle to the place (of unit
// length), r: how far that is (stage units), z: the same over the umbra's radius that way, across: what a pixel of
// the picture covers across a strand (stage units). Returned: x the strand (0 the dark between two, about 1 a
// strand's middle, the mean where a pixel cannot hold a strand), y a key of the strand's own (0 to 1: its end
// takes its depth from it), z the locks, a broad field of the same lie.
// uCvFibre: x how many strands lie round the lip (in the measure of the field), y how soon a strand changes along
// its way, z how far the strands turn and lean off the straight way in. uCvStream.w: how thin a strand is against
// the dark beside it, uCvStream.x: the length of the bright stretches that travel along a strand toward the spot.
// uCvFibreLook.w: how fast the strands' bends and bright stretches travel. uCvStrands.xy: the share of a strand's
// width that a pixel covers across it where the strand begins to merge into the mean and where it has merged.
// uCvUmbra2.z: the light left to a strand in the gap between two locks.
vec3 cvStrands(vec2 u, float r, float z, float t, float across) {
  float lz = log2(max(z, 0.35));
  // no strand is a straight spoke: the way round is turned with the way in, and a slow field leans the strands in
  // groups
  float a = uCvFibre.z * (0.6 * lz + vnoise(vec3(u * 2.1 + 2.9, lz + 0.7)) - 0.5);
  vec2 v = vec2(cos(a) * u.x - sin(a) * u.y, sin(a) * u.x + cos(a) * u.y);
  // a strand is as wide far out as at the lip: the count round doubles with every doubling of the way out and the
  // one count gives way to the next, so strands part in two on their way out
  float lvl = max(lz, 0.0);
  float k0 = floor(lvl);
  float c0 = uCvFibre.x * exp2(k0);
  float along = z * uCvFibre.y - t * uCvFibreLook.w;
  float n0 = vnoise(vec3(v * c0, along + 3.1 * k0));
  float n1 = vnoise(vec3(v * c0 * 2.0, along + 3.1 * (k0 + 1.0)));
  float s0 = pow(1.0 - abs(2.0 * n0 - 1.0), uCvStream.w);
  float s1 = pow(1.0 - abs(2.0 * n1 - 1.0), uCvStream.w);
  float wide = r / c0;
  float v0 = 1.0 - smoothstep(uCvStrands.x, uCvStrands.y, across / wide);
  float v1 = 1.0 - smoothstep(uCvStrands.x, uCvStrands.y, 2.0 * across / wide);
  float strand = mix(mix(uCvStrand.w, s0, v0), mix(uCvStrand.w, s1, v1), lvl - k0);
  // the strands stand in locks, with wider dark gaps between the locks
  float lock = vnoise(vec3(v * uCvFibre.x * 0.3 + 5.7, along * 0.5 + 1.9));
  strand *= mix(uCvUmbra2.z, 1.15, smoothstep(0.25, 0.7, lock));
  // bright stretches travel along a strand toward the spot
  strand *= 0.7 + 0.6 * vnoise(vec3(v * uCvFibre.x * 0.7 + 3.3, (z + t * uCvFibreLook.w * 4.0) * uCvStream.x));
  float key = smoothstep(0.2, 0.8, vnoise(vec3(v * uCvFibre.x * 2.5 + 11.3, 5.7)));
  return vec3(strand, key, lock);
}
void main() {
  // the ground under this place of the picture: where the eye's ray meets the ball
  vec3 rd = normalize(uCvRay0 + vNdc.x * uCvRayX + vNdc.y * uCvRayY);
  vec3 oc = uCvEye - ST_CENTRE;
  float bq = dot(oc, rd);
  float disc = bq * bq - (dot(oc, oc) - ST_RADIUS * ST_RADIUS);
  float met = disc > 0.0 && bq < 0.0 ? 1.0 : 0.0;
  vec3 dir = normalize(oc + rd * (-bq - sqrt(max(disc, 0.0))));
  vec2 lie = vec2(dot(dir, ST_RIGHT), dot(dir, ST_FWD));
  float ring = length(lie);
  vec2 g = ring > 1e-7 ? lie / ring * (atan(ring, -dot(dir, ST_DOWN)) * ST_RADIUS) : vec2(0.0);
  float t = uCvTime;
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  vec2 petal;
  float dome = cvDome(g, t, e, ge, rel, own, petal);
  vec4 spot = cvSpot(g);
  float L = uCvCell.x;
  // (uCvThreadFar.z: texels of this buffer to a pixel of the 16 by 9 master, each way. The buffer is as large in
  // every format, so what is counted here is counted in 1080ths of the frame height and a frame of any size is the
  // same picture)
  float footX = length(dFdx(g)) * uCvThreadFar.z;
  float footY = length(dFdy(g)) * uCvThreadFar.z;
  float foot = max(footX, footY);
  // what a pixel covers, in the measure of the cells where it lies (they are smaller far from the place): a cell
  // that a pixel cannot hold is not drawn, the gas there is its mean with a mottle of wider waves, each wave
  // drawn only where a pixel is narrower than it
  // (the root of what a pixel covers both ways: a far cell seen flat is many pixels wide and few deep, and it is
  // drawn while their product holds it)
  // (what fades reads the size in 1080ths of the frame height, not in pixels of the format: the buffer has the
  // master's pixels in every format, see above)
  float footM = sqrt(footX * footY);
  // (a cell drawn long toward the sunspot is narrower and longer: it is held as long as the root of its width is)
  float footC = footM * cvTight(g) * sqrt(cvPulled);
  // (the long side of what a pixel covers: toward the limb a cell is many pixels wide and under a pixel deep, one
  // sample a pixel then draws grain, so the cell gives way by that side too, between uCvFlat.x and uCvFlat.y cells
  // a pixel)
  float footL = foot * cvTight(g);
  float fine = (1.0 - smoothstep(uCvFar.x * L, uCvFar.y * L, footC)) * (1.0 - smoothstep(uCvFlat.x * L, uCvFlat.y * L, footL)) * met;
  float mottle = 0.0;
  for (int k = 0; k < 5; k++) {
    float lam = L * uCvFarMore.y * exp2(float(k));
    mottle += (1.0 - smoothstep(uCvFarMore.z * lam, uCvFarMore.w * lam, footM)) / (1.0 + float(k)) * (vnoise(vec3(g / lam + 17.3 * float(k), t * 0.05 + 3.1 * float(k))) - 0.5);
  }
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float old = smoothstep(0.5, 1.0, own.x);
  float young = 1.0 - smoothstep(0.0, 0.45, own.x);
  float across = e * cvPulled / L;
  float way = cvWay(r, across * L);
  // the heat of the gas. A place is bright because it is hot and for no other reason: the gas is hottest where it
  // wells up in the middle of a cell, cools on its way out and is coolest in the lane. A young cell is hotter, an
  // old one cooler and its middle the first part to cool. The line where the gas has cooled is no ring: the flow
  // carries tongues of the hot gas outward (uCvWell: the power of the way out, the power of the fall, how far a
  // tongue reaches)
  float top = uCvTone.y * (1.0 - uCvTone.z + 2.0 * uCvTone.z * own.y) * (1.0 + uCvHeat.z * young - uCvHeat.w * old);
  // the top of a bulb is a deeper amber with a soft mottle: broad areas of hotter and cooler gas that the cell's
  // flow carries from its middle outward (uCvWell.z: how strong), and a broad glow on the side of the bulb that lies
  // away from the place, toward the far ground (uCvTone.w: how strong; it lies on the ground, the eye does not move
  // it)
  vec2 ur = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  top *= 1.0 + uCvWell.z * (2.0 * cvPatch(rel, own.y, t) - 1.0) + uCvTone.w * ur.y * way;
  // the gas cools on its way out: the flank is darker than the top (uCvWell.x: the power of the way out, uCvWell.y:
  // the power of the fall) and the crease is the coolest. No two creases are alike: the share of a lattice unit
  // from the lane over which the gas loses its heat (uCvWell.w) is wide here and a hair there (uCvBulbMore.z: by how
  // much); between the fibres of the penumbra the dark is wider by uCvFibreLook.x
  // (the flank does not cool to the dark of the lane: it keeps the share uCvPatch.x of the top's heat, a deeper
  // orange round a hot middle, and only the crease itself is dark)
  float well = mix(uCvPatch.x, 1.0, pow(max(1.0 - pow(way, uCvWell.x), 0.0), uCvWell.y));
  float seamWide = uCvWell.w * (1.0 - uCvBulbMore.z + 2.0 * uCvBulbMore.z * vnoise(vec3(g / L * 0.9 + 3.3, 4.1 + t * 0.05))) * (1.0 + uCvFibreLook.x * spot.w);
  well *= 1.0 - exp(-across / seamWide);
  // (it boils: the heat of a place wavers with a fine field that the time carries)
  // (two forms of it. In place: the field stands on the ground and the time changes it. Borne, uCvTravel.z: the
  // field lies in the cell's own chart round its middle and travels outward with the threads' matter
  // (uCvTravel.x lattice units a second), so a hot patch wells up at the middle and is carried to the lane as a
  // body; round the very middle, where a chart round a point has no room, it is its mean)
  float boilHere = vnoise(vec3(g / L * uCvGrain.y, t * uCvGrain.z + own.y * 5.0)) + 0.6 * vnoise(vec3(g / L * uCvGrain.y * 3.7 + 9.1, t * uCvGrain.z * 1.6 + own.y * 3.0)) - 0.8;
  float boilOut = (r - t * uCvTravel.x) * uCvGrain.y;
  float boilBorne = (vnoise(vec3(ur * uCvGrain.y * uCvTravel.w, boilOut + own.y * 5.0)) + 0.6 * vnoise(vec3(ur * uCvGrain.y * uCvTravel.w * 2.3 + 9.1, boilOut * 2.3 + own.y * 3.0)) - 0.8) * smoothstep(0.02, 0.12, r);
  top *= 1.0 + uCvGrain.w * mix(boilHere, boilBorne, uCvTravel.z) * fine;
  float lum = uCvTone.x + (top - uCvTone.x) * well;
  // where three cells meet the pit is dark (uCvBulbMore.x: by what share)
  float pit3 = exp(-cvNear.y / uCvBulb.z);
  lum *= 1.0 - uCvBulbMore.x * pit3;
  // single bright points stand in the lanes and drift along them: two fields of points, the one carried along the
  // one axis of the ground and the other along the other, each shown by the share of the lane that runs its way
  // (uCvBulbMore.y: how fast, in the fields' own measure)
  vec2 tg = vec2(-ge.y, ge.x) / max(length(ge), 1e-5);
  float inLane = 1.0 - smoothstep(0.0, uCvPoints.y, e);
  float pA = smoothstep(uCvPoints.z, 1.0, vnoise(vec3(g / L * uCvPoints.w + vec2(t * uCvBulbMore.y, 0.0), 1.3)));
  float pB = smoothstep(uCvPoints.z, 1.0, vnoise(vec3(g / L * uCvPoints.w + vec2(0.0, t * uCvBulbMore.y), 7.9)));
  lum += uCvPoints.x * inLane * (tg.x * tg.x * pA + tg.y * tg.y * pB) * fine;
  // threads: two fields of the cell's own flow lines, each carried outward; a thread is drawn only where a pixel
  // is narrower than it, farther off the threads merge into their mean
  // (seen flat, a thread is thinner than a pixel is deep long before a pixel is wider than it: the threads merge
  // into their mean by the long side of what a pixel covers too, uCvThreadFar.w of it)
  float threads = (1.0 - smoothstep(uCvThreadFar.x, uCvThreadFar.y, footC)) * (1.0 - smoothstep(uCvThreadFar.x, uCvThreadFar.y, footL * uCvThreadFar.w)) * fine;
  // a dome is no single swell: it is made of a few lobes that the cell's flow carries outward, with thin cooler
  // folds between them (the same lobes that its height has). uCvPatch.y: the share of its heat a fold loses. A fold
  // is drawn where a pixel can hold it, at twice the size of what a pixel covers where a thread is still drawn
  lum *= 1.0 - uCvPatch.y * (1.0 - petal.x) * (1.0 - smoothstep(2.0 * uCvThreadFar.x, 2.0 * uCvThreadFar.y, footC)) * fine;
  // (the threads are fixed in angle round the cell's middle, so a thread is as thin as its place is near the
  // middle: it is drawn only where it is wider than what a pixel covers, between the shares uCvThin.x and uCvThin.y
  // of its width to a pixel; nearer the middle the threads are their mean. A thread thinner than a pixel drawn
  // with one sample is a comb of lines that changes with the eye)
  threads *= 1.0 - smoothstep(uCvThin.x, uCvThin.y, footL * uCvThread.x / max(r, 1e-4) / L);
  // the threads are no fan from the middle of the cell: the top holds none. They are tongues of hot gas that come
  // out of the crease and the pits and run up the flank, each group as far as its own reach: a tongue begins
  // between the shares uCvTongue.x and uCvTongue.y of the way out, by a field in the angle round the middle
  // (uCvTongue.w: how many groups round), and comes in over the share uCvBulbMore.w
  float reach = vnoise(vec3(ur * uCvTongue.w, own.y * 17.0 + 3.0));
  float from = mix(uCvTongue.x, uCvTongue.y, reach);
  float flank = smoothstep(from, from + uCvBulbMore.w, way) * threads;
  float one = mix(uCvStrand.w, petal.y, flank);
  float two = mix(uCvStrand.w, cvPetal(rel, own.y + 0.43, t + 11.0).y, flank);
  // (the tongues are the hottest gas of the ground: their heat is added to the flank's, down to the foot of the
  // bulb and not into the crease itself. uCvHeatMore: the share of the one field and of the other, the least the
  // heat may fall to between two tongues, the share of a lattice unit from the lane over which a tongue ends;
  // uCvTongue.z: how hot a tongue is)
  float tongue = max(uCvHeatMore.x * (one - uCvStrand.w) + uCvHeatMore.y * (two - uCvStrand.w), 0.0);
  lum = max(lum * (1.0 - (1.0 - uCvHeatMore.z) * flank * (1.0 - min(tongue, 1.0))), 0.0) + uCvTongue.z * tongue * (0.6 + 0.8 * own.y) * (1.0 - exp(-across / uCvHeatMore.w)) * (1.0 - uCvBulbMore.x * pit3);
  lum = mix(uCvFar.z * (1.0 + uCvFarMore.x * mottle), lum, mix(uCvFar.w, 1.0, fine));
  // the ground is the globe's own ground: the light and dark of the globe's map lies under the cells at the place on
  // the ball where the globe itself shows it. Each cell takes the map's light at its own middle, so the map's
  // pattern is carried by cells that differ from their neighbours and its borders are the cells' own borders on
  // the ground; that part is read by one law at every height, distance and angle. Where a pixel can no longer hold
  // the cells they leave the globe's own pattern behind and not another, and the globe's face that the ground
  // gives way to on the rise is the same picture
  // (the map's light is taken in two parts. The cell's own: the map at the cell's middle over the map's mean
  // round it, uCvWideBand.z texels wide; uCvWideCell is how far the place of the sample is drawn from the point
  // to the middle of its cell (1 the middle; in the sunspot, which has no cells, the point itself), the least and
  // the most it may be, and the power it is read by. The region's: that mean, by uCvWide where a pixel is small
  // on the ground and by uCvWideFar where it holds the map as the globe shows it (the share of the map's light the
  // ground takes, the level that leaves the ground as it is, the power, the most it may add); between uCvWideBand.x
  // and uCvWideBand.y texels of the map to a pixel, in 1080ths of the frame height, the one gives way to the
  // other. Only the region's part, which is wider than any detail of the picture while it changes, is weaker from
  // close by; with both whole the ground reads the map by the far law alone. uCvWideMore.x: the least width of a
  // sample in texels of the map, so the enlarged map is a soft tone and no texel of it shows)
  {
    vec2 gc = g - rel * (L / (cvTight(g) * cvPulled)) * uCvWideCell.x * (1.0 - spot.w);
    float arcC = max(length(gc), 1e-6);
    float alphaC = arcC / ST_RADIUS;
    vec3 mdC = uCvToMap * (-ST_DOWN * cos(alphaC) + sin(alphaC) * (ST_RIGHT * gc.x + ST_FWD * gc.y) / arcC);
    vec2 muvC = vec2(atan(mdC.x, mdC.z) / 6.283185307179586 + 0.5, asin(clamp(mdC.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    vec3 md = uCvToMap * dir;
    vec2 muv = vec2(atan(md.x, md.z) / 6.283185307179586 + 0.5, asin(clamp(md.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    float mAlt = fract(muv.x + 0.5) - 0.5;
    vec2 mdx = vec2(abs(dFdx(muv.x)) < abs(dFdx(mAlt)) ? dFdx(muv.x) : dFdx(mAlt), dFdx(muv.y)) * uCvThreadFar.z;
    vec2 mdy = vec2(abs(dFdy(muv.x)) < abs(dFdy(mAlt)) ? dFdy(muv.x) : dFdy(mAlt), dFdy(muv.y)) * uCvThreadFar.z;
    float lenX = max(length(mdx * uCvWideMore.yz), 1e-6);
    float lenY = max(length(mdy * uCvWideMore.yz), 1e-6);
    float wideFoot = sqrt(lenX * lenY);
    float cellLum = dot(textureGrad(uCvMap, muvC, mdx * max(1.0, uCvWideMore.x / lenX), mdy * max(1.0, uCvWideMore.x / lenY)).rgb, vec3(0.3, 0.5, 0.2));
    float regionLum = dot(textureGrad(uCvMap, muv, mdx * max(1.0, uCvWideBand.z / lenX), mdy * max(1.0, uCvWideBand.z / lenY)).rgb, vec3(0.3, 0.5, 0.2));
    // (the cell's part is held between narrow bounds where a cell is large in the picture, so the near ground is
    // no map of blotches; where a pixel holds the map as the globe shows it, between uCvWideOpen.x and uCvWideOpen.y
    // texels of the map to a pixel, the bounds open to uCvWideOpen.zw: there the far ground carries the map's light
    // and dark as the globe's face does, in the same place, before the one gives way to the other)
    float openW = smoothstep(uCvWideOpen.x, uCvWideOpen.y, wideFoot);
    float cellTone = clamp(pow(cellLum / max(regionLum, 1e-3), uCvWideCell.w), mix(uCvWideCell.y, uCvWideOpen.z, openW), mix(uCvWideCell.z, uCvWideOpen.w, openW));
    float nearTone = 1.0 + uCvWide.x * clamp(pow(regionLum / uCvWide.y, uCvWide.z) - 1.0, -1.0, uCvWide.w);
    float farTone = 1.0 + uCvWideFar.x * clamp(pow(regionLum / uCvWideFar.y, uCvWideFar.z) - 1.0, -1.0, uCvWideFar.w);
    lum *= cellTone * mix(nearTone, farTone, smoothstep(uCvWideBand.x, uCvWideBand.y, wideFoot));
  }

  // the sunspot, by place. It is a funnel: round it the gas runs in long strands toward its middle, with dark gaps
  // between them; the strands bend over the funnel's lip and hang down into the dark, each to a depth of its own,
  // and end there with a round, brighter head; past its end lies the dark of the wall and the floor. The strands
  // are no layer over the cells: they are what the light and the height of the cells drawn long toward the spot
  // are given by, fully inside uCvFibreLook.y umbra radii from the middle and not at all beyond uCvFibreLook.z,
  // so there is no line where strands end and cells begin (uCvSpotMore.x: the light left in the dark between two
  // strands, uCvStrands.z: the light of a strand's middle, uCvSpotMore.z: how high a strand stands over the gap
  // beside it, uCvSpotMore.w: the share of a bulb's height that is gone where the strands are whole). The
  // penumbra's gas is cooler by the share uCvUmbra.z where it lies deepest
  vec2 sd = g - uCvSpot.xy;
  float sr = length(sd);
  vec2 su = sr > 1e-5 ? sd / sr : vec2(1.0, 0.0);
  vec2 sx = vec2(-su.y, su.x);
  float footS = max(abs(dot(dFdx(g), sx)), abs(dot(dFdy(g), sx))) * uCvThreadFar.z;
  vec3 st = cvStrands(su, sr, spot.z, t, footS);
  float sw = (1.0 - smoothstep(uCvFibreLook.y, uCvFibreLook.z, spot.z)) * met;
  float keyS = mix(own.y, st.y, sw);
  // (where the strands are whole the cell's own light and dark is gone but for the share uCvUmbra2.x: the strand
  // and the gap beside it are the picture there, on the one tone uCvUmbra2.y)
  lum = mix(lum, uCvUmbra2.y, (1.0 - uCvUmbra2.x) * sw) * mix(1.0, uCvSpotMore.x + uCvStrands.z * st.x, sw);
  one = mix(one, st.x, sw);
  two = mix(two, uCvStrand.w, sw);
  // (a strand ends, in the mean, at uCvUmbra2.w umbra radii from the middle: under the lip, on the wall)
  float past = clamp((spot.z - (uCvUmbra2.w + uCvStream.y * (keyS - 0.5))) / uCvStream.z, 0.0, 1.0);
  float head = exp(-pow((past - 0.45) / uCvUmbra.y, 2.0)) * spot.x * mix(1.0, min(st.x / max(uCvStrand.w, 1e-3), 2.0), sw);
  // (the floor is not flat black: a faint structure of the strands' own lie goes on down the wall and over the
  // floor, uCvStrands.w of it)
  float floorL = uCvUmbra.x * (0.6 + 0.8 * vnoise(vec3(g * 22.0, t * 0.15))) * (1.0 + uCvStrands.w * (st.z - 0.5));
  lum *= mix(1.0, uCvUmbra.z, spot.w) * (1.0 + uCvUmbra.w * head);
  // (a strand cools as it hangs down the wall: at the wall's foot it has lost the share uCvGloss.w of its light)
  float down = 1.0 - smoothstep(uCvPit.z, uCvPit.w, spot.z - uCvGloss.z * uCvStream.y * (keyS - 0.5));
  lum *= 1.0 - uCvGloss.w * down;
  lum = mix(floorL, lum, smoothstep(uCvSpotMore.y, uCvSpotMore.y + 0.25, past));

  // the height of the gas's top over the ball: the cells' domes, lower in the spot's funnel and its pit by place;
  // a strand's body ends where the strand ends
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, length(g));
  // (the lip of the funnel is thick and round: from uCvPit.w umbra radii, where the ground begins to turn down,
  // the fall grows steeper to the middle of the wall and eases into the floor at uCvPit.z, so the wall leans and
  // the far side of the funnel shows the strands that hang down it. The lip is no clean line: each strand goes
  // over it at a place of its own, by the share uCvGloss.z of the spread of the strands' ends)
  float body = dome * (1.0 - uCvSpotMore.w * sw) + uCvSpotMore.z * (st.x - uCvStrand.w) * sw;
  float high = (body * fine * sqrt(past) - uCvPit.x * spot.x - uCvPit.y * down) * uCvMesh.z * real;
  outColor = mix(vec4(uCvFar.z, 0.0, uCvStrand.w, uCvStrand.w), vec4(lum, high, one, two), met);
}`

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))

function rampTexture(): THREE.DataTexture {
  const stops = data.ramp.stops as number[][]
  const levels = data.ramp.levels as number[]
  const n = 256
  const px = new Float32Array(n * 4)
  const lo = stops[0]!
  const hi = data.tone.white as number[]
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
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.needsUpdate = true
  return t
}

type Shared = Record<string, THREE.IUniform>

export class Surface {
  readonly mesh: THREE.Group
  readonly material: THREE.ShaderMaterial
  /** The same ground seen from the globe's side: it is laid over the globe's own face and may be thin. */
  private readonly laid: THREE.ShaderMaterial
  private readonly ramp: THREE.DataTexture
  private readonly pieces: { mesh: THREE.Mesh; mid: THREE.Vector3; wide: number; seen: boolean }[] = []
  private readonly towards = new THREE.Vector3()
  private readonly over: number
  /** The materials every piece has been drawn with once, so that its buffer and its vertex arrays are on the card. */
  private readonly bound = new Set<THREE.Material>()
  private binding = false
  private readonly frustum = new THREE.Frustum()
  private readonly screen = new THREE.Matrix4()
  private readonly ball = new THREE.Sphere()
  /** The buffer the cell diagram of a sample is drawn into, in the picture's own projection, and what draws it. */
  private readonly baked: THREE.WebGLRenderTarget
  private readonly baker: THREE.ShaderMaterial
  private readonly bakeScene = new THREE.Scene()
  private readonly bakeEye = new THREE.Camera()
  private readonly bakeParts: (THREE.BufferGeometry | THREE.Material)[] = []
  private readonly toClip = new THREE.Matrix4()
  private readonly toBake = new THREE.Matrix4()
  private readonly back = new THREE.Matrix4()
  private readonly wider = new THREE.Matrix4()
  private readonly size = new THREE.Vector2()
  private readonly at0 = new THREE.Vector3()
  private readonly atX = new THREE.Vector3()
  private readonly atY = new THREE.Vector3()
  private readonly ray = new THREE.Vector3()
  private readonly rimMid = new THREE.Vector3()
  private readonly rimA = new THREE.Vector3()
  private readonly rimB = new THREE.Vector3()
  private readonly fromMid = new THREE.Vector3()

  /** shared: the uniforms of the lights that the opening throws on the ground, kept by the old ground. map: the
   * globe's own map, toStage: the turn from the map's axes to the stage's (the globe lays the stage by it). */
  constructor(shared: Shared, map: THREE.Texture, toStage: THREE.Matrix3) {
    const c = data.cells
    const s = data.spot
    const m = data.mesh
    const l = data.light
    const g = data.gas
    const spot = stage.onGround(stage.spot[0], stage.spot[1])
    const at = chart(spot)
    const edge = stage.onGround(stage.spot[0] + stage.umbra[0], stage.spot[1])
    const umbra = edge.distanceTo(spot) * s.umbra
    this.ramp = rampTexture()
    const keep = ['uGrade', 'uGlow', 'uBox', 'uLand', 'uKick', 'uFlash', 'uGlowBeat', 'uGlowPlain', 'uLandOn', 'uKickOn', 'uFlashOn', 'uLandVeil', 'uGroundMost', 'uGlowReach', 'uCam', 'uGain', 'uVignette', 'uAspect']
    const uniforms: Shared = {}
    for (const name of keep) uniforms[name] = shared[name]!
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...uniforms,
        uDiag: diagUniform,
        uRamp: { value: this.ramp },
        uCvTime: { value: 0 },
        uCvCell: { value: new THREE.Vector4(c.lattice, c.jitter, c.yield, c.apart) },
        uCvLife: { value: new THREE.Vector4(c.life[0]!, c.life[1]!, c.parts, c.ripe) },
        uCvGrow: { value: new THREE.Vector4(c.grow[0]!, c.grow[1]!, c.grow[2]!, c.empty) },
        uCvLane: { value: new THREE.Vector4(c.dome.sink, c.thread.off, c.laneIn, c.round) },
        uCvDome: { value: new THREE.Vector4(c.dome.height, c.dome.full, c.dome.bulge, c.dome.power) },
        uCvWarp: { value: new THREE.Vector4(c.warp.amount, c.warp.scale, c.warp.rate, c.wander) },
        uCvSpot: { value: new THREE.Vector4(at[0], at[1], umbra, umbra * s.penumbra) },
        uCvPit: { value: new THREE.Vector4(s.drop[0]!, s.drop[1]!, s.wall[0]!, s.wall[1]!) },
        uCvFibre: { value: new THREE.Vector4(s.strands.count, s.strands.along, s.strands.lean, s.ragged) },
        uCvSpotMore: { value: new THREE.Vector4(s.strands.dark, s.fibres.headFrom, s.strands.relief, s.strands.flat) },
        uCvStream: { value: new THREE.Vector4(s.strands.grains, s.fibres.ends, s.fibres.headLong, s.strands.thin) },
        uCvStrands: { value: new THREE.Vector4(s.strands.far[0]!, s.strands.far[1]!, s.strands.light, s.strands.floor) },
        uCvUmbra2: { value: new THREE.Vector4(s.strands.cell, s.strands.tone, s.strands.locks, s.fibres.endsAt) },
        uCvMesh: { value: new THREE.Vector4(m.real[0]!, m.real[1]!, 1, 0) },
        uCvKeep: { value: 1 },
        uCvAway: { value: new THREE.Vector4(0, 0, 0, 0) },
        uCvAwayTint: { value: new THREE.Vector3().fromArray(place.onGlobe.red.tint) },
        uCvLine: { value: new THREE.Vector4(0, 0, 0, c.fan) },
        uCvGloss: { value: new THREE.Vector4(c.bulb.round, c.bulb.spread, s.fibres.endsDeep, s.fibres.cools) },
        uCvBulb: { value: new THREE.Vector4(c.bulb.swell[0]!, c.bulb.swell[1]!, c.bulb.pit[0]!, c.bulb.pit[1]!) },
        uCvBulbMore: { value: new THREE.Vector4(c.bulb.pit[2]!, l.points.drift * l.points.scale, l.well.uneven, l.tongue.soft) },
        uCvTongue: { value: new THREE.Vector4(l.tongue.from[0]!, l.tongue.from[1]!, l.tongue.heat, l.tongue.groups) },
        uCvPull: { value: new THREE.Vector4(s.pull.from * umbra * s.penumbra, s.pull.share, s.pull.sharp, s.pull.turn) },
        uCvStep: { value: new THREE.Vector4(g.cut.texels, g.cut.depth, g.cut.most, g.cut.air) },
        uCvGrain: { value: new THREE.Vector4(0, l.boil.scale, l.boil.rate, l.boil.amount) },
        uCvTravel: { value: new THREE.Vector4(c.thread.speed / c.thread.out, c.thread.ride, l.boil.borne, l.boil.round) },
        uCvWideOpen: { value: new THREE.Vector4(l.wide.cell.open.over[0]!, l.wide.cell.open.over[1]!, l.wide.cell.open.least, l.wide.cell.open.most) },
        uCvThread: { value: new THREE.Vector4(c.thread.round, c.thread.out, c.thread.speed, 0) },
        uCvPatch: { value: new THREE.Vector4(l.well.flank, l.well.lobes, 0, l.well.scale) },
        uCvThin: { value: new THREE.Vector4(g.strand.thin[0]!, g.strand.thin[1]!, 0, 0) },
        uCvThreadFar: { value: new THREE.Vector4(g.strand.far[0]!, g.strand.far[1]!, g.fine, g.strand.flat) },
        uCvKnee: { value: new THREE.Vector4(l.knee[0]!, l.knee[1]!, g.pit.veil[0]!, g.pit.veil[1]!) },
        uCvSlab: { value: new THREE.Vector4(g.lid, g.floor, g.soft, g.free) },
        uCvSlabMore: { value: new THREE.Vector4(g.steps, g.top, g.deep, g.pit.above) },
        uCvCool: { value: new THREE.Vector4(g.cool.fill, g.cool.soft, g.cool.free, g.cool.heat) },
        uCvCoolMore: { value: new THREE.Vector4(g.cool.reach, g.pit.steps, g.pit.depth, g.cool.under) },
        uCvAir: { value: new THREE.Vector4(g.air.free, g.air.scale, g.air.glow, 0) },
        uCvStrand: { value: new THREE.Vector4(g.strand.light, g.strand.dense, g.strand.layer, g.strand.mean) },
        uCvBaked: { value: null as THREE.Texture | null },
        uCvBake: { value: new THREE.Matrix4() },
        uCvClip: { value: new THREE.Matrix4() },
        uCvEye: { value: new THREE.Vector3() },
        uCvRay0: { value: new THREE.Vector3() },
        uCvRayX: { value: new THREE.Vector3() },
        uCvRayY: { value: new THREE.Vector3() },
        uCvMap: { value: map },
        uCvToMap: { value: toStage.clone().transpose() },
        uCvWide: { value: new THREE.Vector4(l.wide.amount, l.wide.level, l.wide.power, l.wide.most) },
        uCvWideFar: { value: new THREE.Vector4(l.wide.far.amount, l.wide.far.level, l.wide.far.power, l.wide.far.most) },
        uCvWideBand: { value: new THREE.Vector4(l.wide.band[0]!, l.wide.band[1]!, l.wide.region, 0) },
        uCvWideCell: { value: new THREE.Vector4(l.wide.cell.share, l.wide.cell.least, l.wide.cell.most, l.wide.cell.power) },
        uCvWideMore: { value: new THREE.Vector4(l.wide.texels, ...fullSize('wrap'), 0) },
        uCvHeat: { value: new THREE.Vector4(0, 0, l.young, l.old) },
        uCvWell: { value: new THREE.Vector4(l.well.out, l.well.fall, l.well.tongue, l.well.seam) },
        uCvHeatMore: { value: new THREE.Vector4(l.fibre.one, l.fibre.two, l.fibre.least, l.fibre.rim) },
        uCvTone: { value: new THREE.Vector4(l.dark, l.top, l.spread, l.farGlow) },
        uCvPetal: { value: new THREE.Vector4(c.lumps.height, c.lumps.scale[0]!, c.lumps.turn[0]!, c.lumps.speed[0]!) },
        uCvWarpMore: { value: new THREE.Vector4(c.warp.fine[0]!, c.warp.fine[1]!, c.warp.fine[2]!, c.sizes) },
        uCvGap: { value: new THREE.Vector4(c.gap.width, c.gap.scale, c.gap.vary, c.lumps.crease) },
        uCvPetalMore: { value: new THREE.Vector4(c.lumps.scale[1]!, c.lumps.turn[1]!, c.lumps.speed[1]!, c.dome.dimple) },
        uCvCurl: { value: new THREE.Vector4(c.thread.curl[0]!, c.thread.curl[1]!, c.thread.curl[2]!, c.thread.locks) },
        uCvPoints: { value: new THREE.Vector4(l.points.amount, l.points.within, l.points.few, l.points.scale) },
        uCvTight: { value: new THREE.Vector4(c.tight.from, c.tight.power, c.tight.knee, c.thread.thin) },
        uCvFarMore: { value: new THREE.Vector4(l.far.mottle, l.far.wave, l.far.band[0]!, l.far.band[1]!) },
        uCvSwallow: { value: new THREE.Vector4(c.swallow[0]!, c.swallow[1]!, 0, 0) },
        uCvLimbTint: { value: new THREE.Vector4(l.limbTint[0]!, l.limbTint[1]!, l.limbTint[2]!, l.limbTint[3]!) },
        uCvFall: { value: new THREE.Vector4(l.fall.amount, l.fall.power, l.deep.amount, l.deep.below) },
        uCvUmbra: { value: new THREE.Vector4(s.floor, s.fibres.head, s.fibres.level, s.fibres.edge) },
        uCvFibreLook: { value: new THREE.Vector4(s.fibres.gap, s.strands.reach[0]!, s.strands.reach[1]!, s.strands.rate) },
        uCvVeil: { value: new THREE.Vector4(l.veil.amount, l.veil.level, l.veil.most, l.veil.from) },
        uCvVeilTint: { value: new THREE.Vector3().fromArray((l.veil.tint as number[]).map(srgbToLinear)) },
        uCvFar: { value: new THREE.Vector4(l.far.from, l.far.to, l.far.level, l.far.keep) },
        uCvFlat: { value: new THREE.Vector4(l.far.flat[0]!, l.far.flat[1]!, l.far.lane, 0) },
      },
    })
    // Rings round the point under the stage's camera. Their spacing follows what a pixel covers on the ground from the
    // stage's own eye, 1 unit up: the finest step out to m.fineTo, then wider as 1 plus the arc squared up to m.coarse
    // (a few rings to a cell), kept as far as the relief is real; beyond that m.tail rings, each a fixed share wider
    // than the last, out to the cap.
    const arcs = [0]
    while (arcs[arcs.length - 1]! < m.real[1]!) {
      const a = arcs[arcs.length - 1]!
      arcs.push(a + Math.min(m.coarse, m.step * Math.max(1, (1 + a * a) / (1 + m.fineTo * m.fineTo))))
    }
    const reach = THREE.MathUtils.degToRad(m.capDeg) * stage.radius - arcs[arcs.length - 1]!
    let low = 1
    let high = 1.2
    const sum = (g: number): number => (m.coarse * g * (Math.pow(g, m.tail) - 1)) / (g - 1)
    for (let k = 0; k < 60; k++) {
      const mid = (low + high) / 2
      if (sum(mid) < reach) low = mid
      else high = mid
    }
    for (let i = 1; i <= m.tail; i++) arcs.push(arcs[arcs.length - 1]! + m.coarse * Math.pow(low, i))
    // The mesh is cut in pieces (bands of rings by wedges of sectors) that share their edges exactly; a piece that
    // lies outside the picture or behind the horizon is not drawn. Which pieces are drawn follows from the eye alone.
    const per = m.sectors / m.wedges
    const index = new Uint16Array(m.band * per * 6)
    let n = 0
    for (let i = 0; i < m.band; i++) {
      for (let j = 0; j < per; j++) {
        const a = i * (per + 1) + j
        const b = a + 1
        const cc = a + per + 1
        const d = cc + 1
        index[n++] = a
        index[n++] = cc
        index[n++] = b
        index[n++] = b
        index[n++] = cc
        index[n++] = d
      }
    }
    const faces = new THREE.BufferAttribute(index, 1)
    const up = stage.down.clone().negate()
    const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
    const right = fwd.clone().cross(up).normalize()
    const onBall = (arc: number, turn: number): THREE.Vector3 => {
      const alpha = arc / stage.radius
      return up.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(right, Math.sin(alpha) * Math.cos(turn)).addScaledVector(fwd, Math.sin(alpha) * Math.sin(turn))
    }
    this.material.side = THREE.DoubleSide
    // the gas gives its light already weighed by how much of the look it holds, and leaves the rest to what was
    // drawn behind it (the sky over the limb, the globe's own face on the globe's side)
    const weighed = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor } as const
    this.material.setValues(weighed)
    this.laid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: this.material.uniforms, transparent: true, side: THREE.DoubleSide, ...weighed })
    this.mesh = new THREE.Group()
    this.mesh.renderOrder = -6
    // The bake. One triangle over the whole buffer; the buffer is as large as the picture and g.margin wider each
    // way, so the ground a little outside the picture is there for the rays that end under it. It is sized at the
    // first picture and made then, with its program; after that no frame makes anything for it.
    this.baked = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false })
    this.material.uniforms.uCvBaked!.value = this.baked.texture
    this.baker = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG, uniforms: this.material.uniforms, depthTest: false, depthWrite: false })
    const whole = new THREE.BufferGeometry()
    whole.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    const over = new THREE.Mesh(whole, this.baker)
    over.frustumCulled = false
    this.bakeScene.add(over)
    // (what starts the bake: a thing of the ground's own group that the renderer reaches before any piece and
    // that draws no pixel itself)
    const none = new THREE.BufferGeometry()
    none.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
    none.setDrawRange(0, 0)
    const quiet = new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false, depthWrite: false })
    const first = new THREE.Mesh(none, quiet)
    first.frustumCulled = false
    first.renderOrder = -7
    first.onBeforeRender = (renderer, _scene, camera) => this.bakeNow(renderer, camera, g.margin, g.fine)
    this.mesh.add(first)
    this.bakeParts.push(whole, none, quiet)
    for (let i0 = 0; i0 < arcs.length - 1; i0 += m.band) {
      for (let w = 0; w < m.wedges; w++) {
        const positions = new Float32Array((m.band + 1) * (per + 1) * 3)
        for (let i = 0; i <= m.band; i++) {
          for (let j = 0; j <= per; j++) {
            const k = (i * (per + 1) + j) * 3
            positions[k] = arcs[Math.min(i0 + i, arcs.length - 1)]!
            positions[k + 1] = (((w * per + j) % m.sectors) / m.sectors) * Math.PI * 2
            positions[k + 2] = 0
          }
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setIndex(faces)
        const a0 = arcs[i0]!
        const a1 = arcs[Math.min(i0 + m.band, arcs.length - 1)]!
        const mid = onBall((a0 + a1) / 2, ((w + 0.5) * per / m.sectors) * Math.PI * 2)
        let wide = 0
        for (const a of [a0, a1]) for (const t of [w, w + 0.5, w + 1]) wide = Math.max(wide, mid.angleTo(onBall(a, ((t * per) / m.sectors) * Math.PI * 2)))
        geometry.boundingSphere = new THREE.Sphere(stage.centre.clone().addScaledVector(mid, stage.radius), 2 * stage.radius * Math.sin(wide / 2) + m.relief)
        const piece = new THREE.Mesh(geometry, this.material)
        piece.renderOrder = -6
        this.mesh.add(piece)
        const entry = { mesh: piece, mid, wide, seen: false }
        this.pieces.push(entry)
        // The renderer puts a geometry on the card (its buffer, and a vertex array for each program) at its first
        // draw, and a piece is first drawn when the eye's horizon reaches it: in the rise that was a little work in
        // nearly every frame. So the first picture a material draws binds every piece: the pieces that picture does
        // not show (behind the horizon, or outside the picture by the renderer's own test) are drawn with no
        // elements, which makes what the card needs and no pixel. After that no frame makes anything for the ground.
        piece.onBeforeRender = (_renderer, _scene, camera) => {
          if (!this.binding) return
          this.screen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
          this.frustum.setFromProjectionMatrix(this.screen, THREE.WebGLCoordinateSystem, (camera as THREE.Camera & { reversedDepth?: boolean }).reversedDepth === true)
          this.ball.copy(geometry.boundingSphere!).applyMatrix4(piece.matrixWorld)
          geometry.setDrawRange(0, entry.seen && this.frustum.intersectsSphere(this.ball) ? Infinity : 0)
        }
        piece.onAfterRender = (_renderer, _scene, _camera, _geometry, material) => {
          if (!this.binding) return
          geometry.setDrawRange(0, Infinity)
          this.bound.add(material)
        }
      }
    }
    this.over = Math.acos(stage.radius / (stage.radius + m.relief))
  }

  /** eye: the eye in the stage's own frame. keep: how much of the ground is drawn over what lies under it (1 in the
   * close view; on the globe's side it falls with the eye's height). onGlobe: the ground lies on the globe. */
  update(time: number, eye: THREE.Vector3, keep = 1, onGlobe = false): void {
    this.material.uniforms.uCvTime!.value = time
    this.material.uniforms.uCvKeep!.value = keep
    // (on the globe the ground leaves by the distance from the eye, place.json onGlobe.away; the close view holds
    // nothing as far away as that range begins)
    const away = place.onGlobe.away as [number, number]
    const red = place.onGlobe.red.over as [number, number]
    ;(this.material.uniforms.uCvAway!.value as THREE.Vector4).set(onGlobe ? away[0] : 0, onGlobe ? away[1] : 0, onGlobe ? red[0] : 0, onGlobe ? red[1] : 0)
    this.mesh.visible = keep > 0
    const material = onGlobe ? this.laid : this.material
    const from = this.towards.copy(eye).sub(stage.centre)
    const horizon = Math.acos(Math.min(stage.radius / from.length(), 1)) + this.over
    from.normalize()
    // a material that has not drawn yet binds every piece in its first picture (see the constructor)
    this.binding = !this.bound.has(material)
    for (const piece of this.pieces) {
      piece.seen = piece.mid.angleTo(from) - piece.wide < horizon
      piece.mesh.material = material
      piece.mesh.visible = piece.seen || this.binding
      piece.mesh.frustumCulled = !this.binding
    }
  }

  /** Draws the cell diagram of this sample into the buffer, as the camera of the picture sees the ground. */
  private bakeNow(renderer: THREE.WebGLRenderer, camera: THREE.Camera, margin: number, fine: number): void {
    const u = this.material.uniforms
    const target = renderer.getRenderTarget()
    if (target) this.size.set(target.width, target.height)
    else renderer.getDrawingBufferSize(this.size)
    // (the buffer is counted in pixels of the 16 by 9 master, not of the format: it is as large for a frame of any
    // size, and the picture is the same)
    const wide = this.size.x / formatUniform.value
    const high = this.size.y / formatUniform.value
    // (a frame smaller than the master needs no more of the diagram than it can show: there the buffer is as much
    // smaller each way, and every measure that is counted in it is still counted in pixels of the master
    // (uCvThreadFar.z, the texels of the buffer to a master pixel), so whatever comes in or goes out by size does
    // so at the same moment. A frame larger than the master keeps the master's buffer)
    const small = Math.min(formatUniform.value, 1)
    const w = Math.ceil(wide * margin * fine * small)
    const h = Math.ceil(high * margin * fine * small)
    if (this.baked.width !== w || this.baked.height !== h) this.baked.setSize(w, h)
    ;(u.uCvThreadFar!.value as THREE.Vector4).z = fine * small
    // from the stage's own frame to the picture, and to the buffer (the same look, margin wider each way)
    this.toClip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.mesh.matrixWorld)
    ;(u.uCvClip!.value as THREE.Matrix4).copy(this.toClip)
    this.wider.makeScale((wide * fine * small) / w, (high * fine * small) / h, 1)
    this.toBake.multiplyMatrices(this.wider, this.toClip)
    ;(u.uCvBake!.value as THREE.Matrix4).copy(this.toBake)
    // the eye in the stage's frame, and the ray of every place of the buffer
    this.back.copy(this.mesh.matrixWorld).invert()
    const eye = (u.uCvEye!.value as THREE.Vector3).setFromMatrixPosition(camera.matrixWorld).applyMatrix4(this.back)
    this.back.copy(this.toBake).invert()
    this.at0.set(0, 0, 0.5).applyMatrix4(this.back)
    this.atX.set(1, 0, 0.5).applyMatrix4(this.back).sub(this.at0)
    this.atY.set(0, 1, 0.5).applyMatrix4(this.back).sub(this.at0)
    ;(u.uCvRay0!.value as THREE.Vector3).copy(this.at0).sub(eye)
    ;(u.uCvRayX!.value as THREE.Vector3).copy(this.atX)
    ;(u.uCvRayY!.value as THREE.Vector3).copy(this.atY)
    // Only the part of the buffer that holds the ball is drawn: the march reads the buffer at the place of a point
    // of the ball alone, so no place whose ray misses the ball is ever read. The box round the ball in the buffer
    // is found from the eye alone: the ball seen from the eye is a round cone, its cut with the buffer has no
    // hollow, so the box round it touches either a point of the ball's edge that lies in the buffer or a point of
    // the buffer's own edge whose ray meets the ball. Both are walked, and the box is taken box.pad texels wider
    // (convect.json gas.box: edge and rim are how many points of the buffer's edge and of the ball's edge are walked).
    const box = data.gas.box
    const oc = this.fromMid.copy(eye).sub(stage.centre)
    const far2 = oc.lengthSq() - stage.radius * stage.radius
    let x0 = Infinity
    let x1 = -Infinity
    let y0 = Infinity
    let y1 = -Infinity
    const meets = (x: number, y: number): void => {
      const ray = this.ray.copy(u.uCvRay0!.value as THREE.Vector3).addScaledVector(this.atX, x).addScaledVector(this.atY, y).normalize()
      const bq = oc.dot(ray)
      if (bq < 0 && bq * bq - far2 > 0) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
    }
    for (let i = 0; i <= box.edge; i++) {
      const s = (i / box.edge) * 2 - 1
      meets(s, -1)
      meets(s, 1)
      meets(-1, s)
      meets(1, s)
    }
    if (far2 > 0) {
      // (the ball's edge as the eye sees it: a circle round the line from the ball's middle to the eye)
      const d = oc.length()
      const mid = this.rimMid.copy(stage.centre).addScaledVector(oc, (stage.radius * stage.radius) / (d * d))
      const rim = stage.radius * Math.sqrt(far2) / d
      const a = this.rimA.set(1, 0, 0)
      if (Math.abs(oc.x) > 0.9 * d) a.set(0, 1, 0)
      a.addScaledVector(oc, -a.dot(oc) / (d * d)).normalize()
      const b = this.rimB.copy(oc).cross(a).normalize()
      const m = this.toBake.elements
      for (let i = 0; i < box.rim; i++) {
        const turn = (i / box.rim) * Math.PI * 2
        const p = this.ray.copy(mid).addScaledVector(a, rim * Math.cos(turn)).addScaledVector(b, rim * Math.sin(turn))
        const cw = m[3]! * p.x + m[7]! * p.y + m[11]! * p.z + m[15]!
        if (!(cw > 0)) continue
        const cx = (m[0]! * p.x + m[4]! * p.y + m[8]! * p.z + m[12]!) / cw
        const cy = (m[1]! * p.x + m[5]! * p.y + m[9]! * p.z + m[13]!) / cw
        if (Math.abs(cx) <= 1 && Math.abs(cy) <= 1) {
          x0 = Math.min(x0, cx)
          x1 = Math.max(x1, cx)
          y0 = Math.min(y0, cy)
          y1 = Math.max(y1, cy)
        }
      }
    } else {
      x0 = y0 = -1
      x1 = y1 = 1
    }
    const left = Math.max(Math.floor((x0 * 0.5 + 0.5) * w) - box.pad, 0)
    const low = Math.max(Math.floor((y0 * 0.5 + 0.5) * h) - box.pad, 0)
    const right = Math.min(Math.ceil((x1 * 0.5 + 0.5) * w) + box.pad, w)
    const top = Math.min(Math.ceil((y1 * 0.5 + 0.5) * h) + box.pad, h)
    this.baked.scissorTest = true
    if (right > left && top > low) this.baked.scissor.set(left, low, right - left, top - low)
    else this.baked.scissor.set(0, 0, 1, 1)
    const xr = renderer.xr.enabled
    renderer.xr.enabled = false
    renderer.setRenderTarget(this.baked)
    renderer.render(this.bakeScene, this.bakeEye)
    renderer.setRenderTarget(target)
    renderer.xr.enabled = xr
  }

  dispose(): void {
    for (const piece of this.pieces) piece.mesh.geometry.dispose()
    for (const part of this.bakeParts) part.dispose()
    this.baked.dispose()
    this.baker.dispose()
    this.material.dispose()
    this.laid.dispose()
    this.ramp.dispose()
  }
}
