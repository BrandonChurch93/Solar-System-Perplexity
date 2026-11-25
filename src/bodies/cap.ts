import * as THREE from 'three'

export interface CapLevel {
  height: THREE.DataTexture
  size: number
  count?: number
  widthDeg: number
  low: number
  high: number
  mask?: THREE.Texture
}

export interface CapOptions {
  levels: CapLevel[]
  border: [number, number]
  from: [number, number]
  cells: number
  pixel: number
  feather?: number
  fade?: [number, number]
  reachDeg?: number
  fine?: number
  light?: { relief: number; own: number; from?: number }
  detail?: CapDetail
  cull?: boolean
}

export interface CapDetail {
  text: string
  uniforms: Record<string, THREE.IUniform>
}

export function capDetail(d: CapDetail): string {
  if (!/\bvec4\s+groundDetail\s*\(\s*vec3\s+\w+\s*,\s*float\s+\w+\s*,\s*vec3\s+\w+\s*,\s*float\s+\w+\s*\)\s*\{/.test(d.text)) throw new Error('the detail of a cap defines vec4 groundDetail(vec3 dir, float height, vec3 normal, float texelPx)')
  for (const [word, found] of [['void main', /\bvoid\s+main\b/], ['discard', /\bdiscard\b/], ['outColor', /\boutColor\b/], ['gl_FragDepth', /\bgl_FragDepth\b/], ['a sampler', /sampler/]] as [string, RegExp][]) if (found.test(d.text)) throw new Error('the detail of a cap may not hold ' + word)
  const declared = [...d.text.matchAll(/\buniform\s+(?:(?:highp|mediump|lowp)\s+)?\w+\s+([^;]+);/g)].flatMap((m) => m[1]!.split(',').map((n) => n.replace(/\[[^\]]*\]/g, '').trim()))
  const given = Object.keys(d.uniforms)
  for (const n of [...declared, ...given]) if (!/^uDetail\w+$/.test(n)) throw new Error('a uniform of the detail of a cap is named uDetail and its own name, not ' + n)
  for (const n of declared) if (!given.includes(n)) throw new Error('the detail of a cap declares ' + n + ' and is not given it')
  for (const n of given) if (!declared.includes(n)) throw new Error('the detail of a cap is given ' + n + ' and does not declare it')
  if (new Set(declared).size !== declared.length) throw new Error('the detail of a cap declares a uniform twice')
  return d.text
}

export const CAP_PATCHES = 64
export const CAP_SAMPLERS = 10

export function capHeights(data: Uint16Array, size: number): THREE.DataTexture {
  if (data.length !== size * size) throw new Error('a height level must be square: ' + data.length + ' values for a side of ' + size)
  const mipmaps: { data: Uint16Array; width: number; height: number }[] = [{ data, width: size, height: size }]
  let from = data
  let n = size
  while (n > 1) {
    const m = Math.max(n >> 1, 1)
    const to = new Uint16Array(m * m)
    for (let y = 0; y < m; y++) {
      const a = Math.min(2 * y, n - 1) * n
      const b = Math.min(2 * y + 1, n - 1) * n
      for (let x = 0; x < m; x++) {
        const l = Math.min(2 * x, n - 1)
        const r = Math.min(2 * x + 1, n - 1)
        to[y * m + x] = (from[a + l]! + from[a + r]! + from[b + l]! + from[b + r]! + 2) >> 2
      }
    }
    mipmaps.push({ data: to, width: m, height: m })
    from = to
    n = m
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RedIntegerFormat, THREE.UnsignedShortType)
  tex.internalFormat = 'R16UI'
  tex.mipmaps = mipmaps as unknown as THREE.DataTexture['mipmaps']
  tex.generateMipmaps = false
  tex.minFilter = THREE.NearestMipmapNearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.unpackAlignment = 2
  tex.needsUpdate = true
  return tex
}

