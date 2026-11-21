import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface FlareLook {
  sun: [number, number]
  reach: [number, number]
  blur: number
  distance: number
}

const VERT = /* glsl */ `
out vec2 vUv;
out vec3 vClip;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSky;
uniform vec2 uSun;
uniform vec2 uReach;
uniform vec2 uStep;
uniform float uShape;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec2 vUv;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  float w = 1.0 - smoothstep(uReach.x, uReach.y, length((vUv - uSun) * vec2(uShape, 1.0)));
  vec3 col = vec3(0.0);
  for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) {
    vec3 ring = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982;
      ring += textureLod(uSky, vUv + vec2(cos(a), sin(a)) * uStep, 0.0).rgb;
    }
    col = inverseFilmic(min(textureLod(uSky, vUv, 0.0).rgb, ring * 0.14)) * w;
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

export class Flare {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly level: number

  constructor(sky: THREE.Texture, tan: [number, number], gain: number, look: FlareLook) {
    const image = sky.image as { width: number; height: number }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSky: { value: sky }, uSun: { value: new THREE.Vector2().fromArray(look.sun) }, uReach: { value: new THREE.Vector2().fromArray(look.reach) }, uStep: { value: new THREE.Vector2(look.blur / image.width, look.blur / image.height) },
        uShape: { value: tan[0] / tan[1] }, uGain: { value: 0 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.level = gain
    const geometry = new THREE.PlaneGeometry(2 * tan[0] * look.distance, 2 * tan[1] * look.distance)
    geometry.translate(0, 0, -look.distance)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 4
    this.mesh.visible = false
  }

  update(eye: THREE.Vector3, turn: THREE.Quaternion, gain: number, vignette: number, aspect: number): void {
    this.mesh.visible = gain > 0
    this.mesh.position.copy(eye)
    this.mesh.quaternion.copy(turn)
    const u = this.material.uniforms
    u.uGain!.value = gain * this.level
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
