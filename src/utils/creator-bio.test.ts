import { describe, expect, it } from 'vitest';
import { CREATOR_BIO_MAX_LENGTH, renderCreatorBio } from './creator-bio';

describe('renderCreatorBio', () => {
  it('renders markdown and links bare URLs', () => {
    const html = renderCreatorBio('**Support me** at https://example.com');

    expect(html).toContain('<strong>Support me</strong>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it('removes executable markup and unsafe links', () => {
    const html = renderCreatorBio('<script>alert(1)</script>[click](javascript:alert(1))');

    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('alert(1)');
  });

  it('limits rendered content to the bio character limit', () => {
    const html = renderCreatorBio('a'.repeat(CREATOR_BIO_MAX_LENGTH + 20));

    expect(html).toContain('a'.repeat(CREATOR_BIO_MAX_LENGTH));
    expect(html).not.toContain('a'.repeat(CREATOR_BIO_MAX_LENGTH + 1));
  });
});
