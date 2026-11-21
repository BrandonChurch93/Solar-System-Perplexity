import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'

export interface IoOptions {
  map: THREE.Texture
  mapWidth: number
  radius: number
  sun: [number, number, number]
  ambient: [number, number, number]
  bounce: [number, number, number]
  wrap: number
  power: number
  rim: number
  feather: number
  blur: number
}

const VERT = /* glsl */ `
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uMapWidth;
uniform float uGrad;
uniform float uGain;
uniform vec3 uSunW;
uniform vec3 uPlanetW;
uniform vec3 uSun;
uniform vec3 uAmbient;
uniform vec3 uBounce;
uniform vec3 uShape;
uniform float uEclipse;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uBall;
uniform vec4 uPlanet;
uniform mat3 uToLocal;
uniform vec2 uFeather;
in vec3 vPos;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 ray = normalize(vPos);
  float along = dot(uBall.xyz, ray);
  vec3 nearest = ray * along - uBall.xyz;
  float rt = length(nearest);
  float px = max(fwidth(rt), 1e-7);
  float alpha = 1.0 - smoothstep(-uFeather.x, uFeather.x, (rt - uBall.w) / px);
  float depth = along - sqrt(max(uBall.w * uBall.w - rt * rt, 0.0));
  vec3 n = normalize(ray * depth - uBall.xyz);
  float toPlanet = dot(uPlanet.xyz, ray);
  float pm = sqrt(max(dot(uPlanet.xyz, uPlanet.xyz) - toPlanet * toPlanet, 0.0));
  float front = toPlanet - sqrt(max(uPlanet.w * uPlanet.w - pm * pm, 0.0));
  alpha *= front < depth ? smoothstep(-uFeather.x, uFeather.x, (pm - uPlanet.w) / max(fwidth(pm), 1e-7)) : 1.0;
  if (uDiag >= 2 && alpha < 0.5) discard;
  vec3 d = uToLocal * n;
  float mu = clamp(dot(n, -ray), 0.0, 1.0);
  float ndl = dot(n, uSunW);
  float lit = pow(clamp((ndl + uShape.x) / (1.0 + uShape.x), 0.0, 1.0), uShape.y) * mix(1.0, pow(mu, 0.5), uShape.z);
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  float foot = min(px / uBall.w, uFeather.y) / PI * uGrad;
  vec3 albedo = inverseFilmic(textureGrad(uMap, vec2(u, v), vec2(foot * 0.5, 0.0), vec2(0.0, foot)).rgb);
  vec3 shade = uSun * lit * (1.0 - uEclipse) + uAmbient + uBounce * max(dot(n, uPlanetW), 0.0);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 col = albedo * shade * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, alpha), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.95, 0.85, 0.2), vec2(0.0), length(vView));
}`

export class Io {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly toLocal = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()

  constructor(o: IoOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uMapWidth: { value: o.mapWidth }, uGain: { value: 1 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) }, uPlanetW: { value: new THREE.Vector3(0, 0, -1) },
        uSun: { value: new THREE.Vector3().fromArray(o.sun) }, uAmbient: { value: new THREE.Vector3().fromArray(o.ambient) }, uBounce: { value: new THREE.Vector3().fromArray(o.bounce) },
        uShape: { value: new THREE.Vector3(o.wrap, o.power, o.rim) }, uEclipse: { value: 0 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uBall: { value: new THREE.Vector4(0, 0, -1, o.radius) }, uPlanet: { value: new THREE.Vector4(0, 0, -1, 1) }, uToLocal: { value: this.toLocal }, uFeather: { value: new THREE.Vector2(o.feather, o.blur) },
        uDiag: diagUniform, uGrad: gradUniform,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius * 1.12, 48, 24), this.material)
    this.mesh.renderOrder = 6
  }

  update(sun: THREE.Vector3, planet: THREE.Vector3, eclipse: number, gain: number, vignette: number, aspect: number, centre: THREE.Vector3, body: THREE.Vector3): void {
    const u = this.material.uniforms
    const ball = u.uBall!.value as THREE.Vector4
    ball.set(centre.x, centre.y, centre.z, ball.w)
    ;(u.uPlanet!.value as THREE.Vector4).set(body.x, body.y, body.z, 1)
    this.mesh.updateWorldMatrix(true, false)
    this.toLocal.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld)).transpose()
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    ;(u.uPlanetW!.value as THREE.Vector3).copy(planet)
    u.uEclipse!.value = eclipse
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
