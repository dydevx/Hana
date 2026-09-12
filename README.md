# HANA Japanisches Restaurant

Fast, responsive, German-language restaurant website using HTML5, CSS3 and native JavaScript modules. The browser has no framework dependencies. Generated menu HTML remains indexable without JavaScript. Local fonts, WebP photography, native cart/lightbox dialogs and optional Google Maps loading.

## Local preview

Requires Node.js 20.19+ (tested with Node 24).

```sh
npm install
npm run build
npm run dev
```

Open http://127.0.0.1:3000. On PowerShell systems that block npm.ps1, use `npm.cmd`.

## Menu visual identity

The interface uses the charcoal/champagne-gold/ivory palette of the supplied PDF, including the actual flyer logo. Shared tokens live in `assets/css/style.css`; `assets/css/flyer-theme.css` applies the photographic hero, gold menu hierarchy and dark form/cart/booking surfaces. Legal pages share the theme.

## Menu and booking

The current supplied `MENU.pdf` is transcribed in `assets/js/menu.js`: 17 categories, 124 dish groups and 174 separately priced items/variants. The current downloadable copy is available at `assets/menu/speisekarte.pdf`. Menu numbers, prices, piece counts and source allergen codes are retained. Fifty-two food photographs are cropped directly from the same PDF and attached only to matching or clearly representative dishes. See `MENU-REVIEW.md` for source inconsistencies.

Customers can search by name, number or ingredient, filter vegetarian/spicy choices, select a protein, and add dishes to a persistent cart. Each variant has its own ID and price. Checkout validates contact details and pickup times, shows an itemized review, and prepares a WhatsApp message to the configured HANA number. The copy button provides an alternative if WhatsApp cannot be opened. Changing the cart invalidates the review and retains entered contact details in page memory.

The reservation form collects party size, date/time, name, phone, optional email and wishes, then displays a review and prepares a WhatsApp message. It never claims the restaurant has received or accepted a booking. Personal details are not written to localStorage. Only dish IDs and quantities persist.

The Mai Wok reference uses email/WhatsApp ordering and a Resmio reservation widget. HANA has no verified Resmio account/widget URL in this workspace. This implementation opens prefilled WhatsApp messages to `+49 1525 7186870`; customers still send the message themselves and wait for confirmation.

## Editing

- `assets/js/config.js`: contacts, opening hours, PDF URL and scheduling settings.
- `assets/js/menu.js`: verified flyer data, integer euro-cent prices, variants and legends.
- `scripts/render-menu.mjs`: static menu HTML, category navigation and variant selectors.
- `scripts/menu-section.template.html`: dedicated ordering section and catalog controls.
- `assets/css/menu-experience.css`: responsive editorial sidebar, category chips, dish cards and pagination.
- `scripts/extract-menu-images.py`: reproducible crops for 52 dish photographs in the current `MENU.pdf`.
- `assets/images/menu-items/`: optimized WebP dish crops; dishes without a source photograph intentionally have no image.
- `scripts/index.template.html`: page structure and customer copy.
- `scripts/reservation.template.html`: reservation form and review.
- `assets/js/reservation.js`: reservation validation, scheduling, review and WhatsApp preparation.
- `assets/js/app.js`: search, filters, variant selection, cart and checkout.
- `assets/js/core.js`: timezone, dates, holidays, scheduling and message generation.
- `assets/css/booking.css`: menu controls and reservation form styling within HANA's existing visual system.
- `scripts/build.mjs`: regenerates root HTML and deployment files in `dist/`.

Run `npm run build` after edits. The opening schedule retains the previously supplied brief: weekdays 12:00-14:30 / 17:00-22:00; weekends and NRW public holidays 12:00-15:00 / 16:00-22:00. The menu PDF has different hours and has only been used as the food-menu source.

## Operational configuration before launch

- Confirm WhatsApp handling with HANA. Customers must send the prepared message and wait for a reply; there is no automatic submission, table inventory, online payment or acceptance guarantee.
- Scheduling defaults are configurable: pickup lead 30 minutes, reservation lead 30 minutes, reservation duration 60 minutes, booking horizon 90 days. Requests for more than 12 guests are directed to the restaurant's phone number. These are website request limits, not a claim about restaurant capacity.
- Complete the existing legal operator and hosting/privacy drafts in `scripts/build.mjs` before publication.
- `RESERVATION_URL` can point the reservation CTA to a verified HANA booking provider. Do not use Mai Wok's account. `WHATSAPP_NUMBER` controls the WhatsApp destination for ordering and reservations.

## Deployment

All browser paths are relative and work under a GitHub Pages repository subpath. Set `SITE_URL` to the actual public base URL before building so canonical, social tags and sitemap match deployment.

**Vercel:** import the repository; `vercel.json` defines `npm run build` and output `dist`. No deployment has been performed.

**GitHub Pages:** choose GitHub Actions as Pages source, then manually run the included workflow. It publishes `dist/`. The workflow is manual to keep incomplete menu/legal content from being automatically published.

You can also upload only the contents of `dist/` to any static host. Node and development dependencies are unnecessary in production.

## Verification

```sh
npm test
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:browser
node tests/checkout.mjs
node scripts/lighthouse.mjs
```

The checkout suite uses the actual flyer menu and test guest details to exercise search, variants, filters, cart persistence, totals, checkout, reservation review, clipboard and expired times. It never sends an order or reservation. Reports/screenshots are in `test-results/` (gitignored). Lighthouse is measured on local static hosting and does not guarantee deployed results.

## Sources and asset use

The user selected [ca.camcam.click/hana](https://ca.camcam.click/hana) as the information and image source. Checked its linked [Über uns](https://ca.camcam.click/hana-2), [Galerie](https://ca.camcam.click/hana-3), and [Kontakt](https://ca.camcam.click/hana-4) pages on 2026-09-07. Contact information matches the previously checked official site: +49 2962 9766328, info@hana84.co, Carlsauestraße 6, 59939 Olsberg.

Eight additional source photographs are now used across the hero, introduction and six-image gallery: real food platters, restaurant interior, entrance and bar. The introduction reflects the source's Japanese cuisine, à-la-carte selection, atmosphere, wines and cocktails. Exact image URLs and source pages are recorded in `assets/images/camcam-sources.json`; the combined image inventory remains in `assets/images/sources.json`. Third-party ownership/licensing is not independently established. The page does not claim gallery photographs are individually named current menu dishes.

The source's Kontakt page also links to [HANA on Facebook](https://www.facebook.com/hana.restaurant.olsberg/) and [Google Maps](https://maps.app.goo.gl/G9P2BgAJNAMqWE3z7). The embedded map points to the same HANA place as the current site. Its old opening hours are deliberately superseded by the user's new schedule. The source reservation action opens an internal builder form rather than providing a verified standalone booking-service URL; the website now provides a reservation request form with a telephone fallback. Menu data and dish photography now come exclusively from the supplied `MENU.pdf`; no prices were imported from the old website.

The official [Foodbooking reservation URL](https://www.foodbooking.com/api/fb/gp_jzy) returned 404. Mai Wok was inspected as an information-architecture reference; no menu data or source code was reused. The HANA Google Maps embed loads directly in the location section. Google Fonts Cormorant Garamond and Inter are locally hosted variable WOFF2 subsets; their OFL licenses are in `assets/fonts/`.
