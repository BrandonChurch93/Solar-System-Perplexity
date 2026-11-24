import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { GRADE_GLSL } from '../../stops/sun/grade'
import { NOISE_GLSL } from '../../terrain/relief'

export const MAX_LOOPS = 16

export const FARSUN_VERT = /* glsl */ `
uniform float uDepth;
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, uDepth, 1.0);
}`

export const FARSUN_FRAG = /* glsl */ `
precision highp float;
uniform vec4 uProj;
uniform mat3 uCam;
uniform mat3 uBody;
uniform vec3 uCentre;
uniform float uSpin;
uniform float uTime;
uniform float uHoldTime;
uniform float uWear;
uniform float uOpacity;
uniform float uGain;
uniform vec2 uLens;
uniform float uPixel;
uniform float uGrad;
uniform sampler2D uMap;
uniform float uMapOn;
uniform float uMapWidth;
uniform vec2 uHoldLimb;
uniform vec3 uHoldRim;
uniform vec2 uHoldRimShape;
uniform vec4 uHoldRimBy;
uniform vec4 uBoil;
uniform vec2 uQuiet;
uniform vec3 uHot;
uniform vec4 uPulse;
uniform vec4 uCell;
uniform float uReach;
uniform vec3 uLimbU;
uniform vec3 uLimbV;
uniform vec3 uColour;
uniform float uBright;
uniform float uCeiling;
uniform vec3 uHeat;
uniform vec3 uGrainScale;
uniform vec3 uGrainDepth;
uniform vec3 uGrainLife;
uniform vec4 uSpots;
uniform vec4 uSpotLook;
uniform vec4 uChromo;
uniform vec3 uChromoColour;
uniform vec2 uSpicules;
uniform vec4 uCorona;
uniform vec3 uCoronaRays;
uniform float uCoronaFront;
uniform vec3 uCoronaNear;
uniform vec3 uCoronaWide;
uniform vec4 uProm;
uniform vec3 uPromColour;
uniform vec3 uPromHot;
uniform vec3 uLoopMid[${MAX_LOOPS}];
uniform vec3 uLoopAlong[${MAX_LOOPS}];
uniform vec3 uLoopUp[${MAX_LOOPS}];
uniform vec4 uLoopShape[${MAX_LOOPS}];
uniform int uLoops;
uniform vec4 uGlare;
uniform vec3 uGlareColour;
uniform sampler2D uFace;
uniform vec2 uFaceSize;
uniform float uGlareInside;
uniform vec4 uBurn;
uniform vec3 uIrrColour;
uniform int uParts;
in vec2 vNdc;
out vec4 outColor;
const float PI = 3.141592653589793;
${INVERSE_FILMIC_GLSL}
${GRADE_GLSL}
${NOISE_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec2 mapUv(vec3 d) {
  return vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
}
float lumAt(vec3 d, float lod) {
  return dot(textureLod(uMap, mapUv(d), lod).rgb, vec3(0.3, 0.5, 0.2));
}
vec3 hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
vec2 cells(vec3 x, float seed) {
  vec3 i = floor(x);
  vec3 f = x - i;
  float a = 8.0;
  float b = 8.0;
  for (int w = -1; w <= 1; w++) {
    for (int v = -1; v <= 1; v++) {
      for (int u = -1; u <= 1; u++) {
        vec3 o = vec3(float(u), float(v), float(w));
        vec3 q = o + hash3(i + o + seed) - f;
        float s = dot(q, q);
        b = min(b, max(a, s));
        a = min(a, s);
      }
    }
  }
  return vec2(sqrt(a), sqrt(b) - sqrt(a));
}
float granule(vec3 d, float scale, float life) {
  float sum = 0.0;
  for (int k = 0; k < 2; k++) {
    float phase = uTime / life + 0.5 * float(k);
    float age = fract(phase);
    vec2 c = cells(d * scale, floor(phase) * 17.0 + float(k) * 5.3);
    float w = sin(PI * age);
    sum += w * w * smoothstep(0.0, 0.22, c.y) * (1.0 - 0.45 * c.x);
  }
  return sum;
}
vec3 holdLook(vec3 d, float mu, vec2 dx, vec2 dy) {
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = uBoil.z;
  float lod = log2(uMapWidth / 1024.0);
  float lE1 = lumAt(normalize(d + east * e), lod + 1.5);
  float lE0 = lumAt(normalize(d - east * e), lod + 1.5);
  float lN1 = lumAt(normalize(d + north * e), lod + 1.5);
  float lN0 = lumAt(normalize(d - north * e), lod + 1.5);
  vec3 push = (east * (lE1 - lE0) + north * (lN1 - lN0)) * (uBoil.x / (2.0 * e));
  float pl = length(push);
  push *= min(1.0, uBoil.w / max(pl, 1e-6)) * smoothstep(uQuiet.x, uQuiet.y, min(min(lE1, lE0), min(lN1, lN0)));
  vec3 dc = normalize(d.zxy + vec3(0.21, -0.13, 0.17));
  float slow = lumAt(dc, lod + 3.0) * 24.0 + lumAt(d, lod + 3.5) * 16.0;
  float swing = 0.5 * (sin(uHoldTime * 6.283185307179586 / uBoil.y + slow) - sin(slow)) * uWear;
  vec3 shown = grade(textureGrad(uMap, mapUv(normalize(d + push * swing)), dx, dy).rgb, 2.0);
  vec3 lin = inverseFilmic(shown);
  float wide = lumAt(d, lod + 2.5);
  float region = smoothstep(uPulse.z, uPulse.w, wide);
  float phase = dot(d, vec3(23.0, 17.0, 29.0));
  float beat = 1.0 + uPulse.x * region * (sin(uHoldTime * uPulse.y + phase) - sin(phase));
  float churn = vnoise(d * (uCell.z + uHoldTime * uCell.y)) - vnoise(d * uCell.z) + uCell.w * (vnoise(d * (uCell.z * 2.9 + uHoldTime * uCell.y * 2.3) + 7.3) - vnoise(d * uCell.z * 2.9 + 7.3));
  beat *= max(1.0 + uCell.x * churn, 0.35);
  float hot = smoothstep(uHot.x, uHot.y, min(lin.r, lin.g * 1.6));
  return lin * ((uHoldLimb.x + uHoldLimb.y * (1.0 - mu)) / uHoldLimb.x) * beat * (1.0 + uHot.z * hot * hot);
}
vec3 whiteLook(vec3 d, float mu, float pixel) {
  float heat = 1.0;
  heat += uGrainDepth.x * (granule(d, uGrainScale.x, uGrainLife.x) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.x));
  for (int k = 0; k < (pixel * uGrainScale.y < 0.4 ? 1 : 0); k++) heat += uGrainDepth.y * (granule(d, uGrainScale.y, uGrainLife.y) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.y));
  for (int k = 0; k < (pixel * uGrainScale.z < 0.4 ? 1 : 0); k++) heat += uGrainDepth.z * (granule(d, uGrainScale.z, uGrainLife.z) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.z));
  float fine = textureLod(uFace, mapUv(d), max(log2(max(pixel * uFaceSize.x / 6.283185307179586, 1e-3)), 0.0)).r * uFaceSize.y;
  heat *= pow(fine, uSpots.z);
  float face = uSpots.w * smoothstep(uSpotLook.x, uSpotLook.y, fine) * (1.0 + uSpotLook.z * (1.0 - mu));
  heat = max(heat, 0.03);
  vec3 limb = vec3(1.0) - uLimbU - uLimbV + uLimbU * mu + uLimbV * mu * mu;
  return uColour * pow(vec3(heat), uHeat) * limb + uColour * face * mix(limb, vec3(1.0), 0.5);
}
vec3 shoulder(vec3 x) {
  return uCeiling * (vec3(1.0) - exp(-x / uCeiling));
}
float loopGas(vec3 q, int i, float soft, out float heat) {
  vec3 mid = uLoopMid[i];
  vec3 along = uLoopAlong[i];
  vec3 up = uLoopUp[i];
  vec4 shape = uLoopShape[i];
  vec3 rel = q - mid;
  float x = dot(rel, along);
  float y = dot(rel, up);
  float z = dot(rel, cross(along, up));
  float sum = 0.0;
  heat = 0.0;
  for (int s = 0; s < 4; s++) {
    float fs = float(s);
    float a = shape.x * (1.0 - 0.17 * fs) * (1.0 + 0.25 * (vhash(vec3(fs, shape.w, 1.3)) - 0.5));
    float h = shape.y * (1.0 - 0.2 * fs) * (1.0 + 0.3 * (vhash(vec3(fs, shape.w, 4.7)) - 0.5));
    float xs = x - shape.x * 0.3 * (vhash(vec3(fs, shape.w, 8.1)) - 0.5);
    vec2 pe = vec2(xs / a, y / h);
    float e = length(pe);
    float along2 = atan(pe.x, pe.y);
    float wob = vnoise(vec3(along2 * 2.3 + shape.w, fs * 4.1, uTime * 0.05)) - 0.5;
    float ring = (e - 1.0 - 0.16 * wob) * e / max(length(vec2(xs / (a * a), y / (h * h))), 1e-4);
    float lean = z - shape.x * 0.5 * (vhash(vec3(fs, shape.w, 2.9)) - 0.5) * cos(along2) - 0.04 * (vnoise(vec3(along2 * 3.1, shape.w, fs * 1.9)) - 0.5);
    float width = max(shape.z * (0.7 + 0.9 * vnoise(vec3(along2 * 5.0, float(i) * 3.1, fs * 7.7))), soft);
    float dist2 = ring * ring + lean * lean;
    float strand = 0.3 + 1.4 * vnoise(vec3(along2 * 7.0 - uTime * uProm.w * (1.0 + 0.4 * fs), float(i) * 1.7 + shape.w, fs * 2.9));
    float g = exp(-dist2 / (width * width)) * strand * (shape.z / width) * step(0.0, y + 0.05);
    sum += g;
    heat += g * strand;
  }
  return sum;
}
void main() {
  vec3 rayCam = vec3((vNdc.x + uProj.z) / uProj.x, (vNdc.y + uProj.w) / uProj.y, -1.0);
  vec3 rd = normalize(uBody * (uCam * rayCam));
  vec3 ro = -(uBody * uCentre);
  float away = length(ro);
  float b = dot(ro, rd);
  float near2 = dot(ro, ro) - b * b;
  float miss = sqrt(max(near2, 0.0));
  float ahead = step(b, 0.0);
  float cosAngle = clamp(-b / away, -1.0, 1.0);
  float angle = acos(cosAngle);
  float discAngle = asin(min(1.0 / away, 1.0));
  float x = angle / discAngle;
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float pixel = away * uPixel;
  float cover = ahead * clamp((1.0 - miss) / max(pixel, 1e-6) + 0.5, 0.0, 1.0);
  float hit = -b - sqrt(max(1.0 - near2, 0.0));
  vec2 lq = vNdc * 0.5 * vec2(uLens.y, 1.0);
  float vig = mix(1.0, 1.0 / pow(1.0 + dot(lq, lq) * 0.9, 2.0), uLens.x);
  float lens = uGain / vig;
  float dim = mix(vig, 1.0, uWear);
  for (int k = 0; k < (cover > 0.0 && (uParts & 1) != 0 ? 1 : 0); k++) {
    vec3 p = normalize(ro + rd * hit);
    float mu = clamp(dot(p, -rd), 0.0, 1.0);
    vec3 d = spinY(p, uSpin);
    vec2 uv = mapUv(d);
    float alt = fract(uv.x + 0.5) - 0.5;
    vec2 dx = vec2(abs(dFdx(uv.x)) < abs(dFdx(alt)) ? dFdx(uv.x) : dFdx(alt), dFdx(uv.y)) * uGrad;
    vec2 dy = vec2(abs(dFdy(uv.x)) < abs(dFdy(alt)) ? dFdy(uv.x) : dFdy(alt), dFdy(uv.y)) * uGrad;
    vec3 body = vec3(0.0);
    for (int j = 0; j < (uWear > 0.0 && uMapOn > 0.0 ? 1 : 0); j++) {
      vec3 hold = holdLook(d, mu, dx, dy);
      float rim = pow(1.0 - mu, uHoldRimShape.y) * exp(-mu / uHoldRimShape.x);
      vec3 across = transpose(uCam) * (transpose(uBody) * (rd * dot(-ro, rd) + ro));
      float turn = abs(fract(atan(across.y, across.x) / 6.283185307179586 - uHoldRimBy.y + 0.5) - 0.5);
      rim *= mix(1.0, uHoldRimBy.x, smoothstep(uHoldRimBy.z, uHoldRimBy.w, turn));
      body += uWear * (hold + uHoldRim * rim);
    }
    for (int j = 0; j < (uWear < 1.0 || uMapOn <= 0.0 ? 1 : 0); j++) {
      float share = uMapOn > 0.0 ? 1.0 - uWear : 1.0;
      body += share * inverseFilmic(shoulder(whiteLook(d, mu, pixel / max(mu, 0.2)) * (uBright * dim)));
    }
    col = body * cover;
    alpha = cover;
  }
  float t1 = -b + sqrt(max(uReach * uReach - near2, 0.0));
  float t0 = max(-b - sqrt(max(uReach * uReach - near2, 0.0)), 0.0);
  float end = cover > 0.5 ? min(hit, t1) : t1;
  vec3 gas = vec3(0.0);
  for (int k = 0; k < (miss < uReach && end > t0 && (uParts & 2) != 0 ? 1 : 0); k++) {
    float through = 2.0 * smoothstep(1.0 - pixel, 1.0 + pixel, miss);
    float top = 1.0 + uChromo.x;
    float path = (sqrt(max(top * top - near2, 0.0)) - sqrt(max(1.0 - near2, 0.0))) * through * ahead;
    vec3 tangent = spinY(normalize(ro + rd * (-b)), uSpin);
    float spic = 1.0 + uSpicules.y * (vnoise(tangent * uSpicules.x + vec3(0.0, uTime * 0.6, 0.0)) - 0.5) * 2.0;
    gas += uChromoColour * (uBurn.x * uChromo.y * path / max(uChromo.x, 1e-4) * 0.05 * max(spic, 0.0));
    int steps = int(uCorona.x);
    float dt = (end - t0) / float(steps);
    vec3 sum = vec3(0.0);
    for (int i = 0; i < steps; i++) {
      vec3 q = ro + rd * (t0 + (float(i) + 0.5) * dt);
      float r = length(q);
      vec3 sd = spinY(q / r, uSpin);
      float scale = mix(uCorona.z, uCorona.w, pow(vnoise(sd * 5.0 + 11.0), 2.0));
      float rays = 0.06 + 1.6 * pow(vnoise(sd * uCoronaRays.x + 3.1), 2.5) + 0.9 * pow(vnoise(sd * uCoronaRays.y + 9.7), 3.0);
      float rho = exp(-(r - 1.0) / scale) * rays + uCoronaRays.z * pow(r, -2.5);
      rho *= smoothstep(uReach, uReach * 0.8, r) * step(1.0, r);
      sum += mix(uCoronaNear, uCoronaWide, smoothstep(1.0, 1.5, r)) * rho;
    }
    gas += sum * (dt * uCorona.y) * mix(1.0, uCoronaFront, cover);
  }
  for (int k = 0; k < (miss < uProm.y && (uParts & 4) != 0 ? 1 : 0); k++) {
    vec3 sro = spinY(ro, uSpin);
    vec3 srd = spinY(rd, uSpin);
    float sb = dot(sro, srd);
    for (int i = 0; i < uLoops; i++) {
      vec4 shape = uLoopShape[i];
      vec3 mid = uLoopMid[i] + uLoopUp[i] * shape.y * 0.5;
      float bound = length(vec2(shape.x * 1.3, shape.y * 0.65)) + 0.08;
      vec3 oc = sro - mid;
      float bb = dot(oc, srd);
      float h = bb * bb - dot(oc, oc) + bound * bound;
      for (int j = 0; j < (h > 0.0 ? 1 : 0); j++) {
        float s0 = max(-bb - sqrt(h), 0.0);
        float s1 = -bb + sqrt(h);
        if (cover > 0.5) s1 = min(s1, hit);
        if (s1 <= s0) continue;
        int steps = int(uProm.x);
        float dt = (s1 - s0) / float(steps);
        float sum = 0.0;
        float warm = 0.0;
        for (int n = 0; n < steps; n++) {
          vec3 q = sro + srd * (s0 + (float(n) + 0.5) * dt);
          float heat;
          float g = loopGas(q, i, dt * 0.6, heat) * step(1.0, length(q));
          sum += g;
          warm += heat;
        }
        gas += mix(uPromColour, uPromHot, smoothstep(1.5, 5.0, warm * dt * 60.0)) * (sum * dt * uProm.z * uBurn.x);
      }
    }
  }
  gas *= dim;
  col += gas;
  alpha = max(alpha, 1.0 - exp(-dot(gas, vec3(0.3, 0.5, 0.2)) * 0.5));
  for (int k = 0; k < ((uParts & 8) != 0 ? 1 : 0); k++) {
    float o = max(x, 1.0) - 1.0;
    float inside = 1.0 - smoothstep(0.6, 1.0, x);
    float glow = uGlare.x * (exp(-o * uGlare.z) + uGlare.w / (1.0 + o * o * 1.5)) * (1.0 - uGlareInside * inside) * ahead;
    col += (uGlareColour * glow + uIrrColour * (uBurn.y * exp(-o * o * uBurn.z * uBurn.z) * (1.0 - uGlareInside * inside) * ahead)) * ((1.0 - uWear) * dim);
  }
  col *= lens * uOpacity;
  outColor = vec4(col, alpha * uOpacity);
}`
