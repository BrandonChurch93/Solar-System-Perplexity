import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { GRADE_GLSL } from '../../stops/sun/grade'
import { NOISE_GLSL } from '../../terrain/relief'
import look from './look.json'

export const MAX_LOOPS = Math.max(look.loops.length, 1)
export const MAX_LOBES = Math.max(look.fringe.lobes.length, 1)
export const MAX_KNOTS = Math.max(look.knot.at.length, 1)

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
uniform float uMaster;
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
uniform vec2 uHide;
uniform vec3 uWhite;
uniform vec3 uDesat;
uniform vec2 uHalo;
uniform vec3 uHaloColour;
uniform vec4 uFringe;
uniform vec4 uFringeShape;
uniform vec3 uFringeColour;
uniform vec4 uFringeLobe[${MAX_LOBES}];
uniform vec4 uFringeLobeBy[${MAX_LOBES}];
uniform int uStrandLobe[${MAX_LOBES}];
uniform int uStrandLobes;
uniform vec3 uFringeFan;
uniform vec3 uFringeCurl;
uniform vec4 uFringeSheet;
uniform vec4 uFringeHairBy;
uniform vec3 uFringeHairCurl;
uniform vec3 uFringeHairTop;
uniform vec2 uFringeHairAll;
uniform vec3 uFringeHairTuft;
uniform vec2 uFringeHair[${MAX_LOBES}];
uniform vec3 uFringeSpike;
uniform vec2 uFringeWay;
uniform float uGlareEnd;
uniform float uLoopGain[${MAX_LOOPS}];
uniform float uLoopRagged[${MAX_LOOPS}];
uniform vec3 uLoopRope[${MAX_LOOPS}];
uniform vec3 uLoopSheath[${MAX_LOOPS}];
uniform float uHaloEdge;
uniform vec4 uKeep;
uniform vec3 uLimbGlow;
uniform float uKeepFloor;
uniform vec3 uKeepCoarse;
uniform float uKeepSoft;
uniform float uHeatFloor;
uniform vec2 uPlage;
uniform vec3 uLoopLook;
uniform vec3 uPromPale;
uniform vec3 uFringeKnot[${MAX_LOBES}];
uniform vec4 uKnot[${MAX_KNOTS}];
uniform vec4 uKnotAxis[${MAX_KNOTS}];
uniform vec2 uKnotShade;
uniform vec4 uKnotBy[${MAX_KNOTS}];
uniform vec4 uKnotRay[${MAX_KNOTS}];
uniform vec4 uKnotLight;
uniform vec3 uKnotClump;
uniform vec2 uKnotOut[${MAX_KNOTS}];
uniform vec2 uKnotLimb[${MAX_KNOTS}];
uniform vec4 uCoronaRim;
uniform float uChromoBurn;
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
vec3 whiteLook(vec3 d, float mu, float pixel, out float detail) {
  float heat = 1.0;
  heat += uGrainDepth.x * (granule(d, uGrainScale.x, uGrainLife.x) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.x));
  for (int k = 0; k < (pixel * uGrainScale.y < 0.4 ? 1 : 0); k++) heat += uGrainDepth.y * (granule(d, uGrainScale.y, uGrainLife.y) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.y));
  for (int k = 0; k < (pixel * uGrainScale.z < 0.4 ? 1 : 0); k++) heat += uGrainDepth.z * (granule(d, uGrainScale.z, uGrainLife.z) - 0.55) * (1.0 - smoothstep(0.12, 0.4, pixel * uGrainScale.z));
  float fine = textureLod(uFace, mapUv(d), max(log2(max(pixel * uFaceSize.x / 6.283185307179586, 1e-3)), 0.0)).r * uFaceSize.y;
  heat *= pow(fine, uSpots.z);
  float face = uSpots.w * smoothstep(uSpotLook.x, uSpotLook.y, fine) * (1.0 + uSpotLook.z * (1.0 - mu));
  heat = max(heat, uHeatFloor);
  heat += uPlage.x * smoothstep(0.5, 0.75, 0.6 * vnoise(d * uPlage.y + 2.0) + 0.4 * vnoise(d * (uPlage.y * 2.3) + 5.0));
  detail = heat + face;
  vec3 limb = vec3(1.0) - uLimbU - uLimbV + uLimbU * mu + uLimbV * mu * mu;
  return uColour * pow(vec3(heat), uHeat) * limb + uColour * face * mix(limb, vec3(1.0), 0.5);
}
vec3 burnWhite(vec3 x) {
  float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
  return mix(x, vec3(l), uDesat.z * smoothstep(uDesat.x, uDesat.y, l));
}
vec3 shoulder(vec3 x) {
  return uWhite * x / (x + uWhite);
}
float loopGas(vec3 q, int i, float soft, out float heat) {
  vec3 mid = uLoopMid[i];
  vec3 along = uLoopAlong[i];
  vec3 up = uLoopUp[i];
  vec4 shape = uLoopShape[i];
  vec3 rope = uLoopRope[i];
  vec3 rel = q - mid;
  float x = dot(rel, along);
  float y = dot(rel, up);
  float z = dot(rel, cross(along, up));
  float sum = 0.0;
  heat = 0.0;
  for (int s = 0; s < 4; s++) {
    float fs = float(s);
    float a = shape.x * (1.0 - 0.17 * fs * rope.x) * (1.0 + 0.25 * (vhash(vec3(fs, shape.w, 1.3)) - 0.5) * rope.x);
    float h = shape.y * (1.0 - 0.2 * fs * rope.x) * (1.0 + 0.3 * (vhash(vec3(fs, shape.w, 4.7)) - 0.5) * rope.x);
    float xs = x - shape.x * 0.3 * (vhash(vec3(fs, shape.w, 8.1)) - 0.5) * rope.x;
    vec2 pe = vec2(xs / a, y / h);
    float e = length(pe);
    float along2 = atan(pe.x, pe.y);
    float wob = vnoise(vec3(along2 * 2.3 + shape.w, fs * 4.1, uTime * 0.05)) - 0.5;
    wob += uLoopRagged[i] * (2.0 * wob + 0.8 * (vnoise(vec3(along2 * 9.0 + shape.w * 1.7, fs * 2.3, 3.1)) - 0.5));
    float ring = (e - 1.0 - 0.16 * wob - rope.y * sin(along2 * rope.z + fs * 1.5708)) * e / max(length(vec2(xs / (a * a), y / (h * h))), 1e-4);
    float lean = z - shape.x * 0.5 * (vhash(vec3(fs, shape.w, 2.9)) - 0.5) * cos(along2) * rope.x - 0.04 * (vnoise(vec3(along2 * 3.1, shape.w, fs * 1.9)) - 0.5) - rope.y * shape.y * cos(along2 * rope.z + fs * 1.5708);
    float thin = shape.z * uLoopLook.x;
    float width = max(thin * (0.7 + 0.9 * vnoise(vec3(along2 * 5.0, float(i) * 3.1, fs * 7.7))), soft);
    float dist2 = ring * ring + lean * lean;
    float strand = 0.3 + 1.4 * vnoise(vec3(along2 * 7.0 - uTime * uProm.w * (1.0 + 0.4 * fs), float(i) * 1.7 + shape.w, fs * 2.9));
    strand *= mix(1.0, 1.8 * smoothstep(0.35, 0.65, vnoise(vec3(along2 * 2.6 + shape.w * 3.0, fs * 5.3, float(i) * 2.1))), uLoopLook.y);
    float g = exp(-dist2 / (width * width)) * strand * (thin / width) * step(0.0, y + 0.05);
    for (int m = 0; m < (uLoopSheath[i].x > 0.0 ? 1 : 0); m++) {
      float wide = width * uLoopSheath[i].y;
      float flame = 0.25 + 1.5 * vnoise(q * uLoopSheath[i].z + fs * 3.7);
      float body = uLoopSheath[i].x * exp(-dist2 / (wide * wide)) * strand * flame * flame * step(0.0, y + 0.05);
      g += body;
    }
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
  float knotLight = 0.0;
  float knotOut = 0.0;
  for (int n = 0; n < ${MAX_KNOTS}; n++) {
    vec3 knotAt = spinY(uKnot[n].xyz, -uSpin);
    float knotOff = acos(clamp(dot(normalize(knotAt - ro), rd), -1.0, 1.0)) / discAngle;
    float knotHere = uKnotBy[n].x * exp(-pow(knotOff * knotOff * uKnot[n].w, uKnotBy[n].y)) * smoothstep(-0.2, 0.05, dot(knotAt, ro) - 1.0);
    for (int m = 0; m < (uKnotLimb[n].y > 0.0 ? 1 : 0); m++) knotHere *= pow(min(uKnotLimb[n].x / max(dot(knotAt, normalize(ro - knotAt)), 1e-4), 1.0), uKnotLimb[n].y);
    knotLight += knotHere * uKnotOut[n].y;
    knotOut += knotHere * uKnotOut[n].x;
  }
  for (int k = 0; k < (cover > 0.0 && (uParts & 1) != 0 ? 1 : 0); k++) {
    vec3 p = normalize(ro + rd * hit);
    float mu = clamp(dot(p, -rd), 0.0, 1.0);
    vec3 d = spinY(p, uSpin);
    vec2 uv = mapUv(d);
    float alt = fract(uv.x + 0.5) - 0.5;
    vec2 dx = vec2(abs(dFdx(uv.x)) < abs(dFdx(alt)) ? dFdx(uv.x) : dFdx(alt), dFdx(uv.y)) * (uGrad * uMaster);
    vec2 dy = vec2(abs(dFdy(uv.x)) < abs(dFdy(alt)) ? dFdy(uv.x) : dFdy(alt), dFdy(uv.y)) * (uGrad * uMaster);
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
      float detail;
      vec3 lit = shoulder(whiteLook(d, mu, pixel * uKeepSoft / max(mu, 0.2), detail) * (uBright * dim));
      lit = mix(lit, uWhite, uLimbGlow.x * exp(-(1.0 - min(x, 1.0)) * uLimbGlow.y));
      float coarse = 1.0;
      for (int w = 0; w < (uKeepCoarse.x > 0.0 ? 1 : 0); w++) coarse += uKeepCoarse.x * (vnoise(d * uKeepCoarse.y) + uKeepCoarse.z * vnoise(d * (uKeepCoarse.y * 2.3) + 3.0) - 0.5 - 0.5 * uKeepCoarse.z) * (1.0 - smoothstep(0.12, 0.4, pixel / max(mu, 0.2) * uKeepCoarse.y));
      vec3 mottle = pow(vec3(max(detail, uKeepFloor) * coarse / uKeep.w), uKeep.xyz * (1.0 + uLimbGlow.z * (1.0 - mu)));
      float glint = clamp(knotLight, 0.0, 1.0);
      vec3 patched = min(mix(lit, vec3(0.995), glint) * mix(mottle, vec3(1.0), smoothstep(0.6, 1.0, glint)), mix(uWhite, vec3(0.995), glint));
      lit = min(lit * mottle, uWhite);
      for (int w = 0; w < (knotLight < 0.0 && uKnotShade.y > 0.0 ? 1 : 0); w++) {
        vec3 less = (vec3(0.995) - lit) * -knotLight;
        patched = lit - mix(less, vec3(dot(less, vec3(0.3, 0.6, 0.1))), uKnotShade.x) * uKnotShade.y;
      }
      body += share * inverseFilmic(patched);
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
    gas += burnWhite(uChromoColour * (pow(uBurn.x, uChromoBurn) * uChromo.y * path / max(uChromo.x, 1e-4) * 0.05 * max(spic, 0.0)));
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
      sum += mix(uCoronaRim.rgb, mix(uCoronaNear, uCoronaWide, smoothstep(1.0, 1.5, r)), smoothstep(0.0, uCoronaRim.w, r - 1.0)) * rho;
    }
    gas += sum * (dt * uCorona.y) * mix(1.0, uCoronaFront, cover);
  }
  for (int k = 0; k < (miss < uProm.y && (uParts & 4) != 0 ? 1 : 0); k++) {
    vec3 sro = spinY(ro, uSpin);
    vec3 srd = spinY(rd, uSpin);
    float sb = dot(sro, srd);
    for (int i = 0; i < uLoops; i++) {
      if (uLoopGain[i] <= 0.0) continue;
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
        gas += burnWhite(mix(mix(uPromColour, uPromHot, smoothstep(1.5, 5.0, warm * dt * 60.0)), uPromPale, uLoopLook.z) * (sum * dt * uProm.z * uLoopGain[i]));
      }
    }
  }
  for (int k = 0; k < (miss < uFringe.y && cover < 0.5 && uFringe.z > 0.0 && (uParts & 4) != 0 ? 1 : 0); k++) {
    float halfChord = sqrt(max(uFringe.y * uFringe.y - near2, 0.0));
    float s0 = max(-b - halfChord, 0.0);
    float s1 = -b + halfChord;
    int steps = int(uFringe.x);
    float dt = max(s1 - s0, 0.0) / float(steps);
    float sum = 0.0;
    vec3 cell = floor(spinY(normalize(ro + rd * (-b)), uSpin) * 2048.0);
    float offset = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    for (int i = 0; i < steps; i++) {
      vec3 q = ro + rd * (s0 + (float(i) + offset) * dt);
      float r = length(q);
      vec3 sd = spinY(q / r, uSpin);
      float up = max(r - 1.0, 0.0);
      float fade = 1.0 - smoothstep(0.5 * (uFringe.y - 1.0), uFringe.y - 1.0, up);
      float more = 1.0;
      float high = 1.0;
      float strands = 0.0;
      float knot = 0.0;
      vec3 wisp = sd + (vec3(vnoise(sd * uFringeCurl.y + up * uFringeCurl.z + 1.0), vnoise(sd * uFringeCurl.y + up * uFringeCurl.z + 4.0), vnoise(sd * uFringeCurl.y + up * uFringeCurl.z + 7.0)) - 0.5) * (up * uFringeCurl.x);
      for (int k = 0; k < ${MAX_LOBES}; k++) {
        vec4 lobe = uFringeLobe[k];
        vec4 by = uFringeLobeBy[k];
        float here = exp(-(1.0 - dot(sd, lobe.xyz)) * lobe.w);
        more += by.x * here;
        high += by.y * here;
        knot += uFringeKnot[k].x * exp(-(1.0 - dot(sd, lobe.xyz)) * uFringeKnot[k].y - up / max(uFringeKnot[k].z, 1e-3));
      }
      for (int k = 0; k < uStrandLobes; k++) {
        vec4 lobe = uFringeLobe[uStrandLobe[k]];
        vec4 by = uFringeLobeBy[uStrandLobe[k]];
        vec3 foot = normalize(wisp - (wisp - lobe.xyz) * min(up * uFringeFan.x, 0.8));
        float strand = pow(vnoise(foot * uFringeFan.y), uFringeFan.z) + 0.5 * pow(vnoise(foot * (uFringeFan.y * 2.3) + 2.0), uFringeFan.z);
        float reach = by.z * (0.35 + 1.3 * vnoise(foot * (uFringeFan.y * 0.31) + 11.0));
        strands += by.w * exp(-(1.0 - dot(foot, lobe.xyz)) * lobe.w) * strand * exp(-up / max(reach, 1e-3));
      }
      float tall = mix(uFringeShape.x, uFringeShape.y, pow(vnoise(sd * 6.0 + 5.0), 2.0)) * high;
      vec3 bent = sd + (vec3(vnoise(sd * 9.0 + 1.0), vnoise(sd * 9.0 + 4.0), vnoise(sd * 9.0 + 7.0)) - 0.5) * (up * uFringeShape.w) + cross(uFringeSheet.xyz, sd) * (up * (uFringeWay.x + uFringeWay.y * up));
      float spike = uFringeSpike.x * pow(vnoise(bent * uFringeShape.z), uFringeSpike.z) + uFringeSpike.y * pow(vnoise(bent * (uFringeShape.z * 2.7) + 3.0), uFringeSpike.z);
      sum += (exp(-up / tall) * spike * more + strands + knot) * (fade * step(1.0, r));
    }
    float hair = 0.0;
    float hairTop = 1.0 + uFringeHairTop.y;
    for (int j = 0; j < (uFringeHairBy.z > 0.0 && near2 < hairTop * hairTop ? 1 : 0); j++) {
      float reachHalf = sqrt(hairTop * hairTop - near2);
      float h0 = max(-b - reachHalf, 0.0);
      int hairSteps = int(uFringeHairTop.x);
      float hd = max(-b + reachHalf - h0, 0.0) / float(hairSteps);
      for (int i = 0; i < hairSteps; i++) {
        vec3 q = ro + rd * (h0 + (float(i) + offset) * hd);
        float r = length(q);
        vec3 sd = spinY(q / r, uSpin);
        float up = max(r - 1.0, 0.0);
        float fade = (1.0 - smoothstep(0.5 * uFringeHairTop.y, uFringeHairTop.y, up)) * step(1.0, r);
        vec3 level = sd * uFringeHairCurl.y + up * uFringeHairCurl.z;
        vec3 wisp = sd + (vec3(vnoise(level + 1.0), vnoise(level + 4.0), vnoise(level + 7.0)) - 0.5) * (up * uFringeHairCurl.x) + cross(uFringeSheet.xyz, sd) * (up * uFringeHairTop.z);
        float weight = uFringeHairAll.x;
        float thin = 1.0;
        float reachBy = uFringeHairAll.x * uFringeHairAll.y;
        vec3 mid = wisp * uFringeHairAll.x;
        for (int n = 0; n < ${MAX_LOBES}; n++) {
          vec2 by = uFringeHair[n];
          if (by.x == 0.0) continue;
          vec4 lobe = uFringeLobe[n];
          float w = by.x * exp(-(1.0 - dot(wisp, lobe.xyz)) * lobe.w);
          if (by.x < 0.0) {
            thin *= 1.0 + max(w, -1.0);
            continue;
          }
          weight += w;
          reachBy += w * by.y;
          mid += w * lobe.xyz;
        }
        for (int m = 0; m < (weight * fade > 1e-4 ? 1 : 0); m++) {
          vec3 foot = normalize(wisp - (wisp - normalize(mid)) * min(up * uFringeHairBy.w, 0.8));
          vec3 cellAt = foot * uFringeHairBy.x;
          float strand = pow(vnoise(cellAt), uFringeHairBy.y) + 0.5 * pow(vnoise(cellAt * 1.7 + 2.0), uFringeHairBy.y);
          float tuft = uFringeHairTuft.x * pow(vnoise(cellAt * uFringeHairTuft.y + 5.0), uFringeHairBy.y);
          float reach = max(reachBy / weight * (0.35 + 1.3 * vnoise(foot * (uFringeHairBy.x * 0.31) + 11.0)), 1e-3);
          hair += thin * weight * (strand * exp(-up / reach) + tuft * exp(-up / (reach * uFringeHairTuft.z))) * fade;
        }
      }
      hair *= hd * uFringeHairBy.z;
    }
    gas += burnWhite(uFringeColour * ((sum * dt + hair) * uFringe.z * uBurn.x));
  }
  for (int n = 0; n < (cover < 0.5 && (uParts & 4) != 0 ? ${MAX_KNOTS} : 0); n++) {
    if (uKnotBy[n].z <= 0.0) continue;
    vec3 knotDir = spinY(uKnot[n].xyz, -uSpin);
    vec3 knotAt = knotDir * uKnotAxis[n].w;
    float tk = dot(knotAt - ro, rd);
    vec3 nearK = ro + rd * tk - knotAt;
    float halfK = sqrt(max(uKnotBy[n].w * uKnotBy[n].w - dot(nearK, nearK), 0.0));
    if (halfK <= 0.0) continue;
    int steps = int(uKnotLight.w);
    float dt = 2.0 * halfK / float(steps);
    vec3 cell = floor(spinY(normalize(ro + rd * (-b)), uSpin) * 2048.0);
    float offset = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    vec4 by = uKnotRay[n];
    vec3 axisAt = spinY(uKnotAxis[n].xyz, -uSpin);
    float sum = 0.0;
    for (int i = 0; i < (halfK > 0.0 ? steps : 0); i++) {
      vec3 q = ro + rd * (tk - halfK + (float(i) + offset) * dt);
      vec3 from = q - knotAt;
      float dist = length(from);
      vec3 dir = from / max(dist, 1e-4);
      vec3 sdir = spinY(dir, uSpin);
      sdir += (vec3(vnoise(sdir * 7.0 + dist * 3.0 + 1.0), vnoise(sdir * 7.0 + dist * 3.0 + 4.0), vnoise(sdir * 7.0 + dist * 3.0 + 7.0)) - 0.5) * (dist * uKnotClump.z);
      float ray = pow(vnoise(sdir * by.x), by.y) + 0.5 * pow(vnoise(sdir * (by.x * 2.3) + 2.0), by.y);
      ray *= mix(1.0, 2.2 * smoothstep(0.35, 0.65, vnoise(sdir * (by.x * uKnotClump.y) + 5.0)), uKnotClump.x);
      float reach = by.z * (0.35 + 1.3 * vnoise(sdir * (by.x * 0.31) + 11.0));
      float tip = min(dist / max(uKnotAxis[n].w - 1.0, 1e-6), 1.0);
      sum += ray * exp(-dist / max(reach, 1e-3)) * smoothstep(by.w - 0.3, by.w + 0.2, dot(dir, axisAt)) * smoothstep(uKnotBy[n].w, 0.6 * uKnotBy[n].w, dist) * step(1.0, length(q)) * tip * tip;
    }
    gas += burnWhite(uKnotLight.rgb * (sum * dt * uKnotBy[n].z)) * smoothstep(-0.2, 0.05, dot(knotDir, ro) - 1.0);
  }
  gas *= dim;
  col += gas;
  alpha = max(alpha, 1.0 - exp(-dot(gas, vec3(0.3, 0.5, 0.2)) * 0.5));
  alpha = max(alpha, uBurn.w * (1.0 - smoothstep(uHide.x, uHide.y, x)) * ahead);
  for (int k = 0; k < ((uParts & 8) != 0 ? 1 : 0); k++) {
    float o = max(x, 1.0) - 1.0;
    float inside = 1.0 - smoothstep(0.6, 1.0, x);
    float glow = uGlare.x * (exp(-o * uGlare.z) + uGlare.w / ((1.0 + o * o * 1.5) * (1.0 + o * o * uGlareEnd))) * (1.0 - uGlareInside * inside) * ahead;
    col += (uGlareColour * glow + uKnotLight.rgb * knotOut + (uIrrColour * (uBurn.y * exp(-o * o * uBurn.z * uBurn.z)) + uHaloColour * (uHalo.x * exp(-o * uHalo.y))) * ((1.0 - cover) * smoothstep(uHaloEdge, 1.0, x) * ahead)) * ((1.0 - uWear) * dim);
  }
  col *= lens * uOpacity;
  outColor = vec4(col, alpha * uOpacity);
}`
