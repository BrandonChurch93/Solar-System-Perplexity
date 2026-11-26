import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { CAP_PATCHES, capCells, capGrids, capHeights, capSift, type CapOptions, type CapSift } from '../src/bodies/cap'
import { Planet } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'

const rad = (deg: number): number => (deg * Math.PI) / 180
const scaleOf = (widthDeg: number): number => 1 / (2 * Math.tan(rad(widthDeg) / 2))
const CELLS = 256
const PATCH = CELLS / CAP_PATCHES
const grids = capGrids([8.5, 3.8, 1.6], 4.25)
const all = capCells(grids, CELLS)
const count = all.length / 3

function lay(turn: number): CapSift {
  const n = new THREE.Vector3(0.3, 0.5, 0.81).normalize()
  const e = new THREE.Vector3(0, 1, 0).cross(n).normalize()
  const u = n.clone().cross(e).normalize()
  return { cells: CELLS, scales: grids.map(scaleOf), offs: grids.map(() => 0.5), n, e, u, turn: new THREE.Vector2(Math.cos(turn), Math.sin(turn)), low: -0.002, high: 0.001 }
}

const local = (s: CapSift, gx: number, gy: number, h: number): THREE.Vector3 => {
  const d = s.n.clone().addScaledVector(s.e, gx).addScaledVector(s.u, gy).normalize()
  return new THREE.Vector3(s.turn.x * d.x + s.turn.y * d.z, d.y, s.turn.x * d.z - s.turn.y * d.x).multiplyScalar(1 + h)
}

function lens(s: CapSift, world: THREE.Matrix4, gx: number, gy: number, height: number, yaw: number, pitch: number, vfov: number, shift: [number, number]): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(vfov, 16 / 9, 1e-5, 100)
  const at = local(s, gx, gy, height).applyMatrix4(world)
  const up = local(s, gx, gy, height + 1).applyMatrix4(world).sub(at).normalize()
  const ahead = local(s, gx + 0.01 * Math.cos(yaw), gy + 0.01 * Math.sin(yaw), height).applyMatrix4(world).sub(at).normalize()
  cam.position.copy(at)
  cam.up.copy(up)
  cam.lookAt(at.clone().add(ahead).addScaledVector(up, Math.tan(pitch)))
  cam.setViewOffset(1920, 1080, shift[0], shift[1], 1920, 1080)
  cam.updateMatrixWorld(true)
  return cam
}

const inside = (v: THREE.Vector4): boolean => v.w > 0 && Math.abs(v.x) <= v.w && Math.abs(v.y) <= v.w && v.z >= -v.w

