let kickChannel = null;
let ytChannel = null;
let syncCode = null;

// Supabase Edge Function URL (clazwbjisevatertfjyt)
const DEFAULT_EDGE_FUNCTION_URL = "https://clazwbjisevatertfjyt.supabase.co/functions/v1/verify-telemetry";
let EDGE_FUNCTION_URL = DEFAULT_EDGE_FUNCTION_URL;

// Load config on startup
chrome.storage.local.get(['kickChannel', 'ytChannel', 'syncCode', 'supabaseUrl'], (res) => {
    kickChannel = res.kickChannel;
    ytChannel = res.ytChannel;
    syncCode = res.syncCode;
    if (res.supabaseUrl && res.supabaseUrl.trim()) {
        EDGE_FUNCTION_URL = `${res.supabaseUrl.trim().replace(/\/+$/, '')}/functions/v1/verify-telemetry`;
    }
    if (syncCode && (kickChannel || ytChannel)) startBackgroundAlarm();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.kickChannel) kickChannel = changes.kickChannel.newValue;
    if (changes.ytChannel) ytChannel = changes.ytChannel.newValue;
    if (changes.syncCode) syncCode = changes.syncCode.newValue;
    if (changes.supabaseUrl) {
        const url = (changes.supabaseUrl.newValue || '').trim().replace(/\/+$/, '');
        EDGE_FUNCTION_URL = url ? `${url}/functions/v1/verify-telemetry` : DEFAULT_EDGE_FUNCTION_URL;
    }
    if (syncCode && (kickChannel || ytChannel)) startBackgroundAlarm();
});

function startBackgroundAlarm() {
    chrome.alarms.create("poll_telemetry", { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "poll_telemetry") {
        if (kickChannel) pollKick();
        if (ytChannel) pollYouTube();
    }
});

async function pollKick() {
    try {
        const res = await fetch(`https://kick.com/api/v2/channels/${kickChannel}`);
        const data = await res.json();
        if (data.livestream) {
            const ccv = data.livestream.viewer_count;
            const sessionId = String(data.livestream.id);
            await pushToDatabase(kickChannel, 'kick', sessionId, ccv);
        }
    } catch (e) {
        console.error("Kick Polling Failed", e);
    }
}

async function pollYouTube() {
    try {
        // Auto-resolves live stream via redirect
        const res = await fetch(`https://www.youtube.com/${ytChannel}/live`);
        const html = await res.text();
        
        // Check if actually live and extract embedded JSON data
        if (html.includes('"isLive":true')) {
            const ccvMatch = html.match(/"concurrentViewers":"(\d+)"/);
            const videoIdMatch = html.match(/"videoId":"([^"]+)"/);
            
            if (ccvMatch && videoIdMatch) {
                const ccv = parseInt(ccvMatch[1], 10);
                const sessionId = videoIdMatch[1];
                await pushToDatabase(ytChannel.replace('@', ''), 'youtube', sessionId, ccv);
            }
        }
    } catch (e) {
        console.error("YouTube Polling Failed", e);
    }
}

async function pushToDatabase(channel, platform, sessionId, ccv) {
    if (!syncCode) return;
    
    const payload = {
        channel: channel,
        platform: platform,
        session_id: sessionId,
        interval_peak: ccv,
        interval_avg: ccv,
        stream_time_seconds: null, // VOD relative time calculated on server if needed
        timestamp: new Date().toISOString()
    };

    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(syncCode);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadString));
    const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    try {
        await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-livekit-signature': signature
            },
            body: payloadString
        });
        console.log(`[PUSHED] ${platform.toUpperCase()} CCV: ${ccv}`);
    } catch (e) {
        console.error("DB Push Failed:", e);
    }
}

