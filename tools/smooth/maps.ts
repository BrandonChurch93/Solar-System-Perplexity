export interface Read { k: number; pattern: number | null; patternMap?: number | null; patternMapNo?: string | null; patternMapBody?: number | null; patternMapRefused?: number | null; patternMapSky?: number | null; patternMapSkyFar?: number | null; patternMapAlone?: number | null; patternMapMoves?: number | null; patternMapMoved?: number | null }

export const NOT_CARRIED = 'the range does not carry the pattern'

// The reading after the map and then one flow on what is left: on the bodies where the row has one, the whole frame's where it has none.
export const flowed = (row: Read): number | null | undefined => row.patternMapBody ?? row.patternMap

// The surface of the row's body moves by itself: its drawer names in the record how far it may (patternMapMoves, px of the frame between the
// two frames of the pair). No such number: the body is rigid.
export const moving = (row: Read): boolean => (row.patternMapMoves ?? null) !== null

// The picture's own way along the flows parts from the map on a moving body (patternMapMoved) by more than its drawer names: more than the
// surface's own motion is in it.
export const outrun = (row: Read): boolean => moving(row) && (row.patternMapMoved ?? null) !== null && row.patternMapMoved! > row.patternMapMoves!

export const NOT_FOLLOWED = 'the picture\'s own flow is not measured on a body whose surface moves by itself'

// A moving body whose own flow is not measured: nothing says that the surface stays within what its drawer names, or no reading follows it.
export const unfollowed = (row: Read): boolean => moving(row) && !outrun(row) && ((row.patternMapMoved ?? null) === null || row.pattern === null)

// The number of a row under the map's reader. In place is at the same point of the matter: on a rigid body the map alone says where that
// is, and the reading is the map's alone; on a body whose surface moves by itself it is the reading by the picture's own flow, main's
// reader's, as long as that flow stays within what the drawer names of the map, and the map's alone where it does not. A row of a run
// that did not read the map alone has the reading after the map and one flow.
export const mapOf = (row: Read): number | null | undefined => (row.patternMapAlone === undefined ? flowed(row) : !moving(row) || outrun(row) ? row.patternMapAlone : row.pattern)

// A row the map refuses because the range does not carry the pattern is judged by main's reader, by the flow.
export const byFlow = (row: Read): boolean => row.patternMapNo === NOT_CARRIED

// Main's red line on a row read beside the camera's map names how its later frame was carried, and how far that carry lies from the map. A
// row read without the map (the flag off) keeps main's words as they are.
export const chained = (row: Read, flows: number): string => (row.patternMap === undefined ? '' : ', the later frame carried by the chain of the ' + flows + ' flows from frame to frame' + ((row.patternMapMoved ?? null) !== null ? ' (that chain parts from the camera\'s map on the body by ' + row.patternMapMoved!.toFixed(1) + ' px)' : ''))

export interface Apart { first: number; last: number; rows: number; k: number; main: number; map: number; red: 'main' | 'map'; no?: string }

// The rows where main's reader and the reader by the camera's map fall on different sides of their limits, as runs of rows that follow each
// other: each run with the row where the two lie farthest apart. A row either reader has no number for is in no run and ends one; a row the
// map's reader refuses (patternMapNo) is a red of it, farther from main's number than any reading; but a row it refuses because the range
// does not carry the pattern is judged by main's reader and is in no run.
export function apart<T extends Read>(rows: T[], max: number | null, mapMax: number | null): Apart[] {
  if (max === null || mapMax === null) return []
  const out: Apart[] = []
  let run: Apart | null = null
  let before = Number.NaN
  for (const row of rows) {
    const main = row.pattern
    const no = row.patternMapNo ?? null
    const map = no !== null ? Number.POSITIVE_INFINITY : mapOf(row)
    const differs = !byFlow(row) && main !== null && map !== null && map !== undefined && main > max !== map > mapMax
    if (!differs) {
      run = null
      continue
    }
    const red = main! > max ? 'main' : 'map'
    if (run && row.k === before + 1 && run.red === red) {
      run.last = row.k
      run.rows += 1
      if (Math.abs(main! - map!) > Math.abs(run.main - run.map)) Object.assign(run, { k: row.k, main: main!, map: map!, ...(no !== null ? { no } : {}) })
    } else {
      run = { first: row.k, last: row.k, rows: 1, k: row.k, main: main!, map: map!, red, ...(no !== null ? { no } : {}) }
      out.push(run)
    }
    before = row.k
  }
  return out
}

