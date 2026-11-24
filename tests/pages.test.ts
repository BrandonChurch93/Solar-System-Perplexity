import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Keeper, note, takeUp, type KeeperOptions } from '../tools/measure/pages'

class Lost extends Error {}

interface Page { name: string; dead: boolean; view: string; close(): Promise<void> }

function bench(over: Partial<KeeperOptions<Page>> = {}): { log: string[]; keeper: Keeper<Page>; draw: (frame: number, failOn?: (p: Page) => boolean) => Promise<string> } {
  const log: string[] = []
  let made = 0
  const page = (): Page => {
    const p: Page = {
      name: 'page ' + ++made,
      dead: false,
      view: '',
      close: async () => {
        await Promise.resolve()
        log.push('closed ' + p.name)
      },
    }
    return p
  }
  const keeper = new Keeper<Page>(page(), {
    open: async () => {
      const p = page()
      log.push('opened ' + p.name)
      return Promise.resolve(p)
    },
    maxRestarts: 3,
    pageFrames: 0,
    lost: (e) => (e instanceof Lost ? e.message : null),
    say: (line) => log.push('said: ' + line),
    kill: async (p) => {
      p.dead = true
      return Promise.resolve()
    },
    closeWaitMs: 50,
    ...over,
  })
  const draw = (frame: number, failOn?: (p: Page) => boolean): Promise<string> =>
    keeper.draw(frame, async (p) => {
      await Promise.resolve()
      if (p.dead || failOn?.(p)) throw new Lost('the page closed at frame ' + frame)
      log.push('drew ' + frame + ' on ' + p.name + ' in ' + p.view)
      return frame + ' by ' + p.name
    })
  return { log, keeper, draw }
}

const view = (v: string) => async (p: Page): Promise<void> => {
  p.view = v
  return Promise.resolve()
}

