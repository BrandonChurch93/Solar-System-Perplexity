import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export const SPHERE_VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
flat out vec3 vCamL;
void main() {
  vLocal = position;
  vCamL = (inverse(modelMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const LIGHT_GLSL = /* glsl */ `
uniform sampler2D uLight;
uniform vec2 uLightSize;
vec3 lightAt(float ndl, float mu) {
  vec2 uv = vec2((clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * (uLightSize.x - 1.0) + 0.5) / uLightSize.x, (clamp(mu, 0.0, 1.0) * (uLightSize.y - 1.0) + 0.5) / uLightSize.y);
  return textureLod(uLight, uv, 0.0).rgb;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uCloud;
uniform sampler2D uShade;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uTime;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uSunW;
uniform vec3 uCloudWhite;
uniform vec3 uShadowTint;
uniform vec4 uBandRate;
uniform vec4 uCloudRate;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
flat in vec3 vCamL;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${LIGHT_GLSL}
vec3 shadeAt(vec3 d) {
  return textureLod(uShade, vec2(atan(d.x, d.z) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5), 0.0).rgb;
}
vec3 spinY(vec3 d, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}
float rate(vec4 k, float lat) {
  return k.x + k.y * sin(k.z * lat + k.w);
}
void main() {
  vec3 d0 = normalize(vLocal);
  float lat = asin(clamp(d0.y, -1.0, 1.0));
  float bandTurn = uTime * rate(uBandRate, lat);
  float cloudTurn = uTime * rate(uCloudRate, lat);
  vec3 d = spinY(d0, uSpin + bandTurn);
  vec3 dc = spinY(d0, uSpin + cloudTurn);
  vec3 n = normalize(vWorldN);
  float mu = clamp(dot(d0, normalize(vCamL - d0)), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  vec2 cloud = equirectGrad(uCloud, dc, uGrad).rg;
  vec3 light = lightAt(ndl, mu) * shadeAt(d0);
  vec3 col = albedo * light * max(vec3(1.0) - cloud.g * uShadowTint, vec3(0.04));
  float lit = smoothstep(-0.02, 0.32, ndl);
  col = mix(col, uCloudWhite * (0.02 + 0.98 * lit), cloud.r);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.15, 0.45, 0.9), vec2(bandTurn, cloudTurn) * 4.0, length(vView));
}`

export interface GlobeOptions {
  map: THREE.Texture
  cloud: THREE.Texture
  light: THREE.Texture
  shade: THREE.Texture
  lightSize: [number, number]
  cloudWhite: number
  shadowTint: [number, number, number]
  bandRate: [number, number, number, number]
  cloudRate: [number, number, number, number]
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: GlobeOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SPHERE_VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uLight: { value: o.light }, uShade: { value: o.shade }, uLightSize: { value: new THREE.Vector2().fromArray(o.lightSize) },
        uMapWidth: { value: (o.map.image as unknown as { width: number }).width },
        uSpin: { value: 0 }, uTime: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uCloudWhite: { value: new THREE.Vector3(o.cloudWhite, o.cloudWhite, o.cloudWhite) },
        uShadowTint: { value: new THREE.Vector3().fromArray(o.shadowTint) },
        uBandRate: { value: new THREE.Vector4().fromArray(o.bandRate) },
        uCloudRate: { value: new THREE.Vector4().fromArray(o.cloudRate) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), this.material)
  }

  update(sun: THREE.Vector3, spin: number, time: number, gain: number, weight: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    u.uSpin!.value = spin
    u.uTime!.value = time
    u.uGain!.value = gain
    u.uWeight!.value = weight
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
