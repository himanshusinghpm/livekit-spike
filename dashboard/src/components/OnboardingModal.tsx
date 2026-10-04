'use client';
import { useEffect, useState } from 'react';
export type Tier = 'boutique' | 'growth';
export function checkoutFor(t: Tier) {
  if (t === 'growth')
    return process.env.NEXT_PUBLIC_DODO_GROWTH_URL || 'https://test.checkout.dodopayments.com/growth-799-placeholder';
  return process.env.NEXT_PUBLIC_DODO_BOUTIQUE_URL || 'https://test.checkout.dodopayments.com/boutique-299-placeholder';
}
export default function OnboardingModal({ open, initialTier, onClose }: { open: boolean; initialTier: Tier; onClose: () => void }) {
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [tier, setTier] = useState<Tier>(initialTier);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setTier(initialTier); setErr(null); setBusy(false); } }, [open, initialTier]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const p = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = p; };
  }, [open, onClose]);
  if (!open) return null;
  const valid = agencyName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && website.trim().length >= 2;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName: agencyName.trim(), email: email.trim().toLowerCase(), website: website.trim(), tier }) });
      const d = await r.json().catch(() => ({})) as { ok?: boolean; checkoutUrl?: string; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error || `Capture failed (${r.status})`);
      window.location.href = d.checkoutUrl || checkoutFor(tier);
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Failed. Try again.'); setBusy(false); }
  }
  const inp = 'rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-400/60';
  return (
    <div role="dialog" aria-modal="true" aria-label="Start trial" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300">14-day free trial</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Create your agency account</h2>
            <p className="mt-1 text-sm text-white/45">We&apos;ll use this to send your access credentials and Sync-Code.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/50 hover:text-white">✕</button>
        </div>
        <div role="group" aria-label="Select tier" className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/40 p-1.5">
          {(['boutique', 'growth'] as Tier[]).map((t) => (
            <button key={t} type="button" aria-pressed={tier === t} onClick={() => setTier(t)}
              className={tier === t ? 'rounded-lg bg-indigo-500 px-3 py-2.5 text-left text-white' : 'rounded-lg px-3 py-2.5 text-left text-white/50 hover:bg-white/5 hover:text-white'}>
              <span className="block text-sm font-semibold capitalize">{t}</span>
              <span className="block text-xs opacity-70">{t === 'boutique' ? '$299/mo' : '$799/mo'}</span>
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs text-white/55">Agency Name<input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="e.g. Nova Talent Co." required minLength={2} maxLength={120} className={inp} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/55">Contact Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" required maxLength={254} className={inp} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/55">Agency Website<input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. novatalent.com" required minLength={2} maxLength={120} className={inp} /></label>
          {err && <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</p>}
          <button type="submit" disabled={!valid || busy} className="mt-1 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40">{busy ? 'Saving & redirecting…' : `Continue to checkout → ${tier === 'boutique' ? '$299' : '$799'}`}</button>
          <p className="text-center text-[11px] text-white/30">No charge today. Dodo Payments (MoR) handles VAT/GST securely.</p>
        </form>
      </div>
    </div>
  );
}
