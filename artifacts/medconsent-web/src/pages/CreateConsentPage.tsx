import React, { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates, useListFields, getListFieldsQueryKey, useGenerateConsent } from "@workspace/api-client-react";
import type { TemplateField } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, ChevronRight, ChevronLeft, CheckCircle, Loader2, Download } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface FormValues {
  patient_name: string;
  patient_id: string;
  patient_phone: string;
  procedure_name: string;
  doctor_name: string;
  consent_date: string;
  notes: string;
}

type FieldKey = keyof FormValues;

const FIELD_LABELS: Record<string, string> = {
  patient_name: "اسم المريض",
  patient_id: "رقم الهوية",
  patient_phone: "رقم الجوال",
  procedure_name: "الإجراء الطبي",
  doctor_name: "اسم الطبيب",
  consent_date: "تاريخ الموافقة",
  notes: "ملاحظات",
};

const FORM_KEYS: FieldKey[] = [
  "patient_name",
  "patient_id",
  "patient_phone",
  "procedure_name",
  "doctor_name",
  "consent_date",
  "notes",
];

const today = new Date().toISOString().split("T")[0]!;

function initForm(): FormValues {
  return {
    patient_name: "",
    patient_id: "",
    patient_phone: "",
    procedure_name: "",
    doctor_name: "",
    consent_date: today,
    notes: "",
  };
}

