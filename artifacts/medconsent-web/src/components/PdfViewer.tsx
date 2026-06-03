import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfViewerProps {
  url: string;
  className?: string;
}

export function PdfViewer({ url, className }: PdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setPdfDoc(null);
    setCurrentPage(1);

    let cancelled = false;
    fetch(url, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(buf => {
        if (cancelled) return;
        return pdfjsLib.getDocument({ data: buf }).promise;
      })
      .then(doc => {
        if (!doc || cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  const renderPage = useCallback(async (doc: pdfjsLib.PDFDocumentProxy, page: number) => {
    if (!canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const pdfPage = await doc.getPage(page);
      const container = containerRef.current;
      const containerWidth = container ? container.clientWidth - 32 : 600;
      const unscaled = pdfPage.getViewport({ scale: 1 });
      const scale = containerWidth / unscaled.width;
      const viewport = pdfPage.getViewport({ scale });

      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d")!;
      const task = pdfPage.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = task;
      await task.promise;
    } catch {
      // cancelled — ignore
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(pdfDoc, currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  return (
    <div className={`flex flex-col h-full bg-muted/40 ${className ?? ""}`}>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-background border-b border-border shrink-0">
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
          <span className="text-sm text-muted-foreground">
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
      )}

      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center items-start">
        {loading && (
          <div className="w-full max-w-2xl space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        )}
        {error && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            تعذّر تحميل ملف PDF
          </div>
        )}
        {!loading && !error && (
          <div className="shadow-lg bg-white" style={{ display: "inline-block", lineHeight: 0 }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
}
