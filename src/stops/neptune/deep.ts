import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import fit from './close.json'
import frame from './closeup.json'
import look from './deep.json'

// The surface view of Neptune as one scene made by functions: a cloud deck with height (rolls, the storm as a bowl with walls and arms),
// cirrus as a volume above it that is marched and lit by a march toward the Sun (the same density casts the shadow on the deck), a wind
// (along the band with a jet, round the storm with its own spin) that carries every octave in rows of the octave's own size, so nothing
// is drawn out, and air whose density falls with height. No picture is read. Every number is in deep.json.

const STREAMERS = look.cirrus.streamers.length

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
uniform float uTime;
uniform float uPix;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uStorm;
uniform vec4 uBowl;
uniform vec4 uArms;
uniform vec4 uArmMake;
uniform vec4 uSpin;
uniform vec4 uCollar;
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
uniform vec4 uCirrusBend;
uniform vec4 uCirrusDeep;
uniform vec4 uBand;
uniform vec4 uWisp;
uniform vec4 uNear;
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
in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${DIAG_GLSL}

const float PI = 3.14159265358979;
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
float spin(float r) {
  float x = r / uSpin.y;
  return uSpin.x / (1.0 + x * x);
}
// One octave that rides the band's wind. The octave is cut into rows of its own size across the wind; each row rides whole at the speed
// of its middle and neighbours are blended, so a form of that size is carried and never drawn out. z: the octave's own change with time.
float zonal(vec2 uv, float lam, float t, float seed) {
  float s = uDeckMake.w * lam;
  float g = uv.y / s;
  float j = floor(g);
  float f = ease(g - j);
  float z = t * uDeckMake.z / sqrt(lam) + seed;
  vec3 a = vec3((uv.x - wind(j * s) * t) * uDeckWave.y / lam + seed + 19.7 * j, uv.y / lam, z);
  vec3 b = vec3((uv.x - wind((j + 1.0) * s) * t) * uDeckWave.y / lam + seed + 19.7 * (j + 1.0), uv.y / lam, z);
  return blend(vnoise(a), vnoise(b), f);
}
// The same for the storm: rings of the octave's own size, each turning whole at the spin of its middle. rho is the logarithm of the
// distance, th the angle; the pitch winds the octave into a spiral.
float winding(float rho, float th, float lam, float t, float seed) {
  float s = uDeckMake.w * lam / uSpiral.x;
  float g = rho / s;
  float j = floor(g);
  float f = ease(g - j);
  float a0 = th + uArms.y * rho;
  float aa = a0 - spin(max(exp(j * s) - uArms.w, 0.0)) * t;
  float ab = a0 - spin(max(exp((j + 1.0) * s) - uArms.w, 0.0)) * t;
  float z = rho * uSpiral.x / lam + t * uDeckMake.z / sqrt(lam);
  vec3 pa = vec3(cos(aa) * uSpiral.y / lam + seed + 19.7 * j, sin(aa) * uSpiral.y / lam, z);
  vec3 pb = vec3(cos(ab) * uSpiral.y / lam + seed + 19.7 * (j + 1.0), sin(ab) * uSpiral.y / lam, z);
  return blend(vnoise(pa), vnoise(pb), f);
}
// The structure of the deck at a place, round 0: its octaves from the longest wavelength down to least (an octave fades out as its
// wavelength falls from twice least to least; least.x for the streaks along the band, least.y for those round the storm). finest: the
// shortest wavelength that took part.
float deckField(vec2 uv, vec2 least, float t, out float finest) {
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
  finest = lam;
  for (int k = 0; k < int(uDeckMake.y); k++) {
    float keepZ = smoothstep(least.x, 2.0 * least.x, lam);
    float keepW = smoothstep(least.y, 2.0 * least.y, lam * local);
    if (keepZ <= 0.0 && keepW <= 0.0) break;
    float seed = 17.3 * float(k) + 0.5;
    float z = 0.0;
    float w = 0.0;
    float rz = 0.0;
    float rw = 0.0;
    if (m < 0.985 && keepZ > 0.0) {
      float n = zonal(uv, lam, t, seed);
      z = keepZ * (n - 0.5);
      rz = keepZ * pow(1.0 - abs(2.0 * n - 1.0), uWisp.y);
    }
    if (m > 0.015 && keepW > 0.0) {
      float n = winding(rho, th, lam, t, seed);
      w = keepW * (n - 0.5);
      rw = keepW * pow(1.0 - abs(2.0 * n - 1.0), uWisp.y);
    }
    sum += amp * mix(z, w, m);
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
float deckHeight(vec2 uv, vec2 least, float t, out vec4 parts, out float finest) {
  vec2 d = uv - uStorm.xy;
  float r = length(d);
  float x = r / uStorm.z;
  float eye = 1.0 - smoothstep(uBowl.y, uBowl.z, x);
  float field = deckField(uv, least, t, finest);
  float rho = log(r + uArms.w);
  float turn = atan(d.y, d.x) + uArms.y * rho - uSpin.x * uSpin.z * t;
  float arm = 0.5 + 0.5 * cos(uArms.x * turn + uArmMake.x * 6.2831853 * field);
  float armShare = smoothstep(uBowl.z * 0.75, uBowl.z * 1.5, x) * exp(-(r * r) / (uStorm.w * uStorm.w));
  parts = vec4(field, arm * armShare, eye, r);
  return -uBowl.x * eye + uArms.z * armShare * arm + uDeckWave.z * field * (1.0 - 0.6 * eye);
}
// Cirrus. The body of each streamer is a line along the band with a width, an underside and a thickness, thick and thin along its
// length; it rides the cirrus wind whole. lee (out): 1 on the side away from the Sun, where it trails.
float cirrusBody(vec3 p, float t, out float lee) {
  float best = 0.0;
  lee = 0.0;
  float ride = uCirrusWind.x * t;
  for (int i = 0; i < ${STREAMERS}; i++) {
    vec4 line = uStreamLine[i];
    vec4 body = uStreamBody[i];
    vec4 make = uStreamMake[i];
    float z = (p.z - body.y) / body.z;
    if (z <= 0.0 || z >= 1.05) continue;
    float along = (p.x - ride - line.x) / (line.y - line.x);
    if (along <= 0.0 || along >= 1.0) continue;
    float off = p.y - mix(line.z, line.w, along);
    float semi = body.x * mix(uStreamWide[i].x, uStreamWide[i].y, along);
    if (off > 2.53 * semi || off < -(2.23 * uCirrusMake.z + 0.3) * semi) continue;
    float ends = smoothstep(0.0, make.x / (line.y - line.x), along) * (1.0 - smoothstep(1.0 - make.x / (line.y - line.x), 1.0, along));
    float lump = vnoise(vec3((p.x - ride) / make.y + make.w, make.w * 1.7, 0.5));
    float lump2 = vnoise(vec3((p.x - ride) / (make.y * 0.37) + make.w * 2.3, make.w, 3.5));
    float strength = body.w * ends * mix(1.0 - make.z, 1.0, smoothstep(0.25, 0.75, lump));
    float width = semi * (0.65 + 0.7 * lump2);
    float y = off - 0.6 * semi * (lump2 - 0.5);
    float side = step(y, 0.0);
    float across = y / (width * mix(1.0, uCirrusMake.z, side));
    float up = smoothstep(0.0, 0.3, z) * (1.0 - smoothstep(0.55 + 0.4 * lump, 1.05, z));
    float e = strength * exp(-across * across) * up - uCirrusStep.w;
    if (e > best) {
      best = e;
      lee = side * smoothstep(0.0, 1.0, -across);
    }
  }
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
    float off = p.y - mix(line.z, line.w, along);
    float semi = body.x * mix(uStreamWide[i].x, uStreamWide[i].y, along);
    float dy = max(off - 2.53 * semi, -off - (2.23 * uCirrusMake.z + 0.3) * semi) - 1.5 * uCirrusWarp.x;
    float dz = max(body.y - p.z, p.z - body.y - 1.05 * body.z) - 0.85 * uCirrusWarp.x;
    float dx = max(line.x + ride - p.x, p.x - ride - line.y);
    best = min(best, max(max(dy, dz), dx));
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
// drawn out along the wind and upward; all but the first are ridged, which makes the fibres.
float cirrusNoise(vec3 q, float rowY, float least, float t, int most, out float finest) {
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
    float na = vnoise(vec3(ra.x / lam + seed + 19.7 * j, ra.y * uCirrusWave.y / lam + 0.31 * z, z));
    float nb = vnoise(vec3(rb.x / lam + seed + 19.7 * (j + 1.0), rb.y * uCirrusWave.y / lam + 0.31 * z, z));
    float n = blend(na, nb, f);
    if (k > 0) {
      n = 1.0 - abs(2.0 * n - 1.0);
      n *= n;
    }
    sum += amp * keep * (n - 0.5);
    finest = lam;
    amp *= uCirrusWave.w;
    lam *= 0.5;
  }
  return clamp(0.5 + sum * (1.0 - uCirrusWave.w) * 2.2, 0.0, 1.0);
}
float cirrusDensity(vec3 p, float least, float t, int most, out float finest) {
  finest = least;
  if (cirrusFar(p, t) > 0.0) return 0.0;
  vec3 q = cirrusBend(p, least, t);
  float lee;
  float body = cirrusBody(q, t, lee);
  if (body <= 0.002) return 0.0;
  float n = cirrusNoise(q, p.y, least, t, most, finest);
  float rho = clamp((body - uCirrusMake.x * (1.0 - n) * (1.0 + uCirrusBend.w * lee) * (1.0 - uCirrusBend.z * body)) / uCirrusMake.y, 0.0, 3.0);
  return rho * rho / 3.0;
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

  // The deck: a march down onto its relief.
  float topR = uRadius + uBounds.x;
  float botR = uRadius - uBounds.y;
  float dTop = topR * topR - rt2;
  float dBot = botR * botR - rt2;
  bool deckHit = false;
  float tDeck = 1e8;
  vec3 deckLight = vec3(0.0);
  float deckFinest = 1.0;
  float tGo = max(-b - sqrt(max(dTop, 0.0)), 0.0);
  float tEnd = dBot > 0.0 ? -b - sqrt(dBot) : -b + sqrt(max(dTop, 0.0));
  vec4 parts = vec4(0.0);
  float finest = 1.0;
  for (int once = 0; once < (dTop > 0.0 && tEnd > 0.0 ? 1 : 0); once++) {
    float td = tGo;
    float f = 1.0;
    for (int i = 0; i < int(uLightMake.x); i++) {
      vec3 q = oc + rd * td;
      vec3 g = bandOf(q);
      float steep = step(length(g.xy - uStorm.xy), uStorm.z * uBowl.z * 1.3);
      f = g.z - deckHeight(g.xy, vec2(max(uDeckTone.w, 2.0 * td * pix)), t, parts, finest);
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
  vec3 deckUp = vec3(0.0, 1.0, 0.0);
  for (int once = 0; once < (deckHit ? 1 : 0); once++) {
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
    vec2 fine = uDeckFine.x * vec2(max(cover.y, cover.x * uDeckWave.y), fp * sqrt(0.5 + 0.5 / (mu * mu)));
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
      float clear = gs.z - deckHeight(gs.xy, vec2(max(uDeckTone.w, 0.5 * s)), t, p1, f1);
      shade = min(shade, clamp(0.5 + clear / (uLightMake.w * s + 0.004), 0.0, 1.0));
    }
    // The cirrus between it and the Sun.
    float veil = 0.0;
    for (int i = 0; i < int(uLightMake.z); i++) {
      float hi = mix(uShell.x, uShell.y, (float(i) + 0.5) / uLightMake.z);
      float s = (hi - g.z) / max(sunUp, 0.05);
      vec3 gs = bandOf(q + uSun * s);
      veil += cirrusDensity(gs, max(2.0 * fp, uCirrusWind.z), t, 5, f1);
    }
    veil *= (uShell.y - uShell.x) / max(sunUp, 0.05) / uLightMake.z;
    float lit;
    float airSun = uHazeLow.x / uHazeLow.y * toSun(q, uHazeLow.y, lit) + uHazeHigh.x / uHazeHigh.y * toSun(q, uHazeHigh.y, lit);
    vec3 sunHere = vec3(uLight.x * exp(-airSun) * lit);
    float bright = clamp((uDeckTone.y - uNear.z * (1.0 - smoothstep(uNear.x, uNear.y, g.y)) + uBand.z * smoothstep(uBand.x, uBand.y, g.y) + uDeckTone.x * p0.x + uWisp.w * (wisp - uDeckFine.y) * smoothstep(uDeckFine.z, uDeckFine.w, p0.x) + uCollar.z * (smoothstep(uBowl.z, uBowl.z * 1.25, p0.w / uStorm.z) * (1.0 - smoothstep(uCollar.x, uCollar.y, p0.w))) + uArmMake.y * p0.y) * (1.0 - uDeckTone.z * p0.z), 0.0, 1.0);
    vec3 albedo = bright < 0.5 ? mix(uNight, uBlue, bright * 2.0) : mix(uBlue, uPale, bright * 2.0 - 1.0);
    float hollow = clamp(1.0 + 2.5 * min(h0, 0.0), 0.3, 1.0);
    deckLight = albedo * (sunHere * ndl * shade * exp(-uCirrusBody.x * veil) + uSkyLight * (0.5 + 0.5 * dot(nrm, up)) * hollow);
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
  for (int once = 0; once < (dOut > 0.0 ? 1 : 0); once++) {
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
    for (int i = 0; i < int(uCirrusBody.y); i++) {
      if (ts >= tb) break;
      float far = cirrusFar(bandOf(oc + rd * ts), t);
      if (far > uCirrusStep.x * ts) {
        ts += 0.9 * far;
        continue;
      }
      float k = ceil(log(ts) / uCirrusStep.x);
      float tg = exp(k * uCirrusStep.x);
      float len = tg * uCirrusStep.x;
      ts = exp((k + 0.5) * uCirrusStep.x);
      if (tg >= tb) break;
      vec3 q = oc + rd * tg;
      vec3 g = bandOf(q);
      float least = max(2.0 * tg * pix, uCirrusWind.w * len);
      float fin;
      float rho = cirrusDensity(g, least, t, int(uCirrusBody.z), fin);
      if (rho <= 0.0) continue;
      float toward = 0.0;
      float s = 0.0;
      for (int j = 0; j < int(uCirrusStep.z); j++) {
        float ds = uCirrusStep.y * pow(uSpiral.z, float(j));
        s += ds;
        float f2;
        toward += ds * cirrusDensity(bandOf(q + uSun * (s - 0.5 * ds)), max(least, uSpiral.w * ds), t, 6, f2);
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
      if (cloudClear < 0.004) break;
    }
  }
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
  vec3 airAfter = max(air - airBefore, 0.0);
  vec3 col = airBefore + clearCloud * cloud + cloudClear * (airAfter + clearDeck * deckLight);
  float seen = deckHit ? 1.0 : 1.0 - cloudClear * dot(clearDeck, vec3(0.3333));
  float alpha = clamp(seen, 0.0, 1.0);

  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col = col * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float tSeen = cloudClear < 0.5 ? tMean : tDeck;
  float made = cloudClear < 0.5 ? cloudFinest : deckFinest;
  float texels = deckHit || cloudClear < 0.5 ? 4.0 * tSeen * uPix / max(made, 1e-6) : 0.0;
  vec3 layer = mix(vec3(0.95, 0.95, 0.9), deckHit ? vec3(0.1, 0.3, 0.85) : vec3(0.05, 0.1, 0.3), cloudClear);
  outColor = diagOut(vec4(col, alpha), texels, deckHit || cloudClear < 0.5 ? 1.0 : 0.0, layer, vec2(0.0), min(tSeen, 4000.0));
}`

function unproject(px: number, py: number, radius: number, centre: THREE.Vector3): THREE.Vector3 {
  const ty = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
  const d = new THREE.Vector3(((px / frame.image[0]!) * 2 - 1) * ty * (frame.image[0]! / frame.image[1]!), (1 - (py / frame.image[1]!) * 2) * ty, -1).normalize()
  const b = d.dot(centre)
  const t = b - Math.sqrt(Math.max(b * b - (centre.lengthSq() - radius * radius), 0))
  return d.multiplyScalar(t).sub(centre)
}

const v4 = (a: number, b: number, c: number, d: number): THREE.Vector4 => new THREE.Vector4(a, b, c, d)
const v3 = (a: number[]): THREE.Vector3 => new THREE.Vector3(a[0], a[1], a[2])

export class Deep {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly centre: THREE.Vector3
  readonly up: THREE.Vector3

  constructor(readonly laid = false) {
    const radius = fit.radius
    this.up = new THREE.Vector3().fromArray(fit.nadir).negate()
    this.centre = new THREE.Vector3().fromArray(fit.nadir).multiplyScalar(radius + 1)
    const a = unproject(frame.band[0]!, frame.band[1]!, radius, this.centre)
    const c = unproject(frame.band[2]!, frame.band[3]!, radius, this.centre)
    const axis = new THREE.Vector3().crossVectors(a, c).normalize()
    const e0 = this.up.clone().addScaledVector(axis, -this.up.dot(axis)).normalize()
    const e1 = new THREE.Vector3().crossVectors(axis, e0)
    const s = look.storm
    const d = look.deck
    const ci = look.cirrus
    const h = look.haze
    const l = look.light
    const w = look.wind
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: laid ? THREE.FrontSide : THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uCentre: { value: this.centre }, uCam: { value: new THREE.Vector3() }, uRadius: { value: radius },
        uE0: { value: e0 }, uE1: { value: e1 }, uAxis: { value: axis }, uSun: { value: new THREE.Vector3(0, 1, 0) },
        uTime: { value: 0 }, uPix: { value: 0.0005 }, uGrad: gradUniform, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uStorm: { value: v4(s.at[0]!, s.at[1]!, s.eye, s.reach) },
        uBowl: { value: v4(s.depth, s.wall[0]!, s.wall[1]!, 0) },
        uArms: { value: v4(s.arms.count, s.arms.pitch, s.arms.height, s.arms.core) },
        uArmMake: { value: v4(s.arms.warp, s.arms.light, 0, 0) },
        uSpin: { value: v4(THREE.MathUtils.degToRad(s.spin.degPerSecond), s.spin.halfRadius, s.spin.pattern, 0) },
        uCollar: { value: v4(s.collar[0]!, s.collar[1]!, s.collar[2]!, 0) },
        uWind: { value: v4(w.deck.speed, w.deck.jet, 1 / w.deck.jetWidth, w.deck.phase) },
        uCirrusWind: { value: v4(w.cirrus.speed, w.cirrus.shear, ci.castWave, look.steps.cirrusLimit) },
        uDeckWave: { value: v4(d.wave, d.stretch, d.relief, 0) },
        uDeckMake: { value: v4(d.gain, d.octaves, d.life, w.row) },
        uSpiral: { value: v4(d.spiral.across, d.spiral.along, look.steps.lightGrow, look.steps.lightLimit) },
        uNight: { value: v3(d.night) }, uBlue: { value: v3(d.blue) }, uPale: { value: v3(d.pale) },
        uDeckTone: { value: v4(d.contrast, d.level, s.dark, d.march) },
        uBounds: { value: new THREE.Vector2(d.bounds[0], d.bounds[1]) },
        uShell: { value: new THREE.Vector2(ci.shell[0], ci.shell[1]) },
        uStreamLine: { value: ci.streamers.map((x) => v4(x.line[0]!, x.line[1]!, x.line[2]!, x.line[3]!)) },
        uStreamBody: { value: ci.streamers.map((x) => v4(x.halfWidth, x.base, x.thick, x.density)) },
        uStreamWide: { value: ci.streamers.map((x) => v4(x.wide[0]!, x.wide[1]!, 0, 0)) },
        uStreamMake: { value: ci.streamers.map((x) => v4(x.ends, x.lump, x.lumpShare, x.seed)) },
        uCirrusWave: { value: v4(ci.wave, ci.stretch, ci.rise, ci.gain) },
        uCirrusMake: { value: v4(ci.erode, ci.soft, ci.lee, ci.life) },
        uCirrusBody: { value: v4(ci.sigma, look.steps.cirrus, ci.octaves, l.cirrus) },
        uCirrusWarp: { value: v4(ci.warp, ci.warpWave, Math.sin(THREE.MathUtils.degToRad(ci.sweepDeg)), Math.cos(THREE.MathUtils.degToRad(ci.sweepDeg))) },
        uCirrusBend: { value: v4(ci.warpNext[0]!, ci.warpNext[1]!, ci.core, ci.leeErode) },
        uCirrusDeep: { value: v4(l.deep[0]!, l.deep[1]!, l.deep[2]!, l.deep[3]!) },
        uCirrusStep: { value: v4(look.steps.cirrusShare, look.steps.lightStep, look.steps.light, ci.floor) },
        uBand: { value: v4(d.band[0]!, d.band[1]!, d.band[2]!, 0) },
        uNear: { value: v4(d.near[0]!, d.near[1]!, d.near[2]!, 0) },
        uWisp: { value: v4(d.wisp.from, d.wisp.power, d.wisp.gain, d.wisp.light) },
        uDeckFine: { value: v4(d.limit, d.wisp.mean, d.wisp.where[0]!, d.wisp.where[1]!) },
        uHazeLow: { value: v4(h.low.depth, h.low.scale, 0, 0) }, uHazeHigh: { value: v4(h.high.depth, h.high.scale, 0, 0) },
        uHazeLowColour: { value: v3(h.low.colour) }, uHazeHighColour: { value: v3(h.high.colour) },
        uHazeMake: { value: v4(h.forward[0]!, h.forward[1]!, h.top, h.share) },
        uLight: { value: v4(l.sun, l.forward[0]!, l.forward[1]!, l.wrap) },
        uSkyLight: { value: v3(l.sky) }, uCloudLight: { value: v3(l.cloud) },
        uLightMake: { value: v4(look.steps.deck, look.steps.shade, look.steps.cast, l.shadow) },
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

  // camera: the eye in the frame of the close scene. sun: the direction to the Sun in that frame. time: seconds from the middle of the
  // surface view. pixel: the angle one pixel of the frame covers, in radians.
  update(camera: THREE.Vector3, sun: THREE.Vector3, time: number, pixel: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uSun!.value as THREE.Vector3).copy(sun).normalize()
    u.uTime!.value = time
    u.uPix!.value = pixel
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