describe('the sift of a cap by the lens', () => {
  it('drops no patch that holds a point inside the lens, keeps the order of the rest, and drops most of them close to the ground', () => {
    const world = new THREE.Matrix4().compose(new THREE.Vector3(2, -1, 0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.4, 0.1)), new THREE.Vector3(3, 3, 3))
    const views: [number, number, number, number, number, number, [number, number]][] = [
      [0, 0, 0.0015, 0.3, 0, 40, [0, 0]], [0.004, -0.002, 0.0011, 2.1, -0.2, 25, [0.4, -0.3]], [-0.01, 0.006, 0.004, 4, -0.5, 60, [0, 0]],
      [0.02, 0.02, 0.01, 5.2, -1.2, 30, [-0.25, 0.25]], [0, 0, 0.3, 1, -1.5, 8, [0, 0]], [0.05, -0.03, 0.02, 3.3, 0.1, 70, [0, 0]],
    ]
    let close = 0
    for (const turn of [0, 0.7]) {
      const s = lay(turn)
      for (const v of views) {
        const cam = lens(s, world, ...v)
        const clip = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(world)
        const to = new Float32Array(all.length)
        const kept = capSift(all, count, to, s, clip, [0, 0, 0, 0])
        let at = 0
        let wrong = 0
        for (let i = 0; i < count; i++) {
          const same = at < kept && to[at * 3] === all[i * 3] && to[at * 3 + 1] === all[i * 3 + 1] && to[at * 3 + 2] === all[i * 3 + 2]
          if (same) {
            at++
            continue
          }
          const k = all[i * 3 + 2]!
          const lim = CELLS - 2 * s.offs[k]!
          for (let j = 0; j <= PATCH; j++) {
            for (let x = 0; x <= PATCH; x++) {
              const gx = ((Math.min(all[i * 3]! + x, lim) + s.offs[k]!) / CELLS - 0.5) / s.scales[k]!
              const gy = ((Math.min(all[i * 3 + 1]! + j, lim) + s.offs[k]!) / CELLS - 0.5) / s.scales[k]!
              for (const h of [s.low, 0, s.high]) if (inside(new THREE.Vector4(...local(s, gx, gy, h).toArray(), 1).applyMatrix4(clip))) wrong++
            }
          }
        }
        expect(at).toBe(kept)
        expect(wrong).toBe(0)
        expect(kept).toBeGreaterThan(0)
        if (kept < 0.5 * count) close++
      }
    }
    expect(close).toBeGreaterThanOrEqual(8)
  }, 60000)

  it('keeps every patch where the lowest ground would reach the centre', () => {
    const s = { ...lay(0), low: -1 }
    const to = new Float32Array(all.length)
    expect(capSift(all, count, to, s, new THREE.Matrix4().makeTranslation(50, 0, 0), [0, 0, 0, 0])).toBe(count)
    expect(Array.from(to)).toEqual(Array.from(all))
  })

  it('is off by default: no lens object, the same shader text, and with `cull` a lens before the mesh that sifts by the camera of the draw', () => {
    const level = (widthDeg: number): CapOptions['levels'][number] => ({ height: capHeights(new Uint16Array(16), 4), size: 4, widthDeg, low: -0.002, high: 0.001 })
    const options = (o: Partial<CapOptions> = {}): CapOptions => ({ levels: [8.5, 3.8, 1.6].map(level), border: [0.065, 0.074], from: [2, 1.2], cells: 128, pixel: 2e-4, ...o })
    const planet = (cap: CapOptions): Planet => {
      const t = new THREE.Texture()
      return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing, cap })
    }
    const off = planet(options())
    const on = planet(options({ cull: true }))
    expect(off.cap!.lens).toBeUndefined()
    expect(off.mesh.children).toEqual([off.cap!.mesh])
    expect(off.cap!.mesh.onBeforeRender).toBe(THREE.Object3D.prototype.onBeforeRender)
    expect(on.cap!.material.vertexShader).toBe(off.cap!.material.vertexShader)
    expect(on.cap!.material.fragmentShader).toBe(off.cap!.material.fragmentShader)
    expect(Object.keys(on.cap!.material.uniforms)).toEqual(Object.keys(off.cap!.material.uniforms))
    expect(on.mesh.children).toEqual([on.cap!.lens, on.cap!.mesh])
    expect((on.cap!.lens as THREE.LOD).isLOD).toBe(true)
    expect((on.cap!.lens as THREE.LOD).autoUpdate).toBe(true)
    expect(on.cap!.lens!.layers.mask).toBe(-1)
    const eye = new THREE.Vector3(0, 0, 1.01)
    for (const p of [off, on]) p.update(eye, new THREE.Vector3(1, 0, 0), 0, 1, 1)
    const geometry = (p: Planet): THREE.InstancedBufferGeometry => p.cap!.mesh.geometry as THREE.InstancedBufferGeometry
    const cam = new THREE.PerspectiveCamera(40, 16 / 9, 1e-4, 10)
    cam.position.copy(eye)
    cam.lookAt(new THREE.Vector3(1, 0, 1.01))
    cam.updateMatrixWorld(true)
    const draw = (p: Planet): void => (p.cap!.mesh.onBeforeRender as unknown as (r: null, s: null, c: THREE.Camera) => void)(null, null, cam)
    expect(() => draw(on)).toThrow('a cap with cull is drawn through a lens that did not sift it')
    ;(on.cap!.lens as THREE.LOD).update(cam)
    expect(() => draw(on)).not.toThrow()
    expect(geometry(on).instanceCount).toBeGreaterThan(0)
    expect(geometry(on).instanceCount).toBeLessThan(0.5 * geometry(off).instanceCount)
    cam.setViewOffset(1920, 1080, 0.3, 0.1, 1920, 1080)
    expect(() => draw(on)).toThrow('did not sift it')
    for (const p of [off, on]) p.dispose()
  })
})
