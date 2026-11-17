# Luvai Africa

A brown-and-cream African art gallery and cultural journeys website, inspired by Luvai Modern Africa.

## Features

- Responsive split hero and asymmetric artifact gallery
- Culture filters, search, sorting and device-local favourites
- Product enquiry and journey planning forms
- Artisan applications and journal interest registration
- Persistent request records in Cloudflare D1

Collection images and prices are illustrative previews. Payments, authenticated seller inventory management and confirmed travel bookings are not implemented.

## Development

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

```sh
npm run build
```

## Hosting and data

The current deployment runs on ChatGPT Sites using Vinext and Cloudflare Workers. `.openai/hosting.json` retains the existing Site identity and `DB` binding. Database schema and migration files are in `db/` and `drizzle/`.

This repository stores the source code. Pushing here does not automatically redeploy the existing ChatGPT Site. Connecting it directly to Vercel requires adapting the Cloudflare runtime and database integration; do not assume forms will work on Vercel unchanged.

Never commit credentials or runtime data. Copying this source does not copy the hosted database or submitted enquiries.
