import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { STAGE_GLSL } from './stage'
import data from './convect.json'

/**
 * What stands over the ground of the close view: a forest of jets as geometry and the glow of the thin hot layer
 * they stand in. Both are functions of the place and of time; no picture is read.
 *
 * A jet is a narrow blade rooted at a fixed place on the ground. In each of its turns it shoots up, slows and
 * falls back (a throw), with a length, a lean and a width of that turn; between turns its length is nil. The
 * blade turns about its own axis to face the eye. The jets are no lawn: by the place of the root alone (a slow
 * field over the ground) they stand tall here and short there, lean together in groups and leave gaps where none
 * stands, and a few of them are several times as tall as the rest. The glow is worked out for each ray of sight from how far it
 * passes over the ball.
 */

type Shared = Record<string, THREE.IUniform>

const JET_VERT = /* glsl */ `
precision highp float;
in vec4 aRoot;
uniform float uTime;
uniform vec3 uCam;
uniform vec4 uJet;
uniform vec4 uJetMore;
uniform vec4 uJetLife;
uniform vec4 uJetGroup;
out vec3 vJet;
out vec3 vClip;
${STAGE_GLSL}
vec3 jh(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
// a slow field over the ground, 0 to 1
float jn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = jh(vec3(i, 7.1)).x;
  float b = jh(vec3(i + vec2(1.0, 0.0), 7.1)).x;
  float c = jh(vec3(i + vec2(0.0, 1.0), 7.1)).x;
  float d = jh(vec3(i + vec2(1.0, 1.0), 7.1)).x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main() {
  float alpha = aRoot.x / ST_RADIUS;
  vec3 dir = -ST_DOWN * cos(alpha) + sin(alpha) * (ST_RIGHT * cos(aRoot.y) + ST_FWD * sin(aRoot.y));
  vec3 t1 = normalize(cross(dir, vec3(0.31, 0.17, 0.93)));
  vec3 t2 = cross(dir, t1);
  float life = uTime / mix(uJetLife.x, uJetLife.y, aRoot.z) + aRoot.w * 7.0;
  float nth = floor(life);
  float x = life - nth;
  vec3 h = jh(vec3(aRoot.z * 91.7, aRoot.w * 53.3, nth));
  vec3 h2 = jh(vec3(aRoot.w * 17.3, nth, aRoot.z * 61.1));
  float up = 4.0 * x * (1.0 - x);
  // the root's place on the ground (stage units) and the slow fields over it. uJetGroup.x: how many groups lie
  // in a stage unit; y: the share of the ground that holds no jet; z: how much taller than the rest the few tall
  // ones are; w: how far a jet's lean may turn off the lean of its group (in turns)
  vec2 place = aRoot.x * vec2(cos(aRoot.y), sin(aRoot.y)) * uJetGroup.x;
  float group = jn(place + 3.7);
  float stands = smoothstep(uJetGroup.y, uJetGroup.y + 0.12, jn(place * 1.7 + 11.3));
  float len = uJet.x * (0.25 + 0.35 * h.x + uJetGroup.z * pow(h.x, 7.0)) * (0.45 + 1.1 * group) * stands * up * step(h2.x, uJetLife.z);
  float psi = 6.2831853 * (2.0 * jn(place * 0.6 + 21.9) + uJetGroup.w * (h.y - 0.5));
  float lean = uJetMore.x * (0.3 + 0.7 * h2.y) + uJetMore.y * sin(uTime * (0.9 + aRoot.z) + aRoot.w * 40.0);
  vec3 side = t1 * cos(psi) + t2 * sin(psi);
  vec3 axis = normalize(dir + side * lean);
  float a = position.y;
  vec3 c = ST_CENTRE + dir * (ST_RADIUS - uJetMore.z) + axis * (len * a) + side * (uJetMore.w * len * a * a);
  vec3 across = normalize(cross(axis, normalize(uCam - c)));
  float wide = uJet.y * (0.6 + 0.8 * h2.z) * (1.0 - 0.75 * a);
  vec3 foot = ST_CENTRE + dir * ST_RADIUS;
  float graze = dot(normalize(foot - uCam), dir);
  vJet = vec3(position.x, a, (1.0 - 0.5 * x) * (0.5 + 0.5 * h.z) * smoothstep(uJetLife.w - 0.1, uJetLife.w, graze));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c + across * (position.x * wide), 1.0);
  vClip = gl_Position.xyw;
}`

const JET_FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uKeep;
uniform vec3 uJetHot;
uniform vec3 uJetCool;
uniform vec4 uJet;
in vec3 vJet;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  if (uDiag >= 2) discard;
  float across = 1.0 - vJet.x * vJet.x;
  float body = across * across * smoothstep(0.0, 0.12, vJet.y) * (1.0 - smoothstep(0.3, 1.0, vJet.y));
  vec3 shown = mix(uJetHot, uJetCool, smoothstep(0.0, 0.8, vJet.y)) * (body * vJet.z * uJet.z);
  vec3 col = inverseFilmic(min(shown, vec3(0.98))) * uKeep;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

