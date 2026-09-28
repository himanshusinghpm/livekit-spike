'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { Activity, ArrowUpRight, BarChart3, Check, ChevronRight, CircleDot, Clock, Code2, Download, Gauge, Instagram, Layers3, LayoutDashboard, LogOut, Menu, Play, Radio, ShieldCheck, Sparkles, Users, Youtube } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Download,
    title: 'Install the extension',
    description: 'Add LiveKit to Chrome in seconds. It stays out of your way until you go live.',
  },
  {
    number: '02',
    icon: Code2,
    title: "Connect your sponsor's Sync Code",
    description: 'Paste one secure code to map your stream data to the right campaign.',
  },
  {
    number: '03',
    icon: Radio,
    title: 'Go live. We handle the data layer.',
    description: 'Your telemetry flows in real time across every platform, without API limits.',
  },
]

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex size-8 items-center justify-center rounded-lg bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.45)]">
        <div className="size-3.5 rounded-[4px] border-2 border-white" />
        <div className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-orange-400" />
      </div>
      <span className="text-[17px] font-semibold tracking-[-0.04em] text-white">LiveKit</span>
    </div>
  )
}


function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-8 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
            </div>
            <span className="ml-2 font-mono text-[10px] text-white/40">LIVEKIT / OVERVIEW</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-4">
          {[
            ['TOTAL VIEWERS', '42,891', '+18.4%'],
            ['AVG. WATCH TIME', '48:32', '+6.2%'],
            ['ENGAGEMENT', '8.64%', '+2.1%'],
            ['SPONSOR REACH', '91.2K', '+24.8%'],
          ].map(([label, value, change]) => (
            <div className="bg-[#111114] px-4 py-4" key={label}>
              <p className="font-mono text-[9px] tracking-wider text-white/35">{label}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">{value}</p>
              <p className="mt-1 text-[10px] text-emerald-400">{change}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_170px] sm:p-5">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/75">Concurrent reach</p>
                <p className="mt-1 text-[10px] text-white/35">YouTube + Kick · Last 60 minutes</p>
              </div>
              <div className="flex gap-3 text-[10px] text-white/40"><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-indigo-400" /> YouTube</span><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-orange-400" /> Kick</span></div>
            </div>
            <div className="relative h-28 overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between"><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /></div>
              <svg viewBox="0 0 560 120" preserveAspectRatio="none" className="absolute inset-0 size-full">
                <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#818cf8" stopOpacity=".3" /><stop offset="1" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 90 C38 88 42 62 78 70 S119 92 150 54 S190 78 222 48 S255 64 290 38 S330 49 355 30 S390 52 420 28 S460 45 490 20 S530 32 560 10 V120 H0Z" fill="url(#area)" />
                <path d="M0 90 C38 88 42 62 78 70 S119 92 150 54 S190 78 222 48 S255 64 290 38 S330 49 355 30 S390 52 420 28 S460 45 490 20 S530 32 560 10" fill="none" stroke="#818cf8" strokeWidth="2" />
                <path d="M0 108 C45 104 65 92 102 98 S160 105 190 82 S240 95 280 70 S335 90 370 63 S425 82 455 59 S515 74 560 46" fill="none" stroke="#fb923c" strokeWidth="2" strokeDasharray="5 4" />
              </svg>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-xs font-medium text-white/75">Platform split</p>
            <div className="relative mx-auto mt-5 flex size-28 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#818cf8 0 68%, #fb923c 68% 92%, #ffffff18 92% 100%)' }}><div className="flex size-[76px] flex-col items-center justify-center rounded-full bg-[#151518]"><span className="text-lg font-semibold text-white">92%</span><span className="text-[9px] text-white/35">tracked</span></div></div>
            <div className="mt-4 flex flex-col gap-2 text-[10px] text-white/45"><span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-indigo-400" /> YouTube</span><b className="font-medium text-white/70">68%</b></span><span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-orange-400" /> Kick</span><b className="font-medium text-white/70">24%</b></span></div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3 sm:px-5"><span className="flex items-center gap-2 text-[10px] text-white/35"><ShieldCheck className="size-3 text-indigo-400" /> Sponsor data encrypted</span><span className="font-mono text-[10px] text-white/30">SYNC_8F2A91</span></div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const [data, setData] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Primary query key: the campaign sync code issued by the Agency dashboard.
  const [activeSyncCode, setActiveSyncCode] = useState('LK-437-SNN');

  useEffect(() => {
    async function fetchTelemetry() {
      const { data: intervals, error } = await supabase
        .from('stream_intervals')
        .select('*')
        .eq('sync_code', activeSyncCode)
        .order('recorded_at', { ascending: true });

      if (error) return console.error('Error fetching data:', error);

      // Group cleanly by Calendar Date (Campaign Day)
      const dateMap = new Map();
      
      intervals.forEach(row => {
        if (!row.recorded_at) return;
        const d = new Date(row.recorded_at);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            id: dateStr,
            name: `Campaign: ${dateStr}`,
            data: [],
            kickId: null,
            ytId: null
          });
        }
        
        const cluster = dateMap.get(dateStr);
        cluster.data.push(row);
        
        if (row.platform === 'kick' && row.session_id) cluster.kickId = row.session_id;
        if (row.platform === 'youtube' && row.session_id) cluster.ytId = row.session_id;
      });

      const builtClusters = Array.from(dateMap.values());
      setClusters(builtClusters);
      
      const activeCluster = selectedClusterId 
        ? builtClusters.find(c => c.id === selectedClusterId) 
        : (builtClusters.length > 0 ? builtClusters[builtClusters.length - 1] : null);
        
      if (!selectedClusterId && activeCluster) setSelectedClusterId(activeCluster.id);

      // Map/Reduce for the active date
      const timeMap = new Map();
      
      if (activeCluster) {
        activeCluster.data.forEach((row: any) => {
          const date = new Date(row.recorded_at);
          date.setSeconds(0, 0); 
          // Syntax fixed here, using en-US for SSR safety
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          if (!timeMap.has(timeStr)) {
            timeMap.set(timeStr, { timeLabel: timeStr, kick: 0, youtube: 0, total: 0 });
          }

          const entry = timeMap.get(timeStr);
          if (row.platform === 'kick') entry.kick = row.interval_peak || 0;
          if (row.platform === 'youtube') entry.youtube = row.interval_peak || 0;
          entry.total = entry.kick + entry.youtube;
        });
      }

      setData(Array.from(timeMap.values()));
      setLoading(false);
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000);
    return () => clearInterval(interval);
  }, [activeSyncCode, selectedClusterId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-orange-500 font-mono animate-pulse">Establishing Broadcast Link...</div>;

  const peakTotal = Math.max(...data.map(d => d.total || 0), 0);
  const avgTotal = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.total || 0), 0) / data.length) : 0;
  
  const activeClusterData = clusters.find(c => c.id === selectedClusterId);
  const kickLegend = activeClusterData?.kickId ? `Kick (${activeClusterData.kickId})` : "Kick";
  const ytLegend = activeClusterData?.ytId ? `YouTube (${activeClusterData.ytId})` : "YouTube";

  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0a0a] text-white selection:bg-indigo-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="LiveKit home"><BrandMark /></Link>
        <div className="hidden items-center gap-8 text-sm text-white/45 md:flex"><a className="transition-colors hover:text-white" href="#creators">For Creators</a><a className="transition-colors hover:text-white" href="#agencies">For Agencies</a><a className="transition-colors hover:text-white" href="#pricing">Pricing</a></div>
        <div className="flex items-center gap-3"><Link href="/login" className="hidden px-3 py-2 text-sm text-white/55 transition-colors hover:text-white sm:block">Login</Link><a href="#download" className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3.5 py-2.5 text-xs font-medium text-white transition-all hover:border-white/20 hover:bg-white/[0.13] sm:px-4 sm:text-sm"><Download className="size-3.5" /> <span className="hidden sm:inline">Download Extension</span><span className="sm:hidden">Download</span></a><button className="rounded-lg border border-white/10 p-2 text-white/60 md:hidden" aria-label="Open menu"><Menu className="size-4" /></button></div>
      </nav>
        
      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-10 lg:pt-36">
        <div className="absolute left-1/2 top-20 size-[500px] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-indigo-300"><Sparkles className="size-3" /> THE TELEMETRY LAYER FOR THE CREATOR ECONOMY</div><h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[92px]">Zero-Friction<br /><span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-orange-300 bg-clip-text text-transparent">Livestream Telemetry.</span></h1><p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-white/45 sm:text-lg">The only real-time analytics engine built for cross-platform creators and the agencies that sponsor them. Track YouTube and Kick concurrently without API limits.</p><div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><a href="#download" className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.28)] transition-all hover:bg-indigo-400 sm:w-auto">Get the Chrome Extension <ArrowUpRight className="size-4" /></a><a href="#agencies" className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-400/30 bg-orange-400/[0.06] px-5 py-3.5 text-sm font-medium text-orange-200 transition-all hover:border-orange-300/60 hover:bg-orange-400/10 sm:w-auto">Agency Portal <ChevronRight className="size-4" /></a></div><div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/30"><Check className="size-3 text-emerald-400" /> Free to install</div></div>
        <div className="relative mt-20 sm:mt-24"><DashboardMockup /></div>
      </section>

      <section className="relative border-y border-white/[0.07] bg-white/[0.015]" id="creators">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">01 / How it works</p>
              <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Your stream.<br /><span className="text-white/35">Your data.</span></h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/40 lg:pb-1">LiveKit turns fragmented platform signals into one clean, sponsor-ready source of truth. No dashboards to juggle. No API keys to babysit.</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div className="bg-[#0d0d0f] p-6 sm:p-8" key={number}>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-400/10 text-indigo-300"><Icon className="size-4" /></div>
                  <span className="font-mono text-xs text-white/20">{number}</span>
                </div>
                <h3 className="mt-9 text-base font-medium text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/40">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10" id="agencies">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-400/10 text-orange-300"><BarChart3 className="size-5" /></div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-orange-300">Built for scale</p>
            <h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">The signal behind every <span className="text-orange-300">sponsored stream.</span></h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/40">Creators get a frictionless workflow. Agencies get verified performance data they can trust, export, and report on.</p>
            <div className="mt-8 flex flex-col gap-3 text-sm text-white/65">
              <span className="flex items-center gap-3"><Gauge className="size-4 text-indigo-400" /> Real-time campaign attribution</span>
              <span className="flex items-center gap-3"><Layers3 className="size-4 text-indigo-400" /> One view across every platform</span>
              <span className="flex items-center gap-3"><Users className="size-4 text-indigo-400" /> Built for teams, not spreadsheets</span>
            </div>
          </div>
          <div className="relative rounded-2xl border border-orange-300/10 bg-gradient-to-br from-orange-400/[0.08] to-indigo-500/[0.05] p-7 sm:p-10">
            <div className="absolute right-0 top-0 size-40 rounded-full bg-orange-400/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><span className="text-sm font-medium">Campaign health</span><span className="flex items-center gap-1.5 text-xs text-emerald-300"><CircleDot className="size-3" /> All systems nominal</span></div>
              <div className="mt-8 flex items-end gap-3"><span className="text-6xl font-semibold tracking-[-0.08em]">94.8</span><span className="mb-2 text-sm text-white/35">/ 100 score</span></div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full w-[95%] rounded-full bg-gradient-to-r from-orange-300 to-indigo-400" /></div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {[
                  ['Campaigns tracked', '128'],
                  ['Verified impressions', '4.2M'],
                  ['Payout accuracy', '99.9%'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">{label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link href="/" aria-label="LiveKit home"><BrandMark /></Link>
          <div className="flex items-center gap-5"><a href="#privacy" className="transition-colors hover:text-white/70">Privacy Policy</a><a href="#terms" className="transition-colors hover:text-white/70">Terms of Service</a><span>© 2025 LiveKit, Inc.</span></div>
        </div>
      </footer>
          
    </main>
  );
}