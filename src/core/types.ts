import type * as THREE from 'three'
import type { FormatDef, Segment } from '../config'

export interface Pose { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }

export interface PostParams {
  exposure: number
  bloomStrength: number
  bloomRadius: number
  vignette: number
  grain: number
  saturation: number
  contrast: number
  lift: [number, number, number]
  gain: [number, number, number]
  fade: number
  flare: number
  sharpen: number
}

export interface FarSunState { centre?: THREE.Vector3; dir?: THREE.Vector3; share: number; body: THREE.Quaternion; spin: number; holdTime: number; time: number; exposure: number; vfov: number; burn: number }

export interface SunState { dir: THREE.Vector3; color: THREE.Color; intensity: number; angularRadius: number; glare: number; far?: FarSunState }

export type ViewKind = 'orbit' | 'terrain'

export interface SetState {
  id: string
  origin: THREE.Vector3
  rotation: THREE.Quaternion
  time: number
  local: number
  segment: Segment
  u: number
  weight: number
  view: ViewKind
  // The height of the camera above the unit sphere of this body, in radii. One number for both views of a stop: the close view's camera is
  // measured through the twin. What follows the height (air, haze, the reach of the close ground) reads it here and not from the clock.
  height: number
  ground?: number
  // The turn of the body's surface at this time, in the set's own frame. Given on the globe side of a dive and a rise of a stop that opted in,
  // where the camera follows the turning place: raw motion then tracks points that turn with the body.
  turn?: THREE.Quaternion
}

export interface CoverHorizon { normal: [number, number]; offset: number; soft: number }

export interface CoverRush { focus: [number, number]; phase: number; billow: [number, number, number]; streak: [number, number, number]; contrast: [number, number] }
export interface CoverShell { centre: [number, number, number]; inner: number; outer: number }
export interface CoverState { amount: number; color: [number, number, number]; low?: [number, number, number]; horizon?: CoverHorizon; flow?: [number, number]; top?: number; rush?: CoverRush; shell?: CoverShell; hides?: number; hidden?: number }

export interface PlaceState {
  stop: string
  kind: 'dive' | 'rise'
  weight: number
  frame: number
  time: number
  live: boolean
  twin: Pose
  centre: THREE.Vector3
  radius: number
  scale?: number
  margin?: number
  matte?: 'pair' | 'alpha'
  valid?: [number, number, number, number]
  lens?: number
  seen?: number
  maxEnlarge?: number
  enlargeSoft?: number
  limbReachDeg?: number
  limbHoldDeg?: [number, number]
  // With a horizon (below): the share of the radius by which the ground of the globe may lie under its sphere at the limb, the sag of its
  // mesh (negative: over it, a mesh that stands outside its sphere). A ray that passes the centre further out than the radius less this
  // share is taken for sky. Absent: the film's (handover.place.limbLap).
  limbLap?: number
  edgeIn?: [number, number, number, number]
  toneIn?: [number, number, number, number]
  // The weight of the picture's horizon, that is of its sky (the haze over the limb with the stars behind it), when the stop asked for
  // limbSky: the share of the close view's sky on the globe side, never under the weight of the picture, whatever the picture's sides say.
  // Absent: the horizon comes and goes with the picture, by its weight and its sides. A stop's globe may read it to bring its own limb to
  // the picture's at T.
  horizon?: number
}

export interface Shot {
  frame: number
  time: number
  segment: Segment
  u: number
  camera: Pose
  skyQuaternion: THREE.Quaternion
  skyExposure: number
  skyGlow: number
  skyTurn: THREE.Quaternion
  skyStars?: number
  skyPatch?: number
  skyLook?: number
  near: number
  far: number
  sun: SunState
  sets: SetState[]
  post: PostParams
  cover: CoverState
  dust: number
  farLight?: number
  place?: PlaceState
  skyShare?: number
  skyShareHigh?: number
  skyFloor?: SkyFloor
}

export interface SkyFloor { nadir: THREE.Vector3; dip: number }

export interface TextureOptions { srgb?: boolean; mips?: boolean; repeat?: boolean; mirror?: boolean; anisotropy?: number; flipY?: boolean; linear?: boolean; channels?: 1 }

export interface SetContext {
  assets: string
  format: FormatDef
  url(path: string): string
  texture(path: string, options?: TextureOptions): Promise<THREE.Texture>
  dataTexture(path: string, width: number, height: number, channels: 1 | 4): Promise<THREE.DataTexture>
  buffer(path: string): Promise<ArrayBuffer>
  floatTexture(data: Float32Array, width: number, height: number, repeat?: boolean): THREE.DataTexture
}

// shutter: the share of the film's shutter the frame keeps (E6, the capped shutter of a dive or a rise). 1 or absent: all of it. A set that takes a
// time step from the shutter (one sample's share of it, for a smear along the motion) multiplies the step by this.
// shutterSeconds: how long the full shutter of the frame being drawn is open, in seconds, at the capture rate (film.shutterDegrees of the capture
// frame; shutterFraction / fps at rate 1). One sample's share of it is shutterSeconds / samples.
export interface RenderView { camera: THREE.PerspectiveCamera; diag: string; format: FormatDef; sample: number; samples: number; cameraPosition: THREE.Vector3; farLight?: number; place?: boolean; placeScale?: number; shutter?: number; shutterSeconds?: number }

export interface SkyPatch {
  view: ViewKind
  texture: THREE.Texture
  aim: THREE.Quaternion
  tan: [number, number]
  gain: number
  add: boolean
  ring: [number, number, number, number]
  edge: number
  unfold?: [number, number]
  weight?: (time: number, view: ViewKind) => number
}

export interface StopSet {
  id: string
  world: THREE.Object3D
  near?: THREE.Object3D
  over?: THREE.Object3D
  sky?: SkyPatch[]
  // A land matte for the place picture of a dive or a rise (cut/HANDOVER.md, E2): a grey picture over the whole field of the place picture, the frame
  // plus its margins, upright as seen. 1 keeps the picture, 0 leaves the globe's own surface. It multiplies the weight of the pass per pixel after
  // every other limit, so the picture can end along forms of the land. Inside the frame at T it has to be 1, or the sides differ at T.
  placeMatte?: { dive?: THREE.Texture; rise?: THREE.Texture }
  update(state: SetState, shot: Shot, view: RenderView): void
  dispose(): void
}

export type SetFactory = (ctx: SetContext) => Promise<StopSet>
