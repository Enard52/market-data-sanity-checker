---
"market-data-sanity-checker": patch
---

`mdsc history --limit` now rejects anything other than a whole number of at least 1 (for example `abc`, `0`, `-3` or `2.5`) with a clear message and exit code 2, instead of silently asking for `NaN` or a negative number of entries.
