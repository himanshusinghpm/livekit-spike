console.log("[LiveKit] Pure Text Scraper Active (Bounded Regex).");
let viewerDataPool = [];
let activeSessionId = null;
let activeChannelName = "LiveKit Creator";
let streamStartTime = null;

let lockedKickChannel = null;
let lockedYtChannel = null;
chrome.storage.local.get(['targetKick', 'targetYt'], (res) => {
    if(res.targetKick) lockedKickChannel = res.targetKick.toLowerCase();
    if(res.targetYt) lockedYtChannel = res.targetYt.toLowerCase();
});

async function poolData() {
    let ytViews = 0, kickViews = 0;

    // ==========================================
    // YOUTUBE: BOUNDED TEXT EXTRACT
    // ==========================================
    if (window.location.hostname.includes('youtube.com')) {
        try {
            let currentChannel = "";
            const authorTag = document.querySelector('span[itemprop="author"] link[itemprop="name"]');
            const channelLink = document.querySelector('#owner ytd-channel-name a, #channel-name a');
            
            if (authorTag && authorTag.content) currentChannel = authorTag.content.trim();
            else if (channelLink && channelLink.textContent) currentChannel = channelLink.textContent.trim();

            if (currentChannel) {
                activeChannelName = currentChannel;
                if (lockedYtChannel) {
                    const normCurrent = currentChannel.toLowerCase().split('@').join('').trim();
                    const normLocked = lockedYtChannel.toLowerCase().split('@').join('').trim();
                    if (normCurrent !== normLocked && !normCurrent.includes(normLocked) && !normLocked.includes(normCurrent)) return; 
                }
            } else if (lockedYtChannel) return;

            if (!activeSessionId) activeSessionId = new URLSearchParams(window.location.search).get('v');
            
            const metadata = document.querySelector('ytd-watch-metadata') || document.querySelector('#primary-inner') || document.body;
            if (metadata) {
                const text = metadata.textContent || "";
                // BOUNDED REGEX: Rejects massive JSON strings, only accepts valid 1-10 digit numbers
                const match = text.match(/(?:[^\d,]|^)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,10})\s+watching/i);
                if (match && match[1]) {
                    ytViews = parseInt(match[1].replace(/[^0-9]/g, '')) || 0;
                }
            }
        } catch (e) {
            console.error("[LiveKit] YT Pool Error:", e);
        }
    }

    // ==========================================
    // KICK: BOUNDED TEXT EXTRACT
    // ==========================================
    if (window.location.hostname.includes('kick.com')) {
        try {
            const currentPath = window.location.pathname.toLowerCase();
            const channelName = currentPath.split('/')[1];
            if (lockedKickChannel && channelName !== lockedKickChannel) return;

            activeChannelName = channelName;
            if (!activeSessionId) activeSessionId = channelName + '_live';

            const mainContent = document.querySelector('#main-content') || document.body;
            if (mainContent) {
                const text = mainContent.textContent || "";
                // BOUNDED REGEX: Rejects massive JSON strings, only accepts valid 1-10 digit numbers
                const match = text.match(/(?:[^\d,]|^)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,10})\s+watching/i);
                if (match && match[1]) {
                    kickViews = parseInt(match[1].replace(/[^0-9]/g, '')) || 0;
                }
            }
        } catch (e) {
            console.error("[LiveKit] Kick Pool Error:", e);
        }
    }

    // ==========================================
    // POOL & LOG
    // ==========================================
    if (ytViews > 0 || kickViews > 0) {
        viewerDataPool.push({ total: ytViews + kickViews, yt: ytViews, kick: kickViews });
        const elapsed = streamStartTime ? Math.floor((Date.now() - streamStartTime) / 1000) : 0;
        console.log(`[LiveKit] Pooled -> YT: ${ytViews} | Kick: ${kickViews} | Session: ${activeSessionId} | Elapsed: ${elapsed}s`);
    }
}

setInterval(poolData, 1000);

setInterval(() => {
    if (viewerDataPool.length === 0) return;
    const peak = Math.max(...viewerDataPool.map(d => d.total));
    const avg = Math.round(viewerDataPool.reduce((sum, d) => sum + d.total, 0) / viewerDataPool.length);
    const currentPlatform = window.location.hostname.includes('kick.com') ? 'kick' : 'youtube';
    const finalSessionId = activeSessionId || 'live_' + Date.now();
    const currentStreamSeconds = streamStartTime ? Math.floor((Date.now() - streamStartTime) / 1000) : 0;
    
    chrome.runtime.sendMessage({
        action: "FLUSH_TELEMETRY",
        payload: { 
            interval_peak: peak, 
            interval_avg: avg, 
            platform: currentPlatform,
            channel_name: activeChannelName,
            session_id: finalSessionId.toString(),
            stream_time_seconds: currentStreamSeconds, 
            timestamp: new Date().toISOString() 
        }
    });
    viewerDataPool = [];
}, 60000);
