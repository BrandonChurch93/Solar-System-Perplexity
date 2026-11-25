// The class this report looks for: one size of the film shows another surface than the other in the same film frame (the levels of a
// surface fade by the size of their textures on the frame, so a larger frame or a smaller texture can stand on another level). Read as the
// pattern of the frame drawn large and scaled down against the frame drawn at the film's size, the pattern reader's own number, on pairs
// through every move.

// Proposed, not yet a gate: the clean pairs measured so far read 0.022 at most, the two frames of the known fault 0.77 and 0.97.
export const PROPOSED = 0.1

// One pair each EVERY film frames: the known fault stood for about 15 film frames.
export const EVERY = 8

export interface Move { segment: string; kind: string; first: number; end: number }

export interface Pair { segment: string; kind: string; frame: number }

export interface PairRow extends Pair { pattern: number | null; at: [number, number] | null; share: number; wide: number | null }

// The dive and the rise of a stop with reach film frames to each side, the window the pictures part of the smooth report reads.
export function movesOf(segments: { id: string; stop: string; kind: string; firstFrame: number; endFrame: number }[], stop: string, kinds: string[], reach: number, frameCount: number): Move[] {
  return segments.filter((s) => s.stop === stop && (s.kind === 'dive' || s.kind === 'rise') && kinds.includes(s.kind)).map((s) => ({ segment: s.id, kind: s.kind, first: Math.max(s.firstFrame - reach, 0), end: Math.min(s.endFrame + reach, frameCount) }))
}

export function pairsOf(move: Move, every: number, from: number | null = null, to: number | null = null): Pair[] {
  const out: Pair[] = []
  for (let frame = move.first; frame < move.end; frame += every) {
    if ((from !== null && frame < from) || (to !== null && frame > to)) continue
    out.push({ segment: move.segment, kind: move.kind, frame })
  }
  return out
}

export function overOf(rows: PairRow[], limit: number): PairRow[] {
  return rows.filter((row) => row.pattern !== null && row.pattern > limit)
}

export function unread(rows: PairRow[]): PairRow[] {
  return rows.filter((row) => row.pattern === null)
}

export interface Told { formats: [string, string]; factor: number; tier: string; every: number; bandPx: [number, number]; machine: string; seconds: Record<string, number | null>; commit: string }

const cell = (v: number | null, digits: number): string => (v === null ? 'none' : v.toFixed(digits))

export function linesOf(stop: string, moves: Move[], rows: PairRow[], told: Told, limit = PROPOSED): string[] {
  const [bigId, filmId] = told.formats
  const read = rows.filter((row) => row.pattern !== null)
  const over = overOf(rows, limit)
  const none = unread(rows)
  const top = read.length > 0 ? read.reduce((x, y) => (y.pattern! > x.pattern! ? y : x)) : null
  const lines = [
    '# The film at its two sizes: ' + stop, '',
    'A report, not a gate: it turns nothing red. Commit ' + told.commit + '.', '',
    'The same film frame at ' + bigId + ' scaled down by ' + told.factor + ' against ' + filmId + ', both with the full asset set, tier ' + told.tier + ': the pattern of one against the other in the band of ' + told.bandPx[0] + ' to ' + told.bandPx[1] + ' px of the film frame, 0 the same pattern, 1 an unrelated one, the 99th percentile of the frame (the pattern reader of the smooth report, its own widths and floor). One pair each ' + told.every + ' film frames of ' + moves.map((m) => 'the ' + m.kind + ' (' + m.segment + ', film frames ' + m.first + ' to ' + (m.end - 1) + ')').join(' and ') + '. Seconds a rendered frame on ' + told.machine + ': ' + Object.entries(told.seconds).map(([k, v]) => k + ' ' + (v === null ? 'none rendered' : v)).join(', ') + '.', '',
    'Proposed limit ' + limit + ', not yet a gate. ' + rows.length + (rows.length === 1 ? ' pair' : ' pairs') + ', ' + read.length + ' read. Largest: ' + (top ? top.pattern!.toFixed(3) + ' at film frame ' + top.frame + ' (' + top.segment + ')' : 'none') + '. Over the proposed limit: ' + (over.length === 0 ? 'none' : over.length + ' (' + over.map((row) => 'frame ' + row.frame + ': ' + row.pattern!.toFixed(3)).join(', ') + ')') + '.' + (none.length > 0 ? ' NOT MEASURED, too little of the frame holds detail in both: ' + none.map((row) => 'frame ' + row.frame).join(', ') + '.' : ''), '',
    '| film frame | segment | pattern, ' + told.bandPx[0] + ' to ' + told.bandPx[1] + ' px | over the proposed limit | judged share | at | pattern, ' + told.bandPx[1] + ' to ' + told.bandPx[1] * 5 + ' px |',
    '|---|---|---|---|---|---|---|',
  ]
  for (const row of rows) lines.push('| ' + [row.frame, row.segment, cell(row.pattern, 3), row.pattern === null ? 'not measured' : row.pattern > limit ? 'OVER' : '', row.share.toFixed(2), row.at ? row.at.join(',') : '', cell(row.wide, 3)].join(' | ') + ' |')
  lines.push('', 'judged share: the share of the frame where both pictures hold detail over the reader\'s floor. at: where the pattern differs most, px of the film frame. The pictures of a pair over the proposed limit are kept beside this file.')
  return lines
}
