// background.js - Alarm-Driven Background Poller
console.log("LiveKit V8: 24/7 Background Poller Active.");

// Default Supabase project. Overridable at runtime via chrome.storage.local
// ("supabaseUrl") so forks don't have to edit this file. Falls back to the
// built-in default, so existing installs keep working unchanged.
const DEFAULT_EDGE_FUNCTION_URL = "https://clazwbjisevatertfjyt.supabase.co/functions/v1/verify-telemetry";
let EDGE_FUNCTION_URL = DEFAULT_EDGE_FUNCTION_URL;

function resolveEdgeFunctionUrl() {
    chrome.storage.local.get(['supabaseUrl'], (res) => {
        const custom = (res.supabaseUrl || '').trim().replace(/\/+$/, '');
        if (custom) {
            EDGE_FUNCTION_URL = `${custom}/functions/v1/verify-telemetry`;
        }
    });
}
resolveEdgeFunctionUrl();


let targetChannel = null;
let ccvCache = [];
let streamStartTime = null;
let currentSessionId = null;
let syncCode = null;

// Load Identity Lock + Sync Code
chrome.storage.local.get(['targetChannel', 'syncCode'], (res) => {
    if (res.targetChannel) targetChannel = res.targetChannel;
    if (res.syncCode) syncCode = res.syncCode;
    if (targetChannel && syncCode) startBackgroundAlarm();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.targetChannel) targetChannel = changes.targetChannel.newValue;
    if (changes.syncCode) syncCode = changes.syncCode.newValue;
    if (targetChannel && syncCode) startBackgroundAlarm();
});

// Start the 24/7 Chrome Alarm (Fires every 1 minute)
function startBackgroundAlarm() {
    chrome.alarms.create("livekit_poll", { periodInMinutes: 1 });
    console.log("⏰ Background Alarm set to fire every 1 minute.");
}

// The Bouncer Math
async function signPayload(payloadString, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadString));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// The Core Logic: Wakes up, checks API, and pushes if Live
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "livekit_poll" && targetChannel) {
        console.log(`⏰ Alarm woke up worker. Checking ${targetChannel}...`);
        
        try {
            const response = await fetch(`https://kick.com/api/v2/channels/${targetChannel}`);
            if (!response.ok) return;
            const data = await response.json();
            
            if (data?.livestream?.viewer_count !== undefined) {
                // Creator is LIVE!
                const ccv = data.livestream.viewer_count;
                ccvCache.push(ccv);
                console.log(`[BACKGROUND POLL] CCV: ${ccv}`);
                
                // NEW: Capture the Session ID
                if (data.livestream.id) {
                    currentSessionId = String(data.livestream.id);
                }
                
                if (data.livestream.created_at) {
                    streamStartTime = new Date(data.livestream.created_at).getTime();
                }

                // Push to database immediately since the alarm only fires once a minute
                await pushToDatabase();
            } else {
                // Creator is offline
                console.log(`[BACKGROUND POLL] ${targetChannel} is offline.`);
                streamStartTime = null;
                currentSessionId = null; // Reset on offline
                ccvCache = []; 
            }
        } catch (e) {
            console.error("Background Fetch Failed:", e);
        }
    }
});

async function pushToDatabase() {
    if (!syncCode) return;
    if (ccvCache.length === 0 || !targetChannel || !streamStartTime) return;

    const intervalPeak = Math.max(...ccvCache);
    const intervalAvg = Math.round(ccvCache.reduce((a, b) => a + b, 0) / ccvCache.length);
    
    const now = new Date();
    const streamTimeSeconds = Math.floor((now.getTime() - streamStartTime) / 1000);

    const payloadObj = {
        channel: targetChannel,
        platform: "kick",
        session_id: currentSessionId, // NEW FIELD
        interval_peak: intervalPeak,
        interval_avg: intervalAvg,
        timestamp: now.toISOString(),
        stream_time_seconds: streamTimeSeconds
    };
    
    const payloadString = JSON.stringify(payloadObj);
    const signature = await signPayload(payloadString, syncCode);
    
    try {
        const res = await fetch(EDGE_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-livekit-signature": signature },
            body: payloadString
        });
        if (res.ok) {
            console.log(`☁️ SUCCESS! Data pushed from Background Worker.`);
        }
    } catch (err) {
        console.error("DB Push Failed:", err);
    }
    
    // Reset cache until next alarm
    ccvCache = [];
}

// Keep Popup Communications Alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "GET_STATS") {
        sendResponse({
            status: streamStartTime ? "TRACKING" : "IDLE",
            channel: targetChannel || "None",
            peak: ccvCache.length > 0 ? Math.max(...ccvCache) : 0,
            avg: ccvCache.length > 0 ? Math.round(ccvCache.reduce((a,b)=>a+b,0)/ccvCache.length) : 0
        });
    }
    return true;
});
