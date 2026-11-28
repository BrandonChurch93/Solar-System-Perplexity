import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import fit from './close.json'
import look from './closeup.json'
import { ownTrig } from './trig'

const VERT = /* glsl */ `
uniform vec3 uCentre;
out vec3 vPos;
out vec3 vClip;
void main() {
  vPos = position + uCentre;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const STEPS = 10

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uDeck;
uniform sampler2D uDeckWide;
uniform sampler2D uCloud;
uniform sampler2D uCloudWide;
uniform sampler2D uHeight;
uniform sampler2D uGlow;
uniform vec3 uCentre;
uniform vec3 uCam;
uniform vec4 uHome;
uniform float uRadius;
uniform vec4 uCanvas;
uniform vec2 uTan;
uniform vec2 uDeckSize;
uniform vec2 uWideSize;
uniform vec3 uSlab;
uniform vec3 uBandAxis;
uniform vec3 uStream;
uniform vec4 uStorm;
uniform float uStormAngle;
uniform vec3 uNorth;
uniform vec3 uEast;
uniform vec3 uGlowMap;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform sampler2D uBloomWide;
uniform vec3 uBloomPre;
uniform sampler2D uFineMap;
uniform vec2 uFine;
uniform vec4 uLay;
uniform vec4 uLayFit;
uniform float uLayGlow;
uniform float uLaySky;
uniform vec3 uLayLimb;
uniform vec3 uLayRef;
uniform vec4 uLayGrade;
uniform float uLaySat;
uniform vec4 uLayCloud;
uniform float uLayCore;
uniform float uLayDeck;
uniform float uLayGround;
uniform vec3 uLayBox;
uniform vec2 uLayAgree;
uniform mat3 uLaySpot;
uniform vec4 uLayTone;
uniform sampler2D uLayToneMap;
in vec3 vPos;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
vec3 turnAbout(vec3 d, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return d * c + cross(axis, d) * s + axis * dot(axis, d) * (1.0 - c);
}
vec3 cloudSource(vec3 q) {
  float lat = dot(normalize(q), uBandAxis);
  return turnAbout(q, uBandAxis, -uStream.x * (1.0 + uStream.y * lat));
}
vec3 deckSource(vec3 q) {
  float ang = acos(clamp(dot(normalize(q), uStorm.xyz), -1.0, 1.0)) / uStorm.w;
  return turnAbout(q, uStorm.xyz, -uStormAngle / (1.0 + ang * ang * ang * ang));
}
vec2 planeOf(vec3 q) {
  vec3 p = q + uCentre;
  return p.xy / max(-p.z, 0.02);
}
vec3 rimmed(vec3 q, float reach) {
  float r = length(q);
  vec3 d = q / r;
  float c = dot(d, uHome.xyz);
  vec3 e = d - uHome.xyz * c;
  vec3 rim = uHome.xyz * reach + e / max(length(e), 1e-5) * sqrt(1.0 - reach * reach);
  return mix(d, rim, step(c, reach)) * r;
}
vec3 inSight(vec3 q) {
  return rimmed(q, uHome.w);
}
vec2 wideUv(vec2 xy) {
  return vec2((xy.x - uCanvas.x) / (uCanvas.y - uCanvas.x), (xy.y - uCanvas.w) / (uCanvas.z - uCanvas.w));
}
vec2 coreUv(vec2 xy) {
  return xy / (2.0 * uTan) + 0.5;
}
float coreWeight(vec2 uc) {
  return smoothstep(0.0, 0.006, min(min(uc.x, 1.0 - uc.x), min(uc.y, 1.0 - uc.y)));
}
vec3 deckAt(vec2 xy, vec2 gx, vec2 gy) {
  vec2 uc = coreUv(xy);
  float w = coreWeight(uc);
  vec2 span = vec2(uCanvas.y - uCanvas.x, uCanvas.z - uCanvas.w);
  vec3 deck = mix(textureGrad(uDeckWide, wideUv(xy), gx / span, gy / span).rgb, textureGrad(uDeck, uc, gx / (2.0 * uTan), gy / (2.0 * uTan)).rgb, w);
  for (int j = 0; j < (w > 0.0 && uFine.x + uFine.y > 0.0 ? 1 : 0); j++) {
    vec2 fine = textureGrad(uFineMap, uc, gx / (2.0 * uTan), gy / (2.0 * uTan)).rg * (255.0 / 127.0);
    deck *= pow(abs(mix(1.0, fine.x, w * uFine.x) * mix(1.0, fine.y, w * uFine.y)), 2.2);
  }
  return deck;
}
void main() {
  vec3 rd = normalize(vPos - uCam);
  vec3 oc = uCam - uCentre;
  float b = dot(oc, rd);
  float rt2 = dot(oc, oc) - b * b;
  float top = uRadius + uSlab.x + uSlab.y;
  float discDeck = uRadius * uRadius - rt2;
  float discTop = top * top - rt2;
  float tDeck = -b - sqrt(max(discDeck, 0.0));
  bool deckHit = discDeck > 0.0 && tDeck > 0.0;
  bool slabHit = discTop > 0.0 && (-b + sqrt(max(discTop, 0.0))) > 0.0;
  float tIn = max(-b - sqrt(max(discTop, 0.0)), 0.0);
  float base = uRadius + uSlab.x;
  float discBase = base * base - rt2;
  float tBase = -b - sqrt(max(discBase, 0.0));
  float tOut = discBase > 0.0 && tBase > 0.0 ? tBase : -b + sqrt(max(discTop, 0.0));
  vec3 qIn = oc + rd * (slabHit ? tIn : -b);
  vec2 xyIn = planeOf(qIn);
  vec2 gx = dFdx(xyIn);
  vec2 gy = dFdy(xyIn);
  vec2 wgx = gx / vec2(uCanvas.y - uCanvas.x, uCanvas.z - uCanvas.w);
  vec2 wgy = gy / vec2(uCanvas.y - uCanvas.x, uCanvas.z - uCanvas.w);
  vec2 cgx = gx / (2.0 * uTan);
  vec2 cgy = gy / (2.0 * uTan);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float texels = 0.0;
  float counted = 0.0;
  vec3 layer = vec3(0.05, 0.1, 0.3);
  float depth = 4000.0;
  vec2 xyDeck = planeOf(deckSource(inSight(oc + rd * tDeck)));
  vec2 ucDeck = coreUv(xyDeck);
  float deckTexels = mix(diagTexels(wideUv(xyDeck) * uWideSize), diagTexels(ucDeck * uDeckSize), coreWeight(ucDeck));
  float tHit = -1.0;
  float cloudAlpha = 0.0;
  vec3 deckCol = vec3(0.0);
  vec3 cloudCol = vec3(0.0);
  float layCover = 1.0;
  float layCloud = 0.0;
  float deckShade = 1.0;
  for (int k = 0; k < (deckHit ? 1 : 0); k++) {
    vec3 q = inSight(oc + rd * tDeck);
    vec2 xy = planeOf(deckSource(q));
    vec2 uc = coreUv(xy);
    float w = coreWeight(uc);
    vec3 deck = mix(textureGrad(uDeckWide, wideUv(xy), wgx, wgy).rgb, textureGrad(uDeck, uc, cgx, cgy).rgb, w);
    for (int j = 0; j < (w > 0.0 && uFine.x + uFine.y > 0.0 ? 1 : 0); j++) {
      vec2 fine = textureGrad(uFineMap, uc, cgx, cgy).rg * (255.0 / 127.0);
      deck *= pow(abs(mix(1.0, fine.x, w * uFine.x) * mix(1.0, fine.y, w * uFine.y)), 2.2);
    }
    float shade = textureGrad(uHeight, wideUv(planeOf(cloudSource(q))), wgx, wgy).g;
    col = deck * shade;
    deckCol = col;
    deckShade = shade;
    alpha = 1.0;
    texels = deckTexels;
    counted = 1.0;
    layer = vec3(0.1, 0.3, 0.85);
    depth = tDeck;
  }
  for (int k = 0; k < (deckHit ? 0 : 1); k++) {
    float rt = sqrt(max(rt2, 0.0)) / uRadius;
    float az = atan(dot(rd, uEast), dot(rd, uNorth));
    col = textureLod(uGlow, vec2(az / uGlowMap.x + 0.5, (rt - 1.0) / uGlowMap.y), 0.0).rgb * (1.0 - smoothstep(uGlowMap.y * 0.8, uGlowMap.y, rt - 1.0));
  }
  for (int k = 0; k < (slabHit ? 1 : 0); k++) {
    float dt = (tOut - tIn) / float(${STEPS});
    float tPrev = tIn;
    float fPrev = -1.0;
    for (int i = 0; i <= ${STEPS}; i++) {
      float t = tIn + dt * float(i);
      vec3 q = oc + rd * t;
      float h = (length(q) - uRadius - uSlab.x) / uSlab.y;
      float cover = textureGrad(uHeight, wideUv(planeOf(cloudSource(q))), wgx, wgy).r;
      float f = cover - h;
      if (tHit < 0.0 && (f > 0.0 || i == ${STEPS})) {
        tHit = fPrev < 0.0 && f > 0.0 && i > 0 ? mix(tPrev, t, clamp(-fPrev / (f - fPrev), 0.0, 1.0)) : t;
      }
      tPrev = t;
      fPrev = f;
    }
    for (int j = 0; j < (tHit >= 0.0 ? 1 : 0); j++) {
      vec3 q = oc + rd * tHit;
      vec2 xy = planeOf(cloudSource(q));
      vec2 uc = coreUv(xy);
      float w = coreWeight(uc);
      vec4 cloud = mix(textureGrad(uCloudWide, wideUv(xy), wgx, wgy), textureGrad(uCloud, uc, cgx, cgy), w);
      col = mix(col, cloud.rgb, cloud.a);
      alpha = max(alpha, cloud.a);
      cloudAlpha = cloud.a;
      cloudCol = cloud.rgb;
      counted = max(counted, step(0.5, cloud.a));
      layer = mix(layer, vec3(0.95, 0.95, 0.9), cloud.a);
      depth = mix(depth, tHit, step(0.5, cloud.a));
    }
  }
  vec2 xyCloud = planeOf(cloudSource(oc + rd * (tHit >= 0.0 ? tHit : -b)));
  vec2 ucCloud = coreUv(xyCloud);
  texels = mix(texels, mix(diagTexels(wideUv(xyCloud) * uWideSize), diagTexels(ucCloud * uDeckSize), coreWeight(ucCloud)), cloudAlpha);
  for (int k = 0; k < (uLay.x > 0.0 ? 1 : 0); k++) {
    vec3 qd = oc + rd * tDeck;
    vec3 nd = normalize(qd);
    vec3 ps = deckSource(inSight(qd)) + uCentre;
    vec2 wu = wideUv(ps.xy / max(-ps.z, 0.02));
    float inCanvas = smoothstep(0.0, uLay.w * max(1.0, length(ps) / uLayCloud.y), min(min((ps.x + uCanvas.x * ps.z) / sqrt(1.0 + uCanvas.x * uCanvas.x), (-uCanvas.y * ps.z - ps.x) / sqrt(1.0 + uCanvas.y * uCanvas.y)), (ps.y + uCanvas.w * ps.z) / sqrt(1.0 + uCanvas.w * uCanvas.w))) * step(0.05, -ps.z);
    float nearZone = smoothstep(uLay.y, uLay.z, dot(nd, uHome.xyz));
    vec2 jx = dFdx(wu) * uWideSize;
    vec2 jy = dFdy(wu) * uWideSize;
    float a = dot(jx, jx) + dot(jy, jy);
    float det = jx.x * jy.y - jx.y * jy.x;
    float core = uDeckSize.x * (uCanvas.y - uCanvas.x) / (uWideSize.x * 2.0 * uTan.x);
    float worst = sqrt(max(0.5 * (a - sqrt(max(a * a - 4.0 * det * det, 0.0))), 0.0)) * mix(1.0, core, smoothstep(0.0, uLayCore, min(min(ucDeck.x, 1.0 - ucDeck.x), min(ucDeck.y, 1.0 - ucDeck.y))));
    float fitted = dot(normalize(-(qd + uCentre)), nd);
    float graze = 1.0 - smoothstep(uLayFit.x, uLayFit.y, dot(-rd, nd) / max(fitted, 1e-3));
    float honest = graze * smoothstep(uLayFit.z, uLayFit.w, worst);
    float whole = max(inCanvas, uLayGlow);
    float ground = uLayDeck * uLayGround * whole * max(max(nearZone, honest), uLayGlow);
    vec2 inCloud = smoothstep(vec2(0.0), vec2(uLayCloud.x), vec2(min(xyCloud.x - uLayBox.x, uLayBox.y - xyCloud.x), xyCloud.y - uLayBox.z));
    float cloudNear = smoothstep(uLayCloud.w, uLayCloud.z, dot(normalize(oc + rd * (tHit >= 0.0 ? tHit : -b)), uHome.xyz));
    vec3 qc = oc + rd * (tHit >= 0.0 ? tHit : -b);
    vec3 nc = normalize(qc);
    float agree = 1.0 - smoothstep(uLayAgree.x, uLayAgree.y, dot(-rd, nc) / max(dot(normalize(-(qc + uCentre)), nc), 1e-3));
    float ac = cloudAlpha * max(max(uLayDeck * whole * honest, uLay.x * inCloud.x * inCloud.y * cloudNear * agree), uLayGlow);
    float under = 1.0 - sqrt(max(rt2, 0.0)) / uRadius;
    float line = deckHit ? uLaySky * (1.0 - smoothstep(uLayLimb.x, uLayLimb.y, under)) : 0.0;
    vec3 upNow = normalize(oc);
    vec3 upRef = normalize(uLayRef);
    vec3 level = rd - upNow * dot(rd, upNow);
    level /= max(length(level), 1e-5);
    vec3 axis = cross(upNow, upRef);
    float along = dot(upNow, upRef);
    vec3 levelRef = level * along + cross(axis, level) + axis * (dot(axis, level) / (1.0 + along));
    float sf = min(sqrt(max(rt2, 0.0)) / length(uLayRef), 1.0);
    vec3 dRef = -upRef * sqrt(1.0 - sf * sf) + levelRef * sf;
    float bRef = dot(uLayRef, dRef);
    vec3 qRef = uLayRef + dRef * (-bRef - sqrt(max(bRef * bRef - dot(uLayRef, uLayRef) + uRadius * uRadius, 0.0)));
    vec3 qRim = rimmed(qRef, uLayLimb.z);
    vec2 xyLimb = planeOf(deckSource(qRim));
    vec3 limbCol = deckAt(xyLimb, dFdx(xyLimb), dFdy(xyLimb)) * textureGrad(uHeight, wideUv(planeOf(cloudSource(qRim))), wgx, wgy).g;
    float cover = 1.0 - (1.0 - ground) * (1.0 - line) * (1.0 - ac);
    for (int j = 0; j < (deckHit && uLayTone.w > 0.0 ? 1 : 0); j++) {
      vec3 sp = nd * uLaySpot;
      vec3 lift = exp2(-uLayTone.w * (textureLod(uLayToneMap, (sp.xy / max(sp.z, 0.05) - uLayTone.xy) * uLayTone.z + 0.5, 0.0).rgb - 0.5));
      deckCol = min(deckCol * lift, vec3(0.98));
      limbCol = min(limbCol * lift, vec3(0.98));
    }
    for (int j = 0; j < (deckHit ? 1 : 0); j++) {
      col = ((ground * deckCol * (1.0 - line) + limbCol * line) * (1.0 - ac) + cloudCol * ac) / max(cover, 1e-4);
    }
    layCover = deckHit ? cover : uLaySky;
    layCloud = deckHit ? ac / max(cover, 1e-4) : 0.0;
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col = inverseFilmic(col);
  for (int k = 0; k < (uLay.x > 0.0 ? 1 : 0); k++) {
    vec3 seen = col / uLayGrade.rgb;
    col = mix(max(mix(vec3(dot(seen, vec3(0.3, 0.5, 0.2))), seen, 1.0 / uLaySat), 0.0), col, max(uLayGrade.w, layCloud));
  }
  for (int k = 0; k < (deckHit && uBloomPre.x > 0.0 ? 1 : 0); k++) {
    float mid = uRadius + uSlab.x + 0.5 * uSlab.y;
    vec3 qm = inSight(oc + rd * max(-b - sqrt(max(mid * mid - rt2, 0.0)), 0.0));
    vec3 wide = inverseFilmic(textureLod(uBloomWide, wideUv(planeOf(cloudSource(qm))), 0.0).rgb);
    col = max(col - wide * uBloomPre.x, 0.0) / (1.0 - uBloomPre.x * uBloomPre.y);
  }
  col = col * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, alpha), texels, counted, layer, vec2(0.0), depth / uRadius);
  for (int k = 0; k < (uLay.x > 0.0 ? 1 : 0); k++) {
    outColor *= layCover;
  }
}`

