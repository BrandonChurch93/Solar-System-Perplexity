import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import fit from './close.json'
import look from './deep.json'
import patches from './patches.json'
import { ground, placeTurn } from './band'
import { MAP_DECL, MAP_UNIFORMS, mapGlsl } from './planet'

// The surface view of Neptune as one scene made by functions: a cloud deck with height (rolls, the storm as a bowl with walls and arms),
// cirrus as a volume above it that is marched and lit by a march toward the Sun (the same density casts the shadow on the deck), a wind
// (along the band with a jet, round the storm with its own spin) that carries every octave in rows of the octave's own size, so nothing
// is drawn out, and air whose density falls with height. No picture is read. Every number is in deep.json.

const STREAMERS = look.cirrus.streamers.length
// The globe's own map in this scene: the same lines of shader as the globe draws with (planet.ts, mapGlsl), its uniforms under names
// with a G so that none meets a name of the scene, and the same uniform objects, so both read one state.
const globe = (text: string): string => text.replace(/\bu([A-Z])/g, 'uG$1')

const VERT = /* glsl */ `
uniform vec3 uCentre;
out vec3 vPos;
out vec3 vClip;
void main() {
  vPos = position + uCentre;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCentre;
uniform vec3 uCam;
uniform float uRadius;
uniform vec3 uE0;
uniform vec3 uE1;
uniform vec3 uAxis;
uniform vec3 uSun;
uniform vec3 uFarSun;
uniform float uTime;
uniform float uPix;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uShow;
uniform vec3 uFallPivot;
uniform vec3 uFallPower;
uniform vec4 uCap;
uniform vec3 uPlaceUp;
uniform float uGridShow;
uniform vec4 uStorm;
uniform vec4 uBowl;
uniform vec4 uArms;
uniform vec4 uArmMake;
uniform vec4 uSpin;
uniform vec4 uCollar;
uniform vec4 uArmIn;
uniform float uVeilSizes;
uniform vec4 uWind;
uniform vec4 uCirrusWind;
uniform vec4 uDeckWave;
uniform vec4 uDeckMake;
uniform vec4 uSpiral;
uniform vec3 uNight;
uniform vec3 uBlue;
uniform vec3 uPale;
uniform vec4 uDeckTone;
uniform vec2 uBounds;
uniform vec2 uShell;
uniform vec4 uStreamLine[${STREAMERS}];
uniform vec4 uStreamBody[${STREAMERS}];
uniform vec4 uStreamMake[${STREAMERS}];
uniform vec4 uStreamWide[${STREAMERS}];
uniform vec4 uCirrusWave;
uniform vec4 uCirrusMake;
uniform vec4 uCirrusBody;
uniform vec4 uCirrusWarp;
uniform vec4 uCirrusStep;
uniform vec4 uCirrusSkip;
uniform vec4 uCirrusBend;
uniform vec3 uCirrusBillow;
uniform vec4 uCirrusFringe;
uniform vec3 uFarStreak;
uniform vec3 uWest;
uniform vec4 uCirrusDeep;
uniform vec4 uBand;
uniform vec4 uWisp;
uniform vec4 uNear;
uniform vec4 uZoneEnd;
uniform vec4 uVortex;
uniform vec4 uVortexRim;
uniform vec4 uFanLeft;
uniform vec4 uFanRight;
uniform vec4 uFanFar;
uniform vec4 uFanBand;
uniform vec4 uFanWest;
uniform vec4 uFanMake;
uniform vec2 uVeil;
uniform vec2 uVeilFall;
uniform vec3 uVeilLight;
uniform float uStreamFan[${STREAMERS}];
uniform float uStreamBend[${STREAMERS}];
uniform vec4 uDeckFine;
uniform vec4 uHazeLow;
uniform vec4 uHazeHigh;
uniform vec3 uHazeLowColour;
uniform vec3 uHazeHighColour;
uniform vec4 uHazeMake;
uniform vec4 uLight;
uniform vec3 uSkyLight;
uniform vec3 uCloudLight;
uniform vec4 uLightMake;
uniform vec3 uThrough;
uniform mat3 uToBody;
uniform vec4 uFar;
uniform vec3 uFarTone;
uniform vec3 uFarPower;
uniform vec3 uFarHigh;
uniform vec4 uFarFall;
uniform vec3 uFarCloud;
${globe(MAP_DECL)}in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${DIAG_GLSL}

const float PI = 3.14159265358979;
${globe(mapGlsl(patches.place.shownFrom))}
// The thin bright streaks of the deck at the place deckField was last asked about (0 to about 1): the ridges of its finer octaves.
float gWisp = 0.0;

float hash3(ivec3 p) {
  uint h = uint(p.x) * 0x9E3779B1u ^ uint(p.y) * 0x85EBCA77u ^ uint(p.z) * 0xC2B2AE3Du;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  return float(h) * (1.0 / 4294967296.0);
}
// Smooth noise from 0 to 1 with one cell per unit.
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = x - i;
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  ivec3 c = ivec3(i);
  float a = hash3(c);
  float b = hash3(c + ivec3(1, 0, 0));
  float d = hash3(c + ivec3(0, 1, 0));
  float e = hash3(c + ivec3(1, 1, 0));
  float g = hash3(c + ivec3(0, 0, 1));
  float h = hash3(c + ivec3(1, 0, 1));
  float j = hash3(c + ivec3(0, 1, 1));
  float k = hash3(c + ivec3(1, 1, 1));
  return mix(mix(mix(a, b, w.x), mix(d, e, w.x), w.y), mix(mix(g, h, w.x), mix(j, k, w.x), w.y), w.z);
}
float ease(float f) {
  return f * f * (3.0 - 2.0 * f);
}
// Two neighbours that share nothing, blended by f: the blend keeps the contrast either has alone.
float blend(float a, float b, float f) {
  return 0.5 + (mix(a, b, f) - 0.5) * inversesqrt(f * f + (1.0 - f) * (1.0 - f));
}
// The fan: what the eye of the surface view sees of the deck over its frames, a wedge on the ground (deep.json, fan). 1 inside it,
// 0 farther outside it than the border: a weight by distance on the ground, never by time or height. fanIn: how far inside the fan
// a place lies (less than 0 outside).
float fanIn(vec2 uv) {
  return min(min(dot(uFanLeft.xy, uv) - uFanLeft.z, dot(uFanRight.xy, uv) - uFanRight.z), uFanFar.z - dot(uFanFar.xy, uv));
}
float fanOf(vec2 uv) {
  return smoothstep(-uFanFar.w, 0.0, fanIn(uv));
}
// u along the band, v across it, height over the smooth deck, of a point given from the planet's centre.
vec3 bandOf(vec3 q) {
  float r = length(q);
  vec3 n = q / r;
  return vec3(uRadius * atan(dot(n, uE1), dot(n, uE0)), uRadius * asin(clamp(dot(n, uAxis), -1.0, 1.0)), r - uRadius);
}
// The wind of the deck along the band at a place across it, and the spin of the storm at a distance from its middle (radians a second).
float wind(float v) {
  return uWind.x + uWind.y * sin(v * uWind.z + uWind.w);
}
// The veil: a thin sheet of ice haze over the deck inside the fan, where the approved close image has its pale far deck (deep.json,
// fan.veil). Its density at a place, 0 to 1: it sets in across the flow, ends toward the west and lies in bands along the flow of uVeilSizes
// sizes (across: uFanMake.x and each next 0.41 of the one before, each uFanMake.y times as long) that ride the wind; a size is left out before a pixel's footprint across
// the flow (least) holds a wave of it.
float veilAt(vec2 uv, float least, float t) {
  float vt = uv.y + uFanBand.x * uv.x;
  float shape = smoothstep(uFanBand.y, uFanBand.z, vt) * smoothstep(uFanWest.x, uFanWest.y, uv.x) * fanOf(uv);
  if (shape <= 0.0) return 0.0;
  float sum = 0.0;
  float lam = uFanMake.x;
  float amp = 0.5;
  for (int k = 0; k < int(uVeilSizes); k++) {
    float keep = smoothstep(least, 2.0 * least, lam);
    sum += amp * keep * (vnoise(vec3(vt / lam + 7.3 * float(k), (uv.x - wind(uv.y) * t) / (lam * uFanMake.y), 4.5 + 5.0 * float(k))) - 0.5);
    amp *= 0.62;
    lam *= 0.41;
  }
  return shape * mix(1.0 - uFanBand.w, 1.0, clamp(0.5 + uFanMake.z * sum, 0.0, 1.0));
}
// The veil's optical depth along a ray from the eye. The sheet is cut into layers; a ray crosses each on its way down and, if the
// deck does not stop it (through), again on its way up, and its path inside a layer is as long as the sphere makes it: short from
// above, long along a low line of sight, so the far deck goes pale and the limb bright while the view from above stays nearly
// clear. b: the ray's direction times the eye from the centre; rt2: the square of its nearest distance to the centre. The eye
// stands over the sheet. The sheet thins upward by a power (uVeilFall: the power and the weight that keeps the whole depth), so
// its top is no edge at the limb. It is haze among the rolls of the deck as much as over them: a ray that ends on a roll is read
// as far as the smooth deck, so no roll cuts its outline into the sheet (deck.relief stands up to the sheet's own height).
float veilDepth(vec3 oc, vec3 rd, float b, float rt2, bool through, float pix, float t) {
  float sum = 0.0;
  float span = uVeil.y - uVeil.x;
  for (int k = 0; k < int(uFanMake.w); k++) {
    float r0 = uRadius + mix(uVeil.x, uVeil.y, float(k) / uFanMake.w);
    float r1 = uRadius + mix(uVeil.x, uVeil.y, (float(k) + 1.0) / uFanMake.w);
    float d1 = r1 * r1 - rt2;
    if (d1 <= 0.0) continue;
    // The ray's part inside the layer, measured from its nearest point to the centre: from l0 to l1.
    float l1 = sqrt(d1);
    float l0 = sqrt(max(r0 * r0 - rt2, 0.0));
    float lm = 0.5 * (l0 + l1);
    // The density falls from the underside (1) to the top (0); it is read at two points of the part (the rule of two points),
    // where the ray is there, so the sum has no step where a line of sight comes under a layer.
    float lg = 0.288675 * (l1 - l0);
    float ua = clamp((uRadius + uVeil.y - sqrt(rt2 + (lm - lg) * (lm - lg))) / span, 1e-4, 1.0);
    float ub = clamp((uRadius + uVeil.y - sqrt(rt2 + (lm + lg) * (lm + lg))) / span, 1e-4, 1.0);
    float len = uVeilFall.y * 0.5 * (pow(ua, uVeilFall.x) + pow(ub, uVeilFall.x)) * (l1 - l0);
    float mu = max(lm / sqrt(rt2 + lm * lm), 0.02);
    for (int way = 0; way < (through ? 2 : 1); way++) {
      float tm = way == 0 ? -b - lm : -b + lm;
      if (tm > 0.0) sum += len * veilAt(bandOf(oc + rd * tm).xy, 1.5 * tm * pix / mu, t);
    }
  }
  return sum * uFanWest.w;
}
float spin(float r) {
  float x = r / uSpin.y;
  return uSpin.x / (1.0 + x * x);
}
// One octave that rides the band's wind. The octave is cut into rows of its own size across the wind; each row rides whole at the speed
// of its middle and neighbours are blended, so a form of that size is carried and never drawn out. z: the octave's own change with time.
float zonal(vec2 uv, float lam, float st, float t, float seed) {
  float s = uDeckMake.w * lam;
  float g = uv.y / s;
  float j = floor(g);
  float f = ease(g - j);
  float z = t * uDeckMake.z / sqrt(lam) + seed;
  vec3 a = vec3((uv.x - wind(j * s) * t) * st / lam + seed + 19.7 * j, uv.y / lam, z);
  vec3 b = vec3((uv.x - wind((j + 1.0) * s) * t) * st / lam + seed + 19.7 * (j + 1.0), uv.y / lam, z);
  return blend(vnoise(a), vnoise(b), f);
}
// The same for the storm: rings of the octave's own size, each turning whole at the spin of its middle. rho is the logarithm of the
// distance, th the angle; the pitch (pt) winds the octave into a spiral. A pitch shears the octave: at pitch 3 a round lump of the
// noise is drawn out eleven times as long as broad, at pitch 6 thirty eight times, so only the long octaves take it and the
// short ones none (deckField), and those stay as round as their sizes along and across make them.
float winding(float rho, float th, float lam, float al, float pt, float t, float seed) {
  float s = uDeckMake.w * lam / uSpiral.x;
  float g = rho / s;
  float j = floor(g);
  float f = ease(g - j);
  float a0 = th + pt * rho;
  float aa = a0 - spin(max(exp(j * s) - uArms.w, 0.0)) * t;
  float ab = a0 - spin(max(exp((j + 1.0) * s) - uArms.w, 0.0)) * t;
  float z = rho * uSpiral.x / lam + t * uDeckMake.z / sqrt(lam);
  // The angle is read on a circle whose size follows the distance as the logarithm does (the core added under it), so a wave is
  // as long round the middle as the rule says at every distance and the middle itself is a place like any other, no hub of spokes.
  float rim = exp(rho);
  float ring = al / lam * max(rim - uArms.w, 0.0) / rim;
  vec3 pa = vec3(cos(aa) * ring + seed + 19.7 * j, sin(aa) * ring, z);
  vec3 pb = vec3(cos(ab) * ring + seed + 19.7 * (j + 1.0), sin(ab) * ring, z);
  return blend(vnoise(pa), vnoise(pb), f);
}
// The structure of the deck at a place, round 0: its octaves from the longest wavelength down to least (an octave fades out as its
// wavelength falls from twice least to least; least.x, least.y: what a pixel covers across and along the band, least.z: round the
// storm). The longest waves are bands, drawn out along the wind (uDeckWave.y); each shorter octave is drawn out less, by a power of
// its wavelength (uDeckWave.w), until it is as long as broad: cloud in lumps between the bands, not streaks at every size. And every
// octave is carried across the wind by the longer ones (uArmMake.w, in wavelengths of the carrying octave), so a band meanders and
// what lies in it curls with it. finest: the shortest wavelength that took part.
float deckField(vec2 uv, vec3 least, float t, out float finest) {
  vec2 d = uv - uStorm.xy;
  float r = length(d);
  float th = atan(d.y, d.x);
  float rho = log(r + uArms.w);
  float m = exp(-(r * r) / (uStorm.w * uStorm.w));
  float local = (r + uArms.w) / uSpiral.x;
  float sum = 0.0;
  float amp = 1.0;
  float thin = 0.0;
  float thinAmp = 1.0;
  float lam = uDeckWave.x;
  float carry = 0.0;
  finest = lam;
  for (int k = 0; k < int(uDeckMake.y); k++) {
    float draw = pow(uDeckWave.x / lam, uDeckWave.w);
    float st = min(uDeckWave.y * draw, 1.0);
    float al = min(uSpiral.y * draw, uSpiral.x);
    float pt = uArms.y * (1.0 - clamp((al - uSpiral.y) / max(uSpiral.x - uSpiral.y, 1e-4), 0.0, 1.0));
    float leastZ = max(least.x, least.y * st);
    float keepZ = smoothstep(leastZ, 2.0 * leastZ, lam);
    float keepW = smoothstep(least.z, 2.0 * least.z, lam * local);
    if (keepZ <= 0.0 && keepW <= 0.0) break;
    float seed = 17.3 * float(k) + 0.5;
    float z = 0.0;
    float w = 0.0;
    float rz = 0.0;
    float rw = 0.0;
    if (m < 0.985 && keepZ > 0.0) {
      float n = zonal(vec2(uv.x, uv.y + carry), lam, st, t, seed);
      z = keepZ * (n - 0.5);
      rz = keepZ * pow(1.0 - abs(2.0 * n - 1.0), uWisp.y);
    }
    if (m > 0.015 && keepW > 0.0) {
      float n = winding(rho + carry / uSpiral.x, th, lam, al, pt, t, seed);
      w = keepW * (n - 0.5);
      rw = keepW * pow(1.0 - abs(2.0 * n - 1.0), uWisp.y);
    }
    sum += amp * mix(z, w, m);
    carry += uArmMake.w * 2.0 * lam * mix(z, w, m);
    if (float(k) >= uWisp.x) {
      thin += thinAmp * mix(rz, rw, m);
      thinAmp *= uWisp.z;
    }
    finest = lam * mix(1.0, local, m);
    amp *= uDeckMake.x;
    lam *= 0.5;
  }
  gWisp = thin * (1.0 - uWisp.z);
  return sum * (1.0 - uDeckMake.x) * 2.0;
}
// The height of the deck over the smooth sphere, and (out) the parts the colour needs: field (structure, round 0), arm (0 to 1 on an
// arm of the storm), eye (1 on the floor of the bowl, 0 outside the wall), r (distance from the storm's middle).
float deckHeight(vec2 uv, vec3 least, float t, out vec4 parts, out float finest) {
  vec2 d = uv - uStorm.xy;
  float r = length(d);
  float x = r / uStorm.z;
  float field = deckField(uv, least, t, finest);
  // The wall of the bowl is ragged: the winding streaks of the deck move it in and out.
  float eye = 1.0 - smoothstep(uBowl.y, uBowl.z, x * (1.0 + uBowl.w * field));
  float rho = log(r + uArms.w);
  float turn = atan(d.y, d.x) + uArms.y * rho - uSpin.x * uSpin.z * t;
  float arm = 0.5 + 0.5 * cos(uArms.x * turn + uArmMake.x * 6.2831853 * field);
  float armShare = smoothstep(uArmIn.x, uArmIn.y, x) * exp(-(r * r) / (uStorm.w * uStorm.w));
  parts = vec4(field, arm * armShare, eye, r);
  return -uBowl.x * eye + uArms.z * armShare * arm + uDeckWave.z * field * (1.0 - 0.6 * eye);
}
// Cirrus. The body of each streamer is a line along the band (bowed across it by bow at its middle) with a width, an underside and a
// thickness, thick and thin along its length; it rides the cirrus wind whole. lee (out): how far out on its fringe a point lies, 1 on the
// side away from the Sun, where it trails widest, and a share of that (uCirrusFringe.y) on the side toward the Sun. crest (out): the
// body without that trail, as narrow on the side away from the Sun as toward it: what the heaps stand in. low (out): 1 in the lower
// part of the body, where the fibres trail (uCirrusFringe.z to w, shares of its thickness, over which they end upward).
float cirrusBody(vec3 straight, vec3 bent, float t, out float lee, out float crest, out float low, out float away) {
  float best = 0.0;
  away = 1e3;
  lee = 0.0;
  crest = 0.0;
  low = 0.0;
  float ride = uCirrusWind.x * t;
  // First which streamers' rooms hold the place (cheap), then the body of each of those and of no other: three at most.
  int holds = 0;
  ivec3 which = ivec3(0);
  for (int i = 0; i < ${STREAMERS}; i++) {
    vec4 line = uStreamLine[i];
    vec4 body = uStreamBody[i];
    // Each streamer takes its own share of the bend: a thin far one stays a line.
    vec3 p = mix(straight, bent, uStreamBend[i]);
    float z = (p.z - body.y) / body.z;
    float along = (p.x - ride - line.x) / (line.y - line.x);
    float ac = clamp(along, 0.0, 1.0);
    float off = p.y - mix(line.z, line.w, ac) - uStreamWide[i].z * 4.0 * ac * (1.0 - ac);
    float semi = body.x * mix(uStreamWide[i].x, uStreamWide[i].y, ac);
    // away: how far the bent place stands outside the room of the nearest streamer (0 inside one); the march passes empty room by it.
    float dy = max(off - 2.53 * semi, -off - (2.23 * uCirrusMake.z + 0.3) * semi) * uStreamWide[i].w;
    bool outside = z <= 0.0 || z >= 1.05 || along <= 0.0 || along >= 1.0 || off > 2.53 * semi || off < -(2.23 * uCirrusMake.z + 0.3) * semi;
    if (outside) {
      away = min(away, max(max(max(dy, max(body.y - p.z, p.z - body.y - 1.05 * body.z)), max(line.x + ride - p.x, p.x - ride - line.y)), 0.0));
    } else {
      if (holds == 0) which.x = i;
      if (holds == 1) which.y = i;
      if (holds == 2) which.z = i;
      holds++;
    }
  }
  for (int c = 0; c < min(holds, 3); c++) {
    int i = c == 0 ? which.x : (c == 1 ? which.y : which.z);
    vec4 line = uStreamLine[i];
    vec4 body = uStreamBody[i];
    vec4 make = uStreamMake[i];
    vec3 p = mix(straight, bent, uStreamBend[i]);
    float z = (p.z - body.y) / body.z;
    float along = (p.x - ride - line.x) / (line.y - line.x);
    float off = p.y - mix(line.z, line.w, along) - uStreamWide[i].z * 4.0 * along * (1.0 - along);
    float semi = body.x * mix(uStreamWide[i].x, uStreamWide[i].y, along);
    float ends = smoothstep(0.0, make.x / (line.y - line.x), along) * (1.0 - smoothstep(1.0 - make.x / (line.y - line.x), 1.0, along));
    float lump = vnoise(vec3((p.x - ride) / make.y + make.w, make.w * 1.7, 0.5));
    float lump2 = vnoise(vec3((p.x - ride) / (make.y * 0.37) + make.w * 2.3, make.w, 3.5));
    float strength = body.w * ends * mix(1.0 - make.z, 1.0, smoothstep(0.25, 0.75, lump)) * (1.0 - uStreamFan[i] * fanOf(p.xy));
    float width = semi * (0.65 + 0.7 * lump2);
    float y = off - 0.6 * semi * (lump2 - 0.5);
    float side = step(y, 0.0);
    float across = y / (width * mix(1.0, uCirrusMake.z, side));
    float up = smoothstep(0.0, 0.3, z) * (1.0 - smoothstep(0.55 + 0.4 * lump, 1.05, z));
    float e = strength * exp(-across * across) * up - uCirrusStep.w;
    // Inside the room but outside the body: the body ends where its bell falls under the floor, edge widths from its middle line
    // (at its full height; lower and higher it is narrower), and the place stands this far outside that.
    float edge = sqrt(max(log(max(strength, 1e-6) / (uCirrusStep.w + 0.002)), 0.0));
    away = min(away, e > 0.002 ? 0.0 : max(abs(across) - edge, 0.0) * width * mix(1.0, uCirrusMake.z, side) * uStreamWide[i].w);
    if (e > best) {
      best = e;
      lee = mix(uCirrusFringe.y, 1.0, side) * smoothstep(0.0, 1.0, abs(across));
      crest = strength * exp(-(y * y) / (width * width)) * up - uCirrusStep.w;
      low = 1.0 - smoothstep(uCirrusFringe.z, uCirrusFringe.w, z);
    }
  }
  away = max(away, 0.0);
  return best;
}
// How far a point is at least from the room any streamer can fill (0 inside it). The room: where the body stands over its floor
// (1.65 widths from the middle line for a floor of 0.06 and a density under 0.9), its meander and the bend.
float cirrusFar(vec3 p, float t) {
  float best = 1e3;
  float ride = uCirrusWind.x * t;
  for (int i = 0; i < ${STREAMERS}; i++) {
    vec4 line = uStreamLine[i];
    vec4 body = uStreamBody[i];
    float along = clamp((p.x - ride - line.x) / (line.y - line.x), 0.0, 1.0);
    float off = p.y - mix(line.z, line.w, along) - uStreamWide[i].z * 4.0 * along * (1.0 - along);
    float semi = body.x * mix(uStreamWide[i].x, uStreamWide[i].y, along);
    float bent = uCirrusWarp.x * (1.0 + uCirrusBend.y * (1.0 + uCirrusBend.y));
    float dy = max(off - 2.53 * semi, -off - (2.23 * uCirrusMake.z + 0.3) * semi) * uStreamWide[i].w - 0.75 * bent;
    float dz = max(body.y - p.z, p.z - body.y - 1.05 * body.z) - 0.42 * bent;
    float dx = max(line.x + ride - p.x, p.x - ride - line.y);
    // A streamer of the globe's own map has nothing inside the fan: there its room ends at the fan's border.
    float dFan = uStreamFan[i] * (fanIn(p.xy) - 0.75 * bent) - (1.0 - uStreamFan[i]) * 1e3;
    best = min(best, max(max(max(dy, dz), dx), dFan));
  }
  return max(best, 0.0);
}
// A bend of the place the cirrus is read at, in three sizes, each read at the place the one before left: the streamers meander and
// their fibres curl. It rides the cirrus wind whole.
vec3 curl3(vec3 a) {
  return vec3(vnoise(a + vec3(3.7, 1.3, 0.0)), vnoise(a + vec3(11.1, 7.9, 5.3)), vnoise(a + vec3(-5.2, 2.2, 9.1))) - 0.5;
}
vec3 cirrusBend(vec3 p, float least, float t) {
  vec3 q = vec3(p.x - uCirrusWind.x * t, p.y, p.z);
  float size = uCirrusWarp.y;
  float reach = uCirrusWarp.x;
  float drift = t * uCirrusMake.w;
  for (int k = 0; k < 3; k++) {
    float keep = k == 0 ? 1.0 : smoothstep(least, 2.0 * least, size);
    if (keep <= 0.0) break;
    q += 2.0 * reach * keep * curl3(q / size + vec3(0.0, 0.0, drift + 7.7 * float(k))) * vec3(1.0, 1.0, 0.5);
    size *= uCirrusBend.x;
    reach *= uCirrusBend.y;
  }
  return vec3(q.x + uCirrusWind.x * t, q.y, q.z);
}
// The noise that tears the cirrus, 0 to 1: octaves in rows across the wind as on the deck (rows by rowY, the place before the bend),
// drawn out along the sweep and upward. On the crest every octave keeps heaps between creases, so the body billows like cumulus;
// on the side away from the Sun (lee) the finer ones are drawn out far and keep ridges, so it frays into fibres.
float cirrusNoise(vec3 q, float rowY, float lee, float least, float t, int most, float need, out float finest) {
  float sum = 0.0;
  float amp = 1.0;
  float lam = uCirrusWave.x;
  finest = lam;
  for (int k = 0; k < most; k++) {
    float keep = smoothstep(least, 2.0 * least, lam);
    if (keep <= 0.0) break;
    float s = uDeckMake.w * lam;
    float g = rowY / s;
    float j = floor(g);
    float f = ease(g - j);
    float seed = 9.1 * float(k) + 2.5;
    float z = q.z * uCirrusWave.z / lam + t * uCirrusMake.w / sqrt(lam) + seed;
    float ua = q.x - (uCirrusWind.x + uCirrusWind.y * j * s) * t;
    float ub = q.x - (uCirrusWind.x + uCirrusWind.y * (j + 1.0) * s) * t;
    // The fibres are drawn out along the sweep (the way the streamer trails off), not along the wind.
    vec2 ra = vec2(ua * uCirrusWarp.w + q.y * uCirrusWarp.z, ua * uCirrusWarp.z - q.y * uCirrusWarp.w);
    vec2 rb = vec2(ub * uCirrusWarp.w + q.y * uCirrusWarp.z, ub * uCirrusWarp.z - q.y * uCirrusWarp.w);
    // Heaps or fibres: the largest octaves are heaps everywhere; the finer ones are heaps on the crest and fibres on the side away
    // from the Sun, where the cloud trails. Heaps are drawn out little, fibres by the whole stretch.
    float fibre = float(k) < uCirrusBillow.y ? 0.0 : lee;
    float drawn = mix(uCirrusBillow.x, uCirrusWave.y, fibre);
    float na = vnoise(vec3(ra.x / lam + seed + 19.7 * j, ra.y * drawn / lam + 0.31 * z, z));
    float nb = vnoise(vec3(rb.x / lam + seed + 19.7 * (j + 1.0), rb.y * drawn / lam + 0.31 * z, z));
    float n = blend(na, nb, f);
    // A heap is what stands between thin creases; a fibre is a thin ridge.
    float ridge = 1.0 - abs(2.0 * n - 1.0);
    n = mix(1.0 - ridge * ridge, ridge * ridge, fibre);
    sum += amp * keep * (n - 0.5);
    finest = lam;
    amp *= uCirrusWave.w;
    lam *= 0.5;
    // What the octaves still to come can add at most (half their weights): where even that leaves the noise under what any cloud
    // needs here, there is none, and the rest is not read. The same answer as reading them all.
    float top = 0.5 + (sum + 0.5 * amp / (1.0 - uCirrusWave.w)) * (1.0 - uCirrusWave.w) * 2.2;
    if (top < need - 1e-4) return 0.0;
  }
  return clamp(0.5 + sum * (1.0 - uCirrusWave.w) * 2.2, 0.0, 1.0);
}
// cirrusInside: the density at a place the caller knows to lie in a streamer's room (cirrusFar is 0 there). away (out): how far
// the bent place stands outside every body.
float cirrusInside(vec3 p, float least, float t, int most, out float finest, out float away) {
  finest = least;
  vec3 q = cirrusBend(p, least, t);
  float lee;
  float crest;
  float low;
  float body = cirrusBody(p, q, t, lee, crest, low, away);
  if (body <= 0.002) return 0.0;
  // The lowest noise at which a heap or a fibre stands here (see below): under it the place is empty whatever the noise reads.
  float needHeap = crest > 0.0 ? 1.0 - crest / (uCirrusMake.x * (1.0 - uCirrusBend.z * crest)) : 2.0;
  float needFibre = uCirrusBillow.z * smoothstep(0.0, 0.5, lee) * low > 0.0 ? 1.0 - body / (uCirrusMake.x * (1.0 + uCirrusBend.w)) : 2.0;
  float need = min(needHeap, needFibre);
  if (need > 1.0) return 0.0;
  // Inside the crest every octave is a heap; the fibres begin where the crest ends.
  float n = cirrusNoise(q, p.y, smoothstep(0.25, 0.7, lee), least, t, most, need > 0.0 ? need : -2.0, finest);
  // The crest: heaps with an outline, as tall as they are broad, so the side away from the Sun stands in its own shade.
  float heap = clamp((crest - uCirrusMake.x * (1.0 - n) * (1.0 - uCirrusBend.z * crest)) / uCirrusMake.y, 0.0, 3.0);
  // The fringe: fibres blown off the crest, thin enough to see the deck through; widest on the side away from the Sun.
  float fibre = clamp((body - uCirrusMake.x * (1.0 + uCirrusBend.w) * (1.0 - n)) / uCirrusFringe.x, 0.0, 1.0);
  return max(heap * heap / 3.0, uCirrusBillow.z * fibre * smoothstep(0.0, 0.5, lee) * low);
}
float cirrusDensity(vec3 p, float least, float t, int most, out float finest) {
  finest = least;
  if (cirrusFar(p, t) > 0.0) return 0.0;
  float away;
  return cirrusInside(p, least, t, most, finest, away);
}
// Air. erfcx by the form of Ren and MacKenzie; column: the air over a point at height h along a line that leaves it at cosine mu (0 or
// more) to the vertical, for a layer with scale height H, per unit of density at height 0.
float erfcx(float x) {
  const float a = 2.911;
  return a / ((a - 1.0) * sqrt(PI) * x + sqrt(PI * x * x + a * a));
}
float column(float h, float mu, float H) {
  float X = (uRadius + h) / H;
  return H * exp(-max(h, 0.0) / H) * sqrt(0.5 * PI * X) * erfcx(sqrt(0.5 * X) * mu);
}
// Air between two points of one ray: heights h1, h2, cosines of the ray to the vertical there, and the height hp of the ray's lowest point.
float between(float h1, float mu1, float h2, float mu2, float hp, float H) {
  if (mu1 >= 0.0) return max(column(h1, mu1, H) - column(h2, mu2, H), 0.0);
  if (mu2 <= 0.0) return max(column(h2, -mu2, H) - column(h1, -mu1, H), 0.0);
  return max(2.0 * column(hp, 0.0, H) - column(h1, -mu1, H) - column(h2, mu2, H), 0.0);
}
// Air between a point and the Sun; the deck is opaque, so a line that dips under it carries nothing.
float toSun(vec3 q, float H, out float lit) {
  float r = length(q);
  float mu = dot(q, uSun) / r;
  float h = r - uRadius;
  lit = 1.0;
  if (mu >= 0.0) return column(h, mu, H);
  float hp = r * sqrt(max(1.0 - mu * mu, 0.0)) - uRadius;
  lit = smoothstep(-0.02, 0.03, hp);
  return max(2.0 * column(max(hp, 0.0), 0.0, H) - column(h, -mu, H), 0.0);
}

void main() {
  vec3 rd = normalize(vPos - uCam);
  vec3 oc = uCam - uCentre;
  float b = dot(oc, rd);
  float rt2 = dot(oc, oc) - b * b;
  float rt = sqrt(max(rt2, 0.0));
  float pix = uPix * uGrad;
  float t = uTime;
  float sunView = dot(rd, uSun);

  // The far look: the globe's own map where the ray meets the smooth planet, read by the globe's own lines (its deck as the albedo
  // under the globe's own curve of light, its cloud layer as a sheet with the shadow the globe gives it). How much of it a pixel shows
  // is a matter of the ground and of the eye's height, never of the clock. The ground: the scene's own deck and cirrus stand round
  // the place (whole within uFar.x units of it on the ground, none beyond uFar.y), so no point of the ground changes its picture
  // because the eye moves over it. The height: from above the place shows the map alone, and the scene's own picture comes in over
  // it by the logarithm of the eye's height, one law from uFarHigh.x to uFarHigh.y radii (divided by the share the whole scene has
  // over the globe, uShow, so that the two do not multiply). The law is the one whose odds (the scene's own share against the map's)
  // are a power of the height: every step of the fall then changes the odds by one factor, at its ends as in its middle, and no
  // step carries the last of one picture out or the first of the other in at once. uFarHigh.z is the share at which it is cut off.
  float dSphere = uRadius * uRadius - rt2;
  float tFar = dSphere > 0.0 ? -b - sqrt(dSphere) : max(-b, 0.0);
  vec3 farUp = normalize(oc + rd * tFar);
  float highNow = max((length(oc) - uRadius) / uRadius, 1e-6);
  float oddsEnd = log((1.0 - uFarHigh.z) / uFarHigh.z);
  float nearRaw = 1.0 / (1.0 + exp(oddsEnd * (2.0 * log(highNow / uFarHigh.y) / log(uFarHigh.x / uFarHigh.y) - 1.0)));
  float nearAll = clamp((nearRaw - uFarHigh.z) / (1.0 - 2.0 * uFarHigh.z), 0.0, 1.0);
  float nearGround = 1.0 - smoothstep(uFar.x, uFar.y, uRadius * length(farUp - uPlaceUp));
  float farW = uFar.z > 1.5 ? 1.0 : uFar.z * (1.0 - min(nearAll / max(uShow, 1e-6), 1.0) * nearGround);
  float rSheet = uRadius * (1.0 + uGCloudHeight);
  float dSheet = rSheet * rSheet - rt2;
  vec3 sheetUp = normalize(oc + rd * (dSheet > 0.0 ? -b - sqrt(dSheet) : max(-b, 0.0)));
  vec3 farLook = vec3(0.0);
  {
    vec3 pb = uToBody * farUp;
    vec3 sunB = uToBody * uFarSun;
    float ndlFar = dot(farUp, uFarSun);
    float tx;
    vec3 dd = deckDir(pb);
    vec3 dcl = cloudDir(uToBody * sheetUp);
    float reach = uGCloudHeight / max(ndlFar, uGShadow.z);
    vec3 dsa = cloudDir(normalize(pb + sunB * reach));
    vec3 dsb = cloudDir(normalize(pb + sunB * reach * 1.6));
    float keep = 1.0;
    float deepen = 1.0;
    vec2 cq = vec2(atan(dcl.x, dcl.z) / (2.0 * PI) + 0.5, asin(clamp(dcl.y, -1.0, 1.0)) / PI + 0.5);
    float cq2 = fract(cq.x + 0.5) - 0.5;
    vec2 cx = vec2(abs(dFdx(cq.x)) < abs(dFdx(cq2)) ? dFdx(cq.x) : dFdx(cq2), dFdx(cq.y)) * uGGrad;
    vec2 cy = vec2(abs(dFdy(cq.x)) < abs(dFdy(cq2)) ? dFdy(cq.x) : dFdy(cq2), dFdy(cq.y)) * uGGrad;
    for (int k = 0; k < (uGCirrus.x > 0.0 ? 1 : 0); k++) {
      float turn = uGCirrus.x * uGCirrus.y * (textureGrad(uGFarMap, cq, cx, cy).g * (255.0 / 127.0) - 1.0) * sqrt(max(1.0 - dcl.y * dcl.y, 0.0));
      dcl = bend(dcl, turn);
      dsa = bend(dsa, turn);
      dsb = bend(dsb, turn);
      vec4 far = textureGrad(uGFarMap, cq + vec2(0.0, turn / PI), cx, cy);
      keep = mix(1.0, far.r * smoothstep(uGClump.x, uGClump.y, far.b) * mix(uGCirrus.w, 1.0, smoothstep(uGClump.y, uGClump.z, far.b)), uGCirrus.x);
      deepen = 1.0 + uGCirrus.x * uGCirrus.z * (1.0 - smoothstep(0.9, 1.0, far.b));
    }
    vec3 mapDeck = layerAt(dd, 1.0, 0.0, tx).rgb / uGCode;
    float mapCloud = layerAt(dcl, max(uGCloudSoft, uGCirrusPx), 0.0, tx).a;
    float mapShadow = 0.6 * min(layerAt(dsa, uGShadow.y, 0.0, tx).a, 1.0) + 0.4 * min(layerAt(dsb, uGShadow.y * 1.8, 0.0, tx).a, 1.0);
    for (int k = 0; k < (uGCirrus.x > 0.0 ? 1 : 0); k++) {
      mapCloud *= keep;
      mapShadow = min(mapShadow * keep * deepen, 1.0);
    }
    float ndlSheet = dot(sheetUp, uFarSun);
    vec3 deckFar = mapDeck * knot(uGDeck, ndlFar) * (1.0 - uGShadow.x * mapShadow * smoothstep(0.0, 0.2, ndlFar) * (1.0 - min(mapCloud, 1.0)));
    farLook = mix(uFarTone * pow(max(deckFar * uGTint, vec3(0.0)), uFarPower), uFarCloud * knot(uGCloud, ndlSheet) * uGTint, mapCloud * smoothstep(-0.09, -0.03, ndlSheet));
    // The globe's own grade of the fall at its full strength (planet.ts, the same lines; deep.json, globe.fall), on the colour as the
    // film shows it: the globe is graded by the height, the scene by the rest of the way (uFallPower here), so the far look stands
    // at every height where the globe's own picture stands, and at the ground at the navy the grade ends in.
    vec3 fallFar = max(farLook * uGain, vec3(0.0)) / uFallPivot;
    vec3 fallenFar = mix(pow(fallFar, uFarFall.xyz), fallFar, smoothstep(0.6, 1.2, fallFar)) * uFallPivot;
    float fallFarMost = uFarFall.w * fallenFar.g + 1e-5;
    float fallFarOver = fallenFar.b / fallFarMost;
    fallenFar.b = fallFarMost * (fallFarOver < 0.75 ? fallFarOver : 0.75 + 0.25 * (1.0 - exp(-(fallFarOver - 0.75) / 0.25)));
    farLook = fallenFar / max(uGain, 1e-6);
  }

  // The deck: a march down onto its relief.
  float topR = uRadius + uBounds.x;
  float botR = uRadius - uBounds.y;
  float dTop = topR * topR - rt2;
  float dBot = botR * botR - rt2;
  bool deckHit = false;
  float tDeck = 1e8;
  vec3 deckLight = vec3(0.0);
  float deckUnder = 0.0;
  float deckFinest = 1.0;
  float tGo = max(-b - sqrt(max(dTop, 0.0)), 0.0);
  float tEnd = dBot > 0.0 ? -b - sqrt(dBot) : -b + sqrt(max(dTop, 0.0));
  vec4 parts = vec4(0.0);
  float finest = 1.0;
  for (int once = 0; once < (dTop > 0.0 && tEnd > 0.0 && farW < 1.0 ? 1 : 0); once++) {
    float td = tGo;
    float f = 1.0;
    for (int i = 0; i < int(uLightMake.x); i++) {
      vec3 q = oc + rd * td;
      vec3 g = bandOf(q);
      float steep = step(length(g.xy - uStorm.xy), uStorm.z * uBowl.z * 1.3);
      f = g.z - deckHeight(g.xy, vec3(max(uDeckTone.w, 2.0 * td * pix)), t, parts, finest);
      if (f < 0.5 * td * pix) {
        deckHit = true;
        break;
      }
      td += max(f / (max(-dot(rd, q) / length(q), 0.0) + mix(0.3, 1.1, steep)), 0.75 * td * pix);
      if (td > tEnd) break;
    }
    deckHit = deckHit || (td <= tEnd && f < 0.03);
    tDeck = td;
  }
  // Where only the far look shows, the deck is the smooth planet and nothing of the code is asked.
  if (farW >= 1.0 && dSphere > 0.0 && tFar > 0.0) {
    deckHit = true;
    tDeck = tFar;
  }
  vec3 deckUp = vec3(0.0, 1.0, 0.0);
  for (int once = 0; once < (deckHit && farW < 1.0 ? 1 : 0); once++) {
    vec3 q = oc + rd * tDeck;
    vec3 g = bandOf(q);
    vec3 up = normalize(q);
    deckUp = up;
    vec3 east = normalize(cross(uAxis, up));
    vec3 north = cross(up, east);
    float fp = tDeck * pix;
    float e = max(1.5 * fp, 0.003);
    vec4 p0;
    vec4 p1;
    float f0;
    float f1;
    // What a pixel covers on the deck is long along the sight line; an octave is kept while the pixel still holds half a wave of it.
    float mu = max(-dot(rd, up), 0.05);
    vec2 sight = normalize(vec2(dot(rd, east), dot(rd, north)) + 1e-6);
    vec2 cover = fp * sqrt(vec2(sight.x * sight.x / (mu * mu) + sight.y * sight.y, sight.y * sight.y / (mu * mu) + sight.x * sight.x));
    vec3 fine = uDeckFine.x * vec3(cover.y, cover.x, fp * sqrt(0.5 + 0.5 / (mu * mu)));
    float h0 = deckHeight(g.xy, fine, t, p0, deckFinest);
    float wisp = gWisp;
    float hE = deckHeight(g.xy + vec2(e, 0.0), fine, t, p1, f1);
    float hN = deckHeight(g.xy + vec2(0.0, e), fine, t, p1, f1);
    vec3 nrm = normalize(up - east * ((hE - h0) / e) - north * ((hN - h0) / e));
    float sunUp = dot(up, uSun);
    float ndl = clamp((dot(nrm, uSun) + uLight.w) / (1.0 + uLight.w), 0.0, 1.0);
    // Its own shadow: toward the Sun over the relief the march follows.
    float shade = 1.0;
    float reach = 0.9;
    for (int i = 0; i < int(uLightMake.y); i++) {
      float s = reach * (float(i) + 0.6) / uLightMake.y;
      s *= s / reach;
      vec3 qs = q + uSun * (s + 0.004);
      vec3 gs = bandOf(qs);
      float clear = gs.z - deckHeight(gs.xy, vec3(max(uDeckTone.w, 0.5 * s)), t, p1, f1);
      shade = min(shade, clamp(0.5 + clear / (uLightMake.w * s + 0.004), 0.0, 1.0));
    }
    // The cirrus between it and the Sun.
    float veil = 0.0;
    float castGap = (uShell.y - uShell.x) / max(sunUp, 0.05) / uLightMake.z;
    int casts = int(uLightMake.z);
    for (int i = 0; i < casts; i++) {
      // Taps in empty air read nothing, and neither do the taps nearer to them than the nearest room is: they are passed here,
      // by the rooms' bound alone.
      for (int hop = 0; hop < 12; hop++) {
        if (i >= casts) break;
        float hiHop = mix(uShell.x, uShell.y, (float(i) + 0.5) / uLightMake.z);
        float far = cirrusFar(bandOf(q + uSun * ((hiHop - g.z) / max(sunUp, 0.05))), t);
        if (far <= 0.0) break;
        i += 1 + int(0.9 * far / castGap);
      }
      if (i >= casts) break;
      float hi = mix(uShell.x, uShell.y, (float(i) + 0.5) / uLightMake.z);
      vec3 gs = bandOf(q + uSun * ((hi - g.z) / max(sunUp, 0.05)));
      float away;
      float thick = cirrusInside(gs, max(2.0 * fp, uCirrusWind.z), t, 5, f1, away);
      veil += thick;
      if (thick <= 0.0) i += int(uCirrusSkip.x * away / castGap);
    }
    veil *= (uShell.y - uShell.x) / max(sunUp, 0.05) / uLightMake.z;
    float lit;
    float airSun = uHazeLow.x / uHazeLow.y * toSun(q, uHazeLow.y, lit) + uHazeHigh.x / uHazeHigh.y * toSun(q, uHazeHigh.y, lit);
    vec3 sunHere = vec3(uLight.x * exp(-airSun) * lit);
    // The pale deck outside the dark oval, where the globe's own map has it.
    float liftMap = smoothstep(uVortexRim.x, uVortexRim.y, length((g.xy - uVortex.xy) * uVortex.zw) + uBand.w * p0.x) * smoothstep(uVortexRim.z, uVortexRim.w, g.y) * (1.0 - smoothstep(uZoneEnd.z, uZoneEnd.w, g.y));
    // The veil between it and the Sun takes its share of the light.
    vec3 gv = bandOf(q + uSun * ((0.5 * (uVeil.x + uVeil.y) - g.z) / max(sunUp, 0.05)));
    sunHere *= exp(-uFanWest.z * uFanWest.w * (uVeil.y - uVeil.x) * veilAt(gv.xy, max(fine.x, fine.y * uDeckWave.y), t) / max(sunUp, 0.05));
    float bright = clamp((uDeckTone.y - uNear.z * (1.0 - smoothstep(uNear.x, uNear.y, g.y)) * smoothstep(uZoneEnd.x, uZoneEnd.y, g.y) - uWest.z * (1.0 - smoothstep(uWest.x, uWest.y, g.x)) * fanOf(g.xy) + uBand.z * liftMap + uDeckTone.x * p0.x * mix(1.0, uArmMake.z, exp(-(p0.w * p0.w) / (uStorm.w * uStorm.w))) + uWisp.w * (wisp - uDeckFine.y) * smoothstep(uDeckFine.z, uDeckFine.w, p0.x) * mix(uNear.w, 1.0, smoothstep(uNear.x, uNear.y, g.y)) * (1.0 + uFarStreak.z * smoothstep(uFarStreak.x, uFarStreak.y, g.y)) + uCollar.z * smoothstep(uBowl.z * 0.5, uBowl.z * 1.7, p0.w / uStorm.z) * (1.0 - smoothstep(uCollar.x, uCollar.y, p0.w)) * mix(1.0, min(wisp / uDeckFine.y, 3.0), uCollar.w) + uArmMake.y * p0.y) * (1.0 - uDeckTone.z * p0.z), 0.0, 1.0);
    vec3 albedo = bright < 0.5 ? mix(uNight, uBlue, bright * 2.0) : mix(uBlue, uPale, bright * 2.0 - 1.0);
    float hollow = clamp(1.0 + 2.5 * min(h0, 0.0), 0.3, 1.0);
    float under = uCirrusBody.x * uThrough.z * veil;
    deckUnder = under;
    deckLight = albedo * (sunHere * ndl * shade * (exp(-under) + uThrough.x * exp(-uThrough.y * under)) / (1.0 + uThrough.x) + uSkyLight * (0.5 + 0.5 * dot(nrm, up)) * hollow);
  }

  // The far look takes the deck's place by its weight, under the scene's own air.
  for (int once = 0; once < (deckHit && farW > 0.0 ? 1 : 0); once++) {
    vec3 q = oc + rd * tDeck;
    float lit;
    float airSun = uHazeLow.x / uHazeLow.y * toSun(q, uHazeLow.y, lit) + uHazeHigh.x / uHazeHigh.y * toSun(q, uHazeHigh.y, lit);
    deckLight = mix(deckLight, farLook * exp(-airSun) * lit, farW);
    deckUnder *= 1.0 - farW;
  }

  // The cirrus: a march through its shell, each step lit by taps toward the Sun.
  vec3 cloud = vec3(0.0);
  float cloudClear = 1.0;
  float tCloud = 0.0;
  float cloudWeight = 0.0;
  float cloudFinest = 1.0;
  float outR = uRadius + uShell.y;
  float inR = uRadius + uShell.x;
  float dOut = outR * outR - rt2;
  for (int once = 0; once < (dOut > 0.0 && farW < 1.0 ? 1 : 0); once++) {
    float camR = length(oc);
    float ta = camR > outR ? -b - sqrt(dOut) : 0.0;
    float dIn = inR * inR - rt2;
    float tb = camR > inR ? (dIn > 0.0 && -b - sqrt(dIn) > 0.0 ? -b - sqrt(dIn) : -b + sqrt(dOut)) : -b + sqrt(dOut);
    ta = max(ta, 0.0);
    tb = min(tb, tDeck);
    if (tb <= ta) break;
    float phase = mix(1.0, (1.0 - uLight.z * uLight.z) / pow(1.0 + uLight.z * uLight.z - 2.0 * uLight.z * sunView, 1.5), uLight.y);
    // Steps are a share of the distance and stand at fixed distances from the eye; empty room is passed by its bound.
    float ts = max(ta, 1e-3);
    int spent = 0;
    for (int hit = 0; hit < int(uCirrusBody.y); hit++) {
      // The next step that has cloud is found in a loop of its own, which reads nothing of the light: empty air is passed by the
      // rooms' bound (reading no noise at all), empty room by the body's bound.
      float rho = 0.0;
      float tg = 0.0;
      float len = 0.0;
      float least = 0.0;
      float fin = 1.0;
      vec3 q = oc;
      vec3 g = vec3(0.0);
      for (int i = 0; i < int(uCirrusBody.y); i++) {
        if (ts >= tb || spent >= int(uCirrusBody.y)) break;
        spent++;
        for (int hop = 0; hop < 16; hop++) {
          float far = cirrusFar(bandOf(oc + rd * ts), t);
          if (far <= uCirrusStep.x * ts) break;
          ts += 0.9 * far;
          if (ts >= tb) break;
        }
        if (ts >= tb) break;
        float k = ceil(log(ts) / uCirrusStep.x);
        tg = exp(k * uCirrusStep.x);
        len = tg * uCirrusStep.x;
        ts = exp((k + 0.5) * uCirrusStep.x);
        if (tg >= tb) break;
        q = oc + rd * tg;
        g = bandOf(q);
        least = max(2.0 * tg * pix, uCirrusWind.w * len);
        float away;
        rho = cirrusInside(g, least, t, int(uCirrusBody.z), fin, away);
        if (rho > 0.0) break;
        // Outside every body the next steps are empty as well: the bent place cannot reach a body sooner than its distance from it
        // times uCirrusSkip.x (the bend can fold the way, so this is a share of it and not the whole).
        ts = max(ts, tg + uCirrusSkip.x * away);
      }
      if (rho <= 0.0) break;
      float toward = 0.0;
      float s = 0.0;
      float clearTo = 0.0;
      for (int j = 0; j < int(uCirrusStep.z); j++) {
        float ds = uCirrusStep.y * pow(uSpiral.z, float(j));
        s += ds;
        float sm = s - 0.5 * ds;
        if (sm < clearTo) continue;
        vec3 gt = bandOf(q + uSun * sm);
        float farTap = cirrusFar(gt, t);
        if (farTap > 0.0) {
          clearTo = sm + 0.9 * farTap;
          continue;
        }
        float f2;
        float a2;
        float tapRho = cirrusInside(gt, max(least, uSpiral.w * ds), t, 6, f2, a2);
        toward += ds * tapRho;
        if (tapRho <= 0.0) clearTo = sm + uCirrusSkip.x * a2;
        // Deeper than this no light of the Sun comes through that the picture could show.
        if (uCirrusBody.x * toward > uCirrusSkip.y) break;
      }
      float depth = uCirrusBody.x * toward;
      float lit = phase * exp(-depth) + uCirrusDeep.x * exp(-uCirrusDeep.y * depth) + uCirrusDeep.z * exp(-uCirrusDeep.w * depth);
      vec3 lightHere = uLight.x * uCirrusBody.w * lit + uCloudLight * (0.4 + 0.6 * smoothstep(uShell.x, uShell.y, g.z));
      float a = 1.0 - exp(-uCirrusBody.x * rho * len);
      cloud += cloudClear * a * lightHere;
      tCloud += cloudClear * a * tg;
      cloudWeight += cloudClear * a;
      cloudClear *= 1.0 - a;
      cloudFinest = fin;
      if (cloudClear < uCirrusSkip.z) break;
    }
  }
  // The scene's own cirrus stands only near: far, the map's sheet is the cloud.
  cloud *= 1.0 - farW;
  cloudWeight *= 1.0 - farW;
  tCloud *= 1.0 - farW;
  cloudClear = mix(cloudClear, 1.0, farW);
  float tMean = cloudWeight > 0.0 ? tCloud / cloudWeight : 0.0;

  // The air: what it takes between the camera and each thing, and what it scatters toward the camera from the Sun.
  float topAir = uRadius + uHazeMake.z;
  float dAir = topAir * topAir - rt2;
  vec3 air = vec3(0.0);
  vec3 airBefore = vec3(0.0);
  vec3 clearDeck = vec3(1.0);
  vec3 clearCloud = vec3(1.0);
  float hp = rt - uRadius;
  for (int once = 0; once < (dAir > 0.0 ? 1 : 0); once++) {
    float camR = length(oc);
    float ta = camR > topAir ? max(-b - sqrt(dAir), 0.0) : 0.0;
    float tb = deckHit ? tDeck : -b + sqrt(dAir);
    if (tb <= ta) break;
    vec3 qa = oc + rd * ta;
    vec3 qb = oc + rd * tb;
    float ha = length(qa) - uRadius;
    float hb = length(qb) - uRadius;
    float ma = dot(rd, qa) / length(qa);
    float mb = dot(rd, qb) / length(qb);
    float lowAll = uHazeLow.x / uHazeLow.y * between(ha, ma, hb, mb, hp, uHazeLow.y);
    float highAll = uHazeHigh.x / uHazeHigh.y * between(ha, ma, hb, mb, hp, uHazeHigh.y);
    // Where the light that reaches the camera is scattered: the lowest point of the ray, or the deck it ends on.
    vec3 qm = deckHit ? qb + normalize(qb) * uHazeLow.y : oc + rd * clamp(-b, ta, tb);
    float litLow;
    float litHigh;
    float sunLow = uHazeLow.x / uHazeLow.y * toSun(qm, uHazeLow.y, litLow) + uHazeHigh.x / uHazeHigh.y * toSun(qm, uHazeHigh.y, litHigh);
    float forward = (1.0 - uHazeMake.y * uHazeMake.y) / pow(1.0 + uHazeMake.y * uHazeMake.y - 2.0 * uHazeMake.y * sunView, 1.5);
    float phase = mix(0.75 * (1.0 + sunView * sunView), forward, uHazeMake.x);
    vec3 depthAll = vec3(lowAll + highAll);
    vec3 scattered = uLight.x * uHazeMake.w * phase * litLow * exp(-sunLow) * (lowAll * uHazeLowColour + highAll * uHazeHighColour) / max(lowAll + highAll, 1e-5);
    clearDeck = exp(-depthAll);
    air = scattered * (1.0 - exp(-(lowAll + highAll)));
    if (cloudWeight > 0.0) {
      vec3 qc = oc + rd * clamp(tMean, ta, tb);
      float hc = length(qc) - uRadius;
      float mc = dot(rd, qc) / length(qc);
      float lowTo = uHazeLow.x / uHazeLow.y * between(ha, ma, hc, mc, hp, uHazeLow.y);
      float highTo = uHazeHigh.x / uHazeHigh.y * between(ha, ma, hc, mc, hp, uHazeHigh.y);
      clearCloud = vec3(exp(-(lowTo + highTo)));
      airBefore = scattered * (1.0 - exp(-(lowTo + highTo)));
    }
  }
  // The veil over the deck inside the fan: what it lets through of the deck and what it scatters of the Sun, most toward the Sun.
  // It lies low on the deck, under the cirrus, so the shadow a streamer casts on the deck lies on it too.
  float veilClear = farW < 1.0 ? mix(exp(-veilDepth(oc, rd, b, rt2, !deckHit, pix, t)), 1.0, farW) : 1.0;
  vec3 veilLight = uLight.x * uVeilLight * (exp(-deckUnder) + uThrough.x * exp(-uThrough.y * deckUnder)) / (1.0 + uThrough.x) * mix(1.0, (1.0 - uLight.z * uLight.z) / pow(1.0 + uLight.z * uLight.z - 2.0 * uLight.z * sunView, 1.5), uLight.y);
  vec3 airAfter = max(air - airBefore, 0.0);
  vec3 col = airBefore + clearCloud * cloud + cloudClear * (airAfter + clearDeck * (veilClear * deckLight + (1.0 - veilClear) * veilLight));
  float seen = deckHit ? 1.0 : 1.0 - cloudClear * dot(clearDeck, vec3(0.3333)) * veilClear;
  float alpha = clamp(seen, 0.0, 1.0);
  // On the globe the scene ends at a border on the ground: by the angle from the place of what the ray meets (or passes nearest).
  vec3 met = normalize(deckHit ? oc + rd * tDeck : oc + rd * max(-b, 0.0));
  float inside = uCap.z > 0.0 ? smoothstep(uCap.y, uCap.x, dot(met, uPlaceUp)) : 1.0;
  // A tool, off in the film (deep.json, globe.grid): the scene's own coordinates drawn on the deck, a line each unit, a strong one each five.
  if (uGridShow > 0.0 && deckHit) {
    vec3 gg = bandOf(oc + rd * tDeck);
    vec2 cell = abs(fract(gg.xy + 0.5) - 0.5) / max(fwidth(gg.xy), 1e-5);
    vec2 five = abs(fract(gg.xy / 5.0 + 0.5) - 0.5) * 5.0 / max(fwidth(gg.xy), 1e-5);
    col = mix(col, vec3(1.0, 0.2, 0.1), 0.6 * (1.0 - smoothstep(0.5, 1.5, min(cell.x, cell.y))));
    col = mix(col, vec3(1.0, 1.0, 0.1), 1.0 - smoothstep(1.0, 2.5, min(five.x, five.y)));
    if (abs(gg.x) < 0.1 && abs(gg.y) < 0.1) col = vec3(0.0, 1.0, 0.0);
  }

  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col = col * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float tSeen = cloudClear < 0.5 ? tMean : tDeck;
  float made = cloudClear < 0.5 ? cloudFinest : deckFinest;
  float texels = deckHit || cloudClear < 0.5 ? 4.0 * tSeen * uPix / max(made, 1e-6) : 0.0;
  vec3 layer = mix(vec3(0.95, 0.95, 0.9), deckHit ? vec3(0.1, 0.3, 0.85) : vec3(0.05, 0.1, 0.3), cloudClear);
  // The same tool for measures: grid 2 writes u, grid 3 writes v of the deck under each pixel into the layers view (48 units over two bytes).
  if (uGridShow > 1.5) {
    vec3 gm = bandOf(oc + rd * tDeck);
    float gx = clamp((uGridShow > 2.5 ? gm.y : gm.x) / 48.0 + 0.5, 0.0, 1.0) * 255.0;
    layer = vec3(floor(gx) / 255.0, fract(gx), deckHit ? 1.0 : 0.0);
  }
  // The grade of the fall (deep.json, globe.fall): none where the power is 1, so the hold keeps its bytes.
  if (any(notEqual(uFallPower, vec3(1.0)))) {
    vec3 fallX = max(col, vec3(0.0)) / uFallPivot;
    col = mix(pow(fallX, uFallPower), fallX, smoothstep(0.6, 1.2, fallX)) * uFallPivot;
  }
  outColor = diagOut(vec4(col, alpha) * (uShow * inside), texels, deckHit || cloudClear < 0.5 ? 1.0 : 0.0, layer, vec2(0.0), min(tSeen, 4000.0));
}`

