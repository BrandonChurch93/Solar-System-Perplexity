import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { APRON_GLSL } from './apron'
import { STAGE_GLSL, stage } from './stage'

export interface GroundLook {
  cap: number
  rings: number
  sectors: number
  cell: number
  apron: { amount: number; cell: number; calm: number }
  band: [number, number]
  glow: [number, number]
  boil: { reach: number; period: number; step: number; max: number }
  twinkle: { amount: number; rate: number; spread: number }
  inflow: { amount: number; waves: number; rate: number; inner: number; outer: number }
}

const VERT = /* glsl */ `
out vec3 vStage;
out vec3 vView;
out vec3 vClip;
void main() {
  vStage = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uPlate;
uniform sampler2D uApron;
uniform vec2 uApronSize;
uniform float uApronOn;
uniform vec2 uApronCell;
uniform sampler2D uGlow;
uniform vec4 uBox;
uniform float uGlowBeat;
uniform vec2 uSize;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform float uCellSize;
uniform vec4 uBoil;
uniform vec3 uTwinkle;
uniform vec4 uInflow;
uniform vec2 uInflowRate;
uniform vec3 uCam;
uniform vec2 uBand;
uniform float uLod;
uniform vec3 uSpot;
uniform vec3 uSpotE;
uniform vec3 uSpotN;
in vec3 vStage;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${STAGE_GLSL}
${APRON_GLSL}
float lumAt(sampler2D map, vec2 uv, float lod) {
  return dot(textureLod(map, uv, lod).rgb, vec3(0.3, 0.5, 0.2));
}
vec4 surface(sampler2D map, vec2 uv, vec2 dx, vec2 dy, vec2 cell, float lod, float calm, out vec2 moved) {
  vec2 e = cell * uBoil.z;
  float lX = lumAt(map, uv + vec2(e.x, 0.0), lod) - lumAt(map, uv - vec2(e.x, 0.0), lod);
  float lY = lumAt(map, uv + vec2(0.0, e.y), lod) - lumAt(map, uv - vec2(0.0, e.y), lod);
  vec2 push = vec2(lX, lY) * (uBoil.x / (2.0 * uBoil.z));
  push *= min(1.0, uBoil.w / max(length(push), 1e-6));
  float wide = lumAt(map, uv, lod + 2.0 + calm);
  float slow = wide * 26.0 + lumAt(map, uv * 1.31 + 0.17, lod + 2.5 + calm) * 18.0;
  float swing = 0.5 * (sin(uTime * 6.283185307179586 / uBoil.y + slow) - sin(slow));
  vec3 lin = inverseFilmic(textureGrad(map, uv + push * cell * swing, dx, dy).rgb);
  float cellPhase = (lumAt(map, uv, lod + 1.0 + calm) + lumAt(map, uv * 0.83 + 0.29, lod + 1.5 + calm)) * uTwinkle.z;
  moved = push * swing;
  return vec4(lin, 1.0 + uTwinkle.x * (sin(uTime * uTwinkle.y + cellPhase) - sin(cellPhase)));
}
void main() {
  vec3 at = stFold(vStage);
  vec2 uv = stPlate(stImage(at));
  vec2 dx = dFdx(uv) * uGrad;
  vec2 dy = dFdy(uv) * uGrad;
  vec2 ab = apImage(vStage);
  vec2 uvB = apUv(ab);
  vec2 dxB = dFdx(uvB) * uGrad;
  vec2 dyB = dFdy(uvB) * uGrad;
  float w = apWeight(vStage, ab) * uApronOn;
  float texels = mix(diagTexels(uv * uSize), diagTexels(uvB * uApronSize), step(0.5, w));
  float dist = length(at);
  float graze = clamp(dot(normalize(at - ST_CENTRE), -at / dist), 0.0, 1.0);
  vec3 normal = normalize(vStage - ST_CENTRE);
  float now = clamp(dot(normal, normalize(uCam - vStage)), 0.0, 1.0);
  vec3 rel = vStage - uSpot;
  vec3 up = cross(uSpotE, uSpotN);
  rel -= up * dot(rel, up);
  float r = length(rel);
  float psi = atan(dot(rel, uSpotN), dot(rel, uSpotE));
  float band = smoothstep(uInflow.z * 0.85, uInflow.z * 1.35, r) * (1.0 - smoothstep(uInflow.w * 0.7, uInflow.w, r));
  float strand = 9.0 * sin(psi * 23.0) + 7.0 * sin(psi * 57.0 + 1.3) + 5.0 * sin(psi * 131.0 + 0.4);
  float wave = r / uInflow.w * uInflow.y * 6.283185307179586 + strand;
  float inflow = 1.0 + uInflow.x * band * (0.6 * (sin(wave + uTime * uInflowRate.x) - sin(wave)) + 0.4 * (sin(wave * 2.3 + uTime * uInflowRate.y) - sin(wave * 2.3)));
  vec3 col = vec3(0.0);
  vec2 moved = vec2(0.0);
  for (int k = 0; k < (w < 1.0 ? 1 : 0); k++) {
    float tone = clamp(stLimb(now) / stLimb(graze), 0.25, 5.0);
    float cellU = uCellSize / dist / (2.0 * ST_TAN.x * ST_CANVAS.z);
    vec2 cell = vec2(cellU, cellU * max(graze, 0.08) * uSize.x / uSize.y);
    vec4 s = surface(uPlate, uv, dx, dy, cell, log2(max(cell.y * uSize.y * 0.25, 1.0)), 0.0, moved);
    col = s.rgb * max(s.a * inflow, 0.0) * tone;
  }
  for (int k = 0; k < (w > 0.0 ? 1 : 0); k++) {
    vec3 toEye = AP_EYE - vStage;
    float away = length(toEye);
    float seen = clamp(dot(normal, toEye / away), 0.0, 1.0);
    float tone = clamp(stLimb(now) / stLimb(seen), 0.25, 5.0);
    float cellU = uApronCell.x / away / (2.0 * AP_TAN.x);
    vec2 cell = vec2(cellU, cellU * max(seen, 0.08) * uApronSize.x / uApronSize.y);
    vec2 m;
    vec4 s = surface(uApron, uvB, dxB, dyB, cell, log2(max(cell.y * uApronSize.y * 0.25, 1.0)), uApronCell.y, m);
    col = mix(col, s.rgb * max(s.a * inflow, 0.0) * tone, w);
    moved = mix(moved, m, w);
  }
  vec3 to = ST_CENTRE - uCam;
  float away = length(to);
  vec3 c1 = to / away;
  vec3 ray = normalize(vStage - uCam);
  float el = (acos(clamp(dot(ray, c1), -1.0, 1.0)) - asin(clamp(ST_RADIUS / away, 0.0, 1.0))) * sqrt(max(away * away - ST_RADIUS * ST_RADIUS, 0.0)) / ST_RADIUS * tan(ST_ALPHA);
  float limb = smoothstep(uBand.x, uBand.y, el);
  vec2 gb = stImage(vStage);
  for (int k = 0; k < (limb > 0.0 ? 1 : 0); k++) {
    vec2 far = stImage(stLimbDir(ray, c1, el));
    col = mix(col, inverseFilmic(textureLod(uPlate, stPlate(far), uLod).rgb), limb);
    gb = mix(gb, far, limb);
  }
  gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
  for (int k = 0; k < ((vStage.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); k++) col *= 1.0 + textureLod(uGlow, gb, 0.0).rgb * uGlowBeat;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), texels, 1.0, vec3(0.9, 0.5, 0.1), moved * 4.0, length(vView));
}`

