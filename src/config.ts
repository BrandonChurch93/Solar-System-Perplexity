import raw from '../config/showcase.json'

export type SegmentKind = 'hold' | 'dive' | 'terrain' | 'rise' | 'travel' | 'retreat' | 'lookback' | 'fade'
export interface FormatDef { id: string; width: number; height: number }
export interface TierDef { samplesPerFrame: number; fastSamplesPerFrame: number }
export interface AssetSetDef { wrapMapWidth: number; reliefWidth: number; skyWidth: number; maxSetMemoryMb: number }
export interface StopDef { id: string; name: string; hero: string; close: string; moons: string[]; rings: boolean }
export interface SegmentDef { id: string; stop: string; kind: SegmentKind; start: number; end: number }
export interface Segment extends SegmentDef { index: number; firstFrame: number; endFrame: number; frames: number }
export interface CoverWindow { firstFrame: number; lastFrame: number; centerFrame: number }
export type RawConfig = typeof raw

const KINDS: SegmentKind[] = ['hold', 'dive', 'terrain', 'rise', 'travel', 'retreat', 'lookback', 'fade']
const ENDING = 'ending'

function fail(msg: string): never {
  throw new Error('config: ' + msg)
}

function need(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(key in (cur as Record<string, unknown>))) fail('missing key ' + path)
    cur = (cur as Record<string, unknown>)[key]
  }
  if (cur === undefined || cur === null) fail('missing key ' + path)
  return cur
}

const REQUIRED = [
  'name', 'seed', 'repo.url', 'repo.branch', 'repo.maxFileMb', 'repo.maxTreeGb', 'film.fps', 'film.durationSeconds', 'film.shutterDegrees', 'film.hookSeconds',
  'formats.master', 'formats.preview', 'formats.uhd', 'platform.maxWidth', 'platform.maxHeight', 'platform.maxFps', 'platform.maxBitrateMbps', 'platform.loopsAtOrUnderSeconds',
  'export.container', 'export.videoCodec', 'export.bitrateMbps', 'export.proofSeconds', 'export.memoryTestSeconds', 'export.files.master', 'export.files.uhd', 'export.files.clip', 'export.files.preview',
  'previewFilm.bitrateMbps', 'tiers.draft', 'tiers.review', 'tiers.final', 'motion.fastKinds', 'assetSets.web', 'assetSets.full', 'sets.maxLoaded', 'lookLockStop', 'buildOrderAfterLookLock',
  'stops', 'segments', 'cover.seconds', 'cover.diveCenterFraction', 'cover.riseCenterFraction', 'judged.fractions', 'detail.minTexelsPerPixel', 'detail.maxSoftPixelFraction', 'detail.minSharpnessRatio', 'detail.minBodyCoverage',
  'assets.maxTakesPerAsset', 'quality.passScore', 'critics.maxImageLongEdgePx', 'critics.contactSheetFrames', 'critics.phonePreviewWidthPx', 'critics.maxFilesPerMessage',
  'sandbox.chunkBudgetMinutes', 'sandbox.maxFramesOnDisk', 'sandbox.minFreeDiskGb', 'sandbox.maxRenderProcesses',
  'status.maxGapMinutes', 'status.minGapMinutes', 'status.maxPictures', 'status.inlineMaxTries',
  'posts.introMaxSeconds', 'posts.readHoldSeconds', 'posts.introMaxTries', 'posts.checkMaxFixes', 'posts.prompts',
]

function isWhole(x: number): boolean {
  return Math.abs(x - Math.round(x)) < 1e-6
}

export interface Config {
  raw: RawConfig
  name: string
  seed: number
  fps: number
  durationSeconds: number
  frameCount: number
  shutterFraction: number
  hookFrame: number
  formats: Record<string, FormatDef>
  formatKeys: { master: string; preview: string; uhd: string }
  tiers: Record<string, TierDef>
  assetSets: Record<string, AssetSetDef>
  fastKinds: SegmentKind[]
  stops: StopDef[]
  stopIds: string[]
  segments: Segment[]
  maxLoadedSets: number
  endingId: string
}

