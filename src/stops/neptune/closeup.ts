import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import fit from './close.json'
import look from './closeup.json'

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
vec3 inSight(vec3 q) {
  float r = length(q);
  vec3 d = q / r;
  float c = dot(d, uHome.xyz);
  vec3 e = d - uHome.xyz * c;
  vec3 rim = uHome.xyz * uHome.w + e / max(length(e), 1e-5) * sqrt(1.0 - uHome.w * uHome.w);
  return mix(d, rim, step(c, uHome.w)) * r;
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
  for (int k = 0; k < (deckHit ? 1 : 0); k++) {
    vec3 q = inSight(oc + rd * tDeck);
    vec2 xy = planeOf(deckSource(q));
    vec2 uc = coreUv(xy);
    float w = coreWeight(uc);
    vec3 deck = mix(textureGrad(uDeckWide, wideUv(xy), wgx, wgy).rgb, textureGrad(uDeck, uc, cgx, cgy).rgb, w);
    float shade = textureGrad(uHeight, wideUv(planeOf(cloudSource(q))), wgx, wgy).g;
    col = deck * shade;
    alpha = 1.0;
    texels = mix(diagTexels(wideUv(xy) * uWideSize), diagTexels(uc * uDeckSize), w);
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
    float tHit = -1.0;
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
      float ct = mix(diagTexels(wideUv(xy) * uWideSize), diagTexels(uc * uDeckSize), w);
      texels = mix(texels, ct, cloud.a);
      counted = max(counted, step(0.5, cloud.a));
      layer = mix(layer, vec3(0.95, 0.95, 0.9), cloud.a);
      depth = mix(depth, tHit, step(0.5, cloud.a));
    }
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col = inverseFilmic(col) * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, alpha), texels, counted, layer, vec2(0.0), depth);
}`

function unproject(px: number, py: number, radius: number, centre: THREE.Vector3): THREE.Vector3 {
  const ty = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
  const d = new THREE.Vector3(((px / look.image[0]) * 2 - 1) * ty * (look.image[0] / look.image[1]), (1 - (py / look.image[1]) * 2) * ty, -1).normalize()
  const b = d.dot(centre)
  const t = b - Math.sqrt(Math.max(b * b - (centre.lengthSq() - radius * radius), 0))
  return d.multiplyScalar(t).sub(centre)
}

export interface CloseMaps { deck: THREE.Texture; deckWide: THREE.Texture; cloud: THREE.Texture; cloudWide: THREE.Texture; height: THREE.Texture; glow: THREE.Texture }

export class Closeup {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly centre: THREE.Vector3
  readonly up: THREE.Vector3

  constructor(maps: CloseMaps) {
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
      side: THREE.BackSide,
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
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * (1 + look.glowTop), 96, 64), this.material)
    this.mesh.position.copy(this.centre)
    this.mesh.frustumCulled = false
  }

  update(camera: THREE.Vector3, elapsed: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    ;(u.uStream!.value as THREE.Vector3).x = (look.streamPerSecond * elapsed) / fit.radius
    u.uStormAngle!.value = THREE.MathUtils.degToRad(look.stormDegPerSecond) * elapsed
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
