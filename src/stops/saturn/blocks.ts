import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { RING_FIELD_GLSL } from './field'
import { GLOBE_SHADOW_GLSL, SHEET_LAW_GLSL, SHEET_OUTER_GLSL, sheetDepth } from './sheet'
import spec from './blocks.json'

// The ice near the lens, piece by piece: every block is a true body of twenty faces on an orbit of its own.
// The ones that rest in the sheet ride the orbit of their radius; the others swing out of the sheet and back
// once an orbit, so they pass in front of the sheet with parallax. A block is lit by the Sun face by face and
// throws a shadow on the sheet. A block that rests in the sheet is a piece of it: it has the colour and the
// brightness of the sheet there, brighter on the faces that look at the Sun and darker on the others. It fades
// out as it gets smaller than a few pixels and with distance, where the sand of the sheet takes over.

// where the lens is and how it looks, in the frame of the rings, and how far the orbit that keeps pace with
// the globe has turned (full circles)
export interface Eye { position: THREE.Vector3; quaternion: THREE.Quaternion; turns: number }

const ORBIT_GLSL = /* glsl */ `
in vec4 aOrbit;
in vec4 aForm;
in vec4 aSpin;
in vec4 aKind;
in vec3 aClass;
uniform vec4 uIceOrbit;
uniform vec4 uIceMove;
uniform vec3 uCamL;
uniform vec4 uBlockFade;
uniform vec4 uBlockView;
// The centre of the block when the orbit that keeps pace with the globe has turned by turns: its own orbit
// turns by Kepler's third law; it swings in and out, along and out of the sheet once an orbit.
vec3 blockCentre(float turns) {
  float a = aOrbit.x;
  float s = uIceOrbit.y / a;
  float w = turns * s * sqrt(s);
  float swing = 6.2831853 * (aOrbit.w + w);
  float ang = 6.2831853 * (aOrbit.y - w) + 2.0 * aKind.y * sin(swing + 1.0);
  float r = a * (1.0 - aKind.y * cos(swing + 1.0));
  float y = aKind.x > 0.0 ? aKind.x * aForm.x : aOrbit.z * sin(swing);
  return vec3(r * cos(ang), y, r * sin(ang));
}
// How much of the block shows: by its width on screen and by its distance from the lens in heights of the lens
// over the sheet, and only near the sheet.
float blockShown(vec3 centre, out float dist) {
  dist = length(centre - uCamL);
  float px = 2.0 * aForm.x * uBlockView.x / max(dist, 1e-6);
  float h = abs(uCamL.y);
  return smoothstep(uBlockFade.x, uBlockFade.y, px) * (1.0 - smoothstep(aClass.x * h, aClass.y * h, dist)) * uIceOrbit.z;
}`