export function CreateConsentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [generatedConsentId, setGeneratedConsentId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(initForm);

  const { data: templatesData, isLoading: templatesLoading } = useListTemplates();
  const { data: fieldsData, isLoading: fieldsLoading } = useListFields(
    selectedTemplateId ?? 0,
    {
      query: {
        enabled: !!selectedTemplateId,
        queryKey: getListFieldsQueryKey(selectedTemplateId ?? 0),
      },
    }
  );
  const generateMutation = useGenerateConsent();

  const templates = templatesData?.templates ?? [];
  const fields: TemplateField[] = fieldsData?.fields ?? [];

  const requiredKeys = new Set(
    fields.filter((f) => f.required).map((f) => f.fieldKey as FieldKey)
  );
  requiredKeys.add("patient_name");
  requiredKeys.add("consent_date");

  const presentFieldKeys: FieldKey[] = FORM_KEYS;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const noFieldsOnSelected = !!selectedTemplateId && !fieldsLoading && fields.length === 0;

  const handleStepOneNext = () => {
    if (!selectedTemplateId) {
      toast({ title: "يرجى اختيار قالب", variant: "destructive" });
      return;
    }
    if (noFieldsOnSelected) return;
    setStep(2);
  };

  const handleStepTwoNext = () => {
    if (!form.patient_name.trim()) {
      toast({ title: "اسم المريض مطلوب", variant: "destructive" });
      return;
    }
    if (!form.consent_date) {
      toast({ title: "تاريخ الموافقة مطلوب", variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) return;
    try {
      const result = await generateMutation.mutateAsync({
        data: {
          templateId: selectedTemplateId,
          patient_name: form.patient_name,
          patient_id: form.patient_id || null,
          patient_phone: form.patient_phone || null,
          procedure_name: form.procedure_name || null,
          doctor_name: form.doctor_name || null,
          consent_date: form.consent_date,
          notes: form.notes || null,
        },
      });
      setGeneratedConsentId(result.id);
      setStep(4);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "فشل توليد الموافقة";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const fileUrl = generatedConsentId ? `/api/consents/${generatedConsentId}/file` : null;

  const STEPS: { num: number; label: string }[] = [
    { num: 1, label: "اختيار القالب" },
    { num: 2, label: "بيانات الموافقة" },
    { num: 3, label: "مراجعة وتوليد" },
    { num: 4, label: "النتيجة" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">موافقة جديدة</h1>
        <p className="text-muted-foreground text-sm mt-1">
          اختر قالباً وعبّئ البيانات لتوليد موافقة طبية
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              className={`flex items-center gap-1.5 ${
                step === s.num
                  ? "text-primary"
                  : step > s.num
                    ? "text-primary/60"
                    : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === s.num
                    ? "bg-primary text-primary-foreground"
                    : step > s.num
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${step > s.num ? "bg-primary/40" : "bg-border"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Template selection */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">اختر قالب الموافقة</h2>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد قوالب متاحة. يرجى رفع قالب أولاً.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isSelected={selectedTemplateId === t.id}
                  noFieldsWarning={selectedTemplateId === t.id && noFieldsOnSelected}
                  onSelect={() => setSelectedTemplateId(t.id)}
                />
              ))}
            </div>
          )}
          <div className="flex justify-start pt-2">
            <Button
              onClick={handleStepOneNext}
              disabled={!selectedTemplateId || fieldsLoading || noFieldsOnSelected}
              className="gap-2"
            >
              {fieldsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">بيانات الموافقة</h2>
          <Card>
            <CardContent className="pt-5 space-y-4">
              {presentFieldKeys.map((key) => (
                <FormField
                  key={key}
                  fieldKey={key}
                  value={form[key]}
                  required={requiredKeys.has(key)}
                  onChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>
            <Button onClick={handleStepTwoNext} className="gap-2">
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">مراجعة البيانات</h2>
          <Card>
            <CardContent className="pt-5 divide-y divide-border">
              <ReviewRow label="القالب" value={selectedTemplate?.name ?? "-"} />
              {presentFieldKeys.map((key) => {
                const val = form[key];
                if (!val) return null;
                return (
                  <ReviewRow key={key} label={FIELD_LABELS[key] ?? key} value={val} />
                );
              })}
            </CardContent>
          </Card>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              تعديل
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              توليد الموافقة
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && fileUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">تم توليد الموافقة بنجاح</p>
              <p className="text-sm text-green-700 mt-0.5">موافقة {form.patient_name}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setPreviewOpen(true)}
              variant="outline"
              className="gap-2 flex-1 sm:flex-none"
            >
              <FileText className="w-4 h-4" />
              معاينة PDF
            </Button>
            <a
              href={fileUrl}
              download={`موافقة_${form.patient_name}.pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="gap-2 w-full sm:w-auto">
                <Download className="w-4 h-4" />
                تحميل PDF
              </Button>
            </a>
          </div>

          <div className="flex gap-3 pt-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate("/previous-consents")}
              className="gap-2"
            >
              الموافقات السابقة
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep(1);
                setSelectedTemplateId(null);
                setGeneratedConsentId(null);
                setForm(initForm());
              }}
            >
              موافقة جديدة
            </Button>
          </div>
        </div>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>معاينة الموافقة — {form.patient_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {fileUrl && (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title="معاينة PDF"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  noFieldsWarning,
  onSelect,
}: {
  template: { id: number; name: string; description?: string | null; fileName: string };
  isSelected: boolean;
  noFieldsWarning: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-150 ${
        noFieldsWarning
          ? "border-amber-400 bg-amber-50"
          : isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            noFieldsWarning
              ? "bg-amber-100 text-amber-600"
              : isSelected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-semibold text-foreground">{template.name}</p>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {template.description}
            </p>
          )}
          {noFieldsWarning ? (
            <p className="text-xs text-amber-600 font-medium mt-1">
              يجب ربط الحقول أولاً قبل استخدام هذا القالب
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">{template.fileName}</p>
          )}
        </div>
        {isSelected && !noFieldsWarning && (
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
}

function FormField({
  fieldKey,
  value,
  required,
  onChange,
}: {
  fieldKey: FieldKey;
  value: string;
  required: boolean;
  onChange: (v: string) => void;
}) {
  const label = FIELD_LABELS[fieldKey] ?? fieldKey;
  const isDate = fieldKey === "consent_date";
  const isNotes = fieldKey === "notes";

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </Label>
      {isNotes ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="min-h-[80px] text-right"
          dir="rtl"
        />
      ) : (
        <Input
          type={isDate ? "date" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isDate ? undefined : label}
          className="text-right"
          dir="rtl"
        />
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