export const capHeightBytes = (size: number): number => {
  let bytes = 0
  for (let n = size; ; n = Math.max(n >> 1, 1)) {
    bytes += n * n * 2
    if (n === 1) break
  }
  return bytes
}

const scaleOf = (widthDeg: number): number => 1 / (2 * Math.tan(THREE.MathUtils.degToRad(widthDeg) / 2))

export function capGrids(widthsDeg: number[], reachDeg: number): number[] {
  const out: number[] = []
  let w = widthsDeg[0]!
  while (w < 2 * reachDeg) {
    w = Math.min(w * 2, 2 * reachDeg)
    out.unshift(w)
  }
  return [...out, ...widthsDeg]
}

export const capOverlap = (gridsDeg: number[], cells: number): number => {
  const patch = cells / CAP_PATCHES
  let most = 0
  for (let k = 1; k < gridsDeg.length; k++) most = Math.max(most, ((2 + patch) / cells) * (scaleOf(gridsDeg[k]!) / scaleOf(gridsDeg[k - 1]!)))
  return most
}

export function capPatches(gridsDeg: number[], cells: number): { ring: Float32Array; core: Float32Array }[] {
  if (cells % CAP_PATCHES !== 0) throw new Error('the cells of a cap are a multiple of ' + CAP_PATCHES)
  const patch = cells / CAP_PATCHES
  return gridsDeg.map((_, k) => {
    const ring: number[] = []
    const core: number[] = []
    const next = gridsDeg[k + 1]
    const inner = next === undefined ? -1 : 0.5 * scaleOf(gridsDeg[k]!) / scaleOf(next) - 2 / cells
    for (let j = 0; j < CAP_PATCHES; j++) {
      for (let i = 0; i < CAP_PATCHES; i++) {
        const x0 = (i * patch) / cells - 0.5
        const x1 = ((i + 1) * patch) / cells - 0.5
        const y0 = (j * patch) / cells - 0.5
        const y1 = ((j + 1) * patch) / cells - 0.5
        const inside = x0 >= -inner && x1 <= inner && y0 >= -inner && y1 <= inner
        ;(inside ? core : ring).push(i * patch, j * patch, k)
      }
    }
    return { ring: new Float32Array(ring), core: new Float32Array(core) }
  })
}

export function capCells(gridsDeg: number[], cells: number, finest = gridsDeg.length - 1): Float32Array {
  const patches = capPatches(gridsDeg, cells)
  const out: number[] = []
  for (let k = 0; k <= finest; k++) {
    out.push(...patches[k]!.ring)
    if (k === finest) out.push(...patches[k]!.core)
  }
  return new Float32Array(out)
}

export function capFinest(cellG: number[], halfG: number[], fine: number, pixel: number, height: number, footX: number, footY: number): number {
  let k = 0
  while (k + 1 < cellG.length) {
    const half = halfG[k + 1]!
    const away = Math.hypot(Math.max(Math.abs(footX) - half, 0), Math.max(Math.abs(footY) - half, 0))
    if (!(cellG[k]! > fine * pixel * Math.hypot(height, away))) break
    k++
  }
  return k
}

export interface CapSift { cells: number; scales: number[]; offs: number[]; n: THREE.Vector3; e: THREE.Vector3; u: THREE.Vector3; turn: THREE.Vector2; low: number; high: number }

