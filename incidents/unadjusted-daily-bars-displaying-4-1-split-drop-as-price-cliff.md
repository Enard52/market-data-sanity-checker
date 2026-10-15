---
case: "Unadjusted daily bars displaying 4:1 split drop as price cliff"
source: "Alpaca via alpaca-trade-api-python"
reported_by: "@syltruong"
---

## What happened

The reporter fetched AAPL daily bars from 2020-01-01 with `get_barset`, finding a max close of `506.19` followed by a visible cliff from the 4:1 split; a repo contributor noted that `get_barset` served unadjusted historical bars with no split adjustment at that time (a 2022 comment in #316 notes `get_barset` was replaced and Alpaca added an `adjustment` parameter defaulting to raw).

## Evidence

[alpaca-trade-api-python#318](https://github.com/alpacahq/alpaca-trade-api-python/issues/318), [#316](https://github.com/alpacahq/alpaca-trade-api-python/issues/316)

## A checker should report

MDSC has no Alpaca connector, so this applies to file or object ingestion. When ingested as raw daily bars without split metadata, `SPLIT_NOT_ADJUSTED` (`src/rules/price/split-not-adjusted.ts:52-94`) matches the −75% drop implied by the 4:1 split within 5% tolerance (`matchSplitRatio`, line 58). With `splits` undefined or empty, `explained` evaluates to false (lines 62-66), and the rule emits a critical blocking finding. When unadjusted data is what the client intended, the consumer must treat the flag not as corrupt data, but as notice that continuous-price workflows require an adjustment layer.

## The check does NOT establish

That the raw prices are defective or that historical bars were corrupted. Single-source checking cannot tell whether a split jump is a vendor defect (failing to adjust historical bars) or a feed serving unadjusted prices without knowing whether the consumer intended raw or split-adjusted data (compare with the Alpha Vantage row above).
