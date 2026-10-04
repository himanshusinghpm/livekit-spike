const DEFAULT_EDGE_FUNCTION_URL = "https://clazwbjisevatertfjyt.supabase.co/functions/v1/verify-telemetry";

// Passive Listening model: silent router. NEVER opens/closes tabs.

async function maybeInject(tabId, url) {
  if (!url) return;
  let cfg = {};
  try {
    cfg = await chrome.storage.local.get(['kickChannel', 'ytChannel', 'targetKick', 'targetYt', 'syncCode']);
  } catch (_) { return; }
  if (!cfg.syncCode) return;

  const lowerUrl = String(url).toLowerCase();
  
  // Inject into ALL YouTube and Kick tabs. 
  // The scraper's internal channel lock will abort if it's the wrong channel.
  const isYt = lowerUrl.includes('youtube.com/watch') || lowerUrl.includes('youtube.com/live') || lowerUrl.includes('youtube.com/@');
  const isKick = lowerUrl.includes('kick.com/');

  if (!isYt && !isKick) {
    // Clear badge immediately if navigating away from supported platforms
    try { chrome.action.setBadgeText({ text: "", tabId: tabId }); } catch(e) {}
    return;
  }

  // Best-effort immediate visual privacy indicator based on URL
  try {
    const lockedKick = (cfg.targetKick || cfg.kickChannel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const lockedYt = (cfg.targetYt || cfg.ytChannel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanUrl = lowerUrl.replace(/[^a-z0-9]/g, '');
    
    let isTargetChannel = false;
    if (lockedKick && isKick && cleanUrl.includes(lockedKick)) isTargetChannel = true;
    if (lockedYt && isYt && cleanUrl.includes(lockedYt)) isTargetChannel = true;

    if (isTargetChannel) {
      chrome.action.setBadgeText({ text: "LIVE", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId: tabId }); // Green indicator
    } else {
      chrome.action.setBadgeText({ text: "", tabId: tabId });
    }
  } catch (e) {
    console.warn('[LiveKit] Badge initialization skipped:', e);
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['livekit-scraper.js'] });
    console.log('[LiveKit] Injected scraper into tab ' + tabId + ': ' + url);
  } catch (e) {
    console.warn('[LiveKit] Dynamic inject skipped:', (e && e.message) || e);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // --- SPA STATE BADGE LISTENER ---
    if (request.action === "SET_BADGE") {
        if (sender && sender.tab && sender.tab.id) {
            try {
                chrome.action.setBadgeText({ text: request.payload, tabId: sender.tab.id });
                if (request.payload === "LIVE") {
                    chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId: sender.tab.id });
                }
            } catch (e) {}
        }
        return;
    }

    if (request.action === "FLUSH_TELEMETRY") {
        // Failsafe confirmation badge when data actually flows from the locked scraper
        if (sender && sender.tab && sender.tab.id) {
            try {
                chrome.action.setBadgeText({ text: "LIVE", tabId: sender.tab.id });
                chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId: sender.tab.id });
            } catch(e) {}
        }

        chrome.storage.local.get(['syncCode', 'supabaseUrl'], (res) => {
            if (!res.syncCode) return console.error("[LiveKit] No Sync Code found.");
            const url = res.supabaseUrl ? `${res.supabaseUrl.trim().replace(/\/+$/, '')}/functions/v1/verify-telemetry` : DEFAULT_EDGE_FUNCTION_URL;
            
            const finalPayload = { ...request.payload, sync_code: res.syncCode };
            
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            })
            .then(response => console.log(`[LiveKit] Supabase Sync Status: ${response.status}`))
            .catch(err => console.error("[LiveKit] Supabase Sync Failed:", err));
        });
        return;
    }

    if (request.action === 'LIVEKIT_RECONFIGURE') {
        try { sendResponse({ ok: true, mode: 'passive' }); } catch (_) {}
        return;
    }

    if (request.action === 'LIVEKIT_STOP') {
        try { chrome.storage.local.clear(); } catch (_) {}
        console.log('[LiveKit] STOP: credentials cleared (passive mode - tabs untouched).');
        // Global badge clear on stop
        try { chrome.action.setBadgeText({ text: "" }); } catch(e) {}
        try { sendResponse({ ok: true }); } catch (_) {}
        return;
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) maybeInject(tabId, tab.url);
});