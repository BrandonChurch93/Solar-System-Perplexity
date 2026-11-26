import * as THREE from 'three'
import type { SkyFloor } from './types'

// The floor of a carried sky plate (cut/HANDOVER.md, E2: the sky is one function of time through T).
// A terrain sky plate is true sky only above the horizon the close side has. On the globe side the plate is
// carried through T, and when the camera stands higher than at T the limb lies under that horizon and shows what
// the plate holds below it, which no close frame ever showed. The floor cuts the carried plate under the horizon of
// the twin at T. It is given to the sky as the plate's ring, the only mask the sky shader has: a disc in the plane
// of the plate whose inside is hidden. The body under the horizon is a convex region of that plane, so a disc fits.
//
//   nadir   unit vector to the centre of the body, in the frame of the plate (x right, y up, the plate looks along -z)
//   dip     the dip of the horizon at T, radians
//   tan     the half extents of the plate, tangents
//   margin  how far under the horizon the plate stays whole, radians (the two sides stay equal at T above it)
//   feather the width under that over which the plate goes, radians
//
// Returns the ring [centre u, centre v, inner radius, outer radius] in the units of the sky shader (radii in plate
// heights, weight 0 inside the inner radius and 1 outside the outer), or null when the whole plate lies above the cut.

const STEPS = 1440
const MAX_RADIUS = 64
const GONE: [number, number, number, number] = [0.5, 0.5, 1e6, 2e6]

export interface FloorNumbers { marginDeg: number; featherDeg: number }

export function floorRing(floor: SkyFloor, tan: [number, number], numbers: FloorNumbers): [number, number, number, number] | null {
  const n = floor.nadir.clone().normalize()
  const rad = Math.PI / 180
  const cut = floor.dip + numbers.marginDeg * rad
  const s1 = Math.sin(cut)
  const c1 = Math.cos(cut)
  const e1 = new THREE.Vector3().crossVectors(n, Math.abs(n.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)).normalize()
  const e2 = new THREE.Vector3().crossVectors(n, e1)
  const unit = 1 / (2 * tan[1])
  const at = (s: number, c: number, phi: number): [number, number] | null => {
    const x = s * n.x + c * (Math.cos(phi) * e1.x + Math.sin(phi) * e2.x)
    const y = s * n.y + c * (Math.cos(phi) * e1.y + Math.sin(phi) * e2.y)
    const z = s * n.z + c * (Math.cos(phi) * e1.z + Math.sin(phi) * e2.z)
    if (!(z < -1e-6)) return null
    return [x / -z, y / -z]
  }
  const pts: { u: number; v: number; phi: number }[] = []
  for (let i = 0; i < STEPS; i++) {
    const phi = (i / STEPS) * 2 * Math.PI
    const p = at(s1, c1, phi)
    if (!p || Math.abs(p[0]) > tan[0] || Math.abs(p[1]) > tan[1]) continue
    pts.push({ u: p[0] * unit, v: p[1] * unit, phi })
  }
  if (pts.length < 3) return -n.z <= s1 ? null : GONE
  let mu = 0
  let mv = 0
  for (const p of pts) {
    mu += p.u / pts.length
    mv += p.v / pts.length
  }
  let suu = 0
  let suv = 0
  let svv = 0
  let suuu = 0
  let svvv = 0
  let suvv = 0
  let svuu = 0
  for (const p of pts) {
    const a = p.u - mu
    const b = p.v - mv
    suu += a * a
    suv += a * b
    svv += b * b
    suuu += a * a * a
    svvv += b * b * b
    suvv += a * b * b
    svuu += b * a * a
  }
  const det = suu * svv - suv * suv
  let mid = pts[0]!
  let best = Infinity
  for (const p of pts) {
    const d = Math.hypot(p.u - mu, p.v - mv)
    if (d < best) {
      best = d
      mid = p
    }
  }
  const mx = mid.u / unit
  const my = mid.v / unit
  const reach = Math.sqrt(mx * mx + my * my + 1)
  const down = new THREE.Vector2(n.x / reach - (s1 * mx) / (reach * reach), n.y / reach - (s1 * my) / (reach * reach))
  if (down.lengthSq() < 1e-12) return -n.z <= s1 ? null : GONE
  down.normalize()
  let cu: number
  let cv: number
  const straight = (): void => {
    cu = mid.u + MAX_RADIUS * down.x
    cv = mid.v + MAX_RADIUS * down.y
  }
  cu = 0
  cv = 0
  if (Math.abs(det) > 1e-18 * Math.max(suu, svv) * Math.max(suu, svv)) {
    const a = 0.5 * (suuu + suvv)
    const b = 0.5 * (svvv + svuu)
    cu = mu + (a * svv - b * suv) / det
    cv = mv + (b * suu - a * suv) / det
    const r = Math.hypot(cu - mid.u, cv - mid.v)
    const side = (cu - mid.u) * down.x + (cv - mid.v) * down.y
    if (!(r <= MAX_RADIUS) || !(side > 0)) straight()
  } else straight()
  let outer = Infinity
  for (const p of pts) outer = Math.min(outer, Math.hypot(p.u - cu, p.v - cv))
  const end = cut + numbers.featherDeg * rad
  const low = at(Math.sin(end), Math.cos(end), mid.phi)
  let inner = low ? Math.hypot(low[0] * unit - cu, low[1] * unit - cv) : outer * 0.5
  if (!(inner < outer)) inner = outer * (1 - 1e-4)
  return [0.5 + (cu * tan[1]) / tan[0], 0.5 + cv, inner, outer]
}

