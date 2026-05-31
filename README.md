# Lumenary — Landing Page

Marketing landing page for [Lumenary](https://lumenary.ca), the non-custodial treasury platform for Canadian SMEs.

## What's in this repo

| File | Purpose |
|---|---|
| `Lumenary Landing Page.html` | Main page — all sections and markup |
| `lumenary.css` | Design system — tokens, layout, dark mode, responsive |
| `lumenary.js` | Interactions — scroll reveal, FAQ accordion, chart draw, count-up, CTA form, jargon API |
| `coins.js` | Canvas stablecoin spin animation (hero section) |
| `motion-lib.js` | Canvas animations for the four platform feature blocks |
| `image-slot.js` | Progressive image loading web component |
| `tweaks-panel.jsx` | Dev panel UI (React) |
| `lumenary-tweaks.jsx` | Jargon-level switcher (`data-vary` copy variants) |

## Running locally

Open `Lumenary Landing Page.html` directly in a browser. No build step required — React and Babel are loaded from CDN, everything else is vanilla JS and CSS.

## Page sections

1. **Nav** — fixed header, blurs on scroll
2. **Hero** — headline + rotating stablecoin canvas animation
3. **Trusted Rails** — partner/protocol logo grid (Morpho, Arbitrum, Interac, FINTRAC, Privy, Chainlink)
4. **Platform** — four alternating feature blocks with live canvas animations
5. **Comparator** — DeFi vs Canadian savings chart with time-filter pills
6. **Metrics** — 7% APY · <$0.10/deposit · ~4h withdrawal · 100% non-custodial
7. **Compliance** — regulatory checklist + body grid (FINTRAC, CRA, Revenu Québec, CARF 2026)
8. **FAQ** — accordion, five questions
9. **CTA** — private beta email signup
10. **Footer** — links + legal disclaimer

## Design

- **Palette:** warm cream (`#F7F5EE`) light / near-black (`#131210`) dark — toggled via `html.dark`
- **Type:** Newsreader (serif display) + Hanken Grotesk (sans UI)
- **Accent:** gold/amber (`#9A7A33` light / `#C7A24E` dark)
- **Copy variants:** three jargon levels per block (`data-zero`, `data-balanced`, `data-owned`) switchable via `window.LUM.setJargon(level)`