export function capSift(from: Float32Array, count: number, to: Float32Array, s: CapSift, clip: THREE.Matrix4, slack: ArrayLike<number>, margin = 1 / 64): number {
  if (!(1 + s.low > 0)) {
    to.set(from.subarray(0, count * 3))
    return count
  }
  const m = clip.elements
  const c = s.turn.x
  const z = s.turn.y
  const lin = (v: THREE.Vector3): number[] => {
    const x = c * v.x + z * v.z
    const w = c * v.z - z * v.x
    return [0, 1, 2, 3].map((i) => m[i]! * x + m[i + 4]! * v.y + m[i + 8]! * w)
  }
  const cn = lin(s.n)
  const ce = lin(s.e)
  const cu = lin(s.u)
  const nn = s.n.dot(s.n)
  const ne = s.n.dot(s.e)
  const nu = s.n.dot(s.u)
  const ee = s.e.dot(s.e)
  const eu = s.e.dot(s.u)
  const uu = s.u.dot(s.u)
  const le = Math.sqrt(ee)
  const lu = Math.sqrt(uu)
  const len2 = (x: number, y: number): number => nn + 2 * x * ne + 2 * y * nu + x * x * ee + 2 * x * y * eu + y * y * uu
  const wide = 1 + margin
  const sx = slack[0]! + wide * slack[3]!
  const sy = slack[1]! + wide * slack[3]!
  const sz = slack[2]! + wide * slack[3]!
  const patch = s.cells / CAP_PATCHES
  let kept = 0
  for (let i = 0; i < count; i++) {
    const cx = from[i * 3]!
    const cy = from[i * 3 + 1]!
    const k = from[i * 3 + 2]!
    const off = s.offs[k]!
    const lim = s.cells - 2 * off
    const pad = (1e-3 * patch) / s.cells / s.scales[k]!
    const x0 = ((Math.min(cx, lim) + off) / s.cells - 0.5) / s.scales[k]! - pad
    const x1 = ((Math.min(cx + patch, lim) + off) / s.cells - 0.5) / s.scales[k]! + pad
    const y0 = ((Math.min(cy, lim) + off) / s.cells - 0.5) / s.scales[k]! - pad
    const y1 = ((Math.min(cy + patch, lim) + off) / s.cells - 0.5) / s.scales[k]! + pad
    const far = Math.sqrt(Math.max(len2(x0, y0), len2(x1, y0), len2(x0, y1), len2(x1, y1)))
    const near = Math.sqrt(len2(0.5 * (x0 + x1), 0.5 * (y0 + y1))) - 0.5 * (le * (x1 - x0) + lu * (y1 - y0))
    let out = near > 0 ? 31 : 0
    const lo = ((1 + s.low) / far) * (1 - 1e-6)
    const hi = ((1 + s.high) / near) * (1 + 1e-6)
    for (let j = 0; j < 8 && out !== 0; j++) {
      const gx = j & 1 ? x1 : x0
      const gy = j & 2 ? y1 : y0
      const r = j & 4 ? hi : lo
      const X = r * (cn[0]! + ce[0]! * gx + cu[0]! * gy) + m[12]!
      const Y = r * (cn[1]! + ce[1]! * gx + cu[1]! * gy) + m[13]!
      const Z = r * (cn[2]! + ce[2]! * gx + cu[2]! * gy) + m[14]!
      const W = wide * (r * (cn[3]! + ce[3]! * gx + cu[3]! * gy) + m[15]!)
      out &= (X - W > sx ? 1 : 0) | (-X - W > sx ? 2 : 0) | (Y - W > sy ? 4 : 0) | (-Y - W > sy ? 8 : 0) | (-Z - W > sz ? 16 : 0)
    }
    if (out !== 0) continue
    to[kept * 3] = cx
    to[kept * 3 + 1] = cy
    to[kept * 3 + 2] = k
    kept++
  }
  return kept
}

class CapLens extends THREE.LOD {
  constructor(private readonly look: (camera: THREE.Camera) => void) {
    super()
    this.layers.enableAll()
  }

  override update(camera: THREE.Camera): void {
    this.look(camera)
  }
}

