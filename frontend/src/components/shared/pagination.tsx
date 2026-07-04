import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4" data-testid="pagination">
      <p className="text-sm text-muted-foreground" data-testid="pagination-total">
        {t('table:totalResults', { total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t('table:previousPage')}
          data-testid="pagination-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="pagination-current">
          {t('table:pageXofY', { page, totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={t('table:nextPage')}
          data-testid="pagination-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