// What the sky shader does with a ring, for tests and tools: the weight of the plate in a direction of its frame.
export function ringWeight(ring: [number, number, number, number], tan: [number, number], dir: THREE.Vector3): number {
  if (!(dir.z < 0)) return 0
  const u = (dir.x / -dir.z / tan[0]) * 0.5 + 0.5
  const v = (dir.y / -dir.z / tan[1]) * 0.5 + 0.5
  const r = Math.hypot((u - ring[0]) * (tan[0] / tan[1]), v - ring[1])
  const x = Math.min(Math.max((r - ring[2]) / (ring[3] - ring[2]), 0), 1)
  return x * x * (3 - 2 * x)
}

// The weight of a sky patch on the globe side of a dive or rise that hands over, before the patch's own weight by time. low is the share of
// the sky of the close view, high that of the sky of the globe view. Without a high of the stop's own the globe view's patch takes what the
// close view's leaves in a dive and nothing in a rise, where the sky already turns to the next stop.
export function sharedSkyWeight(patchView: string, setView: string, kind: string, low: number, high: number | undefined): number {
  if (patchView === 'terrain') return low
  if (patchView !== setView) return 0
  if (high !== undefined) return high
  return kind === 'rise' ? 0 : 1 - low
}

// Whether a stop's sky patch is drawn in the view its set is in, where no dive or rise shares the sky. A patch is drawn in the view it
// names. One that says both (SkyPatch.both) is drawn in the other view of its stop too, in the dive, on the ground and in the rise, and
// nowhere else.
export function ownSkyDrawn(patchView: string, setView: string, kind: string, both: boolean | undefined): boolean {
  return patchView === setView || (both === true && (kind === 'dive' || kind === 'terrain' || kind === 'rise'))
}

// The weight of a stop's sky patch that is drawn (ownSkyDrawn), where no dive or rise shares the sky, before the patch's own weight by
// time. The film's ending has none. On a travel the stop that is left has none and the stop that arrives has the director's weight
// for the travel (clock), or 1 on every frame of the travel where the patch says it arrives whole (SkyPatch.arrive). In a rise the
// globe view has none, where the sky already turns to the next stop, unless the patch says both (SkyPatch.both); everywhere else the
// patch is whole.
export function ownSkyWeight(kind: string, setView: string, arriving: boolean, ending: boolean, clock: number, arrive: 'whole' | undefined, both: boolean | undefined): number {
  if (ending) return 0
  if (kind === 'travel') return arriving ? (arrive === 'whole' ? 1 : clock) : 0
  return kind === 'rise' && setView === 'orbit' && both !== true ? 0 : 1
}