export class Ground {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly pulse: [number, number]

  constructor(plate: THREE.Texture, apron: THREE.Texture, glow: THREE.Texture, look: GroundLook) {
    const img = plate.image as unknown as { width: number; height: number }
    const second = apron.image as unknown as { width: number; height: number }
    this.pulse = look.glow
    const up = stage.down.clone().negate()
    const e1 = new THREE.Vector3(1, 0, 0).addScaledVector(up, -up.x).normalize()
    const e2 = up.clone().cross(e1)
    const spot = stage.onGround(stage.spot[0], stage.spot[1])
    const spotUp = spot.clone().sub(stage.centre).normalize()
    const spotE = new THREE.Vector3(1, 0, 0).addScaledVector(spotUp, -spotUp.x).normalize()
    const spotN = spotUp.clone().cross(spotE)
    const edge = stage.onGround(stage.spot[0] + stage.umbra[0], stage.spot[1])
    const umbra = edge.distanceTo(spot)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPlate: { value: plate }, uApron: { value: apron }, uApronSize: { value: new THREE.Vector2(second.width, second.height) }, uApronOn: { value: look.apron.amount }, uApronCell: { value: new THREE.Vector2(look.apron.cell, look.apron.calm) }, uGlow: { value: glow }, uBox: { value: new THREE.Vector4(...stage.loopsBox) }, uGlowBeat: { value: 1 }, uSize: { value: new THREE.Vector2(img.width, img.height) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uCellSize: { value: look.cell },
        uBoil: { value: new THREE.Vector4(look.boil.reach, look.boil.period, look.boil.step, look.boil.max) },
        uTwinkle: { value: new THREE.Vector3(look.twinkle.amount, look.twinkle.rate, look.twinkle.spread) },
        uInflow: { value: new THREE.Vector4(look.inflow.amount, look.inflow.waves, umbra * look.inflow.inner, umbra * look.inflow.outer) },
        uInflowRate: { value: new THREE.Vector2(look.inflow.rate, look.inflow.rate * 1.7) },
        uCam: { value: new THREE.Vector3() }, uBand: { value: new THREE.Vector2(-THREE.MathUtils.degToRad(look.band[0]), -THREE.MathUtils.degToRad(look.band[1])) }, uLod: { value: 0 }, uSpot: { value: spot }, uSpotE: { value: spotE }, uSpotN: { value: spotN },
        uDiag: diagUniform, uGrad: gradUniform,
      },
    })
    const rings = look.rings
    const sectors = look.sectors
    const cap = THREE.MathUtils.degToRad(look.cap)
    const positions = new Float32Array((rings + 1) * sectors * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i <= rings; i++) {
      const theta = cap * (i / rings)
      for (let j = 0; j < sectors; j++) {
        const phi = (j / sectors) * Math.PI * 2
        p.copy(up).multiplyScalar(Math.cos(theta)).addScaledVector(e1, Math.sin(theta) * Math.cos(phi)).addScaledVector(e2, Math.sin(theta) * Math.sin(phi)).multiplyScalar(stage.radius).add(stage.centre)
        p.toArray(positions, (i * sectors + j) * 3)
      }
    }
    const index: number[] = []
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = i * sectors + j
        const b = i * sectors + ((j + 1) % sectors)
        const c = a + sectors
        const d = b + sectors
        index.push(a, c, b, b, c, d)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(index)
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
  }

  update(camera: THREE.Vector3, time: number, gain: number, vignette: number, aspect: number, lod: number, lit: number): void {
    const u = this.material.uniforms
    u.uLod!.value = lod
    ;(u.uCam!.value as THREE.Vector3).copy(camera)
    u.uTime!.value = time
    u.uGlowBeat!.value = stage.litMax * (1 + lit) * (1 + this.pulse[0] * (0.6 * Math.sin(time * this.pulse[1]) + 0.4 * Math.sin(time * this.pulse[1] * 1.83)))
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
