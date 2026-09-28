'use client';

import { useState } from 'react';
import { Link as LinkIcon, CheckCircle2, Zap, Activity, ArrowUpRight, Check, ChevronDown, Copy, X, CircleHelp, KeyRound, LogOut, MoreHorizontal, Plus, Settings, ShieldCheck, Sparkles, Trash2, UserRound, Users, Video } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Local stand-ins for the shadcn/ui primitives the v0 export was written
// against (@/components/ui/* is not installed in this project). The markup from
// v0 is unchanged; only these wrappers are supplied locally.
// ---------------------------------------------------------------------------
function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border', className)} {...props} />;
}

function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold', className)} {...props} />;
}

function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

function Badge({ className = '', variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'outline' | 'secondary' | 'destructive' }) {
  const variants = {
    default: 'border-transparent bg-indigo-500 text-white',
    outline: 'border-white/10',
    secondary: 'border-transparent bg-white/[0.06] text-slate-300',
    destructive: 'border-transparent bg-rose-500/90 text-white',
  };
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />;
}

function Separator({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn('h-px w-full', className)} {...props} />;
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('flex w-full rounded-lg border px-3 py-2 text-sm outline-none', className)} {...props} />;
}

function Avatar({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}

function AvatarFallback({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('flex size-full items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium', className)} {...props} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
};

function Button({ variant = 'default', size = 'default', className = '', ...props }: ButtonProps) {
  const variants = {
    default: 'bg-indigo-500 text-white hover:bg-indigo-400',
    outline: 'border border-white/10 bg-transparent text-slate-300 hover:bg-white/[0.06]',
    ghost: 'bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white',
  };
  const sizes = { default: 'h-9 px-4', sm: 'h-8 px-3 text-xs', icon: 'size-9' };
  return <button className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40', variants[variant], sizes[size], className)} {...props} />;
}

type ChartConfig = Record<string, { label?: string; color?: string }>;

function ChartContainer({ config, className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }) {
  const style: Record<string, string> = {};
  Object.entries(config).forEach(([key, entry]) => {
    if (entry.color) style[`--color-${key}`] = entry.color;
  });
  return <div className={cn(className)} style={style as React.CSSProperties} {...props}>{children}</div>;
}

type TooltipItem = { name?: string; dataKey?: string; value?: number | string; color?: string };

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string | number; indicator?: 'line' | 'dot' | 'dashed' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-slate-500">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="uppercase tracking-wide text-slate-400">{item.name ?? item.dataKey}</span>
            <span className="ml-auto font-mono text-slate-200">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const chartData = [
  { month: 'Jan', kick: 19000, youtube: 28000 },
  { month: 'Feb', kick: 24000, youtube: 35000 },
  { month: 'Mar', kick: 22000, youtube: 43000 },
  { month: 'Apr', kick: 31000, youtube: 52000 },
  { month: 'May', kick: 28000, youtube: 47000 },
  { month: 'Jun', kick: 39000, youtube: 64000 },
  { month: 'Jul', kick: 47000, youtube: 76000 },
  { month: 'Aug', kick: 42000, youtube: 89000 },
  { month: 'Sep', kick: 58000, youtube: 106000 },
  { month: 'Oct', kick: 52000, youtube: 99000 },
  { month: 'Nov', kick: 69000, youtube: 126000 },
  { month: 'Dec', kick: 84000, youtube: 148000 },
]

const chartConfig = {
  youtube: { label: 'YouTube', color: 'var(--chart-1)' },
  kick: { label: 'Kick', color: 'var(--chart-2)' },
}

const initialSponsors = [
  { name: 'Northstar Collective', initials: 'NC', type: 'Talent agency', connected: 'Connected 12 days ago', tone: 'bg-violet-500/15 text-violet-300' },
  { name: 'Orbit Media Group', initials: 'OM', type: 'Brand partnerships', connected: 'Connected 28 days ago', tone: 'bg-cyan-500/15 text-cyan-300' },
]

function MetricCard({ label, value, detail, icon: Icon, live, action }: { label: string; value: string; detail: string; icon: typeof Activity; live?: boolean; action?: React.ReactNode }) {
  return (
    <Card className="border-white/[0.07] bg-white/[0.035] shadow-none">
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            <Icon className="size-3.5 text-indigo-400" />
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-slate-100">{value}</span>
            {live && <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE</span>}
          </div>
          <span className="text-xs text-slate-500">{detail}</span>
        </div>
        {action ?? <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 text-slate-500"><ArrowUpRight className="size-4" /></div>}
      </CardContent>
    </Card>
  )
}

export default function CreatorPortal() {
  // ---- preserved backend state & logic ----
  const [sponsorCode, setSponsorCode] = useState('');
  const [creatorId, setCreatorId] = useState('CR-999');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkCampaign = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Verify the campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('sync_code', sponsorCode)
      .single();

    if (fetchError || !campaign) {
      setError('Invalid Sponsor Code. Please check the code and try again.');
      setLoading(false);
      return;
    }

    // 2. Update the campaign with the Creator's ID
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ mapped_creator_id: creatorId })
      .eq('sync_code', sponsorCode);

    if (updateError) {
      setError('Failed to link campaign. Please try again.');
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  // ---- v0 UI state ----
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [copied, setCopied] = useState(false);

  function copyCreatorId() {
    navigator.clipboard.writeText(creatorId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function revokeAgency(name: string) {
    const confirmed = window.confirm(`Revoke ${name}'s access to your creator data? This action cannot be undone.`);
    if (!confirmed) return;
    setSponsors((current) => current.filter((sponsor) => sponsor.name !== name));
  }

  return (
    <main className="min-h-screen bg-[#080a12] text-slate-100">
      <header className="border-b border-white/[0.07] bg-[#080a12]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]"><Sparkles className="size-4" /></div><span className="text-sm font-semibold tracking-tight">STUDIO<span className="text-indigo-400">/</span>CREATOR</span></div>
            <div className="hidden h-5 w-px bg-white/10 sm:block" />
            <span className="hidden text-xs text-slate-500 sm:block">Creator command center</span>
          </div>
          <nav className="flex items-center gap-1" aria-label="Account navigation">
            <Button variant="ghost" size="sm" className="hidden gap-2 text-slate-400 hover:bg-white/[0.06] hover:text-white sm:flex"><UserRound data-icon="inline-start" /> Profile</Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-white/[0.06] hover:text-white sm:hidden" aria-label="Profile"><UserRound /></Button>
            <Button variant="ghost" size="sm" className="hidden gap-2 text-slate-400 hover:bg-white/[0.06] hover:text-white sm:flex"><Settings data-icon="inline-start" /> Settings</Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-white/[0.06] hover:text-white sm:hidden" aria-label="Settings"><Settings /></Button>
            <Button variant="ghost" size="sm" className="ml-1 gap-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"><LogOut data-icon="inline-start" /> <span className="hidden sm:inline">Log out</span></Button>
            <Avatar className="ml-3 size-8 border border-indigo-400/40"><AvatarFallback className="bg-indigo-500/15 text-xs text-indigo-200">JM</AvatarFallback></Avatar>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
        <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-400"><span className="size-1.5 rounded-full bg-indigo-400" /> Overview</div><h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Good morning, Jordan.</h1><p className="mt-2 text-sm text-slate-500">Here&apos;s what&apos;s happening across your creator ecosystem.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className="size-1.5 rounded-full bg-emerald-400" /> Synced 2 mins ago <Button variant="ghost" size="icon" className="size-7 text-slate-500 hover:text-white" aria-label="More options"><MoreHorizontal /></Button></div></section>

        <section className="mb-5 grid gap-3 sm:grid-cols-3"><MetricCard label="Personal Creator ID" value="CR-999" detail="Verified creator account" icon={KeyRound} action={<Button onClick={copyCreatorId} variant="ghost" size="icon" className="size-9 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-300" aria-label="Copy personal creator ID"><Copy />{copied && <span className="sr-only">Copied</span>}</Button>} /><MetricCard label="Lifetime peak viewers" value="184.6K" detail="Across all platforms" icon={Users} /><MetricCard label="Current live viewers" value="12,842" detail="Streaming on YouTube" icon={Video} live /></section>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-white/[0.06] p-5 pb-4 sm:p-6"><div><div className="flex items-center gap-2"><CardTitle className="text-base font-medium text-slate-100">Recent Stream Performance</CardTitle><Badge variant="outline" className="border-indigo-400/20 bg-indigo-500/10 text-[10px] font-normal text-indigo-300">ALL TIME</Badge></div><p className="mt-1.5 text-xs text-slate-500">Minute-by-minute CCV across platforms</p></div><Button variant="outline" size="sm" className="hidden border-white/10 bg-transparent text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white sm:flex">Last Stream <ChevronDown data-icon="inline-end" /></Button></CardHeader><CardContent className="p-3 pt-6 sm:p-6 sm:pt-7"><ChartContainer config={chartConfig} className="h-[300px] w-full"><AreaChart data={chartData} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="youtubeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-youtube)" stopOpacity={0.24} /><stop offset="95%" stopColor="var(--color-youtube)" stopOpacity={0} /></linearGradient><linearGradient id="kickFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-kick)" stopOpacity={0.12} /><stop offset="95%" stopColor="var(--color-kick)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(148,163,184,0.09)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip content={<ChartTooltipContent indicator="line" />} /><Area type="monotone" dataKey="youtube" stroke="var(--color-youtube)" strokeWidth={2.5} fill="url(#youtubeFill)" /><Area type="monotone" dataKey="kick" stroke="var(--color-kick)" strokeWidth={2} fill="url(#kickFill)" /></AreaChart></ChartContainer><div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-indigo-300" /> YouTube</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-400" /> Kick</span><span className="ml-2 hidden text-slate-600 sm:inline">•</span><span className="hidden sm:inline">Total: 1.84M viewers</span></div></CardContent></Card>

          <Card className="border-white/[0.07] bg-white/[0.035] shadow-none"><CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><CardTitle className="text-base font-medium text-slate-100">Agency handshakes</CardTitle><ShieldCheck className="size-4 text-indigo-400" /></div><p className="mt-1.5 text-xs text-slate-500">Manage who can access your data</p></div><Badge className="border-0 bg-emerald-500/10 text-[10px] font-medium text-emerald-400">{sponsors.length} ACTIVE</Badge></div></CardHeader><CardContent className="flex flex-col gap-5 p-5 pt-1 sm:p-6 sm:pt-1"><div className="flex flex-col gap-3"><label htmlFor="sponsor-code" className="text-xs font-medium text-slate-400">Agency sponsor code</label><div className="flex gap-2"><Input id="sponsor-code" value={code} onChange={(event) => { setCode(event.target.value); setConnected(false) }} placeholder="AGENCY-XXXX-XXXX" className="h-10 border-white/10 bg-black/20 font-mono text-xs uppercase placeholder:text-slate-600 focus-visible:ring-indigo-500" /><Button onClick={connectAgency} size="icon" className="size-10 shrink-0 bg-indigo-500 text-white hover:bg-indigo-400" aria-label="Authorize sponsor"><Plus /></Button></div><p className="text-[11px] leading-relaxed text-slate-600">Paste the unique code from your agency to authorize a secure connection.</p>{connected && <p className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="size-3.5" /> Agency connection authorized</p>}</div><Separator className="bg-white/[0.06]" /><div className="flex flex-col gap-1"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-400">Active connections</span><CircleHelp className="size-3.5 text-slate-600" /></div>{sponsors.map((sponsor) => <div key={`${sponsor.name}-${sponsor.connected}`} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-3"><Button onClick={() => revokeAgency(sponsor.name)} variant="ghost" size="icon" className="order-last size-8 shrink-0 text-slate-500 hover:bg-red-500/10 hover:text-red-300" aria-label={`Revoke access for ${sponsor.name}`}><Trash2 /></Button><Avatar className={`size-9 ${sponsor.tone}`}><AvatarFallback className={`text-[11px] font-semibold ${sponsor.tone}`}>{sponsor.initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{sponsor.name}</p><p className="mt-1 text-[11px] text-slate-600">{sponsor.type} · {sponsor.connected}</p></div><Button variant="ghost" size="icon" className="size-7 text-slate-700 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100" aria-label={`Remove ${sponsor.name}`} onClick={() => setSponsors((current) => current.filter((item) => item.name !== sponsor.name))}><Trash2 /></Button></div>)}</div><div className="mt-auto flex items-center gap-2 rounded-lg border border-indigo-400/10 bg-indigo-500/[0.06] p-3 text-[11px] leading-relaxed text-indigo-200/60"><ShieldCheck className="size-4 shrink-0 text-indigo-400" /> You&apos;re always in control. Revoke access at any time.</div></CardContent></Card>
        </section>
        <footer className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-slate-600"><span>Studio/Creator · Private workspace</span><span className="hidden sm:inline">Data refreshes automatically every 5 minutes</span></footer>
      </div>
    </main>
  )
}