const v4 = (a: number, b: number, c: number, d: number): THREE.Vector4 => new THREE.Vector4(a, b, c, d)
const v3 = (a: number[]): THREE.Vector3 => new THREE.Vector3(a[0], a[1], a[2])
// The veil's fall with height: its power, and the weight that keeps the whole depth straight down (the mean of x to the power is
// one part in power + 1). No fall: 0 and 1.
const veilFall = (fall: number | undefined): THREE.Vector2 => new THREE.Vector2(fall ?? 0, (fall ?? 0) + 1)

export class Deep {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly centre: THREE.Vector3
  readonly up: THREE.Vector3
  private readonly seat = new THREE.Vector3()
  private readonly back = new THREE.Quaternion()
  private readonly turned = new THREE.Matrix4()

  // map: the globe's own uniforms (planet.ts), read here by the same objects.
  constructor(readonly laid: boolean, map: Record<string, THREE.IUniform>) {
    const radius = fit.radius
    this.up = ground.up.clone()
    this.centre = ground.centre.clone()
    const axis = ground.axis.clone()
    const e0 = ground.e0.clone()
    const e1 = ground.e1.clone()
    const s = look.storm
    const d = look.deck
    const ci = look.cirrus
    const h = look.haze
    const l = look.light
    const w = look.wind
    const fan = look.fan
    // An edge of the fan: a point on it and the bearing it runs at from the eye; side 1 keeps what lies to its right, -1 to its left.
    const fanEdge = (e: number[], side: number): THREE.Vector4 => {
      const th = THREE.MathUtils.degToRad(e[2]!)
      const nx = side * Math.sin(th)
      const ny = -side * Math.cos(th)
      return v4(nx, ny, nx * e[0]! + ny * e[1]! - fan.margin, 0)
    }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      depthTest: !laid,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uCentre: { value: this.centre }, uCam: { value: new THREE.Vector3() }, uRadius: { value: radius },
        uE0: { value: e0 }, uE1: { value: e1 }, uAxis: { value: axis }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uFarSun: { value: new THREE.Vector3(0, 1, 0) },
        uTime: { value: 0 }, uPix: { value: 0.0005 }, uGrad: gradUniform, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uShow: { value: 1 }, uFallPivot: { value: new THREE.Vector3().fromArray(look.globe.fall.pivot) }, uFallPower: { value: new THREE.Vector3(1, 1, 1) }, uPlaceUp: { value: this.up.clone() }, uGridShow: { value: look.globe.grid },
        uCap: { value: v4(Math.cos(THREE.MathUtils.degToRad(look.globe.border[0]!)), Math.cos(THREE.MathUtils.degToRad(look.globe.border[1]!)), laid ? 1 : 0, 0) },
        uStorm: { value: v4(s.at[0]!, s.at[1]!, s.eye, s.reach) },
        uBowl: { value: v4(s.depth, s.wall[0]!, s.wall[1]!, s.ragged) },
        uArms: { value: v4(s.arms.count, s.arms.pitch, s.arms.height, s.arms.core) },
        uArmMake: { value: v4(s.arms.warp, s.arms.light, s.rings, d.curl) },
        uSpin: { value: v4(THREE.MathUtils.degToRad(s.spin.degPerSecond), s.spin.halfRadius, s.spin.pattern, 0) },
        uCollar: { value: v4(s.collar[0]!, s.collar[1]!, s.collar[2]!, s.collar[3]!) },
        uArmIn: { value: v4(s.arms.from[0]!, s.arms.from[1]!, 0, 0) },
        uVeilSizes: { value: fan.veil.sizes },
        uWind: { value: v4(w.deck.speed, w.deck.jet, 1 / w.deck.jetWidth, w.deck.phase) },
        uCirrusWind: { value: v4(w.cirrus.speed, w.cirrus.shear, ci.castWave, look.steps.cirrusLimit) },
        uDeckWave: { value: v4(d.wave, d.stretch, d.relief, d.lump) },
        uDeckMake: { value: v4(d.gain, d.octaves, d.life, w.row) },
        uSpiral: { value: v4(d.spiral.across, d.spiral.along, look.steps.lightGrow, look.steps.lightLimit) },
        uNight: { value: v3(d.night) }, uBlue: { value: v3(d.blue) }, uPale: { value: v3(d.pale) },
        uDeckTone: { value: v4(d.contrast, d.level, s.dark, d.march) },
        uBounds: { value: new THREE.Vector2(d.bounds[0], d.bounds[1]) },
        uShell: { value: new THREE.Vector2(ci.shell[0], ci.shell[1]) },
        uStreamLine: { value: ci.streamers.map((x) => v4(x.line[0]!, x.line[1]!, x.line[2]!, x.line[3]!)) },
        uStreamBody: { value: ci.streamers.map((x) => v4(x.halfWidth, x.base, x.thick, x.density)) },
        uStreamWide: { value: ci.streamers.map((x) => v4(x.wide[0]!, x.wide[1]!, x.bow, x.bow === 0 ? 1 : 1 / Math.hypot(1, (Math.abs(x.line[3]! - x.line[2]!) + 4 * Math.abs(x.bow)) / (x.line[1]! - x.line[0]!)))) },
        uStreamMake: { value: ci.streamers.map((x) => v4(x.ends, x.lump, x.lumpShare, x.seed)) },
        uCirrusWave: { value: v4(ci.wave, ci.stretch, ci.rise, ci.gain) },
        uCirrusMake: { value: v4(ci.erode, ci.soft, ci.lee, ci.life) },
        uCirrusBody: { value: v4(ci.sigma, look.steps.cirrus, ci.octaves, l.cirrus) },
        uCirrusWarp: { value: v4(ci.warp, ci.warpWave, Math.sin(THREE.MathUtils.degToRad(ci.sweepDeg)), Math.cos(THREE.MathUtils.degToRad(ci.sweepDeg))) },
        uCirrusBend: { value: v4(ci.warpNext[0]!, ci.warpNext[1]!, ci.core, ci.leeErode) },
        uCirrusBillow: { value: new THREE.Vector3(ci.billow[0], ci.billow[1], ci.leeThin) }, uCirrusFringe: { value: v4(ci.fringe[0]!, ci.fringe[1]!, ci.fringe[2]!, ci.fringe[3]!) }, uFarStreak: { value: v3(d.wisp.far) }, uWest: { value: v3(d.west) },
        uCirrusDeep: { value: v4(l.deep[0]!, l.deep[1]!, l.deep[2]!, l.deep[3]!) },
        uCirrusStep: { value: v4(look.steps.cirrusShare, look.steps.lightStep, look.steps.light, ci.floor) }, uCirrusSkip: { value: v4(look.steps.cirrusSkip, look.steps.lightDeep, look.steps.cirrusOpaque, 0) },
        uBand: { value: v4(0, 0, d.band[0]!, d.vortex.warp) },
        uVortex: { value: v4(d.vortex.at[0]!, d.vortex.at[1]!, 1 / d.vortex.semi[0]!, 1 / d.vortex.semi[1]!) },
        uVortexRim: { value: v4(d.vortex.rim[0]!, d.vortex.rim[1]!, d.vortex.south[0]!, d.vortex.south[1]!) },
        uFanLeft: { value: fanEdge(fan.left, 1) }, uFanRight: { value: fanEdge(fan.right, -1) },
        uFanFar: { value: v4(Math.cos(THREE.MathUtils.degToRad(fan.far[0]!)), Math.sin(THREE.MathUtils.degToRad(fan.far[0]!)), fan.far[1]!, fan.border) },
        uFanBand: { value: v4(fan.veil.tilt, fan.veil.from, fan.veil.to, fan.veil.share) },
        uFanWest: { value: v4(fan.veil.west[0]!, fan.veil.west[1]!, fan.veil.shade, fan.veil.depth / (fan.veil.height[1]! - fan.veil.height[0]!)) },
        uFanMake: { value: v4(fan.veil.wave, fan.veil.long, fan.veil.contrast, fan.veil.layers) },
        uVeil: { value: new THREE.Vector2(fan.veil.height[0], fan.veil.height[1]) }, uVeilFall: { value: veilFall(fan.veil.fall) }, uVeilLight: { value: v3(fan.veil.light) },
        uStreamFan: { value: ci.streamers.map((x) => (x.where === 'map' ? 1 : 0)) }, uStreamBend: { value: ci.streamers.map((x) => x.bend ?? 1) },
        uNear: { value: v4(d.near[0]!, d.near[1]!, d.near[2]!, d.wisp.near) },
        uZoneEnd: { value: v4(d.near[3]!, d.near[4]!, d.band[1]!, d.band[2]!) },
        uWisp: { value: v4(d.wisp.from, d.wisp.power, d.wisp.gain, d.wisp.light) },
        uDeckFine: { value: v4(d.limit, d.wisp.mean, d.wisp.where[0]!, d.wisp.where[1]!) },
        uHazeLow: { value: v4(h.low.depth, h.low.scale, 0, 0) }, uHazeHigh: { value: v4(h.high.depth, h.high.scale, 0, 0) },
        uHazeLowColour: { value: v3(h.low.colour) }, uHazeHighColour: { value: v3(h.high.colour) },
        uHazeMake: { value: v4(h.forward[0]!, h.forward[1]!, h.top, h.share) },
        uLight: { value: v4(l.sun, l.forward[0]!, l.forward[1]!, l.wrap) },
        uSkyLight: { value: v3(l.sky) }, uCloudLight: { value: v3(l.cloud) },
        uLightMake: { value: v4(look.steps.deck, look.steps.shade, look.steps.cast, l.shadow) }, uThrough: { value: new THREE.Vector3(l.through[0], l.through[1], ci.cast ?? 1) },
        uToBody: { value: new THREE.Matrix3() },
        uFar: { value: v4(look.far.distance[0]!, look.far.distance[1]!, look.far.on, 0) }, uFarHigh: { value: new THREE.Vector3(look.far.height[0]!, look.far.height[1]!, look.far.tail) }, uFarFall: { value: v4(look.globe.fall.power[0]!, look.globe.fall.power[1]!, look.globe.fall.power[2]!, look.globe.fall.blue) }, uFarTone: { value: v3(look.far.tone) }, uFarPower: { value: v3(look.far.power) }, uFarCloud: { value: v3(look.far.cloud) },
        ...Object.fromEntries(MAP_UNIFORMS.map((name) => [globe(name), map[name]!])),
        uDiag: diagUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius + h.top, laid ? 256 : 128, laid ? 128 : 96), this.material)
    this.mesh.frustumCulled = false
    if (laid) {
      this.mesh.scale.setScalar(1 / radius)
      this.mesh.renderOrder = 4
    } else {
      this.mesh.position.copy(this.centre)
    }
  }

  // camera: the eye in the frame of the close scene. sun: the direction to the globe's Sun in that frame (the far look takes it as it
  // is; the scene's own things keep the Sun they were made in, which is this one turned back by the turn of the place, band.ts).
  // time: seconds from the middle of the
  // surface view. pixel: the angle one pixel of the frame covers, in radians.
  // body: the turn from this scene's frame to the globe's own (the body the map lies on).
  update(camera: THREE.Vector3, sun: THREE.Vector3, time: number, pixel: number, gain: number, vignette: number, aspect: number, body: THREE.Quaternion): void {
    const u = this.material.uniforms
    ;(u.uToBody!.value as THREE.Matrix3).setFromMatrix4(this.turned.makeRotationFromQuaternion(body))
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uFarSun!.value as THREE.Vector3).copy(sun).normalize()
    ;(u.uSun!.value as THREE.Vector3).copy(sun).normalize().applyQuaternion(placeTurn)
    u.uTime!.value = time
    u.uPix!.value = pixel
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  // On the globe (the laid scene only): turn is the turn from the close scene to the stop's frame, camera the eye in the stop's frame
  // in radii, show how much of the scene is drawn (a function of the eye's height, never of time), power the grade of the fall at this height (under the pivot of deep.json globe.fall a channel is drawn as pivot times (colour over pivot) to the power). Returns the eye in the close scene.
  lay(camera: THREE.Vector3, turn: THREE.Quaternion, show: number, power: THREE.Vector3): THREE.Vector3 {
    this.mesh.quaternion.copy(turn)
    this.material.uniforms.uShow!.value = show
    ;(this.material.uniforms.uFallPower!.value as THREE.Vector3).copy(power)
    return this.seat.copy(camera).applyQuaternion(this.back.copy(turn).invert()).multiplyScalar(fit.radius).add(this.centre)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
