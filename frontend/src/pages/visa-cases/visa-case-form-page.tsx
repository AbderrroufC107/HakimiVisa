import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clientsService, visaCasesService, refDataService } from '@/services';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPassport, setNewClientPassport] = useState('');
  const [newClientPassportExpiry, setNewClientPassportExpiry] = useState('');
  const [newClientNationality, setNewClientNationality] = useState('');

  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');

  const [showAddVisaType, setShowAddVisaType] = useState(false);
  const [newVisaTypeName, setNewVisaTypeName] = useState('');

  const [countryInput, setCountryInput] = useState('');
  const [visaTypeInput, setVisaTypeInput] = useState('');

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsService.findAll({ limit: 200 }),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['ref-data', 'countries'],
    queryFn: () => refDataService.getCountries(),
  });

  const { data: visaTypes = [] } = useQuery({
    queryKey: ['ref-data', 'visa-types'],
    queryFn: () => refDataService.getVisaTypes(),
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
    watch,
    formState: { errors },
  } = useForm<VisaCaseFormData>({
    resolver: zodResolver(visaCaseSchema),
  });

  const watchedCountry = watch('visaCountry');
  const watchedVisaType = watch('visaType');

  useEffect(() => {
    if (watchedCountry !== undefined) setCountryInput(watchedCountry || '');
  }, [watchedCountry]);

  useEffect(() => {
    if (watchedVisaType !== undefined) setVisaTypeInput(watchedVisaType || '');
  }, [watchedVisaType]);

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
      setCountryInput(vc.visaCountry);
      setVisaTypeInput(vc.visaType);
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

  const addClientMutation = useMutation({
    mutationFn: (data: { fullName: string; phoneNumber: string; passportNumber?: string; passportExpiry?: string; nationality?: string }) =>
      clientsService.create(data),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'all'] });
      toast.success(t('clients:clientCreated'));
      setValue('clientId', newClient.id);
      setShowAddClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientPassport('');
      setNewClientPassportExpiry('');
      setNewClientNationality('');
    },
    onError: () => {
      toast.error(t('clients:createFailed'));
    },
  });

  const addCountryMutation = useMutation({
    mutationFn: (name: string) => refDataService.addCountry(name),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ref-data', 'countries'] });
      toast.success(t('visaCases:countryAdded'));
      setCountryInput(variables);
      setValue('visaCountry', variables, { shouldValidate: true });
      setShowAddCountry(false);
      setNewCountryName('');
    },
    onError: () => {
      toast.error(t('visaCases:addCountryFailed'));
    },
  });

  const addVisaTypeMutation = useMutation({
    mutationFn: (name: string) => refDataService.addVisaType(name),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ref-data', 'visa-types'] });
      toast.success(t('visaCases:visaTypeAdded'));
      setVisaTypeInput(variables);
      setValue('visaType', variables, { shouldValidate: true });
      setShowAddVisaType(false);
      setNewVisaTypeName('');
    },
    onError: () => {
      toast.error(t('visaCases:addVisaTypeFailed'));
    },
  });

  const onSubmit = (data: VisaCaseFormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== ''),
    );
    mutation.mutate(cleaned as VisaCaseFormData);
  };

  const handleCountryChange = (value: string) => {
    setCountryInput(value);
    setValue('visaCountry', value, { shouldValidate: true });
  };

  const handleVisaTypeChange = (value: string) => {
    setVisaTypeInput(value);
    setValue('visaType', value, { shouldValidate: true });
  };

  const filteredCountries = countryInput
    ? countries.filter((c) => c.toLowerCase().includes(countryInput.toLowerCase()))
    : countries;

  const filteredVisaTypes = visaTypeInput
    ? visaTypes.filter((v) => v.toLowerCase().includes(visaTypeInput.toLowerCase()))
    : visaTypes;

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
              <div className="flex items-center justify-between">
                <Label htmlFor="clientId">
                  {t('clients:client')} <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAddClient(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t('visaCases:addClient')}
                </Button>
              </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="visaCountry">
                    {t('visaCases:destinationCountry')} <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAddCountry(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t('visaCases:addCountry')}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    id="visaCountry"
                    type="text"
                    list="countries-list"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={countryInput}
                    onChange={(e) => handleCountryChange(e.target.value)}
                  />
                  <datalist id="countries-list">
                    {filteredCountries.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                {errors.visaCountry && (
                  <p className="text-xs text-destructive">{errors.visaCountry.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="visaType">
                    {t('visaCases:visaType')} <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAddVisaType(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t('visaCases:addVisaType')}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    id="visaType"
                    type="text"
                    list="visa-types-list"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={visaTypeInput}
                    onChange={(e) => handleVisaTypeChange(e.target.value)}
                  />
                  <datalist id="visa-types-list">
                    {filteredVisaTypes.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
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

      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('visaCases:addClient')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('clients:fullName')} <span className="text-destructive">*</span></Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clients:phoneNumber')} <span className="text-destructive">*</span></Label>
              <Input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clients:passportNumber')}</Label>
              <Input
                value={newClientPassport}
                onChange={(e) => setNewClientPassport(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('visaCases:passportExpiry')}</Label>
              <Input
                type="date"
                value={newClientPassportExpiry}
                onChange={(e) => setNewClientPassportExpiry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clients:nationality')}</Label>
              <Input
                value={newClientNationality}
                onChange={(e) => setNewClientNationality(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClient(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={() => {
              if (!newClientName || !newClientPhone) {
                toast.error(t('validation:clientRequired'));
                return;
              }
              addClientMutation.mutate({
                fullName: newClientName,
                phoneNumber: newClientPhone,
                passportNumber: newClientPassport || undefined,
                passportExpiry: newClientPassportExpiry || undefined,
                nationality: newClientNationality || undefined,
              });
            }} disabled={addClientMutation.isPending}>
              {addClientMutation.isPending ? t('common:creating') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCountry} onOpenChange={setShowAddCountry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('visaCases:addCountry')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('visaCases:destinationCountry')} <span className="text-destructive">*</span></Label>
              <Input
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                placeholder={t('visaCases:countryPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCountry(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={() => {
              if (!newCountryName.trim()) {
                toast.error(t('validation:countryRequired'));
                return;
              }
              addCountryMutation.mutate(newCountryName.trim());
            }} disabled={addCountryMutation.isPending}>
              {addCountryMutation.isPending ? t('common:creating') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddVisaType} onOpenChange={setShowAddVisaType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('visaCases:addVisaType')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('visaCases:visaType')} <span className="text-destructive">*</span></Label>
              <Input
                value={newVisaTypeName}
                onChange={(e) => setNewVisaTypeName(e.target.value)}
                placeholder={t('visaCases:visaTypePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisaType(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={() => {
              if (!newVisaTypeName.trim()) {
                toast.error(t('validation:visaTypeRequired'));
                return;
              }
              addVisaTypeMutation.mutate(newVisaTypeName.trim());
            }} disabled={addVisaTypeMutation.isPending}>
              {addVisaTypeMutation.isPending ? t('common:creating') : t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