describe('the page a measure draws on', () => {
  it('draws a frame whose page is lost again on a new page, in the same view, and says so', async () => {
    const b = bench({ closeAt: [12] })
    await b.keeper.setView(view('texels'))
    expect(await b.draw(11)).toBe('11 by page 1')
    expect(await b.draw(12)).toBe('12 by page 2')
    expect(await b.draw(13)).toBe('13 by page 2')
    expect(b.log).toEqual([
      'drew 11 on page 1 in texels',
      'said: restart 1 of 3 at frame 12 on a new page: the page closed at frame 12',
      'closed page 1',
      'opened page 2',
      'drew 12 on page 2 in texels',
      'drew 13 on page 2 in texels',
    ])
    expect(b.keeper.restarts).toEqual([{ frame: 12, reason: 'the page closed at frame 12' }])
    expect(b.keeper.pages).toBe(2)
    expect(b.keeper.drawn).toBe(3)
  })

  it('stops with the frame and the reason when the restarts of the run are used up', async () => {
    const b = bench({ maxRestarts: 2, closeAt: [5, 6] })
    await b.draw(5)
    await b.draw(6)
    await expect(b.draw(7, () => true)).rejects.toThrow('the page was lost at frame 7 and 2 restart(s) are used up (--restarts 2): the page closed at frame 7')
    expect(b.keeper.restarts.map((r) => r.frame)).toEqual([5, 6])
    expect(b.log.filter((l) => l.startsWith('opened'))).toEqual(['opened page 2', 'opened page 3'])
    expect(b.log.at(-1)).toBe('closed page 3')
  })

  it('counts the restarts over the whole run, not by frame', async () => {
    const b = bench({ maxRestarts: 1 })
    let fails = 2
    await expect(b.draw(9, () => fails-- > 0)).rejects.toThrow('1 restart(s) are used up')
    expect(b.log.filter((l) => l.startsWith('drew'))).toEqual([])
  })

  it('does not restart with no restarts allowed, and not on a failure that is not a lost page', async () => {
    const none = bench({ maxRestarts: 0, closeAt: [3] })
    await expect(none.draw(3)).rejects.toThrow('0 restart(s) are used up')
    expect(none.log.filter((l) => l.startsWith('opened'))).toEqual([])
    const b = bench()
    await expect(b.keeper.draw(4, async () => Promise.reject(new Error('disk full')))).rejects.toThrow('disk full')
    expect(b.keeper.restarts).toEqual([])
    expect(b.log).toEqual([])
  })

  it('leaves a page for a fresh one after the given count of frames, the old one closed first', async () => {
    const b = bench({ pageFrames: 2 })
    await b.keeper.setView(view('texels'))
    for (const f of [1, 2, 3, 4, 5]) await b.draw(f)
    expect(b.log).toEqual([
      'drew 1 on page 1 in texels',
      'drew 2 on page 1 in texels',
      'said: a fresh page before frame 3, after 2 frames on the last',
      'closed page 1',
      'opened page 2',
      'drew 3 on page 2 in texels',
      'drew 4 on page 2 in texels',
      'said: a fresh page before frame 5, after 2 frames on the last',
      'closed page 2',
      'opened page 3',
      'drew 5 on page 3 in texels',
    ])
    expect(b.keeper.restarts).toEqual([])
    expect(b.keeper.planned).toBe(2)
  })

  it('gives the finals a page that has drawn nothing: a new one after frames, the same one after none', async () => {
    const b = bench()
    await b.keeper.fresh()
    expect(b.log).toEqual([])
    await b.keeper.setView(view('texels'))
    await b.draw(1)
    await b.keeper.fresh()
    await b.keeper.fresh()
    await b.keeper.setView(view('nograin'))
    await b.draw(2)
    expect(b.log).toEqual(['drew 1 on page 1 in texels', 'closed page 1', 'opened page 2', 'drew 2 on page 2 in nograin'])
    expect(b.keeper.page.name).toBe('page 2')
    expect([b.keeper.pages, b.keeper.planned, b.keeper.restarts.length]).toEqual([2, 1, 0])
  })

  it('counts a new page that does not open as a restart and tries again, with no page left open', async () => {
    let fails = 2
    const b = bench({ closeAt: [1] })
    const open = b.keeper['o'].open
    b.keeper['o'].open = async () => (fails-- > 0 ? Promise.reject(new Error('no browser\nmore')) : open())
    expect(await b.draw(1)).toBe('1 by page 2')
    expect(b.log).toEqual([
      'said: restart 1 of 3 at frame 1 on a new page: the page closed at frame 1',
      'closed page 1',
      'said: restart 2 of 3 at frame 1 on a new page: the new page did not open: Error: no browser',
      'said: restart 3 of 3 at frame 1 on a new page: the new page did not open: Error: no browser',
      'opened page 2',
      'drew 1 on page 2 in ',
    ])
  })

  it('stops when the new page does not open and the restarts are used up, the old page closed once', async () => {
    const b = bench({ maxRestarts: 1, closeAt: [1], open: async () => Promise.reject(new Error('no browser')) })
    await expect(b.draw(1)).rejects.toThrow('the page was lost at frame 1 and 1 restart(s) are used up (--restarts 1): the new page did not open: Error: no browser')
    await b.keeper.close()
    expect(b.log.filter((l) => l.startsWith('closed'))).toEqual(['closed page 1'])
  })

  it('closes a new page that does not take the view', async () => {
    const b = bench({ maxRestarts: 1, closeAt: [1] })
    let n = 0
    await b.keeper.setView(async (p) => {
      if (n++ > 0) throw new Error('no view')
      p.view = 'texels'
      return Promise.resolve()
    })
    await expect(b.draw(1)).rejects.toThrow('the new page did not open: Error: no view')
    expect(b.log.filter((l) => l.startsWith('closed'))).toEqual(['closed page 1', 'closed page 2'])
  })

  it('does not wait for ever on a lost page that will not close', async () => {
    const b = bench({ closeAt: [2], closeWaitMs: 20 })
    b.keeper.page.close = () => new Promise<void>(() => undefined)
    expect(await b.draw(2)).toBe('2 by page 2')
  })
})

