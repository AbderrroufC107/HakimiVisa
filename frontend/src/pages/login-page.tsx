import { useState } from 'react';
import { Navigate } from 'react-router';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/providers';
import { ROUTES } from '@/constants';
import type { LoginRequest } from '@/types';
import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.KANBAN} replace />;
  }

  const handleSubmit = async (data: LoginRequest) => {
    try {
      setError(null);
      await login(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('auth:invalidCredentials');
      setError(message);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-muted/50 p-4 outline-none">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/logo.png" alt="HakimiVisa" className="mx-auto h-24 w-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight" data-testid="login-heading">{t('auth:hakimiVisaServices')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('auth:visaManagement')}
          </p>
        </div>
        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </div>
    </main>
  );
}
