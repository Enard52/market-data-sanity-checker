# Market-data incidents

A shared list of real cases where market data was wrong in a way a checker should catch.
One row per case. Each row says what a checker should report **and what that check does not
establish**, so a passing check is never read as more than it is.

Started in [#35](https://github.com/pacocartones/market-data-sanity-checker/issues/35). PRs
welcome: add a row, link the evidence, and keep the last two columns honest.

## Columns

- **Case**: a short name.
- **Source**: the provider, feed or tool where it happened (`any` when it is not provider-specific).
- **What happened**: the defect, in one or two sentences.
- **Evidence**: a public link (issue, post, fixture). No private data.
- **A checker should report**: the finding, with the rule if mdsc has one.
- **The check does NOT establish**: what a pass of that check still leaves open.
- **Reported by**: who brought the case.

## Cases

| Case | Source | What happened | Evidence | A checker should report | The check does NOT establish | Reported by |
| --- | --- | --- | --- | --- | --- | --- |
| Truncated tail passes a count-only comparison | any | A subject series ends two sessions before the authority. A comparison of session counts with a tolerance (10% in the original probe) passed with 2 of 21 sessions silently deleted. With equal counts but an entirely different window, a count comparison also passes. | [#35](https://github.com/pacocartones/market-data-sanity-checker/issues/35), [`wrong_window.py`](https://github.com/arian-gogani/nobulex-registry/blob/main/examples/wrong_window.py) | `SERIES_TAIL_TRUNCATED` naming the authority dates absent from the subject; with no shared session, `INSUFFICIENT_OVERLAP` (critical), never a truncation | That the shared sessions are correct: prices, adjustments and volumes need their own rules | @arian-gogani |
