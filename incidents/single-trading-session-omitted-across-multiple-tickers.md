---
case: "Single trading session omitted across multiple tickers"
source: "Yahoo Finance via yfinance"
reported_by: "@rguledjian"
---

## What happened

For multiple US indices and equities (`^GSPC`, `^IXIC`, `IWM`, `RSP`, `ANET`), daily history skipped Friday 2026-08-28 entirely, jumping from Thursday 2026-08-27 directly to Monday 2026-08-31 despite August 28 being an ordinary trading session.

## Evidence

[yfinance#2964](https://github.com/ranaroussi/yfinance/issues/2964)

## A checker should report

By default, `BAR_MISSING` (`src/rules/price/bar-missing.ts:24-44`) does NOT report this gap because it requires a gap of at least a full trading week (`minMissingWeekdays: 5`) measured via `weekdaysBetween` (`src/rules/calendar.ts:9-23`), so a 1-weekday Friday gap falls below the reporting threshold. Catching a single omitted session in single-source checking is unsupported because MDSC deliberately ships no exchange holiday calendar in core (`src/rules/calendar.ts:1-7`), so lowering `minMissingWeekdays` would flag every scheduled exchange holiday as missing. Furthermore, the cross-ticker correlation of the gap is evidence observed across the reporter's 5-ticker query, which a single-symbol checker cannot see.

## The check does NOT establish

Whether an isolated weekday gap is a vendor omission or an unscheduled market closure. Settling the omission requires cross-checking against a second source; however, `mdsc compare` has no rule that reports a date present in one source and missing in the other (`CLOSE_DIVERGENCE` and `PRICE_DATE_MISMATCH` evaluate shared dates only), so the missing session surfaces only in the `only_in` counts of the comparison statistics (`src/compare/comparator.ts:40`) rather than as a discrete rule finding.
