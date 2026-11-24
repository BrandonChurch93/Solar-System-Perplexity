import * as THREE from 'three'

// The bend of a surface view into its rise (ruling d196). A surface view that pushes forward and down meets a rise that pulls the eye back
// and up: with nothing between them the eye stops and goes back the way it came, and the ground stands still in the picture for a moment.
// The bend is the last stretch of the surface view's own path: the eye keeps the share of its own height that it flies a second (so the
// near ground never slows in the picture), and the direction of its way turns in one plane, from the way it has where the bend begins,
// through the direction the stop names as across, as far round as the stop says. The turn begins and ends at rest (a smooth step), so the
// path has no corner where the bend begins and the eye leaves the surface view on a straight line at the velocity the rise carries on.
// The lens is not touched: it is the stop's own.
//
// Everything is in the path's own frame and units. Nothing here knows a frame number: the bend is a function of the time on the path's own
// clock, the same at any tier and any rate.

export interface BendShape {
  // Degrees: [azimuth, elevation] of the direction the eye's way turns toward, the track across. Azimuth is counted in the ground's level
  // plane from the level part of the way where the bend begins, clockwise seen from above (90 is to the right of the way, 270 to its
  // left); elevation is above that plane.
  acrossDeg: [number, number]
  // Degrees the way turns in the plane of its own direction and the track: 90 ends on the track itself, 180 ends going back along the
  // line the eye came on.
  turnDeg: number
}

export interface BendStart {
  // The time on the path's own clock at which the bend begins and how long it lasts, in seconds.
  time: number
  span: number
  // The eye where the bend begins and its velocity there, a second.
  position: THREE.Vector3
  velocity: THREE.Vector3
  // The ground's up as a unit vector and the eye's height above the ground there, in the path's units.
  up: THREE.Vector3
  height: number
  // Seconds between the sums the path is added up from.
  step: number
}

const RAD = Math.PI / 180
const smoothStep = (x: number): number => {
  const s = Math.min(Math.max(x, 0), 1)
  return s * s * (3 - 2 * s)
}

export class Bend {
  readonly time: number
  readonly span: number
  // The way where the bend begins, the unit direction it turns toward (square to the way) and the angle it turns by, in radians.
  readonly from: THREE.Vector3
  readonly toward: THREE.Vector3
  readonly angle: number
  // The share of its height the eye flies a second, held through the bend.
  readonly rate: number
  private readonly origin: THREE.Vector3
  private readonly up: THREE.Vector3
  private readonly height: number
  private readonly step: number
  private readonly nodes: THREE.Vector3[]

  constructor(start: BendStart, shape: BendShape) {
    const speed = start.velocity.length()
    if (!(start.span > 0)) throw new Error('a bend needs a length above 0')
    if (!(start.step > 0)) throw new Error('a bend needs a step above 0')
    if (!(speed > 0)) throw new Error('a bend needs a surface view that moves where it begins')
    if (!(start.height > 0)) throw new Error('a bend needs a height above 0 where it begins')
    if (!(shape.turnDeg > 0 && shape.turnDeg <= 180)) throw new Error('turnDeg of a bend must be above 0 and at most 180')
    this.time = start.time
    this.span = start.span
    this.origin = start.position.clone()
    this.up = start.up.clone().normalize()
    this.height = start.height
    this.step = start.step
    this.from = start.velocity.clone().multiplyScalar(1 / speed)
    this.rate = speed / start.height
    const level = this.from.clone().addScaledVector(this.up, -this.from.dot(this.up))
    if (level.length() < 1e-6) throw new Error('a bend needs a way that is not straight up or down where it begins')
    level.normalize()
    const right = level.clone().cross(this.up).normalize()
    const azimuth = shape.acrossDeg[0] * RAD
    const elevation = shape.acrossDeg[1] * RAD
    const across = level.clone().multiplyScalar(Math.cos(elevation) * Math.cos(azimuth)).addScaledVector(right, Math.cos(elevation) * Math.sin(azimuth)).addScaledVector(this.up, Math.sin(elevation))
    this.toward = across.addScaledVector(this.from, -across.dot(this.from))
    if (this.toward.length() < 1e-3) throw new Error('acrossDeg of a bend must not point along the way itself')
    this.toward.normalize()
    this.angle = shape.turnDeg * RAD
    this.nodes = [this.origin.clone()]
  }

  // The unit direction of the eye's way at a time of the path's clock.
  way(time: number): THREE.Vector3 {
    const a = this.angle * smoothStep((time - this.time) / this.span)
    return this.from.clone().multiplyScalar(Math.cos(a)).addScaledVector(this.toward, Math.sin(a))
  }

  private velocity(position: THREE.Vector3, time: number): THREE.Vector3 {
    const height = this.height + this.up.dot(position) - this.up.dot(this.origin)
    return this.way(time).multiplyScalar(this.rate * height)
  }

  // One classical fourth order step of the sum, of any length.
  private advance(p: THREE.Vector3, time: number, h: number): THREE.Vector3 {
    const k1 = this.velocity(p, time)
    const k2 = this.velocity(p.clone().addScaledVector(k1, h / 2), time + h / 2)
    const k3 = this.velocity(p.clone().addScaledVector(k2, h / 2), time + h / 2)
    const k4 = this.velocity(p.clone().addScaledVector(k3, h), time + h)
    return p.clone().addScaledVector(k1, h / 6).addScaledVector(k2, h / 3).addScaledVector(k3, h / 3).addScaledVector(k4, h / 6)
  }

  // The eye at a time of the path's clock. Before the bend begins it is the straight line the path came on. The sums stand at fixed times
  // counted from the bend's beginning, so the eye at a time does not depend on which times were asked before.
  position(time: number): THREE.Vector3 {
    const since = time - this.time
    if (since <= 0) return this.origin.clone().addScaledVector(this.from, this.rate * this.height * since)
    const n = Math.floor(since / this.step)
    while (this.nodes.length <= n) this.nodes.push(this.advance(this.nodes[this.nodes.length - 1]!, this.time + (this.nodes.length - 1) * this.step, this.step))
    return this.advance(this.nodes[n]!, this.time + n * this.step, since - n * this.step)
  }
}
