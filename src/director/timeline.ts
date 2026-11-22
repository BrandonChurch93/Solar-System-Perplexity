import { config, type CoverWindow, type Segment } from '../config'

export function segmentAtFrame(frame: number): Segment {
  const f = Math.min(Math.max(frame, 0), config.frameCount - 1)
  for (const s of config.segments) if (f >= s.firstFrame && f < s.endFrame) return s
  return config.segments[config.segments.length - 1]!
}

export function segmentAtTime(seconds: number): Segment {
  const t = Math.min(Math.max(seconds, 0), config.durationSeconds - 1e-9)
  for (const s of config.segments) if (t >= s.start && t < s.end) return s
  return config.segments[config.segments.length - 1]!
}

export function segmentById(id: string): Segment {
  const s = config.segments.find((x) => x.id === id)
  if (!s) throw new Error('unknown segment ' + id)
  return s
}

export function fractionIn(segment: Segment, seconds: number): number {
  return Math.min(Math.max((seconds - segment.start) / (segment.end - segment.start), 0), 1)
}

export interface CoverTiming { seconds?: number; center?: number }
export interface CoverTimings { dive?: CoverTiming; rise?: CoverTiming }

const timings = new Map<string, CoverTimings>()

export function setCoverWindow(stop: string, w: CoverTimings | undefined): void {
  for (const t of [w?.dive, w?.rise]) {
    if (t?.seconds !== undefined && !(t.seconds > 0)) throw new Error('coverWindow.seconds of ' + stop + ' must be above 0')
    if (t?.center !== undefined && !(t.center > 0 && t.center < 1)) throw new Error('coverWindow.center of ' + stop + ' must lie between 0 and 1')
  }
  if (w) timings.set(stop, w)
  else timings.delete(stop)
}

export function coverTiming(segment: Segment): { seconds: number; center: number } | null {
  const c = config.raw.cover
  const fraction = segment.kind === 'dive' ? c.diveCenterFraction : segment.kind === 'rise' ? c.riseCenterFraction : null
  if (fraction === null) return null
  const own = timings.get(segment.stop)?.[segment.kind as 'dive' | 'rise']
  return { seconds: own?.seconds ?? c.seconds, center: segment.start + (own?.center ?? fraction) * (segment.end - segment.start) }
}

export function coverWindow(segment: Segment): CoverWindow | null {
  const t = coverTiming(segment)
  if (t === null) return null
  const first = Math.floor((t.center - t.seconds / 2) * config.fps + 1e-9)
  const last = Math.floor((t.center + t.seconds / 2) * config.fps + 1e-9)
  return {
    firstFrame: Math.max(first, segment.firstFrame),
    lastFrame: Math.min(last, segment.endFrame - 1),
    centerFrame: Math.floor(t.center * config.fps + 1e-9),
  }
}

export interface JudgedFrame { frame: number; segment: string; stop: string; why: string }

export function judgedFrames(): JudgedFrame[] {
  const out: JudgedFrame[] = []
  const add = (frame: number, why: string): void => {
    const s = segmentAtFrame(frame)
    if (!out.some((j) => j.frame === frame)) out.push({ frame, segment: s.id, stop: s.stop, why })
  }
  add(0, 'frame 0')
  add(config.hookFrame, 'hook')
  const fractions = config.raw.judged.fractions as Record<string, number>
  for (const s of config.segments) {
    const fr = fractions[s.kind]
    if (fr === undefined) continue
    add(s.firstFrame + Math.floor(fr * s.frames + 1e-9), s.kind)
  }
  return out.sort((a, b) => a.frame - b.frame)
}

export function stopSegments(stop: string): Segment[] {
  return config.segments.filter((s) => s.stop === stop)
}

export function setsForFrame(frame: number): string[] {
  const s = segmentAtFrame(frame)
  const stops = config.stopIds
  if (s.stop === config.endingId) return [stops[stops.length - 1]!]
  if (s.kind === 'travel') {
    const i = stops.indexOf(s.stop)
    const next = stops[i + 1]
    return next ? [s.stop, next] : [s.stop]
  }
  return [s.stop]
}

export function clipRange(stop: string): { firstFrame: number; endFrame: number } {
  const segs = stopSegments(stop).filter((s) => s.kind !== 'travel')
  if (segs.length === 0) throw new Error('no segments for stop ' + stop)
  return { firstFrame: segs[0]!.firstFrame, endFrame: segs[segs.length - 1]!.endFrame }
}
