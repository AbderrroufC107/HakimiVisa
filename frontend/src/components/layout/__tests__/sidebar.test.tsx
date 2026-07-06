import { render, screen } from '@/test/test-utils';
import { Sidebar } from '@/components/layout/sidebar';
import { describe, it, expect, vi } from 'vitest';

describe('Sidebar', () => {
  it('renders all main navigation links when expanded', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Visa Cases')).toBeInTheDocument();
    expect(screen.getByText('Case Tracking')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });

  it('renders all secondary navigation links when expanded', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('PDF Printing')).toBeInTheDocument();
    expect(screen.getByText('Tracking Portal')).toBeInTheDocument();
    expect(screen.getByText('Backup Center')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows section headers when expanded', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('shows brand name when expanded', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByText('HakimiVisa')).toBeInTheDocument();
  });

  it('hides text labels when collapsed', () => {
    render(<Sidebar collapsed={true} onToggle={vi.fn()} />);
    expect(screen.queryByText('HakimiVisa')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Main')).not.toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });

  it('renders NavLink elements for each route', () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/clients');
    expect(hrefs).toContain('/visa-cases');
    expect(hrefs).toContain('/kanban');
    expect(hrefs).toContain('/appointments');
  });

  it('calls onToggle when toggle button clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar collapsed={false} onToggle={onToggle} />);
    const toggleBtn = screen.getByRole('button', { name: 'Collapse menu' });
    await user.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
