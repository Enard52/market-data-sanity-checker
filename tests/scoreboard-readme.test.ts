import { describe, expect, it } from 'vitest'
import { renderScoreboardReadme, type ScoreboardProviderResult } from '../src/scoreboard/readme'

const provider = (overrides: Partial<ScoreboardProviderResult> = {}): ScoreboardProviderResult => ({
  provider: 'yahoo',
  symbols_ok: 30,
  symbols_failed: 0,
  symbols_skipped: 0,
  mean_score: 91.2,
  min_score: 45,
  worst_symbols: [],
  total_findings: { critical: 1, warning: 11, info: 12 },
  ...overrides,
})

describe('renderScoreboardReadme', () => {
  it('lists skipped symbols in provider basket order without adding a line for other providers', () => {
    const readme = renderScoreboardReadme({
      generatedAt: '2026-10-13T00:00:00.000Z',
      basketSize: 4,
      providers: [
        provider(),
        provider({ provider: 'alpha-vantage', symbols_ok: 2, symbols_skipped: 2 }),
      ],
      excluded: [],
      skipped: [{ provider: 'alpha-vantage', symbols: ['GLD', 'TLT'] }],
      comparisons: [],
    })

    expect(readme).toContain('- alpha-vantage skipped (daily request cap): GLD, TLT')
    expect(readme).not.toContain('- yahoo skipped (daily request cap)')
    expect(readme.indexOf('GLD')).toBeLessThan(readme.indexOf('TLT'))
  })

  it('does not add skipped-symbol lines when no provider skipped symbols', () => {
    const readme = renderScoreboardReadme({
      generatedAt: '2026-10-13T00:00:00.000Z',
      basketSize: 1,
      providers: [provider()],
      excluded: [],
      skipped: [],
      comparisons: [],
    })

    expect(readme).not.toContain('daily request cap')
  })
})
