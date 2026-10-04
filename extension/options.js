document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['kickChannel', 'ytChannel', 'syncCode'], (result) => {
        if (result.kickChannel) document.getElementById('kickInput').value = result.kickChannel;
        if (result.ytChannel) document.getElementById('ytInput').value = result.ytChannel;
        if (result.syncCode) document.getElementById('syncCodeInput').value = result.syncCode;
    });
});

// LiveKit Supabase project (public anon key is safe to embed — RLS enforces access).
const SUPABASE_URL = "https://clazwbjisevatertfjyt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXp3Ymppc2V2YXRlcnRmanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjI5ODcsImV4cCI6MjEwNTg5ODk4N30.alnz2uEgVvCIQu4JaB6VQisxVx9xuhk3TT5qZvA2OM4";

function setStatus(msg, isError) {
    const status = document.getElementById('status');
    status.textContent = msg;
    status.style.color = isError ? '#ef4444' : '#f97316';
}

async function verifySyncCode(code) {
    // Primary: leads table — sync_code must exist AND status === 'active'.
    // Fallback: campaigns table (where LK- codes live) — same active check.
    // Checking both keeps production correct regardless of which table anchors the code.
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };
    const encoded = encodeURIComponent(code);

    try {
        const leadsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/leads?sync_code=eq.${encoded}&select=sync_code,status`,
            { headers }
        );
        if (leadsRes.ok) {
            const rows = await leadsRes.json().catch(() => []);
            const hit = Array.isArray(rows) ? rows.find((r) => r && r.status === 'active') : null;
            if (hit) return true;
            // If a leads row exists but is not active, it is expired — do not fall through as valid.
            if (Array.isArray(rows) && rows.length > 0) return false;
        }
    } catch (e) {
        console.warn('[LiveKit] leads verify failed, trying campaigns:', e);
    }

    try {
        const campRes = await fetch(
            `${SUPABASE_URL}/rest/v1/campaigns?sync_code=eq.${encoded}&select=sync_code,status`,
            { headers }
        );
        if (!campRes.ok) return false;
        const rows = await campRes.json().catch(() => []);
        if (!Array.isArray(rows) || rows.length === 0) return false;
        // Campaigns are provisioned as 'pending' then activated; accept active (and pending
        // handshake) but reject revoked/expired. Leads-side RLS still requires active.
        return rows.some((r) => r && (r.status === 'active' || r.status === 'pending'));
    } catch (e) {
        console.error('[LiveKit] sync-code verify failed:', e);
        return false;
    }
}

document.getElementById('saveBtn').addEventListener('click', async () => {
    let kick = document.getElementById('kickInput').value.trim().toLowerCase();
    let yt = document.getElementById('ytInput').value.trim().toLowerCase();
    let code = document.getElementById('syncCodeInput').value.trim();

    if (kick.includes("kick.com/")) kick = kick.split("kick.com/")[1].split("/")[0];
    if (yt && !yt.startsWith("@")) yt = "@" + yt;

    if (!code) {
        setStatus('Invalid or expired Sync-Code', true);
        // Fail-closed: wipe any cached credentials and kill any running loop.
        try { await chrome.storage.local.clear(); } catch (_) {}
        try { chrome.runtime.sendMessage({ action: 'LIVEKIT_STOP' }); } catch (_) {}
        return;
    }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    setStatus('Verifying Sync-Code…', false);

    const valid = await verifySyncCode(code);
    btn.disabled = false;

    if (!valid) {
        setStatus('Invalid or expired Sync-Code', true);
        // Fail-closed: wipe the old cached sync code so no running loop can
        // keep scraping with it, then tell the background worker to stop now.
        try { await chrome.storage.local.clear(); } catch (_) {}
        try { chrome.runtime.sendMessage({ action: 'LIVEKIT_STOP' }); } catch (_) {}
        return; // Do NOT save to storage or start the worker.
    }

    chrome.storage.local.set({ kickChannel: kick, ytChannel: yt, syncCode: code }, () => {
        // Mirror keys used by popup + content script so every reader resolves the same target.
        chrome.storage.local.set({ targetKick: kick, targetYt: yt });
        setStatus('🔒 Worker Locked & Loaded!', false);
        // Notify background worker to aggressively restart scraping against the new target.
        try { chrome.runtime.sendMessage({ action: 'LIVEKIT_RECONFIGURE' }); } catch (_) {}
        setTimeout(() => { const s = document.getElementById('status'); if (s && !s.textContent.includes('Invalid')) s.textContent = ''; }, 3000);
    });
});