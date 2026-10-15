import { describe, expect, it } from 'vitest'
import { escapeCell, renderCompareMarkdown, renderReportMarkdown } from '../src/report/markdown'
import type { Finding, SanityReport } from '../src/report/types'
import type { ComparisonReport } from '../src/compare/comparator'

describe('renderReportMarkdown', () => {
  it('renders report with findings as a markdown table with heading and escaped pipe cells', () => {
    const findings: Finding[] = [
      {
        rule: 'SPLIT_NOT_ADJUSTED',
        severity: 'critical',
        action: 'block',
        dimension: 'validity',
        where: { date: '2024-06-03' },
        explanation: 'Price dropped 50% | ratio 2:1 missing corporate action',
      },
      {
        rule: 'BAR_MISSING',
        severity: 'warning',
        action: 'flag',
        dimension: 'completeness',
        explanation: 'Missing trading week\nmulti-line explanation',
      },
    ]

    const report: SanityReport = {
      symbol: 'AAPL',
      source: 'yahoo',
      sanity_score: 55,
      findings,
      summary: { critical: 1, warning: 1, info: 0 },
      generated_at: '2026-10-15T00:00:00.000Z',
    }

    const md = renderReportMarkdown(report)

    expect(md).toContain('## AAPL (yahoo) — sanity_score: 55/100')
    expect(md).toContain('| Rule | Severity | Date | Explanation |')
    expect(md).toContain('|---|---|---|---|')
    expect(md).toContain('| SPLIT_NOT_ADJUSTED | critical | 2024-06-03 | Price dropped 50% \\| ratio 2:1 missing corporate action |')
    expect(md).toContain('| BAR_MISSING | warning | - | Missing trading week multi-line explanation |')
  })

  it('renders "No findings." when the findings list is empty', () => {
    const report: SanityReport = {
      symbol: 'MSFT',
      source: 'alpha-vantage',
      sanity_score: 100,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0 },
      generated_at: '2026-10-15T00:00:00.000Z',
    }

    const md = renderReportMarkdown(report)

    expect(md).toContain('## MSFT (alpha-vantage) — sanity_score: 100/100')
    expect(md).toContain('No findings.')
    expect(md).not.toContain('| Rule | Severity | Date | Explanation |')
  })
})

describe('renderCompareMarkdown', () => {
  it('renders comparison report with findings as a markdown table with heading', () => {
    const findings: Finding[] = [
      {
        rule: 'CLOSE_DIVERGENCE',
        severity: 'warning',
        action: 'flag',
        dimension: 'consistency',
        where: { date: '2024-06-03' },
        explanation: 'Close diverges by 4.5% (yahoo: 100 | alphavantage: 104.5)',
      },
    ]

    const report: ComparisonReport = {
      symbol: 'AAPL',
      sources: ['yahoo', 'alphavantage'],
      consistency_score: 85,
      compared_dates: 248,
      only_in: { yahoo: 2, alphavantage: 0 },
      findings,
      summary: { critical: 0, warning: 1, info: 0 },
      generated_at: '2026-10-15T00:00:00.000Z',
    }

    const md = renderCompareMarkdown(report)

    expect(md).toContain('## AAPL — yahoo vs alphavantage — consistency_score: 85/100')
    expect(md).toContain('| Rule | Severity | Date | Explanation |')
    expect(md).toContain('|---|---|---|---|')
    expect(md).toContain('| CLOSE_DIVERGENCE | warning | 2024-06-03 | Close diverges by 4.5% (yahoo: 100 \\| alphavantage: 104.5) |')
  })

  it('renders "No findings." when comparison findings list is empty', () => {
    const report: ComparisonReport = {
      symbol: 'GOOGL',
      sources: ['yahoo', 'polygon'],
      consistency_score: 100,
      compared_dates: 100,
      only_in: { yahoo: 0, polygon: 0 },
      findings: [],
      summary: { critical: 0, warning: 0, info: 0 },
      generated_at: '2026-10-15T00:00:00.000Z',
    }

    const md = renderCompareMarkdown(report)

    expect(md).toContain('## GOOGL — yahoo vs polygon — consistency_score: 100/100')
    expect(md).toContain('No findings.')
    expect(md).not.toContain('| Rule | Severity | Date | Explanation |')
  })
})

describe('escapeCell', () => {
  it('escapes pipes and replaces newlines with spaces', () => {
    expect(escapeCell('hello|world')).toBe('hello\\|world')
    expect(escapeCell('line 1\nline 2\r\nline 3')).toBe('line 1 line 2 line 3')
  })
})
