import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreatorBioEditor } from './creator-bio';

describe('CreatorBioEditor', () => {
  it('shows a live formatted preview and character count', () => {
    render(<CreatorBioEditor value="**Hello**" onChange={() => undefined} />);

    expect(screen.getByLabelText('Bio preview')).toContainHTML('<strong>Hello</strong>');
    expect(screen.getByText('9/500')).toBeInTheDocument();
  });

  it('enforces the 500 character limit', () => {
    let value = '';
    const { rerender } = render(
      <CreatorBioEditor value={value} onChange={(nextValue) => { value = nextValue; }} />
    );
    const textarea = screen.getByLabelText('Creator bio');

    fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
    rerender(<CreatorBioEditor value={value} onChange={(nextValue) => { value = nextValue; }} />);

    expect(value).toHaveLength(500);
    expect(textarea).toHaveAttribute('maxLength', '500');
  });
});
