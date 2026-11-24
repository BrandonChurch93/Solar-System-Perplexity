// The report of a stop from files that several machines wrote: the pictures of each move in slices, and the path, the place, the parity and
// the counts each as a part file of one machine. Which file is which, what is missing or there twice, and where two files are not one run.

export const PIECES = ['path', 'place', 'parity', 'counts']
export const MOVES = ['dive', 'rise']

export function pieceStem(stop: string, kind: string | null, piece: string): string {
  return stop + (kind ? '-' + kind : '') + '-part-' + piece
}

export interface PieceName { file: string; piece: string; kind: string | null }
export interface Folder { slices: Record<string, string[]>; pieces: PieceName[] }

const safe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function sortFolder(stop: string, names: string[]): Folder {
  const slices: Record<string, string[]> = {}
  for (const kind of MOVES) {
    const re = new RegExp('^' + safe(stop) + '-' + kind + '-(p\\d+of\\d+|k\\d+-\\d+)\\.json$')
    slices[kind] = names.filter((f) => re.test(f)).sort((x, y) => x.localeCompare(y, 'en', { numeric: true }))
  }
  const re = new RegExp('^' + safe(stop) + '(?:-(' + MOVES.join('|') + '))?-part-(' + PIECES.join('|') + ')\\.json$')
  const pieces: PieceName[] = []
  for (const file of [...names].sort()) {
    const m = re.exec(file)
    if (m) pieces.push({ file, piece: m[2]!, kind: m[1] ?? null })
  }
  return { slices, pieces }
}

// What a folder lacks or holds twice. moves are the kinds the stop has a segment of: only they have pictures.
export function folderFaults(stop: string, found: Folder, moves: string[]): string[] {
  const out: string[] = []
  for (const piece of PIECES) {
    const have = found.pieces.filter((p) => p.piece === piece)
    const whole = have.filter((p) => p.kind === null)
    const byKind = have.filter((p) => p.kind !== null)
    const line = 'npm run smooth -- --stop ' + stop + ' --part ' + piece
    if (piece !== 'place') {
      for (const p of byKind) out.push(p.file + ': the ' + piece + ' is one part of the whole stop, it has no --kind')
      if (whole.length === 0) out.push('missing: the ' + piece + ' (' + pieceStem(stop, null, piece) + '.json, ' + line + ')')
      continue
    }
    if (whole.length > 0 && byKind.length > 0) out.push('twice: the place is in ' + whole[0]!.file + ' and in ' + byKind.map((p) => p.file).join(', '))
    else if (whole.length === 0 && byKind.length === 0) out.push('missing: the place (' + pieceStem(stop, null, piece) + '.json, ' + line + ', or one file a move with --kind dive and --kind rise)')
    else if (whole.length === 0) for (const kind of MOVES) if (!byKind.some((p) => p.kind === kind)) out.push('missing: the place of the ' + kind + ' (' + pieceStem(stop, kind, piece) + '.json, ' + line + ' --kind ' + kind + ')')
  }
  for (const kind of moves) if ((found.slices[kind] ?? []).length === 0) out.push('missing: the pictures of the ' + kind + ' (' + stop + '-' + kind + '-pIofN.json, npm run smooth -- --stop ' + stop + ' --kind ' + kind + ' --only pictures --part I/N)')
  return out
}

export type Facts = [string, unknown][]

// The first fact in which two files are not one run, as text; null when they agree.
export function differ(mine: Facts, theirs: Facts): string | null {
  for (let i = 0; i < mine.length; i++) {
    const x = JSON.stringify(mine[i]![1])
    const y = JSON.stringify(theirs[i]![1])
    if (x !== y) return mine[i]![0] + (x.length + y.length < 200 ? ' (' + x + ' against ' + y + ')' : '')
  }
  return null
}

export interface PieceFile { stop?: string; commit?: string; engineHash?: string | null; stopHash?: string | null; machine?: string; rate?: number; kinds?: string[]; only?: string[]; limits?: unknown; piece?: { name: string; seconds: number }; parts?: Record<string, { measured?: boolean } | undefined> }

// Why a file is not the part file its name says; '' when it is.
export function pieceFault(stop: string, name: PieceName, j: PieceFile): string {
  const kinds = name.kind ? [name.kind] : MOVES
  if (j.stop !== stop || !j.piece || j.piece.name !== name.piece || (j.only ?? []).join() !== name.piece || (j.kinds ?? []).join() !== kinds.join() || !j.parts || !j.parts[name.piece]) return name.file + ' is not the part file of the ' + name.piece + (name.kind ? ' of the ' + name.kind : '') + ' of ' + stop + ' (--part ' + name.piece + (name.kind ? ' --kind ' + name.kind : '') + ')'
  return ''
}

export function runFacts(j: { commit?: string; engineHash?: string | null; stopHash?: string | null; rate?: number; limits?: unknown }): Facts {
  return [['commit', j.commit ?? null], ['engine hash', j.engineHash ?? null], ['stop hash', j.stopHash ?? null], ['capture rate', j.rate ?? null], ['limits', j.limits ?? null]]
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
