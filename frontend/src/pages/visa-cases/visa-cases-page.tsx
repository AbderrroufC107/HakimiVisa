import { useState, useCallback, useMemo } from 'react';
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
import { VISA_STATUS_COLORS, type VisaStatus } from '@/types';
import type { VisaCase } from '@/types';

const STATUS_TABS: { label: string; value: VisaStatus | 'ALL' | 'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID' }[] = [
  { label: 'Tous', value: 'ALL' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'En traitement', value: 'EN_TRAITEMENT' },
  { label: 'RDV OK', value: 'RDV_OK' },
  { label: 'Visa OK', value: 'VISA_OK' },
  { label: 'Visa Refusée', value: 'VISA_REFUSEE' },
  { label: 'Livrée', value: 'LIVREE' },
];

const LIVREE_SUB_TABS: { label: string; value: 'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID' }[] = [
  { label: 'Tous', value: 'LIVREE' },
  { label: 'Payée', value: 'LIVREE_PAID' },
  { label: 'Non Payée', value: 'LIVREE_UNPAID' },
];

export function VisaCasesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<VisaStatus | 'ALL' | 'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID'>('ALL');
  const [livreeSubTab, setLivreeSubTab] = useState<'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID'>('LIVREE');

  const isLivreeMainTab = activeTab === 'LIVREE';
  const effectiveStatus = isLivreeMainTab ? (livreeSubTab === 'LIVREE' ? 'LIVREE' : undefined) : (activeTab === 'ALL' ? undefined : activeTab as VisaStatus);

  const { data, isLoading } = useQuery({
    queryKey: ['visa-cases', { search, page, status: effectiveStatus }],
    queryFn: () => visaCasesService.findAll({ search, page, limit: 20, status: effectiveStatus }),
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

  const allCases = data?.data ?? [];
  const meta = data?.meta;

  const cases = useMemo(() => {
    if (isLivreeMainTab && livreeSubTab !== 'LIVREE') {
      return allCases.filter((c) => livreeSubTab === 'LIVREE_PAID' ? c.isPaid : !c.isPaid);
    }
    return allCases;
  }, [allCases, isLivreeMainTab, livreeSubTab]);

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

  const handleTabChange = useCallback((tab: VisaStatus | 'ALL' | 'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID') => {
    if (tab === 'LIVREE') {
      setActiveTab('LIVREE');
      setLivreeSubTab('LIVREE');
    } else {
      setActiveTab(tab);
    }
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleLivreeSubTabChange = useCallback((subTab: 'LIVREE' | 'LIVREE_PAID' | 'LIVREE_UNPAID') => {
    setLivreeSubTab(subTab);
    setPage(1);
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
      </div>

      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder={t('visaCases:searchPlaceholder')}
        />
        <Button onClick={() => navigate(ROUTES.VISA_CASES_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('visaCases:newCase')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLivreeMainTab && (
        <div className="flex gap-2">
          {LIVREE_SUB_TABS.map((subTab) => (
            <Button
              key={subTab.value}
              variant={livreeSubTab === subTab.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleLivreeSubTabChange(subTab.value)}
            >
              {subTab.label}
            </Button>
          ))}
        </div>
      )}

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
