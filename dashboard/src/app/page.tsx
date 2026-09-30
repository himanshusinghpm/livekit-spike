'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  Download,
  FileText,
  Gauge,
  Layers3,
  Menu,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

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
            ['PEAK REACH', '22,250', '+18.4%'],
            ['AVG. CCV', '21,904', '+6.2%'],
            ['HOURS WATCHED', '2.96M', '+24.8%'],
            ['DURATION', '135h', '+12.1%'],
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
                <p className="text-xs font-medium text-white/75">Audience retention</p>
                <p className="mt-1 text-[10px] text-white/35">YouTube + Kick · Last 60 minutes</p>
              </div>
              <div className="flex gap-3 text-[10px] text-white/40"><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-red-400" /> YouTube</span><span className="flex items-center gap-1"><i className="size-1.5 rounded-full bg-emerald-400" /> Kick</span></div>
            </div>
            <div className="relative h-28 overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between"><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /><span className="border-t border-white/[0.05]" /></div>
              <svg viewBox="0 0 560 120" preserveAspectRatio="none" className="absolute inset-0 size-full">
                <defs><linearGradient id="retention-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f87171" stopOpacity=".22" /><stop offset="1" stopColor="#f87171" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 90 C38 88 42 62 78 70 S119 92 150 54 S190 78 222 48 S255 64 290 38 S330 49 355 30 S390 52 420 28 S460 45 490 20 S530 32 560 10 V120 H0Z" fill="url(#retention-area)" />
                <path d="M0 90 C38 88 42 62 78 70 S119 92 150 54 S190 78 222 48 S255 64 290 38 S330 49 355 30 S390 52 420 28 S460 45 490 20 S530 32 560 10" fill="none" stroke="#f87171" strokeWidth="2" />
                <path d="M0 108 C45 104 65 92 102 98 S160 105 190 82 S240 95 280 70 S335 90 370 63 S425 82 455 59 S515 74 560 46" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="5 4" />
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

function AuditDocument() {
  const stats = [
    { label: 'Combined Peak CCV', value: '22,250', icon: BarChart3, tone: 'text-indigo-600' },
    { label: 'Hours Watched', value: '2.96M hrs', icon: FileText, tone: 'text-slate-600' },
    { label: 'Stream Duration', value: '135h', icon: CircleDot, tone: 'text-red-600' },
    { label: 'File Size', value: '179 kB', icon: Download, tone: 'text-emerald-600' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-[430px] rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-7">
      <div className="absolute -inset-8 -z-10 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="relative mb-5 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-medium tracking-[0.12em] text-white/60"><span>EXPORT VERIFIED REPORT</span><span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] tracking-normal text-emerald-300"><ShieldCheck className="size-3" /> Sync-Code Authenticated</span></div>
      <div className="mx-auto aspect-[1/1.414] max-w-[330px] rounded-sm bg-white p-6 text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-4 text-indigo-600" /> LiveKit Verified</div>
            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-slate-400">Campaign Settlement: LK-443-76N</p>
          </div>
          <span className="font-mono text-[9px] text-slate-400">LK-0425</span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={label}>
              <Icon className={`size-3.5 ${tone}`} />
              <p className="mt-5 text-[9px] leading-3 text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-bold tracking-tight">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between text-[9px] text-slate-400"><span>Campaign integrity</span><span className="font-semibold text-emerald-600">100% verified</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-full rounded-full bg-emerald-500" /></div>
        </div>
        <button type="button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2.5 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"><Download className="size-3.5" /> Download Sponsor PDF</button><div className="mt-5 flex items-center justify-between text-[8px] text-slate-400"><span>Generated by LiveKit Telemetry</span><span>Page 1 / 1</span></div>
      </div>
    </div>
  )
}

export default function Page() {
  const [region, setRegion] = useState<'global' | 'india'>('global')
  const isIndia = region === 'india'

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
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-orange-300">Instant settlement</p>
            <h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Audit-Ready <span className="text-orange-300">Sponsor Reporting.</span></h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/40">Eliminate post-stream screenshot chasing. LiveKit compiles multi-platform telemetry into a secure, 179kB PDF that brand finance teams approve instantly.</p>
            <div className="mt-8 flex flex-col gap-3 text-sm text-white/65">
              <span className="flex items-center gap-3"><ShieldCheck className="size-4 text-indigo-400" /> Tamper-proof cryptographic sync codes</span>
              <span className="flex items-center gap-3"><Layers3 className="size-4 text-indigo-400" /> Simultaneous YouTube &amp; Kick aggregation</span>
              <span className="flex items-center gap-3"><Download className="size-4 text-indigo-400" /> 1-Click PDF exports under 200kB</span>
            </div>
          </div>
          <AuditDocument />
        </div>
      </section>

      <section id="pricing" className="relative border-t border-white/[0.07] bg-white/[0.015] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">Simple, transparent pricing</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Plans that scale with your roster.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/40">Deploy verified telemetry across your talent roster today. Automatic Purchasing Power Parity applied at checkout.</p>
          </div>
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-[#111114] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.25)]" role="group" aria-label="Pricing region">
              <button type="button" onClick={() => setRegion('global')} aria-pressed={!isIndia} className={`rounded-full px-4 py-2 text-xs font-medium transition-all sm:px-5 ${!isIndia ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-white/45 hover:text-white'}`}>Global (USD)</button>
              <button type="button" onClick={() => setRegion('india')} aria-pressed={isIndia} className={`rounded-full px-4 py-2 text-xs font-medium transition-all sm:px-5 ${isIndia ? 'bg-indigo-400 text-[#0a0a0a] shadow-sm' : 'text-white/45 hover:text-white'}`}>India (PPP Discount)</button>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { name: 'Boutique', target: 'For boutique management teams and regional tournament organizers.', global: '$299', india: '₹12,499', features: ['Up to 10 active creator feeds', 'Kick & YouTube 60s telemetry', 'Instant verified PDF sponsor reports', 'CSV export', 'Email support'] },
              { name: 'Growth', target: 'For premier esports organizations managing high-stakes brand activations.', global: '$799', india: '₹29,999', features: ['Unlimited creator feeds', 'White-labeled sponsor PDF reports with custom branding', 'Full raw telemetry data pipeline', 'Multi-manager seats', 'Priority SLA support'] },
            ].map((plan, index) => (
              <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-7 sm:p-9 ${index === 1 ? 'border-indigo-400/40 bg-indigo-400/[0.08] shadow-[0_0_50px_rgba(99,102,241,0.12)]' : 'border-white/10 bg-[#111114]'}`}>
                {index === 1 && <span className="absolute right-6 top-6 rounded-full border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-indigo-200">Popular</span>}
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{plan.name} tier</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{plan.name}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/45" style={{ minHeight: 48 }}>{plan.target}</p>
                <div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-[-0.06em]">{isIndia ? plan.india : plan.global}</span><span className="text-sm text-white/35">/ mo</span></div>
                <div className="my-8 h-px bg-white/[0.08]" />
                <ul className="flex flex-col gap-4 text-sm text-white/65">{plan.features.map((feature) => <li key={feature} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> <span>{feature}</span></li>)}</ul>
                <a href="#download" className={`mt-9 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all ${index === 1 ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]'}`}>Start 14-Day Free Trial</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><Link href="/" aria-label="LiveKit home"><BrandMark /></Link><div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Link href="/privacy" className="transition-colors hover:text-white/70">Privacy Policy</Link><Link href="/terms" className="transition-colors hover:text-white/70">Terms of Service</Link><Link href="/refunds" className="transition-colors hover:text-white/70">Refunds</Link><a href="mailto:support.livekit@gmail.com" className="transition-colors hover:text-white/70">support.livekit@gmail.com</a><span>© 2026 LiveKit. All rights reserved.</span></div></div></footer>
          
    </main>
  );
}