const VERT = /* glsl */ `
precision highp float;
${ORBIT_GLSL}
out vec3 vOff;
out vec3 vView;
out vec3 vClip;
flat out vec4 vLook;
flat out vec4 vCentre;
flat out float vFollow;
void main() {
  vec3 centre = blockCentre(uIceOrbit.x);
  vFollow = aClass.z;
  // the way of the block past the lens during one take
  vec3 move = blockCentre(uIceOrbit.x + 0.5 * uIceMove.w) - blockCentre(uIceOrbit.x - 0.5 * uIceMove.w) - uIceMove.xyz;
  float dist;
  float alpha = blockShown(centre, dist);
  float size = aForm.x;
  float angle = 6.2831853 * (aSpin.w + uIceOrbit.x * aForm.w);
  vec3 k = aSpin.xyz;
  vec3 v = position * vec3(1.0, aForm.y, aForm.z);
  float c = cos(angle);
  float s = sin(angle);
  vec3 o = (v * c + cross(k, v) * s + k * (dot(k, v) * (1.0 - c))) * size;
  // over the time of one take the block is drawn out along its way, and is that much fainter
  vec3 dir = (centre - uCamL) / max(dist, 1e-6);
  float smear = length(move - dir * dot(move, dir));
  alpha *= 2.0 * size / (2.0 * size + smear);
  vOff = o + move * (dot(o, move) > 0.0 ? 0.5 : -0.5);
  vec4 mv = modelViewMatrix * vec4(centre + vOff, 1.0);
  vView = mv.xyz;
  gl_Position = alpha > 0.004 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
  vClip = gl_Position.xyw;
  vLook = vec4(alpha, aKind.z, aKind.w, aKind.x > 0.0 ? 1.0 : 0.0);
  vCentre = vec4(centre, size);
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vOff;
in vec3 vView;
in vec3 vClip;
flat in vec4 vLook;
flat in vec4 vCentre;
flat in float vFollow;
uniform vec3 uCamL;
uniform vec3 uSunL;
uniform float uPolar;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uSat;
uniform vec3 uTintDense;
uniform vec3 uTintThin;
uniform vec3 uFloor;
uniform vec4 uBlockLit;
uniform vec4 uBlockGloss;
uniform vec4 uBlockTone;
uniform vec3 uBlockIce;
uniform vec3 uBlockLayer;
out vec4 outColor;
${DIAG_GLSL}
${RING_FIELD_GLSL}
${GLOBE_SHADOW_GLSL}
${SHEET_OUTER_GLSL}
${SHEET_LAW_GLSL}
void main() {
  // the face under the pixel: its normal from the slope of the position across the screen (the position is
  // taken from the block's centre, so the slope is exact)
  vec3 n = normalize(cross(dFdx(vOff), dFdy(vOff)));
  vec3 pos = vCentre.xyz + vOff;
  vec3 ray = pos - uCamL;
  float dist = length(ray);
  vec3 dir = ray / dist;
  n = dot(n, dir) > 0.0 ? -n : n;
  float r = length(vCentre.xz);
  float rc = sheetInkRadius(r);
  vec4 ink = ringInk(rc);
  float thin = ringThin(rc);
  vec3 tone = mix(vec3(1.0), ink.rgb, uSat) * mix(uTintDense, uTintThin, thin);
  // the brightness of the sheet where the block lies, seen from the lens: a block that rests in the sheet is a
  // piece of it, one that floats is ice in sunlight wherever it is
  float mu = max(abs(dir.y), 1e-3);
  float mu0 = max(abs(uSunL.y), 0.02);
  float deg = degrees(acos(clamp(-dot(dir, uSunL), -1.0, 1.0)));
  float level = mix(uBlockTone.x, ringKnots(r, uBlockTone.y).y + sheetOuterLum(sheetOuter(r)), vFollow) * sheetLaw(thin * vFollow, mu, mu0, deg);
  // a face that lies flat is lit like the sheet; one that looks at the Sun is brighter, up to a limit; the
  // others have the light of the lit sheet below them, and a little that comes through the ice
  float facing = dot(n, uSunL);
  float direct = min(max(facing, 0.0) / mu0, uBlockLit.z);
  float bounce = uBlockLit.y * mix(uBlockGloss.z, 1.0, 0.5 - 0.5 * n.y);
  float light = direct + bounce + uBlockLit.w * max(-facing, 0.0);
  float flash = uBlockGloss.x * pow(max(dot(reflect(dir, n), uSunL), 0.0), uBlockGloss.y);
  vec3 body = mix(tone, uBlockIce, vLook.y) * (1.0 + (vLook.z - 0.5) * uBlockGloss.w);
  vec3 sun = mix(uFloor, vec3(1.0), globeShadow(vCentre.xyz, uSunL, uPolar));
  vec3 col = (body * light + vec3(flash)) * sun * (level * uBlockLit.x * uShade.z);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float alpha = vLook.x * uWeight;
  outColor = diagOut(vec4(col * alpha, alpha), 0.0, 0.0, uBlockLayer, vec2(0.0), length(vView));
  // a block that rests in the sheet shows the part of it above the sheet
  if ((vLook.w > 0.5 && pos.y < 0.0) || (uDiag >= 2 && alpha < 0.5)) discard;
}`

const SHADOW_VERT = /* glsl */ `
precision highp float;
${ORBIT_GLSL}
uniform vec3 uSunL;
uniform vec4 uBlockShadow;
out vec2 vAt;
flat out vec4 vFall;
void main() {
  vec3 centre = blockCentre(uIceOrbit.x);
  float dist;
  float alpha = blockShown(centre, dist);
  float size = aForm.x;
  // the shadow of a ball on the sheet: an ellipse along the Sun's azimuth, its centre where the ray from the
  // Sun through the block's centre meets the sheet
  float flat2 = length(uSunL.xz);
  vec2 away = -uSunL.xz / max(flat2, 1e-6);
  float up = max(abs(uSunL.y), 0.05);
  vec2 foot = centre.xz + away * (max(centre.y, 0.0) * flat2 / up);
  vec2 q = foot + (away * (position.x / up) + vec2(-away.y, away.x) * position.y) * (size * uBlockShadow.w);
  // a block high above the sheet throws a faint shadow, one that throws none is not drawn
  float high = centre.y / (uBlockShadow.z * size);
  alpha *= aSpin.w < 0.0 || centre.y < 0.0 ? 0.0 : 1.0 / (1.0 + high * high);
  vec4 mv = modelViewMatrix * vec4(q.x, 0.0, q.y, 1.0);
  gl_Position = alpha > 0.004 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
  vAt = position.xy * uBlockShadow.w;
  vFall = vec4(alpha, length(foot), size * uBlockView.x / max(dist, 1e-6), 0.0);
}`

