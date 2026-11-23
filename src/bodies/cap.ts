import * as THREE from 'three'

export interface CapLevel {
  height: THREE.DataTexture
  size: number
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

export function capCells(gridsDeg: number[], cells: number): Float32Array {
  if (cells % CAP_PATCHES !== 0) throw new Error('the cells of a cap are a multiple of ' + CAP_PATCHES)
  const patch = cells / CAP_PATCHES
  const out: number[] = []
  for (let k = 0; k < gridsDeg.length; k++) {
    const next = gridsDeg[k + 1]
    const inner = next === undefined ? -1 : 0.5 * scaleOf(gridsDeg[k]!) / scaleOf(next) - 2 / cells
    for (let j = 0; j < CAP_PATCHES; j++) {
      for (let i = 0; i < CAP_PATCHES; i++) {
        const x0 = (i * patch) / cells - 0.5
        const x1 = ((i + 1) * patch) / cells - 0.5
        const y0 = (j * patch) / cells - 0.5
        const y1 = ((j + 1) * patch) / cells - 0.5
        if (x0 >= -inner && x1 <= inner && y0 >= -inner && y1 <= inner) continue
        out.push(i * patch, j * patch, k)
      }
    }
  }
  return new Float32Array(out)
}

const levelRead = (j: number, mask: boolean): string => `  {
    vec2 q = g * uCapScale[${j}];
    float w = 1.0 - smoothstep(0.5 - uCapFeather, 0.5, max(abs(q.x), abs(q.y)));${j > 0 ? `
    w *= 1.0 - smoothstep(uCapFade.x, uCapFade.y, foot * uCapScale[${j - 1}] * uCapSize[${j - 1}]);` : ''}
    if (w > 0.0) {
      float lod = log2(max(max(foot, cell) * uCapScale[${j}] * uCapSize[${j}], 1.0));
      float t = uCapLow[${j}] + capRead(uCapH${j}, vec2(q.x + 0.5, 0.5 - q.y), lod) * uCapSpan[${j}];${mask ? `
      t -= sink * textureLod(uCapM${j}, q + 0.5, lod).r;` : ''}
      h = mix(h, t, w);
    }
  }`

export const capVert = (masks: boolean[], grids: number): string => /* glsl */ `
in vec3 aCell;
${masks.map((m, j) => 'uniform highp usampler2D uCapH' + j + ';' + (m ? '\nuniform sampler2D uCapM' + j + ';' : '')).join('\n')}
uniform float uCapScale[${masks.length}];
uniform float uCapSize[${masks.length}];
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
uniform float uSpin;
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
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
  int b = int(min(float(a) + 1.0, top));
  return mix(capFlat(t, uv, a), capFlat(t, uv, b), l - float(a));
}
float capHeight(vec2 g, float foot, float cell) {
  float h = 0.0;
  float sink = uCapSink.x * (1.0 - smoothstep(0.8 * uCapSink.y, uCapSink.y, length(g - uCapFoot)));
${masks.map((m, j) => levelRead(j, m)).join('\n')}
  return h * (1.0 - smoothstep(uCapBorder.x, uCapBorder.y, length(g))) * uCapOn;
}
void main() {
  int k = int(aCell.z + 0.5);
  float off = uCapOff[k];
  vec2 q = (min(aCell.xy + position.xy, uCapCells - 2.0 * off) + off) / uCapCells - 0.5;
  vec2 g = q / uCapGrid[k];
  float cell = 1.0 / (uCapCells * uCapGrid[k]);
  cell = mix(cell, 1.0 / (uCapCells * uCapGrid[max(k - 1, 0)]), smoothstep(uCapEdge.x, uCapEdge.y, max(abs(q.x), abs(q.y))));
  vec3 dm = normalize(uSpotN + uSpotE * g.x + uSpotU * g.y);
  float c = cos(uSpin), s = sin(uSpin);
  vec3 local = vec3(c * dm.x + s * dm.z, dm.y, c * dm.z - s * dm.x);
  float foot = uCapPixel * length((modelMatrix * vec4(local, 1.0)).xyz);
  float h = capHeight(g, foot, cell);
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

  constructor(fragmentShader: string, shared: Record<string, THREE.IUniform>, o: CapOptions) {
    const levels = o.levels
    if (levels.length === 0) throw new Error('a cap needs a height level')
    for (let j = 1; j < levels.length; j++) if (!(levels[j]!.widthDeg < levels[j - 1]!.widthDeg)) throw new Error('the height levels of a cap go coarse to fine')
    const masks = levels.map((l) => l.mask !== undefined)
    if (levels.length + masks.filter((m) => m).length > CAP_SAMPLERS) throw new Error('too many height levels and masks for a cap')
    if (!(o.from[0] > o.from[1] && o.from[1] > 0)) throw new Error('a cap comes in between two heights, the higher first')
    if (!(o.border[1] > o.border[0])) throw new Error('the border of a cap is [inner, outer]')
    if (o.cells % CAP_PATCHES !== 0) throw new Error('the cells of a cap are a multiple of ' + CAP_PATCHES)
    this.from = o.from
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
    const cells = capCells(this.gridsDeg, o.cells)
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setIndex(index)
    geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 3))
    geometry.instanceCount = cells.length / 3
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: capVert(masks, scales.length),
      fragmentShader,
      uniforms: {
        ...shared,
        ...Object.fromEntries(levels.map((l, j) => ['uCapH' + j, { value: l.height }])),
        ...Object.fromEntries(levels.flatMap((l, j) => (l.mask ? [['uCapM' + j, { value: l.mask }]] : []))),
        uCapScale: { value: levels.map((l) => scaleOf(l.widthDeg)) },
        uCapSize: { value: levels.map((l) => l.size) },
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
      },
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.visible = false
  }

  share(height: number): number {
    const s = Math.min(Math.max((Math.log(Math.max(height, 1e-12)) - Math.log(this.from[1])) / (Math.log(this.from[0]) - Math.log(this.from[1])), 0), 1)
    return 1 - s * s * (3 - 2 * s)
  }

  update(height: number, foot: THREE.Vector2): boolean {
    const on = this.share(height)
    ;(this.material.uniforms.uCapFoot!.value as THREE.Vector2).copy(foot)
    this.material.uniforms.uCapOn!.value = on
    this.mesh.visible = on > 0
    return on > 0
  }

  setSink(depth: number, radius: number): void {
    if (!(radius > 0)) throw new Error('the sink of a cap needs a radius above 0')
    ;(this.material.uniforms.uCapSink!.value as THREE.Vector2).set(depth, radius)
  }

  setPixel(radians: number): void {
    this.material.uniforms.uCapPixel!.value = radians
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
