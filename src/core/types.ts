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

// A body a stop names to the motion measure: a moon that passes close to the camera. centre is its centre in the frame of the stop's globe (the
// set's origin and rotation, without the turn of the surface), radius the radius of the sphere that holds it, in radii of the stop's body.
export interface NearBody { centre: THREE.Vector3; radius: number }

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
  // The near bodies the stop names at this time (StopPlan.nearBodies), on the globe side only and only where it names any: the sample count of a
  // frame follows the fastest of them that is in the frame (core/motion nearMotion). Nothing else reads them.
  near?: NearBody[]
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

// PLAN F, the one air. What lies between the lens and a body's ground, the sky behind the body and the Sun in it, as one function of the
// height of the lens over the body (SetState.height, radii): the same at one height in a dive and in a rise, on the globe's side and on the
// close view's, and never a function of the clock. A stop gives knots (AirKnot, highest first) in its params; src/core/air.ts mixes them
// (airAt) and the film puts the result on the shot of every shutter sample (Shot.air). A stop that names no air gets none and nothing of
// it is written anywhere.
export type Rgb = [number, number, number]

// The haze of a body as its globe and its shell take it (planet.setAir and haze.setAir of src/bodies). glow and glowPower are the colour and
// the power of the glow round a direction of the stop's own, for a haze whose text carries the glow (hazeGlsl(true)): both or neither, and
// like every part of the air there at every height or at none. The direction is the stop's, fixed on the body, and no number of the height.
export interface HazeAir { depth: number; scaleHeight: number; day: Rgb; twilight: Rgb; night: Rgb; edge: [number, number]; strength: number; extinction: number; forward: number; glow?: Rgb; glowPower?: number }

export interface Air {
  // The height this air stands for, in radii of the body: the height asked for between the knots, the knot's own at and beyond either end.
  height: number
  // How far down the knots that is, by the logarithm of the height: 0 at and above the highest knot, 1 at and below the lowest.
  share: number
  // The exposure of the picture and of the sky pass.
  exposure: number
  sky: number
  // The weight of the flight's stars behind the body: 1 as the flight shows them, 0 where the body's own sky hides them.
  stars: number
  // The Sun: its angular radius in degrees and its glare.
  sunRadius: number
  glare: number
  // The body's own parts, each there at every height or at none: the limb term and the tint of its globe, the haze over its ground and the
  // haze of its shell.
  limb?: number
  tint?: Rgb
  haze?: HazeAir
  shell?: HazeAir
}

// One knot of a stop's air: a height in radii and what the air is there. A knot names what differs from the knot above it and takes the rest
// from that knot, field by field inside haze and shell too. The highest knot names every part the stop's air has; the film fills its
// exposure, sky, stars, sunRadius and glare from the stop's light where it leaves them out (StopPlan.air).
export interface AirKnot { height: number; exposure?: number; sky?: number; stars?: number; sunRadius?: number; glare?: number; limb?: number; tint?: Rgb; haze?: Partial<HazeAir>; shell?: Partial<HazeAir> }

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
  // The angle of one pixel row of the master format at the middle of the picture, in radians (the size of that row at distance 1 from the
  // lens). The same number in every format, so a width a shader takes from it is the same share of the picture in a preview and in the film.
  pixel: number
  // PLAN F: the one air of the stop this shot belongs to, at the height of this shot's lens over its body. Set in the hold, the dive, the
  // surface view and the rise of a stop that names an air; absent everywhere else.
  air?: Air
  // The globe drawn under the surface view, where the stop's plan asks for it (StopPlan.under); absent in every other shot.
  under?: UnderDraw
}

// The one ground of a stop, the globe under its surface view. A sample of the surface view whose shot carries this is drawn in two
// parts: first the stop's set as the globe view draws it at this time, by the lens that stands over the globe where the shot's lens
// stands over the place (the twin: the same angle and the same picture of the ground, in radii), then, with the depth cleared, the
// surface view over it. set is the state the set is given for the first part, camera the twin in the world, near and far its range.
// The sky is drawn once, before both, by the shot's own lens. The set is told which part it is drawn for in RenderView.under.
export interface UnderDraw { set: SetState; camera: Pose; near: number; far: number }

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
// under: set in the two updates of a sample that draws the globe under the surface view (Shot.under), and in no other. 'globe': this
// update is for the first part, the state is the globe view's and camera is the twin; the set shows what stands under the place.
// 'relief': this update is for the second part, the state is the surface view's as ever; the set shows what lies over the globe.
export interface RenderView { camera: THREE.PerspectiveCamera; diag: string; format: FormatDef; sample: number; samples: number; cameraPosition: THREE.Vector3; farLight?: number; place?: boolean; placeScale?: number; shutter?: number; shutterSeconds?: number; under?: 'globe' | 'relief' }

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
