import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { KanbanFilters as KanbanFiltersType } from '@/types';

interface KanbanFiltersProps {
  filters: KanbanFiltersType;
  onChange: (filters: KanbanFiltersType) => void;
}

export const KanbanFilters = memo(function KanbanFilters({
  filters,
  onChange,
}: KanbanFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    filters.search || filters.country || filters.type || filters.dateFrom || filters.dateTo;

  const clearFilters = () => {
    onChange({ search: '', country: '', type: '', dateFrom: '', dateTo: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="kanban-search"
          aria-label={t('kanban:searchPlaceholder')}
          placeholder={t('kanban:searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <Input
        data-testid="kanban-country-filter"
        aria-label={t('kanban:countryFilter')}
        placeholder={t('kanban:countryFilter')}
        value={filters.country}
        onChange={(e) => onChange({ ...filters, country: e.target.value })}
        className="w-32 h-9 text-sm"
      />

      <Input
        data-testid="kanban-visa-type-filter"
        aria-label={t('kanban:visaTypeFilter')}
        placeholder={t('kanban:visaTypeFilter')}
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="w-32 h-9 text-sm"
      />

      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="w-36 h-9 text-sm"
        title={t('kanban:dateFrom')}
      />

      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="w-36 h-9 text-sm"
        title={t('kanban:dateTo')}
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          {t('kanban:clearFilters')}
        </Button>
      )}
    </div>
  );
});
