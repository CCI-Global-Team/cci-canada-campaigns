# CCI Canada Campaigns

Two-domain campaign workspace for Celebration Church International Canada.

## Apps

- `apps/find-the-fire` - standalone Next.js campaign site for the Find the Fire domain.
- `apps/the-fire-will-find-you` - standalone Next.js campaign site for The Fire Will Find You domain.

Both apps share campaign UI and Planning Center submission logic through internal `@cci-campaigns/*` packages.

## Packages

- `@cci-campaigns/campaign-ui` - reusable landing page and lead form UI.
- `@cci-campaigns/campaign-core` - campaign copy, Zod validation, Route Handler helpers, and Planning Center payloads.
- `@cci-campaigns/eslint-config` - shared lint configuration.
- `@cci-campaigns/typescript-config` - shared TypeScript configuration.

## Local Development

Install dependencies:

```sh
pnpm install
```

Run both apps:

```sh
pnpm dev
```

Run a single app:

```sh
pnpm --filter @cci-campaigns/find-the-fire dev
pnpm --filter @cci-campaigns/the-fire-will-find-you dev
```

Default local ports:

- `find-the-fire`: http://localhost:3000
- `the-fire-will-find-you`: http://localhost:3001

## Environment

Each app has an `.env.example`. Copy it to `.env.local` inside the app and provide:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CHURCH_CENTER_FORM_URL`
- `PLANNING_CENTER_FORM_ID`
- `PLANNING_CENTER_CLIENT_ID`
- `PLANNING_CENTER_SECRET`
- `PLANNING_CENTER_USER_AGENT`
- Planning Center form field IDs for phone, city, and interests
- Planning Center option IDs for interest fields if the shared form uses checkbox/dropdown options

Planning Center credentials must remain server-only. Do not expose them with `NEXT_PUBLIC_`.

### Local Form Mock

To test the full form flow without Planning Center credentials, set this in the app's `.env.local`:

```sh
PLANNING_CENTER_USE_MOCK_SUBMISSIONS=true
```

Mock mode still validates and normalizes the form data, builds a Planning Center-shaped payload with local mock field IDs, logs that payload to the dev server console, and returns a successful response. It does not call Planning Center and should stay `false` in production.

To inspect a live Planning Center submission while testing locally, set:

```sh
PLANNING_CENTER_LOG_SUBMISSIONS=true
```

This logs the outgoing Planning Center payload and the API response to the server console. It includes submitted names, email addresses, phone numbers, and city values, so keep it off in production.

## Checks

```sh
pnpm lint
pnpm check-types
pnpm build
```