export function buildConfig(input: unknown, approvedExists?: (path: string) => boolean): Config {
  for (const key of REQUIRED) need(input, key)
  const r = input as RawConfig
  const fps = r.film.fps
  const duration = r.film.durationSeconds
  if (!(fps > 0) || !isWhole(fps)) fail('film.fps must be a whole positive number')
  if (!(duration > 0) || !isWhole(duration * fps)) fail('film.durationSeconds must land on a whole frame')
  if (!Array.isArray(r.stops) || r.stops.length === 0) fail('stops is empty')
  const stopIds = r.stops.map((s) => s.id)
  for (const s of r.stops) {
    if (!s.id || !s.hero || !s.close) fail('stop is missing id, hero or close')
    if (approvedExists && (!approvedExists(s.hero) || !approvedExists(s.close))) fail('approved image missing for stop ' + s.id)
  }
  if (!Array.isArray(r.segments) || r.segments.length === 0) fail('segments is empty')
  const segments: Segment[] = []
  let cursor = 0
  r.segments.forEach((s, index) => {
    if (!KINDS.includes(s.kind as SegmentKind)) fail('segment ' + s.id + ' has unknown kind ' + s.kind)
    if (s.stop !== ENDING && !stopIds.includes(s.stop)) fail('segment ' + s.id + ' names unknown stop ' + s.stop)
    if (index === 0 && s.start !== 0) fail('segments do not start at 0')
    if (Math.abs(s.start - cursor) > 1e-9) fail(s.start > cursor ? 'gap before segment ' + s.id : 'overlap at segment ' + s.id)
    if (!(s.end > s.start)) fail('segment ' + s.id + ' has no length')
    if (!isWhole(s.start * fps) || !isWhole(s.end * fps)) fail('segment ' + s.id + ' boundary is not on a whole frame')
    const firstFrame = Math.round(s.start * fps)
    const endFrame = Math.round(s.end * fps)
    segments.push({ ...(s as SegmentDef), index, firstFrame, endFrame, frames: endFrame - firstFrame })
    cursor = s.end
  })
  if (Math.abs(cursor - duration) > 1e-9) fail('last segment does not end at film.durationSeconds')
  const formats: Record<string, FormatDef> = {}
  for (const f of Object.values(r.formats)) formats[f.id] = f
  const fastKinds = r.motion.fastKinds as SegmentKind[]
  for (const k of fastKinds) if (!KINDS.includes(k)) fail('motion.fastKinds has unknown kind ' + k)
  const prompts = r.posts.prompts as Record<string, string>
  for (const id of stopIds) if (typeof prompts[id] !== 'string' || prompts[id].length === 0) fail('posts.prompts has no prompt for stop ' + id)
  if (!(r.posts.introMaxSeconds > 0) || !(r.posts.readHoldSeconds >= 0) || !(r.posts.readHoldSeconds < r.posts.introMaxSeconds)) fail('posts.readHoldSeconds must fit inside posts.introMaxSeconds')
  if (!(r.posts.introMaxTries >= 1) || !isWhole(r.posts.introMaxTries) || !(r.posts.checkMaxFixes >= 0) || !isWhole(r.posts.checkMaxFixes)) fail('posts.introMaxTries and posts.checkMaxFixes must be whole numbers')
  for (const [id, t] of Object.entries(r.tiers)) if (!(t.samplesPerFrame >= 1) || !(t.fastSamplesPerFrame >= 1)) fail('tier ' + id + ' has no samples')
  return {
    raw: r,
    name: r.name,
    seed: r.seed,
    fps,
    durationSeconds: duration,
    frameCount: Math.round(fps * duration),
    shutterFraction: r.film.shutterDegrees / 360,
    hookFrame: Math.round(r.film.hookSeconds * fps),
    formats,
    formatKeys: { master: r.formats.master.id, preview: r.formats.preview.id, uhd: r.formats.uhd.id },
    tiers: r.tiers,
    assetSets: r.assetSets,
    fastKinds,
    stops: r.stops,
    stopIds,
    segments,
    maxLoadedSets: r.sets.maxLoaded,
    endingId: ENDING,
  }
}

export const config: Config = buildConfig(raw)
