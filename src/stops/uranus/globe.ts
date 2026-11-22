import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export const SPHERE_VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vRing;
uniform mat4 uToRing;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
flat out vec3 vCamL;
void main() {
  vLocal = position;
  vRing = (uToRing * vec4(position, 1.0)).xyz;
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

export const PATCH_COUNT = 4

const PATCH_SAMPLERS = Array.from({ length: PATCH_COUNT }, (_, i) => 'uniform sampler2D uPatch' + i + ';').join('\n')

const PATCH_LEVELS = Array.from({ length: PATCH_COUNT }, (_, i) => `    {
      vec2 q = g * uPatchScale[${i}];
      float w = smoothstep(0.5, 0.5 - uFeather, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(uPatchFade.x, uPatchFade.y, parent * lean));
      for (int j = 0; j < (w > 0.0 ? 1 : 0); j++) enc = mix(enc, textureGrad(uPatch${i}, q + 0.5, gx * uPatchScale[${i}], gy * uPatchScale[${i}]).rgb, w);
      parent = gd * uPatchScale[${i}] * uPatchSize[${i}];
      texels = mix(texels, parent, step(0.5, w));
    }`).join('\n')

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
${PATCH_SAMPLERS}
uniform float uPatchScale[${PATCH_COUNT}];
uniform float uPatchSize[${PATCH_COUNT}];
uniform float uFeather;
uniform vec2 uPatchFade;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform sampler2D uCloud;
uniform sampler2D uShade;
uniform float uMapWidth;
uniform float uGrad;
uniform float uSpin;
uniform float uTime;
uniform float uGain;
uniform float uWeight;
uniform vec3 uNear;
uniform float uSoft;
uniform vec2 uSharp;
uniform float uWrapSoft;
uniform float uShadeMix;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uSunW;
uniform vec3 uCloudWhite;
uniform vec3 uShadowTint;
uniform vec4 uBandRate;
uniform vec4 uCloudRate;
uniform float uCloudFine;
uniform sampler2D uRingProfile;
uniform vec3 uRingShade;
uniform vec3 uRingN;
uniform vec3 uRingSun;
in vec3 vClip;
in vec3 vLocal;
in vec3 vRing;
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
  float texels = diagTexelsDir(d, uMapWidth);
  vec3 ax = dFdx(d);
  vec3 ay = dFdy(d);
  float aa = dot(ax, ax) + dot(ay, ay);
  float ad = length(cross(ax, ay));
  float lean = max(2.0 * ad / max(aa + sqrt(max(aa * aa - 4.0 * ad * ad, 0.0)), 1e-20), 1.0 / 16.0);
  float close = 1.0 - smoothstep(uPatchFade.x, uPatchFade.y, texels * lean);
  float grad = max(uGrad, close * uWrapSoft / max(texels * lean, 1e-3));
  vec3 enc = equirectGrad(uMap, d, grad).rgb;
  enc = max(enc + (1.0 - close) * (uSharp.x + uSharp.y * (1.0 - mu)) * (enc - equirectGrad(uMap, d, grad * 4.0).rgb), vec3(0.0));
  vec3 wide = inverseFilmic(enc);
  float dn = dot(d, uSpotN);
  vec2 g = vec2(dot(d, uSpotE), dot(d, uSpotU)) / max(dn, 0.05);
  vec2 gx = dFdx(g);
  vec2 gy = dFdy(g);
  float gd = sqrt(max(dot(gx, gx), dot(gy, gy)));
  gx *= uGrad;
  gy *= uGrad;
  float parent = texels;
  for (int k = 0; k < (dn > 0.3 && texels < uPatchFade.y ? 1 : 0); k++) {
${PATCH_LEVELS}
  }
  vec3 albedo = inverseFilmic(enc);
  vec2 cloud = equirectGrad(uCloud, dc, uGrad).rg;
  cloud.r = clamp(cloud.r * (1.0 + uCloudFine * (dot(albedo, vec3(1.0)) / max(dot(wide, vec3(1.0)), 1e-3) - 1.0)), 0.0, 1.0);
  vec3 light = lightAt(ndl, mu);
  for (int k = 0; k < (uSoft > 0.0 ? 1 : 0); k++) {
    light = vec3(0.0);
    for (int i = 0; i < 9; i++) light += lightAt(ndl + uSoft * (float(i) / 4.0 - 1.0), mu);
    light /= 9.0;
  }
  light *= mix(vec3(1.0), shadeAt(d0), uShadeMix);
  vec3 col = albedo * light * max(vec3(1.0) - cloud.g * uShadowTint, vec3(0.04));
  float lit = smoothstep(-0.02, 0.32, ndl);
  col = mix(col, uCloudWhite * (0.02 + 0.98 * lit), cloud.r);
  float sn = dot(uRingSun, uRingN);
  float along = -dot(vRing, uRingN) / (abs(sn) > 1e-4 ? sn : 1e-4);
  float ru = (length(vRing + along * uRingSun) - uRingShade.y) / (uRingShade.z - uRingShade.y);
  vec2 rg = vec2(dFdx(ru), dFdy(ru));
  for (int k = 0; k < (uRingShade.x > 0.0 && along > 0.0 && ru > 0.0 && ru < 1.0 ? 1 : 0); k++) col *= 1.0 - uRingShade.x * lit * textureGrad(uRingProfile, vec2(ru, 0.5), vec2(rg.x, 0.0), vec2(rg.y, 0.0)).r;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uNear * uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.15, 0.45, 0.9), vec2(bandTurn, cloudTurn) * 4.0, length(vView));
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
  cloudFine: number
  sharp: [number, number]
  wrapSoft: number
  patches: { textures: THREE.Texture[]; widthsDeg: number[]; spot: THREE.Vector3; feather: number; fade: [number, number] }
}

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: GlobeOptions) {
    const p = o.patches
    if (p.textures.length !== PATCH_COUNT) throw new Error('patch levels: ' + p.textures.length)
    const spot = p.spot.clone().normalize()
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SPHERE_VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uCloud: { value: o.cloud }, uLight: { value: o.light }, uShade: { value: o.shade }, uLightSize: { value: new THREE.Vector2().fromArray(o.lightSize) },
        uMapWidth: { value: (o.map.image as unknown as { width: number }).width },
        ...Object.fromEntries(p.textures.map((t, i) => ['uPatch' + i, { value: t }])),
        uPatchScale: { value: p.widthsDeg.map((w) => 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2))) },
        uPatchSize: { value: p.textures.map((t) => (t.image as unknown as { width: number }).width) },
        uFeather: { value: p.feather }, uPatchFade: { value: new THREE.Vector2().fromArray(p.fade) },
        uSpotN: { value: spot }, uSpotE: { value: east }, uSpotU: { value: north },
        uSpin: { value: 0 }, uTime: { value: 0 }, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uNear: { value: new THREE.Vector3(1, 1, 1) }, uSoft: { value: 0 }, uSharp: { value: new THREE.Vector2(o.sharp[0], o.sharp[1]) }, uWrapSoft: { value: o.wrapSoft }, uToRing: { value: new THREE.Matrix4() }, uRingProfile: { value: null }, uRingShade: { value: new THREE.Vector3(0, 1, 2) }, uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingSun: { value: new THREE.Vector3(0, 1, 0) }, uShadeMix: { value: 1 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) },
        uCloudWhite: { value: new THREE.Vector3(o.cloudWhite, o.cloudWhite, o.cloudWhite) },
        uShadowTint: { value: new THREE.Vector3().fromArray(o.shadowTint) },
        uBandRate: { value: new THREE.Vector4().fromArray(o.bandRate) },
        uCloudRate: { value: new THREE.Vector4().fromArray(o.cloudRate) },
        uCloudFine: { value: o.cloudFine },
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

  soften(width: number, shade: number): void {
    this.material.uniforms.uSoft!.value = width
    this.material.uniforms.uShadeMix!.value = shade
  }

  ringShade(profile: THREE.Texture, range: [number, number], normal: THREE.Vector3): void {
    const u = this.material.uniforms
    u.uRingProfile!.value = profile
    ;(u.uRingShade!.value as THREE.Vector3).set(0, range[0], range[1])
    ;(u.uRingN!.value as THREE.Vector3).copy(normal)
  }

  shadeRings(strength: number, ring: THREE.Object3D, sunLocal: THREE.Vector3): void {
    const u = this.material.uniforms
    ;(u.uRingShade!.value as THREE.Vector3).x = strength
    this.mesh.updateWorldMatrix(true, false)
    ;(u.uToRing!.value as THREE.Matrix4).copy(ring.matrixWorld).invert().multiply(this.mesh.matrixWorld)
    ;(u.uRingSun!.value as THREE.Vector3).copy(sunLocal)
  }

  near(tint: [number, number, number], amount: number): void {
    ;(this.material.uniforms.uNear!.value as THREE.Vector3).set(1 + (tint[0] - 1) * amount, 1 + (tint[1] - 1) * amount, 1 + (tint[2] - 1) * amount)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
