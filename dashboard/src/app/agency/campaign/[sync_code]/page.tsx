'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Area, ComposedChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ArrowLeft, Activity, Users, Clock, Radio, Info, Download } from 'lucide-react';
import { useMemo } from 'react';
import SponsorPDFExport from '@/components/SponsorPDFExport';

const CustomTooltip = ({ active, payload, label, isMultiStream }: any) => {
  if (active && payload && payload.length) {
    // Filter out the 'total' line from the main list to prevent duplicate rendering in the tooltip
    const platformData = payload.filter((p: any) => p.dataKey !== 'total');
    const totalData = payload.find((p: any) => p.dataKey === 'total');
    const totalValue = totalData ? totalData.value : platformData.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-xl text-sm min-w-[160px]">
        <p className="text-[#a1a1aa] mb-3 font-medium">{label}</p>
        {platformData.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-6 mb-1.5">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
            <span className="font-semibold text-white">{entry.value.toLocaleString()}</span>
          </div>
        ))}
        {isMultiStream && (
          <div className="flex justify-between gap-6 mt-3 pt-3 border-t border-[#27272a]">
            <span className="text-white font-medium">Combined:</span>
            <span className="font-bold text-white">{totalValue.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function CampaignTelemetryPage() {
  const params = useParams();
  const router = useRouter();
  const syncCode = params.sync_code as string;

  const { data, loading, campaignName } = useTelemetry(syncCode);

  // Determine Platform Presence
  const hasYouTube = data.some(r => r.platform === 'youtube');
  const hasKick = data.some(r => r.platform === 'kick');
  const isMultiStream = hasYouTube && hasKick;

  // Advanced Time-Bucketing: Merge YT and Kick rows into 1-minute intervals
  const chartData = useMemo(() => {
    const timeMap = new Map();
    let lastYT = 0;
    let lastKick = 0;

    data.forEach((row) => {
      const d = new Date(row.recorded_at);
      d.setSeconds(0, 0); // Floor to the minute
      const timeKey = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const rawDate = d.getTime();

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          time: timeKey,
          rawDate,
          youtube: lastYT,
          kick: lastKick,
          total: lastYT + lastKick
        });
      }

      const entry = timeMap.get(timeKey);

      // Update with the highest peak recorded in this minute block
      // BUG FIXED: Direct assignment allows values to drop naturally instead of ratcheting upward
      if (row.platform === 'youtube') { entry.youtube = row.interval_peak; lastYT = entry.youtube; }
      if (row.platform === 'kick') { entry.kick = row.interval_peak; lastKick = entry.kick; }

      entry.total = entry.youtube + entry.kick;
    });

    return Array.from(timeMap.values()).sort((a, b) => a.rawDate - b.rawDate);
  }, [data]);

  const peakViewers = chartData.length > 0 ? Math.max(...chartData.map(d => d.total)) : 0;
  const avgViewers = chartData.length > 0 ? Math.round(chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length) : 0;

  // Max duration across all incoming platform streams
  const durationSeconds = data.length > 0 ? Math.max(...data.map(d => d.stream_time_seconds || 0)) : 0;

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  // Dynamic Terminology
  const peakTitle = isMultiStream ? "Peak Combined" : "Peak Viewers";
  const peakDesc = isMultiStream ? "Highest concurrent reach aggregated across active platforms during this recorded timeline." : "Highest concurrent reach registered during this recorded timeline.";
  const avgTitle = isMultiStream ? "Average Combined" : "Average Viewers";
  const avgDesc = isMultiStream ? "Mean concurrent audience aggregated across active platforms during this recorded timeline." : "Mean concurrent audience registered during this recorded timeline.";

  // Agency-Ready Client-Side CSV Generator
  const handleExportCSV = () => {
    if (!chartData || chartData.length === 0) return;

    // Clean, business-ready headers
    const headers = ['Date', 'Time', 'YouTube Peak CCV', 'Kick Peak CCV', 'Combined Peak CCV'];
    const csvRows = [headers.join(',')];

    chartData.forEach(row => {
      const d = new Date(row.rawDate);

      // Format date cleanly (e.g., "9/29/2026")
      const dateStr = d.toLocaleDateString('en-US');

      const rowData = [
        dateStr,
        row.time, // Uses the clean "03:44 PM" format from the chart
        row.youtube,
        row.kick,
        row.total
      ];
      csvRows.push(rowData.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    const safeName = (campaignName || 'Campaign').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.setAttribute('href', url);
    a.setAttribute('download', `livekit_${safeName}_${syncCode}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center text-orange-500 font-mono tracking-widest text-sm"><Activity className="size-6 mr-3 animate-pulse" /> SYNCING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-zinc-100 p-5 sm:p-8 lg:p-10">
      <button onClick={() => router.push('/agency')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition mb-8"><ArrowLeft className="size-4" /> Back</button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-orange-400">Live Campaign</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1 font-mono">
            {campaignName ? `${campaignName} (${syncCode})` : syncCode}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SponsorPDFExport
            campaignName={campaignName || syncCode}
            creatorHandle={data[0]?.channel_name || data[0]?.sync_code || 'creator'}
            peakCcv={peakViewers}
            avgCcv={avgViewers}
            duration={formatDuration(durationSeconds)}
          />
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.06]">
            <Download className="size-3" /> EXPORT CSV
          </button>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> RECEIVING SIGNAL
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between"><p className="text-sm text-zinc-500">{peakTitle}</p><Users className="size-[18px] text-orange-400" /></div>
            <p className="mt-4 text-3xl font-semibold">{peakViewers.toLocaleString()}</p>
          </div>
          <p className="mt-5 text-[10.5px] text-zinc-500 leading-relaxed border-t border-white/[0.05] pt-3">{peakDesc}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between"><p className="text-sm text-zinc-500">{avgTitle}</p><Activity className="size-[18px] text-indigo-400" /></div>
            <p className="mt-4 text-3xl font-semibold">{avgViewers.toLocaleString()}</p>
          </div>
          <p className="mt-5 text-[10.5px] text-zinc-500 leading-relaxed border-t border-white/[0.05] pt-3">{avgDesc}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between"><p className="text-sm text-zinc-500">Stream Duration</p><Clock className="size-[18px] text-emerald-400" /></div>
            <p className="mt-4 text-3xl font-semibold">{formatDuration(durationSeconds)}</p>
          </div>
          <p className="mt-5 text-[10.5px] text-zinc-500 leading-relaxed border-t border-white/[0.05] pt-3">Maximum continuous broadcast time registered.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 sm:p-8 shadow-lg">
        <div className="mb-8">
          <h3 className="text-base font-semibold">Audience Retention</h3>
        </div>
        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorYt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorKick" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={11} minTickGap={30} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#52525b" fontSize={11} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip isMultiStream={isMultiStream} />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />

                {/* Un-stacked areas so they render independently beneath the total line */}
                {hasYouTube && (
                  <Area type="monotone" dataKey="youtube" name="YouTube" stroke="#f43f5e" strokeWidth={2} fill="url(#colorYt)" isAnimationActive={false} />
                )}
                {hasKick && (
                  <Area type="monotone" dataKey="kick" name="Kick" stroke="#22c55e" strokeWidth={2} fill="url(#colorKick)" isAnimationActive={false} />
                )}

                {/* Render explicit Combined line only if multi-stream */}
                {isMultiStream && (
                  <Line type="monotone" dataKey="total" name="Combined" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-600 gap-3 border border-dashed border-zinc-800 rounded-lg"><Radio className="animate-pulse" /> Awaiting telemetry...</div>
          )}
        </div>
      </div>

      {/* Subtle Footer Note */}
      <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
        <Info className="size-3.5" />
        <p>Telemetry data is captured only while the LiveKit Chrome Extension is actively running during the broadcast.</p>
      </div>
    </div>
  );
}
