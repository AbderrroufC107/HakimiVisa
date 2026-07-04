import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t('auth:validEmailRequired')),
    password: z.string().min(1, t('auth:passwordRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold" data-testid="login-welcome">{t('auth:welcomeBack')}</CardTitle>
        <CardDescription>
          {t('auth:signInToAccount')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth:emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth:password')}</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder={t('auth:passwordPlaceholder')}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth:signingIn') : t('auth:signIn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
