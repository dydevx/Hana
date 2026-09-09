// Content checked against https://ca.camcam.click/hana and its linked pages on 2026-09-07.
// Opening hours follow the user's NEW schedule. Run npm run build after edits.
export const CONTENT_SOURCE_URL = 'https://ca.camcam.click/hana';
export const RESTAURANT_NAME = 'HANA Japanisches Restaurant';
export const PHONE_NUMBER = '+4929629766328';
export const WHATSAPP_NUMBER = '+4929629766328';
export const EMAIL_ADDRESS = 'info@hana84.co';
export const RESERVATION_URL = ''; // Official foodbooking link returned 404; do not reuse it.
export const ADDRESS = 'Carlsauestraße 6, 59939 Olsberg, Deutschland';
export const GOOGLE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=HANA+Japanisches+Restaurant+Carlsauestra%C3%9Fe+6+59939+Olsberg';
export const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2491.7695069225124!2d8.4895196!3d51.3521489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bbebc69727028d%3A0x3c0e6f722ada8ec9!2sHANA%20Japanisches%20Restaurant!5e0!3m2!1svi!2s!4v1788749343624!5m2!1svi!2s';
export const FACEBOOK_URL = 'https://www.facebook.com/hana.restaurant.olsberg/'; // Exact link from /hana-4.
export const INSTAGRAM_URL = '';
export const SITE_URL = 'https://www.hana-japanisches-restaurant.com';
export const MENU_PDF_URL = 'assets/menu/speisekarte.pdf'; // Supplied MENU.pdf.
export const RESERVATION_LEAD_MINUTES = 30;
export const RESERVATION_DURATION_MINUTES = 60;
export const RESERVATION_MAX_DAYS = 90;
export const PICKUP_LEAD_MINUTES = 30; // Configurable website scheduling buffer; confirm with restaurant.
export const OPENING_HOURS = {
  weekday: [['12:00', '14:30'], ['17:00', '22:00']],
  weekend: [['12:00', '15:00'], ['16:00', '22:00']]
};
