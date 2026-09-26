import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

describe('analytics bundle splitting', () => {
  it('loads chart components through Next dynamic imports', () => {
    const pagePath = fileURLToPath(new URL('./page.tsx', import.meta.url));
    const source = readFileSync(path.resolve(pagePath), 'utf8');

    expect(source).toContain("import dynamic from 'next/dynamic'");
    expect(source).toContain("import('@/components/sections/earnings-trend-chart')");
    expect(source).toContain("import('@/components/sections/tip-source-breakdown')");
    expect(source).toContain('ssr: false');
  });

  it('keeps auth validation libraries in dynamically loaded route components', () => {
    const signInPage = readFileSync(
      path.resolve(fileURLToPath(new URL('../../../../auth/signin/page.tsx', import.meta.url))),
      'utf8'
    );
    const signUpPage = readFileSync(
      path.resolve(fileURLToPath(new URL('../../../../auth/signup/page.tsx', import.meta.url))),
      'utf8'
    );

    expect(signInPage).toContain("import('@/components/auth/signin-form')");
    expect(signUpPage).toContain("import('@/components/auth/signup-form')");
    expect(signInPage).toContain('ssr: false');
    expect(signUpPage).toContain('ssr: false');
  });
});
