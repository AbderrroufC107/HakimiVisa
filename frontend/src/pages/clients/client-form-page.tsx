import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { clientsService } from '@/services';
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
import { useTranslation } from 'react-i18next';

export function ClientFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const clientSchema = z.object({
    fullName: z.string().min(1, t('validation:lastNameRequired')).max(200),
    phoneNumber: z.string().min(1, t('validation:phoneRequired')).max(20),
    whatsappNumber: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email(t('validation:emailRequired')).max(200).optional().or(z.literal('')),
    passportNumber: z.string().max(50).optional().or(z.literal('')),
    nationality: z.string().max(100).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  });

  type ClientFormData = z.infer<typeof clientSchema>;

  const { data: existing } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.findOne(id!),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (existing) {
      const c = existing;
      reset({
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        whatsappNumber: c.whatsappNumber ?? '',
        email: c.email ?? '',
        passportNumber: c.passportNumber ?? '',
        nationality: c.nationality ?? '',
        notes: c.notes ?? '',
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      isEditing
        ? clientsService.update(id!, data)
        : clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t(isEditing ? 'clients:clientUpdated' : 'clients:clientCreated'));
      navigate(ROUTES.CLIENTS);
    },
    onError: () => {
      toast.error(t(isEditing ? 'clients:updateFailed' : 'clients:createFailed'));
    },
  });

  const onSubmit = (data: ClientFormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== ''),
    );
    mutation.mutate(cleaned as ClientFormData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.CLIENTS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {isEditing ? t('clients:editClient') : t('clients:addClient')}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('clients:clientInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {t('clients:lastName')} <span className="text-destructive">*</span>
                </Label>
                <Input id="fullName" {...register('fullName')} />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  {t('clients:phone')} <span className="text-destructive">*</span>
                </Label>
                <Input id="phoneNumber" {...register('phoneNumber')} />
                {errors.phoneNumber && (
                  <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">{t('clients:whatsappNumber')}</Label>
                <Input id="whatsappNumber" {...register('whatsappNumber')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('clients:email')}</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="passportNumber">{t('clients:passportNumber')}</Label>
                <Input id="passportNumber" {...register('passportNumber')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">{t('clients:nationality')}</Label>
                <Input id="nationality" {...register('nationality')} />
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
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.CLIENTS)}>
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? t('common:saving')
                  : isEditing
                    ? t('clients:editClient')
                    : t('clients:addClient')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
