import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import azimuth from './azimuth.json'
import { RING_LAYOUT_GLSL, RING_PROFILE_GLSL } from './profile'
import ringsJson from './rings.json'

export interface RingLook {
  shadowFloor: [number, number, number]
  floorAlpha: number
  penumbra: [number, number, number]
  unlit: number
  lodBias: number
  lodBiasClose: number
  spokes: number
  clumps: number
  grain: number
  sparkle: number
  sparkleTint: [number, number, number]
  sparkleCell: number
  closeTone: [number, number, number]
  heroTone: [number, number, number]
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const HASH_GLSL = /* glsl */ `
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float hash2(ivec2 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y))) >> 8) * (1.0 / 16777216.0);
}
float hash3(ivec3 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y) + pcg(uint(p.z)))) >> 8) * (1.0 / 16777216.0);
}
int wrapI(int a, int n) {
  return ((a % n) + n) % n;
}
float vnoise(vec2 p, int period) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  ivec2 a = ivec2(i);
  int x0 = wrapI(a.x, period);
  int x1 = wrapI(a.x + 1, period);
  return mix(mix(hash2(ivec2(x0, a.y)), hash2(ivec2(x1, a.y)), f.x), mix(hash2(ivec2(x0, a.y + 1)), hash2(ivec2(x1, a.y + 1)), f.x), f.y);
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
uniform vec3 uCamL;
uniform vec3 uSunL;
uniform vec3 uShadowL;
uniform float uFloorA;
uniform vec2 uEdge;
uniform float uPolar;
uniform float uGain;
uniform float uWeight;
uniform float uTime;
uniform float uSpinRate;
uniform float uGrad;
uniform vec2 uLodBias;
uniform vec3 uShadowFloor;
uniform vec3 uPenumbra;
uniform float uAzGain[25];
uniform float uAzRadii[5];
uniform float uUnlit;
uniform vec4 uAzimuth;
uniform vec3 uSparkleTint;
uniform float uSparkleCell;
uniform vec3 uCloseTone;
uniform vec3 uHeroTone;
uniform float uVignette;
uniform float uAspect;
uniform float uPass;
out vec4 outColor;
${DIAG_GLSL}
${RING_PROFILE_GLSL}
${RING_LAYOUT_GLSL}
${HASH_GLSL}
${INVERSE_FILMIC_GLSL}
float azRow(int i, vec4 h) {
  return uAzGain[i * 5] + uAzGain[i * 5 + 1] * h.x + uAzGain[i * 5 + 2] * h.y + uAzGain[i * 5 + 3] * h.z + uAzGain[i * 5 + 4] * h.w;
}
float azGain(float r, float phi) {
  int i = 0;
  for (int k = 1; k < 4; k++) if (r >= uAzRadii[k]) i = k;
  float t = clamp((r - uAzRadii[i]) / (uAzRadii[i + 1] - uAzRadii[i]), 0.0, 1.0);
  vec4 h = vec4(cos(phi), sin(phi), cos(2.0 * phi), sin(2.0 * phi));
  return clamp(mix(azRow(i, h), azRow(i + 1, h), t), 0.4, 1.7);
}
float rowNoise(float tu, int row, float cellA, float cellR) {
  int per = max(int(floor(6.283185307 * (float(row) + 0.5) * cellR / cellA)), 1);
  float p = tu * float(per);
  float i = floor(p);
  float f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  int x0 = wrapI(int(i), per);
  return mix(hash2(ivec2(x0, row)), hash2(ivec2(wrapI(x0 + 1, per), row)), f);
}
float grain(float tu, float r, float cellA, float cellR) {
  float y = r / cellR - 0.5;
  float i = floor(y);
  float f = y - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(rowNoise(tu, int(i), cellA, cellR), rowNoise(tu, int(i) + 1, cellA, cellR), f);
}
void main() {
  float r = length(vLocal.xz);
  vec3 lay = ringLayout(vLocal, r);
  bool disc = r < 1.0;
  float rp = disc ? max(lay.x, mix(r, uEdge.x + 0.006, lay.z)) : lay.x;
  float x = ringRadius(rp);
  if (x <= 0.0 || x >= 1.0) discard;
  vec3 toCam = uCamL - vLocal;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float nearest = dot(uCamL, V);
  if (uPass < 0.5 ? (dist < nearest || disc) : (dist >= nearest && !disc)) discard;
  float fr = length(vec2(dFdx(rp), dFdy(rp)));
  float texels = ringTexels(fr);
  vec4 s = profAt(x, texels * uGrad * mix(uLodBias.x, uLodBias.y, uClose));
  float mu = abs(V.y);
  float body = smoothstep(uEdge.x - 0.004, uEdge.x + 0.004, rp) * (1.0 - smoothstep(uEdge.y - 0.002, uEdge.y + 0.002, rp));
  float alpha = 1.0 - pow(1.0 - min(max(s.a, uFloorA * body), 0.999), clamp(mix(0.43, 0.25, uClose) / max(mu, 0.02), 1.0, 8.0));
  vec3 col = inverseFilmic(s.rgb) * mix(uHeroTone * azGain(r, atan(vLocal.z, vLocal.x)), uCloseTone, uClose);

  float kepler = uSpinRate * pow(max(rp, 1.0) / 1.86, -1.5);
  float th = atan(vLocal.z, vLocal.x) + kepler * uTime;
  float tu = th / 6.283185307;
  float inB = smoothstep(1.5, 1.6, rp) * (1.0 - smoothstep(1.88, 1.95, rp));
  float n1 = vnoise(vec2(tu * 36.0, r * 3.0), 36);
  float n2 = vnoise(vec2(tu * 640.0, r * 70.0), 640);
  float mottle = 1.0 - uAzimuth.x * inB * smoothstep(0.55, 0.9, n1) + uAzimuth.y * (n2 - 0.5);
  vec2 q = vec2(tu * 6.283185307 * r, r);
  vec2 qx = dFdx(q);
  vec2 qy = dFdy(q);
  float major = max(length(qx), length(qy));
  mottle += uAzimuth.z * (grain(tu, r, 0.004, 0.0007) - 0.5) * (1.0 - smoothstep(0.25, 0.9, major / 0.0007)) * smoothstep(0.02, 0.1, s.a);
  col *= mottle;

  float cell = uSparkleCell;
  float det = qx.x * qy.y - qx.y * qy.x;
  float show = 1.0 - smoothstep(0.12, 0.3, major / cell);
  for (int k = 0; k < ((uAzimuth.w > 0.0 && show > 0.0 && abs(det) > 1e-16) ? 1 : 0); k++) {
    int row = int(floor(r / cell));
    int per = max(int(floor(6.283185307 * (float(row) + 0.5))), 1);
    float cx = tu * float(per);
    ivec3 id = ivec3(wrapI(int(floor(cx)), per), row, 7);
    float pick = hash3(id);
    for (int m = 0; m < (pick < 0.2 ? 1 : 0); m++) {
      vec2 centre = 0.25 + 0.5 * vec2(hash3(id + ivec3(0, 0, 4)), hash3(id + ivec3(0, 0, 6)));
      vec2 dq = (vec2(fract(cx), fract(r / cell)) - centre) * cell;
      vec2 px = vec2(qy.y * dq.x - qy.x * dq.y, -qx.y * dq.x + qx.x * dq.y) / det;
      float size = 0.55 + 0.6 * hash3(id + ivec3(0, 0, 10));
      float tw = 0.5 + 0.5 * sin(6.283185307 * hash3(id + ivec3(0, 0, 12)) + uTime * (2.0 + 5.0 * hash3(id + ivec3(0, 0, 16))));
      float glint = exp(-dot(px, px) / (size * size)) * pow(tw, 3.0) * (0.3 + 1.7 * pick / 0.2);
      vec3 tint = mix(vec3(1.0), uSparkleTint, hash3(id + ivec3(0, 0, 22)));
      col += tint * glint * uAzimuth.w * show * smoothstep(0.03, 0.2, dot(col, vec3(0.2126, 0.7152, 0.0722)));
    }
  }

  vec3 ss = normalize(vec3(uShadowL.x, uShadowL.y / uPolar, uShadowL.z));
  float along = dot(vLocal, ss);
  float miss = length(vLocal - ss * along);
  float mw = 0.75 * length(vec2(dFdx(miss), dFdy(miss)));
  float lit = along > 0.0 ? 1.0 : smoothstep(uPenumbra.x - mw, uPenumbra.y + mw + uPenumbra.z * max(-along, 0.0), miss);
  col = mix(uShadowFloor * (0.6 + 0.9 * smoothstep(0.0, 0.6, dot(col, vec3(0.2126, 0.7152, 0.0722)))) * body, col, mix(lit, 1.0, lay.z)) * lay.y;
  if (uSunL.y * uCamL.y < 0.0) col *= uUnlit * (0.25 + 3.0 * s.a * (1.0 - s.a)) / max(s.a, 0.05);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  if (uDiag >= 2 && alpha < 0.5) discard;
  outColor = diagOut(vec4(col, alpha * uWeight), texels, 1.0, vec3(0.95, 0.7, 0.2), vec2(kepler * 8.0, 0.0), length(vView));
}`

export class Rings {
  readonly group = new THREE.Group()
  readonly materials: THREE.ShaderMaterial[] = []
  private readonly geometry: THREE.BufferGeometry

