import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '@/pages/login-page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLogin = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/providers', async () => {
  const actual = await vi.importActual<typeof import('@/providers')>('@/providers');
  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  it('renders login form with branding', () => {
    render(<LoginPage />);
    expect(screen.getByText('Hakimi Visa')).toBeInTheDocument();
    expect(screen.getByText('Visa Management Solutions')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument();
  });

  it('does not render form when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN', isActive: true },
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
    });
    render(<LoginPage />);
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('calls login on form submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Sign in/ }));

    expect(mockLogin).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'secret123' });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /Sign in/ }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('handles API error and displays error message', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'wrong@test.com');
    await user.type(screen.getByLabelText('Password'), 'bad');
    await user.click(screen.getByRole('button', { name: /Sign in/ }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('handles API error with non-Error type gracefully', async () => {
    mockLogin.mockRejectedValue('Network failure');
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign in/ }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});
