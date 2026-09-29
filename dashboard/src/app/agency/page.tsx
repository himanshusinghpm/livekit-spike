'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activity, BarChart3, ChevronDown, Gauge, LayoutDashboard, LogOut, Menu, Plus, Radio, Settings, Users, X } from 'lucide-react';

function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Campaigns', icon: FileText },
  { label: 'Creator Roster', icon: Users },
  { label: 'Settings', icon: Settings },
];

// Dummy icon to prevent compile errors for unused nav items
function FileText(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>; }

function Avatar({ name, tone = 'orange' }: { name?: string; tone?: 'orange' | 'purple' | 'blue' | 'green' }) {
  const tones = { orange: 'bg-orange-500/15 text-orange-300', purple: 'bg-violet-500/15 text-violet-300', blue: 'bg-sky-500/15 text-sky-300', green: 'bg-emerald-500/15 text-emerald-300' }
  const initials = name ? name.split(' ').map((part) => part[0]).join('') : '?';
  return <span className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold ${tones[tone]}`}>{initials}</span>;
}

export default function AgencyHub() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [showModal, setShowModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [creator, setCreator] = useState('');

  // Macro-Stats State
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const [globalLiveCcv, setGlobalLiveCcv] = useState(0);
  const [allTimePeak, setAllTimePeak] = useState(0);

  // Auth barrier: no session => bounce to login, otherwise record the agency user id
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setAgencyId(session.user.id);
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Load actual campaigns from Supabase on mount
  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Fetch campaigns
      const { data: camps } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (camps) setCampaigns(camps);

      // 2. Fetch All-Time Peak Payload
      const { data: peakData } = await supabase.from('stream_intervals').select('interval_peak').order('interval_peak', { ascending: false }).limit(1);
      if (peakData && peakData.length > 0) setAllTimePeak(peakData[0].interval_peak);

      // 3. Fetch Active CCV (Find campaigns that sent telemetry in the last 2 minutes)
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: liveData } = await supabase.from('stream_intervals')
        .select('sync_code, platform, interval_peak')
        .gte('recorded_at', twoMinsAgo);

      if (liveData) {
        const activeCodes = new Set(liveData.map(r => r.sync_code));
        setActiveCampaignsCount(activeCodes.size);

        // Aggregate the highest recent ping per active stream
        const latestMap = new Map();
        liveData.forEach(row => {
            const key = `${row.sync_code}-${row.platform}`;
            latestMap.set(key, Math.max(latestMap.get(key) || 0, row.interval_peak));
        });
        const currentGlobalCcv = Array.from(latestMap.values()).reduce((sum, val) => sum + val, 0);
        setGlobalLiveCcv(currentGlobalCcv);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const generateSyncCode = async () => {
    if (!campaignName.trim() || !creator) return;
    setIsGenerating(true);
    const newCode = `LK-${Math.floor(Math.random() * 900 + 100)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    // Write directly to Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .insert([{ 
        campaign_name: campaignName.trim(), 
        sync_code: newCode, 
        agency_id: agencyId,
        creator_name: creator,
        status: 'pending' 
      }])
      .select();

    if (!error && data) {
      setCampaigns([data[0], ...campaigns]);
      setShowModal(false);
      setCampaignName('');
      setCreator('');
    } else {
      console.error("Failed to generate campaign:", error);
    }
    
    setIsGenerating(false);
  };

  if (loadingAuth) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-orange-500 font-mono tracking-widest text-sm">VERIFYING SECURE SESSION...</div>;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-zinc-100">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#101114] px-4 py-5 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-black text-black">L</span><span className="text-[15px] font-semibold tracking-tight">LumaLink <span className="text-zinc-500">/ Agency</span></span></div>
          <button aria-label="Close navigation" className="text-zinc-500 lg:hidden" onClick={() => setMobileNav(false)}><X /></button>
        </div>
        <div className="mt-11 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Workspace</div>
        <nav className="mt-3 flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); setMobileNav(false) }} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${activeNav === label ? 'bg-orange-500/10 font-medium text-orange-400' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'}`}><Icon className="size-[17px]" />{label}</button>)}
        </nav>
        <div className="mt-auto flex flex-col gap-4 border-t border-white/[0.07] pt-4">
          <div className="flex items-center gap-3 px-3"><Avatar name="Olivia Martin" tone="orange" /><div className="min-w-0"><p className="truncate text-xs font-medium">Olivia Martin</p><p className="truncate text-[11px] text-zinc-600">Agency admin</p></div><ChevronDown className="ml-auto size-3.5 text-zinc-600" /></div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-300"><LogOut className="size-[17px]" />Log Out</button>
        </div>
      </aside>

      {mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)} />}
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5 sm:px-8 lg:px-10"><div className="flex items-center gap-3"><button aria-label="Open navigation" className="text-zinc-400 lg:hidden" onClick={() => setMobileNav(true)}><Menu /></button><div><p className="text-xs text-zinc-600">Monday, September 28, 2026</p><h1 className="mt-0.5 text-lg font-semibold tracking-tight">Good morning, Olivia</h1></div></div><div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex"><span className="size-1.5 rounded-full bg-emerald-400" />All systems operational</span><button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400"><Plus className="size-4" />Create Campaign</button></div></header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-orange-400">Overview</p><h2 className="text-2xl font-semibold tracking-tight">Your campaigns at a glance</h2><p className="mt-1 text-sm text-zinc-500">Monitor live creator activity and provision new campaigns.</p></div><button className="hidden items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 sm:flex"><Activity className="size-4" />Last 30 days <ChevronDown className="size-3.5" /></button></div>
          <section aria-label="Campaign metrics" className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Active Streams Right Now', value: String(activeCampaignsCount).padStart(2, '0'), change: 'Transmitting telemetry', icon: Radio, accent: true },
              { label: 'Global Concurrent Viewers', value: globalLiveCcv.toLocaleString(), change: 'Across all active campaigns', icon: Users },
              { label: 'All-Time Peak Payload', value: allTimePeak.toLocaleString(), change: 'Highest single block recorded', icon: Gauge }
            ].map(({ label, value, change, icon: Icon, accent }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 shadow-lg">
                <div className="flex items-start justify-between"><p className="text-sm text-zinc-500">{label}</p><Icon className={`size-[18px] ${accent ? 'text-orange-400' : 'text-zinc-600'}`} /></div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
                <p className={`mt-2 text-xs ${accent ? 'text-orange-400' : 'text-zinc-600'}`}>{change}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-xl border border-white/[0.07] bg-[#111216] shadow-lg">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">Campaign Ledger</h3><p className="mt-1 text-xs text-zinc-600">Your provisioned campaigns and sync codes.</p></div></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    <th className="px-5 py-3 font-medium">Campaign Name</th>
                    <th className="px-5 py-3 font-medium">Sync Code</th>
                    <th className="px-5 py-3 font-medium">Assigned Creator</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead><tbody>{campaigns.map((campaign) => (
  <TableRow key={campaign.id} className="border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
          {campaign.sync_code ? campaign.sync_code.substring(0,2) : '?'}
        </div>
        <div>
          <div className="font-medium text-white">{campaign.campaign_name || campaign.sync_code}</div>
        </div>
      </div>
    </TableCell>
      <TableCell>
        <code className="text-xs font-mono text-zinc-400 bg-black/40 px-2 py-1 rounded border border-white/[0.05]">
          {campaign.sync_code}
        </code>
      </TableCell>
      <TableCell>
        <span className="text-zinc-300 font-mono text-xs">{campaign.creator_name || 'Pending Handshake'}</span>
      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => window.location.href = `/agency/campaign/${campaign.sync_code}`}
                          className="text-xs font-mono text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          View Telemetry
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {showModal && <div role="dialog" aria-modal="true" aria-label="Create campaign" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#15161a] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-orange-400">Campaign provisioning</p><h2 className="mt-2 text-xl font-semibold">Create a new campaign</h2><p className="mt-1 text-sm text-zinc-500">A unique Sync Code will be generated for your creator.</p></div><button aria-label="Close create campaign" onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-200"><X /></button></div><div className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">Campaign name<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="e.g. Summer Drop" className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-orange-500/60" /></label><label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">Assign creator<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="e.g. Creator Name" className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-orange-500/60" /></label></div><div className="mt-6 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-white/[0.09] py-2.5 text-xs text-zinc-400 hover:bg-white/[0.04]">Cancel</button><button disabled={!campaignName.trim() || !creator || isGenerating} onClick={generateSyncCode} className="flex-1 rounded-lg bg-orange-500 py-2.5 text-xs font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">{isGenerating ? 'Generating...' : 'Generate Sync Code'}</button></div></div></div>}
    </div>
  )
}
