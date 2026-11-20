import * as THREE from 'three'
import type { SetContext, StopSet } from '../core/types'
import { DIAG_GLSL, diagUniform } from '../diagnostics/diag'
import type { StopPlan } from '../director/moves'
import { smooth } from '../director/rig'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import { EQUIRECT_GLSL } from '../space/sky'

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vView;
out vec2 vUv;
void main() {
  vLocal = position;
  vUv = uv;
  vWorldN = normalize(mat3(modelMatrix) * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const GLOBE = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uMapWidth;
uniform float uSpin;
uniform float uGain;
uniform float uLit;
uniform float uWeight;
uniform vec3 uLightDir;
uniform vec3 uTint;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  float c = cos(uSpin), s = sin(uSpin);
  d = vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
  vec3 col = inverseFilmic(equirect(uMap, d).rgb) * uGain;
  float ndl = dot(normalize(vWorldN), uLightDir);
  col = mix(col, uTint * uGain * (0.35 + 0.9 * dot(col / uGain, vec3(0.3333))), uLit);
  col *= mix(1.0, smoothstep(-0.05, 0.35, ndl) * 1.6 + 0.004, uLit) * uWeight;
  outColor = diagOut(vec4(col, 1.0), diagTexelsDir(d, uMapWidth), 1.0, vec3(0.15, 0.45, 0.9), vec2(0.0), length(vView));
}`

const MOON = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uLightDir;
uniform float uGain;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vView;
out vec4 outColor;
${DIAG_GLSL}
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
void main() {
  vec3 n = normalize(vWorldN);
  float ndl = dot(n, uLightDir);
  vec3 q = floor(normalize(vLocal) * 9.0);
  float mottle = 0.8 + 0.2 * hash(q);
  vec3 col = uColor * mottle * (smoothstep(-0.02, 0.2, ndl) * max(ndl, 0.0) * 1.1 + 0.006) * uGain;
  outColor = diagOut(vec4(col, 1.0), 0.0, 0.0, vec3(0.9, 0.6, 0.15), vec2(0.0), length(vView));
}`

const RING = /* glsl */ `
precision highp float;
uniform vec3 uLightLocal;
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
uniform float uGain;
uniform float uThin;
in vec3 vLocal;
in vec3 vView;
out vec4 outColor;
${DIAG_GLSL}
void main() {
  float r = length(vLocal.xy);
  float t = (r - uInner) / (uOuter - uInner);
  float bands = 0.62 + 0.2 * sin(t * 160.0) * sin(t * 47.0 + 1.3) + 0.18 * sin(t * 23.0 + 0.4);
  float gap = smoothstep(0.02, 0.0, abs(t - 0.66) - 0.022);
  float edge = smoothstep(0.0, 0.03, t) * smoothstep(1.0, 0.97, t);
  float alpha = clamp(bands + 0.25, 0.0, 1.0) * edge * (1.0 - 0.92 * gap) * mix(0.55, 1.0, smoothstep(0.1, 0.3, t));
  vec3 p = vLocal;
  float b = dot(p, uLightLocal);
  float disc = b * b - dot(p, p) + 1.0;
  float shadow = (b < 0.0 && disc > 0.0) ? 0.04 : 1.0;
  float lines = 0.0;
  for (int k = 0; k < 6; k++) {
    float c = 0.06 + 0.176 * float(k) + 0.03 * sin(float(k) * 2.4);
    float w = max(0.006, fwidth(t) * 0.9);
    lines += exp(-pow((t - c) / w, 2.0)) * (0.6 + 0.4 * sin(float(k) * 1.7 + 0.5));
  }
  alpha = mix(alpha, clamp(lines, 0.0, 1.0) * 0.13, uThin);
  vec3 col = uColor * mix(bands, 1.5, uThin) * shadow * uGain;
  if (uDiag >= 2 && alpha < 0.5) discard;
  outColor = diagOut(vec4(col, alpha), 0.0, 0.0, vec3(0.2, 0.85, 0.4), vec2(0.0), length(vView));
}`

const PLATE = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec2 uMapSize;
uniform float uGain;
in vec2 vUv;
in vec3 vView;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec2 uv = vUv * 3.0 - 1.0;
  vec3 col = inverseFilmic(texture(uMap, uv).rgb) * uGain;
  outColor = diagOut(vec4(col, 1.0), diagTexels(uv * uMapSize), 1.0, vec3(0.85, 0.3, 0.25), vec2(0.0), length(vView));
}`

const POINT_VERT = /* glsl */ `
uniform float uSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize;
}`

const POINT_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uSize;
out vec4 outColor;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * uSize;
  float r2 = dot(p, p);
  outColor = vec4(uColor * (exp(-r2 / 0.9) + 0.07 * exp(-r2 / (0.02 * uSize * uSize)) + 0.05 * exp(-p.y * p.y / 0.7 - p.x * p.x / (0.06 * uSize * uSize))), 0.0);
}`

