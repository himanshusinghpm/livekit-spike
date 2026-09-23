// spike.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_VIDEO_ID = "JZO1vXkkpXY";
const KICK_CHANNEL_SLUG = "soulaman";

if (!YOUTUBE_API_KEY) {
    throw new Error("Missing YOUTUBE_API_KEY. Copy .env.example to .env and add your key.");
}

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
        // Launch a hidden browser instance
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Navigate directly to the JSON endpoint
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Extract the raw text from the browser body
        const content = await page.evaluate(() => document.querySelector("body").innerText);
        const data = JSON.parse(content);
        
        if (data.livestream) {
            return data.livestream.viewer_count;
        }
        return 0; // Offline
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
    console.log("Starting Data Extraction Spike (Stealth Mode)...\n");
    const startTime = Date.now();

    const [ytViewers, kickViewers] = await Promise.all([
        getYouTubeLiveStats(YOUTUBE_VIDEO_ID),
        getKickLiveStatsStealth(KICK_CHANNEL_SLUG)
    ]);

    const executionTime = (Date.now() - startTime) / 1000;

    const result = {
        timestamp: new Date().toISOString(),
        youtube_ccv: ytViewers,
        kick_ccv: kickViewers,
        total_ccv: (ytViewers || 0) + (kickViewers || 0),
        status: (ytViewers === null || kickViewers === null) ? "PARTIAL_FAILURE" : "SUCCESS",
        execution_time_seconds: executionTime
    };

    console.log("\n--- FINAL RESULTS ---");
    console.log(JSON.stringify(result, null, 2));
}

runSpike();