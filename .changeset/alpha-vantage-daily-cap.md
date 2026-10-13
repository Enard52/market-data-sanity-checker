---
"market-data-sanity-checker": patch
---

Connectors can now declare a daily request cap (`dailyRequestLimit`), and Alpha Vantage declares 25 for a free key (none with `ALPHA_VANTAGE_PREMIUM=true`). The weekly scoreboard stays under it: symbols over the cap are reported as skipped, not as failed, and the 20% quorum is judged on the symbols actually requested. Before this, the free key's 26th request onward was refused every week and 5 of 30 symbols counted as failures, one short of excluding the provider. The Alpha Vantage connector also stops telling you that a daily rate-limit Note "needs a premium key": only a premium-endpoint refusal gets that hint now.
