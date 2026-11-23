import look from './look.json'

const smoothstep = (x: number, a: number, b: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('farsun') : null

export function globeShare(distance: number): number {
  if (forced === 'globe') return 1
  if (forced === 'far') return 0
  return 1 - smoothstep(Math.log(distance), Math.log(look.handover[0]!), Math.log(look.handover[1]!))
}

export function wearShare(distance: number): number {
  return 1 - smoothstep(Math.log(distance), Math.log(look.wear[0]!), Math.log(look.wear[1]!))
}

export function discShare(radiusPx: number): number {
  return smoothstep(radiusPx, look.disc[0]!, look.disc[1]!)
}
