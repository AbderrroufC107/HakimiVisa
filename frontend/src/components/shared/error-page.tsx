import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

interface ErrorPageProps {
  title?: string;
  description?: string;
  statusCode?: number;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorPage({
  title: titleProp,
  description: descriptionProp,
  statusCode,
  onRetry,
  fullPage = true,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const title = titleProp ?? t('dialog:errorOccurred');
  const description = descriptionProp ?? t('dialog:unexpectedError');

  const content = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl bg-destructive/10 p-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      {statusCode && (
        <p className="mt-4 text-sm font-semibold text-destructive">{statusCode}</p>
      )}
      <h2 className="mt-2 text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('dialog:goBack')}
        </Button>
        <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD)}>
          <Home className="mr-1.5 h-4 w-4" />
          {t('dialog:dashboard')}
        </Button>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            {t('dialog:tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg">{content}</div>
      </div>
    );
  }

  return content;
}
