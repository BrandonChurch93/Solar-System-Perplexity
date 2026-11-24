import * as THREE from 'three'
import { frameUniform } from '../../core/frame'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { EQUIRECT_GLSL } from '../../space/sky'
import { SPHERE_VERT } from './globe'

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uHeight;
uniform float uMapWidth;
uniform float uGrad;
uniform float uStep;
uniform float uFrame;
uniform float uBump;
uniform float uWrap;
uniform float uSeeliger;
uniform vec2 uKnee;
uniform vec2 uRim;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uSunW;
uniform vec3 uSun;
uniform vec3 uAmbient;
uniform vec3 uBounce;
uniform vec3 uBounceW;
uniform mat3 uBodyToWorld;
uniform mat4 uPlanetInv;
uniform vec2 uAir;
uniform float uShine;
in vec3 vClip;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vPos;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
float heightAt(vec3 d) {
  float u = atan(d.x, d.z) / (2.0 * PI) + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
  return textureLod(uHeight, vec2(u, v), 0.0).r;
}
void main() {
  vec3 d = normalize(vLocal);
  vec3 n = normalize(vWorldN);
  vec3 east = cross(vec3(0.0, 1.0, 0.0), d);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(d, east);
  float e = max(uStep, 1.5 * uFrame * max(length(dFdx(d)), length(dFdy(d))));
  float hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
  float hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  vec3 slope = uBodyToWorld * ((east * hE + north * hN) / (2.0 * e));
  vec3 np = normalize(n - slope * (uBump * min(sqrt(e / uStep), 4.0)));
  float base = dot(n, uSunW);
  float ndl = mix(dot(np, uSunW), base, uWrap);
  float soft = smoothstep(-0.06, 0.12, base);
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  float mu0 = max(ndl, 0.0);
  vec3 v = normalize(cameraPosition - vPos);
  float mu = max(dot(n, v), 0.0);
  float back = 1.0 - max(dot(v, uSunW), 0.0);
  float lit = mix(mu0, mu0 / (mu0 + mu + 0.08), uSeeliger * back) * (1.0 + uRim.x * back * pow(1.0 - mu, uRim.y));
  vec3 col = albedo * (uSun * lit * soft + uAmbient + uBounce * (uShine > 1.0 ? uShine * (0.3 + 0.7 * max(dot(n, uBounceW), 0.0)) : max(dot(n, uBounceW), 0.0)));
  float y = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float over = max(y - uKnee.x, 0.0);
  float knee = uKnee.y - uKnee.x;
  col *= (min(y, uKnee.x) + knee * (1.0 - exp(-over / knee))) / max(y, 1e-5);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 pc = (uPlanetInv * vec4(cameraPosition, 1.0)).xyz;
  vec3 pd = (uPlanetInv * vec4(vPos, 1.0)).xyz - pc;
  float span = length(pd);
  float air = smoothstep(uAir.x, uAir.y, length(pc + pd * clamp(-dot(pc, pd) / (span * span), 0.0, 1.0)));
  col *= pow(vec3(air), vec3(0.8, 1.0, 1.25));
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

export interface MoonOptions {
  map: THREE.Texture
  height: THREE.Texture
  heightWidth: number
  bump: number
  wrap: number
  seeliger: number
  knee: [number, number]
  rim: [number, number]
  sun: [number, number, number]
  ambient: [number, number, number]
  bounce: [number, number, number]
  air: [number, number]
}

export class Moon {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly bodyToWorld = new THREE.Matrix3()
  private readonly m4 = new THREE.Matrix4()

  constructor(o: MoonOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SPHERE_VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uHeight: { value: o.height }, uMapWidth: { value: (o.map.image as unknown as { width: number }).width },
        uStep: { value: (2 * Math.PI) / o.heightWidth }, uBump: { value: o.bump }, uWrap: { value: o.wrap }, uSeeliger: { value: o.seeliger }, uKnee: { value: new THREE.Vector2().fromArray(o.knee) }, uRim: { value: new THREE.Vector2().fromArray(o.rim) }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) }, uSun: { value: new THREE.Vector3().fromArray(o.sun) }, uAmbient: { value: new THREE.Vector3().fromArray(o.ambient) },
        uBounce: { value: new THREE.Vector3().fromArray(o.bounce) }, uBounceW: { value: new THREE.Vector3(0, 0, 1) }, uBodyToWorld: { value: this.bodyToWorld }, uPlanetInv: { value: new THREE.Matrix4() }, uAir: { value: new THREE.Vector2().fromArray(o.air) }, uShine: { value: 1 },
        uDiag: diagUniform, uGrad: gradUniform, uFrame: frameUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), this.material)
  }

  update(sun: THREE.Vector3, bounce: THREE.Vector3, gain: number, vignette: number, aspect: number, planetInverse: THREE.Matrix4, shine = 1): void {
    const u = this.material.uniforms
    u.uShine!.value = shine
    ;(u.uPlanetInv!.value as THREE.Matrix4).copy(planetInverse)
    ;(u.uSunW!.value as THREE.Vector3).copy(sun)
    ;(u.uBounceW!.value as THREE.Vector3).copy(bounce)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.updateWorldMatrix(true, false)
    this.bodyToWorld.setFromMatrix4(this.m4.extractRotation(this.mesh.matrixWorld))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
