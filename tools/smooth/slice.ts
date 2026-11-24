// One move's pictures in slices: which frames of the window a slice owns, which frames it must have to give their numbers as the whole
// window gives them, and what a set of slices leaves out. Every frame is an index in the window (0 is its first capture frame).

export interface Span { first: number; end: number }

// The window of the pop's median round frame i of n: the twin of span() in tools/img/smooth.py. lead and tail are the frames of context
// drawn before frame 0 and after frame n - 1: with half a window of them at each end no frame's window is moved inward.
export function popSpan(i: number, n: number, window: number, lead = 0, tail = 0): [number, number] {
  const lo = Math.max(Math.min(i - Math.floor(window / 2), n - 1 + tail - window), 0 - lead)
  return [lo, Math.min(lo + window, n - 1 + tail)]
}

// The frames of context at the two ends of a window of film frames first to end - 1: half a window of the median, less where the film ends.
export function popContext(first: number, end: number, frameCount: number, window: number): [number, number] {
  const half = Math.floor(window / 2)
  return [Math.min(half, first), Math.min(half, frameCount - end)]
}

// Part I of N of a window of total frames: whole frames, every frame in exactly one part.
export function partOwn(part: number, of: number, total: number): Span {
  return { first: Math.floor(((part - 1) * total) / of), end: Math.floor((part * total) / of) }
}

// The frames a slice must have, both ends included: the two neighbours of each of its frames (the level step), every frame of the median's
// window and the one after its last (the pop is what is left between a frame and the next), and the frame reach frames later (the change in place).
export function sliceNeed(own: Span, total: number, window: number, reach: number, lead = 0, tail = 0): [number, number] {
  let lo = own.first
  let hi = own.end - 1
  for (let i = own.first; i < own.end; i++) {
    const [a, b] = popSpan(i, total, window, lead, tail)
    lo = Math.min(lo, a, i - 1)
    hi = Math.max(hi, b + 1, i + 1, i + reach)
  }
  return [Math.max(lo, 0 - lead), Math.min(hi, total - 1 + tail)]
}

export function sliceName(part: number | null, of: number | null, firstK: number, lastK: number): string {
  return part !== null && of !== null ? 'p' + part + 'of' + of : 'k' + firstK + '-' + lastK
}

// The runs of frames that no slice owns.
export function missing(have: Span[], total: number): Span[] {
  const got = new Array<boolean>(total).fill(false)
  for (const s of have) for (let i = Math.max(s.first, 0); i < Math.min(s.end, total); i++) got[i] = true
  const out: Span[] = []
  for (let i = 0; i < total; i++) {
    if (got[i]) continue
    const last = out.at(-1)
    if (last && last.end === i) last.end = i + 1
    else out.push({ first: i, end: i + 1 })
  }
  return out
}
