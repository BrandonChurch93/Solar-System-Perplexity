import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../../post/chain'
import { config } from '../../../config'
import { GRADE_GLSL } from '../grade'
import { STAGE_GLSL, stage } from '../stage'
import { formatUniform } from '../format'
import { plan } from '../plan'
import ramp from '../convect.json'
import lab from './lab.json'
import { EDGES, SLOTS, TILE, cellsAt, newCells } from './sim'

/**
 * The close ground of the Sun as things. Every cell of a power diagram of moving sites (sim.ts, a life simulated
 * once and read by the frame's time alone) is a dome of real triangles over its own ground: it hangs over its foot,
 * so two neighbours cut into each other and the lane between them is the crease where they meet, and a near dome
 * hides the foot of a far one by depth. A dome glows by its own heat and carries fibres combed from a dark root on
 * the side of the lens over its crown, lit along the fibre as hair is.
 */

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))

function rampTexture(): THREE.DataTexture {
  const stops = ramp.ramp.stops as number[][]
  const levels = ramp.ramp.levels as number[]
  const n = 256
  const px = new Float32Array(n * 4)
  const lo = stops[0]!
  const hi = ramp.tone.white as number[]
  for (let i = 0; i < n; i++) {
    const l = i / (n - 1)
    let c: number[]
    if (l <= levels[0]!) c = lo.map((v) => (v * l) / levels[0]!)
    else if (l >= levels[levels.length - 1]!) {
      const k = (l - levels[levels.length - 1]!) / (1 - levels[levels.length - 1]!)
      c = stops[stops.length - 1]!.map((v, j) => v + (hi[j]! - v) * k)
    } else {
      let j = 0
      while (levels[j + 1]! < l) j++
      const k = (l - levels[j]!) / (levels[j + 1]! - levels[j]!)
      c = stops[j]!.map((v, m) => v + (stops[j + 1]![m]! - v) * k)
    }
    px[i * 4] = srgbToLinear(c[0]!)
    px[i * 4 + 1] = srgbToLinear(c[1]!)
    px[i * 4 + 2] = srgbToLinear(c[2]!)
    px[i * 4 + 3] = 1
  }
  const t = new THREE.DataTexture(px, n, 1, THREE.RGBAFormat, THREE.FloatType)
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

const up = stage.down.clone().negate()
const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
const right = fwd.clone().cross(up).normalize()

function chart(p: THREE.Vector3, out: THREE.Vector2): THREE.Vector2 {
  const dx = p.x - stage.centre.x
  const dy = p.y - stage.centre.y
  const dz = p.z - stage.centre.z
  const l = Math.hypot(dx, dy, dz)
  const cu = (dx * up.x + dy * up.y + dz * up.z) / l
  const cr = (dx * right.x + dy * right.y + dz * right.z) / l
  const cf = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / l
  const ring = Math.hypot(cr, cf)
  const arc = stage.radius * Math.atan2(ring, cu)
  return out.set(ring > 1e-9 ? (cr / ring) * arc : 0, ring > 1e-9 ? (cf / ring) * arc : 0)
}

const SHAPE_GLSL = /* glsl */ `
uniform vec4 uLabSpot;
uniform vec4 uLabPit;
${STAGE_GLSL}
// the ground is combed toward the spot: a place of the cells' own chart lies nearer the spot on the ground, the
// more the nearer it is, so round cells become long strands that all end in the pit
vec2 labWarp(vec2 g) {
  vec2 d = g - uLabSpot.xy;
  float s = length(d);
  float r = s;
  for (int k = 0; k < 8; k++) {
    float e = uLabSpot.z * exp(-(r * r) / (uLabSpot.w * uLabSpot.w));
    r = clamp(r - (r + e - s) / (1.0 - 2.0 * r * e / (uLabSpot.w * uLabSpot.w)), 0.0, s);
  }
  return uLabSpot.xy + d * (r / max(s, 1e-6));
}
float labPit(vec2 real) {
  return uLabPit.x * (1.0 - smoothstep(uLabPit.y, uLabPit.z, length(real - uLabSpot.xy)));
}
vec3 labBall(vec2 g, float h) {
  float arc = length(g);
  float al = arc / ST_RADIUS;
  vec2 u = arc > 1e-6 ? g / arc : vec2(1.0, 0.0);
  vec3 dir = -ST_DOWN * cos(al) + sin(al) * (ST_RIGHT * u.x + ST_FWD * u.y);
  return ST_CENTRE + dir * (ST_RADIUS + h);
}`

const DOME_VERT = /* glsl */ `
precision highp float;
uniform sampler2D uLabCells;
uniform sampler2D uLabList;
uniform vec4 uLabDome;
uniform vec4 uLabFibre;
out vec3 vS;
out vec3 vPos;
out vec3 vN;
out vec3 vT;
out vec3 vView;
out vec3 vClip;
flat out vec3 vPole;
flat out vec4 vCell;
flat out vec4 vMore;
${SHAPE_GLSL}
vec2 edges[${EDGES}];
vec2 mid;
float rad;
float high;
float lobes;
vec3 dome(vec3 s) {
  float a = acos(clamp(s.z, -1.0, 1.0));
  vec2 u = length(s.xy) > 1e-6 ? normalize(s.xy) : vec2(1.0, 0.0);
  float inv = 0.0;
  for (int j = 0; j < ${EDGES}; j++) inv += pow(max(dot(u, edges[j]) * rad, 0.0), uLabDome.z);
  float r = rad * pow(max(inv, 1e-9), -1.0 / uLabDome.z);
  float f = (cos(a) - cos(uLabDome.x)) / (1.0 - cos(uLabDome.x));
  float wide = sin(a) / sin(uLabDome.x);
  float th = atan(u.y, u.x);
  float bump = 1.0 + 0.10 * sin(th * 2.0 + lobes) * sin(a) + 0.06 * sin(th * 3.0 - lobes * 1.7) * sin(a * 2.0);
  vec2 g = labWarp(mid + u * (r * wide));
  return labBall(g, high * f * bump - labPit(g));
}
void main() {
  int wideList = textureSize(uLabList, 0).x;
  vec4 aCell = texelFetch(uLabList, ivec2(gl_InstanceID % wideList, gl_InstanceID / wideList), 0);
  int id = int(aCell.x + 0.5);
  vec4 c0 = texelFetch(uLabCells, ivec2(0, id), 0);
  vec4 c1 = texelFetch(uLabCells, ivec2(1, id), 0);
  for (int k = 0; k < ${EDGES / 2}; k++) {
    vec4 e = texelFetch(uLabCells, ivec2(2 + k, id), 0);
    edges[2 * k] = e.xy;
    edges[2 * k + 1] = e.zw;
  }
  mid = c0.xy + aCell.yz;
  rad = c0.z;
  high = c0.w;
  lobes = c1.x * 0.37;
  float a = position.x * uLabDome.x;
  vec3 s = vec3(sin(a) * cos(position.y), sin(a) * sin(position.y), cos(a));
  // the root of the fibres lies on the side of the lens (the point under the stage's camera), turned a little
  // from cell to cell; near the spot it lies on the far side from the pit
  float turn = (fract(c1.x * 0.6180339) - 0.5) * 1.3;
  vec2 away = normalize(mid + vec2(0.0, 1e-3));
  away = vec2(away.x * cos(turn) - away.y * sin(turn), away.x * sin(turn) + away.y * cos(turn));
  vec2 toSpot = uLabSpot.xy - mid;
  float ds = length(toSpot);
  vec2 axis = normalize(mix(toSpot / max(ds, 1e-5), away, smoothstep(uLabSpot.z * 1.6, uLabSpot.z * 2.6, ds)));
  vec3 pole = normalize(vec3(axis * cos(uLabFibre.x), sin(uLabFibre.x)));
  float along = dot(s, pole);
  vec3 ts = pole - along * s;
  ts = length(ts) > 1e-4 ? normalize(ts) : vec3(0.0, 0.0, 1.0);
  vec3 bs = cross(s, ts);
  vec3 p = dome(s);
  vec3 p1 = dome(normalize(s + 0.03 * ts));
  vec3 p2 = dome(normalize(s + 0.03 * bs));
  vS = s;
  vPos = p;
  vT = normalize(p1 - p);
  vN = normalize(cross(p1 - p, p2 - p));
  vPole = pole;
  vCell = vec4(c1.x, c1.y, rad, high);
  vMore = vec4(ds, 0.0, 0.0, 0.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const TAIL_GLSL = /* glsl */ `
uniform sampler2D uRamp;
uniform sampler2D uGlow;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uGlowPlain, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform float uGroundMost;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uLabKeep;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${GRADE_GLSL}
vec3 thrown(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uGroundMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uGroundMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}
// shown: the colour as the picture shows it. The lights that the opening throws on the ground, the exposure and
// the vignette follow as on the standing ground
vec4 labOut(vec3 shown, vec3 here, vec3 clip, vec3 view) {
  vec3 col = inverseFilmic(grade(shown, 0.0));
  vec2 gb = stImage(here);
  gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
  for (int k = 0; k < ((here.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); k++) {
    float landed = uLandOn * exp(-dot(here - uLand.xyz, here - uLand.xyz) * uLand.w) + uKickOn * exp(-dot(here - uKick.xyz, here - uKick.xyz) * uKick.w);
    vec3 glowMap = textureLod(uGlow, gb, 0.0).rgb;
    col = thrown(col * (1.0 + glowMap * uGlowPlain), col * (1.0 + glowMap * (uGlowBeat * (1.0 + landed))));
    col = thrown(col, col + uLandVeil * landed);
  }
  for (int k = 0; k < (uFlashOn.x + uFlashOn.y > 0.0 ? 1 : 0); k++) {
    float pool = exp(-dot(here - uFlash.xyz, here - uFlash.xyz) * uFlash.w);
    col = thrown(col, col * (1.0 + uFlashOn.x * pool) + uLandVeil * (uFlashOn.y * pool));
  }
  vec2 vq = clip.xy / clip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  return diagOut(vec4(col * uLabKeep, uLabKeep), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(view));
}`

const DOME_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uLabEye;
uniform vec4 uLabDome;
uniform vec4 uLabFibre;
uniform vec4 uLabCount;
in vec3 vS;
in vec3 vPos;
in vec3 vN;
in vec3 vT;
in vec3 vView;
in vec3 vClip;
flat in vec3 vPole;
flat in vec4 vCell;
flat in vec4 vMore;
out vec4 outColor;
${SHAPE_GLSL}
${TAIL_GLSL}
float h1(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec3 s = normalize(vS);
  float seed = vCell.x;
  float f = (s.z - cos(uLabDome.x)) / (1.0 - cos(uLabDome.x));
  float along = dot(s, vPole);
  vec3 q1 = normalize(cross(vec3(0.0, 0.0, 1.0), vPole));
  vec3 q2 = cross(vPole, q1);
  float across = atan(dot(s, q1), dot(s, q2));
  // the fibres: streaks along the lines that run from the root over the crown, in three sizes
  vec2 fc = vec2(across / 3.14159265, along);
  float fa = vn(vec2(fc.x * uLabCount.x + seed * 3.1, fc.y * 0.9 + seed));
  float fb = vn(vec2(fc.x * uLabCount.y + seed * 7.7, fc.y * 1.7 - seed));
  float fd = vn(vec2(fc.x * uLabCount.z + seed * 1.3, fc.y * 2.9 + seed * 2.0));
  float fibre = 0.45 * fa + 0.35 * fb + 0.2 * fd;
  vec3 n = normalize(vN);
  vec3 t = normalize(vT + n * ((fb - 0.5) * 0.9 + (fd - 0.5) * 0.5 + (fa - 0.5) * 0.6));
  vec3 upHere = normalize(vPos - ST_CENTRE);
  vec3 toEye = normalize(uLabEye - vPos);
  vec3 l1 = normalize(ST_FWD + upHere * uLabFibre.w);
  vec3 hw1 = normalize(l1 + toEye);
  vec3 hw2 = normalize(upHere + toEye);
  float th1 = dot(t, hw1);
  float th2 = dot(t, hw2);
  float sheen1 = pow(max(1.0 - th1 * th1, 0.0), 0.5 * uLabFibre.y) * smoothstep(-0.45, 0.35, dot(n, l1));
  float sheen2 = pow(max(1.0 - th2 * th2, 0.0), 0.5 * uLabFibre.y) * smoothstep(-0.1, 0.8, dot(n, upHere));
  // the heat from within: full at the crown, darker to the foot and to the root
  float deep = smoothstep(0.0, 0.75, f);
  float root = smoothstep(-1.0, -0.15, along);
  float body = mix(0.035, 0.52, deep * deep * (3.0 - 2.0 * deep)) * mix(0.3, 1.0, root);
  float lum = body * (0.55 + 0.9 * fibre);
  float sheen = (sheen1 + 0.35 * sheen2) * (0.25 + 1.5 * fibre * fibre) * smoothstep(0.02, 0.35, f) * root;
  lum += 0.55 * sheen;
  float glint = smoothstep(0.86, 0.97, vn(vec2(across * 140.0 + seed, along * 60.0))) * smoothstep(0.25, 0.9, sheen);
  lum += 0.5 * glint;
  vec3 shown = texture(uRamp, vec2(clamp(lum, 0.0, 1.0), 0.5)).rgb;
  outColor = labOut(shown, vPos, vClip, vView);
}`

const FLOOR_VERT = /* glsl */ `
precision highp float;
out vec3 vPos;
out vec2 vG;
out vec3 vView;
out vec3 vClip;
${SHAPE_GLSL}
void main() {
  vec2 g = position.x * vec2(cos(position.y), sin(position.y));
  vec3 p = labBall(g, -0.004 - labPit(g));
  vG = g;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FLOOR_FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
in vec2 vG;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${SHAPE_GLSL}
${TAIL_GLSL}
void main() {
  vec3 shown = texture(uRamp, vec2(0.02, 0.5)).rgb;
  outColor = labOut(shown, vPos, vClip, vView);
}`

type Shared = Record<string, THREE.IUniform>

interface Level {
  geometry: THREE.InstancedBufferGeometry
  list: THREE.DataTexture
  data: Float32Array
  mesh: THREE.Mesh
  count: number
}

export class LabGround {
  readonly mesh = new THREE.Group()
  private readonly uniforms: Shared
  private readonly floorMaterial: THREE.ShaderMaterial
  private readonly ramp = rampTexture()
  private readonly cells = newCells()
  private readonly cellData = new Float32Array(SLOTS * 8 * 4)
  private readonly cellTexture: THREE.DataTexture
  private readonly levels: Level[] = []
  private readonly parts: { dispose(): void }[] = []
  private readonly screen = new THREE.Matrix4()
  private readonly back = new THREE.Matrix4()
  private readonly frustum = new THREE.Frustum()
  private readonly eye = new THREE.Vector3()
  private readonly at = new THREE.Vector2()
  private readonly ball = new THREE.Sphere()
  private readonly spot = new THREE.Vector2()
  private readonly order: { d: number; i: number; ox: number; oy: number }[][] = [[], [], []]
  private readonly start = (plan.seg.terrain.end - plan.seg.terrain.start) / 2 + config.shutterFraction / (2 * config.fps)

  constructor(shared: Shared) {
    const keep = ['uGrade', 'uGlow', 'uBox', 'uLand', 'uKick', 'uFlash', 'uGlowBeat', 'uGlowPlain', 'uLandOn', 'uKickOn', 'uFlashOn', 'uLandVeil', 'uGroundMost', 'uGain', 'uVignette', 'uAspect']
    const uniforms: Shared = {}
    for (const name of keep) uniforms[name] = shared[name]!
    chart(stage.onGround(stage.spot[0], stage.spot[1]), this.spot)
    this.cellTexture = new THREE.DataTexture(this.cellData, 8, SLOTS, THREE.RGBAFormat, THREE.FloatType)
    this.cellTexture.minFilter = THREE.NearestFilter
    this.cellTexture.magFilter = THREE.NearestFilter
    const d = lab.dome
    const f = lab.fibre
    const all = {
      ...uniforms,
      uDiag: diagUniform,
      uRamp: { value: this.ramp },
      uLabCells: { value: this.cellTexture },
      uLabEye: { value: new THREE.Vector3() },
      uLabKeep: { value: 1 },
      uLabDome: { value: new THREE.Vector4(THREE.MathUtils.degToRad(d.arc), d.height, d.round, 0) },
      uLabSpot: { value: new THREE.Vector4(this.spot.x, this.spot.y, lab.spot.pull, lab.spot.wide) },
      uLabPit: { value: new THREE.Vector4(lab.spot.depth, lab.spot.wall[0]!, lab.spot.wall[1]!, 0) },
      uLabFibre: { value: new THREE.Vector4(THREE.MathUtils.degToRad(f.tilt), f.sheen, 0, f.lightUp) },
      uLabCount: { value: new THREE.Vector4(f.counts[0]!, f.counts[1]!, f.counts[2]!, 0) },
    }
    this.uniforms = all
    this.floorMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: all, side: THREE.DoubleSide })
    this.parts.push(this.floorMaterial)
    this.mesh.renderOrder = -6

    const none = new THREE.BufferGeometry()
    none.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
    none.setDrawRange(0, 0)
    const quiet = new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false, depthWrite: false })
    const first = new THREE.Mesh(none, quiet)
    first.frustumCulled = false
    first.renderOrder = -7
    first.onBeforeRender = (renderer, _scene, camera) => this.pick(renderer, camera)
    this.mesh.add(first)
    this.parts.push(none, quiet)

    const caps = [64, 128, 256]
    for (let l = 0; l < 3; l++) {
      const rings = lab.lod.rings[l]!
      const sectors = lab.lod.sectors[l]!
      const pos = new Float32Array((rings + 1) * (sectors + 1) * 3)
      for (let i = 0; i <= rings; i++) {
        for (let j = 0; j <= sectors; j++) {
          const k = (i * (sectors + 1) + j) * 3
          pos[k] = i / rings
          pos[k + 1] = (j / sectors) * Math.PI * 2
        }
      }
      const index = new Uint16Array(rings * sectors * 6)
      let n = 0
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < sectors; j++) {
          const a = i * (sectors + 1) + j
          const b = a + 1
          const c = a + sectors + 1
          index[n++] = a
          index[n++] = c
          index[n++] = b
          index[n++] = b
          index[n++] = c
          index[n++] = c + 1
        }
      }
      const geometry = new THREE.InstancedBufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geometry.setIndex(new THREE.BufferAttribute(index, 1))
      const data = new Float32Array(caps[l]! * caps[l]! * 4)
      const list = new THREE.DataTexture(data, caps[l]!, caps[l]!, THREE.RGBAFormat, THREE.FloatType)
      list.minFilter = THREE.NearestFilter
      list.magFilter = THREE.NearestFilter
      geometry.instanceCount = 0
      const material = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: { ...all, uLabList: { value: list } }, side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.frustumCulled = false
      mesh.renderOrder = -6 + l * 0.01
      this.mesh.add(mesh)
      this.levels.push({ geometry, list, data, mesh, count: 0 })
      this.parts.push(geometry, material, list)
    }

    const arcs = [0]
    const most = THREE.MathUtils.degToRad(100) * stage.radius
    while (arcs[arcs.length - 1]! < most) {
      const a = arcs[arcs.length - 1]!
      arcs.push(a + Math.max(0.03, a * 0.035))
    }
    const sectors = 256
    const pos = new Float32Array(arcs.length * (sectors + 1) * 3)
    for (let i = 0; i < arcs.length; i++) {
      for (let j = 0; j <= sectors; j++) {
        const k = (i * (sectors + 1) + j) * 3
        pos[k] = arcs[i]!
        pos[k + 1] = (j / sectors) * Math.PI * 2
      }
    }
    const index = new Uint32Array((arcs.length - 1) * sectors * 6)
    let n = 0
    for (let i = 0; i < arcs.length - 1; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = i * (sectors + 1) + j
        const b = a + 1
        const c = a + sectors + 1
        index[n++] = a
        index[n++] = c
        index[n++] = b
        index[n++] = b
        index[n++] = c
        index[n++] = c + 1
      }
    }
    const floor = new THREE.BufferGeometry()
    floor.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    floor.setIndex(new THREE.BufferAttribute(index, 1))
    const under = new THREE.Mesh(floor, this.floorMaterial)
    under.frustumCulled = false
    under.renderOrder = -5.9
    this.mesh.add(under)
    this.parts.push(floor)
  }

  /** time: seconds from the middle of the terrain segment, as the standing ground takes it. eye: the eye in the
   * stage's own frame. */
  update(time: number, eye: THREE.Vector3, keep = 1, _onGlobe = false): void {
    this.mesh.visible = keep > 0
    this.uniforms.uLabKeep!.value = 1
    ;(this.uniforms.uLabEye!.value as THREE.Vector3).copy(eye)
    if (keep <= 0) return
    cellsAt(time + this.start, this.cells)
    const c = this.cells
    const d = c.diagram
    const px = this.cellData
    for (let i = 0; i < SLOTS; i++) {
      const o = i * 32
      if (!d.on[i]) {
        px[o + 2] = 0
        continue
      }
      const r = Math.sqrt(d.area[i]! / Math.PI)
      const u = c.u[i]!
      const young = 1 + lab.dome.young * (1 - Math.min(Math.max((u - 0.2) / 0.35, 0), 1))
      px[o] = d.mid[i * 2]!
      px[o + 1] = d.mid[i * 2 + 1]!
      px[o + 2] = r
      px[o + 3] = lab.dome.height * r * young
      px[o + 4] = c.seed[i]!
      px[o + 5] = u
      for (let e = 0; e < EDGES; e++) {
        const on = e < d.count[i]!
        px[o + 8 + e * 2] = on ? d.edges[(i * EDGES + e) * 2]! : 0
        px[o + 9 + e * 2] = on ? d.edges[(i * EDGES + e) * 2 + 1]! : 0
      }
    }
    this.cellTexture.needsUpdate = true
  }

  private warp(x: number, y: number, out: THREE.Vector2): THREE.Vector2 {
    const dx = x - this.spot.x
    const dy = y - this.spot.y
    const s = Math.hypot(dx, dy)
    const w2 = lab.spot.wide * lab.spot.wide
    let r = s
    for (let k = 0; k < 8; k++) {
      const e = lab.spot.pull * Math.exp(-(r * r) / w2)
      r = Math.min(Math.max(r - (r + e - s) / (1 - (2 * r * e) / w2), 0), s)
    }
    const k = r / Math.max(s, 1e-6)
    return out.set(this.spot.x + dx * k, this.spot.y + dy * k)
  }

  /** Which cells are drawn in this pass and how finely: by what the camera sees and by their size in the picture. */
  private pick(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    this.mesh.updateWorldMatrix(true, false)
    this.screen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.mesh.matrixWorld)
    this.frustum.setFromProjectionMatrix(this.screen, THREE.WebGLCoordinateSystem, (camera as THREE.Camera & { reversedDepth?: boolean }).reversedDepth === true)
    this.back.copy(this.mesh.matrixWorld).invert()
    const eye = this.eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(this.back)
    const from = chart(eye, this.at)
    const ex = from.x
    const ey = from.y
    const high = Math.max(eye.distanceTo(stage.centre) - stage.radius, 1e-3)
    const horizon = stage.radius * Math.acos(Math.min(stage.radius / (stage.radius + high), 1)) + 0.6
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 55
    const focal = 540 / Math.tan(THREE.MathUtils.degToRad(fov) / 2)
    const d = this.cells.diagram
    for (const o of this.order) o.length = 0
    const t0 = Math.floor((ex - horizon) / TILE)
    const t1 = Math.floor((ex + horizon) / TILE)
    const s0 = Math.floor((ey - horizon) / TILE)
    const s1 = Math.floor((ey + horizon) / TILE)
    const p = new THREE.Vector3()
    const w = new THREE.Vector2()
    for (let ty = s0; ty <= s1; ty++) {
      for (let tx = t0; tx <= t1; tx++) {
        const ox = tx * TILE
        const oy = ty * TILE
        for (let i = 0; i < SLOTS; i++) {
          if (!d.on[i]) continue
          this.warp(d.mid[i * 2]! + ox, d.mid[i * 2 + 1]! + oy, w)
          const gx = w.x
          const gy = w.y
          const arc = Math.hypot(gx - ex, gy - ey)
          if (arc > horizon) continue
          const r = Math.sqrt(d.area[i]! / Math.PI)
          const full = Math.hypot(gx, gy)
          const al = full / stage.radius
          const sn = full > 1e-6 ? Math.sin(al) / full : 0
          const cs = Math.cos(al)
          p.set(
            stage.centre.x + stage.radius * (up.x * cs + sn * (right.x * gx + fwd.x * gy)),
            stage.centre.y + stage.radius * (up.y * cs + sn * (right.y * gx + fwd.y * gy)),
            stage.centre.z + stage.radius * (up.z * cs + sn * (right.z * gx + fwd.z * gy)),
          )
          this.ball.center.copy(p)
          this.ball.radius = r * 3.2
          if (!this.frustum.intersectsSphere(this.ball)) continue
          const dist = p.distanceTo(eye)
          const size = (2 * r * focal) / dist
          if (size < 0.75) continue
          const level = size > lab.lod.px[0]! ? 0 : size > lab.lod.px[1]! ? 1 : 2
          this.order[level]!.push({ d: dist, i, ox, oy })
        }
      }
    }
    for (let l = 0; l < 3; l++) {
      const list = this.order[l]!
      list.sort((a, b) => a.d - b.d || a.i - b.i)
      const lv = this.levels[l]!
      const count = Math.min(list.length, lv.data.length / 4)
      for (let k = 0; k < count; k++) {
        const it = list[k]!
        lv.data[k * 4] = it.i
        lv.data[k * 4 + 1] = it.ox
        lv.data[k * 4 + 2] = it.oy
      }
      lv.count = count
      lv.geometry.instanceCount = count
      lv.list.needsUpdate = true
    }
    void renderer
    void formatUniform
  }

  dispose(): void {
    for (const part of this.parts) part.dispose()
    this.ramp.dispose()
    this.cellTexture.dispose()
  }
}
