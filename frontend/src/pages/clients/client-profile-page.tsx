import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  Globe,
  FileText,
  MessageCircle,
  Copy,
  ExternalLink,
  Clock,
  Calendar,
  User,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Upload,
  Download,
  File,
} from 'lucide-react';
import { clientsService, pdfService, filesService } from '@/services';
import type { ClientFile } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ClientProfile, ClientTimelineEvent, ClientStats, ClientNote, ClientDocument } from '@/types';
import type { VisaStatus } from '@/types';

function SecureImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('hakimi-token');
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.blob();
      })
      .then((blob) => setBlobUrl(URL.createObjectURL(blob)))
      .catch(() => setBlobUrl(null));

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!blobUrl) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded', className)}>
        <File className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const TIMELINE_EVENT_COLORS: Record<string, string> = {
  CLIENT_CREATED: 'bg-blue-500',
  STATUS_CHANGE: 'bg-amber-500',
  APPOINTMENT_ADDED: 'bg-purple-500',
  ENTITY_CREATED: 'bg-emerald-500',
  ENTITY_UPDATED: 'bg-sky-500',
  ENTITY_DELETED: 'bg-red-500',
};

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ClientProfilePage() {
  const { t, i18n } = useTranslation();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(t('common:copied')));
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'timeline' | 'visa-history' | 'appointments' | 'notes' | 'files'>('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile', id],
    queryFn: () => clientsService.getProfile(id!),
    enabled: !!id,
  });
  const profile = profileData as ClientProfile | undefined;

  const { data: timeline } = useQuery({
    queryKey: ['client-timeline', id],
    queryFn: () => clientsService.getTimeline(id!),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['client-stats', id],
    queryFn: () => clientsService.getStats(id!),
    enabled: !!id,
  });
  const stats = statsData as ClientStats | undefined;

  const { data: notes = [] } = useQuery({
    queryKey: ['client-notes', id],
    queryFn: () => clientsService.getNotes(id!),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', id],
    queryFn: () => clientsService.getDocuments(id!),
    enabled: !!id,
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => clientsService.createNote(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', id] });
      queryClient.invalidateQueries({ queryKey: ['client-profile', id] });
      setNoteInput('');
      toast.success(t('clients:noteAdded'));
    },
    onError: () => toast.error(t('clients:addNoteFailed')),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      clientsService.updateNote(id!, noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', id] });
      setEditingNoteId(null);
      setEditingNoteContent('');
      toast.success(t('clients:noteUpdated'));
    },
    onError: () => toast.error(t('clients:updateNoteFailed')),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => clientsService.deleteNote(id!, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', id] });
      toast.success(t('clients:noteDeleted'));
    },
    onError: () => toast.error(t('clients:deleteNoteFailed')),
  });

  const { data: clientFiles = [], refetch: refetchFiles } = useQuery({
    queryKey: ['client-files', id],
    queryFn: () => filesService.getFiles(id!),
    enabled: !!id,
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => filesService.uploadFile(id!, file),
    onSuccess: () => {
      refetchFiles();
      toast.success(t('clients:fileUploaded'));
    },
    onError: () => toast.error(t('clients:uploadFailed')),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => filesService.deleteFile(id!, fileId),
    onSuccess: () => {
      refetchFiles();
      toast.success(t('clients:fileDeleted'));
    },
    onError: () => toast.error(t('clients:deleteFailed')),
  });

  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleConfirmUpload = useCallback(() => {
    if (pendingFile) {
      uploadFileMutation.mutate(pendingFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(null);
      setPreviewUrl(null);
    }
  }, [pendingFile, previewUrl, uploadFileMutation]);

  const handleCancelUpload = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      e.target.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleCopyPhone = useCallback(() => {
    if (profile) copyToClipboard(profile.phoneNumber);
  }, [profile]);

  const [printingId, setPrintingId] = useState<string | null>(null);

  const printBordereau = useCallback(async (visaCaseId: string) => {
    if (printingId) return;
    setPrintingId(visaCaseId);
    try {
      await pdfService.printBordereau(visaCaseId);
    } catch {
      toast.error(t('common:error'));
    } finally {
      setPrintingId(null);
    }
  }, [t, printingId]);

  const sortedTimeline = useMemo(() => {
    if (!timeline) return [];
    return (timeline as ClientTimelineEvent[]).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [timeline]);

  if (profileLoading) return <ProfileSkeleton />;
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{t('clients:clientNotFound')}</p>
        <Button variant="outline" onClick={() => navigate(ROUTES.CLIENTS)}>
          {t('clients:backToClients')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.CLIENTS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{profile.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {t('clients:clientSince')} {new Date(profile.createdAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(`${ROUTES.VISA_CASES_NEW}?clientId=${id}`)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t('clients:newVisaCase')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`${ROUTES.CLIENTS_DETAIL(id!)}/edit`)}>
            <Edit3 className="mr-1.5 h-4 w-4" />
            {t('clients:edit')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6 rounded-xl border bg-card p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary shrink-0">
          {getInitials(profile.fullName)}
        </div>
        <div className="flex flex-1 flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{t('clients:phone')}</p>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.phoneNumber}</span>
              <button onClick={handleCopyPhone} className="text-muted-foreground hover:text-foreground p-0.5">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          {profile.whatsappNumber && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('clients:whatsapp')}</p>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm font-medium">{profile.whatsappNumber}</span>
              </div>
            </div>
          )}
          {profile.email && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('clients:email')}</p>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.email}</span>
              </div>
            </div>
          )}
          {profile.passportNumber && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('clients:passportNumber')}</p>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.passportNumber}</span>
              </div>
            </div>
          )}
          {profile.nationality && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('clients:nationality')}</p>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.nationality}</span>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{t('clients:createdBy')}</p>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.creator.firstName} {profile.creator.lastName}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`${ROUTES.CLIENTS_DETAIL(id!)}/edit`)}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            {t('clients:editClient')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const phone = profile.phoneNumber.replace(/\s+/g, '');
            window.open(`tel:${phone}`, '_blank');
          }}>
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            {t('clients:call')}
          </Button>
          {(() => {
            const wa = profile.whatsappNumber;
            if (!wa) return null;
            return (
            <Button variant="outline" size="sm" onClick={() => {
              window.open(`https://wa.me/${wa.replace(/\s+/g, '')}`, '_blank');
            }}>
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              {t('clients:whatsapp')}
            </Button>
            );
          })()}
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title={t('clients:totalApplications')} value={stats.totalApplications} icon={FileText} color="#3b82f6" />
          <StatCard title={t('clients:approved')} value={stats.approved} icon={CheckCircle2} color="#22c55e" trend={stats.approvalRate > 0 ? { value: stats.approvalRate, positive: true } : undefined} />
          <StatCard title={t('clients:refused')} value={stats.refused} icon={XCircle} color="#ef4444" trend={stats.refusalRate > 0 ? { value: stats.refusalRate, positive: false } : undefined} />
          <StatCard title={t('clients:pending')} value={stats.pending} icon={Clock} color="#f59e0b" />
          <StatCard title={t('clients:avgDays')} value={stats.avgProcessingTime} icon={Calendar} color="#8b5cf6" subtitle={t('clients:processingTime')} />
        </div>
      )}

      <div className="border-b border-border">
        <nav className="flex gap-6">
          {(['timeline', 'visa-history', 'appointments', 'notes', 'files'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'timeline' && t('clients:recentActivity')}
              {tab === 'visa-history' && `${t('clients:visaCases')} (${profile.visaCases.length})`}
              {tab === 'appointments' && t('nav:appointments')}
              {tab === 'notes' && `${t('common:notes')} (${notes.length})`}
              {tab === 'files' && `${t('clients:uploadedFiles')} (${clientFiles.length})`}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'timeline' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('clients:recentActivity')}</CardTitle>
                  <CardDescription>{t('clients:allEvents')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedTimeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">{t('clients:noActivity')}</p>
                  ) : (
                    <div className="space-y-0">
                      {sortedTimeline.map((event, idx) => (
                        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                              TIMELINE_EVENT_COLORS[event.type] || 'bg-gray-400',
                            )}>
                              {event.type === 'CLIENT_CREATED' || event.type === 'ENTITY_CREATED' ? (
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              ) : event.type === 'STATUS_CHANGE' ? (
                                <AlertCircle className="h-4 w-4 text-white" />
                              ) : (
                                <Clock className="h-4 w-4 text-white" />
                              )}
                            </div>
                            {idx < sortedTimeline.length - 1 && (
                              <div className="w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{event.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString(i18n.language?.replace('_', '-') ?? 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            {event.user && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('clients:createdBy')} {event.user.firstName} {event.user.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('clients:statistics')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{t('clients:approvalRate')}</span>
                        <span className="font-semibold text-emerald-600">{stats.approvalRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.approvalRate}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{t('clients:refusalRate')}</span>
                        <span className="font-semibold text-red-600">{stats.refusalRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${stats.refusalRate}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{stats.totalCountries}</p>
                        <p className="text-xs text-muted-foreground">{t('clients:countries')}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{stats.avgProcessingTime}</p>
                        <p className="text-xs text-muted-foreground">{t('clients:avgDaysLabel')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {stats && stats.upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('clients:upcomingAppointments')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.upcomingAppointments.slice(0, 3).map((apt) => (
                      <div key={apt.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{apt.appointmentCenter}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')} at {apt.appointmentTime}
                          </p>
                        </div>
                        <Badge className="shrink-0">{t('appointmentType:' + apt.appointmentType)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visa-history' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profile.visaCases.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3" />
                <p>{t('clients:noVisaApplications')}</p>
              </div>
            ) : (
              profile.visaCases.map((vc) => (
                <Card key={vc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-primary">{vc.caseNumber}</p>
                      <StatusBadge status={vc.currentStatus as VisaStatus} />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('clients:country')}</span>
                        <span className="font-medium">{vc.visaCountry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('clients:visaType')}</span>
                        <span className="font-medium">{vc.visaType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('clients:opened')}</span>
                        <span className="font-medium">{new Date(vc.openingDate || vc.createdAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</span>
                      </div>
                      {vc.visaDetails?.validUntil && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('clients:validUntil')}</span>
                          <span className="font-medium">{new Date(vc.visaDetails.validUntil).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        {t('common:open')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={printingId === vc.id}
                        onClick={() => printBordereau(vc.id)}
                      >
                        {printingId === vc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'appointments' && stats && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('appointments:upcoming')}</CardTitle>
                <CardDescription>{t('appointments:scheduledDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">{t('clients:noUpcoming')}</p>
                ) : (
                  <div className="space-y-3">
                    {stats.upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{apt.appointmentCenter}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {apt.appointmentTime}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('visaCases:caseNumber')}: {apt.visaCase.caseNumber}</p>
                        </div>
                        <Badge>{t('appointmentType:' + apt.appointmentType)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('appointments:past')}</CardTitle>
                <CardDescription>{t('appointments:completedDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.pastAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">{t('clients:noPast')}</p>
                ) : (
                  <div className="space-y-3">
                    {stats.pastAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-3 rounded-lg border p-3 opacity-70">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{apt.appointmentCenter}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {apt.appointmentTime}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('visaCases:caseNumber')}: {apt.visaCase.caseNumber}</p>
                        </div>
                        <Badge className="bg-muted text-muted-foreground">{t('appointmentType:' + apt.appointmentType)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3" />
                  <p>{t('clients:noInternalNotes')}</p>
                </div>
              ) : (
                (notes as ClientNote[]).map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }}>
                              {t('common:cancel')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateNoteMutation.mutate({ noteId: note.id, content: editingNoteContent })}
                              disabled={!editingNoteContent.trim() || updateNoteMutation.isPending}
                            >
                              {updateNoteMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                              {t('common:save')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{note.creator.firstName} {note.creator.lastName}</span>
                              <span>·</span>
                              <span>{new Date(note.createdAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                                className="p-1 text-muted-foreground hover:text-foreground rounded"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('clients:addNote')}</CardTitle>
                  <CardDescription>{t('clients:internalNotes')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={t('clients:writeNote')}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={() => createNoteMutation.mutate(noteInput)}
                      disabled={!noteInput.trim() || createNoteMutation.isPending}
                    >
                      {createNoteMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-4 w-4" />
                      )}
                      {t('clients:addNote')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {documents.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>{t('clients:files')}</CardTitle>
                    <CardDescription>{t('clients:generatedPdfs')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(documents as ClientDocument[]).slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} · {(doc.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>{t('clients:uploadedFiles')}</CardTitle>
                    <CardDescription>{t('clients:filesDescription')}</CardDescription>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileUpload}
                    />
                    <Button size="sm" asChild>
                      <span>
                        {uploadFileMutation.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {t('clients:uploadFile')}
                      </span>
                    </Button>
                  </label>
                </CardHeader>
                <CardContent>
                  <div
                    className={`mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                      dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t('clients:dragDropHint') || 'Glissez un fichier ici ou cliquez pour sélectionner'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">PDF, JPG, PNG, WEBP — Max 10 MB</p>
                  </div>

                  {pendingFile && (
                    <div className="mb-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        {previewUrl ? (
                          <img src={previewUrl} alt={pendingFile.name} className="h-16 w-16 rounded-lg object-cover" />
                        ) : pendingFile.type === 'application/pdf' ? (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <FileText className="h-8 w-8 text-red-500" />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                            <File className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pendingFile.size >= 1024 * 1024
                              ? `${(pendingFile.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(pendingFile.size / 1024).toFixed(0)} KB`
                            }
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleConfirmUpload}
                            disabled={uploadFileMutation.isPending}
                          >
                            {uploadFileMutation.isPending ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {t('common:confirm') || 'Confirmer'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelUpload}
                            disabled={uploadFileMutation.isPending}
                          >
                            {t('common:cancel') || 'Annuler'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientFiles.length === 0 && !pendingFile ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <File className="h-12 w-12 mb-3" />
                      <p>{t('clients:noFiles')}</p>
                      <p className="text-xs mt-1">{t('clients:noFilesHint')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(clientFiles as ClientFile[]).map((file) => (
                        <div key={file.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          {file.mimeType.startsWith('image/') ? (
                            <SecureImage
                              src={filesService.getDownloadUrl(id!, file.id)}
                              alt={file.originalName}
                              className="h-10 w-10 rounded object-cover shrink-0"
                            />
                          ) : file.mimeType === 'application/pdf' ? (
                            <FileText className="h-8 w-8 text-red-500 shrink-0" />
                          ) : (
                            <File className="h-8 w-8 text-gray-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.size >= 1024 * 1024
                                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${(file.size / 1024).toFixed(0)} KB`
                              } · {new Date(file.createdAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              asChild
                            >
                              <a href={filesService.getDownloadUrl(id!, file.id)} download>
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(t('common:confirm'))) {
                                  deleteFileMutation.mutate(file.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('clients:uploadTips')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{t('clients:tipAccepted')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{t('clients:tipMaxSize')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{t('clients:tipOrganized')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span>{t('clients:tipCompressed') || 'Images are automatically compressed to save space'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
