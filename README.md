# Luvai Africa

A simple marketplace for African artisans: real shops, real product photos and short descriptions. No demo listings, travel packages, directory entries or invented testimonials are rendered.

## What works

- Buyer browsing without an application account, category filters, search, currency-aware price sorting and pagination.
- Email/password registration, confirmation, sign-in, session persistence, password recovery and sign-out through Supabase Auth.
- Artisan onboarding and editable public shop profiles.
- Unlimited product listings per artisan (there is no application listing cap), with up to six photos per piece.
- Photos resized to WebP in the browser and stored in a dedicated Supabase Storage bucket.
- Drafts, publishing, editing, sold status and recoverable archiving.
- Short artifact descriptions, materials, dimensions, prices in KES/USD, and made-to-order status.
- Product and shop sharing links, device-local favourites and direct WhatsApp enquiries.
- Private listing reports stored for operator review.

Makers arrange payment, delivery and returns directly with buyers. The application does not collect payment or promise payment protection. Listing fees are not charged at launch. Supabase plan storage/usage limits still apply.

## Runtime

```sh
npm ci
npm run dev
```

Sites/Vinext:

```sh
npm run build
```

Vercel/Next.js:

```sh
npx next build
```

`vercel.json` selects the Next.js build. The marketplace uses Supabase from the client, so its working features do not depend on a Cloudflare-only database binding. The old marketing enquiry endpoint returns HTTP 410; prior D1 enquiry records are retained. The native Sites access policy remains separate from application accounts.

## Backend and access control

Supabase project: `uknpkoxwuygwztonlyrj` (the existing project containing the earlier artisan tables). This implementation adds only the dedicated `luvai_artisans`, `luvai_products`, `luvai_reports` tables and `luvai-products` storage bucket. Other applications' tables and authentication settings are unchanged. Supabase Auth accounts are shared at the project level; a separate Luvai shop profile is required to sell here.

`lib/market-config.ts` contains only the project URL and publishable/anon client key. The key is not a secret or an authorization boundary. Never put a service role key in the client. Row Level Security restricts writes to the authenticated owner; public queries show published/sold products only. Product image paths are constrained to the owner's shop and product folders. Email addresses are not stored in public shop rows.

The SQL migration is in `supabase/migrations/`. It has already been applied to the connected project. Do not reapply it blindly to an existing database. The rollback-only integration checks in `tests/marketplace-rls.sql` verify public visibility, private drafts, cross-seller write denial, photo ownership and report privacy without retaining fixtures.

Reports can be reviewed by the operator in the Supabase table editor. No public or self-assigned admin role is implemented. Sellers archive listings rather than permanently deleting records. Removed/cancelled photo uploads can leave unreferenced objects; the operator should monitor storage and remove orphaned uploads using an age threshold and a reference check as the service grows.

## Email configuration before inviting artisans

The project currently requires signup email confirmation. This app preserves that protection. Test a real confirmation email and a password reset email using an address you control. Configure a production SMTP sender if the project's default email service restricts recipient addresses or rate-limits delivery. Add the actual deployed origin to Supabase Authentication → URL Configuration → Redirect URLs. This enables confirmation and password reset links to return to Luvai. The application also supports entering a signup code if the configured email template includes one.

No SMTP credentials are included in source, and no end-to-end email delivery claim should be made without completing that test. Existing shared-project email and redirect settings were not changed.
