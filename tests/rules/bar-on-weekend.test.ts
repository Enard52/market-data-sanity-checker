import { describe, expect, it } from 'vitest'
import { barOnWeekend } from '../../src/rules/price/bar-on-weekend'
import type { RuleContext } from '../../src/rules/types'
import type { MarketDataSet } from '../../src/schema/market-data'

const ctx: RuleContext = {
  config: {
    severity: barOnWeekend.meta.severity,
    params: { ...barOnWeekend.meta.defaultParams },
  },
  profile: { returns: [], medianReturn: 0, madReturn: 0 },
}

function makeDataset(bars: Array<{ timestamp: string; close?: number }>): MarketDataSet {
  return {
    symbol: 'TEST',
    source: 'synthetic',
    bars: bars.map((b) => ({
      timestamp: b.timestamp,
      open: b.close ?? 100,
      high: b.close ?? 100,
      low: b.close ?? 100,
      close: b.close ?? 100,
    })),
  }
}

describe('BAR_ON_WEEKEND', () => {
  it('flags Saturday and Sunday daily bars by default with severity info and action review', () => {
    // 2024-01-05 is Friday, 2024-01-06 is Saturday, 2024-01-07 is Sunday, 2024-01-08 is Monday
    const data = makeDataset([
      { timestamp: '2024-01-05' },
      { timestamp: '2024-01-06' },
      { timestamp: '2024-01-07' },
      { timestamp: '2024-01-08' },
    ])

    const findings = barOnWeekend.check(data, ctx)

    expect(findings).toHaveLength(2)
    expect(findings[0]).toMatchObject({
      rule: 'BAR_ON_WEEKEND',
      severity: 'info',
      action: 'review',
      where: { date: '2024-01-06' },
      evidence: { weekday: 'Saturday', day_of_week: 6 },
    })
    expect(findings[1]).toMatchObject({
      rule: 'BAR_ON_WEEKEND',
      severity: 'info',
      action: 'review',
      where: { date: '2024-01-07' },
      evidence: { weekday: 'Sunday', day_of_week: 0 },
    })
  })

  it('does NOT flag regular Monday through Friday trading days', () => {
    // 2024-01-01 (Mon) through 2024-01-05 (Fri)
    const data = makeDataset([
      { timestamp: '2024-01-01' },
      { timestamp: '2024-01-02' },
      { timestamp: '2024-01-03' },
      { timestamp: '2024-01-04' },
      { timestamp: '2024-01-05' },
    ])

    const findings = barOnWeekend.check(data, ctx)
    expect(findings).toHaveLength(0)
  })

  it('negative control 1: Gulf markets (Sunday–Thursday) do NOT flag Sunday when configured', () => {
    const gulfCtx: RuleContext = {
      config: {
        severity: 'info',
        params: {
          sunday: 0,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 1,
          saturday: 1,
        },
      },
      profile: { returns: [], medianReturn: 0, madReturn: 0 },
    }

    // 2024-01-07 is Sunday (trading in Saudi/Gulf), 2024-01-12 is Friday (non-trading)
    const data = makeDataset([
      { timestamp: '2024-01-07' }, // Sunday
      { timestamp: '2024-01-08' }, // Monday
      { timestamp: '2024-01-12' }, // Friday
    ])

    const findings = barOnWeekend.check(data, gulfCtx)

    expect(findings).toHaveLength(1)
    expect(findings[0]!.where).toEqual({ date: '2024-01-12' })
    expect(findings[0]!.evidence).toEqual({ date: '2024-01-12', weekday: 'Friday', day_of_week: 5 })
  })

  it('negative control 2: special weekend exchange sessions (NSE India Saturday 2025-02-01) are NOT flagged', () => {
    // 2025-02-01 is a Saturday, but NSE India held an official Union Budget session
    const data: MarketDataSet = {
      symbol: 'RELIANCE.NS',
      exchange: 'NSE',
      source: 'yahoo',
      bars: [
        { timestamp: '2025-01-31', open: 1200, high: 1210, low: 1195, close: 1205 },
        { timestamp: '2025-02-01', open: 1205, high: 1220, low: 1200, close: 1215 },
        { timestamp: '2025-02-03', open: 1215, high: 1225, low: 1210, close: 1220 },
      ],
    }

    const findings = barOnWeekend.check(data, ctx)
    expect(findings).toHaveLength(0)
  })

  it('flags a 2025-02-01 Saturday bar on non-NSE exchanges', () => {
    const data: MarketDataSet = {
      symbol: 'AAPL',
      source: 'yahoo',
      bars: [{ timestamp: '2025-02-01', open: 150, high: 155, low: 149, close: 152 }],
    }
    const findings = barOnWeekend.check(data, ctx)
    expect(findings).toHaveLength(1)
    expect(findings[0]!.rule).toBe('BAR_ON_WEEKEND')
  })

  it('flags NSE on 2025-02-01 when specialSessions is configured to 0', () => {
    const customCtx: RuleContext = {
      config: {
        severity: 'info',
        params: { ...barOnWeekend.meta.defaultParams, specialSessions: 0 },
      },
      profile: { returns: [], medianReturn: 0, madReturn: 0 },
    }
    const data: MarketDataSet = {
      symbol: 'RELIANCE.NS',
      exchange: 'NSE',
      source: 'yahoo',
      bars: [{ timestamp: '2025-02-01', open: 1205, high: 1220, low: 1200, close: 1215 }],
    }
    const findings = barOnWeekend.check(data, customCtx)
    expect(findings).toHaveLength(1)
    expect(findings[0]!.rule).toBe('BAR_ON_WEEKEND')
  })

  it('skips intraday bars and series (daily data only)', () => {
    // Intraday series with hours/minutes timestamps
    const intradayData = makeDataset([
      { timestamp: '2024-01-06T14:30:00Z' },
      { timestamp: '2024-01-06T15:30:00Z' },
      { timestamp: '2024-01-07T14:30:00Z' },
    ])

    const findings = barOnWeekend.check(intradayData, ctx)
    expect(findings).toHaveLength(0)
  })

  it('safely handles empty datasets and unparseable timestamps without throwing', () => {
    expect(barOnWeekend.check(makeDataset([]), ctx)).toEqual([])
    expect(barOnWeekend.check(makeDataset([{ timestamp: 'not-a-date' }]), ctx)).toEqual([])
  })
})
