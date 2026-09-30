# Mobile-first design and responsive layouts

Use this guide when building creator discovery, profiles, dashboards, or tip forms. Start with a usable narrow layout, then add columns and navigation space as the content allows. A small screen must still expose the primary action, validation errors, and wallet connection status.

## Breakpoint strategy

[`tailwind.config.ts`](../tailwind.config.ts) uses Tailwind CSS 3 and does not override `theme.screens`, so the [Tailwind 3 defaults](https://v3.tailwindcss.com/docs/responsive-design) apply. Widths are **CSS viewport pixels**, not physical screen pixels. Device descriptions below are testing examples, not device detection rules.

| Prefix | Starts at                          | Typical use                                                      |
| ------ | ---------------------------------- | ---------------------------------------------------------------- |
| None   | Every width, including below 640px | Narrow phones; stacked content and full-width actions            |
| `sm:`  | 640px                              | Roomier phones in landscape; inline action groups when they fit  |
| `md:`  | 768px                              | Tablet-sized viewports; two-column cards and expanded navigation |
| `lg:`  | 1024px                             | Wider layouts; three-column cards or a filter sidebar            |
| `xl:`  | 1280px                             | Large desktop viewports; more spacing within a capped container  |
| `2xl:` | 1536px                             | Very wide viewports; retain readable content widths              |

Unprefixed classes apply at all widths. `md:grid-cols-2` starts at 768px and continues above it until another class overrides it. `sm:` does **not** mean “phones only.” Prefer the existing breakpoints; add a custom breakpoint centrally only when content cannot fit at an existing boundary, and document why. Do not branch on user-agent strings or `window.innerWidth` to render different initial markup: CSS avoids hydration mismatches and responds to resizing and zoom.

Use 320px as a narrow reflow check, then 375px/390px, 768px, 1024px, and 1440px as representative widths. For every breakpoint a component uses, also inspect one pixel below, exactly at, and one pixel above it. Browser zoom can change the effective CSS viewport width.

## Build the narrow layout first

Give content room to wrap, preserve DOM reading order, and layer larger-screen enhancements onto the base layout:

```tsx
export function DiscoveryHeader() {
  return (
    <header className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold md:text-4xl">Discover creators</h1>
        <p className="mt-2 text-base">Find a creator to support.</p>
      </div>
      <a
        href="/creators"
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:w-auto"
      >
        Browse creators
      </a>
    </header>
  );
}
```

The action is full width on narrow screens and moves beside the title only when there is room. `min-w-0` lets flex/grid children shrink; `break-words` handles long names. Keep complete class names in source so Tailwind can find them: use `grid-cols-1 md:grid-cols-2`, not `grid-cols-${count}`.

The app has large base heading sizes in [`globals.css`](../src/app/globals.css). Set explicit responsive heading utilities where a design needs smaller mobile text. Avoid fixed card widths, unbounded `whitespace-nowrap`, and hiding page overflow to mask a layout bug. Cap text and content width with `max-w-*`; do not stretch paragraphs across a wide monitor.

## Responsive grid examples

### Creator cards: one, two, then three columns

This complete example uses the same column progression as [`CreatorInfiniteScroll`](../src/components/sections/creator-infinite-scroll.tsx): one column below 768px, two from 768px, and three from 1024px.

```tsx
type CreatorPreview = { username: string; displayName: string; bio: string };

export function CreatorGrid({ creators }: { creators: CreatorPreview[] }) {
  return (
    <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator) => (
        <li key={creator.username} className="min-w-0 rounded-lg border border-border p-4">
          <h2 className="break-words text-xl font-semibold">{creator.displayName}</h2>
          <p className="mt-2 break-words text-base">{creator.bio}</p>
          <a
            href={`/creators/${encodeURIComponent(creator.username)}`}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-md px-3 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            View {creator.displayName}
          </a>
        </li>
      ))}
    </ul>
  );
}
```

Tailwind's column utilities use `minmax(0, 1fr)` so columns can shrink. Still set `min-w-0` on nested flex/grid children and allow text wrapping. Check empty results, loading skeletons, error messages, one card, and long creator names as well as a full grid.

### Content and sidebar

Keep the sidebar in the reading order and stack it below the content by default. Introduce a side column only at `lg:`:

```tsx
export function DashboardLayout() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section aria-labelledby="earnings-title" className="min-w-0">
        <h2 id="earnings-title" className="text-2xl font-semibold">
          Earnings
        </h2>
        <p className="mt-2">Your earnings summary goes here.</p>
      </section>
      <aside aria-labelledby="wallet-title" className="min-w-0">
        <h2 id="wallet-title" className="text-xl font-semibold">
          Wallet
        </h2>
        <p className="mt-2 break-words">Wallet status goes here.</p>
      </aside>
    </div>
  );
}
```

For filters that should precede results, put the filters first in the DOM, as the [creator discovery page](../src/app/%28app%29/creators/page.tsx) does. Do not use CSS `order` to create a visual order that disagrees with keyboard navigation.

### Open the working example

Open [`examples/responsive-layout.html`](examples/responsive-layout.html) directly in a browser. It needs no SDK, server, JavaScript, or external assets. It demonstrates both grids using the equivalent CSS media queries, long text wrapping, visible keyboard focus, and a native disclosure control. Resize the browser or use responsive mode; the disclosure is usable with mouse, touch, Enter, and Space.

This file is a layout learning fixture. Application markup should use the Tailwind utilities above and the shared [UI components](COMPONENT_GUIDE.md), so app themes and component behavior remain consistent. If the breakpoint policy changes, update the table, snippets, and HTML example together.

## Touch, keyboard, and mobile accessibility

- Aim for **44 by 44 CSS pixel** interactive targets, with space between adjacent actions. Use `min-h-[44px] min-w-[44px]` for compact controls. This is a usability target; [WCAG 2.2's minimum target-size criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) is 24 by 24 CSS pixels with specified exceptions, and needs a separate conformance review.
- Use buttons for actions and links for navigation. Give icon-only controls accessible names, visible `focus-visible` styling, and a usable focus order. Do not put a button inside a link.
- Important actions must work through click/tap and keyboard, not hover, swipe, or a long press alone. Provide visible buttons as alternatives to gestures. Keep native scrolling and pinch zoom; avoid global `touch-action: none` and broad touch-event `preventDefault()` handlers.
- Use the shared Radix-based modal for dialogs. Check focus trapping, Escape dismissal, focus return, scrollable content, and that the virtual keyboard does not cover the primary action. Keep input labels visible, use appropriate `inputMode`/`autoComplete`, and associate error text with `aria-describedby`.
- Test navigation at both sides of its `md:` boundary. When a menu opens, its trigger should expose `aria-expanded` and `aria-controls`; focus must remain predictable when it closes. See the existing [navigation](../src/components/layout/navigation.tsx) for the breakpoint, and verify semantics when changing it.
- Let text grow and wrap at 200% zoom. Check reflow at a 320px CSS viewport (or an equivalent 400% desktop zoom). For inherently wide tables/charts, use a locally scrollable, labelled region rather than horizontal scrolling on the entire page.
- Respect reduced motion. Use `motion-reduce:animate-none` / `motion-reduce:transition-none` where motion is added, and avoid essential information that exists only in an animation.
- Keep the device-width viewport and allow zoom. When adding edge-to-edge fixed controls, consider `env(safe-area-inset-bottom)` and test them with the keyboard and browser toolbars visible. Avoid fixed `100vh` assumptions for mobile dialogs; use a bounded scrollable area and test supported viewport-height units on target browsers.

## Mobile performance

Responsive CSS should not download a second UI or hide expensive work behind `hidden md:block`.

| Area                   | Practice                                                                                                                                                          | How to verify                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Images                 | Prefer `next/image` with dimensions or a sized `fill` parent, an accurate `sizes` value, and meaningful alt text. Only prioritize a genuine above-the-fold image. | Check transferred bytes, reserved space, and layout shifts at phone/tablet widths.   |
| Below-the-fold content | Lazy-load embeds and defer nonessential charts or wallet UI where practical; preserve space while loading.                                                        | Inspect network requests and main-thread work before scrolling or opening a feature. |
| JavaScript             | Prefer Server Components for static markup; keep client boundaries small and reuse existing query/cache hooks.                                                    | Compare the production route's bundle and hydration cost before/after.               |
| Data and lists         | Request paginated data and reuse the existing infinite-scroll patterns; a narrow view still needs bounded work.                                                   | Test slow network, empty pages, retry states, and long lists.                        |
| Motion and fonts       | Avoid continuous decorative animation and unnecessary font weights; reserve stable text/image space.                                                              | Check reduced motion, slow font loading, and layout shifts.                          |

Test a production build with DevTools network and CPU throttling, then repeat on a real lower-powered device. Record the device, browser, route, build, throttling settings, loading time, layout shifts, and interaction responsiveness. Treat emulator timings as comparisons under controlled settings, not proof of real-device performance. See the [PWA guide](PWA_GUIDE.md) for offline/cache behavior; do not duplicate caching logic in layout components.

## Testing workflow

### 1. Review the layout at boundaries

Use the offline example first, then test the affected application routes or Storybook stories. Use both portrait and landscape. Test below/at/above every breakpoint used by the changed component; for a `md:`/`lg:` grid this means 767/768/769 and 1023/1024/1025px, in addition to narrow and wide screens.

| View/state                        | Checks                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 320px, 375px, 390px               | No page-level horizontal overflow; readable titles; primary action visible; long wallet addresses wrap safely |
| 640px, 768px                      | Actions and navigation switch only when there is enough space; focus is not lost                              |
| 1024px, 1280px, 1536px            | Grid/sidebar changes fit; line lengths and containers remain capped                                           |
| Zoom and large text               | No overlapping content or clipped errors; reflow preserves reading and focus order                            |
| Keyboard/assistive technology     | Tab through links, menus, forms, and dialogs; check labels, visible focus, Escape, and announcements          |
| Loading, empty, error, success    | Layout reserves space, errors remain near controls, and retry/confirmation is reachable                       |
| Keyboard/toolbars open, landscape | No obscured submit button or inaccessible dialog content                                                      |

### 2. Add browser checks for changed behavior

CSS layout needs a real browser; a jsdom/happy-dom unit test cannot establish that a grid reflows correctly. The repository already has [Playwright configuration](../playwright.config.ts), [critical-flow tests](../e2e/critical-flows.spec.ts), and [visual tests](../e2e/visual-regression.spec.ts). Add coverage there when modifying app layouts. For example, adapt the selector to the affected page:

```ts
import { expect, test } from '@playwright/test';

for (const width of [320, 767, 768, 769, 1023, 1024, 1025, 1440]) {
  test(`creator discovery fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/creators');
    await expect(page.getByRole('heading', { name: 'Discover Creators' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });
}
```

Use deterministic SDK/API fixtures for loading/error/long-text cases before asserting layout. Add column-count and primary-action visibility assertions for the specific component; an overflow check alone does not prove the layout is correct. The snippet above is a starting point, not a claim that every existing route already passes these checks.

After the [SDK/frontend setup](../README.md#prerequisites), run the configured checks:

```bash
pnpm lint
pnpm type-check
pnpm test:run
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
```

Use [Storybook](STORYBOOK.md) for isolated component review and [the E2E README](../e2e/README.md) for test data and visual baseline procedures. Review changed screenshots; do not regenerate baselines merely to remove a failure.

### 3. Verify on real devices

At minimum, recommend an iPhone with Safari and an Android phone with Chrome; add an iPad/tablet and a lower-powered Android device for larger or performance-sensitive changes. Record exact OS/browser versions rather than assuming a viewport preset reproduces the hardware.

Test portrait/landscape, virtual keyboard opening, browser-toolbar resizing, pinch zoom, back navigation, long names, slow or interrupted networking, wallet connection/return, and tip confirmation. Use VoiceOver/TalkBack for the main controls. Connect Safari Web Inspector or Chrome remote debugging when needed. Use testnet accounts and test data for wallet/payment flows. Emulation complements this pass but cannot certify physical touch behavior, mobile Safari quirks, or wallet hand-offs.

In the PR, record the routes/stories, widths, states, browser/device versions, screenshots, checks, and remaining limitations. Clearly distinguish browser emulation from physical-device testing.
