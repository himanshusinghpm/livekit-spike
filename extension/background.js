const DEFAULT_EDGE_FUNCTION_URL = "https://clazwbjisevatertfjyt.supabase.co/functions/v1/verify-telemetry";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FLUSH_TELEMETRY") {
        chrome.storage.local.get(['syncCode', 'supabaseUrl'], (res) => {
            if (!res.syncCode) return console.error("[LiveKit] No Sync Code found.");
            const url = res.supabaseUrl ? `${res.supabaseUrl.trim().replace(/\/+$/, '')}/functions/v1/verify-telemetry` : DEFAULT_EDGE_FUNCTION_URL;
            
            // Append sync_code to payload for backend relational mapping
            const finalPayload = { ...request.payload, sync_code: res.syncCode };
            
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            })
            .then(response => console.log(`[LiveKit] Supabase Sync Status: ${response.status}`))
            .catch(err => console.error("[LiveKit] Supabase Sync Failed:", err));
        });
    }
});
            

            

                

                    

                    


