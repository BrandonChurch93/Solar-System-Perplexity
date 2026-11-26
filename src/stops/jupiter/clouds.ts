import deck from './deck.json'

const OCTAVES = 10

export const EDDIES = deck.life.eddies.length
export const SEAMS = deck.life.storm.rings.length

export const CALM_GLSL = /* glsl */ `
uniform vec4 uEddy[${EDDIES}];
uniform float uEddyTurn[${EDDIES}];
uniform vec3 uSeam[${SEAMS}];
vec2 calm(vec2 g, out vec2 cs) {
  vec2 o = g - uStorm.xy;
  float r2 = dot(o, o);
  cs = vec2(1.0, 0.0);
  vec2 moved = g;
  for (int i = 0; i < (uStormTurn != 0.0 && r2 < uStorm.w * uStorm.w ? 1 : 0); i++) {
    float r = sqrt(r2);
    float a = -uStormTurn * (1.0 - smoothstep(uStorm.z, uStorm.w, r));
    for (int k = 0; k < ${SEAMS}; k++) a -= uSeam[k].z * (1.0 - smoothstep(uSeam[k].x, uSeam[k].y, r));
    float h = sin(0.5 * a);
    float less = -2.0 * h * h;
    cs = vec2(1.0 + less, sin(a));
    moved = g + vec2(less * o.x - cs.y * o.y, cs.y * o.x + less * o.y);
  }
  for (int e = 0; e < ${EDDIES}; e++) {
    vec2 oe = moved - uEddy[e].xy;
    float re = dot(oe, oe);
    for (int i = 0; i < (uEddyTurn[e] != 0.0 && re < uEddy[e].w * uEddy[e].w ? 1 : 0); i++) {
      float a = -uEddyTurn[e] * (1.0 - smoothstep(uEddy[e].z, uEddy[e].w, sqrt(re)));
      float h = sin(0.5 * a);
      float less = -2.0 * h * h;
      vec2 turn = vec2(1.0 + less, sin(a));
      moved += vec2(less * oe.x - turn.y * oe.y, turn.y * oe.x + less * oe.y);
      cs = vec2(cs.x * turn.x - cs.y * turn.y, cs.y * turn.x + cs.x * turn.y);
    }
  }
  return moved;
}
`

export const ABOVE_GLSL = /* glsl */ `float above(vec3 p) {
  float n = dot(p, p) + 2.0 * uRadius * p.z;
  return n / (sqrt(uRadius * uRadius + n) + uRadius);
}
vec3 levels(vec2 g) {
  vec2 f = abs(g - uForeMap.xy) * (2.0 * uForeMap.z);
  vec2 a = abs(g - uNear.xy) * (2.0 * uNear.z);
  vec2 b = abs(g - uMid.xy) * (2.0 * uMid.z);
  float wf = 1.0 - smoothstep(uBlend.x, uBlend.y, max(f.x, f.y));
  float wn = (1.0 - wf) * (1.0 - smoothstep(uBlend.x, uBlend.y, max(a.x, a.y)));
  float wm = (1.0 - wf - wn) * (1.0 - smoothstep(uBlend.x, uBlend.y, max(b.x, b.y)));
  return vec3(wf, wn, wm);
}
`

export const STORED_GLSL = /* glsl */ `float stored(vec2 g, vec3 w) {
  float h = 0.0;
  for (int k = 0; k < (w.x > 0.0 ? 1 : 0); k++) h += w.x * textureLod(uHeightFore, (g - uForeMap.xy) * uForeMap.z + 0.5, 0.0).r;
  for (int k = 0; k < (w.y > 0.0 ? 1 : 0); k++) h += w.y * textureLod(uHeightNear, (g - uNear.xy) * uNear.z + 0.5, 0.0).r;
  for (int k = 0; k < (w.z > 0.0 ? 1 : 0); k++) h += w.z * textureLod(uHeightMid, (g - uMid.xy) * uMid.z + 0.5, 0.0).r;
  return uHeightRange.x * (w.x + w.y + w.z) + h * uHeightRange.y;
}
`

export const DETAIL_GLSL = /* glsl */ `
vec2 spot(ivec2 p) {
  uint h = uint(p.x) * 0x9E3779B1u ^ uint(p.y) * 0x85EBCA77u;
  h ^= h >> 15;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12;
  h *= 0x297A2D39u;
  h ^= h >> 15;
  uint k = h * 0x9E3779B1u;
  k ^= k >> 16;
  return vec2(float(h), float(k)) * (1.0 / 4294967296.0);
}
vec3 made(vec2 g, float cut, float least) {
  int k0 = max(int(floor(log2(uDetail.x / (1.4 * cut)))), 0);
  int k1 = min(int(ceil(log2(uDetail.x / least))), ${OCTAVES - 1});
  vec3 sum = vec3(0.0);
  for (int k = k0; k <= k1; k++) {
    float wave = uDetail.x * exp2(-float(k));
    float use = (1.0 - smoothstep(0.7 * cut, 1.4 * cut, wave)) * smoothstep(least, 1.6 * least, wave);
    float a = 0.6 * float(k);
    mat2 turn = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec2 q = (turn * g) / wave + vec2(17.3, -9.1) * float(k);
    vec2 base = floor(q);
    ivec2 cell = ivec2(base);
    vec2 f = q - base;
    float best = 8.0;
    vec2 to = vec2(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 r = vec2(float(i), float(j)) + spot(cell + ivec2(i, j)) - f;
      float d = dot(r, r);
      if (d < best) { best = d; to = r; }
    }
    sum += use * pow(wave / cut, uDetailLook.y) * vec3(2.0 * (to * turn), uDetailLook.x - best);
  }
  return sum;
}
`
