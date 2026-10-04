'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activity, ChevronDown, Gauge, LayoutDashboard, LogOut, Menu, Plus, Radio, Settings, Users, X } from 'lucide-react';

function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Settings', icon: Settings },
];

function Avatar({ name, tone = 'orange' }: { name?: string; tone?: 'orange' | 'purple' | 'blue' | 'green' }) {
  const tones = { orange: 'bg-orange-500/15 text-orange-300', purple: 'bg-violet-500/15 text-violet-300', blue: 'bg-sky-500/15 text-sky-300', green: 'bg-emerald-500/15 text-emerald-300' }
  const initials = name ? name.split(' ').map((part) => part[0]).join('') : '?';
  return <span className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold ${tones[tone]}`}>{initials.substring(0, 2).toUpperCase()}</span>;
}

function EmptyCampaignState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-950/30 w-full">
      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 ring-1 ring-orange-500/20">
        <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-zinc-100 mb-2">No active campaigns yet</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
        Generate your first secure tracking link to start monitoring live creator telemetry and audience data instantly.
      </p>
      <button onClick={onCreateClick} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-md font-medium transition-all text-sm shadow-lg shadow-orange-500/20">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Campaign
      </button>
    </div>
  );
}

export default function AgencyHub() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string>('Agency');
  const [userEmail, setUserEmail] = useState<string>('');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [showModal, setShowModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [creator, setCreator] = useState('');

  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const [globalLiveCcv, setGlobalLiveCcv] = useState(0);
  const [allTimePeak, setAllTimePeak] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setAgencyId(session.user.id);
        setUserEmail(session.user.email || '');
        
        const { data: agencyData } = await supabase
          .from('leads')
          .select('agency_name')
          .eq('email', session.user.email)
          .single();
          
        if (agencyData && agencyData.agency_name) {
          setAgencyName(agencyData.agency_name);
        }
        
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!agencyId) return;

    async function fetchDashboardData() {
      const { data: camps } = await supabase
        .from('campaigns')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
        
      if (camps) setCampaigns(camps);

      if (!camps || camps.length === 0) {
        setAllTimePeak(0);
        setActiveCampaignsCount(0);
        setGlobalLiveCcv(0);
        return;
      }

      const syncCodes = camps.map(c => c.sync_code);

      const { data: peakData } = await supabase
        .from('stream_intervals')
        .select('interval_peak')
        .in('sync_code', syncCodes)
        .order('interval_peak', { ascending: false })
        .limit(1);
        
      if (peakData && peakData.length > 0) {
        setAllTimePeak(peakData[0].interval_peak);
      } else {
        setAllTimePeak(0);
      }

      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: liveData } = await supabase.from('stream_intervals')
        .select('sync_code, platform, interval_peak')
        .in('sync_code', syncCodes)
        .gte('recorded_at', twoMinsAgo);

      if (liveData) {
        const activeCodes = new Set(liveData.map(r => r.sync_code));
        setActiveCampaignsCount(activeCodes.size);

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
  }, [agencyId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generateSyncCode = async () => {
    if (!campaignName.trim() || !creator) return;
    setIsGenerating(true);
    const newCode = `LK-${Math.floor(Math.random() * 900 + 100)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
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
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-black text-black">L</span>
            <span className="text-[15px] font-semibold tracking-tight">LiveKit <span className="text-zinc-500">/ Agency</span></span>
          </div>
          <button aria-label="Close navigation" className="text-zinc-500 lg:hidden" onClick={() => setMobileNav(false)}><X /></button>
        </div>
        
        <div className="mt-11 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Workspace</div>
        <nav className="mt-3 flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => { setActiveNav(label); setMobileNav(false) }} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${activeNav === label ? 'bg-orange-500/10 font-medium text-orange-400' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'}`}>
              <Icon className="size-[17px]" />{label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto flex flex-col gap-4 border-t border-white/[0.07] pt-4">
          <div className="flex items-center gap-3 px-3">
            <Avatar name={agencyName} tone="orange" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{agencyName}</p>
              <p className="truncate text-[11px] text-zinc-600">Agency Admin</p>
            </div>
            <ChevronDown className="ml-auto size-3.5 text-zinc-600" />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-300">
            <LogOut className="size-[17px]" />Log Out
          </button>
        </div>
      </aside>

      {mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)} />}
      
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" className="text-zinc-400 lg:hidden" onClick={() => setMobileNav(true)}><Menu /></button>
            <div>
              <p className="text-xs text-zinc-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight">Good morning, {agencyName.split(' ')[0]}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400" />All systems operational
            </span>
            {activeNav === 'Overview' && (
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-black shadow-lg shadow-orange-500/10 transition hover:bg-orange-400">
                <Plus className="size-4" />Create Campaign
              </button>
            )}
          </div>
        </header>
        
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {activeNav === 'Overview' ? (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-orange-400">Overview</p>
                  <h2 className="text-2xl font-semibold tracking-tight">Your campaigns at a glance</h2>
                  <p className="mt-1 text-sm text-zinc-500">Monitor live creator activity and provision new campaigns.</p>
                </div>
                <button className="hidden items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 sm:flex">
                  <Activity className="size-4" />Last 30 days <ChevronDown className="size-3.5" />
                </button>
              </div>
              
              <section aria-label="Campaign metrics" className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Active Streams Right Now', value: String(activeCampaignsCount).padStart(2, '0'), change: 'Transmitting telemetry', icon: Radio, accent: true },
                  { label: 'Global Concurrent Viewers', value: globalLiveCcv.toLocaleString(), change: 'Across all active campaigns', icon: Users },
                  { label: 'All-Time Peak CCV', value: allTimePeak.toLocaleString(), change: 'Highest simultaneous audience reached', icon: Gauge }
                ].map(({ label, value, change, icon: Icon, accent }) => (
                  <div key={label} className="rounded-xl border border-white/[0.07] bg-[#111216] p-5 shadow-lg">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-zinc-500">{label}</p>
                      <Icon className={`size-[18px] ${accent ? 'text-orange-400' : 'text-zinc-600'}`} />
                    </div>
                    <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
                    <p className={`mt-2 text-xs ${accent ? 'text-orange-400' : 'text-zinc-600'}`}>{change}</p>
                  </div>
                ))}
              </section>

              <section className="mt-8 rounded-xl border border-white/[0.07] bg-[#111216] shadow-lg">
                <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Campaign Ledger</h3>
                    <p className="mt-1 text-xs text-zinc-600">Your provisioned campaigns and sync codes.</p>
                  </div>
                </div>
                
                {campaigns.length === 0 ? (
                  <EmptyCampaignState onCreateClick={() => setShowModal(true)} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          <th className="px-5 py-3 font-medium">Campaign Name</th>
                          <th className="px-5 py-3 font-medium">Sync Code</th>
                          <th className="px-5 py-3 font-medium">Assigned Creator</th>
                          <th className="px-5 py-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
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
                )}
              </section>
            </>
          ) : (
            <div className="max-w-3xl space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight">Workspace Settings</h2>
                <p className="mt-1 text-sm text-zinc-500">Manage your agency profile and billing preferences.</p>
              </div>

              <section className="rounded-xl border border-white/[0.07] bg-[#111216] overflow-hidden shadow-lg">
                <div className="border-b border-white/[0.07] px-6 py-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Agency Profile</h3>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Workspace Name</p>
                    <p className="text-sm font-medium text-zinc-200">{agencyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Administrator Email</p>
                    <p className="text-sm font-medium text-zinc-200">{userEmail}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#111216] overflow-hidden shadow-lg">
                <div className="border-b border-white/[0.07] px-6 py-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Billing & Subscription</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                    We partner with Dodo Payments as our secure Merchant of Record. You can upgrade your tier, update your payment method, cancel your subscription, or download tax invoices directly from your secure customer portal.
                  </p>
                  <a href="https://customer.dodopayments.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors border border-white/[0.05]">
                    Open Billing Portal
                    <svg className="size-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </section>
              
              <section className="rounded-xl border border-white/[0.07] bg-[#111216] overflow-hidden shadow-lg">
                <div className="border-b border-white/[0.07] px-6 py-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Support</h3>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Need engineering support?</p>
                    <p className="text-sm text-zinc-500 mt-1">Contact us directly for custom telemetry integrations.</p>
                  </div>
                  <a href="mailto:livekit.support@gmail.com" className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors">
                    livekit.support@gmail.com
                  </a>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div role="dialog" aria-modal="true" aria-label="Create campaign" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#15161a] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-orange-400">Campaign provisioning</p>
                <h2 className="mt-2 text-xl font-semibold">Create a new campaign</h2>
                <p className="mt-1 text-sm text-zinc-500">A unique Sync Code will be generated for your creator.</p>
              </div>
              <button aria-label="Close create campaign" onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-200">
                <X />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">
                Campaign name
                <input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="e.g. Summer Drop" className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-orange-500/60" />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-zinc-400">
                Assign creator
                <input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="e.g. Creator Name" className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-orange-500/60" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-white/[0.09] py-2.5 text-xs text-zinc-400 hover:bg-white/[0.04]">Cancel</button>
              <button disabled={!campaignName.trim() || !creator || isGenerating} onClick={generateSyncCode} className="flex-1 rounded-lg bg-orange-500 py-2.5 text-xs font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">
                {isGenerating ? 'Generating...' : 'Generate Sync Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}