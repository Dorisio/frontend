import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/button';

// Example component test for mutation testing
describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('destructive'); // This would need actual implementation
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('has correct accessibility attributes', () => {
    render(
      <Button aria-label="Close dialog" aria-describedby="close-help">
        ×
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('Close dialog');
    expect(button).toHaveAttribute('aria-describedby', 'close-help');
  });

  // Edge cases that mutation testing will help identify
  test('handles undefined onClick gracefully', () => {
    render(<Button onClick={undefined}>No handler</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Should not throw when clicked without handler
  });

  test('handles empty children', () => {
    render(<Button></Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });
});