import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTemplates,
  useDeleteTemplate,
  getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setDescription("");
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError("");
    if (!selected) { setFile(null); return; }
    if (selected.type !== "application/pdf") {
      setFileError("يُسمح بملفات PDF فقط");
      setFile(null);
      e.target.value = "";
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFileError("حجم الملف يتجاوز الحد الأقصى (10MB)");
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setFileError("يرجى اختيار ملف PDF"); return; }
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    if (description.trim()) formData.append("description", description.trim());
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "فشل الرفع", description: data.error ?? "حدث خطأ غير متوقع", variant: "destructive" });
        return;
      }
      toast({ title: "تم رفع القالب بنجاح", description: `تم إضافة "${data.name}"` });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذّر الوصول إلى الخادم", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg font-bold">رفع قالب موافقة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name" className="text-sm font-medium">اسم القالب <span className="text-destructive">*</span></Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: موافقة إجراء جراحي"
              required
              maxLength={200}
              className="text-right"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc" className="text-sm font-medium">وصف اختياري</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="وصف مختصر للقالب..."
              maxLength={500}
              rows={3}
              className="text-right resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-file" className="text-sm font-medium">ملف PDF <span className="text-destructive">*</span></Label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">اضغط لاختيار ملف</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF فقط · الحد الأقصى 10MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="tpl-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>
          <DialogFooter className="gap-2 pt-2 flex-row-reverse sm:flex-row-reverse">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={uploading}>إلغاء</Button>
            </DialogClose>
            <Button type="submit" disabled={uploading || !name.trim() || !file} className="min-w-24">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الرفع...
                </span>
              ) : "رفع القالب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PreviewDialogProps {
  templateId: number | null;
  templateName: string;
  onClose: () => void;
}

function PreviewDialog({ templateId, templateName, onClose }: PreviewDialogProps) {
  return (
    <Dialog open={templateId !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0" dir="rtl">
        <DialogHeader className="px-5 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold truncate">{templateName}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted/30">
          {templateId !== null && (
            <iframe
              src={`/api/templates/${templateId}/file`}
              className="w-full h-full border-0"
              title={templateName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ConsentTemplatesPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError } = useListTemplates();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم حذف القالب" });
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
      },
      onError: () => {
        toast({ title: "فشل الحذف", variant: "destructive" });
      },
    },
  });

  const handleUploadSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
  }, [queryClient]);

  const handlePreview = (id: number, name: string) => {
    setPreviewId(id);
    setPreviewName(name);
  };

  const handleDeleteConfirm = () => {
    if (deleteId !== null) deleteTemplate({ id: deleteId });
  };

  const templates = data?.templates ?? [];
  const deleteTarget = templates.find(t => t.id === deleteId);

  return (
    <div className="min-h-full" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">قوالب الموافقة</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "جاري التحميل..." : `${templates.length} ${templates.length === 1 ? "قالب" : "قوالب"}`}
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="gap-2 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            رفع قالب
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Error state */}
        {isError && (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">تعذّر تحميل القوالب. حاول مجدداً.</p>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <TemplateCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && templates.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">لا توجد قوالب بعد</h3>
              <p className="text-sm text-muted-foreground mt-1">ارفع أول قالب موافقة PDF للبدء</p>
            </div>
            <Button onClick={() => setUploadOpen(true)} variant="outline" className="gap-2 mt-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              رفع قالب الآن
            </Button>
          </div>
        )}

        {/* Templates grid */}
        {!isLoading && !isError && templates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="group bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                {/* Icon + name */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs font-normal gap-1 px-2 py-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {formatFileSize(template.fileSize)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal gap-1 px-2 py-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(template.createdAt)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-9"
                    onClick={() => handlePreview(template.id, template.name)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    معاينة
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Preview dialog */}
      <PreviewDialog
        templateId={previewId}
        templateName={previewName}
        onClose={() => { setPreviewId(null); setPreviewName(""); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>حذف القالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف قالب <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse sm:flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
