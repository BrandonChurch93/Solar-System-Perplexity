import * as THREE from 'three'
import { AIR_GLSL, airUniforms, type AirParams } from './air'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { EQUIRECT_GLSL } from '../../space/sky'

export const KNOTS = 33
export const MAX_LEVELS = 6

export interface CloudParams {
  height: number
  shadow: number
  shadowSoft: number
  shear: number
  shearBands: number
  relief: number
}

export interface StormParams {
  axis: THREE.Vector3
  radiusDeg: number
}

export interface LimbParams {
  rim: [number, number, number]
  rimWidth: number
  rimFrom: number
  rimTo: number
  rimAim: [number, number, number]
  dark: number
  darkMu: [number, number]
  darkFrom: number
  darkTo: number
  darkAim: [number, number, number]
  forward: [number, number, number]
  forwardWidth: number
  forwardPower: number
}

export interface PatchSet {
  textures: THREE.Texture[]
  widthsDeg: number[]
  spot: THREE.Vector3
  feather: number
  fade: [number, number]
}

export interface NeptuneOptions {
  map: THREE.Texture
  mapWidth: number
  code: number
  deck: number[][]
  cloud: number[][]
  air: AirParams
  limb: LimbParams
  clouds: CloudParams
  storm: StormParams
  patches?: PatchSet
  segments?: number
}

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const SAMPLERS = Array.from({ length: MAX_LEVELS }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const LEVELS = Array.from({ length: MAX_LEVELS }, (_, i) => `    if (uPatchCount > ${i}.5) {
      vec2 q = g * uPatchScale[${i}];
      float w = front * smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent));
      if (w > 0.0) c = mix(c, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]), w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${SAMPLERS}
uniform float uPatchScale[${MAX_LEVELS}];
uniform float uPatchSize[${MAX_LEVELS}];
uniform float uPatchCount;
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform float uMapWidth;
uniform float uGrad;
uniform float uCode;
uniform float uSpin;
uniform float uStream;
uniform vec2 uShear;
uniform vec3 uStormAxis;
uniform float uStormRadius;
uniform float uStormAngle;
uniform float uCloudHeight;
uniform vec3 uShadow;
uniform float uGain;
uniform float uWeight;
uniform vec3 uTint;
uniform vec3 uDeck[${KNOTS}];
uniform vec3 uCloud[${KNOTS}];
uniform float uExtinction;
uniform mat3 uBodyToWorld;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uRim;
uniform vec3 uRimShape;
uniform vec3 uRimDir;
uniform vec3 uLimbDark;
uniform vec2 uDarkEdge;
uniform vec3 uDarkDir;
uniform vec3 uForward;
uniform vec2 uForwardShape;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${DIAG_GLSL}
${AIR_GLSL}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
vec3 turnAbout(vec3 d, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return d * c + cross(axis, d) * s + axis * dot(axis, d) * (1.0 - c);
}
vec3 knot(vec3 k[${KNOTS}], float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * ${KNOTS - 1}.0;
  int i = int(min(floor(x), ${KNOTS - 2}.0));
  return mix(k[i], k[i + 1], x - float(i));
}
float stormTurn(vec3 d) {
  float ang = acos(clamp(dot(d, uStormAxis), -1.0, 1.0)) / uStormRadius;
  return uStormAngle / (1.0 + ang * ang * ang * ang);
}
vec3 deckDir(vec3 p) {
  vec3 d = spinY(p, uSpin);
  return turnAbout(d, uStormAxis, stormTurn(d));
}
vec3 cloudDir(vec3 p) {
  float lat = asin(clamp(p.y, -1.0, 1.0));
  vec3 d = spinY(p, uSpin + uStream * (1.0 + uShear.x * sin(lat * uShear.y)));
  return turnAbout(d, uStormAxis, stormTurn(d));
}
vec4 layerAt(vec3 dd, float soft, out float texels) {
  vec4 c = equirectGrad(uMap, dd, uGrad * soft);
  texels = diagTexelsDir(dd, uMapWidth);
  if (uPatchCount > 0.5) {
    float dn = dot(dd, uSpotN);
    float inv = 1.0 / max(dn, 0.05);
    vec2 g = vec2(dot(dd, uSpotE), dot(dd, uSpotU)) * inv;
    vec2 gx = dFdx(g);
    vec2 gy = dFdy(g);
    float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
    gx *= uGrad * soft;
    gy *= uGrad * soft;
    float front = step(0.3, dn);
    float parent = texels;
${LEVELS}
  }
  return c;
}
void main() {
  vec3 p = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  vec3 dir = normalize(vPos);
  float mu = clamp(dot(n, -dir), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  mat3 toBody = transpose(uBodyToWorld);
  vec3 camL = toBody * uCam;
  vec3 sunL = toBody * uSunW;
  vec3 rd = normalize(p - camL);
  float rc = 1.0 + uCloudHeight;
  float b = dot(camL, rd);
  float disc = b * b - dot(camL, camL) + rc * rc;
  vec3 pc = normalize(camL + rd * (-b - sqrt(max(disc, 0.0))));
  float texels;
  float texelsCloud;
  float texelsShadow;
  vec3 dd = deckDir(p);
  vec3 dcl = cloudDir(pc);
  vec4 deckTexel = layerAt(dd, 1.0, texels);
  float alpha = layerAt(dcl, 1.0, texelsCloud).a;
  float reach = uCloudHeight / max(ndl, uShadow.z);
  vec3 ps = normalize(p + sunL * reach);
  vec3 ps2 = normalize(p + sunL * reach * 1.6);
  float shadow = 0.6 * layerAt(cloudDir(ps), uShadow.y, texelsShadow).a + 0.4 * layerAt(cloudDir(ps2), uShadow.y * 1.8, texelsShadow).a;
  float lit = smoothstep(0.0, 0.2, ndl);
  vec3 albedo = deckTexel.rgb / uCode;
  vec3 deck = albedo * knot(uDeck, ndl) * (1.0 - uShadow.x * shadow * lit * (1.0 - alpha));
  float ndlc = dot(normalize(uBodyToWorld * pc), uSunW);
  vec3 col = mix(deck, knot(uCloud, ndlc), alpha) * uTint;
  float fwd = pow(max(dot(dir, uSunW), 0.0), uForwardShape.y);
  float graze = exp(-mu / uForwardShape.x);
  col *= 1.0 - uLimbDark.x * (1.0 - smoothstep(uLimbDark.y, uLimbDark.z, mu)) * smoothstep(uDarkEdge.x, uDarkEdge.y, dot(n, uDarkDir));
  col += uRim * exp(-mu / uRimShape.x) * smoothstep(uRimShape.y, uRimShape.z, dot(n, uRimDir));
  col += uForward * graze * fwd * smoothstep(-0.25, 0.1, ndl);
  vec4 sky = air(dir, true);
  col = col * exp(-sky.a * uExtinction) + sky.rgb;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float moved = uStream + stormTurn(spinY(p, uSpin)) * 4.0;
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, mix(vec3(0.1, 0.3, 0.9), vec3(0.95, 0.95, 0.9), alpha), vec2(moved * 8.0 * alpha, shadow), length(vView));
}`

function knots(rows: number[][]): THREE.Vector3[] {
  if (rows.length !== KNOTS) throw new Error('light curve needs ' + KNOTS + ' knots')
  return rows.map((r) => new THREE.Vector3(r[0], r[1], r[2]))
}

export class NeptunePlanet {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()

  constructor(o: NeptuneOptions) {
    const p = o.patches
    if ((p?.textures.length ?? 0) > MAX_LEVELS) throw new Error('too many patch levels')
    const levels = Array.from({ length: MAX_LEVELS }, (_, i) => i)
    const tex = (i: number): THREE.Texture | null => p?.textures[i] ?? p?.textures[0] ?? o.map
    const scale = (i: number): number => {
      const w = p?.widthsDeg[i]
      return w ? 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)) : 1
    }
    const size = (i: number): number => (p?.textures[i]?.image as unknown as { width: number } | undefined)?.width ?? 1
    const spot = p?.spot.clone().normalize() ?? new THREE.Vector3(0, 0, 1)
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const l = o.limb
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...airUniforms(o.air),
        uMap: { value: o.map }, uMapWidth: { value: o.mapWidth }, uCode: { value: o.code },
        ...Object.fromEntries(levels.map((i) => ['uPatch' + i, { value: tex(i) }])),
        uPatchScale: { value: levels.map(scale) }, uPatchSize: { value: levels.map(size) },
        uPatchCount: { value: p?.textures.length ?? 0 },
        uFeather: { value: p?.feather ?? 0.12 }, uPatchFade: { value: new THREE.Vector2(p?.fade[0] ?? 1.1, p?.fade[1] ?? 1.7) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uSpin: { value: 0 }, uStream: { value: 0 }, uShear: { value: new THREE.Vector2(o.clouds.shear, o.clouds.shearBands) },
        uStormAxis: { value: o.storm.axis.clone().normalize() }, uStormRadius: { value: THREE.MathUtils.degToRad(o.storm.radiusDeg) }, uStormAngle: { value: 0 },
        uCloudHeight: { value: o.clouds.height }, uShadow: { value: new THREE.Vector3(o.clouds.shadow, o.clouds.shadowSoft, 0.12) },
        uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTint: { value: new THREE.Vector3(1, 1, 1) },
        uDeck: { value: knots(o.deck) }, uCloud: { value: knots(o.cloud) },
        uExtinction: { value: o.air.extinction },
        uRim: { value: new THREE.Vector3().fromArray(l.rim) }, uRimShape: { value: new THREE.Vector3(l.rimWidth, l.rimFrom, l.rimTo) }, uRimDir: { value: new THREE.Vector3(1, 0, 0) },
        uLimbDark: { value: new THREE.Vector3(l.dark, l.darkMu[0], l.darkMu[1]) }, uDarkEdge: { value: new THREE.Vector2(l.darkFrom, l.darkTo) }, uDarkDir: { value: new THREE.Vector3(1, 0, 0) },
        uForward: { value: new THREE.Vector3().fromArray(l.forward) }, uForwardShape: { value: new THREE.Vector2(l.forwardWidth, l.forwardPower) },
        uBodyToWorld: { value: this.bodyToWorld },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const seg = o.segments ?? 320
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  update(spin: number, stream: number, storm: number, gain: number, weight: number): void {
    const u = this.material.uniforms
    u.uSpin!.value = spin
    u.uStream!.value = stream
    u.uStormAngle!.value = storm
    u.uGain!.value = gain
    u.uWeight!.value = weight
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