// The rows shown as pictures: the largest reading by the map and one row of each run where the two readers differ, the refused first, at most
// count of them.
export function shownRows<T extends Read>(rows: T[], max: number | null, mapMax: number | null, count: number): T[] {
  const read = rows.filter((row) => row.patternMap !== null && row.patternMap !== undefined)
  const ks = new Set<number>(read.length > 0 ? [read.reduce((x, y) => ((mapOf(y) ?? -1) > (mapOf(x) ?? -1) ? y : x)).k] : [])
  const far = (run: Apart): number => (run.no ? Number.MAX_VALUE : Math.abs(run.main - run.map))
  for (const run of apart(rows, max, mapMax).sort((x, y) => far(y) - far(x))) {
    if (ks.size >= count) break
    ks.add(run.k)
  }
  return rows.filter((row) => ks.has(row.k))
}

// The film's bloom (src/post/chain.ts): the buffer is halved levels times, each halving taking taps of the texels it reads to every side, and
// laid back up level by level, each step a tent of one texel of the level below it times the shot's bloom radius. Counted in pixels of the
// buffer, which the picture of a frame is one to one, whatever the frame factor.
export const BLOOM = { levels: 6, taps: 2 }

// How far the glow of a body reaches over the sky beside it, in pixels of the frame: the whole reach of the bloom, the halvings' taps
// (taps times 1, 2, 4 and so on) and the tents of the way back up (the radius times 4, 8 and so on up to the widest texel). Beyond it the
// bloom of the body adds nothing to a pixel.
export const glowPx = (bloomRadius: number): number => BLOOM.taps * (2 ** BLOOM.levels - 1) + bloomRadius * (2 ** (BLOOM.levels + 1) - 4)

// The map's reader has a word on a row: a number or a refusal.
export const worded = (row: Read): boolean => row.patternMap !== undefined && ((row.patternMapNo ?? null) !== null || (mapOf(row) ?? null) !== null)

// A row to look at: the sky off every body reads over the limit and the sky far from the limbs does not.
export const look = (row: Read, max: number | null): boolean => max !== null && (row.patternMapSky ?? null) !== null && row.patternMapSky! > max && !((row.patternMapSkyFar ?? null) !== null && row.patternMapSkyFar! > max)

export interface MapFault { kind: 'body' | 'far' | 'refused' | 'outrun'; rows: number; first: number; k: number; value: number | null; no?: string; moved?: number; moves?: number }

// What the map's reader finds red: the pattern on the body (the whole frame's where no body holds enough of it) over the limit, the pattern
// of the sky far from the limbs over the limit, every row of a moving body whose own flow parts from the map by more than its drawer
// names, whatever it reads, every row of a moving body whose own flow is not measured,
// and every refusal by its reason; but a row refused because the range does not carry the pattern is main's reader's to judge, and is red
// here only where main's reader has no number for it either. Of each the count of rows, the first and the largest.
export function mapFaults<T extends Read>(rows: T[], max: number | null): MapFault[] {
  const out: MapFault[] = []
  const most = (kind: 'body' | 'far', of: (row: T) => number | null | undefined): void => {
    if (max === null) return
    const bad = rows.filter((row) => (of(row) ?? null) !== null && of(row)! > max)
    if (bad.length === 0) return
    const top = bad.reduce((x, y) => (of(y)! > of(x)! ? y : x))
    out.push({ kind, rows: bad.length, first: bad[0]!.k, k: top.k, value: of(top)! })
  }
  most('body', (row) => (row.patternMap === undefined || row.patternMapNo || outrun(row) ? null : mapOf(row)))
  most('far', (row) => row.patternMapSkyFar)
  const fast = rows.filter((row) => !row.patternMapNo && outrun(row))
  if (fast.length > 0) {
    const top = fast.reduce((x, y) => (y.patternMapMoved! - y.patternMapMoves! > x.patternMapMoved! - x.patternMapMoves! ? y : x))
    out.push({ kind: 'outrun', rows: fast.length, first: fast[0]!.k, k: top.k, value: top.patternMapAlone ?? null, moved: top.patternMapMoved!, moves: top.patternMapMoves! })
  }
  const lost = rows.filter((row) => row.patternMap !== undefined && row.patternMapAlone !== undefined && !row.patternMapNo && unfollowed(row))
  if (lost.length > 0) out.push({ kind: 'refused', rows: lost.length, first: lost[0]!.k, k: lost[0]!.k, value: null, no: NOT_FOLLOWED })
  for (const no of [...new Set(rows.filter((row) => row.patternMapNo).map((row) => row.patternMapNo!))]) {
    const bad = rows.filter((row) => row.patternMapNo === no && !(byFlow(row) && row.pattern !== null))
    if (bad.length === 0) continue
    const top = bad.reduce((x, y) => ((y.patternMapRefused ?? -1) > (x.patternMapRefused ?? -1) ? y : x))
    out.push({ kind: 'refused', rows: bad.length, first: bad[0]!.k, k: top.k, value: top.patternMapRefused ?? null, no })
  }
  return out
}
