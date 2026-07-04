import { render, screen } from '@/test/test-utils';
import { EmptyState } from '@/components/shared/empty-state';
import { describe, it, expect, vi } from 'vitest';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="There is nothing here yet." />);
    expect(screen.getByText('There is nothing here yet.')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(<EmptyState title="Empty" actionLabel="Add item" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: 'Add item' });
    expect(btn).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState title="Empty" actionLabel="Go" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not render button when actionLabel missing', () => {
    render(<EmptyState title="Empty" onAction={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
