export interface Read { k: number; pattern: number | null; patternMap?: number | null; patternMapNo?: string | null; patternMapBody?: number | null; patternMapRefused?: number | null; patternMapSky?: number | null; patternMapSkyFar?: number | null }

// The number of a row under the map's reader: the reading on the bodies where the row has one, the whole frame's where it has none.
export const mapOf = (row: Read): number | null | undefined => row.patternMapBody ?? row.patternMap

export interface Apart { first: number; last: number; rows: number; k: number; main: number; map: number; red: 'main' | 'map'; no?: string }

// The rows where main's reader and the reader by the camera's map fall on different sides of their limits, as runs of rows that follow each
// other: each run with the row where the two lie farthest apart. A row either reader has no number for is in no run and ends one; a row the
// map's reader refuses (patternMapNo) is a red of it, farther from main's number than any reading.
export function apart<T extends Read>(rows: T[], max: number | null, mapMax: number | null): Apart[] {
  if (max === null || mapMax === null) return []
  const out: Apart[] = []
  let run: Apart | null = null
  let before = Number.NaN
  for (const row of rows) {
    const main = row.pattern
    const no = row.patternMapNo ?? null
    const map = no !== null ? Number.POSITIVE_INFINITY : mapOf(row)
    const differs = main !== null && map !== null && map !== undefined && main > max !== map > mapMax
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
  const ks = new Set<number>(read.length > 0 ? [read.reduce((x, y) => (mapOf(y)! > mapOf(x)! ? y : x)).k] : [])
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

export interface MapFault { kind: 'body' | 'far' | 'refused'; rows: number; first: number; k: number; value: number | null; no?: string }

// What the map's reader finds red: the pattern on the body (the whole frame's where no body holds enough of it) over the limit, the pattern
// of the sky far from the limbs over the limit, and every refusal by its reason. Of each the count of rows, the first and the largest.
export function mapFaults<T extends Read>(rows: T[], max: number | null): MapFault[] {
  const out: MapFault[] = []
  const most = (kind: 'body' | 'far', of: (row: T) => number | null | undefined): void => {
    if (max === null) return
    const bad = rows.filter((row) => (of(row) ?? null) !== null && of(row)! > max)
    if (bad.length === 0) return
    const top = bad.reduce((x, y) => (of(y)! > of(x)! ? y : x))
    out.push({ kind, rows: bad.length, first: bad[0]!.k, k: top.k, value: of(top)! })
  }
  most('body', (row) => (row.patternMap === undefined || row.patternMapNo ? null : mapOf(row)))
  most('far', (row) => row.patternMapSkyFar)
  for (const no of [...new Set(rows.filter((row) => row.patternMapNo).map((row) => row.patternMapNo!))]) {
    const bad = rows.filter((row) => row.patternMapNo === no)
    const top = bad.reduce((x, y) => ((y.patternMapRefused ?? -1) > (x.patternMapRefused ?? -1) ? y : x))
    out.push({ kind: 'refused', rows: bad.length, first: bad[0]!.k, k: top.k, value: top.patternMapRefused ?? null, no })
  }
  return out
}