function unproject(px: number, py: number, radius: number, centre: THREE.Vector3): THREE.Vector3 {
  const ty = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
  const d = new THREE.Vector3(((px / look.image[0]) * 2 - 1) * ty * (look.image[0] / look.image[1]), (1 - (py / look.image[1]) * 2) * ty, -1).normalize()
  const b = d.dot(centre)
  const t = b - Math.sqrt(Math.max(b * b - (centre.lengthSq() - radius * radius), 0))
  return d.multiplyScalar(t).sub(centre)
}

export interface CloseMaps { deck: THREE.Texture; deckWide: THREE.Texture; cloud: THREE.Texture; cloudWide: THREE.Texture; height: THREE.Texture; glow: THREE.Texture; bloom: THREE.Texture; fine: THREE.Texture; tone?: THREE.Texture }

export class Closeup {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly centre: THREE.Vector3
  readonly up: THREE.Vector3
  private readonly seat = new THREE.Vector3()
  private readonly back = new THREE.Quaternion()

  constructor(maps: CloseMaps, readonly laid = false) {
    const radius = fit.radius
    this.up = new THREE.Vector3().fromArray(fit.nadir).negate()
    this.centre = new THREE.Vector3().fromArray(fit.nadir).multiplyScalar(radius + 1)
    const ty = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
    const tx = ty * (look.image[0] / look.image[1])
    const size = (t: THREE.Texture) => {
      const i = t.image as unknown as { width: number; height: number }
      return new THREE.Vector2(i.width, i.height)
    }
    const a = unproject(look.band[0]!, look.band[1]!, radius, this.centre)
    const c = unproject(look.band[2]!, look.band[3]!, radius, this.centre)
    const bandAxis = new THREE.Vector3().crossVectors(a, c).normalize()
    const storm = unproject(look.storm[0]!, look.storm[1]!, radius, this.centre).normalize()
    const north = new THREE.Vector3(0, 0, -1).addScaledVector(this.up, this.up.z).normalize()
    const east = new THREE.Vector3().crossVectors(north, this.up).normalize()
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
        uDeck: { value: maps.deck }, uDeckWide: { value: maps.deckWide }, uCloud: { value: maps.cloud }, uCloudWide: { value: maps.cloudWide }, uHeight: { value: maps.height }, uGlow: { value: maps.glow },
        uCentre: { value: this.centre }, uCam: { value: new THREE.Vector3() }, uRadius: { value: radius },
        uHome: { value: new THREE.Vector4(this.up.x, this.up.y, this.up.z, Math.cos(Math.acos(radius / (radius + 1)) - look.sightMargin)) },
        uCanvas: { value: new THREE.Vector4(-look.wide * tx, look.wide * tx, ty, ty - 2 * look.wide * ty) }, uTan: { value: new THREE.Vector2(tx, ty) },
        uDeckSize: { value: size(maps.deck) }, uWideSize: { value: size(maps.deckWide) },
        uSlab: { value: new THREE.Vector3(look.cloudBase, look.cloudThickness, 0) },
        uBandAxis: { value: bandAxis }, uStream: { value: new THREE.Vector3(0, look.streamShear, 0) },
        uStorm: { value: new THREE.Vector4(storm.x, storm.y, storm.z, look.stormRadius / radius) }, uStormAngle: { value: 0 },
        uNorth: { value: north }, uEast: { value: east }, uGlowMap: { value: new THREE.Vector3(THREE.MathUtils.degToRad(look.glowAzimuthDeg), look.glowTop, 0) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uBloomWide: { value: maps.bloom }, uBloomPre: { value: new THREE.Vector3(0, look.bloomPre[1], look.bloomPre[0]) },
        uFineMap: { value: maps.fine }, uFine: { value: new THREE.Vector2(look.fine[0], look.fine[1]) }, uDiag: diagUniform,
        uLay: { value: new THREE.Vector4(0, Math.cos(THREE.MathUtils.degToRad(look.lay.nearDeg[1]!)), Math.cos(THREE.MathUtils.degToRad(look.lay.nearDeg[0]!)), look.lay.edge[0]!) },
        uLayFit: { value: new THREE.Vector4(look.lay.graze[0], look.lay.graze[1], look.lay.texels[0], look.lay.texels[1]) }, uLayGlow: { value: 0 }, uLaySky: { value: 0 }, uLayLimb: { value: new THREE.Vector3(look.lay.limb[0], look.lay.limb[1], Math.cos(Math.acos(radius / (radius + 1)) - look.sightMargin)) }, uLayRef: { value: new THREE.Vector3(0, 1, 0) }, uLayCore: { value: look.lay.coreEdge }, uLayGround: { value: 1 }, uLayDeck: { value: 0 }, uLayBox: { value: new THREE.Vector3().fromArray(look.lay.cloudBox) }, uLayAgree: { value: new THREE.Vector2().fromArray(look.lay.cloudAgree) }, uLaySpot: { value: new THREE.Matrix3() }, uLayTone: { value: new THREE.Vector4(0, 0, 1, 0) }, uLayToneMap: { value: maps.tone ?? maps.glow }, uLayGrade: { value: new THREE.Vector4(1, 1, 1, 1) }, uLaySat: { value: 1 }, uLayCloud: { value: new THREE.Vector4(look.lay.cloudEdge, look.lay.edgeRange, Math.cos(THREE.MathUtils.degToRad(look.lay.cloudDeg[0]!)), Math.cos(THREE.MathUtils.degToRad(look.lay.cloudDeg[1]!))) },
      },
    })
    ownTrig(this.material)
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * (1 + look.glowTop), laid ? 256 : 96, laid ? 128 : 64), this.material)
    this.mesh.frustumCulled = false
    if (laid) {
      this.mesh.scale.setScalar(1 / radius)
      this.mesh.renderOrder = 4
    } else {
      this.mesh.position.copy(this.centre)
    }
  }

  lay(camera: THREE.Vector3, turn: THREE.Quaternion, amount: number, deck: number, ground: number, glow: number, sky: number, ref: THREE.Vector3, grade: { tint: number[]; gain: number; saturation: number }, near: number, edge: number): THREE.Vector3 {
    this.mesh.quaternion.copy(turn)
    ;(this.material.uniforms.uLay!.value as THREE.Vector4).x = amount
    this.material.uniforms.uLayDeck!.value = deck
    this.material.uniforms.uLayGround!.value = ground
    ;(this.material.uniforms.uLay!.value as THREE.Vector4).w = edge
    this.material.uniforms.uLayGlow!.value = glow
    this.material.uniforms.uLaySky!.value = sky
    ;(this.material.uniforms.uLayRef!.value as THREE.Vector3).copy(ref).multiplyScalar(fit.radius)
    const under = 1 - look.lay.limbRim
    ;(this.material.uniforms.uHome!.value as THREE.Vector4).w = Math.cos(Math.asin(under) - Math.asin((under * fit.radius) / (fit.radius + 1)))
    ;(this.material.uniforms.uLayGrade!.value as THREE.Vector4).set(grade.tint[0]! * grade.gain, grade.tint[1]! * grade.gain, grade.tint[2]! * grade.gain, near)
    this.material.uniforms.uLaySat!.value = grade.saturation
    return this.seat.copy(camera).applyQuaternion(this.back.copy(turn).invert()).multiplyScalar(fit.radius).add(this.centre)
  }

  toned(east: THREE.Vector3, north: THREE.Vector3, out: THREE.Vector3, offset: THREE.Vector2, scale: number, amount: number): void {
    ;(this.material.uniforms.uLaySpot!.value as THREE.Matrix3).set(east.x, north.x, out.x, east.y, north.y, out.y, east.z, north.z, out.z)
    ;(this.material.uniforms.uLayTone!.value as THREE.Vector4).set(offset.x, offset.y, scale, amount)
  }

  update(camera: THREE.Vector3, elapsed: number, gain: number, vignette: number, aspect: number, bloom: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uStream!.value as THREE.Vector3).x = (look.streamPerSecond * elapsed) / fit.radius
    u.uStormAngle!.value = THREE.MathUtils.degToRad(look.stormDegPerSecond) * elapsed
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    const pre = u.uBloomPre!.value as THREE.Vector3
    pre.x = bloom * pre.z
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
