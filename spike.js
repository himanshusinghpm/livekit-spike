// spike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY"; // Put your key back here
const YOUTUBE_VIDEO_ID = "YOUR_LIVE_VIDEO_ID";  // Put a currently live YT ID here
const KICK_CHANNEL_SLUG = "YOUR_KICK_SLUG";     // Put a currently live Kick slug here

async function getYouTubeLiveStats(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0 && data.items[0].liveStreamingDetails) {
            const viewers = data.items[0].liveStreamingDetails.concurrentViewers;
            return viewers ? parseInt(viewers, 10) : 0;
        }
        return 0;
    } catch (error) {
        console.error("YouTube API Error:", error.message);
        return null;
    }
}

async function getKickLiveStatsStealth(slug) {
    console.log("Launching headless browser for Kick...");
    const url = `https://kick.com/api/v2/channels/${slug}`; 
    let browser;
    
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const content = await page.evaluate(() => document.body.innerText);
        const data = JSON.parse(content);
        
        if (data.livestream) {
            return data.livestream.viewer_count;
        }
        return 0; 
    } catch (error) {
        console.error("Kick Stealth API Error:", error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function runSpike() {
    console.log("Starting Data Extraction Spike (Datacenter Test)...\n");

    const [ytViewers, kickViewers] = await Promise.all([
        getYouTubeLiveStats(YOUTUBE_VIDEO_ID),
        getKickLiveStatsStealth(KICK_CHANNEL_SLUG)
    ]);

    // CORRECTNESS FIX: Strict Null Checking
    const isYtValid = typeof ytViewers === 'number';
    const isKickValid = typeof kickViewers === 'number';

    const result = {
        timestamp: new Date().toISOString(),
        youtube_ccv: isYtValid ? ytViewers : null,
        kick_ccv: isKickValid ? kickViewers : null,
        total_ccv: (isYtValid && isKickValid) ? (ytViewers + kickViewers) : null,
        status: (isYtValid && isKickValid) ? "SUCCESS" : "ERROR_DATA_MISSING"
    };

    console.log("\n--- FINAL RESULTS ---");
    console.log(JSON.stringify(result, null, 2));
}

runSpike();