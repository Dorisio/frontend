import { describe, expect, it } from 'vitest';
import { resolveFeatureFlag } from './feature-flags';

describe('resolveFeatureFlag', () => {
  it('uses the fallback when the service has no decision', () => {
    expect(resolveFeatureFlag(undefined, false)).toBe(false);
    expect(resolveFeatureFlag(null, true)).toBe(true);
  });

  it('preserves boolean rollout decisions and string experiment variants', () => {
    expect(resolveFeatureFlag(true, false)).toBe(true);
    expect(resolveFeatureFlag(false, true)).toBe(false);
    expect(resolveFeatureFlag('variant-b', 'control')).toBe('variant-b');
  });
});
