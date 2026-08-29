# Dorisio Frontend

Web application for Dorisio — user-facing experience layer for sending tips and managing creator accounts.

## Purpose

The frontend is the **dumb UI layer** that:

- Renders state
- Calls SDK functions
- Zero business logic
- Consumes stabilized SDK API

**Design principle:** Frontend = experience only. All logic lives in backend or SDK.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **State:** Zustand (light client state), TanStack Query (server state)
- **Forms:** React Hook Form + Zod
- **SDK:** Dorisio-sdk (from workspace)

## Prerequisites

- Node.js 20+ LTS
- Backend running (see `../backend`)
- SDK built (see `../sdk`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update values to match your backend:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   └── providers.tsx     # Context providers
├── lib/
│   └── store.ts          # Zustand stores
└── components/           # Reusable components (to be built)
```

## Minimal Scope (MVP)

Start with just:

- **Landing page** — hero, features, CTA
- **Login/Signup** — basic auth flow
- **Creator profile page** — public view
- **Send tip flow** — minimal payment UI
- **Basic dashboard** — for creators to see earnings

Don't expand beyond this until the core works.

## Key Principles

### Frontend Stays Dumb

❌ Don't do this:

```typescript
// Business logic in component
const amountUSD = amount * exchangeRate;
const fee = amount * 0.025;
const total = amount + fee;
```

✅ Do this:

```typescript
// Business logic in backend/SDK
const result = await sdk.createTip({ creatorId, amount });
```

### Call SDK, Not Backend Directly

❌ Don't do this:

```typescript
const response = await fetch('http://api.Dorisio.com/api/v1/tips', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

✅ Do this:

```typescript
const tip = await sdk.createTip(payload);
```

### State Management

- **Server state** (data from API) → TanStack Query
- **Client state** (UI state, auth token) → Zustand
- **Component state** (form input) → React useState

### Component Pattern

```typescript
'use client'; // Most components are client components in App Router

import { useQuery } from '@tanstack/react-query';
import { useDorisio } from 'Dorisio-sdk/react';

export function MyComponent(): JSX.Element {
  const { client } = useDorisio();
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => client.getCreatorProfile('id'),
  });

  return <div>...</div>;
}
```

## Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # Run TypeScript check
```

## Code Standards

- **TypeScript:** Strict mode, no `any`
- **Formatting:** Prettier (100 char line width)
- **Linting:** ESLint + Next.js rules
- **Components:** Server/client boundary is explicit
- **Imports:** Use `@/` path alias for local imports

## Development Workflow

### Adding a page

1. Create file in `src/app/[route]/page.tsx`
2. Use `'use client'` at top (most pages need interactivity)
3. Use SDK hooks from context
4. Keep logic minimal

Example:

```typescript
'use client';

import { useCreator } from 'Dorisio-sdk/react';

export default function CreatorPage({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  const { creator, loading, error } = useCreator(params.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{creator?.user.name}</h1>
    </div>
  );
}
```

### Adding a component

1. Create in `src/components/`
2. Keep it presentational (props-driven)
3. Logic lives in parent or SDK hooks

## Environment Variables

- `NEXT_PUBLIC_API_URL` — Backend API base URL (required, must be public)
- `NEXT_PUBLIC_STELLAR_NETWORK` — `testnet` or `mainnet` (optional)
- `NEXT_PUBLIC_STELLAR_HORIZON_URL` — Stellar Horizon endpoint (optional)

## Notes

- Frontend builds **depend on SDK** — build SDK first
- Never leak Stellar/blockchain logic into UI
- Keep routes simple — one responsibility per page
- Use Next.js middleware for auth guard routes (future)
- All API calls go through SDK, never directly to backend
