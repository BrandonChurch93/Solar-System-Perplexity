import { describe, expect, it } from 'vitest'
import { belongs, folderOf, polishBuilds } from '../tools/select'

const order = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']

describe('polish selection', () => {
  it('one stop and two film frames give exactly those folders', () => {
    const selection = {
      base: 'base.json',
      stops: { venus: { frames: [1072], sheets: ['venus.dive', 'venus.dive-cover'], R1: true, R8: true, R2: false } },
      film: { frames: [840, 5100], sheets: [], R5: false, R6: false, R7: [], R2: false },
      unknown: [],
    }
    const builds = polishBuilds(selection, order)
    expect(builds.map(folderOf)).toEqual(['R1-venus', 'R3-venus', 'R4-venus', 'R8', 'R3'])
    expect(builds[1].frames).toEqual([1072])
    expect(builds[2].sheets).toEqual(['venus.dive', 'venus.dive-cover'])
    expect(builds[3].stops).toEqual(['venus'])
    expect(builds[4].frames).toEqual([840, 5100])
    expect(builds[4].scope).toBe('')
  })

  it('nothing selected gives no folder', () => {
    const empty = { stops: { mars: { frames: [], sheets: [], R1: false, R8: false, R2: false } }, film: { frames: [], sheets: [], R5: false, R6: false, R7: [], R2: false } }
    expect(polishBuilds(empty, order)).toEqual([])
    expect(polishBuilds({}, order)).toEqual([])
  })

  it('the film parts and the juries follow their switches', () => {
    const film = { frames: [], sheets: ['sun.travel'], R5: true, R6: true, R7: ['mars.dive'], R2: false }
    const stops = { mars: { R2: true, R8: true }, earth: { R1: true, R2: true } }
    const builds = polishBuilds({ stops, film }, order)
    expect(builds.map(folderOf)).toEqual(['R1-earth', 'R8', 'R2', 'R7', 'R6', 'R5', 'R4'])
    expect(builds[2]).toMatchObject({ jury: 'stops', stops: ['earth', 'mars'] })
    expect(polishBuilds({ stops, film: { ...film, R2: true } }, order)[2]).toMatchObject({ jury: 'film', stops: [] })
  })

  it('an unknown stop is refused and old folders are told apart', () => {
    expect(() => polishBuilds({ stops: { pluto: { R1: true } } }, order)).toThrow(/pluto/)
    const builds = polishBuilds({ stops: { venus: { frames: [1072] } }, film: { frames: [840] } }, order)
    expect(['R3-venus', 'R3-venus-part2', 'R3', 'R3-part1'].every((f) => belongs(f, builds))).toBe(true)
    expect(['R1-venus', 'R3-mars-part1', 'R4', 'R5', 'R8-part1'].some((f) => belongs(f, builds))).toBe(false)
  })
})
