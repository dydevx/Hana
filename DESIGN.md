# HANA visual system

The visitor checks food and reservations on a phone or plans a visit on desktop. The user requested the visual tone of the supplied FLyer Hana.pdf: charcoal, champagne gold, ivory text and food photography against dark surfaces. The flyer is the color and identity reference.

Native HTML/CSS/JS. Shared semantic palette lives in `assets/css/style.css`: charcoal background (visually matched to PDF #191817), three dark surface levels, champagne gold for headings and primary actions, ivory foreground, warm muted text, distinct coral errors and soft green open status. Gold-filled buttons use dark text. Secondary controls use gold borders or labels on charcoal. All customer surfaces, the cart, forms, review panels and legal pages use the same palette.

`assets/css/flyer-theme.css` holds the flyer composition and component treatments; `experience.css` retains motion and existing responsive structure; `booking.css` defines the form and order layout. Color tokens are semantic (`--accent`, `--on-accent`, `--surface`, `--panel`, `--ink`); no red/beige naming remains. Locally hosted Cormorant Garamond and Inter preserve HANA's established typography.

The desktop hero uses a clean charcoal-and-photography split with a soft seam, a two-line headline and two primary visitor paths. Mobile puts the headline and both actions before a full-width photograph. The real logo is rendered from the supplied PDF into `assets/images/hana-flyer-logo.png` and used in the header and footer. Its distinctive colors remain intact. Menu categories use compact gold controls and card-based dish browsing. Booking uses an opaque charcoal form over dark restaurant photography. The footer closes the page with an editorial reservation callout, followed by compact address, hours, contact and legal information.

`assets/js/motion.js` owns progressive Web Animations API enhancements: headline entrance, photo pointer depth, interior reveal, gallery stagger, order-step emphasis, cart feedback and lightbox image changes. Native dialog entrance and button feedback use CSS. No scroll hijacking or animation dependencies.

All content is visible by default. A compact German motion toggle in the footer pauses decorative movement and persists only for the browser session. System reduced-motion disables motion automatically. Animations do not block interaction; off-screen groups animate only once, pointer movement applies only to fine pointers, and animations finish/pause on hidden tabs.

## Ordering menu surface

The menu has a dedicated ordering layout (`assets/css/menu-experience.css`) inspired by the information architecture of the Mai Wok reference while retaining HANA's own typography, palette and content. Desktop uses a sticky editorial introduction on the left and a wide catalog on the right. Search and dietary filters form the first control row; category chips form the second. On mobile the introduction stacks above the catalog and category chips become a horizontal sticky strip.

Search supports numbers, ingredients and variants. Category selection clears prior filters and can be reloaded through its URL hash. Dietary filters cover vegetarian, vegan and spicy choices. Results are paginated in groups of eight while all dishes remain in the static HTML for no-JavaScript reading.

Dish cards separate source numbers, portion/dietary labels, dish names and prices. Thirty-two cards use individual food photographs cropped from the supplied flyer; cards without a clearly attributable source photograph have no image or placeholder. Allergen codes are available in native details elements. Variant selectors update price, dietary labels and allergens together. Every card ends with a full-width add button; its count updates for the current variant. The catalog footer and existing header/mobile actions open the cart dialog for editing and checkout.