describe('the record a measure takes up', () => {
  const key = { engineHash: 'e1', stopHash: 's1', texelsTier: 'draft', texelsView: 'texels', finalsView: 'nograin', noCover: false }
  const file = (): string => join(mkdtempSync(join(tmpdir(), 'pages-')), 'venus.progress.jsonl')
  const row = (frame: number): { frame: number; fraction: number } => ({ frame, fraction: frame / 7 })

  it('starts a record with what the run is drawn with when there is none', () => {
    const f = file()
    const t = takeUp(f, key)
    expect([t.g13.size, t.finals.size, t.said]).toEqual([0, 0, ''])
    expect(readFileSync(f, 'utf8')).toBe(JSON.stringify({ key }) + '\n')
  })

  it('takes up the finished frames of a record of the same build, to the digit', () => {
    const f = file()
    takeUp(f, key)
    note(f, { g13: row(1260) })
    note(f, { g13: row(1261) })
    note(f, { final: { frame: 1400, tier: 'final', invalid: 0, coverage: 0.1 + 0.2, png: 'abc' } })
    const t = takeUp<{ frame: number; fraction: number }, { frame: number; tier: string; coverage: number }>(f, key)
    expect([...t.g13.keys()]).toEqual([1260, 1261])
    expect(t.g13.get(1261)!.fraction).toBe(1261 / 7)
    expect(t.finals.get('final 1400')!.coverage).toBe(0.1 + 0.2)
    expect(t.finals.get('draft 1400')).toBeUndefined()
    expect(t.said).toBe('took up the record of an earlier run of this build: 2 texel frame(s) and 1 judged final(s) done')
  })

  it.each([
    ['engineHash', 'e2'],
    ['stopHash', 's2'],
    ['texelsTier', 'review'],
    ['texelsView', 'beauty'],
    ['finalsView', 'beauty'],
    ['noCover', true],
  ])('does not take up a record whose %s differs, and starts a new one', (name, value) => {
    const f = file()
    takeUp(f, key)
    note(f, { g13: row(1260) })
    const mine = { ...key, [name]: value }
    const t = takeUp(f, mine)
    expect(t.g13.size).toBe(0)
    expect(t.said).toContain('does not match this build (' + name + ' ')
    expect(t.said).toContain('not taken up')
    expect(readFileSync(f, 'utf8')).toBe(JSON.stringify({ key: mine }) + '\n')
  })

  it('does not take up a record with a name more or less in its first line', () => {
    const f = file()
    takeUp(f, { ...key, assets: 'full' })
    note(f, { g13: row(1260) })
    expect(takeUp(f, key).g13.size).toBe(0)
    note(f, { g13: row(1260) })
    expect(takeUp(f, { ...key, assets: 'full' }).g13.size).toBe(0)
  })

  it('drops a last line torn by the end of the run and writes on after the last whole one', () => {
    const f = file()
    takeUp(f, key)
    note(f, { g13: row(1260) })
    writeFileSync(f, readFileSync(f, 'utf8') + '{"g13":{"frame":1261,"fract')
    const t = takeUp<{ frame: number }, { frame: number; tier: string }>(f, key)
    expect([...t.g13.keys()]).toEqual([1260])
    expect(t.said).toContain('its last line was torn and is dropped')
    note(f, { g13: row(1261) })
    expect([...takeUp<{ frame: number }, { frame: number; tier: string }>(f, key).g13.keys()]).toEqual([1260, 1261])
  })

  it('does not take up a record when told to start fresh, or one with no readable first line', () => {
    const f = file()
    takeUp(f, key)
    note(f, { g13: row(1260) })
    const t = takeUp(f, key, true)
    expect([t.g13.size, t.said]).toEqual([0, 'a record of an earlier run is there and --fresh was given: not taken up'])
    writeFileSync(f, 'not a record\n')
    expect(takeUp(f, key).said).toBe('the record of an earlier run has no readable first line: not taken up')
  })
})
