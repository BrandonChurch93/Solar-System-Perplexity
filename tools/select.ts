export interface StopChoice { frames?: number[]; sheets?: string[]; R1?: boolean; R8?: boolean; R2?: boolean }
export interface FilmChoice { frames?: number[]; sheets?: string[]; R5?: boolean; R6?: boolean; R7?: string[]; R2?: boolean }
export interface Selection { base?: string; stops?: Record<string, StopChoice>; film?: FilmChoice; unknown?: string[] }
export interface Build { critic: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8'; scope: string; stops: string[]; frames: number[]; sheets: string[]; segments: string[]; jury: 'stops' | 'film' | '' }

const build = (critic: Build['critic'], scope: string, more: Partial<Build> = {}): Build => ({ critic, scope, stops: [], frames: [], sheets: [], segments: [], jury: '', ...more })

export function polishBuilds(selection: Selection, stopOrder: string[]): Build[] {
  const chosen = selection.stops ?? {}
  const strangers = Object.keys(chosen).filter((id) => stopOrder.includes(id) === false)
  if (strangers.length > 0) throw new Error('select: unknown stop ' + strangers.join(', '))
  const film = selection.film ?? {}
  const out: Build[] = []
  const named = stopOrder.filter((id) => chosen[id])
  for (const id of named) {
    const c = chosen[id]
    if (c.R1) out.push(build('R1', id, { stops: [id] }))
    if (c.frames?.length) out.push(build('R3', id, { stops: [id], frames: [...c.frames].sort((x, y) => x - y) }))
    if (c.sheets?.length) out.push(build('R4', id, { stops: [id], sheets: [...c.sheets] }))
  }
  const recognition = named.filter((id) => chosen[id].R8)
  if (recognition.length > 0) out.push(build('R8', '', { stops: recognition }))
  const juries = named.filter((id) => chosen[id].R2)
  if (film.R2) out.push(build('R2', '', { jury: 'film' }))
  else if (juries.length > 0) out.push(build('R2', '', { stops: juries, jury: 'stops' }))
  if (film.R7?.length) out.push(build('R7', '', { segments: [...film.R7] }))
  if (film.R6) out.push(build('R6', ''))
  if (film.R5) out.push(build('R5', ''))
  if (film.frames?.length) out.push(build('R3', '', { frames: [...film.frames].sort((x, y) => x - y) }))
  if (film.sheets?.length) out.push(build('R4', '', { sheets: [...film.sheets] }))
  return out
}

export const folderOf = (b: Build): string => (b.scope ? b.critic + '-' + b.scope : b.critic)

export function belongs(folder: string, builds: Build[]): boolean {
  const m = /^(R[1-8](?:-(?!part\d)[a-z]+)?)(?:-part\d+)?$/.exec(folder)
  return m !== null && builds.some((b) => folderOf(b) === m[1])
}