  constructor(profile: Record<string, THREE.IUniform>, layout: Record<string, THREE.IUniform>, look: RingLook, polar: number) {
    const [r0, r1] = ringsJson.span as [number, number]
    const seg = 720
    const bands = 6
    const pos = new Float32Array((seg + 1) * (bands + 1) * 3)
    const index: number[] = []
    const inner = Math.min(r0 - 0.01, 0.01)
    const outer = (r1 + 0.01) / Math.cos(Math.PI / seg)
    for (let j = 0; j <= bands; j++) {
      const r = inner + ((outer - inner) * j) / bands
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2
        pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], (j * (seg + 1) + i) * 3)
      }
    }
    for (let j = 0; j < bands; j++) for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + seg + 1
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.geometry.setIndex(index)
    const shared = {
      ...profile,
      ...layout,
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uShadowL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uFloorA: { value: look.floorAlpha }, uEdge: { value: new THREE.Vector2(ringsJson.inner, ringsJson.outer) },
      uGain: { value: 1 }, uWeight: { value: 1 }, uTime: { value: 0 }, uSpinRate: { value: 0 },
      uGrad: gradUniform, uDiag: diagUniform, uLodBias: { value: new THREE.Vector2(look.lodBias, look.lodBiasClose) },
      uShadowFloor: { value: new THREE.Vector3().fromArray(look.shadowFloor) }, uPenumbra: { value: new THREE.Vector3().fromArray(look.penumbra) }, uAzGain: { value: azimuth.coeffs.flat() }, uAzRadii: { value: azimuth.radii },
      uUnlit: { value: look.unlit }, uAzimuth: { value: new THREE.Vector4(look.spokes, look.clumps, look.grain, look.sparkle) },
      uSparkleTint: { value: new THREE.Vector3().fromArray(look.sparkleTint) }, uSparkleCell: { value: look.sparkleCell },
      uCloseTone: { value: new THREE.Vector3().fromArray(look.closeTone) }, uHeroTone: { value: new THREE.Vector3().fromArray(look.heroTone) },
      uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
    }
    for (const pass of [0, 1]) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { ...shared, uPass: { value: pass } },
        side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: pass === 0, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      })
      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.frustumCulled = false
      mesh.renderOrder = pass === 0 ? 2 : 6
      this.materials.push(material)
      this.group.add(mesh)
    }
  }

  get uniforms(): Record<string, THREE.IUniform> {
    return this.materials[0]!.uniforms
  }

  dispose(): void {
    this.geometry.dispose()
    for (const m of this.materials) m.dispose()
  }
}
