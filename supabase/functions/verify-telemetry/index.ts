import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-livekit-signature, x-signature',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payloadString = await req.text();
        const payload = JSON.parse(payloadString);
        
        const {
            channel_name,
            channel,
            platform,
            session_id,
            interval_peak,
            interval_avg,
            stream_time_seconds,
            timestamp,
            sync_code
        } = payload;

        const finalChannelName = channel_name || channel || 'unknown';

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data, error } = await supabaseClient
            .from('stream_intervals')
            .insert([
                {
                    channel_name: finalChannelName,
                    platform: platform,
                    session_id: session_id,
                    interval_peak: interval_peak,
                    interval_avg: interval_avg,
                    recorded_at: timestamp || new Date().toISOString(),
                    stream_time_seconds: stream_time_seconds || 0,
                    sync_code: sync_code
                }
            ]);

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return new Response(JSON.stringify({ success: true, message: 'Stored successfully (Auth Bypassed for MVP)!' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})