import * as THREE from 'three'

export interface Line { nx: number; ny: number; at: number; radius?: number }

export function limbLine(centre: THREE.Vector3, tanHalf: number): Line {
  const dist = centre.length()
  const theta = Math.acos(THREE.MathUtils.clamp(-centre.z / dist, -1, 1))
  const alpha = Math.asin(Math.min(1 / dist, 1))
  const len = Math.hypot(centre.x, centre.y)
  const gap = THREE.MathUtils.clamp(alpha - theta, -1.4, 1.4)
  return { nx: len > 1e-6 ? -centre.x / len : 0, ny: len > 1e-6 ? -centre.y / len : 1, at: Math.tan(gap) / tanHalf }
}

export function above(line: Line, x: number, y: number): [number, number] {
  return [x * line.nx + y * line.ny - line.at, x * line.ny - y * line.nx]
}

export function place(line: Line, lift: number, slide: number): [number, number] {
  return [line.nx * (line.at + lift) + line.ny * slide, line.ny * (line.at + lift) - line.nx * slide]
}

export function ride(sun: THREE.Vector3, line: Line, tanHalf: number, rest: [number, number], w: number): THREE.Vector3 {
  const z = Math.max(-sun.z, 0.05)
  const [lift, slide] = above(line, sun.x / z / tanHalf, sun.y / z / tanHalf)
  const held = lift + (Math.max(lift, rest[0]) - lift) * Math.min(1, 20 * w)
  const [x, y] = place(line, held + (rest[0] - held) * w, slide + (rest[1] - slide) * w)
  return sun.set(x * tanHalf, y * tanHalf, -1).normalize()
}

export function skyline(pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, up: THREE.Vector3, dipDeg: number, far: number): Line {
  const tan = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const alpha = Math.PI / 2 - THREE.MathUtils.degToRad(dipDeg)
  const n = up.clone().negate()
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
  const u = f.addScaledVector(n, -f.dot(n)).normalize()
  const v = new THREE.Vector3().crossVectors(n, u)
  const inv = pose.quaternion.clone().invert()
  const [a, b, c] = [-0.5, 0, 0.5].map((az) => {
    const r = n.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(u, Math.cos(az) * Math.sin(alpha)).addScaledVector(v, Math.sin(az) * Math.sin(alpha)).multiplyScalar(far).sub(pose.position).applyQuaternion(inv)
    return [r.x / -r.z / tan, r.y / -r.z / tan] as [number, number]
  }) as [[number, number], [number, number], [number, number]]
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  const qa = a[0] * a[0] + a[1] * a[1]
  const qb = b[0] * b[0] + b[1] * b[1]
  const qc = c[0] * c[0] + c[1] * c[1]
  const cx = (qa * (b[1] - c[1]) + qb * (c[1] - a[1]) + qc * (a[1] - b[1])) / d
  const cy = (qa * (c[0] - b[0]) + qb * (a[0] - c[0]) + qc * (b[0] - a[0])) / d
  const radius = Math.hypot(a[0] - cx, a[1] - cy)
  const len = Math.max(Math.hypot(cx, cy), 1e-6)
  return { nx: -cx / len, ny: -cy / len, at: radius - len, radius }
}
