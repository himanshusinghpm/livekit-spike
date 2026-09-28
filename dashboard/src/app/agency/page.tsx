'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activity, BarChart3, ChevronDown, CheckCircle2, Clipboard, Copy, FileText, Gauge, Key, LayoutDashboard, LogOut, Menu, Plus, Radio, Settings, Tv, Users, X } from 'lucide-react';

const ACTIVE_SYNC_CODE_KEY = 'lumalink:active-sync-code';

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
]

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // --- Merged v0 UI state (static dataset for now; Supabase array mapping is the next step) ---
  const [uiCampaigns, setUiCampaigns] = useState<any[]>([]);
  const [activeNav, setActiveNav] = useState('Overview');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [creator, setCreator] = useState('');

  const liveCampaigns = useMemo(() => uiCampaigns.filter((campaign) => campaign.status === 'Live'), [uiCampaigns]);
  const totalViewers = liveCampaigns.reduce((sum, campaign) => sum + Number(campaign.viewers.replace(',', '') || 0), 0);

  function createCampaign() {
    if (!campaignName.trim() || !creator) return;
    const existingCodes = new Set(uiCampaigns.map((campaign) => campaign.code));
    let code = '';
    do {
      code = `LK-${Math.floor(100 + Math.random() * 899)}`;
    } while (existingCodes.has(code));
    setUiCampaigns((current) => [{ name: campaignName.trim(), code, creator, status: 'Offline', viewers: '—', peak: '0', updated: 'just now' }, ...current]);
    setCampaignName('');
    setCreator('');
    setShowModal(false);
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

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
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setCampaigns(data);
      }
      setIsLoading(false);
    }
    fetchCampaigns();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    // Publish the issued code so the telemetry dashboard picks it up.
    localStorage.setItem(ACTIVE_SYNC_CODE_KEY, code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateSyncCode = async () => {
    setIsGenerating(true);
    // Cryptographically secure-looking code generation
    const newCode = `LK-${Math.floor(Math.random() * 900 + 100)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    // Write directly to Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .insert([{ 
        sync_code: newCode, 
        agency_id: agencyId,
        creator_name: 'Awaiting Link...',
        status: 'pending' 
      }])
      .select();

    if (!error && data) {
      setCampaigns([data[0], ...campaigns]);
      window.location.reload();
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
            {[{ label: 'Active Campaigns', value: String(liveCampaigns.length).padStart(2, '0'), change: '+2 this month', icon: Radio, accent: true }, { label: 'Total Concurrent Viewers', value: totalViewers.toLocaleString(), change: '+18.4% vs. last week', icon: Users }, { label: '30-Day Peak', value: '41,284', change: 'Sep 18, 2026', icon: Gauge }].map(({ label, value, change, icon: Icon, accent }) => <div key={label} className="rounded-xl border border-white/[0.07] bg-[#111216] p-5"><div className="flex items-start justify-between"><p className="text-sm text-zinc-500">{label}</p><Icon className={`size-[18px] ${accent ? 'text-orange-400' : 'text-zinc-600'}`} /></div><p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className={`mt-2 text-xs ${accent ? 'text-orange-400' : 'text-zinc-600'}`}>{change}</p></div>)}
          </section>

          <section className="mt-8 rounded-xl border border-white/[0.07] bg-[#111216]">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">Recent Campaigns</h3><p className="mt-1 text-xs text-zinc-600">Your latest creator activations and telemetry.</p></div><button className="flex items-center gap-2 self-start rounded-md border border-white/[0.09] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"><BarChart3 className="size-3.5" />Export report</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.14em] text-zinc-600"><th className="px-5 py-3 font-medium">Campaign Name</th><th className="px-5 py-3 font-medium">Sync Code</th><th className="px-5 py-3 font-medium">Assigned Creator</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Current / Peak Viewers</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead><tbody>{campaigns.map((campaign) => (
  <TableRow key={campaign.id} className="border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
          {campaign.sync_code ? campaign.sync_code.substring(0,2) : '?'}
        </div>
        <div>
          <div className="font-medium text-white">{campaign.sync_code}</div>
          <div className="text-xs text-slate-500 font-mono mt-1">Campaign ID</div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono text-slate-400 bg-black px-2 py-1 rounded border border-slate-800">
          {campaign.sync_code}
        </code>
      </div>
    </TableCell>
    <TableCell>
      <span className="text-slate-300 font-mono text-xs">
        {campaign.mapped_creator_id || 'Pending Handshake'}
      </span>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}`}></span>
        <span className="text-slate-300 text-sm">{campaign.status === 'active' ? 'Live' : 'Offline'}</span>
      </div>
    </TableCell>
    <TableCell>
      <span className="text-slate-500 font-mono text-xs">--</span>
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
))}</tbody></table></div>
          </section>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-[11px] text-zinc-700"><Clipboard className="size-3" />LumaLink telemetry is synced in real time</p>
        </main>
      </div>

      {copied && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-orange-500/30 bg-[#1a1713] px-4 py-2.5 text-xs text-orange-300 shadow-xl">Sync Code copied to clipboard</div>}
      {selectedCampaign && <div role="dialog" aria-modal="true" aria-label="Campaign telemetry" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#15161a] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-orange-400">Live telemetry</p><h2 className="mt-2 text-xl font-semibold">{selectedCampaign.name}</h2></div><button aria-label="Close telemetry" onClick={() => setSelectedCampaign(null)} className="text-zinc-500 hover:text-zinc-200"><X /></button></div><div className="mt-6 grid grid-cols-2 gap-3">{[['Status', selectedCampaign.status], ['Sync Code', selectedCampaign.code], ['Current viewers', selectedCampaign.viewers], ['30-day peak', selectedCampaign.peak]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[11px] text-zinc-600">{label}</p><p className="mt-2 font-mono text-sm text-zinc-200">{value}</p></div>)}</div><button onClick={() => setSelectedCampaign(null)} className="mt-6 w-full rounded-lg border border-white/[0.09] py-2.5 text-xs text-zinc-400 hover:bg-white/[0.04]">Close</button></div></div>}
      {showModal && <div role="dialog" aria-modal="true" aria-label="Create campaign" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#15161a] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-orange-400">Campaign provisioning</p><h2 className="mt-2 text-xl font-semibold">Create a new campaign</h2><p className="mt-1 text-sm text-zinc-500">A unique Sync Code will be generated for your creator.</p></div><button aria-label="Close create campaign" onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-200"><X /></button></div><div className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">Campaign name<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="e.g. Summer Drop" className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-orange-500/60" /></label><label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">Assign creator<select value={creator} onChange={(event) => setCreator(event.target.value)} className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-orange-500/60"><option value="" className="bg-[#15161a]">Select a creator</option><option className="bg-[#15161a]">Maya Chen</option><option className="bg-[#15161a]">Jordan Ellis</option><option className="bg-[#15161a]">Avery Brooks</option><option className="bg-[#15161a]">Sam Rivera</option></select></label></div><div className="mt-6 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-white/[0.09] py-2.5 text-xs text-zinc-400 hover:bg-white/[0.04]">Cancel</button><button disabled={!campaignName.trim() || !creator} onClick={generateSyncCode} className="flex-1 rounded-lg bg-orange-500 py-2.5 text-xs font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">Generate Sync Code</button></div></div></div>}
    </div>
  )
}
