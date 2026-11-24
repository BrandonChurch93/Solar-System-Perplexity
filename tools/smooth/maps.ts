export interface Read { k: number; pattern: number | null; patternMap?: number | null }

export interface Apart { first: number; last: number; rows: number; k: number; main: number; map: number; red: 'main' | 'map' }

// The rows where main's reader and the reader by the camera's map fall on different sides of their limits, as runs of rows that follow each
// other: each run with the row where the two lie farthest apart. A row either reader has no number for is in no run and ends one.
export function apart<T extends Read>(rows: T[], max: number | null, mapMax: number | null): Apart[] {
  if (max === null || mapMax === null) return []
  const out: Apart[] = []
  let run: Apart | null = null
  let before = Number.NaN
  for (const row of rows) {
    const main = row.pattern
    const map = row.patternMap
    const differs = main !== null && map !== null && map !== undefined && main > max !== map > mapMax
    if (!differs) {
      run = null
      continue
    }
    const red = main! > max ? 'main' : 'map'
    if (run && row.k === before + 1 && run.red === red) {
      run.last = row.k
      run.rows += 1
      if (Math.abs(main! - map!) > Math.abs(run.main - run.map)) Object.assign(run, { k: row.k, main: main!, map: map! })
    } else {
      run = { first: row.k, last: row.k, rows: 1, k: row.k, main: main!, map: map!, red }
      out.push(run)
    }
    before = row.k
  }
  return out
}

// The rows shown as pictures: the largest reading by the map and one row of each run where the two readers differ, at most count of them.
export function shownRows<T extends Read>(rows: T[], max: number | null, mapMax: number | null, count: number): T[] {
  const read = rows.filter((row) => row.patternMap !== null && row.patternMap !== undefined)
  if (read.length === 0) return []
  const ks = new Set<number>([read.reduce((x, y) => (y.patternMap! > x.patternMap! ? y : x)).k])
  for (const run of apart(rows, max, mapMax).sort((x, y) => Math.abs(y.main - y.map) - Math.abs(x.main - x.map))) {
    if (ks.size >= count) break
    ks.add(run.k)
  }
  return rows.filter((row) => ks.has(row.k))
}
