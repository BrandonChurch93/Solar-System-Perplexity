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

export interface SunState { dir: THREE.Vector3; color: THREE.Color; intensity: number; angularRadius: number; glare: number }

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
  ground?: number
}

export interface CoverHorizon { normal: [number, number]; offset: number; soft: number }

export interface CoverRush { focus: [number, number]; phase: number; billow: [number, number, number]; streak: [number, number, number]; contrast: [number, number] }
export interface CoverShell { centre: [number, number, number]; inner: number; outer: number }
export interface CoverState { amount: number; color: [number, number, number]; low?: [number, number, number]; horizon?: CoverHorizon; flow?: [number, number]; top?: number; rush?: CoverRush; shell?: CoverShell }

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
  near: number
  far: number
  sun: SunState
  sets: SetState[]
  post: PostParams
  cover: CoverState
  dust: number
  dustOffset: THREE.Vector3
}

export interface TextureOptions { srgb?: boolean; mips?: boolean; repeat?: boolean; mirror?: boolean; anisotropy?: number; flipY?: boolean; linear?: boolean }

export interface SetContext {
  assets: string
  format: FormatDef
  url(path: string): string
  texture(path: string, options?: TextureOptions): Promise<THREE.Texture>
  dataTexture(path: string, width: number, height: number, channels: 1 | 4): Promise<THREE.DataTexture>
  buffer(path: string): Promise<ArrayBuffer>
  floatTexture(data: Float32Array, width: number, height: number, repeat?: boolean): THREE.DataTexture
}

export interface RenderView { camera: THREE.PerspectiveCamera; diag: string; format: FormatDef; sample: number; samples: number; cameraPosition: THREE.Vector3 }

export interface SkyPatch {
  view: ViewKind
  texture: THREE.Texture
  aim: THREE.Quaternion
  tan: [number, number]
  gain: number
  add: boolean
  ring: [number, number, number, number]
  edge: number
  weight?: (time: number, view: ViewKind) => number
}

export interface StopSet {
  id: string
  world: THREE.Object3D
  near?: THREE.Object3D
  sky?: SkyPatch[]
  update(state: SetState, shot: Shot, view: RenderView): void
  dispose(): void
}

export type SetFactory = (ctx: SetContext) => Promise<StopSet>
