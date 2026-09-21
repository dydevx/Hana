# Validation

## Receipt links and printing — 2026-09-21

- Receipt data is compressed into the `#bill2=` URL fragment. No bill is written to a server, database, file, cookie, or localStorage.
- The order review hides the encoded URL behind **Bestellbeleg öffnen und drucken**. The prepared WhatsApp message and the copied text for Zalo retain the complete link on its own line.
- The checkout destination is `+49 1525 7186870`.
- Unit tests cover self-contained link creation, decoding, malformed payloads, exact totals, and the WhatsApp destination.
- Chromium checks cover opening the receipt in a clean browser context, copying the full message for Zalo, clipboard-denied fallbacks, 58/80 mm print layouts, and print-button invocation.
- The same receipt suite passed through a temporary public HTTPS tunnel: a fresh browser opened the shared link, rendered the bill, and invoked printing. The tunnel was stopped after the test.
- A public HTTPS address is required for a link opened on another phone. A `127.0.0.1` link only works on the computer that created it.
- Native WhatsApp/Zalo link detection and a physical printer still require a real-phone test. The automated checks do not send a message or print on paper.

## Existing site coverage

- Build and static checks validate menu data, scheduling, cart sanitation, order payloads, links, assets, and SEO output.
- Browser tests cover responsive layouts, accessibility, menu search and filters, cart persistence, checkout, reservation review, and expired-time guards.
- Personal contact details are not persisted in localStorage. Only dish IDs and quantities persist in the cart.
- Existing Impressum and Datenschutz operator/hosting drafts still require verified business details before publication.
