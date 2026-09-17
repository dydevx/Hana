# Validation - 2026-09-07

Verified locally at http://127.0.0.1:3000 with Chromium. The in-app browser reported no available browser; the project's Playwright setup was used.

- Build generates 168 priced menu entries, grouped into 118 dishes across 17 categories, from the supplied FLyer Hana.pdf.
- 13 unit/static tests pass: timezone, holidays, pickup and reservation boundaries, lead time, booking horizon, invalid dates, cart sanitation, exact totals, request payloads, source price tiers, links/assets and SEO.
- Browser layout checks pass at 320, 375, 390, 768, 1024 and 1440 pixels with no horizontal overflow or page errors.
- Desktop/mobile Axe checks pass. Booking review and cart review also pass their accessibility scans.
- Actual menu flows pass: number/name/ingredient search, empty results, reset, vegetarian variant selection, protein price changes, add/increment/decrement/remove/clear, persistence across reload, and exact totals.
- Checkout passes invalid-phone handling, pickup selection, itemized review with variant numbers, email recipient/subject/body, clipboard, editing and preservation of entered details after cart changes.
- Reservation passes party size, date/time selection, contact details, wishes, WhatsApp payload, clipboard, review/edit and rejection of an expired time immediately before opening WhatsApp.
- Personal details are not persisted in localStorage. The reservation form stays hidden without JavaScript and offers a telephone fallback; the complete menu remains in static HTML.
- The original PDF is copied to assets/menu/speisekarte.pdf. Source anomalies and the authoritative opening schedule are documented in MENU-REVIEW.md.

Screenshots: test-results/menu-mobile.png, reservation-desktop.png, reservation-form-mobile.png, reservation-review-mobile.png and order-review-mobile.png. Full-site images and accessibility output are also under test-results/.

No order or reservation was transmitted, and no deployment was performed. Actual receipt/acceptance cannot be tested without the restaurant. The static site now prepares email orders and email reservation requests; it does not provide direct delivery, live table inventory or online payment. HANA's own booking provider/account is needed for a direct widget such as the reference site's Resmio integration.

Existing Impressum and Datenschutz operator/hosting drafts still require business details before publication. Prior Lighthouse results predate this feature update; no new performance score is claimed.

## PDF palette redesign

The complete interface now follows the supplied flyer: charcoal surfaces, champagne-gold accents, ivory foreground and the extracted original logo. The shared palette also covers legal pages. Build and all 13 unit/static checks pass. Responsive browser checks (320 through 1440 px), desktop/mobile Axe scans, and actual-menu order/reservation flows pass after the theme update. Visual screenshots: `flyer-hero-desktop.png`, `flyer-hero-mobile.png`, `flyer-menu-desktop.png`, `flyer-booking-desktop.png` under test-results/.

## Custom ordering menu

The redesigned menu passes build, 13 unit/static checks, desktop/mobile accessibility and responsive checks. The actual-menu flow suite additionally verifies category switching, category hash reload, showing all 118 dishes, global search, variant-specific add counts and the desktop basket total. The existing checkout and reservation flows also pass. New screenshots are in test-results/menu-custom-desktop.png, menu-custom-cart.png and menu-custom-mobile.png. No order was sent.

## Reservation email chooser - 2026-09-17

Reservations now open an email chooser addressed to `info@hana84.co`, replacing the WhatsApp handoff. Desktop offers Gmail web; iPhone/iPad offers Mail via `mailto:` and Gmail via `googlegmail:`; Android offers a Gmail-targeted `intent:` with an encoded Gmail web fallback. Mobile also offers an explicit Gmail web link. Mail opens the configured default mail application; the website cannot detect whether Gmail is installed or force Apple Mail when another app is the default.

Build and 17 unit/static tests pass. `node tests/flows.mjs` passes the existing order/reservation flow, including popup clipboard and Escape/focus behavior. `node tests/reservation-email.mjs` passes Chromium desktop/iPhone/Android emulation: device-specific links, complete Unicode message payloads, primary focus, close/reopen, expired-time cancellation, no horizontal overflow at 320px, and Axe accessibility checks. Screenshots: `test-results/reservation-email-desktop.png`, `reservation-email-iphone.png`, and `reservation-email-android.png`.

The in-app browser had no available browser; the project's Playwright tests were used. Native Mail/Gmail app launches and actual receipt require real-device verification. No email was sent and no deployment was performed.

Follow-up fix: a valid reservation submit now immediately opens the platform's primary email link within the submit gesture, while keeping the chooser for fallback and reopening. Desktop opens Gmail web; iPhone/iPad attempts the default mail application; Android attempts Gmail. The focused reservation-email suite now checks an actual desktop popup with Gmail network responses mocked, verifies immediate mobile launch attempts, and confirms invalid submissions do not open the chooser. Both flow suites, build and 17 unit/static tests pass. Native app installation and launch still require a real phone.

Cart email fix: the pickup-order review button now opens a Gmail compose URL in a new tab on desktop, instead of `mailto:`. iPhone/iPad uses the default mail application with an alternate Gmail-app link; Android uses the Gmail intent with standard mail and Gmail web alternatives. Every order email link preserves the expired-pickup-time guard. The flow suite clicks the actual cart button and verifies the resulting Gmail tab's recipient and full itemized message, with Gmail responses mocked to prevent external transmission. Build, 17 unit/static tests and the flow suite pass.

Final cross-device check: `node tests/reservation-email.mjs` now exercises both the cart order button and reservation submit in desktop, iPhone and Android emulation. All three pass Gmail-tab navigation on desktop, mobile app-navigation attempts, complete message payloads and fallback URLs, cart/popup layout and accessibility. Native app opening on a real phone remains unverified.
