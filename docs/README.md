# Source data

Files the site is built *from*, rather than files the site serves.

| File | What it is |
|---|---|
| `BoxDrop_US_Locations.xlsx` | The store network. 252 stores, 44 states, pulled from boxdropdirect.com/pages/store-locator on 2026-10-10. |

## Updating the store list

1. Drop the new export over `docs/BoxDrop_US_Locations.xlsx`, keeping the name.
2. Regenerate, then rebuild:

```bash
python3 dealers_from_xlsx.py && python3 build.py
```

The first command rewrites `assets/js/dealers.js`; the second rebuilds the
pages. Nothing else needs touching — `assets/js/dealers.js` is generated, so
edits made directly to it are lost on the next run.

## What the sheet has to contain

The first row of the first worksheet is read as headers, matched loosely by
name, so column order does not matter:

`State` · `City` · `Store Name` · `Street Address` · `ZIP` · `Phone` · `Website / Location Page`

Rows missing a state, city or store name are skipped and counted in the output.

## What the sheet does not contain

Three fields the site needs are not in it, and are derived from each store's
id instead: `factor` (the dealer's floor price, which every price on the site
is calculated from), `hoursSet` and `imgSet`.

Deriving them from the id rather than at random is deliberate: a store keeps
the same price and the same opening hours across re-imports, so replacing the
sheet does not silently reshuffle prices. New stores get values on the same
rule. **They are prototype values, not real floor prices.** Real pricing would
mean adding a column here and reading it in `dealers_from_xlsx.py`.

Also absent: per-store coordinates. The locator's map plots one tile per state
using the state centres in the generator, not a pin per store, so none are
invented.

## A note on this folder

GitHub Pages serves the whole repository, so anything in here is reachable at
`/docs/<filename>`. The store list is already public on boxdropdirect.com, so
that is no worse than the source. Do not put anything in here that should not
be public.
