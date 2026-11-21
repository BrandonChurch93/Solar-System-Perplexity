import * as THREE from 'three'
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
uniform float uBump;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uSunW;
uniform vec3 uSun;
uniform vec3 uAmbient;
uniform vec3 uBounce;
uniform vec3 uBounceW;
uniform mat3 uBodyToWorld;
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
  float e = uStep;
  float hE = heightAt(normalize(d + east * e)) - heightAt(normalize(d - east * e));
  float hN = heightAt(normalize(d + north * e)) - heightAt(normalize(d - north * e));
  vec3 slope = uBodyToWorld * ((east * hE + north * hN) / (2.0 * e));
  vec3 np = normalize(n - slope * uBump);
  float ndl = dot(np, uSunW);
  float soft = smoothstep(-0.08, 0.1, dot(n, uSunW));
  vec3 albedo = inverseFilmic(equirectGrad(uMap, d, uGrad).rgb);
  vec3 col = albedo * (uSun * max(ndl, 0.0) * soft + uAmbient + uBounce * max(dot(n, uBounceW), 0.0));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

export interface MoonOptions {
  map: THREE.Texture
  height: THREE.Texture
  heightWidth: number
  bump: number
  sun: [number, number, number]
  ambient: [number, number, number]
  bounce: [number, number, number]
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
        uStep: { value: (2 * Math.PI) / o.heightWidth }, uBump: { value: o.bump }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uSunW: { value: new THREE.Vector3(1, 0, 0) }, uSun: { value: new THREE.Vector3().fromArray(o.sun) }, uAmbient: { value: new THREE.Vector3().fromArray(o.ambient) },
        uBounce: { value: new THREE.Vector3().fromArray(o.bounce) }, uBounceW: { value: new THREE.Vector3(0, 0, 1) }, uBodyToWorld: { value: this.bodyToWorld },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), this.material)
  }

  update(sun: THREE.Vector3, bounce: THREE.Vector3, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
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
