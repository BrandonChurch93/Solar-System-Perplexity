import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
const o = d.sunSwapOf()
const s = o.span
const seg = plans[0]!.seg.travel!
const f = (u: number): number => Math.round((seg.start + u * (seg.end - seg.start)) * 30)
console.log('sun.travel swap u ' + s[0].toFixed(3) + ' to ' + s[1].toFixed(3) + ', frames ' + f(s[0]) + ' to ' + f(s[1]) + ', bow ' + o.bowDeg)
