import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('UI Components', () => {
  describe('Button', () => {
    it('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies variant classes', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('applies size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });

    it('shows loading state', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toContainHTML('svg');
    });
  });

  describe('Input', () => {
    it('renders input with label', () => {
      render(<Input label="Email" placeholder="you@example.com" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });

    it('shows hint message', () => {
      render(<Input label="Email" hint="Enter your email" />);
      expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders card with header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(screen.getByText(/title/i)).toBeInTheDocument();
      expect(screen.getByText(/content/i)).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with variant', () => {
      render(<Badge variant="success">Success</Badge>);
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/success/i).parentElement).toHaveClass('bg-success-500');
    });

    it('renders badge with default variant', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText(/default/i)).toBeInTheDocument();
    });
  });
});

describe('Utility Functions', () => {
  describe('cn', () => {
    it('joins class names', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('handles conditional classes', () => {
      expect(cn('a', true && 'b', false && 'c')).toBe('a b');
    });

    it('handles null/undefined', () => {
      expect(cn('a', null, undefined, 'b')).toBe('a b');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'en-US', { dateStyle: 'short' })).toBe('1/15/24');
    });
  });

  describe('formatNumber', () => {
    it('formats number with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1000, 'EUR', 'de-DE')).toBe('1.000 €');
    });
  });

  describe('slugify', () => {
    it('creates slug from text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test@#$%Campaign')).toBe('testcampaign');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });
  });
});