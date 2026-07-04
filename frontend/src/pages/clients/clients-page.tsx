import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { clientsService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/shared/badge';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useTranslation } from 'react-i18next';
import type { Client } from '@/types';

export function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, page }],
    queryFn: () => clientsService.findAll({ search, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('clients:clientDeleted'));
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t('clients:deleteFailed'));
    },
  });

  const clients = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Client>[] = [
    {
      header: t('clients:fullName'),
      accessor: (c) => (
        <span className="font-medium">{c.fullName}</span>
      ),
    },
    {
      header: t('clients:phone'),
      accessor: (c) => c.phoneNumber,
    },
    {
      header: t('clients:passportNumber'),
      accessor: (c) => c.passportNumber ?? '—',
    },
    {
      header: t('clients:nationality'),
      accessor: (c) => c.nationality ?? '—',
    },
    {
      header: t('clients:visaCases'),
      accessor: (c) => (
        <Badge className="bg-primary/10 text-primary">
          {c._count?.visaCases ?? 0}
        </Badge>
      ),
    },
    {
      header: '',
      accessor: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('clients:edit')} ${c.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.CLIENTS_DETAIL(c.id));
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common:delete')} ${c.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(c.id);
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('nav:clients')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('clients:subtitle')}
          </p>
        </div>
        <Button data-testid="add-client-button" onClick={() => navigate(ROUTES.CLIENTS_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('clients:addClient')}
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder={t('clients:searchClient')}
      />

      {!isLoading && clients.length === 0 && !search ? (
        <EmptyState
          icon={Users}
          title={t('clients:noClientsFound')}
          description={t('clients:tryModifySearch')}
          actionLabel={t('clients:addClient')}
          onAction={() => navigate(ROUTES.CLIENTS_NEW)}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={clients}
            isLoading={isLoading}
            keyExtractor={(c) => c.id}
            onRowClick={(c) => navigate(ROUTES.CLIENTS_DETAIL(c.id))}
          />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        title={t('common:delete')}
        description={t('clients:deleteWarning')}
      />
    </div>
  );
}
