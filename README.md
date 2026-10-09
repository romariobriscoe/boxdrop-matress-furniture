# BoxDrop national ecommerce prototype

A clickable front-end prototype of the national BoxDrop site, built as the design
reference for development. Five pages, realistic sample data, no backend.

**Live:** https://claude.ai/artifact/3rGdWH2vq9bttm7egYhszS

## The idea the whole site is built on

BoxDrop sells online at a price its own dealers undercut. Rather than hide that,
every price on the site appears as a **price ledger**: the online price in navy,
the local dealer price in green, and the reason for the gap underneath. Enter a
ZIP once and every ledger on every page resolves from a range to that dealer's
actual number.

Navy means the online road. Green means the local road. No other colour is used
for anything.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Homepage. Price promise band, hero, categories, how pricing works, best sellers, dealer spotlight, guarantees, firmness guide, footer. |
| `category.html` | One template for every category, selected by hash: `#mattresses`, `#bases`, `#bedroom`, `#living`, `#dining`, `#outlet`. Filters, sort, dealer stock toggle. `#dining` shows a dealer-first state instead of a grid. |
| `product.html` | Product page, selected by hash (`#s2w-reactive-hybrid` by default). Dual price above the fold, option rows, layer and bed-height diagrams drawn to scale, specs, reviews, sticky buy bar. |
| `dealers.html` | Locator. ZIP search, radius filter, schematic map, dealer cards with photo, hours, phone and floor-price indication. |
| `cart.html` | Order summary holding both prices per line, plus what the same basket costs at your dealer. |

## Build

Pages are assembled from shared parts so the chrome cannot drift between them.

```bash
python3 build.py
```

- `src/_chrome.html`, `src/_footer.html`, `src/_sprite.html` — shared chrome
- `src/<page>.body.html` — the `<main>` for each page
- `src/<page>.page.js` — optional per-page script, inlined after `boxdrop.js`

`index.html` is emitted without a document skeleton because the Artifact platform
supplies one. Every other page carries its own.

## Code

- `assets/css/boxdrop.css` — the whole design system. Tokens first, light and dark.
- `assets/js/boxdrop.js` — dealer state, the price ledger, cart, shared renderers.
- `assets/js/catalog.js` — 59 sample products across six categories.

Dealer choice and cart live in `localStorage`, wrapped so they never throw.
No frameworks, no build step beyond `build.py`.

## Sample data

Try ZIP `25143`, `25301`, `25526`, `25701` or `26101`. Each dealer has a different
floor price, so the resolved numbers differ by dealer.

## Placeholders to replace

- Product photography is pulled from the brand sites BoxDrop carries
  (Sapphire Sleep, Beautyrest, Serta, Simmons, Nectar, Versa Posh, Somnicline,
  Steve Silver, Flexsteel)
  and is for layout only.
- Dealer card photos are showroom vignettes standing in for real storefront
  photography, which RSS still has to collect from every dealer.
- Dining is built from Steve Silver's catalogue; living room motion upholstery
  is Flexsteel. Both are brands BoxDrop carries.
- Images are JPEG and PNG. Production should serve WebP or AVIF with `srcset`.
