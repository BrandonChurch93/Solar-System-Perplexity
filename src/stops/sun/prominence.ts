import * as THREE from 'three'
import { diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface ProminenceLook {
  half: number
  plane: number
  gain: number
  speed: number
  period: number
  surge: number
}

const VERT = /* glsl */ `
out vec2 vUv;
out vec3 vClip;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uFlow;
uniform int uDiag;
uniform float uGrad;
uniform float uGain;
uniform float uShow;
uniform float uTime;
uniform vec3 uMove;
uniform float uVignette;
uniform float uAspect;
in vec2 vUv;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
vec4 strand(vec2 uv, float phase, vec2 dx, vec2 dy) {
  vec3 f = texture(uFlow, uv).rgb;
  vec2 v = (f.xy - 0.5) * 2.0 * uMove.x;
  vec2 p = uv - v * phase * 0.5;
  vec3 f2 = texture(uFlow, p).rgb;
  p -= (f2.xy - 0.5) * 2.0 * uMove.x * phase * 0.5;
  vec4 c = textureGrad(uMap, p, dx, dy);
  return vec4(inverseFilmic(c.rgb), c.a);
}
void main() {
  if (uDiag >= 2) discard;
  vec2 dx = dFdx(vUv) * uGrad;
  vec2 dy = dFdy(vUv) * uGrad;
  float pa = fract(uTime / uMove.y + 0.5) - 0.5;
  float pb = fract(uTime / uMove.y) - 0.5;
  vec4 a = strand(vUv, pa * uMove.y, dx, dy);
  vec4 b = strand(vUv, pb * uMove.y, dx, dy);
  vec4 c = mix(a, b, abs(pa) * 2.0);
  vec4 f = texture(uFlow, vUv);
  float s = f.a * 6.283185307179586;
  float run = 0.55 * (sin(s * 9.0 - uTime * 1.7) - sin(s * 9.0)) + 0.3 * (sin(s * 23.0 - uTime * 3.1) - sin(s * 23.0)) + 0.25 * (sin(s * 14.0 + uTime * 1.1) - sin(s * 14.0));
  c.rgb *= exp2(uMove.z * f.b * run);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  vec3 col = c.rgb * uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, c.a) * uShow;
}`

export class Prominences {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(map: THREE.Texture, flow: THREE.Texture, look: ProminenceLook) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uFlow: { value: flow }, uDiag: diagUniform, uGrad: gradUniform,
        uGain: { value: 1 }, uShow: { value: 1 }, uTime: { value: 0 }, uMove: { value: new THREE.Vector3(look.speed, look.period, look.surge) },
        uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      },
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
    })
    const geometry = new THREE.PlaneGeometry(look.half * 2, look.half * 2)
    geometry.translate(0, 0, look.plane)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 7
  }

  update(time: number, spin: number, gain: number, vignette: number, aspect: number, shown = 1): void {
    const u = this.material.uniforms
    u.uTime!.value = time
    u.uGain!.value = gain
    u.uShow!.value = shown
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.rotation.set(0, spin, 0)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
