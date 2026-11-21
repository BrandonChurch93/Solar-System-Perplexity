import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { HAZE_DISC, hazeHidden, keepTriangles } from '../src/bodies/trim'
import { stream } from '../src/core/random'

function discarded(p: THREE.Vector3, cam: THREE.Vector3): boolean {
  const f = Math.fround
  const len = f(Math.sqrt(f(f(f(p.x * p.x) + f(p.y * p.y)) + f(p.z * p.z))))
  const dx = f(p.x / len)
  const dy = f(p.y / len)
  const dz = f(p.z / len)
  const r = f(Math.sqrt(f(f(f(cam.x * cam.x) + f(cam.y * cam.y)) + f(cam.z * cam.z))))
  const b = f(-f(f(f(cam.x * dx) + f(cam.y * dy)) + f(cam.z * dz)))
  const rt2 = f(f(r * r) - f(b * b))
  return b > 0 && rt2 < f(HAZE_DISC)
}

describe('haze shell trim', () => {
  it('drops only triangles whose every point the shader discards, and keeps the order', () => {
    const rnd = stream('trim-test').next
    const geo = new THREE.SphereGeometry(1.13, 48, 24)
    const position = geo.getAttribute('position').array
    const index = geo.getIndex()!.array
    const hidden = new Uint8Array(position.length / 3)
    const out = new Uint16Array(index.length)
    let dropped = 0
    for (const distance of [0.9, 1.05, 1.5, 3, 12, 60]) {
      const cam = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(distance)
      const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)).setPosition(cam.clone().negate())
      const local = cam.clone()
      hazeHidden(position, m.elements, local.x, local.y, local.z, hidden)
      const n = keepTriangles(index, hidden, out)
      let k = 0
      const a = new THREE.Vector3()
      const b = new THREE.Vector3()
      const c = new THREE.Vector3()
      const p = new THREE.Vector3()
      for (let t = 0; t < index.length; t += 3) {
        const kept = k < n && out[k] === index[t] && out[k + 1] === index[t + 1] && out[k + 2] === index[t + 2]
        if (kept) {
          k += 3
          continue
        }
        dropped++
        a.fromArray(position, index[t]! * 3).applyMatrix4(m)
        b.fromArray(position, index[t + 1]! * 3).applyMatrix4(m)
        c.fromArray(position, index[t + 2]! * 3).applyMatrix4(m)
        for (let s = 0; s < 12; s++) {
          let u = rnd()
          let v = rnd()
          if (u + v > 1) {
            u = 1 - u
            v = 1 - v
          }
          p.copy(a).multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v)
          expect(discarded(p, local)).toBe(true)
        }
      }
      expect(k).toBe(n)
    }
    expect(dropped).toBeGreaterThan(1000)
  })

  it('keeps everything when no vertex is hidden', () => {
    const index = new Uint16Array([0, 1, 2, 2, 1, 3])
    const out = new Uint16Array(6)
    expect(keepTriangles(index, new Uint8Array([1, 1, 0, 1]), out)).toBe(6)
    expect(Array.from(out)).toEqual([0, 1, 2, 2, 1, 3])
    expect(keepTriangles(index, new Uint8Array([1, 1, 1, 0]), out)).toBe(3)
    expect(Array.from(out.subarray(0, 3))).toEqual([2, 1, 3])
  })
})
