---
"market-data-sanity-checker": minor
---

New compare rule `SERIES_TAIL_TRUNCATED` (warning): when one source ends two or more sessions before the other, `mdsc compare` now reports it and names the missing dates. A long enough overlap used to hide this case: `INSUFFICIENT_OVERLAP` stayed silent and `BAR_MISSING` only sees gaps between bars, so a series cut short at its end still read as agreement. A different start date is not reported, and neither is a single missing latest session. Reported in #35. The catalog is now 37 rules.
