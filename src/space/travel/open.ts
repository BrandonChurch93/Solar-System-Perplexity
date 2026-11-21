import * as THREE from 'three'

const side = (d: number): number => {
  const x = Math.min(Math.max(d, -1), 1)
  return 0.5 + (x * Math.sqrt(1 - x * x) + Math.asin(x)) / Math.PI
}

export function discShare(center: THREE.Vector3, sinRadius: number, vfovDeg: number, aspect: number): number {
  if (center.z > -1e-9 || sinRadius <= 0) return 0
  const t = Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2)
  const dist = center.length()
  const s = Math.min(sinRadius, 0.999999)
  const r = (s / Math.sqrt(1 - s * s)) * (dist / -center.z) / t
  const x = center.x / -center.z / t
  const y = center.y / -center.z / t
  const fx = side((x + aspect) / r) + side((aspect - x) / r) - 1
  const fy = side((y + 1) / r) + side((1 - y) / r) - 1
  return Math.min((Math.PI * r * r * Math.max(fx, 0) * Math.max(fy, 0)) / (4 * aspect), 1)
}

export function openSky(share: number, full: number): number {
  const x = Math.min(Math.max(share / Math.max(full, 1e-9), 0), 1)
  return 1 - x * x * (3 - 2 * x)
}
