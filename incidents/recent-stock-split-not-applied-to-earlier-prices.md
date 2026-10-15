---
case: "Recent stock split not applied to earlier historical prices"
source: "Yahoo via yfinance"
reported_by: "@ValueRaider"
---

## What happened

For London symbol CNE.L around May 2023, the reporter noted the company "had a stock split recently" (without citing a specific ratio or date in the issue), but earlier historical prices remained unadjusted on Yahoo (except for May 9), leaving an unadjusted price cliff in the series.

## Evidence

[yfinance#1531](https://github.com/ranaroussi/yfinance/issues/1531)

## A checker should report

`SPLIT_NOT_ADJUSTED` (`src/rules/price/split-not-adjusted.ts:52-94`) fires only if the one-session move matches a common integer split ratio (`matchSplitRatio`, line 58). When it does, if the series carries the split in `data.splits` within `splitWindowDays` (3 days), `explained` evaluates to `true` (lines 62-66) and the rule stays completely silent because it assumes the jump on the ex-date was already accommodated; since the Yahoo connector fills `data.splits` directly from Yahoo chart events (`src/connectors/yahoo.ts:145-165`), on connector data this `explained` branch is the likely one. Crucially, `RETURN_SPIKE` (`src/rules/price/return-spike.ts:87`) explicitly skips returns matching a split ratio, so it also stays silent here. Catching an unadjusted price cliff when split metadata is present can only be done via multi-source cross-checking (`mdsc compare`), and only if most shared dates are scaled.

## The check does NOT establish

That a series with registered split metadata has had its historical prices properly adjusted; the registration explains away the price cliff under `SPLIT_NOT_ADJUSTED`, while single-source return checks skip split-shaped jumps entirely.
