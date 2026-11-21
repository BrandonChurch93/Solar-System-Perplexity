import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import deckJson from './deck.json'

export interface DeckLook {
  flow: [number, number, number, number]
  limb: [number, number]
  edge: number
  lift: number
}

const COMMON = /* glsl */ `
uniform vec3 uCentre;
uniform float uRadius;
uniform vec3 uUp;
uniform vec3 uF0;
uniform vec3 uR0;
uniform vec4 uPolar;
uniform vec4 uFlow;
uniform vec2 uFlowDir;
uniform float uTime;
vec3 onSphere(vec3 p) {
  return uCentre + uRadius * normalize(p - uCentre);
}
vec3 advect(vec3 p) {
  float along = dot(p, uF0) * uFlowDir.y + dot(p, uR0) * uFlowDir.x;
  float across = dot(p, uF0) * uFlowDir.x - dot(p, uR0) * uFlowDir.y;
  float k = uTime * (uFlow.x + uFlow.y * sin(across * uFlow.z + uFlow.w) + 0.4 * uFlow.y * sin(across * uFlow.z * 2.7 + along * 0.11 + 1.3));
  return onSphere(p - (uF0 * uFlowDir.y + uR0 * uFlowDir.x) * k);
}
vec2 polar(vec3 p) {
  vec3 n = normalize(p - uCentre);
  float c = dot(n, uUp);
  vec3 t = n - uUp * c;
  float s = uRadius * atan(length(t), c);
  float psi = atan(dot(t, uR0), dot(t, uF0));
  return vec2(psi / uPolar.x * 0.5 + 0.5, log(max(s, 1e-4) / uPolar.y) / uPolar.z);
}`

const VERT = /* glsl */ `
uniform sampler2D uHeight;
uniform float uLift;
out vec3 vBase;
out vec3 vView;
out vec3 vClip;
${COMMON}
void main() {
  vec3 pa = advect(position);
  float h = textureLod(uHeight, clamp(polar(pa), 0.0, 1.0), 0.0).r * uLift;
  vec3 n = normalize(position - uCentre);
  vec3 di = normalize(position);
  float mu = dot(n, -di);
  vec3 p = position - di * h / max(mu, 0.3) * smoothstep(0.0, 0.2, mu);
  vBase = position;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export const DECK_LIGHT_GLSL = /* glsl */ `
uniform sampler2D uLight;
uniform vec2 uLightSize;
vec3 deckLight(float mu, float psi) {
  float m = clamp(mu, 0.0, 1.0);
  float y = sqrt(max(1.0 - sqrt(max(1.0 - m * m, 0.0)), 0.0));
  vec2 uv = vec2((clamp(psi / uPolar.x * 0.5 + 0.5, 0.0, 1.0) * (uLightSize.x - 1.0) + 0.5) / uLightSize.x, (y * (uLightSize.y - 1.0) + 0.5) / uLightSize.y);
  return textureLod(uLight, uv, 0.0).rgb;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uFar;
uniform vec2 uColorSize;
uniform vec2 uFarSize;
uniform vec2 uTan;
uniform vec3 uCamL;
uniform vec2 uLimb;
uniform float uEdge;
uniform float uAMax;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
in vec3 vBase;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${COMMON}
${DECK_LIGHT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 p = onSphere(vBase);
  vec3 n = normalize(p - uCentre);
  vec3 pa = advect(p);
  vec3 na = normalize(pa - uCentre);
  vec3 di = normalize(pa);
  float muI = dot(na, -di);
  float psiI = atan(dot(di, uR0), dot(di, uF0));
  float z = max(-pa.z, 1e-4);
  vec2 uvT = vec2(pa.x / (z * uTan.x), pa.y / (z * uTan.y)) * 0.5 + 0.5;
  vec2 e = min(uvT, 1.0 - uvT);
  float wT = step(0.0, -pa.z) * smoothstep(0.0, uEdge, min(e.x, e.y)) * smoothstep(uLimb.x, uLimb.y, muI);
  vec2 uvS = polar(pa);
  vec3 dv = normalize(p - uCamL);
  float mu = dot(n, -dv);
  float psi = atan(dot(dv, uR0), dot(dv, uF0));
  vec3 lNow = deckLight(mu, psi);
  vec3 lImg = deckLight(muI, psiI);
  vec3 aT = inverseFilmic(texture(uColor, clamp(uvT, 0.0, 1.0)).rgb) / max(lImg, vec3(1e-4));
  vec3 s = texture(uFar, clamp(uvS, 0.0, 1.0)).rgb;
  vec3 aS = s * s * uAMax;
  vec3 col = mix(aS, aT, wT) * lNow;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float texels = max(diagTexels(uvT * uColorSize) * wT, diagTexels(uvS * uFarSize));
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, mix(vec3(0.2, 0.7, 0.75), vec3(0.85, 0.75, 0.3), wT), (pa - p).xz * 4.0, length(vView));
}`

const HALO_VERT = /* glsl */ `
out vec3 vDir;
out vec3 vClip;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const HALO_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uHalo;
uniform vec2 uHaloSize;
uniform vec3 uNadir;
uniform float uAlpha;
uniform float uEpsMax;
uniform float uPsiMax;
uniform vec3 uF0;
uniform vec3 uR0;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vDir);
  float eps = acos(clamp(dot(d, uNadir), -1.0, 1.0)) - uAlpha;
  if (eps <= 0.0) discard;
  float y = sqrt(clamp(eps / uEpsMax, 0.0, 1.0));
  float psi = atan(dot(d, uR0), dot(d, uF0));
  vec2 uv = vec2((clamp(psi / uPsiMax * 0.5 + 0.5, 0.0, 1.0) * (uHaloSize.x - 1.0) + 0.5) / uHaloSize.x, (y * (uHaloSize.y - 1.0) + 0.5) / uHaloSize.y);
  vec3 col = textureLod(uHalo, uv, 0.0).rgb * (1.0 - smoothstep(0.85, 1.0, y));
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

