# Dorisio Frontend

Web application for Dorisio — user-facing experience layer for sending tips and managing creator accounts.

## Live Demo

🚀 **Deployed on Vercel:** https://dorisio.vercel.app

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
- **Deployment:** Vercel

## Features

- ✅ User authentication (sign up / log in)
- ✅ Creator profile pages (public profiles)
- ✅ Creator discovery & search
- ✅ Send tip flow (Freighter wallet integration)
- ✅ Creator dashboard (earnings, transactions, wallet management)
- ✅ Real-time blockchain confirmation tracking
- ✅ Stellar testnet integration

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
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

### 3. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── (app)/            # Protected routes
│   │   ├── creators/[username]/page.tsx       # Creator profile
│   │   ├── creators/[username]/dashboard/     # Creator dashboard
│   │   └── creators/page.tsx                  # Discovery page
│   └── globals.css       # Global styles
├── components/
│   ├── sections/         # Page sections
│   │   ├── dorisio-button.tsx       # Send tip button
│   │   ├── dorisio-modal.tsx        # Tip flow modal
│   │   ├── wallet-manager.tsx       # Wallet management
│   │   └── creator-spotlight.tsx    # Featured creators
│   ├── ui/               # Reusable UI components
│   └── shared/           # Shared utilities
├── hooks/
│   ├── use-create-tip.ts           # Tip creation flow
│   ├── use-wallet.ts               # Wallet management
│   ├── use-creator-balance.ts      # Creator earnings
│   └── use-transaction-history.ts  # Transaction list
├── lib/
│   ├── sdk-client.ts     # SDK initialization
│   └── stellar/          # Stellar utilities
├── stores/
│   └── auth-store.ts     # Auth state (Zustand)
├── types/
│   └── index.ts          # TypeScript types
└── utils/
    ├── formatters.ts     # Format utilities
    └── validators.ts     # Zod schemas
```

## Key Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page with features | No |
| `/creators` | Creator discovery & search | No |
| `/creators/[username]` | Creator public profile | No |
| `/creators/[username]/dashboard` | Creator earnings & wallet | Yes |

## Environment Variables

### Required

- `NEXT_PUBLIC_API_URL` — Backend API base URL (required)
- `NEXT_PUBLIC_STELLAR_NETWORK` — `testnet` or `mainnet` (default: `testnet`)
- `NEXT_PUBLIC_STELLAR_HORIZON_URL` — Stellar Horizon endpoint (default: testnet)

### Optional

- `NEXT_PUBLIC_ENABLE_ANALYTICS` — Enable analytics (default: `false`)
- `NEXT_PUBLIC_ENABLE_ERROR_REPORTING` — Enable error reporting (default: `false`)

## Scripts

```bash
npm run dev              # Start dev server (port 3000)
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

import { useCreatorBalance } from '@/hooks/use-creator-balance';

export default function CreatorDashboard() {
  const { balance, loading, error } = useCreatorBalance(username);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Total Earnings: ${balance?.totalEarnings}</div>;
}
```

### Adding a component

1. Create in `src/components/`
2. Keep it presentational (props-driven)
3. Logic lives in parent or SDK hooks

## Deployment

### To Vercel

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Set environment variables (see DEPLOYMENT.md)
4. Deploy

```bash
vercel --prod
```

### Environment Setup for Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Environment variable configuration
- Vercel setup steps
- Health checks and monitoring
- Troubleshooting guide

## Key Principles

### Frontend Stays Dumb

❌ Don't do this:

```typescript
// Business logic in component
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
const response = await fetch('http://api.dorisio.com/api/v1/tips', {
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

## Testing the Tip Flow

1. **Create Account**
   - Go to home page, click "Sign Up"
   - Enter email and password
   - Verify email (testnet only)

2. **Link Wallet**
   - Go to `/creators/[any-username]/dashboard`
   - Click "+ Add Wallet"
   - Sign challenge with Freighter wallet

3. **Send Tip**
   - Go to `/creators/[creator-username]`
   - Click "💰 Send a Tip"
   - Enter amount, optional message
   - Select wallet and confirm
   - Wait for blockchain confirmation

4. **View Earnings**
   - Creator goes to their dashboard
   - See earnings overview card
   - Check transaction history table
   - Verify wallet management section

## Notes

- Frontend builds **depend on SDK** — build SDK first
- Never leak Stellar/blockchain logic into UI
- Keep routes simple — one responsibility per page
- Use Next.js middleware for auth guard routes (future)
- All API calls go through SDK, never directly to backend

## Support & Troubleshooting

For issues:

1. Check browser console for errors
2. Verify environment variables are set
3. Check backend is running (NEXT_PUBLIC_API_URL)
4. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production issues
5. Contact: support@dorisio.dev
