import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card', () => {
  it('renders its compound content and custom classes', () => {
    render(
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Creator details</CardDescription>
        </CardHeader>
        <CardContent>Bio content</CardContent>
        <CardFooter>Save action</CardFooter>
      </Card>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Creator details')).toBeInTheDocument();
    expect(screen.getByText('Bio content')).toBeInTheDocument();
    expect(screen.getByText('Save action')).toBeInTheDocument();
    expect(screen.getByText('Profile').closest('.custom-card')).toBeInTheDocument();
  });

  it('forwards semantic attributes to the card root', () => {
    render(<Card aria-label="Creator card">Content</Card>);

    expect(screen.getByRole('group', { name: 'Creator card' })).toBeInTheDocument();
  });
});
