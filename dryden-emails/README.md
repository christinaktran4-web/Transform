# Dryden Dispensary — Weekly Email Blocks

Reusable, copy/paste-ready HTML sections for Alpine IQ's HTML block editor. Every block uses inline CSS only, shares the same design tokens, and is built as a full-width table so it stacks cleanly with the other blocks in a single cohesive email.

## How to use

1. Open `blocks/` and copy the file for the section you need.
2. Paste it directly into a new HTML block in Alpine IQ.
3. Stack blocks in the order below (skip any that don't apply that week).
4. Swap the bracketed/placeholder copy for that week's real content.

For a full send, `templates/weekly-campaign-example.html` has everything already assembled in order — copy the whole file in if Alpine IQ accepts one large HTML block, or paste it section-by-section if it works block-by-block.

## Weekly workflow

Each week, copy `weekly-input-form.txt`, fill it in (winner names, brand of the week, this week's products, theme if any — the same info Sean texts over, plus your product picks), and paste the filled-out form to Claude in chat. Claude updates the blocks and the assembled template in place so they're ready to paste into Alpine IQ. Leave any field blank or write "skip" to drop that section for the week.

## Section order

| # | File | Purpose |
|---|------|---------|
| 1 | `01-header.html` | Wordmark + tagline, opens every email |
| 2 | `02-intro.html` | One-line hook for what's in this week's send |
| 3 | `03-winner-of-the-week.html` | Winners Circle — weekly + monthly giveaway shoutout (gold accent) |
| 4 | `04-brand-spotlight.html` | Featured brand(s) of the week |
| 5 | `05-product-spotlight.html` | 3 stacked product cards ("Fresh From The Shelf") |
| 5b | `05b-single-product-card.html` | One extra product card, drop in if you need a 4th |
| 6 | `06-themed-section.html` | Swappable event tie-in (World Cup, 4/20, holidays, etc.) |
| 6 | `06-fourth-of-july.html` | Seasonal variant — holiday stock-up message + closed-for-holiday notice card |
| 7 | `07-cta-button.html` | Closing CTA button to the menu |
| 8 | `08-footer.html` | Address + unsubscribe |
| — | `09-divider.html` | Optional thin spacer if two same-background sections sit back to back |

## Design system

- **Backgrounds** alternate between `#050805` (header/CTA/footer), `#0b0f0b` (intro/brand), and `#111111` (winner/products) to create rhythm without hard edges.
- **Green `#9DDB6B`** is the standard section marker — eyebrow labels, dividers, the CTA button.
- **Gold `#c7a96b`** is reserved for "premium" moments — Winner of the Week only. Don't use it for regular section headers or it loses its meaning.
- **Section pattern**: uppercase letter-spaced eyebrow → bold white headline → short accent-colored divider bar → body copy capped at ~480–520px and centered. Reuse this rhythm for any new section so it reads as one email, not stitched-together blocks.
- **Product cards**: `#181818` background, `1px solid #2a2a2a` border, `12px` radius, stacked vertically (not side-by-side) so they stay mobile-friendly without extra media queries.
- **Font**: Arial, Helvetica, sans-serif throughout — no web fonts, for max email client support.
- All tables use `role="presentation"` and `width="100%"` with an inner `max-width` cap (`480–600px`) so content stays centered and readable on both desktop and mobile.

## Placeholders to update each week

- `01-header.html` — none, this one stays static
- `03-winner-of-the-week.html` — weekly winner name (`Chris M.`) and monthly winner name (`Jayne E.`); if there's no monthly winner that week, delete the monthly row and divider
- `04-brand-spotlight.html` — brand name + one-line description
- `05-product-spotlight.html` / `05b-single-product-card.html` — category, brand, strain/flavor, size/format for each product
- `06-themed-section.html` — eyebrow, headline, and body copy (swap "World Cup Watch List" for whatever the current tie-in is: 4/20, a holiday, a local event, etc.)
- `07-cta-button.html` — button headline + link `href` (update if linking to a specific collection instead of the general menu)
- `08-footer.html` — `[STREET ADDRESS, CITY, STATE]` and `[UNSUBSCRIBE_LINK]` (Alpine IQ may auto-inject its own unsubscribe merge tag — swap this for whatever tag Alpine IQ uses if so)

## Tone reminders

- Premium but local — boutique, not promo-heavy.
- Short sections, bullets over paragraphs, clear hierarchy.
- No cannabis puns, no "elevate your vibe," no "lit," no "high times."
- Good copy patterns to reuse: *Fresh From The Shelf, Brand Spotlight, Winner of the Week, Match Day Essentials, Shop Match Day Picks.*
