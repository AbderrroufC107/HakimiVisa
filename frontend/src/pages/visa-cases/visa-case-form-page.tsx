import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clientsService, visaCasesService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const getValidationSchema = (t: (key: string) => string) =>
  z.object({
    clientId: z.string().min(1, t('validation:clientRequired')),
    visaCountry: z.string().min(1, t('validation:countryRequired')).max(100),
    visaType: z.string().min(1, t('validation:visaTypeRequired')).max(100),
    notes: z.string().max(2000).optional().or(z.literal('')),
  });

type VisaCaseFormData = z.infer<ReturnType<typeof getValidationSchema>>;

export function VisaCaseFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isEditing = !!id;

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsService.findAll({ limit: 200 }),
  });

  const { data: existing } = useQuery({
    queryKey: ['visa-case', id],
    queryFn: () => visaCasesService.findOne(id!),
    enabled: isEditing,
  });

  const visaCaseSchema = getValidationSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VisaCaseFormData>({
    resolver: zodResolver(visaCaseSchema),
  });

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId) {
      setValue('clientId', clientId);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    if (existing) {
      const vc = existing;
      reset({
        clientId: vc.clientId,
        visaCountry: vc.visaCountry,
        visaType: vc.visaType,
        notes: vc.notes ?? '',
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: VisaCaseFormData) =>
      isEditing
        ? visaCasesService.update(id!, data)
        : visaCasesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast.success(t(isEditing ? 'visaCases:caseUpdated' : 'visaCases:caseCreated'));
      navigate(ROUTES.VISA_CASES);
    },
    onError: () => {
      toast.error(t(isEditing ? 'visaCases:updateFailed' : 'visaCases:createFailed'));
    },
  });

  const onSubmit = (data: VisaCaseFormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== ''),
    );
    mutation.mutate(cleaned as VisaCaseFormData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.VISA_CASES)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {isEditing ? t('visaCases:editCase') : t('visaCases:newCase')}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('visaCases:generalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">
                {t('clients:client')} <span className="text-destructive">*</span>
              </Label>
              <select
                id="clientId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                {...register('clientId')}
              >
                <option value="">{t('visaCases:selectClient')}</option>
                {clientsData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.phoneNumber}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-xs text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visaCountry">
                  {t('visaCases:destinationCountry')} <span className="text-destructive">*</span>
                </Label>
                <Input id="visaCountry" {...register('visaCountry')} />
                {errors.visaCountry && (
                  <p className="text-xs text-destructive">{errors.visaCountry.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="visaType">
                  {t('visaCases:visaType')} <span className="text-destructive">*</span>
                </Label>
                <Input id="visaType" {...register('visaType')} />
                {errors.visaType && (
                  <p className="text-xs text-destructive">{errors.visaType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('common:notes')}</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.VISA_CASES)}>
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('common:saving') : t('common:save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
