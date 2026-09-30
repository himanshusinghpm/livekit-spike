'use client';
import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { ChevronDown, FileText, Table } from 'lucide-react';
interface SponsorPDFExportProps {
  campaignName: string;
  creatorHandle: string;
  peakCcv: number;
  avgCcv: number;
  duration: string;
  onExportCSV?: () => void;
}
export default function SponsorPDFExport({
  campaignName, creatorHandle, peakCcv, avgCcv, duration, onExportCSV,
}: SponsorPDFExportProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const handleDownloadPDF = async () => {
    if (!templateRef.current || isGenerating) return;
    setOpen(false);
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(templateRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
      const img = new Image();
      const dims: { w: number; h: number } = await new Promise((resolve, reject) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (dims.h * pdfWidth) / dims.w;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const renderHeight = Math.min(pdfHeight, pageHeight);
      const renderWidth = (dims.w * renderHeight) / dims.h;
      const xOffset = (pdfWidth - renderWidth) / 2;
      pdf.addImage(dataUrl, 'PNG', xOffset, 0, renderWidth, renderHeight);
      pdf.save('livekit-sponsor-report.pdf');
    } catch (err) {
      console.error('Sponsor PDF export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleCSV = () => { setOpen(false); onExportCSV?.(); };
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={isGenerating}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? 'GENERATING PDF...' : 'Export Report'}
          <ChevronDown className="size-3" />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-white/[0.09] bg-[#111216] shadow-2xl"
          >
            <button
              role="menuitem"
              onClick={handleDownloadPDF}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-zinc-200 transition hover:bg-white/[0.06]"
            >
              <FileText className="size-4 text-orange-400" />
              <span><span className="block font-semibold">Download PDF</span><span className="block text-[11px] text-zinc-500">For Sponsors</span></span>
              <span className="ml-auto">📄</span>
            </button>
            <button
              role="menuitem"
              onClick={handleCSV}
              className="flex w-full items-center gap-3 border-t border-white/[0.06] px-4 py-3 text-left text-[12px] text-zinc-200 transition hover:bg-white/[0.06]"
            >
              <Table className="size-4 text-indigo-400" />
              <span><span className="block font-semibold">Download Raw CSV</span><span className="block text-[11px] text-zinc-500">Raw telemetry</span></span>
              <span className="ml-auto">📊</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <div
          ref={templateRef}
          style={{
            width: 800, padding: 40, backgroundColor: '#ffffff', color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            borderColor: '#ffffff', outlineColor: '#ffffff',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#6b7280', margin: 0 }}>LIVEKIT SPONSOR REPORT</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>Sponsor Campaign Report</h1>
          <p style={{ fontSize: 14, color: '#4b5563', margin: '8px 0 0 0' }}>{campaignName} | @{creatorHandle} | {generatedDate}</p>
          <div style={{
            marginTop: 24, display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 8, border: '1px solid #86efac', backgroundColor: '#dcfce7',
            padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#166534',
          }}>
            <span>LiveKit Verified: Generated from live campaign telemetry</span>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>PEAK REACH</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{peakCcv.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Peak CCV</p>
            </div>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>AVG SUSTAINED CCV</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{avgCcv.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Average CCV</p>
            </div>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>TOTAL DURATION</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{duration}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Stream length</p>
            </div>
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 16, fontSize: 14, color: '#000000' }}>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0 }}>CAMPAIGN</p><p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{campaignName}</p></div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0 }}>CREATOR</p><p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>@{creatorHandle}</p></div>
          </div>
          <p style={{ marginTop: 32, fontSize: 11, color: '#9ca3af' }}>Generated by LiveKit Dashboard | {generatedDate} | livekit-sponsor-report.pdf</p>
        </div>
      </div>
    </>
  );
}