const SHADOW_FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vAt;
flat in vec4 vFall;
uniform vec3 uSunL;
uniform float uWeight;
uniform vec4 uBlockShadow;
uniform vec4 uBlockView;
out vec4 outColor;
${DIAG_GLSL}
${RING_FIELD_GLSL}
${SHEET_OUTER_GLSL}
void main() {
  float d = length(vAt);
  // the edge is soft by a share of the half width, no less than a pixel or so
  float w = max(uBlockShadow.y, uBlockView.y / max(vFall.z, 1e-3));
  float shape = 1.0 - smoothstep(1.0 - w, 1.0 + w, d);
  // the sheet takes the shadow by how much of the Sun's light it catches there
  float tau = ringDepth(vFall.y, 0.0) + sheetOuter(vFall.y);
  float caught = 1.0 - exp(-tau / max(abs(uSunL.y), 0.05));
  float alpha = uBlockShadow.x * shape * caught * vFall.x * uWeight;
  outColor = vec4(0.0, 0.0, 0.0, alpha);
  if (uDiag >= 2) discard;
}`

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// how much ice lies at radius r, as a share of a dense ring: by the depth of the sheet there
function iceAt(r: number): number {
  const deep = sheetDepth(r) / spec.presence
  return 1 - Math.exp(-deep * deep)
}

export class Blocks {
  readonly group = new THREE.Group()
  readonly count: number
  private readonly geometry: THREE.InstancedBufferGeometry
  private readonly shadowGeometry: THREE.InstancedBufferGeometry
  private readonly material: THREE.ShaderMaterial
  private readonly shadowMaterial: THREE.ShaderMaterial
  private readonly view = new THREE.Vector4(1000, spec.shadow.softPixels, 0, 0)

  // shared: the uniforms of the sheet (field, ice, light). eyes: the lens in the frame of the rings at every
  // frame from fade.frames[0] before the skim to fade.frames[1] after it; mid is the index of the middle of the
  // skim. focal: the focal length in pixels there. sync: the radius of the orbit that keeps pace with the
  // globe; spinDegPerSecond: how fast that one turns.
  constructor(shared: Record<string, THREE.IUniform>, eyes: Eye[], mid: number, focal: number, tan: [number, number], sync: number, spinDegPerSecond: number) {
    const random = seeded(spec.seed)
    const cls = spec.classes
    const fade = spec.fade
    const orbit: number[] = []
    const form: number[] = []
    const spin: number[] = []
    const kind: number[] = []
    const klass: number[] = []
    const turnsMid = eyes[mid]!.turns
    // the height of the lens over the sheet at each frame, and the greatest
    const heights = eyes.map((e) => Math.abs(e.position.y))
    const highest = Math.max(...heights)
    // the axes of the lens at each frame
    const axes = eyes.map((e) => ({
      p: e.position,
      right: new THREE.Vector3(1, 0, 0).applyQuaternion(e.quaternion),
      up: new THREE.Vector3(0, 1, 0).applyQuaternion(e.quaternion),
      fwd: new THREE.Vector3(0, 0, -1).applyQuaternion(e.quaternion),
      turns: e.turns,
    }))
    const first = axes[0]!.p
    const last = axes[axes.length - 1]!.p
    const way = last.clone().sub(first)
    const wayLength = way.length()
    way.normalize()
    // the sector of the plane the lens can see ice in: round the feet of the path, as far as the reach
    const azimuth = (p: THREE.Vector3): number => Math.atan2(p.z, p.x)
    const azMid = azimuth(eyes[mid]!.position)
    const nodes = 5
    const at = new Float64Array(nodes * 3)
    const centre = (a: number, phase: number, swingAt: number, height: number, stray: number, rest: number, turns: number, out: Float64Array, k: number): void => {
      const s = sync / a
      const w = turns * s * Math.sqrt(s)
      const swing = 2 * Math.PI * (swingAt + w)
      const ang = 2 * Math.PI * (phase - w) + 2 * stray * Math.sin(swing + 1)
      const r = a * (1 - stray * Math.cos(swing + 1))
      out[k] = r * Math.cos(ang)
      out[k + 1] = rest > 0 ? rest : height * Math.sin(swing)
      out[k + 2] = r * Math.sin(ang)
    }
    const span = cls.span as [number, number]
    for (let c = 0; c < cls.name.length; c++) {
      const size = cls.size[c] as [number, number]
      const power = cls.power[c]!
      const ratio = Math.pow(size[0] / size[1], power)
      // a block is looked for no further from the path than its largest size can be seen
      const reachFar = cls.reach[c]![1]!
      const seenTo = Math.min(reachFar * highest, (2 * size[1] * focal) / fade.pixels[0]!)
      const half = Math.min(Math.PI, (seenTo + wayLength) / Math.max(span[0], 0.5) + 0.3)
      const area = half * (span[1] * span[1] - span[0] * span[0])
      const tries = Math.round(cls.perArea[c]! * area)
      for (let i = 0; i < tries; i++) {
        // every try draws the same count of numbers, so a change of one class leaves the others as they were
        const u = Array.from({ length: 15 }, random)
        const s = size[0] / Math.pow(1 - u[0]! * (1 - ratio), 1 / power)
        const a = Math.sqrt(span[0] * span[0] + u[1]! * (span[1] * span[1] - span[0] * span[0]))
        const az = azMid + (u[2]! * 2 - 1) * half
        if (cls.bySheet[c]! > 0.5 && u[3]! >= iceAt(a)) continue
        const reach = Math.min(reachFar * highest, (2 * s * focal) / fade.pixels[0]!)
        const hs = cls.height[c]!
        const height = hs > 0 ? Math.min(-hs * Math.log(1 - u[4]! * (1 - Math.exp(-cls.swing[c]! / hs))), cls.swing[c]!) : 0
        const rest = cls.lift[c]! > 0 ? cls.lift[c]! * s : 0
        const stray = cls.stray[c]! * u[5]!
        // above the sheet through the skim: the swing is between a sixth and five sixths of its way up and down
        const orbitTurns = Math.pow(sync / a, 1.5)
        const swingAt = 0.07 + 0.36 * u[6]! - turnsMid * orbitTurns
        const phase = az / (2 * Math.PI) + turnsMid * orbitTurns
        // a cheap first look: no nearer the path than its reach, at the middle of the skim
        centre(a, phase, swingAt, height, stray, rest, turnsMid, at, 0)
        const dx = at[0]! - first.x
        const dy = at[1]! - first.y
        const dz = at[2]! - first.z
        const along = Math.min(Math.max(dx * way.x + dy * way.y + dz * way.z, 0), wayLength)
        const off = Math.hypot(dx - way.x * along, dy - way.y * along, dz - way.z * along)
        if (off > reach + 0.2) continue
        // where it is at a few times, and from those at every frame
        for (let k = 0; k < nodes; k++) {
          const t = axes[Math.round((k / (nodes - 1)) * (axes.length - 1))]!.turns
          centre(a, phase, swingAt, height, stray, rest, t, at, k * 3)
        }
        let widest = 0
        let seen = false
        for (let f = 0; f < axes.length; f++) {
          const e = axes[f]!
          const x = (f / (axes.length - 1)) * (nodes - 1)
          const k = Math.min(Math.floor(x), nodes - 2)
          const g = x - k
          const px = at[k * 3]! + (at[k * 3 + 3]! - at[k * 3]!) * g - e.p.x
          const py = at[k * 3 + 1]! + (at[k * 3 + 4]! - at[k * 3 + 1]!) * g - e.p.y
          const pz = at[k * 3 + 2]! + (at[k * 3 + 5]! - at[k * 3 + 2]!) * g - e.p.z
          const depth = px * e.fwd.x + py * e.fwd.y + pz * e.fwd.z
          if (depth <= 0) continue
          const sx = Math.abs(px * e.right.x + py * e.right.y + pz * e.right.z)
          const sy = Math.abs(px * e.up.x + py * e.up.y + pz * e.up.z)
          if (sx > depth * tan[0] * 1.15 + 2 * s || sy > depth * tan[1] * 1.15 + 2 * s) continue
          const d = Math.sqrt(px * px + py * py + pz * pz)
          const wide = (2 * s * focal) / d
          if (wide >= fade.pixels[0]! && d < reachFar * heights[f]!) seen = true
          if (wide > widest) widest = wide
        }
        if (seen === false || widest > fade.largest) continue
        orbit.push(a, phase, height, swingAt)
        const squash = spec.shape.squash as [number, number]
        const tumble = ((u[7]! * 2 - 1) * spec.shape.tumbleDegPerSecond) / spinDegPerSecond
        form.push(s, squash[0] + (squash[1] - squash[0]) * u[8]!, squash[0] + (squash[1] - squash[0]) * u[9]!, tumble)
        // an axis of its own, even over the sphere
        const z = u[10]! * 2 - 1
        const azimuthOfAxis = 2 * Math.PI * u[11]!
        const flat = Math.sqrt(1 - z * z)
        // the fourth number: where the tumble starts; below zero for a class that throws no shadow
        spin.push(flat * Math.cos(azimuthOfAxis), z, flat * Math.sin(azimuthOfAxis), cls.shadow[c]! > 0.5 ? u[12]! : u[12]! - 1)
        const white = spec.light.white as [number, number]
        kind.push(rest > 0 ? cls.lift[c]! : 0, stray, white[0] + (white[1] - white[0]) * u[13]!, u[14]!)
        klass.push(cls.reach[c]![0]!, reachFar, cls.follow[c]!)
      }
    }
    this.count = orbit.length / 4

    // one block: the twelve corners of a body of twenty faces, each moved in or out
    const t = (1 + Math.sqrt(5)) / 2
    const corners = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1]
    const faces = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1]
    const shape = seeded(spec.shape.seed)
    const body = new Float32Array(36)
    const norm = Math.hypot(1, t)
    for (let i = 0; i < 12; i++) {
      const reachOut = (1 + spec.shape.jitter * (shape() * 2 - 1)) / norm
      for (let j = 0; j < 3; j++) body[i * 3 + j] = corners[i * 3 + j]! * reachOut
    }
    const attributes: [string, number[]][] = [['aOrbit', orbit], ['aForm', form], ['aSpin', spin], ['aKind', kind]]
    const instanced = attributes.map(([name, data]) => [name, new THREE.InstancedBufferAttribute(new Float32Array(data), 4)] as const)
    instanced.push(['aClass', new THREE.InstancedBufferAttribute(new Float32Array(klass), 3)] as const)
    this.geometry = new THREE.InstancedBufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(body, 3))
    this.geometry.setIndex(faces)
    this.shadowGeometry = new THREE.InstancedBufferGeometry()
    this.shadowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3))
    this.shadowGeometry.setIndex([0, 1, 2, 0, 2, 3])
    for (const [name, attribute] of instanced) {
      this.geometry.setAttribute(name, attribute)
      this.shadowGeometry.setAttribute(name, attribute)
    }
    this.geometry.instanceCount = this.count
    this.shadowGeometry.instanceCount = this.count

    const light = spec.light
    const shadow = spec.shadow
    const uniforms = {
      ...shared,
      uDiag: diagUniform,
      uBlockFade: { value: new THREE.Vector4(fade.pixels[0], fade.pixels[1], 0, 0) },
      uBlockView: { value: this.view },
      uBlockLit: { value: new THREE.Vector4(light.level, light.bounce, light.direct, light.through) },
      uBlockTone: { value: new THREE.Vector4(light.ref, light.wide, 0, 0) },
      uBlockGloss: { value: new THREE.Vector4(light.gloss, light.glossPower, light.sky, light.tone) },
      uBlockIce: { value: new THREE.Vector3().fromArray(light.ice) },
      uBlockLayer: { value: new THREE.Vector3().fromArray(spec.layer) },
      uBlockShadow: { value: new THREE.Vector4(shadow.strength, shadow.soft, shadow.height, 1 + shadow.soft) },
    }
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms,
      side: THREE.FrontSide, transparent: true, depthWrite: true, depthTest: true, premultipliedAlpha: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    })
    this.shadowMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, uniforms,
      side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: true, premultipliedAlpha: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    })
    const shadows = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial)
    shadows.frustumCulled = false
    shadows.renderOrder = 6.5
    const blocks = new THREE.Mesh(this.geometry, this.material)
    blocks.frustumCulled = false
    blocks.renderOrder = 7
    this.group.add(shadows, blocks)
  }

  // focal: the focal length in pixels of this view; shown: false where no block can show
  set(focal: number, shown: boolean): void {
    this.view.x = focal
    this.group.visible = shown && this.count > 0
  }

  dispose(): void {
    this.geometry.dispose()
    this.shadowGeometry.dispose()
    this.material.dispose()
    this.shadowMaterial.dispose()
  }
}
