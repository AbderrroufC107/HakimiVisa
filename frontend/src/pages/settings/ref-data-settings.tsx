import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { refDataService, type RefDataItem } from '@/services/ref-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Globe, FileText, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import type { ApiError } from '@/types';

interface RefDataListProps {
  title: string;
  icon: typeof Globe;
  queryKey: string[];
  fetchAll: () => Promise<RefDataItem[]>;
  addItem: (name: string) => Promise<unknown>;
  updateItem: (id: string, name: string) => Promise<unknown>;
  removeItem: (id: string) => Promise<unknown>;
}

function RefDataList({ title, icon: Icon, queryKey, fetchAll, addItem, updateItem, removeItem }: RefDataListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<RefDataItem | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteItem, setDeleteItem] = useState<RefDataItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (name: string) => addItem(name),
    onSuccess: () => {
      invalidate();
      toast.success(t('settings:refDataAdded'));
      setShowAdd(false);
      setNewName('');
    },
    onError: (error) => toast.error((error as unknown as ApiError)?.message || t('settings:refDataAddError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateItem(id, name),
    onSuccess: () => {
      invalidate();
      toast.success(t('settings:refDataUpdated'));
      setEditItem(null);
    },
    onError: (error) => toast.error((error as unknown as ApiError)?.message || t('settings:refDataUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeItem(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('settings:refDataDeleted'));
      setDeleteItem(null);
    },
    onError: (error) => toast.error((error as unknown as ApiError)?.message || t('settings:refDataDeleteError')),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('common:add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('common:noData')}</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('common:edit')}
                    onClick={() => {
                      setEditItem(item);
                      setEditName(item.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label={t('common:delete')}
                    onClick={() => setDeleteItem(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings:refDataAdd')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>{t('settings:refDataName')}</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common:cancel')}</Button>
              <Button
                disabled={!newName.trim() || addMutation.isPending}
                onClick={() => addMutation.mutate(newName.trim())}
              >
                {addMutation.isPending ? t('common:creating') : t('common:create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings:refDataEdit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>{t('settings:refDataName')}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>{t('common:cancel')}</Button>
              <Button
                disabled={!editName.trim() || updateMutation.isPending}
                onClick={() => editItem && updateMutation.mutate({ id: editItem.id, name: editName.trim() })}
              >
                {updateMutation.isPending ? t('common:saving') : t('common:save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <ConfirmDeleteDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          onConfirm={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
          isLoading={deleteMutation.isPending}
          title={t('settings:refDataDeleteTitle')}
          description={t('settings:refDataDeleteWarning', { name: deleteItem?.name ?? '' })}
        />
      </CardContent>
    </Card>
  );
}

export function RefDataSettings() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RefDataList
        title={t('settings:countries')}
        icon={Globe}
        queryKey={['ref-data', 'countries-full']}
        fetchAll={() => refDataService.getCountriesFull()}
        addItem={(name) => refDataService.addCountry(name)}
        updateItem={(id, name) => refDataService.updateCountry(id, name)}
        removeItem={(id) => refDataService.removeCountry(id)}
      />
      <RefDataList
        title={t('settings:visaTypes')}
        icon={FileText}
        queryKey={['ref-data', 'visa-types-full']}
        fetchAll={() => refDataService.getVisaTypesFull()}
        addItem={(name) => refDataService.addVisaType(name)}
        updateItem={(id, name) => refDataService.updateVisaType(id, name)}
        removeItem={(id) => refDataService.removeVisaType(id)}
      />
    </div>
  );
}
