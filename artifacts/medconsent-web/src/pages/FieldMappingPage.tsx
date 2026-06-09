import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getListFieldsQueryKey } from "@workspace/api-client-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

type FieldType = "text" | "date" | "signature";

interface LocalField {
  localId: string;
  id?: number;
  fieldKey: string;
  label: string;
  type: FieldType;
  pageNumber: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  required: boolean;
  fontSize: number;
  bold: boolean;
}

interface DragState {
  localId: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  startXPct: number;
  startYPct: number;
  startWPct: number;
  startHPct: number;
}

function getTypeColor(type: FieldType): { border: string; bg: string; text: string } {
  switch (type) {
    case "date": return { border: "#2563eb", bg: "rgba(37,99,235,0.08)", text: "#1d4ed8" };
    case "signature": return { border: "#7c3aed", bg: "rgba(124,58,237,0.08)", text: "#6d28d9" };
    default: return { border: "#0d9488", bg: "rgba(13,148,136,0.08)", text: "#0f766e" };
  }
}

function getTypeBadge(type: FieldType): string {
  switch (type) {
    case "date": return "تاريخ";
    case "signature": return "توقيع";
    default: return "نص";
  }
}

interface FieldBoxProps {
  field: LocalField;
  isSelected: boolean;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<LocalField>) => void;
  onDelete: (id: string) => void;
}

function FieldBox({ field, isSelected, overlayRef, onSelect, onUpdate, onDelete }: FieldBoxProps) {
  const dragRef = useRef<DragState | null>(null);
  const colors = getTypeColor(field.type);

  const startDrag = useCallback((e: React.PointerEvent, mode: "move" | "resize") => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(field.localId);
    dragRef.current = {
      localId: field.localId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startXPct: field.xPercent,
      startYPct: field.yPercent,
      startWPct: field.widthPercent,
      startHPct: field.heightPercent,
    };
  }, [field, onSelect]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width * 100;
    const dy = (e.clientY - dragRef.current.startY) / rect.height * 100;
    const d = dragRef.current;

    if (d.mode === "move") {
      onUpdate(field.localId, {
        xPercent: Math.max(0, Math.min(100 - d.startWPct, d.startXPct + dx)),
        yPercent: Math.max(0, Math.min(100 - d.startHPct, d.startYPct + dy)),
      });
    } else {
      onUpdate(field.localId, {
        widthPercent: Math.max(5, Math.min(100 - d.startXPct, d.startWPct + dx)),
        heightPercent: Math.max(3, Math.min(100 - d.startYPct, d.startHPct + dy)),
      });
    }
  }, [field.localId, overlayRef, onUpdate]);

  const endDrag = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: `${field.xPercent}%`,
        top: `${field.yPercent}%`,
        width: `${field.widthPercent}%`,
        height: `${field.heightPercent}%`,
        border: `2px solid ${colors.border}`,
        backgroundColor: colors.bg,
        borderRadius: 3,
        cursor: "move",
        userSelect: "none",
        touchAction: "none",
        boxSizing: "border-box",
        outline: isSelected ? `2px solid ${colors.border}` : "none",
        outlineOffset: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      onPointerDown={e => startDrag(e, "move")}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
    >
      <span style={{
        fontSize: "10px",
        fontWeight: 600,
        color: colors.text,
        textAlign: "center",
        padding: "0 2px",
        lineHeight: 1.2,
        direction: "rtl",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}>
        {field.label}
      </span>

      {isSelected && (
        <button
          style={{
            position: "absolute",
            top: -8,
            insetInlineEnd: -8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 10,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(field.localId); }}
          title="حذف"
        >
          ×
        </button>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 10,
          height: 10,
          cursor: "se-resize",
          background: colors.border,
          borderRadius: "2px 0 2px 0",
        }}
        onPointerDown={e => startDrag(e, "resize")}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
      />
    </div>
  );
}

