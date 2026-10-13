---
"market-data-sanity-checker": patch
---

`SERIES_TAIL_TRUNCATED` also cites the wrong-window regression shared in #35 (nobulex-registry `examples/wrong_window.py`), now pinned as three test cases: a matching window, a subject two sessions short, and a window with no shared session, which is `INSUFFICIENT_OVERLAP`, never a truncation. Thanks @arian-gogani.
