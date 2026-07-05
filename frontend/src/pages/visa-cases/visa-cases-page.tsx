import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { visaCasesService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/shared/badge';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { BulkActionToolbar } from '@/components/bulk/bulk-action-toolbar';
import { VISA_STATUS_COLORS } from '@/types';
import type { VisaCase } from '@/types';

export function VisaCasesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['visa-cases', { search, page }],
    queryFn: () => visaCasesService.findAll({ search, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => visaCasesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      toast.success(t('visaCases:caseDeleted'));
      setDeleteId(null);
    },
    onError: () => toast.error(t('visaCases:deleteFailed')),
  });

  const cases = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
    setSelectedIds(new Set());
  }, [queryClient]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  }, []);

  const columns: Column<VisaCase>[] = [
    {
      header: t('visaCases:caseNumber'),
      accessor: (vc) => (
        <span className="font-mono text-xs font-medium">{vc.caseNumber}</span>
      ),
    },
    {
      header: t('clients:client'),
      accessor: (vc) => vc.client?.fullName ?? '—',
    },
    {
      header: t('visaCases:country'),
      accessor: (vc) => vc.visaCountry,
    },
    {
      header: t('visaCases:visaType'),
      accessor: (vc) => vc.visaType,
    },
    {
      header: t('common:status'),
      accessor: (vc) => (
        <Badge className={VISA_STATUS_COLORS[vc.currentStatus]}>
          {t('status:' + vc.currentStatus)}
        </Badge>
      ),
    },
    {
      header: t('common:createdAt'),
      accessor: (vc) =>
        new Date(vc.createdAt).toLocaleDateString(),
    },
    {
      header: '',
      accessor: (vc) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('kanban:viewCase', { caseNumber: vc.caseNumber })}
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.VISA_CASES_DETAIL(vc.id));
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('kanban:deleteCase', { caseNumber: vc.caseNumber })}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(vc.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('nav:visaCases')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('visaCases:subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.VISA_CASES_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('visaCases:newCase')}
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder={t('visaCases:searchPlaceholder')}
      />

      <BulkActionToolbar
        selectedIds={Array.from(selectedIds)}
        onClearSelection={() => setSelectedIds(new Set())}
        onRefresh={handleRefresh}
      />

      {!isLoading && cases.length === 0 && !search ? (
        <EmptyState
          icon={FileText}
          title={t('visaCases:noCases')}
          description={t('visaCases:noCasesDesc')}
          actionLabel={t('visaCases:newCase')}
          onAction={() => navigate(ROUTES.VISA_CASES_NEW)}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={cases}
            isLoading={isLoading}
            keyExtractor={(vc) => vc.id}
            onRowClick={(vc) => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        title={t('visaCases:deleteCase')}
        description={t('visaCases:deleteWarning')}
      />
    </div>
  );
}
