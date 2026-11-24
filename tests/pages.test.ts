import { describe, expect, it } from 'vitest'
import { freshPage } from '../tools/measure/pages'

describe('the page the judged finals of a measure are drawn on', () => {
  const page = (name: string, log: string[]): { name: string; close(): Promise<void> } => ({
    name,
    close: async () => {
      await Promise.resolve()
      log.push('closed ' + name)
    },
  })

  it('is a new page when the first has drawn frames, opened only after the first is closed', async () => {
    const log: string[] = []
    const first = page('first', log)
    const got = await freshPage(first, 495, async () => {
      log.push('opened second')
      return page('second', log)
    })
    expect(got.name).toBe('second')
    expect(log).toEqual(['closed first', 'opened second'])
  })

  it('is the first page when nothing was drawn on it', async () => {
    const log: string[] = []
    const first = page('first', log)
    const got = await freshPage(first, 0, async () => {
      log.push('opened second')
      return page('second', log)
    })
    expect(got).toBe(first)
    expect(log).toEqual([])
  })

  it('leaves no page open when the second cannot be opened', async () => {
    const log: string[] = []
    await expect(freshPage(page('first', log), 3, async () => Promise.reject(new Error('no page')))).rejects.toThrow('no page')
    expect(log).toEqual(['closed first'])
  })
})
