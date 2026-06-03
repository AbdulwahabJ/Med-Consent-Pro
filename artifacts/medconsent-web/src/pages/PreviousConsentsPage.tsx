import { useState } from "react";
import { useListConsents, useDeleteConsent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Archive, FileText, Trash2, Loader2, Eye } from "lucide-react";

type ConsentRecord = {
  id: number;
  templateId: number;
  templateName: string;
  patientName: string;
  patientId?: string | null;
  patientPhone?: string | null;
  procedureName?: string | null;
  doctorName?: string | null;
  consentDate: string;
  notes?: string | null;
  generatedFileName: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
};

export function PreviousConsentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListConsents();
  const deleteMutation = useDeleteConsent();

  const [previewConsent, setPreviewConsent] = useState<ConsentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConsentRecord | null>(null);

  const consents = (data?.consents ?? []) as ConsentRecord[];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      await queryClient.invalidateQueries({ queryKey: ["/api/consents"] });
      toast({ title: "تم حذف الموافقة بنجاح" });
      setDeleteTarget(null);
    } catch {
      toast({ title: "فشل حذف الموافقة", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الموافقات السابقة</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? "جاري التحميل..." : `${consents.length} موافقة`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : consents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
            <Archive className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">لا توجد موافقات</h2>
            <p className="text-muted-foreground text-sm mt-1">ابدأ بإنشاء موافقة طبية جديدة</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consents.map((consent) => (
            <ConsentCard
              key={consent.id}
              consent={consent}
              onPreview={() => setPreviewConsent(consent)}
              onDelete={() => setDeleteTarget(consent)}
            />
          ))}
        </div>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewConsent} onOpenChange={(o) => { if (!o) setPreviewConsent(null); }}>
        <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>
              موافقة — {previewConsent?.patientName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewConsent && (
              <iframe
                src={`/api/consents/${previewConsent.id}/file`}
                className="w-full h-full border-0"
                title="معاينة الموافقة"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              سيتم حذف موافقة المريض "{deleteTarget?.patientName}" نهائياً. لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsentCard({
  consent,
  onPreview,
  onDelete,
}: {
  consent: ConsentRecord;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const createdDate = new Date(consent.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="hover:shadow-md transition-shadow duration-150">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">{consent.patientName}</p>
            {consent.procedureName && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{consent.procedureName}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <InfoRow label="القالب" value={consent.templateName} />
          <InfoRow label="تاريخ الموافقة" value={consent.consentDate} />
          {consent.doctorName && <InfoRow label="الطبيب" value={consent.doctorName} />}
          <InfoRow label="أُنشئت" value={createdDate} />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="flex-1 gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right truncate">{value}</span>
    </div>
  );
}
