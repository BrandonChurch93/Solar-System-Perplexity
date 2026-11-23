import raw from '../config/showcase.json'

export type SegmentKind = 'hold' | 'dive' | 'terrain' | 'rise' | 'travel' | 'retreat' | 'lookback' | 'fade'
export interface FormatDef { id: string; width: number; height: number }
export interface TierDef { samplesPerFrame: number; fastSamplesPerFrame: number; maxSamplesPerFrame: number }
export interface MotionDef { maxStepPx: number; probeGrid: [number, number]; bodyReach: number; minBodyPx: number; terrainGround: number; softFromPx: number; softToPx: number }
export interface AssetSetDef { wrapMapWidth: number; reliefWidth: number; skyWidth: number; skyStripWidth: number; maxSetMemoryMb: number }
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
  'export.container', 'export.videoCodec', 'export.bitrateMbps', 'export.warmUpFrames', 'export.proofSeconds', 'export.memoryTestSeconds', 'export.files.master', 'export.files.uhd', 'export.files.clip', 'export.files.preview',
  'previewFilm.bitrateMbps', 'tiers.draft', 'tiers.review', 'tiers.final', 'motion.fastKinds', 'motion.maxStepPx', 'motion.probeGrid', 'motion.bodyReach', 'motion.minBodyPx', 'motion.terrainGround', 'motion.softFromPx', 'motion.softToPx', 'assetSets.web', 'assetSets.full', 'sets.maxLoaded', 'lookLockStop', 'buildOrderAfterLookLock',
  'stops', 'segments', 'cover.seconds', 'cover.diveCenterFraction', 'cover.riseCenterFraction', 'handover.dive.at', 'handover.dive.dissolveFrames', 'handover.dive.placeFrames', 'handover.rise.at', 'handover.rise.dissolveFrames', 'handover.rise.placeFrames', 'handover.dive.skyFrames', 'handover.rise.skyFrames', 'handover.place.scale', 'handover.place.margin', 'handover.place.maxShare', 'handover.place.maxEdge', 'handover.place.edge', 'handover.place.seen', 'handover.maxEnlarge', 'handover.place.enlargeSoft', 'handover.place.lens', 'handover.place.maxGradTexels', 'handover.place.limbReachDeg', 'handover.place.limbHoldDeg', 'handover.place.edgeIn', 'handover.descent.rise', 'handover.descent.fall', 'handover.descent.turnRise', 'handover.descent.turnFall', 'handover.descent.level', 'handover.descent.levelBy', 'handover.descent.targetReach', 'handover.ascent.rise', 'handover.ascent.fall', 'handover.ascent.turnRise', 'handover.ascent.turnFall', 'handover.ascent.level', 'handover.ascent.levelBy', 'handover.zenithDeg', 'handover.coastFrames', 'handover.skyFloor.marginDeg', 'handover.skyFloor.featherDeg', 'handover.maxRateOverMean', 'handover.limits.sideMean', 'handover.limits.sideP99', 'handover.limits.flowStepFrames', 'handover.limits.flowGapMeanPx', 'handover.limits.backRate', 'handover.limits.flowGapMaxPx', 'handover.limits.earlyShare', 'handover.limits.earlyRateOverMean', 'handover.limits.placeMiddle', 'handover.limits.levelStep', 'handover.limits.colourStep', 'handover.limits.underMean', 'handover.limits.bodyShare', 'handover.limits.flatShare', 'handover.limits.flatFloor', 'handover.limits.blockPx', 'handover.limits.sheetFrames', 'handover.limits.differenceGain', 'handover.limits.underGain', 'judged.fractions', 'detail.minTexelsPerPixel', 'detail.maxSoftPixelFraction', 'detail.minSharpnessRatio', 'detail.minBodyCoverage',
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
  motion: MotionDef
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
  if (!(r.export.warmUpFrames >= 0) || !isWhole(r.export.warmUpFrames)) fail('export.warmUpFrames must be a whole number, 0 or more')
  for (const [id, set] of Object.entries(r.assetSets as Record<string, AssetSetDef>)) {
    for (const key of ['wrapMapWidth', 'reliefWidth', 'skyWidth', 'skyStripWidth', 'maxSetMemoryMb'] as const) {
      if (!isWhole(set[key]) || !(set[key] > 0)) fail('assetSets.' + id + '.' + key + ' must be a whole number above 0')
    }
  }
  for (const [id, t] of Object.entries(r.tiers)) {
    if (!(t.samplesPerFrame >= 1) || !(t.fastSamplesPerFrame >= 1)) fail('tier ' + id + ' has no samples')
    if (!isWhole(t.maxSamplesPerFrame) || t.maxSamplesPerFrame < Math.max(t.samplesPerFrame, t.fastSamplesPerFrame)) fail('tier ' + id + ' has maxSamplesPerFrame under its sample counts')
  }
  const m = r.motion
  if (!(m.maxStepPx > 0)) fail('motion.maxStepPx must be above 0')
  if (m.probeGrid.length !== 2 || m.probeGrid.some((n) => !isWhole(n) || n < 2)) fail('motion.probeGrid needs two whole numbers of at least 2')
  if (!(m.bodyReach >= 1) || !(m.minBodyPx >= 0) || !(m.terrainGround > 0)) fail('motion.bodyReach must be at least 1, motion.minBodyPx at least 0 and motion.terrainGround above 0')
  if (!(m.softFromPx >= 0) || !(m.softToPx > m.softFromPx)) fail('motion.softToPx must be above motion.softFromPx, and that at least 0')
  for (const kind of ['dive', 'rise'] as const) {
    const h = r.handover[kind]
    if (!(h.at > 0 && h.at < 1)) fail('handover.' + kind + '.at must lie between 0 and 1')
    if (!isWhole(h.dissolveFrames) || !(h.dissolveFrames >= 1)) fail('handover.' + kind + '.dissolveFrames must be a whole number of at least 1')
    if (!isWhole(h.placeFrames) || !(h.placeFrames >= 0)) fail('handover.' + kind + '.placeFrames must be a whole number, 0 or more')
    if (!isWhole(h.skyFrames) || !(h.skyFrames >= 0)) fail('handover.' + kind + '.skyFrames must be a whole number, 0 or more')
  }
  const hp = r.handover.place
  if (!isWhole(hp.scale) || !(hp.scale >= 1)) fail('handover.place.scale must be a whole number of at least 1')
  if (!(hp.maxShare >= 0) || !(hp.maxShare <= 2)) fail('handover.place.maxShare must lie between 0 and 2')
  if (!(hp.margin >= 0) || !(hp.margin <= hp.maxShare)) fail('handover.place.margin must lie between 0 and handover.place.maxShare')
  if (!isWhole(hp.maxEdge) || !(hp.maxEdge >= 256)) fail('handover.place.maxEdge must be a whole number of at least 256')
  if (!(hp.edge > 0 && hp.edge <= 1) || !(hp.seen > 0 && hp.seen <= 1)) fail('handover.place.edge and handover.place.seen must be above 0 and at most 1')
  if (!(r.handover.maxEnlarge > 1) || !(hp.enlargeSoft > 0 && hp.enlargeSoft < 1)) fail('handover.maxEnlarge must be above 1 and handover.place.enlargeSoft between 0 and 1')
  if (!(hp.lens >= 0) || !(hp.maxGradTexels >= 1)) fail('handover.place.lens must be 0 or more and handover.place.maxGradTexels at least 1')
  if (!(hp.limbReachDeg >= 0 && hp.limbReachDeg < 90)) fail('handover.place.limbReachDeg must be 0 or more and under 90')
  if (!Array.isArray(hp.limbHoldDeg) || hp.limbHoldDeg.length !== 2 || !(hp.limbHoldDeg[0]! >= 0) || !(hp.limbHoldDeg[1]! > hp.limbHoldDeg[0]!) || !(hp.limbHoldDeg[1]! < 90)) fail('handover.place.limbHoldDeg must be two angles, the first 0 or more, the second above it and under 90')
  if (!Array.isArray(hp.edgeIn) || hp.edgeIn.length !== 4 || !hp.edgeIn.every((x: number) => x >= 0 && x <= 1)) fail('handover.place.edgeIn must be four shares from 0 to 1: left, right, bottom, top')
  const hd = r.handover.descent
  if (!(hd.targetReach > 0 && hd.targetReach <= 1)) fail('handover.descent.targetReach must be above 0 and at most 1')
  for (const name of ['descent', 'ascent'] as const) {
    const path = r.handover[name]
    if (!(path.rise >= 0) || !(path.fall > 0) || !(path.rise + path.fall <= 1)) fail('handover.' + name + '.rise and handover.' + name + '.fall must be 0 or more, above 0, and add up to at most 1')
    if (!(path.turnRise >= 0) || !(path.turnFall > 0) || !(path.turnRise + path.turnFall <= 1)) fail('handover.' + name + '.turnRise and handover.' + name + '.turnFall must be 0 or more, above 0, and add up to at most 1')
    if (typeof path.level !== 'boolean') fail('handover.' + name + '.level must be true or false')
    if (!(path.levelBy > 0 && path.levelBy <= 1)) fail('handover.' + name + '.levelBy must be above 0 and at most 1')
  }
  const hz = r.handover.zenithDeg
  if (!Array.isArray(hz) || hz.length !== 2 || !(hz[0]! >= 0) || !(hz[1]! > hz[0]!) || !(hz[1]! < 90)) fail('handover.zenithDeg must be two angles, the first 0 or more, the second above it and under 90')
  if (!(r.handover.maxRateOverMean > 1)) fail('handover.maxRateOverMean must be above 1')
  if (!(r.handover.coastFrames >= 0)) fail('handover.coastFrames must be 0 or more')
  if (!(r.handover.skyFloor.marginDeg >= 0) || !(r.handover.skyFloor.featherDeg > 0)) fail('handover.skyFloor.marginDeg must be 0 or more and handover.skyFloor.featherDeg above 0')
  const hl = r.handover.limits as Record<string, number>
  for (const [key, value] of Object.entries(hl)) if (!(value > 0)) fail('handover.limits.' + key + ' must be above 0')
  if (!(hl.earlyShare! < 1) || !(hl.placeMiddle! <= 1) || !(hl.flatShare! <= 1) || !(hl.bodyShare! <= 1) || !(hl.flowStepFrames! <= 1)) fail('handover.limits.earlyShare must be under 1, handover.limits.placeMiddle, handover.limits.flatShare, handover.limits.bodyShare and handover.limits.flowStepFrames at most 1')
  if (!isWhole(hl.blockPx!) || !isWhole(hl.sheetFrames!)) fail('handover.limits.blockPx and handover.limits.sheetFrames must be whole numbers')
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
    motion: { maxStepPx: m.maxStepPx, probeGrid: [m.probeGrid[0]!, m.probeGrid[1]!], bodyReach: m.bodyReach, minBodyPx: m.minBodyPx, terrainGround: m.terrainGround, softFromPx: m.softFromPx, softToPx: m.softToPx },
    stops: r.stops,
    stopIds,
    segments,
    maxLoadedSets: r.sets.maxLoaded,
    endingId: ENDING,
  }
}

export const config: Config = buildConfig(raw)
