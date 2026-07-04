import { useState, useMemo, type ReactNode, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Search, X, Columns3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id?: string;
  header: string;
  accessor: (item: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  filterable?: boolean;
  filterValue?: (item: T) => string;
  className?: string;
  headerClassName?: string;
  hideable?: boolean;
  hidden?: boolean;
  width?: string;
}

export interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  action: (selected: T[]) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  stickyHeader?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkActions?: BulkAction<T>[];
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onExport?: () => void;
  loadingSkeleton?: ReactNode;
  maxHeight?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  keyExtractor,
  onRowClick,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  searchable,
  searchPlaceholder: searchPlaceholderProp,
  onSearch,
  searchQuery = '',
  stickyHeader,
  selectable,
  selectedIds = new Set(),
  onSelectionChange,
  bulkActions,
  emptyIcon,
  emptyTitle: emptyTitleProp,
  emptyDescription: emptyDescriptionProp,
  onExport,
  maxHeight,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const searchPlaceholder = searchPlaceholderProp ?? t('table:search');
  const emptyTitle = emptyTitleProp ?? t('table:noData');
  const emptyDescription = emptyDescriptionProp ?? t('table:noRecords');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const lastClickedRef = useRef<number | null>(null);

  const columnsWithIds = useMemo(
    () => columns.map((col) => ({ ...col, id: col.id ?? col.header.toLowerCase().replace(/\s+/g, '-') } as Column<T> & { id: string })),
    [columns],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    columnsWithIds.forEach((col) => { vis[col.id] = !col.hidden; });
    return vis;
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const visibleColumns = useMemo(
    () => columnsWithIds.filter((col) => columnVisibility[col.id] !== false),
    [columnsWithIds, columnVisibility],
  );

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const col = columnsWithIds.find((c) => c.id === sortColumn);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const handleSort = useCallback((colId: string) => {
    setSortColumn((prev) => {
      if (prev === colId) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return colId;
      }
      setSortDirection('asc');
      return colId;
    });
  }, []);

  const toggleColumn = useCallback((colId: string | undefined) => {
    if (!colId) return;
    setColumnVisibility((prev) => ({ ...prev, [colId]: !prev[colId] }));
  }, []);

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selectedIds.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((item) => keyExtractor(item))));
    }
  }, [data, selectedIds, onSelectionChange, keyExtractor]);

  const toggleItem = useCallback(
    (id: string, shiftKey?: boolean) => {
      if (!onSelectionChange) return;
      if (shiftKey && lastClickedRef.current !== null) {
        const currentIndex = sortedData.findIndex((item) => keyExtractor(item) === id);
        if (currentIndex !== -1) {
          const start = Math.min(lastClickedRef.current, currentIndex);
          const end = Math.max(lastClickedRef.current, currentIndex);
          const next = new Set(selectedIds);
          for (let i = start; i <= end; i++) {
            const item = sortedData[i];
            if (item) next.add(keyExtractor(item));
          }
          onSelectionChange(next);
          return;
        }
      }
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      lastClickedRef.current = sortedData.findIndex((item) => keyExtractor(item) === id);
      onSelectionChange(next);
      return;
    },
    [selectedIds, onSelectionChange, keyExtractor, sortedData],
  );

  const hasSelected = selectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {(searchable || bulkActions || onExport) && (
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="pl-9 pr-9 h-9"
                aria-label={searchPlaceholder}
              />
              {localSearch && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setLocalSearch(''); onSearch?.(''); }}
                  aria-label={t('table:clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {hasSelected && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t('table:selected', { count: selectedIds.size })}
              </span>
              {bulkActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant ?? 'outline'}
                  size="sm"
                  onClick={() => action.action(data.filter((item) => selectedIds.has(keyExtractor(item))))}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="mr-1.5 h-4 w-4" />
                {t('table:export')}
              </Button>
            )}
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowColumnMenu(!showColumnMenu)}>
                <Columns3 className="mr-1.5 h-4 w-4" />
                {t('table:columns')}
              </Button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-2 shadow-lg z-50">
                  {columnsWithIds.filter((c) => c.hideable !== false).map((col) => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.id] !== false}
                        onChange={() => toggleColumn(col.id)}
                        className="rounded border-input"
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={cn('rounded-xl border bg-card overflow-hidden', maxHeight && 'max-h-[75vh]')}>
        <div className={cn('overflow-x-auto scrollbar-thin', maxHeight && 'overflow-y-auto')} style={{ maxHeight }}>
            <table className="w-full text-left text-sm" role="grid" data-testid="data-table">
            <thead>
              <tr className={cn('border-b bg-muted/50', stickyHeader && 'sticky top-0 z-10')}>
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      aria-label={t('table:selectAll')}
                    />
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      'px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.headerClassName,
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.id)}
                    aria-sort={
                      sortColumn === col.id
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span className="inline-flex shrink-0">
                          {sortColumn === col.id ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-foreground" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                      <div className="rounded-2xl bg-muted/50 p-4 ring-1 ring-border/50">
                        {emptyIcon ?? <Search className="h-8 w-8 text-muted-foreground/60" />}
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-foreground">{emptyTitle}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      data-testid="data-table-row"
                      data-row-id={id}
                      className={cn(
                          'border-b transition-colors',
                          onRowClick && 'cursor-pointer',
                          isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50',
                        )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleItem(id, e.nativeEvent instanceof MouseEvent && (e.nativeEvent as MouseEvent).shiftKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-input"
                            aria-label={t('table:selectRow', { id })}
                          />
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.id}
                          className={cn('px-4 py-3', col.className)}
                        >
                          {col.accessor(item)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {t('table:totalResults', { total })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label={t('table:previousPage')}
            >
              {t('common:previous')}
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[2rem]"
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label={t('table:nextPage')}
            >
              {t('common:next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