const PLATE_DISTANCE = 10

function shader(fragment: string, uniforms: Record<string, THREE.IUniform>, extra: Partial<THREE.ShaderMaterialParameters> = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: fragment, uniforms: { ...uniforms, uDiag: diagUniform }, ...extra })
}

const MOON_COLORS: Record<string, [number, number, number]> = {
  moon: [0.5, 0.5, 0.5], phobos: [0.2, 0.17, 0.15], io: [0.85, 0.72, 0.3], titan: [0.8, 0.5, 0.2], miranda: [0.5, 0.5, 0.52], ariel: [0.55, 0.55, 0.57], triton: [0.75, 0.68, 0.66],
}

export async function createStandinSet(ctx: SetContext, plan: StopPlan): Promise<StopSet> {
  const fit = plan.fit
  const base = plan.id + '/' + ctx.assets + '/'
  const wrap = await ctx.texture(base + 'standin-wrap.jpg', { srgb: true, anisotropy: 8, repeat: true })
  const close = await ctx.texture(base + 'standin-close.jpg', { srgb: true, anisotropy: 8, mirror: true })
  const wrapSize = wrap.image as unknown as { width: number; height: number }
  const closeSize = close.image as unknown as { width: number; height: number }
  const world = new THREE.Group()
  const orbit = new THREE.Group()
  const terrain = new THREE.Group()
  world.add(orbit, terrain)

  const globeMat = shader(GLOBE, { uMap: { value: wrap }, uMapWidth: { value: wrapSize.width }, uSpin: { value: 0 }, uGain: { value: 1 }, uLit: { value: 0 }, uWeight: { value: 1 }, uLightDir: { value: new THREE.Vector3(1, 0, 0) }, uTint: { value: new THREE.Vector3().fromArray(plan.p.tint) } })
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 128), globeMat)
  globe.quaternion.fromArray(fit.globe.quaternion)
  globe.scale.fromArray(fit.globe.scale)
  orbit.add(globe)

  const moons: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; home: THREE.Vector3 }[] = []
  const moonGeo = new THREE.SphereGeometry(1, 96, 48)
  for (const m of fit.moons ?? []) {
    const mat = shader(MOON, { uColor: { value: new THREE.Vector3().fromArray(MOON_COLORS[m.id] ?? [0.5, 0.5, 0.5]) }, uLightDir: { value: new THREE.Vector3(1, 0, 0) }, uGain: { value: 1 } })
    const mesh = new THREE.Mesh(moonGeo, mat)
    mesh.scale.setScalar(m.radius)
    orbit.add(mesh)
    moons.push({ mesh, mat, home: new THREE.Vector3().fromArray(m.position) })
  }

  let ringMat: THREE.ShaderMaterial | null = null
  if (fit.rings) {
    const thin = (fit.rings.outer - fit.rings.inner) / fit.rings.inner < 0.2
    const inner = thin ? Math.min(fit.rings.inner, fit.rings.outer * 0.975) : fit.rings.inner
    const outer = thin ? Math.max(fit.rings.outer, fit.rings.inner * 1.025) : fit.rings.outer
    ringMat = shader(RING, { uLightLocal: { value: new THREE.Vector3(1, 0, 0) }, uColor: { value: new THREE.Vector3().fromArray(plan.p.tint) }, uInner: { value: inner }, uOuter: { value: outer }, uGain: { value: 1 }, uThin: { value: thin ? 1 : 0 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 256, 4), ringMat)
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().fromArray(fit.rings.normal).normalize())
    ring.renderOrder = 2
    orbit.add(ring)
  }
  const ringInverse = ringMat ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().fromArray(fit.rings!.normal).normalize()).invert() : null

  const pointMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: POINT_VERT, fragmentShader: POINT_FRAG, uniforms: { uColor: { value: new THREE.Vector3() }, uSize: { value: 4 } }, blending: THREE.AdditiveBlending, premultipliedAlpha: true, depthTest: false, depthWrite: false, transparent: true })
  const pointGeo = new THREE.BufferGeometry()
  pointGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  const point = new THREE.Points(pointGeo, pointMat)
  point.frustumCulled = false
  orbit.add(point)

  const plateMat = shader(PLATE, { uMap: { value: close }, uMapSize: { value: new THREE.Vector2(closeSize.width, closeSize.height) }, uGain: { value: 1 } })
  const t = plan.p.terrain
  const overscan = 1 + (0.5 * t.forward + 0.5 * Math.abs(t.side) + 0.5 * Math.abs(t.rise)) / PLATE_DISTANCE + Math.tan(THREE.MathUtils.degToRad(0.5 * Math.max(Math.abs(t.yawDeg), Math.abs(t.pitchDeg))))
  const h = 2 * PLATE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(t.vfov) / 2) * overscan
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(h * (closeSize.width / closeSize.height) * 3, h * 3), plateMat)
  plate.position.set(0, 0, -PLATE_DISTANCE)
  terrain.add(plate)

  const light = new THREE.Vector3()
  const seen = new THREE.Vector3()
  const inverse = new THREE.Quaternion()
  const turn = new THREE.Quaternion()

  return {
    id: plan.id,
    world,
    update: (state, shot, view) => {
      const inOrbit = state.view === 'orbit'
      orbit.visible = inOrbit && state.weight > 0
      terrain.visible = !inOrbit
      const gain = 1 / shot.post.exposure
      plateMat.uniforms.uGain!.value = gain
      if (!inOrbit) return
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      seen.copy(shot.sun.dir)
      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(seen, lit).normalize()
      globeMat.uniforms.uSpin!.value = plan.spin(state.time)
      globeMat.uniforms.uGain!.value = gain
      globeMat.uniforms.uLit!.value = lit
      globeMat.uniforms.uWeight!.value = state.weight
      ;(globeMat.uniforms.uLightDir!.value as THREE.Vector3).copy(light)
      turn.setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (state.time - plan.holdMid))
      for (const m of moons) {
        m.mesh.position.copy(m.home).applyQuaternion(turn)
        m.mat.uniforms.uGain!.value = gain * 0.6
        ;(m.mat.uniforms.uLightDir!.value as THREE.Vector3).copy(light)
      }
      if (ringMat && ringInverse) {
        inverse.copy(state.rotation).invert()
        ;(ringMat.uniforms.uLightLocal!.value as THREE.Vector3).copy(light).applyQuaternion(inverse).applyQuaternion(ringInverse)
        ringMat.uniforms.uGain!.value = gain * 0.55
      }
      const distance = world.position.length()
      const radiusPx = (1 / Math.max(distance, 1)) / Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2) * (view.format.height / 2)
      const far = 1 - smooth((radiusPx - 0.0015 * view.format.height) / (0.014 * view.format.height))
      point.visible = far > 0 && view.diag === 'beauty'
      globe.visible = radiusPx > 0.6
      pointMat.uniforms.uSize!.value = Math.max(15, 30 * view.format.height / 1080)
      ;(pointMat.uniforms.uColor!.value as THREE.Vector3).fromArray(plan.p.tint).addScalar(0.35).multiplyScalar(far * gain * (5 + 9 * Math.min(radiusPx, 1)))
    },
    dispose: () => {
      globe.geometry.dispose()
      globeMat.dispose()
      moonGeo.dispose()
      for (const m of moons) m.mat.dispose()
      ringMat?.dispose()
      plateMat.dispose()
      plate.geometry.dispose()
      pointGeo.dispose()
      pointMat.dispose()
    },
  }
}
