import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
const DODO_BASE = (process.env.DODO_API_BASE || 'https://test.dodopayments.com').replace(/\/+$/, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({})) as { agencyName?: string; email?: string; website?: string; tier?: string };
    const agencyName = (b.agencyName || '').trim().slice(0, 120);
    const email = (b.email || '').trim().toLowerCase().slice(0, 254);
    const website = (b.website || '').trim().slice(0, 120);
    const tier = b.tier === 'growth' ? 'growth' : b.tier === 'boutique' ? 'boutique' : '';
    if (agencyName.length < 2 || !EMAIL_RE.test(email) || website.length < 2 || !tier)
      return NextResponse.json({ ok: false, error: 'Invalid fields.' }, { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Server route: prefer service-role (bypasses RLS) — never expose to client.
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const hook = process.env.LEAD_WEBHOOK_URL || '';
    let stored: 'supabase' | 'webhook' | 'log-only' = 'log-only';
    let leadId: string | null = null;
    if (url && (svc || anon)) {
      const sb = createClient(url, svc || anon);
      const { data, error } = await sb.from('leads').insert([{ agency_name: agencyName, email, website, tier, status: 'pending' }]).select('id').single();
      if (error) {
        if (hook) {
          const r = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agencyName, email, website, tier, supabaseError: error.message }) });
          if (!r.ok) return NextResponse.json({ ok: false, error: 'Could not save lead.' }, { status: 502 });
          stored = 'webhook';
        } else {
          console.error('[leads] supabase insert failed, no webhook:', error.message);
          return NextResponse.json({ ok: false, error: 'Could not save lead. Try again.' }, { status: 502 });
        }
      } else { stored = 'supabase'; leadId = (data as { id?: string } | null)?.id || null; }
    } else if (hook) {
      const r = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName, email, website, tier }) });
      if (!r.ok) return NextResponse.json({ ok: false, error: 'Could not save lead.' }, { status: 502 });
      stored = 'webhook';
    } else console.log('[leads]', { agencyName, email, website, tier });
    // --- API Pivot: dynamic Checkout Session with lead_id in metadata ---
    const apiKey = process.env.DODO_API_KEY || '';
    if (!apiKey) {
      console.error('[leads] DODO_API_KEY missing; cannot create checkout session');
      return NextResponse.json({ ok: false, error: 'Checkout is not configured. Missing DODO_API_KEY.' }, { status: 500 });
    }
    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'Lead was not anchored to database. Cannot create checkout.' }, { status: 502 });
    }
    const productId = tier === 'growth'
      ? (process.env.DODO_PRODUCT_GROWTH_ID || '')
      : (process.env.DODO_PRODUCT_BOUTIQUE_ID || '');
    if (!productId) {
      console.error(`[leads] DODO_PRODUCT_${tier.toUpperCase()}_ID missing; cannot create checkout session`);
      return NextResponse.json({ ok: false, error: 'Checkout is not configured. Missing product ID.' }, { status: 500 });
    }
    const origin = new URL(req.url).origin;
    try {
      const dodoRes = await fetch(`${DODO_BASE}/checkouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          metadata: { lead_id: leadId },
          return_url: `${origin}/checkout/success?lead_id=${encodeURIComponent(leadId)}&email=${encodeURIComponent(email)}`,
        }),
      });
      const dodoJson = await dodoRes.json().catch(() => ({})) as { checkout_url?: string; checkoutUrl?: string; url?: string; message?: string };
      if (!dodoRes.ok || !(dodoJson.checkout_url || dodoJson.checkoutUrl || dodoJson.url)) {
        console.error('[leads] Dodo checkout create failed:', dodoRes.status, dodoJson);
        return NextResponse.json({ ok: false, error: 'Could not create checkout session. Try again.' }, { status: 502 });
      }
      const checkoutUrl = dodoJson.checkout_url || dodoJson.checkoutUrl || (dodoJson.url as string);
      return NextResponse.json({ ok: true, stored, leadId, checkoutUrl });
    } catch (dodoErr) {
      console.error('[leads] Dodo API error', dodoErr);
      return NextResponse.json({ ok: false, error: 'Could not create checkout session. Try again.' }, { status: 502 });
    }
  } catch (e) {
    console.error('[leads] error', e);
    return NextResponse.json({ ok: false, error: 'Server error.' }, { status: 500 });
  }
}