const GLOW_VERT = /* glsl */ `
out vec3 vRay;
out vec2 vScreen;
void main() {
  vec3 rv = vec3(position.x / projectionMatrix[0][0], position.y / projectionMatrix[1][1], -1.0);
  vRay = transpose(mat3(modelViewMatrix)) * rv;
  vScreen = position.xy;
  gl_Position = vec4(position.xy, 0.999999, 1.0);
}`

const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uKeep;
uniform vec3 uCam;
uniform vec4 uGlowLayers;
uniform vec3 uGlowTint;
uniform float uGlowTurn;
in vec3 vRay;
in vec2 vScreen;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${STAGE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vRay);
  vec3 to = ST_CENTRE - uCam;
  float along = dot(to, d);
  float over = sqrt(max(dot(to, to) - along * along, 0.0)) - ST_RADIUS;
  float k = (uGlowLayers.x * exp(-max(over, 0.0) / uGlowLayers.y) + uGlowLayers.z * exp(-max(over, 0.0) / uGlowLayers.w)) * smoothstep(0.0, uGlowTurn, along / length(to)) * smoothstep(-0.2, 0.0, over);
  vec3 col = inverseFilmic(min(uGlowTint * k, vec3(0.98))) * uKeep;
  vec2 vq = vScreen * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
const tint = (c: number[]): THREE.Vector3 => new THREE.Vector3().fromArray(c.map(srgbToLinear))

const added = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
  transparent: true,
  depthWrite: false,
} as const

export class Jets {
  readonly mesh: THREE.Mesh
  readonly glow: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly glowMaterial: THREE.ShaderMaterial
  private readonly keep: THREE.IUniform<number> = { value: 1 }
  private readonly time: THREE.IUniform<number> = { value: 0 }

  /** shared: uCam, uGain, uVignette, uAspect of the ground. */
  constructor(shared: Shared) {
    const j = data.jets
    const g = data.glow
    const common = { uDiag: diagUniform, uCam: shared.uCam!, uGain: shared.uGain!, uVignette: shared.uVignette!, uAspect: shared.uAspect!, uKeep: this.keep }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: JET_VERT,
      fragmentShader: JET_FRAG,
      uniforms: {
        ...common,
        uTime: this.time,
        uJet: { value: new THREE.Vector4(j.length, j.width, j.gain, 0) },
        uJetMore: { value: new THREE.Vector4(j.lean, j.sway, j.root, j.bend) },
        uJetLife: { value: new THREE.Vector4(j.period[0]!, j.period[1]!, j.share, j.graze) },
        uJetGroup: { value: new THREE.Vector4(j.group.scale, j.group.gaps, j.group.tall, j.group.spread) },
        uJetHot: { value: tint(j.hot) },
        uJetCool: { value: tint(j.cool) },
      },
      side: THREE.DoubleSide,
      ...added,
    })
    const segments = j.segments
    const strip = new Float32Array((segments + 1) * 2 * 3)
    const index: number[] = []
    for (let i = 0; i <= segments; i++) {
      strip.set([-1, i / segments, 0, 1, i / segments, 0], i * 6)
      if (i < segments) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    }
    // the roots: evenly over the band of the ground on which a jet can be seen against the sky or the far ground
    let state = j.seed >>> 0
    const next = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 4294967296
    }
    const roots = new Float32Array(j.count * 4)
    for (let i = 0; i < j.count; i++) {
      roots[i * 4] = Math.sqrt(j.band[0]! ** 2 + next() * (j.band[1]! ** 2 - j.band[0]! ** 2))
      roots[i * 4 + 1] = next() * Math.PI * 2
      roots[i * 4 + 2] = next()
      roots[i * 4 + 3] = next()
    }
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(strip, 3))
    geometry.setIndex(index)
    geometry.setAttribute('aRoot', new THREE.InstancedBufferAttribute(roots, 4))
    geometry.instanceCount = j.count
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -4

    this.glowMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        ...common,
        uGlowLayers: { value: new THREE.Vector4(g.tight[0]!, g.tight[1]!, g.wide[0]!, g.wide[1]!) },
        uGlowTint: { value: tint(g.tint) },
        uGlowTurn: { value: g.turn },
      },
      ...added,
    })
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.glowMaterial)
    this.glow.frustumCulled = false
    this.glow.renderOrder = -5
  }

  /** keep: how much of the jets and of the glow is left as the camera of the rise climbs (by height, not by time). */
  update(time: number, keep: number): void {
    this.time.value = time
    this.keep.value = keep
    this.mesh.visible = keep > 0
    this.glow.visible = keep > 0
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.glow.geometry.dispose()
    this.material.dispose()
    this.glowMaterial.dispose()
  }
}
