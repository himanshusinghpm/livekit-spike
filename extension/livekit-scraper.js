if (typeof window.livekitScraperInjected === 'undefined') {
  window.livekitScraperInjected = true;
  
  console.log("[LiveKit] Scraper Active (V19 - Strict Video Isolation).");
  let viewerDataPool = [];
  let activeSessionId = null;
  let activeChannelName = "LiveKit Creator";
  let streamStartTime = null;
  let lastUrl = window.location.href; 

  let lockedKickChannel = null;
  let lockedYtChannel = null;
  function applyLocks(res) {
      if (res.targetKick || res.kickChannel) lockedKickChannel = (res.targetKick || res.kickChannel).toLowerCase();
      if (res.targetYt || res.ytChannel) lockedYtChannel = (res.targetYt || res.ytChannel).toLowerCase();
  }
  chrome.storage.local.get(['targetKick', 'targetYt', 'kickChannel', 'ytChannel'], applyLocks);
  
  let cachedKickViews = 0;
  let cachedYtViews = 0; 
  let lastKickFetch = 0;

  chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.targetKick || changes.targetYt || changes.kickChannel || changes.ytChannel || changes.syncCode) {
          viewerDataPool = [];
          activeSessionId = null;
          streamStartTime = null;
          cachedKickViews = 0;
          cachedYtViews = 0;
          lastKickFetch = 0;
          chrome.storage.local.get(['targetKick', 'targetYt', 'kickChannel', 'ytChannel'], applyLocks);
      }
  });

  let livekitStopped = false;
  try {
      chrome.runtime.onMessage.addListener((msg) => {
          if (msg && msg.action === 'LIVEKIT_STOP') {
              livekitStopped = true;
              viewerDataPool = [];
          }
      });
  } catch (_) {}

  async function poolData() {
      if (livekitStopped) return;

      // ==========================================
      // SPA STATE RESET
      // ==========================================
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
          console.log("[LiveKit] SPA Navigation Detected. Resetting telemetry pool.");
          viewerDataPool = [];
          activeSessionId = null;
          streamStartTime = null;
          cachedYtViews = 0;
          cachedKickViews = 0;
          lastUrl = currentUrl;
      }

      let ytViews = 0, kickViews = 0;

      // ==========================================
      // YOUTUBE: ARIA LABEL EXTRACTION 
      // ==========================================
      if (window.location.hostname.includes('youtube.com')) {
          try {
              // 1. URL Route Guard: ONLY scrape on actual video pages
              const isWatchPage = window.location.pathname.includes('/watch') || window.location.pathname.includes('/live');
              
              if (!isWatchPage) {
                  cachedYtViews = 0;
                  activeSessionId = null;
              } else {
                  let shouldExtractYt = true;
                  let currentChannel = "";
                  const authorTag = document.querySelector('span[itemprop="author"] link[itemprop="name"]');
                  const channelLink = document.querySelector('#owner ytd-channel-name a, #channel-name a');

                  if (authorTag && authorTag.content) currentChannel = authorTag.content.trim();
                  else if (channelLink && channelLink.textContent) currentChannel = channelLink.textContent.trim();

                  if (currentChannel) {
                      activeChannelName = currentChannel;
                      if (lockedYtChannel) {
                          const normCurrent = currentChannel.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const normLocked = lockedYtChannel.toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (normCurrent !== normLocked && !normCurrent.includes(normLocked) && !normLocked.includes(normCurrent)) {
                              // User is watching a different creator's video
                              shouldExtractYt = false;
                          }
                      }
                  } else if (lockedYtChannel) {
                      // If locked but channel hasn't loaded yet, hold off
                      shouldExtractYt = false;
                  }

                  if (shouldExtractYt) {
                      if (!activeSessionId) activeSessionId = new URLSearchParams(window.location.search).get('v');

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

                      // 2. Strict Scoping: Target 'ytd-watch-metadata' exclusively
                      let extractedYtViews = 0;
                      const ariaNodes = document.querySelectorAll('ytd-watch-metadata [aria-label*="watching" i]');
                      
                      for (let i = 0; i < ariaNodes.length; i++) {
                          const ariaText = ariaNodes[i].getAttribute('aria-label') || '';
                          const match = ariaText.match(/([0-9]{1,3}(?:,[0-9]{3})*)\s*watching/i);
                          if (match && match[1]) {
                              const num = parseInt(match[1].replace(/,/g, ''), 10);
                              if (!isNaN(num) && num > 0) {
                                  extractedYtViews = num;
                                  break; 
                              }
                          }
                      }
                      
                      // Fallback: Also strictly scoped
                      if (extractedYtViews === 0) {
                          const metaBlock = document.querySelector('ytd-watch-metadata');
                          if (metaBlock) {
                              const clone = metaBlock.cloneNode(true);
                              const hiddenElements = clone.querySelectorAll('tp-yt-paper-tooltip, [hidden], .hidden');
                              hiddenElements.forEach(el => el.remove());
                              const match = (clone.textContent || '').match(/([0-9]{1,3}(?:,[0-9]{3})*)\s*watching/i);
                              if (match && match[1]) {
                                  const num = parseInt(match[1].replace(/,/g, ''), 10);
                                  if (!isNaN(num) && num > 0) {
                                      extractedYtViews = num;
                                  }
                              }
                          }
                      }
                      
                      if (extractedYtViews > 0) {
                          cachedYtViews = extractedYtViews;
                      }
                  } else {
                      cachedYtViews = 0;
                  }
              }
              ytViews = cachedYtViews;

          } catch (e) {
              console.error("[LiveKit] YT Pool Error:", e);
              ytViews = cachedYtViews; 
          }
      }

      // ==========================================
      // KICK: NATIVE API POLLING
      // ==========================================
      if (window.location.hostname.includes('kick.com')) {
          try {
              const currentPath = window.location.pathname.toLowerCase();
              const channelName = currentPath.split('/')[1]?.split('?')[0];
              if (lockedKickChannel && channelName !== lockedKickChannel) return;

              if (channelName) {
                  activeChannelName = channelName;

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
              kickViews = cachedKickViews; 
          }
      }

      // ==========================================
      // POOL & LOG
      // ==========================================
      if (ytViews > 0 || kickViews > 0) {
          if (!streamStartTime) streamStartTime = Date.now(); 

          viewerDataPool.push({ total: ytViews + kickViews, yt: ytViews, kick: kickViews });
          const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
          console.log(`[LiveKit] Pooled -> YT: ${ytViews} | Kick: ${kickViews} | Session: ${activeSessionId} | Elapsed: ${elapsed}s`);
          
          try { chrome.runtime.sendMessage({ action: "SET_BADGE", payload: "LIVE" }); } catch(e) {}
      } else {
          try { chrome.runtime.sendMessage({ action: "SET_BADGE", payload: "" }); } catch(e) {}
      }
  }

  var livekitPoolTimer = setInterval(poolData, 1000);

  var livekitFlushTimer = setInterval(() => {
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

} else {
  console.log("[LiveKit] Scraper already active in this tab. Skipping duplicate injection.");
}