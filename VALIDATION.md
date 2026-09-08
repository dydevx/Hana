# Validation - 2026-09-07

Verified locally at http://127.0.0.1:3000 with Chromium. The in-app browser reported no available browser; the project's Playwright setup was used.

- Build generates 168 priced menu entries, grouped into 118 dishes across 17 categories, from the supplied FLyer Hana.pdf.
- 13 unit/static tests pass: timezone, holidays, pickup and reservation boundaries, lead time, booking horizon, invalid dates, cart sanitation, exact totals, request payloads, source price tiers, links/assets and SEO.
- Browser layout checks pass at 320, 375, 390, 768, 1024 and 1440 pixels with no horizontal overflow or page errors.
- Desktop/mobile Axe checks pass. Booking review and cart review also pass their accessibility scans.
- Actual menu flows pass: number/name/ingredient search, empty results, reset, vegetarian variant selection, protein price changes, add/increment/decrement/remove/clear, persistence across reload, and exact totals.
- Checkout passes invalid-phone handling, pickup selection, itemized review with variant numbers, email payload, clipboard, editing and preservation of entered details after cart changes.
- Reservation passes party size, date/time selection, contact details, wishes, email payload, clipboard, review/edit and rejection of an expired time immediately before opening email.
- Personal details are not persisted in localStorage. The reservation form stays hidden without JavaScript and offers a telephone fallback; the complete menu remains in static HTML.
- The original PDF is copied to assets/menu/speisekarte.pdf. Source anomalies and the authoritative opening schedule are documented in MENU-REVIEW.md.

Screenshots: test-results/menu-mobile.png, reservation-desktop.png, reservation-form-mobile.png, reservation-review-mobile.png and order-review-mobile.png. Full-site images and accessibility output are also under test-results/.

No order or reservation was transmitted, and no deployment was performed. Actual receipt/acceptance cannot be tested without the restaurant. The static site prepares email requests; it does not provide direct delivery, live table inventory or online payment. HANA's own booking provider/account is needed for a direct widget such as the reference site's Resmio integration.

Existing Impressum and Datenschutz operator/hosting drafts still require business details before publication. Prior Lighthouse results predate this feature update; no new performance score is claimed.

## PDF palette redesign

The complete interface now follows the supplied flyer: charcoal surfaces, champagne-gold accents, ivory foreground and the extracted original logo. The shared palette also covers legal pages. Build and all 13 unit/static checks pass. Responsive browser checks (320 through 1440 px), desktop/mobile Axe scans, and actual-menu order/reservation flows pass after the theme update. Visual screenshots: `flyer-hero-desktop.png`, `flyer-hero-mobile.png`, `flyer-menu-desktop.png`, `flyer-booking-desktop.png` under test-results/.

## Custom ordering menu

The redesigned menu passes build, 13 unit/static checks, desktop/mobile accessibility and responsive checks. The actual-menu flow suite additionally verifies category switching, category hash reload, showing all 118 dishes, global search, variant-specific add counts and the desktop basket total. The existing checkout and reservation flows also pass. New screenshots are in test-results/menu-custom-desktop.png, menu-custom-cart.png and menu-custom-mobile.png. No order was sent.
