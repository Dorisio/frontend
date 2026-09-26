import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children and forwards button props', () => {
    render(<Button aria-label="Save changes">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveTextContent('Save');
  });

  it('supports variants and sizes', () => {
    render(
      <Button variant="destructive" size="lg" className="custom-button">
        Delete
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive', 'h-11', 'custom-button');
  });

  it('calls onClick and respects disabled state', () => {
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Active</Button>
        <Button disabled onClick={onClick}>Disabled</Button>
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