export interface DeckTextures { color: THREE.Texture; far: THREE.Texture; height: THREE.Texture; light: THREE.Texture; halo: THREE.Texture }

export class Deck {
  readonly group = new THREE.Group()
  readonly mesh: THREE.Mesh
  readonly haze: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly hazeMaterial: THREE.ShaderMaterial
  private readonly centre = new THREE.Vector3().fromArray(deckJson.centre)
  private readonly local = new THREE.Vector3()

  constructor(t: DeckTextures, key: 'full' | 'web', look: DeckLook) {
    const j = deckJson
    const up = new THREE.Vector3().fromArray(j.up)
    const f0 = new THREE.Vector3().fromArray(j.f0)
    const r0 = new THREE.Vector3().fromArray(j.r0)
    const th = Math.tan(THREE.MathUtils.degToRad(j.vfovDeg) / 2)
    const polar = new THREE.Vector4(j.psiMax, j.s0, Math.log(j.s1 / j.s0), 0)
    const flowDir = new THREE.Vector2(Math.cos(j.flowAngle), Math.sin(j.flowAngle))
    const shared = {
      uCentre: { value: this.centre }, uRadius: { value: j.radius }, uUp: { value: up }, uF0: { value: f0 }, uR0: { value: r0 }, uPolar: { value: polar },
      uFlow: { value: new THREE.Vector4().fromArray(look.flow) }, uFlowDir: { value: flowDir }, uTime: { value: 0 },
    }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...shared,
        uHeight: { value: t.height }, uLift: { value: look.lift }, uColor: { value: t.color }, uFar: { value: t.far }, uLight: { value: t.light },
        uLightSize: { value: new THREE.Vector2().fromArray(j.lightSize) }, uColorSize: { value: new THREE.Vector2().fromArray(j.imageSize[key]) }, uFarSize: { value: new THREE.Vector2().fromArray(j.farSize[key]) },
        uTan: { value: new THREE.Vector2(th * 16 / 9, th) }, uCamL: { value: new THREE.Vector3() }, uLimb: { value: new THREE.Vector2().fromArray(look.limb) }, uEdge: { value: look.edge }, uAMax: { value: j.aMax },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
    })
    const nPsi = 720
    const nS = 480
    const positions = new Float32Array((nPsi + 1) * (nS + 2) * 3)
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    let k = 0
    for (let i = -1; i <= nS; i++) {
      const s = i < 0 ? 0 : j.s0 * Math.exp((i / nS) * Math.log(j.s1 / j.s0))
      const g = s / j.radius
      for (let a = 0; a <= nPsi; a++) {
        const psi = (a / nPsi * 2 - 1) * j.psiMax
        n.copy(up).multiplyScalar(Math.cos(g)).addScaledVector(f0, Math.cos(psi) * Math.sin(g)).addScaledVector(r0, Math.sin(psi) * Math.sin(g))
        p.copy(this.centre).addScaledVector(n, j.radius)
        positions[k++] = p.x
        positions[k++] = p.y
        positions[k++] = p.z
      }
    }
    const index = new Uint32Array(nPsi * (nS + 1) * 6)
    k = 0
    for (let i = 0; i <= nS; i++) {
      for (let a = 0; a < nPsi; a++) {
        const q = i * (nPsi + 1) + a
        index[k++] = q
        index[k++] = q + 1
        index[k++] = q + nPsi + 1
        index[k++] = q + 1
        index[k++] = q + nPsi + 2
        index[k++] = q + nPsi + 1
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.hazeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      uniforms: {
        uHalo: { value: t.halo }, uHaloSize: { value: new THREE.Vector2().fromArray(j.haloSize) }, uNadir: { value: new THREE.Vector3(0, -1, 0) }, uAlpha: { value: 1.4 }, uEpsMax: { value: j.epsMax }, uPsiMax: { value: j.psiMax },
        uF0: { value: f0 }, uR0: { value: r0 }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.haze = new THREE.Mesh(new THREE.SphereGeometry(2000, 96, 48), this.hazeMaterial)
    this.haze.renderOrder = 5
    this.haze.frustumCulled = false
    this.group.add(this.mesh, this.haze)
  }

  update(world: THREE.Object3D, elapsed: number, gain: number, vignette: number, aspect: number): void {
    this.local.copy(world.position).negate().applyQuaternion(world.quaternion.clone().invert())
    const u = this.material.uniforms
    ;(u.uCamL!.value as THREE.Vector3).copy(this.local)
    u.uTime!.value = elapsed
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    const h = this.hazeMaterial.uniforms
    this.haze.position.copy(this.local)
    const to = this.centre.clone().sub(this.local)
    const dist = to.length()
    ;(h.uNadir!.value as THREE.Vector3).copy(to).divideScalar(dist)
    h.uAlpha!.value = Math.asin(Math.min(deckJson.radius / dist, 1))
    h.uGain!.value = gain
    h.uVignette!.value = vignette
    h.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.haze.geometry.dispose()
    this.material.dispose()
    this.hazeMaterial.dispose()
  }
}
