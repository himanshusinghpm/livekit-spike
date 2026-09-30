'use client';
import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { ChevronDown, FileText, Table } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
export interface PdfChartPoint {
  time: string;
  youtube: number;
  kick: number;
  total: number;
}
export interface PlatformStats {
  peak: number;
  avg: number;
}
interface SponsorPDFExportProps {
  campaignName: string;
  campaignId?: string;
  brandName?: string;
  platformHandles?: { kick?: string; youtube?: string };
  creatorHandle?: string;
  peakCcv: number;
  avgCcv: number;
  kickStats?: PlatformStats;
  youtubeStats?: PlatformStats;
  combinedStats?: PlatformStats;
  duration: string;
  durationSeconds?: number;
  chartData?: PdfChartPoint[];
  hasYouTube?: boolean;
  hasKick?: boolean;
  isMultiStream?: boolean;
  onExportCSV?: () => void;
}
export default function SponsorPDFExport({
  campaignName, campaignId, brandName = 'Brand', platformHandles, creatorHandle,
  peakCcv, avgCcv, kickStats, youtubeStats, combinedStats,
  duration, durationSeconds, chartData = [], hasYouTube = true, hasKick = false, isMultiStream = false, onExportCSV,
}: SponsorPDFExportProps) {
  const handles = platformHandles ?? (creatorHandle ? { kick: creatorHandle } : {});
  const platformLine = [handles.kick ? `Kick (@${handles.kick})` : null, handles.youtube ? `YouTube (@${handles.youtube})` : null]
    .filter(Boolean).join(' | ') || 'No platform linked';
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const brandSlug = slug(brandName || 'campaign');
  const campaignSlug = slug(campaignName || '');
  const baseSlug = campaignSlug.startsWith(brandSlug) && brandSlug.length > 0
    ? campaignSlug
    : (campaignSlug && campaignSlug !== brandSlug ? `${brandSlug}-${campaignSlug}` : (campaignSlug || brandSlug || 'campaign'));
  const fileName = `${baseSlug || 'campaign'}-report.pdf`;
  const resolvedCombined: PlatformStats = combinedStats ?? { peak: peakCcv, avg: avgCcv };
  const showBreakdown = isMultiStream && hasYouTube && hasKick;
  const effectiveKick: PlatformStats | undefined = kickStats ?? (hasKick ? { peak: peakCcv, avg: avgCcv } : undefined);
  const effectiveYoutube: PlatformStats | undefined = youtubeStats ?? (hasYouTube ? { peak: peakCcv, avg: avgCcv } : undefined);
  const singleLabel = hasKick ? 'KICK' : hasYouTube ? 'YOUTUBE' : 'COMBINED';
  const singleStats: PlatformStats = hasKick && effectiveKick ? effectiveKick : hasYouTube && effectiveYoutube ? effectiveYoutube : resolvedCombined;
  const hoursAvg = showBreakdown ? resolvedCombined.avg : singleStats.avg;
  const totalHoursWatched = durationSeconds != null ? Math.round(hoursAvg * (durationSeconds / 3600)) : null;
  const fmtCompact = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
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
      const dataUrl = await toJpeg(templateRef.current, { quality: 0.75, pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' });
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
      pdf.addImage(dataUrl, 'JPEG', xOffset, 0, renderWidth, renderHeight);
      pdf.save(fileName);
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
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: '#6b7280', margin: 0 }}>{(brandName || 'Brand').toUpperCase()} SPONSOR REPORT</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{brandName} Campaign Performance Report</h1>
          <p style={{ fontSize: 14, color: '#4b5563', margin: '8px 0 0 0' }}>{campaignName} | {generatedDate}</p>
          <p style={{ fontSize: 13, color: '#111827', margin: '6px 0 0 0' }}>Platforms: {platformLine}</p>
          <div style={{
            marginTop: 24, borderRadius: 10, border: '2px solid #15803d', backgroundColor: '#f0fdf4',
            padding: '14px 18px',
          }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#14532d', margin: 0 }}>🛡️ LiveKit Verified: Agency Sync-Code Authenticated</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', margin: '6px 0 0 0' }}>Sync Code: {campaignId || campaignName} | Telemetry Interval: 60s</p>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: '32px 0 0 0' }}>{showBreakdown ? 'COMBINED TOTALS' : `${singleLabel} PERFORMANCE`}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>PEAK REACH</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{(showBreakdown ? resolvedCombined.peak : singleStats.peak).toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Peak CCV</p>
            </div>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>AVG SUSTAINED CCV</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{(showBreakdown ? resolvedCombined.avg : singleStats.avg).toLocaleString()}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Average CCV</p>
            </div>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>TOTAL DURATION</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{duration}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>Stream length</p>
            </div>
            <div style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>TOTAL HOURS WATCHED</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#000000', margin: '8px 0 0 0' }}>{totalHoursWatched != null ? fmtCompact(totalHoursWatched) : '—'}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>{totalHoursWatched != null ? `${totalHoursWatched.toLocaleString()} hrs` : 'Awaiting data'}</p>
            </div>
          </div>
          {showBreakdown && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#6b7280', margin: 0 }}>PLATFORM BREAKDOWN</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                {effectiveKick && (
                  <div style={{ flex: 1, borderRadius: 8, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#15803d', margin: 0 }}>KICK{handles.kick ? ` (@${handles.kick})` : ''}</p>
                    <p style={{ fontSize: 13, color: '#000000', margin: '8px 0 0 0' }}>Peak CCV: <span style={{ fontWeight: 800 }}>{effectiveKick.peak.toLocaleString()}</span></p>
                    <p style={{ fontSize: 13, color: '#000000', margin: '4px 0 0 0' }}>Avg CCV: <span style={{ fontWeight: 800 }}>{effectiveKick.avg.toLocaleString()}</span></p>
                  </div>
                )}
                {effectiveYoutube && (
                  <div style={{ flex: 1, borderRadius: 8, border: '1px solid #fecdd3', backgroundColor: '#fff1f2', padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#be123c', margin: 0 }}>YOUTUBE{handles.youtube ? ` (@${handles.youtube})` : ''}</p>
                    <p style={{ fontSize: 13, color: '#000000', margin: '8px 0 0 0' }}>Peak CCV: <span style={{ fontWeight: 800 }}>{effectiveYoutube.peak.toLocaleString()}</span></p>
                    <p style={{ fontSize: 13, color: '#000000', margin: '4px 0 0 0' }}>Avg CCV: <span style={{ fontWeight: 800 }}>{effectiveYoutube.avg.toLocaleString()}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginTop: 32, display: 'flex', gap: 16, fontSize: 14, color: '#000000' }}>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0 }}>CAMPAIGN</p><p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{campaignName}</p></div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0 }}>PLATFORMS</p><p style={{ fontWeight: 600, margin: '4px 0 0 0' }}>{platformLine}</p></div>
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: 0 }}>AUDIENCE RETENTION (CCV)</p>
            <div style={{ marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#ffffff', padding: 12 }}>
              {chartData.length > 0 ? (
                <ComposedChart width={704} height={260} data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val: number) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)} />
                  {hasYouTube && <Area type="monotone" dataKey="youtube" name="YouTube" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.15} isAnimationActive={false} />}
                  {hasKick && <Area type="monotone" dataKey="kick" name="Kick" stroke="#16a34a" strokeWidth={2} fill="#16a34a" fillOpacity={0.15} isAnimationActive={false} />}
                  {isMultiStream && <Line type="monotone" dataKey="total" name="Combined" stroke="#7c3aed" strokeWidth={2} dot={false} isAnimationActive={false} />}
                </ComposedChart>
              ) : (
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Awaiting telemetry...</p>
              )}
            </div>
          </div>
          <p style={{ marginTop: 32, fontSize: 11, color: '#9ca3af' }}>Generated by LiveKit Dashboard | {generatedDate} | {fileName}</p>
        </div>
      </div>
    </>
  );
}
