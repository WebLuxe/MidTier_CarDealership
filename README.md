# WebLuxe Cars: the Business car dealership website

One dealership, three websites. The same client folder builds the Starter, Business and Signature sites,
so a new client is a change of details, not a new build.

## See the demos

Double-click `start-demo.bat` (or run `npm run demo`), then open:

- http://localhost:4100/ : all three, with a box to put any dealer's name and colour on them
- http://localhost:4100/low/ : Starter
- http://localhost:4100/mid/ : Business
- http://localhost:4100/high/ : Signature (English and French)

Send a prospect their own version by adding their name and colour to the link:
`.../high/?name=Leal+Auto+Centre&accent=e0262f`

## A new client

1. Copy the `client` folder (for example to `clients/leal`).
2. Edit `client.json`: name, address, phones, WhatsApp number, hours, colour, the dealer's own words.
   Set `"demo": { "enabled": false }` so WhatsApp and Call buttons really open, and set `siteUrl` to their address.
3. Edit `stock.json`: one entry per car. Put the photos in `photos/` and list them under `photos`. The first photo is the card photo.
4. Build the tier they bought: `node src/build.mjs mid --client=clients/leal --out=out/leal`
5. Upload the folder it prints (`out/leal/mid`). It is plain files and works on any host and in any sub-folder.

Car status can be `available`, `reserved`, `sold` or `hidden`. `"featured": true` picks the car in the home page photo.

## What each tier includes

| | Starter | Business | Signature |
|---|---|---|---|
| Pages | Home, cars, contact | + a page per car, finance, sell | + compare, about, privacy, terms, 404 |
| Stock | Photo, price, facts, WhatsApp and Call per car | Search, body and budget filters, gallery, similar cars | + make, fuel, gearbox, year, saved cars, compare, full-screen photos |
| Finance | | Calculator, monthly price on every car | Same, plus the budget dial on the home page |
| Motion | One soft fade | Sections arrive as you scroll | Opening moment, flowing page changes, inspection scroll scene |
| Languages | English | English | English and French |
| Google | Titles, descriptions, dealer details | + car pages, share picture per car | + car details for Google, price on the share picture, sitemap in both languages |

The switches are in `src/lib/core.mjs` (`TIERS`). All wording is in `src/i18n.mjs`.

## Where things are

- `client/` : the only folder that changes per client
- `src/pages.mjs`, `src/lib/parts.mjs` : the pages
- `src/css/` : `base.css` (all tiers), `shop.css` (Business and Signature), then one file per tier
- `src/js/` : `core.js` (all tiers), `shop.js`, then one file per tier
- `dist/` : the built sites

The sample photos are from Unsplash (`client/photos/CREDITS.md`). The sample dealer, cars, reviews and phone numbers are invented.

## The Signature (3D) site

It lives in `flagship/` and is built separately:

1. `npm run client:high` puts the dealer from `client/` into it (name, phones, hours, cars, photos, logo).
2. `npm run build:high` writes it to `dist/high`.

The 3D hall has no name on the wall and a blank number plate, so the films for phones are the same for every dealer and never need rendering again.
The kit itself now builds Starter (`low`) and Business (`mid`) only.
