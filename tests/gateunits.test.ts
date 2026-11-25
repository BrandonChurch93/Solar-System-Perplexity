import { describe, expect, it } from 'vitest'
import { unitNote } from '../tools/gate/units'

const ROOT = '/film'

describe('the gate line of the unit tests, printed from the runner\'s own report', () => {
  it('keeps the form of the green line: the count that passed and the count in all', () => {
    const r = unitNote({ numTotalTests: 796, numPassedTests: 796, numFailedTests: 0, success: true, testResults: [] }, true, '', ROOT)
    expect(r).toEqual({ pass: true, note: '796 passed (796)' })
    expect(unitNote({ numTotalTests: 10, numPassedTests: 8, numFailedTests: 0, numPendingTests: 2, success: true }, true, '', ROOT).note).toBe('8 passed | 2 skipped (10)')
  })

  it('names the counts and for each failed test its file, its full name and the first 300 characters of its message', () => {
    const long = 'AssertionError: expected 1 to be 2\n    at ' + 'x'.repeat(400)
    const r = unitNote({
      numTotalTests: 3, numPassedTests: 2, numFailedTests: 1, success: false,
      testResults: [
        { name: ROOT + '/tests/a.test.ts', status: 'passed', assertionResults: [{ fullName: 'a works', status: 'passed', failureMessages: [] }] },
        { name: ROOT + '/tests/b.test.ts', status: 'failed', assertionResults: [{ fullName: 'b holds its number', status: 'failed', failureMessages: [long] }, { fullName: 'b other', status: 'passed' }] },
      ],
    }, false, 'TypeError: Map.groupBy is not a function', ROOT)
    expect(r.pass).toBe(false)
    const lines = r.note.split('\n')
    expect(lines[0]).toBe('1 failed, 2 passed, 3 in all')
    expect(lines).toHaveLength(2)
    expect(lines[1]!.startsWith('  tests/b.test.ts: b holds its number: AssertionError: expected 1 to be 2 at xxx')).toBe(true)
    expect(lines[1]!.length).toBe('  tests/b.test.ts: b holds its number: '.length + 300)
    expect(r.note).not.toContain('groupBy')
  })

  it('names a file that did not run, and is red where the runner wrote no report or ended red without a failed test', () => {
    const broken = unitNote({ numTotalTests: 2, numPassedTests: 2, numFailedTests: 0, success: false, testResults: [{ name: ROOT + '/tests/c.test.ts', status: 'failed', message: 'Error: Cannot find module ./gone', assertionResults: [] }] }, false, '', ROOT)
    expect(broken.pass).toBe(false)
    expect(broken.note).toBe('0 failed, 2 passed, 2 in all\n  tests/c.test.ts: the file did not run: Error: Cannot find module ./gone')
    const none = unitNote(null, false, 'the runner fell over', ROOT)
    expect(none).toEqual({ pass: false, note: 'the runner wrote no report; the runner fell over' })
    const red = unitNote({ numTotalTests: 2, numPassedTests: 2, numFailedTests: 0, success: true, testResults: [] }, false, 'Unhandled error', ROOT)
    expect(red.pass).toBe(false)
    expect(red.note).toBe('0 failed, 2 passed, 2 in all; the runner ended red and names no failed test; Unhandled error')
    expect(unitNote({ numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, success: true, testResults: [] }, true, '', ROOT).pass).toBe(false)
  })
})
