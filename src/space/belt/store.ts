import * as THREE from 'three'

interface RockEntry { size: number; aux: number; lo: number; hi: number }
interface Manifest { rocks: Record<string, RockEntry>; detail: { size: number; slope: number } }

export interface RockAsset { map: THREE.CubeTexture; height: THREE.CubeTexture; ao: THREE.CubeTexture; size: number; aux: number; radii: Float32Array }

function cube(data: Uint8Array | Uint16Array, size: number, channels: number, format: THREE.PixelFormat, type: THREE.TextureDataType, mips: boolean): THREE.CubeTexture {
  const len = size * size * channels
  const faces: THREE.DataTexture[] = []
  for (let i = 0; i < 6; i++) faces.push(new THREE.DataTexture(data.subarray(i * len, (i + 1) * len), size, size, format, type))
  const tex = new THREE.CubeTexture(faces as unknown as HTMLImageElement[])
  tex.format = format
  tex.type = type
  tex.colorSpace = THREE.NoColorSpace
  tex.generateMipmaps = mips
  tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.flipY = false
  tex.unpackAlignment = 1
  tex.needsUpdate = true
  return tex
}

export function radiusAt(radii: Float32Array, n: number, x: number, y: number, z: number): number {
  const ax = Math.abs(x)
  const ay = Math.abs(y)
  const az = Math.abs(z)
  let face = 0
  let sc = 0
  let tc = 0
  let ma = 1
  if (ax >= ay && ax >= az) {
    ma = ax
    face = x > 0 ? 0 : 1
    sc = x > 0 ? -z : z
    tc = -y
  } else if (ay >= az) {
    ma = ay
    face = y > 0 ? 2 : 3
    sc = x
    tc = y > 0 ? z : -z
  } else {
    ma = az
    face = z > 0 ? 4 : 5
    sc = z > 0 ? x : -x
    tc = -y
  }
  const fx = Math.min(Math.max((sc / ma + 1) * 0.5 * n - 0.5, 0), n - 1)
  const fy = Math.min(Math.max((tc / ma + 1) * 0.5 * n - 0.5, 0), n - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, n - 1)
  const y1 = Math.min(y0 + 1, n - 1)
  const tx = fx - x0
  const ty = fy - y0
  const o = face * n * n
  return (radii[o + y0 * n + x0]! * (1 - tx) + radii[o + y0 * n + x1]! * tx) * (1 - ty) + (radii[o + y1 * n + x0]! * (1 - tx) + radii[o + y1 * n + x1]! * tx) * ty
}

export function rockGeometry(n: number, radii: Float32Array, aux: number): THREE.BufferGeometry {
  const m = n + 1
  const seen = new Map<number, number>()
  const pos: number[] = []
  const tri: number[] = []
  const warp = (i: number): number => Math.tan(((i / n) * 2 - 1) * (Math.PI / 4))
  const c = [0, 0, 0]
  const vertex = (): number => {
    const key = (c[0]! * m + c[1]!) * m + c[2]!
    let v = seen.get(key)
    if (v === undefined) {
      let x = warp(c[0]!)
      let y = warp(c[1]!)
      let z = warp(c[2]!)
      const l = Math.hypot(x, y, z)
      x /= l
      y /= l
      z /= l
      const r = radiusAt(radii, aux, x, y, z)
      v = pos.length / 3
      pos.push(x * r, y * r, z * r)
      seen.set(key, v)
    }
    return v
  }
  for (let axis = 0; axis < 3; axis++) {
    const e1 = (axis + 1) % 3
    const e2 = (axis + 2) % 3
    for (const side of [0, n]) {
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          const at = (da: number, db: number): number => {
            c[axis] = side
            c[e1] = a + da
            c[e2] = b + db
            return vertex()
          }
          const v00 = at(0, 0)
          const v10 = at(1, 0)
          const v11 = at(1, 1)
          const v01 = at(0, 1)
          if (side > 0) tri.push(v00, v10, v11, v00, v11, v01)
          else tri.push(v00, v11, v10, v00, v01, v11)
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(tri), 1))
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.01)
  return geo
}

export class BeltStore {
  readonly rocks = new Map<string, RockAsset>()
  detail: THREE.DataTexture | null = null
  bytes = 0

  static async load(assets: string, anisotropy: number): Promise<BeltStore> {
    const base = new URL('./assets/shared/belt/' + assets + '/', document.baseURI)
    const get = async (name: string): Promise<ArrayBuffer> => {
      const res = await fetch(new URL(name, base))
      if (!res.ok) throw new Error('belt asset missing: ' + name)
      return res.arrayBuffer()
    }
    const store = new BeltStore()
    const man = JSON.parse(new TextDecoder().decode(await get('manifest.json'))) as Manifest
    const tile = new Uint8Array(await get('detail.bin'))
    const ts = man.detail.size
    const detail = new THREE.DataTexture(tile, ts, ts, THREE.RGBAFormat, THREE.UnsignedByteType)
    detail.colorSpace = THREE.NoColorSpace
    detail.wrapS = THREE.RepeatWrapping
    detail.wrapT = THREE.RepeatWrapping
    detail.generateMipmaps = true
    detail.minFilter = THREE.LinearMipmapLinearFilter
    detail.magFilter = THREE.LinearFilter
    detail.anisotropy = Math.min(4, anisotropy)
    detail.needsUpdate = true
    store.detail = detail
    store.bytes += ts * ts * 4 * (4 / 3)
    for (const [id, e] of Object.entries(man.rocks)) {
      const map = new Uint8Array(await get('rock-' + id + '.map.bin'))
      const auxBuf = await get('rock-' + id + '.aux.bin')
      const count = 6 * e.aux * e.aux
      const h16 = new Uint16Array(auxBuf, 0, count)
      const ao = new Uint8Array(auxBuf, count * 2, count)
      const radii = new Float32Array(count)
      const half = new Uint16Array(count)
      for (let i = 0; i < count; i++) {
        radii[i] = e.lo + ((e.hi - e.lo) * h16[i]!) / 65535
        half[i] = THREE.DataUtils.toHalfFloat(radii[i]!)
      }
      store.rocks.set(id, {
        map: cube(map, e.size, 4, THREE.RGBAFormat, THREE.UnsignedByteType, true),
        height: cube(half, e.aux, 1, THREE.RedFormat, THREE.HalfFloatType, false),
        ao: cube(ao, e.aux, 1, THREE.RedFormat, THREE.UnsignedByteType, false),
        size: e.size,
        aux: e.aux,
        radii,
      })
      store.bytes += 6 * e.size * e.size * 4 * (4 / 3) + count * 3
    }
    return store
  }

  dispose(): void {
    this.detail?.dispose()
    for (const r of this.rocks.values()) {
      r.map.dispose()
      r.height.dispose()
      r.ao.dispose()
    }
    this.rocks.clear()
  }
}
