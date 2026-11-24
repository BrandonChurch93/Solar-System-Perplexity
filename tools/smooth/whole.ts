// The report of a stop from files that several machines wrote: the pictures of each move in slices, and the path, the place, the parity and
// the counts from runs with --only or --part. A file is taken by what it holds, not by its name.

export const PIECES = ['path', 'place', 'parity', 'counts']
export const MOVES = ['dive', 'rise']

export function pieceStem(stop: string, kind: string | null, pieces: string[]): string {
  return stop + (kind ? '-' + kind : '') + '-part-' + pieces.join('-')
}

export interface Report {
  stop?: string; commit?: string; engineHash?: string | null; stopHash?: string | null; machine?: string; rate?: number; kinds?: string[]; only?: string[]
  limits?: unknown; slice?: unknown; joined?: unknown; seconds?: number
  parts?: Record<string, { measured?: boolean; pass?: boolean; why?: string[]; kinds?: Record<string, unknown> } | undefined>
}
export interface Given { file: string; j: unknown }
export type Role = { is: 'slice'; kind: string } | { is: 'parts'; holds: string[]; kind: string | null } | { is: 'other'; why: string }

export function roleOf(stop: string, raw: unknown): Role {
  const other = (why: string): Role => ({ is: 'other', why })
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return other('not a report')
  const j = raw as Report
  if (j.stop !== stop) return other('not a report of ' + stop)
  const only = j.only ?? []
  const kinds = j.kinds ?? []
  if (j.joined !== undefined) return other('a joined report')
  if (j.slice !== undefined) return only.join() === 'pictures' && kinds.length === 1 && MOVES.includes(kinds[0]!) && j.parts?.pictures ? { is: 'slice', kind: kinds[0]! } : other('a slice of something else than the pictures of one move')
  if (only.includes('pictures')) return other('a report with the pictures of one run')
  if (only.length === 0 || only.some((p) => !PIECES.includes(p)) || only.some((p) => !j.parts?.[p])) return other('not a report')
  if (kinds.join() === MOVES.join()) return { is: 'parts', holds: only, kind: null }
  if (kinds.length === 1 && MOVES.includes(kinds[0]!) && only.join() === 'place') return { is: 'parts', holds: only, kind: kinds[0]! }
  return other(kinds.length === 0 ? 'the landing' : 'one move alone: only the place and the pictures are measured a move')
}

export interface Holder { file: string; j: Report; kind: string | null }
export interface Gathered { slices: Record<string, { file: string; j: Report }[]>; holders: Record<string, Holder[]>; same: string[]; ignored: { file: string; why: string }[] }

export type Facts = [string, unknown][]

export function runFacts(j: { commit?: string; engineHash?: string | null; stopHash?: string | null; rate?: number; limits?: unknown }): Facts {
  return [['commit', j.commit ?? null], ['engine hash', j.engineHash ?? null], ['stop hash', j.stopHash ?? null], ['capture rate', j.rate ?? null], ['limits', j.limits ?? null]]
}

// The first fact in which two files are not one run, as text; null when they agree.
export function differ(mine: Facts, theirs: Facts): string | null {
  for (let i = 0; i < mine.length; i++) {
    const x = JSON.stringify(mine[i]![1])
    const y = JSON.stringify(theirs[i]![1])
    if (x !== y) return mine[i]![0] + (x.length + y.length < 200 ? ' (' + x + ' against ' + y + ')' : '')
  }
  return null
}

// Every file by what it holds. A part that two files hold with the same numbers from the same run is taken once.
export function gather(stop: string, files: Given[]): Gathered {
  const out: Gathered = { slices: {}, holders: {}, same: [], ignored: [] }
  for (const kind of MOVES) out.slices[kind] = []
  for (const piece of PIECES) out.holders[piece] = []
  for (const f of [...files].sort((x, y) => x.file.localeCompare(y.file, 'en', { numeric: true }))) {
    const role = roleOf(stop, f.j)
    const j = f.j as Report
    if (role.is === 'other') {
      if (j !== null && typeof j === 'object' && j.stop === stop) out.ignored.push({ file: f.file, why: role.why })
      continue
    }
    if (role.is === 'slice') {
      out.slices[role.kind]!.push({ file: f.file, j })
      continue
    }
    for (const piece of role.holds) {
      const twin = out.holders[piece]!.find((h) => h.kind === role.kind && JSON.stringify(h.j.parts![piece]) === JSON.stringify(j.parts![piece]) && differ(runFacts(h.j), runFacts(j)) === null && h.j.machine === j.machine)
      if (twin) out.same.push('the ' + piece + ' of ' + f.file + ' is the ' + piece + ' of ' + twin.file + ' once more: taken once')
      else out.holders[piece]!.push({ file: f.file, j, kind: role.kind })
    }
  }
  return out
}

const line = (stop: string, what: string): string => 'npm run smooth -- --stop ' + stop + ' ' + what

// What the files lack or hold twice. moves are the kinds the stop has a segment of: only they have pictures.
export function gatherFaults(stop: string, g: Gathered, moves: string[]): string[] {
  const out: string[] = []
  for (const piece of PIECES) {
    const have = g.holders[piece]!
    const whole = have.filter((h) => h.kind === null)
    const byKind = have.filter((h) => h.kind !== null)
    const names = (list: Holder[]): string => list.map((h) => h.file).join(', ')
    if (whole.length > 1 || (whole.length > 0 && byKind.length > 0)) out.push('twice: the ' + piece + ' is in ' + names(have) + ' with other numbers or from another run')
    else if (have.length === 0) out.push('missing: the ' + piece + ' (' + line(stop, '--part ' + piece) + ', or a run with --only that holds it)')
    else if (whole.length === 0) {
      for (const kind of MOVES) {
        const mine = byKind.filter((h) => h.kind === kind)
        if (mine.length === 0) out.push('missing: the ' + piece + ' of the ' + kind + ' (' + line(stop, '--part ' + piece + ' --kind ' + kind) + ')')
        if (mine.length > 1) out.push('twice: the ' + piece + ' of the ' + kind + ' is in ' + names(mine) + ' with other numbers or from another run')
      }
    }
  }
  for (const kind of moves) if (g.slices[kind]!.length === 0) out.push('missing: the pictures of the ' + kind + ' (' + line(stop, '--kind ' + kind + ' --only pictures --part I/N') + ')')
  return out
}

// Why the files are not of the build that joins them; '' when they are. acceptCommit names the commit of the parts when the join runs elsewhere.
export function buildFault(parts: Facts, here: Facts, acceptCommit?: string): string {
  for (let i = 0; i < parts.length; i++) {
    const [what, value] = parts[i]!
    if (what === 'commit' && acceptCommit !== undefined) {
      if (value !== acceptCommit) return 'the parts are of commit ' + String(value) + ', --commit names ' + acceptCommit
      continue
    }
    const x = JSON.stringify(value)
    const y = JSON.stringify(here[i]![1])
    if (x !== y) return 'the parts and this tree differ in the ' + what + (x.length + y.length < 200 ? ' (' + x + ' against ' + y + ')' : '') + (what === 'commit' ? ': join at that commit, or name it with --commit ' + String(value).split(' ')[0] : '')
  }
  return ''
}
