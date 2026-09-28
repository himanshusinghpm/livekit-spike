/**
 * LiveKit 60-Second Data Pooling Engine
 * Compresses per-second DOM scrapes into one lightweight API payload per minute.
 */

let viewerDataPool = [];
const POOLING_INTERVAL_MS = 60000; // 60 seconds

// 1. The Data Ingestion Function (Call this every second when you scrape the DOM)
export function logViewerTick(youtubeCount, kickCount) {
    viewerDataPool.push({
        youtube: Number(youtubeCount) || 0,
        kick: Number(kickCount) || 0,
        total: (Number(youtubeCount) || 0) + (Number(kickCount) || 0),
        timestamp: Date.now()
    });
}

// 2. The 60-Second Aggregation & Flush Cycle
setInterval(async () => {
    if (viewerDataPool.length === 0) return;

    // A. Calculate Peaks (Math.max across the pool)
    const peaks = {
        youtube: Math.max(...viewerDataPool.map(d => d.youtube)),
        kick: Math.max(...viewerDataPool.map(d => d.kick)),
        total: Math.max(...viewerDataPool.map(d => d.total))
    };

    // B. Calculate Averages (Sum / Length)
    const averages = {
        youtube: Math.round(viewerDataPool.reduce((sum, d) => sum + d.youtube, 0) / viewerDataPool.length),
        kick: Math.round(viewerDataPool.reduce((sum, d) => sum + d.kick, 0) / viewerDataPool.length),
        total: Math.round(viewerDataPool.reduce((sum, d) => sum + d.total, 0) / viewerDataPool.length)
    };

    // C. Prepare the Lightweight Payload
    const { creatorId } = await chrome.storage.local.get('creatorId');
    if (!creatorId) return;

    const payload = {
        creator_id: creatorId,
        peak_ccv: peaks.total,
        avg_ccv: averages.total,
        youtube_peak: peaks.youtube,
        kick_peak: peaks.kick,
        samples_collected: viewerDataPool.length,
        timestamp: new Date().toISOString()
    };

    // D. Clear the pool immediately to catch the next 60s without dropping frames
    viewerDataPool = [];

    // E. Ship to Supabase via REST API
    try {
        await fetch('https://clazwbjisevatertfjyt.supabase.co/rest/v1/telemetry_events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXp3Ymppc2V2YXRlcnRmanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjI5ODcsImV4cCI6MjEwNTg5ODk4N30.alnz2uEgVvCIQu4JaB6VQisxVx9xuhk3TT5qZvA2OM4',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXp3Ymppc2V2YXRlcnRmanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMjI5ODcsImV4cCI6MjEwNTg5ODk4N30.alnz2uEgVvCIQu4JaB6VQisxVx9xuhk3TT5qZvA2OM4',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });
        console.log(`[LiveKit] Flushed 60s Telemetry. Peak: ${payload.peak_ccv}, Avg: ${payload.avg_ccv}`);
    } catch (error) {
        console.error("[LiveKit] Telemetry Sync Failed:", error);
    }
}, POOLING_INTERVAL_MS);