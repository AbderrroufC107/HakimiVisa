import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileText, ImageIcon, Trash2, Download, Upload, Loader2, Eye, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { visaCaseFilesService, getAccessToken, type ClientFile } from '@/services';
import { cn } from '@/lib/utils';

const MAX_BYTES = 10 * 1024 * 1024;

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Documents for one application: drag-and-drop upload, thumbnails, and a
 * viewer that keeps the user on the page instead of downloading to look.
 */
export function CaseFilesPanel({ visaCaseId }: { visaCaseId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ClientFile | null>(null);
  // Downloads need the bearer token, so fetch as a blob rather than pointing
  // an <img>/<iframe> straight at the protected URL.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['visa-case-files', visaCaseId],
    queryFn: () => visaCaseFilesService.getFiles(visaCaseId),
    enabled: !!visaCaseId,
  });

  const fetchBlobUrl = useCallback(
    async (fileId: string) => {
      const token = getAccessToken();
      const res = await fetch(visaCaseFilesService.getDownloadUrl(visaCaseId, fileId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('download failed');
      return URL.createObjectURL(await res.blob());
    },
    [visaCaseId],
  );

  // Thumbnails for images already stored. Object URLs are revoked when the
  // panel goes away, never on refetch — a list reload would otherwise kill
  // the URLs the rendered thumbnails are still pointing at.
  const thumbUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const file of files.filter((f) => isImage(f.mimeType))) {
        if (cancelled || thumbs[file.id]) continue;
        try {
          const url = await fetchBlobUrl(file.id);
          if (cancelled) {
            URL.revokeObjectURL(url);
            break;
          }
          thumbUrlsRef.current.push(url);
          setThumbs((prev) => ({ ...prev, [file.id]: url }));
        } catch {
          /* a missing thumbnail is not worth interrupting the list for */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, fetchBlobUrl]);

  useEffect(() => () => {
    thumbUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    thumbUrlsRef.current = [];
  }, []);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => visaCaseFilesService.uploadFile(visaCaseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-case-files', visaCaseId] });
      toast.success(t('clients:fileUploaded'));
    },
    onError: (e: Error) => toast.error(e.message || t('clients:uploadFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => visaCaseFilesService.deleteFile(visaCaseId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-case-files', visaCaseId] });
      toast.success(t('clients:fileDeleted'));
    },
    onError: () => toast.error(t('common:error')),
  });

  const accept = (file?: File | null) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(t('clients:fileTooLarge'));
      return;
    }
    uploadMutation.mutate(file);
  };

  // The viewer always fetches its own object URL so it never depends on a
  // thumbnail's lifetime, and revokes exactly that URL when it closes.
  const openPreview = async (file: ClientFile) => {
    setPreview(file);
    setPreviewUrl(null);
    try {
      setPreviewUrl(await fetchBlobUrl(file.id));
    } catch {
      toast.error(t('common:error'));
      setPreview(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreview(null);
  };

  const download = async (file: ClientFile) => {
    try {
      const url = await fetchBlobUrl(file.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('common:error'));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t('clients:uploadedFiles')} ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          )}
          data-testid="case-file-dropzone"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm text-muted-foreground">{t('clients:dragDropHint')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">PDF, JPG, PNG, WEBP — max 10 MB</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{t('clients:noFiles')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-lg border bg-card"
                data-testid={`case-file-${file.id}`}
              >
                <button
                  type="button"
                  onClick={() => openPreview(file)}
                  className="flex h-24 w-full items-center justify-center bg-muted/40"
                  title={t('common:view')}
                >
                  {isImage(file.mimeType) && thumbs[file.id] ? (
                    <img src={thumbs[file.id]} alt={file.originalName} className="h-full w-full object-cover" />
                  ) : isImage(file.mimeType) ? (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-500" />
                  )}
                </button>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <div className="flex border-t">
                  <Button variant="ghost" size="sm" className="h-7 flex-1 rounded-none" onClick={() => openPreview(file)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 flex-1 rounded-none border-x" onClick={() => download(file)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 rounded-none text-destructive"
                    onClick={() => { if (confirm(t('clients:confirmDeleteFile'))) deleteMutation.mutate(file.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6 text-base">{preview?.originalName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-lg bg-muted/30">
            {!previewUrl ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : preview && isImage(preview.mimeType) ? (
              <img src={previewUrl} alt={preview.originalName} className="mx-auto max-h-[70vh] object-contain" />
            ) : (
              <iframe src={previewUrl} title={preview?.originalName} className="h-[70vh] w-full" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => preview && download(preview)}>
              <Download className="mr-1 h-4 w-4" />
              {t('common:download')}
            </Button>
            <Button variant="outline" size="sm" onClick={closePreview}>
              <X className="mr-1 h-4 w-4" />
              {t('common:close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