export function FieldMappingPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = parseInt(params.templateId ?? "", 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [templateName, setTemplateName] = useState("");
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);

  const [fields, setFields] = useState<LocalField[]>([]);
  const [serverFieldIds, setServerFieldIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addLabel, setAddLabel] = useState("");
  const [addType, setAddType] = useState<FieldType>("text");
  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/templates/${templateId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setTemplateName(d.name ?? "القالب"))
      .catch(() => {});
  }, [templateId]);

  useEffect(() => {
    if (!templateId) return;
    setPdfLoading(true);
    setPdfError(false);

    pdfjsLib.getDocument({ url: `/api/templates/${templateId}/file`, withCredentials: true })
      .promise
      .then(doc => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPdfLoading(false);
      })
      .catch(() => {
        setPdfError(true);
        setPdfLoading(false);
      });
  }, [templateId]);

  const zoomIn = useCallback(() => setZoom(z => Math.min(4, parseFloat((z + 0.25).toFixed(2)))), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2)))), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const container = scrollContainerRef.current;
        const containerWidth = container ? container.clientWidth - 48 : 700;
        const unscaled = page.getViewport({ scale: 1 });
        const scale = (containerWidth / unscaled.width) * zoom;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const task = page.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e: unknown) {
        if (e instanceof Error && e.message !== "Rendering cancelled") {
          console.error("PDF render error", e);
        }
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/templates/${templateId}/fields`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const sFields = data.fields ?? [];
        setServerFieldIds(sFields.map((f: { id: number }) => f.id));
        setFields(sFields.map((f: {
          id: number; fieldKey: string; label: string; type: FieldType;
          pageNumber: number; xPercent: number; yPercent: number;
          widthPercent: number; heightPercent: number; required: boolean;
          fontSize?: number; bold?: boolean;
        }) => ({
          localId: String(f.id),
          id: f.id,
          fieldKey: f.fieldKey,
          label: f.label,
          type: f.type,
          pageNumber: f.pageNumber,
          xPercent: f.xPercent,
          yPercent: f.yPercent,
          widthPercent: f.widthPercent,
          heightPercent: f.heightPercent,
          required: f.required,
          fontSize: f.fontSize ?? 12,
          bold: f.bold ?? false,
        })));
      })
      .catch(() => {});
  }, [templateId]);

  const handleUpdate = useCallback((localId: string, patch: Partial<LocalField>) => {
    setFields(prev => prev.map(f => f.localId === localId ? { ...f, ...patch } : f));
  }, []);

  const handleDelete = useCallback((localId: string) => {
    setFields(prev => prev.filter(f => f.localId !== localId));
    setSelectedId(null);
  }, []);

  const handleSelect = useCallback((localId: string) => {
    setSelectedId(localId);
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setSelectedId(null);
  }, []);

  const handleAddField = () => {
    const label = addLabel.trim() || "حقل جديد";
    const fieldKey = `field_${Date.now()}`;
    const pageFields = fields.filter(f => f.pageNumber === currentPage);
    const newField: LocalField = {
      localId: `new-${Date.now()}`,
      fieldKey,
      label,
      type: addType,
      pageNumber: currentPage,
      xPercent: 5,
      yPercent: Math.min(90, 5 + pageFields.length * 12),
      widthPercent: addType === "signature" ? 35 : 30,
      heightPercent: addType === "signature" ? 10 : 6,
      required: true,
      fontSize: 12,
      bold: false,
    };
    setFields(prev => [...prev, newField]);
    setSelectedId(newField.localId);
    setAddLabel("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        serverFieldIds.map(id =>
          fetch(`/api/templates/${templateId}/fields/${id}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      );

      const created: Array<{ id: number }> = await Promise.all(
        fields.map(async f => {
          const r = await fetch(`/api/templates/${templateId}/fields`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldKey: f.fieldKey,
              label: f.label,
              type: f.type,
              pageNumber: f.pageNumber,
              xPercent: Math.round(f.xPercent * 100) / 100,
              yPercent: Math.round(f.yPercent * 100) / 100,
              widthPercent: Math.round(f.widthPercent * 100) / 100,
              heightPercent: Math.round(f.heightPercent * 100) / 100,
              required: f.required,
              fontSize: f.fontSize,
              bold: f.bold,
            }),
          });
          if (!r.ok) {
            const body = await r.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
          }
          return r.json() as Promise<{ id: number }>;
        })
      );

      const newIds = created.map(c => c.id);
      setServerFieldIds(newIds);
      setFields(prev => prev.map((f, i) => ({
        ...f,
        localId: String(created[i]?.id ?? f.localId),
        id: created[i]?.id,
      })));

      await queryClient.invalidateQueries({
        queryKey: getListFieldsQueryKey(templateId),
      });

      toast({ title: "تم حفظ الحقول بنجاح" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل الحفظ";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const currentPageFields = fields.filter(f => f.pageNumber === currentPage);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/consent-templates")} className="h-9 w-9">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">
            {templateName || "ربط الحقول"}
          </h1>
          <p className="text-xs text-muted-foreground">حدد مواقع الحقول فوق القالب</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shrink-0">
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              حفظ الحقول
            </>
          )}
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Right sidebar (RTL first) */}
        <div className="w-64 flex-shrink-0 border-s border-border bg-muted/20 flex flex-col overflow-y-auto">
          {/* Add field section */}
          <div className="p-4 space-y-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">إضافة حقل</h2>
            <div className="space-y-2">
              <Input
                value={addLabel}
                onChange={e => setAddLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddField(); } }}
                placeholder="اسم الحقل (مثال: اسم المريض)"
                className="text-sm h-9 text-right"
                dir="rtl"
              />
              <Select value={addType} onValueChange={v => setAddType(v as FieldType)}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="نوع الحقل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">نص</SelectItem>
                  <SelectItem value="date">تاريخ</SelectItem>
                  <SelectItem value="signature">توقيع</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddField} className="w-full gap-2 h-9 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة للصفحة {currentPage}
              </Button>
            </div>
          </div>

          {/* Field list */}
          <div className="flex-1 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>الحقول المربوطة</span>
              <Badge variant="secondary" className="text-xs">{fields.length}</Badge>
            </h2>

            {fields.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">لم يتم ربط أي حقول بعد</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {fields.map(f => {
                  const colors = getTypeColor(f.type);
                  const isActive = selectedId === f.localId;
                  return (
                    <div key={f.localId} className="space-y-1">
                      <div
                        className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${isActive ? "bg-primary/10 border-primary/30" : "bg-background border-border hover:bg-muted/50"}`}
                        onClick={() => {
                          setSelectedId(f.localId);
                          if (f.pageNumber !== currentPage) setCurrentPage(f.pageNumber);
                        }}
                      >
                        <span
                          style={{ background: colors.border }}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{f.label}</div>
                          <div className="text-muted-foreground">
                            {getTypeBadge(f.type)} · ص{f.pageNumber}
                          </div>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); handleDelete(f.localId); }}
                          title="حذف"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Font controls — only for selected non-signature field */}
                      {isActive && f.type !== "signature" && (
                        <div className="px-2 pb-1 flex items-center gap-2" onPointerDown={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 flex-1">
                            <button
                              className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                              onClick={() => handleUpdate(f.localId, { fontSize: Math.max(6, f.fontSize - 1) })}
                              title="تصغير الخط"
                            >−</button>
                            <input
                              type="number"
                              min={6}
                              max={72}
                              value={f.fontSize}
                              onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v) && v >= 6 && v <= 72) handleUpdate(f.localId, { fontSize: v });
                              }}
                              className="w-10 h-6 text-center text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              title="حجم الخط"
                            />
                            <button
                              className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                              onClick={() => handleUpdate(f.localId, { fontSize: Math.min(72, f.fontSize + 1) })}
                              title="تكبير الخط"
                            >+</button>
                          </div>
                          <button
                            className={`w-8 h-6 rounded border text-xs font-bold transition-colors ${f.bold ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                            onClick={() => handleUpdate(f.localId, { bold: !f.bold })}
                            title={f.bold ? "إلغاء الخط العريض" : "خط عريض"}
                          >B</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PDF Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          {/* Toolbar: zoom + page nav */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-background border-b border-border flex-shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                title="تصغير"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </Button>
              <button
                className="text-xs font-mono text-muted-foreground min-w-[44px] text-center hover:text-foreground transition-colors"
                onClick={zoomReset}
                title="إعادة الضبط إلى 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={zoomIn}
                disabled={zoom >= 4}
                title="تكبير"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </Button>
            </div>

            {/* Page navigation */}
            {numPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  صفحة {currentPage} من {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">صفحة واحدة</span>
            )}
          </div>

          {/* Scrollable PDF area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto p-6 flex justify-center items-start">
            {pdfLoading && (
              <div className="space-y-2 w-full max-w-2xl">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            )}
            {pdfError && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                تعذّر تحميل ملف PDF
              </div>
            )}
            {!pdfLoading && !pdfError && (
              <div
                className="relative shadow-lg bg-white"
                style={{ display: "inline-block", lineHeight: 0 }}
              >
                <canvas ref={canvasRef} style={{ display: "block" }} />
                <div
                  ref={overlayRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    cursor: "default",
                  }}
                  onClick={handleOverlayClick}
                >
                  {currentPageFields.map(field => (
                    <FieldBox
                      key={field.localId}
                      field={field}
                      isSelected={selectedId === field.localId}
                      overlayRef={overlayRef}
                      onSelect={handleSelect}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
