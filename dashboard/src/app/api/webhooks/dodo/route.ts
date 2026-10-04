import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type DodoEvent = { type?: string; data?: Record<string, unknown> };
// API Pivot: leadId travels ONLY in secure metadata (set at Checkout Session create).
// Do NOT trust URL params (client_reference_id) — Finance may forward links.
function getLeadRef(body: DodoEvent): string | null {
  const d = body.data || {};
  const meta = d.metadata as Record<string, unknown> | undefined;
  if (meta && typeof meta === 'object') {
    const m = [meta.lead_id, meta.leadId];
    for (const v of m) if (typeof v === 'string' && (v as string).trim()) return (v as string).trim();
  }
  const cust = d.customer as Record<string, unknown> | undefined;
  if (cust && typeof cust === 'object') {
    const cm = cust.metadata as Record<string, unknown> | undefined;
    if (cm && typeof cm === 'object') {
      const c = [cm.lead_id, cm.leadId];
      for (const v of c) if (typeof v === 'string' && (v as string).trim()) return (v as string).trim();
    }
  }
  return null;
}
function getSubId(d: Record<string, unknown>): string | null {
  const direct = [d.subscription_id, d.subscriptionId, d.subscriptionID];
  for (const v of direct) if (typeof v === 'string' && v.trim()) return v.trim();
  const sub = d.subscription as Record<string, unknown> | string | undefined;
  if (typeof sub === 'string' && sub.trim()) return sub.trim();
  if (sub && typeof sub === 'object') {
    const sid = (sub as Record<string, unknown>).subscription_id ?? (sub as Record<string, unknown>).id;
    if (typeof sid === 'string' && sid.trim()) return sid.trim();
  }
  if (typeof d.id === 'string' && d.id.trim()) return d.id.trim();
  return null;
}
function getBillEmail(d: Record<string, unknown>): string | null {
  const cust = d.customer as Record<string, unknown> | undefined;
  if (cust && typeof cust === 'object') {
    const ce = cust.email;
    if (typeof ce === 'string' && ce.includes('@')) return ce.trim().toLowerCase();
  }
  const bill = d.billing as Record<string, unknown> | undefined;
  if (bill && typeof bill === 'object') {
    const be = bill.email;
    if (typeof be === 'string' && be.includes('@')) return be.trim().toLowerCase();
  }
  const flat = [d.customer_email, d.customerEmail, d.billing_email, d.billingEmail, d.email, d.payer_email];
  for (const v of flat) if (typeof v === 'string' && v.includes('@')) return v.trim().toLowerCase();
  const payer = d.payer as Record<string, unknown> | undefined;
  if (payer && typeof payer === 'object' && typeof payer.email === 'string' && (payer.email as string).includes('@'))
    return (payer.email as string).trim().toLowerCase();
  return null;
}
async function verifySig(req: Request, raw: string): Promise<boolean> {
  const secret = process.env.DODO_WEBHOOK_SECRET || '';
  // Fail closed: an unset/empty secret means we cannot authenticate this payload.
  // Reject instead of trusting it — otherwise anyone could POST forged events and
  // provision/activate arbitrary leads.
  if (!secret.trim()) {
    console.error('[dodo-webhook] DODO_WEBHOOK_SECRET is not configured — rejecting unverified payload');
    return false;
  }
  try {
    const { createHmac, timingSafeEqual } = await import('node:crypto');
    const id = req.headers.get('webhook-id') || '';
    const ts = req.headers.get('webhook-timestamp') || '';
    const sig = req.headers.get('webhook-signature') || '';
    if (!id || !ts || !sig) return false;
    const unsigned = `${id}.${ts}.${raw}`;
    const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
    const expected = createHmac('sha256', key).update(unsigned).digest('base64');
    for (const part of sig.split(' ')) {
      const s = part.includes(',') ? part.split(',')[1] : part;
      if (!s) continue;
      const a = Buffer.from(s); const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    }
    return false;
  } catch { return false; }
}
export async function POST(req: Request) {
  const raw = await req.text();
  let body: DodoEvent = {};
  try { body = JSON.parse(raw) as DodoEvent; } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!(await verifySig(req, raw))) return NextResponse.json({ ok: false }, { status: 401 });
  const type = body.type || '';
  const okEvent = type === 'payment.succeeded' || type === 'subscription.active' || type.startsWith('subscription.');
  if (!okEvent) return NextResponse.json({ ok: true, ignored: type });
  const ref = getLeadRef(body);
  if (!ref) { console.warn('[dodo-webhook] no lead ref', type); return NextResponse.json({ ok: true, missing: true }); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 500 });
  const sb = createClient(url, key);
  const d = body.data || {};
  const dodoSubscriptionId = getSubId(d);
  const billingEmail = getBillEmail(d);
  // Idempotency guard (webhook race): Dodo may send payment.succeeded +
  // subscription.active nearly simultaneously. Fetch current status BEFORE
  // updating so we only send ONE magic link. If status is already 'active',
  // an earlier webhook already provisioned + emailed — skip resending OTP
  // (duplicate signInWithOtp calls invalidate the prior token).
  const { data: existing, error: fErr } = await sb.from('leads').select('id,status,email').eq('id', ref).single();
  if (fErr || !existing) { console.error('[dodo-webhook] lead fetch failed', fErr?.message || 'lead not found'); return NextResponse.json({ ok: false }, { status: fErr ? 502 : 404 }); }
  const wasAlreadyActive = (existing as { status?: string }).status === 'active';
  const patch: Record<string, string> = { status: 'active', trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() };
  if (dodoSubscriptionId) patch.dodo_subscription_id = dodoSubscriptionId;
  if (billingEmail) patch.billing_email = billingEmail;
  const { data: lead, error: uErr } = await sb.from('leads').update(patch).eq('id', ref).select().single();
  if (uErr || !lead) { console.error('[dodo-webhook] activate failed', uErr?.message || 'lead not found'); return NextResponse.json({ ok: false }, { status: uErr ? 502 : 404 }); }
  const em = (lead as { email?: string }).email || '';
  console.log(`[dodo-webhook] lead ${ref} ACTIVE via ${type} sub=${dodoSubscriptionId || 'n/a'} billing=${billingEmail || 'n/a'}. Send Sync-Code provisioning email to DB email ${em} (NOT billing email).`);
  if (wasAlreadyActive) {
    console.log(`[dodo-webhook] lead ${ref} was already active — skipping duplicate magic link (idempotency guard, event ${type}).`);
    return NextResponse.json({ ok: true, leadId: ref, dodoSubscriptionId, billingEmail, deduplicated: true });
  }
  if (lead?.email) {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') || new URL(req.url).origin;
    const { error: authError } = await sb.auth.signInWithOtp({
      email: lead.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteUrl}/agency`,
      },
    });
    if (authError) {
      console.error('Failed to send magic link:', authError);
    } else {
      console.log(`[dodo-webhook] magic link sent to Ops email ${lead.email} for lead ${ref}`);
    }
  }
  return NextResponse.json({ ok: true, leadId: ref, dodoSubscriptionId, billingEmail });
}
