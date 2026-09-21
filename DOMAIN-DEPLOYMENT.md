# Official domain deployment

Target URL: `https://www.hana-japanisches-restaurant.com`

## Current state (checked 2026-09-21)

- DNS is managed by `ns1.matbao.com` / `ns2.matbao.com`.
- `www` currently points to `dns.webcake.io`.
- Webcake displays `https://dydevx.github.io/Hana/` inside an iframe.
- The GitHub Pages custom domain and repository `CNAME` are disabled so the iframe URL does not redirect back to Webcake.
- Shared receipt links currently target `https://dydevx.github.io/Hana/` directly so `#bill2=...` reaches the app.
- `WEBCAKE-IFRAME.html` is the ready-to-paste Webcake embed and also forwards custom-domain receipt fragments to the iframe.

The official domain must serve the GitHub Pages site directly. No receipt API, database, Redis account, or server-side bill storage is required. Each receipt is compressed into its own URL fragment.

## Future direct-domain setup

- Add `CNAME` with `www.hana-japanisches-restaurant.com` only when the DNS change below is performed at the same time.
- `SITE_URL` uses the official HTTPS domain.
- `.github/workflows/pages.yml` builds and deploys `dist/` to GitHub Pages.
- The receipt URL has the form `https://www.hana-japanisches-restaurant.com/#bill2=<compressed-data>`.

## Deployment steps

1. In the GitHub repository, open **Settings → Pages** and set the custom domain to `www.hana-japanisches-restaurant.com`.
2. In the Mắt Bão DNS panel, replace the current `www` CNAME target `dns.webcake.io` with `dydevx.github.io`.
3. Push these files, then run the **Deploy HANA to GitHub Pages** workflow.
4. Wait for GitHub to verify DNS and issue the TLS certificate, then enable **Enforce HTTPS**.
5. Verify that the official URL loads the site directly, without a Webcake iframe.
6. Place a test order and confirm that its WhatsApp message contains an HTTPS `#bill2=` link. Open it in another browser, confirm the bill popup appears, and press **Beleg drucken**.

Changing DNS affects the live domain. The existing Webcake wrapper will stop serving `www` after the CNAME change.
