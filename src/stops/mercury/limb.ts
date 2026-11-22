import * as THREE from 'three'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

const VERT = /* glsl */ `
uniform vec3 uCentre;
uniform vec3 uAhead;
uniform vec3 uSide;
out vec3 vRay;
out vec2 vNdc;
out vec3 vDown;
out vec3 vAhead;
out vec3 vSide;
void main() {
  vDown = (modelMatrix * vec4(uCentre, 1.0)).xyz - cameraPosition;
  vAhead = mat3(modelMatrix) * uAhead;
  vSide = mat3(modelMatrix) * uSide;
  vRay = transpose(mat3(viewMatrix)) * vec3((position.x + projectionMatrix[2][0]) / projectionMatrix[0][0], (position.y + projectionMatrix[2][1]) / projectionMatrix[1][1], -1.0);
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec4 uSpan;
uniform float uRadius;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vRay;
in vec2 vNdc;
in vec3 vDown;
in vec3 vAhead;
in vec3 vSide;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 ray = normalize(vRay);
  float far = length(vDown);
  vec3 down = vDown / far;
  float c = dot(ray, down);
  float el = acos(clamp(c, -1.0, 1.0)) - asin(clamp(uRadius / far, 0.0, 1.0));
  vec3 level = ray - down * c;
  vec2 uv = vec2((atan(dot(level, vSide), dot(level, vAhead)) - uSpan.x) / (uSpan.y - uSpan.x), (el - uSpan.z) / (uSpan.w - uSpan.z));
  if (uv.y >= 1.0 || uv.x <= 0.0 || uv.x >= 1.0) discard;
  vec3 t = textureLod(uMap, vec2(uv.x, max(uv.y, 0.0)), 0.0).rgb;
  vec2 q = vNdc * 0.5 * vec2(uAspect, 1.0);
  float k = uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(inverseFilmic(t) * k, 0.0);
}`

export class Limb {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, centre: THREE.Vector3, radius: number, ahead: THREE.Vector3, side: THREE.Vector3, az: [number, number], el: [number, number], diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uMap: { value: map }, uCentre: { value: centre }, uAhead: { value: ahead }, uSide: { value: side }, uSpan: { value: new THREE.Vector4(az[0], az[1], el[0], el[1]) }, uRadius: { value: radius }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diag },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -5
  }

  update(gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
