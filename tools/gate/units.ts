import { relative } from 'node:path'

interface Case { fullName?: string; title?: string; status?: string; failureMessages?: string[] }
interface Suite { name?: string; status?: string; message?: string; assertionResults?: Case[] }
export interface Units { numTotalTests?: number; numPassedTests?: number; numFailedTests?: number; numPendingTests?: number; numTodoTests?: number; success?: boolean; testResults?: Suite[] }

const MESSAGE = 300

function flat(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').trim().slice(0, MESSAGE)
}

export function unitNote(report: Units | null, ok: boolean, tail: string, root: string): { pass: boolean; note: string } {
  if (!report) return { pass: false, note: 'the runner wrote no report; ' + tail.slice(-600) }
  const all = report.numTotalTests ?? 0
  const passed = report.numPassedTests ?? 0
  const failed = report.numFailedTests ?? 0
  const left = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0)
  const lines: string[] = []
  for (const suite of report.testResults ?? []) {
    const file = suite.name ? relative(root, suite.name) : 'no file named'
    const bad = (suite.assertionResults ?? []).filter((c) => c.status === 'failed')
    for (const c of bad) lines.push(file + ': ' + (c.fullName ?? c.title ?? 'no name') + ': ' + flat((c.failureMessages ?? []).join(' ')))
    if (suite.status === 'failed' && bad.length === 0) lines.push(file + ': the file did not run: ' + flat(suite.message ?? ''))
  }
  const pass = ok && report.success !== false && failed === 0 && lines.length === 0 && all > 0
  if (pass) return { pass, note: passed + ' passed' + (left ? ' | ' + left + ' skipped' : '') + ' (' + all + ')' }
  const counts = failed + ' failed, ' + passed + ' passed, ' + all + ' in all'
  if (lines.length === 0) return { pass, note: counts + '; the runner ended red and names no failed test; ' + tail.slice(-600) }
  return { pass, note: [counts, ...lines].join('\n  ') }
}
