import { describe, expect, it } from 'vitest'
import type { Bar, MarketDataSet } from '../../src/schema/market-data'
import type { CompareContext } from '../../src/compare/types'
import { seriesTailTruncated } from '../../src/compare/rules/series-tail-truncated'
import { buildCompareContext, runCompareRules } from '../../src/compare/engine'

function bar(date: string, close = 100): Bar {
  return { timestamp: date, open: close, high: close * 1.01, low: close * 0.99, close, volume: 1_000_000 }
}

/** Consecutive daily dates from 2024-01-01; the rule does not read calendars. */
function dates(count: number, start = '2024-01-01'): string[] {
  const out: string[] = []
  let cursor = Date.parse(start)
  for (let i = 0; i < count; i++) {
    out.push(new Date(cursor).toISOString().slice(0, 10))
    cursor += 24 * 60 * 60 * 1000
  }
  return out
}

function dataset(source: string, ds: string[]): MarketDataSet {
  return { symbol: 'TEST', source, bars: ds.map((d) => bar(d)) }
}

function ctxFor(a: MarketDataSet, b: MarketDataSet, params = {}): CompareContext {
  return {
    config: {
      severity: seriesTailTruncated.meta.severity,
      params: { ...seriesTailTruncated.meta.defaultParams, ...params },
    },
    ...buildCompareContext(a, b),
  }
}

const FULL = dates(30)

describe('SERIES_TAIL_TRUNCATED', () => {
  it('reports a subject that stops two sessions before the authority and names the missing dates', () => {
    const authority = dataset('authority', FULL)
    const subject = dataset('subject', FULL.slice(0, -2))
    const findings = seriesTailTruncated.check(authority, subject, ctxFor(authority, subject))
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      rule: 'SERIES_TAIL_TRUNCATED',
      severity: 'warning',
      dimension: 'completeness',
      where: { date: FULL[28] },
    })
    expect(findings[0]!.evidence).toMatchObject({
      truncated_source: 'subject',
      last_date: FULL[27],
      other_source: 'authority',
      missing_sessions: 2,
      missing_dates: [FULL[28], FULL[29]],
    })
  })

  it('is symmetric: the truncated side can be either source', () => {
    const a = dataset('a', FULL.slice(0, -3))
    const b = dataset('b', FULL)
    const findings = seriesTailTruncated.check(a, b, ctxFor(a, b))
    expect(findings).toHaveLength(1)
    expect(findings[0]!.evidence).toMatchObject({ truncated_source: 'a', missing_sessions: 3 })
  })

  it('fires even when the overlap is long enough for every other compare rule to stay quiet', () => {
    // The issue #35 case: 28 shared sessions agree, so the comparison alone reads as a pass.
    const authority = dataset('authority', FULL)
    const subject = dataset('subject', FULL.slice(0, -2))
    const rules = runCompareRules(authority, subject).map((f) => f.rule)
    expect(rules).toContain('SERIES_TAIL_TRUNCATED')
    expect(rules).not.toContain('INSUFFICIENT_OVERLAP')
  })

  it('stays silent for a single missing latest session (a feed that has not published today yet)', () => {
    const a = dataset('a', FULL)
    const b = dataset('b', FULL.slice(0, -1))
    expect(seriesTailTruncated.check(a, b, ctxFor(a, b))).toEqual([])
  })

  it('ignores a different start date: shorter history is not truncation', () => {
    const a = dataset('a', FULL)
    const b = dataset('b', FULL.slice(10))
    expect(seriesTailTruncated.check(a, b, ctxFor(a, b))).toEqual([])
  })

  it('ignores interior gaps; it only judges the end of the series', () => {
    const a = dataset('a', FULL)
    const b = dataset('b', FULL.filter((_, i) => i !== 10 && i !== 11))
    expect(seriesTailTruncated.check(a, b, ctxFor(a, b))).toEqual([])
  })

  it('stays silent without any shared session (INSUFFICIENT_OVERLAP owns that case)', () => {
    const a = dataset('a', FULL.slice(0, 10))
    const b = dataset('b', FULL.slice(20))
    expect(seriesTailTruncated.check(a, b, ctxFor(a, b))).toEqual([])
  })

  it('honours minMissingSessions and caps the listed dates without capping the count', () => {
    const a = dataset('a', FULL)
    const b = dataset('b', FULL.slice(0, 5))
    const findings = seriesTailTruncated.check(a, b, ctxFor(a, b, { maxListedDates: 3 }))
    expect(findings[0]!.evidence).toMatchObject({ missing_sessions: 25 })
    expect((findings[0]!.evidence!.missing_dates as string[]).length).toBe(3)
    expect(seriesTailTruncated.check(a, b, ctxFor(a, b, { minMissingSessions: 26 }))).toEqual([])
  })
})

/**
 * The three cases of examples/wrong_window.py in arian-gogani/nobulex-registry (MIT),
 * shared in issue #35: five daily sessions from 2020-01-06 as the authority, and a
 * subject that matches, stops two sessions early, or covers an entirely different window.
 */
describe('issue #35 wrong-window cases (nobulex-registry examples/wrong_window.py)', () => {
  const AUTHORITY = ['2020-01-06', '2020-01-07', '2020-01-08', '2020-01-09', '2020-01-10']
  const authority = dataset('authority', AUTHORITY)

  it('matching window: the negative control, no truncation finding', () => {
    const subject = dataset('subject', AUTHORITY)
    const rules = runCompareRules(authority, subject).map((f) => f.rule)
    expect(rules).not.toContain('SERIES_TAIL_TRUNCATED')
  })

  it('two sessions silently missing: names the two authority dates absent from the subject', () => {
    const subject = dataset('subject', AUTHORITY.slice(0, 3))
    const findings = runCompareRules(authority, subject).filter((f) => f.rule === 'SERIES_TAIL_TRUNCATED')
    expect(findings).toHaveLength(1)
    expect(findings[0]!.evidence).toMatchObject({
      truncated_source: 'subject',
      missing_sessions: 2,
      missing_dates: ['2020-01-09', '2020-01-10'],
    })
  })

  it('same count, entirely different dates: nothing to compare, never reported as truncation', () => {
    const subject = dataset('subject', ['1999-01-04', '1999-01-05', '1999-01-06', '1999-01-07', '1999-01-08'])
    const findings = runCompareRules(authority, subject)
    expect(findings.map((f) => f.rule)).not.toContain('SERIES_TAIL_TRUNCATED')
    expect(findings.find((f) => f.rule === 'INSUFFICIENT_OVERLAP')).toMatchObject({ severity: 'critical' })
  })
})
