---
"market-data-sanity-checker": minor
---

`mdsc rules <ID>` prints a single rule (case-insensitive id); with `--format json` it prints just that rule's `meta`. An unknown id exits 1 with up to three "did you mean" suggestions. `mdsc rules --format` is now case-insensitive (`--format JSON` works) and rejects unknown formats with exit code 2, like `check` and `compare`. Thanks @eddyflores100-lang.
