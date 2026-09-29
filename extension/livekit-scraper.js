console.log("[LiveKit] Scraper Active (V9 Final - YT Frozen, Kick API Restored).");
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

let cachedKickViews = 0;
let lastKickFetch = 0;

async function poolData() {
    let ytViews = 0, kickViews = 0;

    // ==========================================
    // YOUTUBE: FROZEN LOGIC
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
            
            // Time Extraction (FROZEN)
            if (!streamStartTime) {
                const metaDate = document.querySelector('meta[itemprop="startDate"], meta[itemprop="datePublished"]');
                if (metaDate && metaDate.content) {
                    const parsed = new Date(metaDate.content).getTime();
                    if (!isNaN(parsed)) streamStartTime = parsed;
                } else {
                    const html = document.documentElement.innerHTML;
                    const timeMatch = html.match(/"(?:startTimestamp|startDate)"\s*:\s*"([^"]+)"/);
                    if (timeMatch && timeMatch[1]) {
                        const parsed = new Date(timeMatch[1]).getTime();
                        if (!isNaN(parsed)) streamStartTime = parsed;
                    }
                }
            }

            // CCV Extraction (FROZEN)

            const metadata = document.querySelector('ytd-watch-metadata') || document.querySelector('#primary-inner') || document.body;
            if (metadata) {
                const text = metadata.textContent || "";
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
    // KICK: NATIVE API POLLING (RESTORED)
    // ==========================================
    if (window.location.hostname.includes('kick.com')) {
        try {
            const currentPath = window.location.pathname.toLowerCase();
            const channelName = currentPath.split('/')[1]?.split('?')[0];
            if (lockedKickChannel && channelName !== lockedKickChannel) return;

            if (channelName) {
                activeChannelName = channelName;
                
                // Throttle API to 5 seconds to prevent rate limits, while keeping 1s caching for the pool
                if (Date.now() - lastKickFetch > 5000 || cachedKickViews === 0) {
                    lastKickFetch = Date.now();
                    const res = await fetch(`https://kick.com/api/v2/channels/${channelName}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.livestream) {
                            cachedKickViews = data.livestream.viewer_count || 0;
                            activeSessionId = data.livestream.id.toString();
                            if (!streamStartTime && data.livestream.created_at) {
                                streamStartTime = new Date(data.livestream.created_at).getTime();
                            }
                        } else {
                            cachedKickViews = 0;
                        }
                    } else {
                        cachedKickViews = 0;
                    }
                }
            }
            kickViews = cachedKickViews;
        } catch (e) {
            console.error("[LiveKit] Kick Pool Error:", e);
            kickViews = cachedKickViews; // Keep caching last known value on transient network errors
        }
    }

    // ==========================================
    // POOL & LOG
    // ==========================================
    if (ytViews > 0 || kickViews > 0) {
        if (!streamStartTime) streamStartTime = Date.now(); // Failsafe
        
        viewerDataPool.push({ total: ytViews + kickViews, yt: ytViews, kick: kickViews });
        const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
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