const levelRead = (j: number, mask: boolean, count: boolean): string => `  {
    vec2 q = g * uCapScale[${j}];
    float w = 1.0 - smoothstep(0.5 - uCapFeather, 0.5, max(abs(q.x), abs(q.y)));${j > 0 ? `
    w *= 1.0 - smoothstep(uCapFade.x, uCapFade.y, foot * uCapScale[${j - 1}] * ${count ? 'uCapCount' : 'uCapSize'}[${j - 1}]);` : ''}
    if (w > 0.0) {
      float lod = log2(max(max(foot, cell) * uCapScale[${j}] * uCapSize[${j}], 1.0));
      float t = uCapLow[${j}] + capRead(uCapH${j}, vec2(q.x + 0.5, 0.5 - q.y), lod) * uCapSpan[${j}];${mask ? `
      if (sink > 0.0) t -= sink * textureLod(uCapM${j}, q + 0.5, lod).r;` : ''}
      h = mix(h, t, w);
    }
  }`

export const capVert = (masks: boolean[], grids: number, normal = false, count = false): string => /* glsl */ `
in vec3 aCell;
${masks.map((m, j) => 'uniform highp usampler2D uCapH' + j + ';' + (m ? '\nuniform sampler2D uCapM' + j + ';' : '')).join('\n')}
uniform float uCapScale[${masks.length}];
uniform float uCapSize[${masks.length}];${count ? `
uniform float uCapCount[${masks.length}];` : ''}
uniform float uCapLow[${masks.length}];
uniform float uCapSpan[${masks.length}];
uniform float uCapGrid[${grids}];
uniform float uCapOff[${grids}];
uniform float uCapCells;
uniform float uCapFeather;
uniform vec2 uCapEdge;
uniform vec2 uCapFade;
uniform vec2 uCapBorder;
uniform vec2 uCapSink;
uniform vec2 uCapFoot;
uniform float uCapPixel;
uniform float uCapOn;
uniform vec3 uSpotN;
uniform vec3 uSpotE;
uniform vec3 uSpotU;
uniform vec2 uSpinTurn;
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
out float vCapH;${normal ? `
out vec3 vCapN;` : ''}
float capTexel(highp usampler2D t, ivec2 p, int lod) {
  return float(texelFetch(t, clamp(p, ivec2(0), textureSize(t, lod) - 1), lod).r);
}
float capFlat(highp usampler2D t, vec2 uv, int lod) {
  vec2 x = uv * vec2(textureSize(t, lod)) - 0.5;
  ivec2 p = ivec2(floor(x));
  vec2 f = x - floor(x);
  return mix(mix(capTexel(t, p, lod), capTexel(t, p + ivec2(1, 0), lod), f.x), mix(capTexel(t, p + ivec2(0, 1), lod), capTexel(t, p + ivec2(1, 1), lod), f.x), f.y);
}
float capRead(highp usampler2D t, vec2 uv, float lod) {
  float top = log2(float(textureSize(t, 0).x));
  float l = clamp(lod, 0.0, top);
  int a = int(floor(l));
  float f = l - float(a);
  float v = capFlat(t, uv, a);
  if (f > 0.0) v = mix(v, capFlat(t, uv, int(min(float(a) + 1.0, top))), f);
  return v;
}
float capRaw(vec2 g, float foot, float cell, float sunk) {
  float h = 0.0;
  float sink = sunk * uCapSink.x * (1.0 - smoothstep(0.8 * uCapSink.y, uCapSink.y, length(g - uCapFoot)));
${masks.map((m, j) => levelRead(j, m, count)).join('\n')}
  return h;
}
void main() {
  int k = int(aCell.z + 0.5);
  float off = uCapOff[k];
  vec2 q = (min(aCell.xy + position.xy, uCapCells - 2.0 * off) + off) / uCapCells - 0.5;
  vec2 g = q / uCapGrid[k];
  float cell = 1.0 / (uCapCells * uCapGrid[k]);
  cell = mix(cell, 1.0 / (uCapCells * uCapGrid[max(k - 1, 0)]), smoothstep(uCapEdge.x, uCapEdge.y, max(abs(q.x), abs(q.y))));
  vec3 dm = normalize(uSpotN + uSpotE * g.x + uSpotU * g.y);
  float c = uSpinTurn.x, s = uSpinTurn.y;
  vec3 local = vec3(c * dm.x + s * dm.z, dm.y, c * dm.z - s * dm.x);
  float foot = uCapPixel * length((modelMatrix * vec4(local, 1.0)).xyz);
  float h = capRaw(g, foot, cell, 1.0) * (1.0 - smoothstep(uCapBorder.x, uCapBorder.y, length(g))) * uCapOn;
  vCapH = h;${normal ? `
  float e = 0.5 * max(foot, cell);
  float hx = (capRaw(g + vec2(e, 0.0), foot, cell, 0.0) - capRaw(g - vec2(e, 0.0), foot, cell, 0.0)) / (2.0 * e);
  float hy = (capRaw(g + vec2(0.0, e), foot, cell, 0.0) - capRaw(g - vec2(0.0, e), foot, cell, 0.0)) / (2.0 * e);
  float il = 1.0 / length(uSpotN + uSpotE * g.x + uSpotU * g.y);
  vec3 tx = (uSpotE - dm * dot(dm, uSpotE)) * il;
  vec3 ty = (uSpotU - dm * dot(dm, uSpotU)) * il;
  vec3 nm = normalize(cross(tx * (1.0 + h) + dm * hx, ty * (1.0 + h) + dm * hy));
  vCapN = normalize(mat3(modelMatrix) * vec3(c * nm.x + s * nm.z, nm.y, c * nm.z - s * nm.x));` : ''}
  vLocal = local;
  vWorldN = normalize(mat3(modelMatrix) * local);
  vec4 wp = modelMatrix * vec4(local * (1.0 + h), 1.0);
  vPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

export class ReliefCap {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  readonly cut: number
  readonly gridsDeg: number[]
  private readonly from: [number, number]
  private readonly patches: { ring: Float32Array; core: Float32Array }[]
  private readonly cells: THREE.InstancedBufferAttribute
  private readonly cellG: number[]
  private readonly halfG: number[]
  private readonly fine: number
  private readonly top: number
  private readonly highs: number[]
  private finest = -1
  private readonly lit: number | undefined
  readonly lens: THREE.Object3D | undefined
  private readonly all: Float32Array | undefined
  private count = 0
  private readonly sifted = new Float64Array(16)
  private readonly pv = new THREE.Matrix4()
  private readonly clip = new THREE.Matrix4()
  private readonly sift: CapSift | undefined

  constructor(fragmentShader: string, shared: Record<string, THREE.IUniform>, o: CapOptions) {
    const levels = o.levels
    if (levels.length === 0) throw new Error('a cap needs a height level')
    for (let j = 1; j < levels.length; j++) if (!(levels[j]!.widthDeg < levels[j - 1]!.widthDeg)) throw new Error('the height levels of a cap go coarse to fine')
    const masks = levels.map((l) => l.mask !== undefined)
    const counted = levels.some((l) => l.count !== undefined)
    if (levels.some((l) => l.count !== undefined && !(l.count > 0))) throw new Error('the count of a height level is a width above 0')
    if (levels.length + masks.filter((m) => m).length > CAP_SAMPLERS) throw new Error('too many height levels and masks for a cap')
    if (!(o.from[0] > o.from[1] && o.from[1] > 0)) throw new Error('a cap comes in between two heights, the higher first')
    if (!(o.border[1] > o.border[0])) throw new Error('the border of a cap is [inner, outer]')
    if (o.cells % CAP_PATCHES !== 0) throw new Error('the cells of a cap are a multiple of ' + CAP_PATCHES)
    this.from = o.from
    if (o.light?.from !== undefined && !(o.light.from > o.from[0])) throw new Error('a cap is lit from a height above its band')
    this.lit = o.light?.from
    this.gridsDeg = capGrids(levels.map((l) => l.widthDeg), o.reachDeg ?? levels[0]!.widthDeg / 2)
    const scales = this.gridsDeg.map(scaleOf)
    const skirts = scales.length - levels.length
    const offs = scales.map((_, k) => 0.5 * Math.max(1, o.cells / levels[Math.max(k - skirts, 0)]!.size))
    this.cut = (0.5 - (offs[0]! + 1) / o.cells) / scales[0]!
    const overlap = capOverlap(this.gridsDeg, o.cells)
    if (overlap > 0.2) throw new Error('too few cells for the levels of this cap')
    const geometry = new THREE.InstancedBufferGeometry()
    const patch = o.cells / CAP_PATCHES
    const side = patch + 1
    const position = new Float32Array(side * side * 3)
    for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) position.set([i, j, 0], (j * side + i) * 3)
    const index: number[] = []
    for (let j = 0; j < patch; j++) {
      for (let i = 0; i < patch; i++) {
        const a = j * side + i
        index.push(a, a + 1, a + side + 1, a, a + side + 1, a + side)
      }
    }
    this.patches = capPatches(this.gridsDeg, o.cells)
    this.cells = new THREE.InstancedBufferAttribute(new Float32Array(this.patches.reduce((n, p) => n + p.ring.length, 0) + Math.max(...this.patches.map((p) => p.core.length))), 3)
    this.cells.setUsage(THREE.DynamicDrawUsage)
    this.cellG = scales.map((x) => 1 / (o.cells * x))
    this.halfG = scales.map((x) => 0.5 / x)
    this.fine = o.fine ?? 1
    this.top = Math.max(0, ...levels.map((l) => l.high))
    this.highs = levels.map((l) => l.high)
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setIndex(index)
    geometry.setAttribute('aCell', this.cells)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: capVert(masks, scales.length, o.light !== undefined || o.detail !== undefined, counted),
      fragmentShader,
      uniforms: {
        ...shared,
        ...Object.fromEntries(levels.map((l, j) => ['uCapH' + j, { value: l.height }])),
        ...Object.fromEntries(levels.flatMap((l, j) => (l.mask ? [['uCapM' + j, { value: l.mask }]] : []))),
        uCapScale: { value: levels.map((l) => scaleOf(l.widthDeg)) },
        uCapSize: { value: levels.map((l) => l.size) },
        ...(counted ? { uCapCount: { value: levels.map((l) => l.count ?? l.size) } } : {}),
        uCapLow: { value: levels.map((l) => l.low) },
        uCapSpan: { value: levels.map((l) => (l.high - l.low) / 65535) },
        uCapGrid: { value: scales },
        uCapOff: { value: offs },
        uCapCells: { value: o.cells },
        uCapFeather: { value: o.feather ?? 0.12 },
        uCapEdge: { value: overlap > 0 ? new THREE.Vector2(0.5 - 2 * overlap, 0.5 - overlap) : new THREE.Vector2(1, 2) },
        uCapFade: { value: new THREE.Vector2(o.fade?.[0] ?? 1, o.fade?.[1] ?? 2) },
        uCapBorder: { value: new THREE.Vector2(o.border[0], o.border[1]) },
        uCapSink: { value: new THREE.Vector2(0, 1) },
        uCapFoot: { value: new THREE.Vector2() },
        uCapPixel: { value: o.pixel },
        uCapOn: { value: 0 },
        ...(o.light ? { uCapLight: { value: new THREE.Vector2(o.light.relief, o.light.own) } } : {}),
        ...(o.detail ? { ...o.detail.uniforms, uFrame: { value: 1 } } : {}),
      },
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.visible = false
    if (o.cull) {
      this.all = new Float32Array(this.cells.array.length)
      this.sift = { cells: o.cells, scales, offs, n: shared.uSpotN!.value as THREE.Vector3, e: shared.uSpotE!.value as THREE.Vector3, u: shared.uSpotU!.value as THREE.Vector3, turn: shared.uSpinTurn!.value as THREE.Vector2, low: 0, high: 0 }
      this.lens = new CapLens((camera) => this.look(camera))
      this.mesh.onBeforeRender = (_r, _s, camera) => {
        const e = this.pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.mesh.matrixWorld).elements
        for (let i = 0; i < 16; i++) if (e[i] !== this.sifted[i]) throw new Error('a cap with cull is drawn through a lens that did not sift it: its lens object goes into the scene before its mesh')
      }
    }
    this.draw(scales.length - 1)
  }

  private draw(finest: number): void {
    if (finest === this.finest) return
    this.finest = finest
    const to = this.all ?? (this.cells.array as Float32Array)
    let n = 0
    for (let k = 0; k <= finest; k++) {
      to.set(this.patches[k]!.ring, n)
      n += this.patches[k]!.ring.length
      if (k === finest) {
        to.set(this.patches[k]!.core, n)
        n += this.patches[k]!.core.length
      }
    }
    this.count = n / 3
    if (this.all) return
    this.cells.needsUpdate = true
    ;(this.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = n / 3
  }

  private look(camera: THREE.Camera): void {
    const s = this.sift
    if (!s || !this.all || !this.mesh.visible) return
    const u = this.material.uniforms
    s.n = u.uSpotN!.value as THREE.Vector3
    s.e = u.uSpotE!.value as THREE.Vector3
    s.u = u.uSpotU!.value as THREE.Vector3
    s.turn = u.uSpinTurn!.value as THREE.Vector2
    const sink = (u.uCapSink!.value as THREE.Vector2).x
    const on = u.uCapOn!.value as number
    s.low = (Math.min(0, ...(u.uCapLow!.value as number[]), ...this.highs) - Math.max(sink, 0)) * on
    s.high = (Math.max(0, ...(u.uCapLow!.value as number[]), ...this.highs) + Math.max(-sink, 0)) * on
    const w = this.mesh.matrixWorld
    const at = camera.matrixWorld.elements
    const err = 1e-6 * (Math.hypot(w.elements[12]!, w.elements[13]!, w.elements[14]!) + 2 * w.getMaxScaleOnAxis() + Math.hypot(at[12]!, at[13]!, at[14]!))
    const p = camera.projectionMatrix.elements
    const slack = [0, 1, 2, 3].map((i) => (Math.abs(p[i]!) + Math.abs(p[i + 4]!) + Math.abs(p[i + 8]!)) * err)
    this.sifted.set(this.clip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(w).elements)
    ;(this.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = capSift(this.all, this.count, this.cells.array as Float32Array, s, this.clip, slack)
    this.cells.needsUpdate = true
  }

  get grids(): number {
    return this.finest + 1
  }

  share(height: number): number {
    const s = Math.min(Math.max((Math.log(Math.max(height, 1e-12)) - Math.log(this.from[1])) / (Math.log(this.from[0]) - Math.log(this.from[1])), 0), 1)
    return 1 - s * s * (3 - 2 * s)
  }

  update(height: number, foot: THREE.Vector2): boolean {
    const on = this.share(height)
    ;(this.material.uniforms.uCapFoot!.value as THREE.Vector2).copy(foot)
    this.material.uniforms.uCapOn!.value = on
    const drawn = on > 0 || (this.lit !== undefined && height < this.lit)
    this.mesh.visible = drawn
    if (drawn) this.draw(this.fine > 0 ? capFinest(this.cellG, this.halfG, this.fine, this.material.uniforms.uCapPixel!.value as number, Math.max(height - this.top, 0), foot.x, foot.y) : this.gridsDeg.length - 1)
    return drawn
  }

  setSink(depth: number, radius: number): void {
    if (!(radius > 0)) throw new Error('the sink of a cap needs a radius above 0')
    ;(this.material.uniforms.uCapSink!.value as THREE.Vector2).set(depth, radius)
  }

  setLight(relief: number, own: number): void {
    const u = this.material.uniforms.uCapLight
    if (!u) throw new Error('this cap has no light of its own: set light in its options')
    ;(u.value as THREE.Vector2).set(relief, own)
  }

  setPixel(radians: number): void {
    this.material.uniforms.uCapPixel!.value = radians
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
