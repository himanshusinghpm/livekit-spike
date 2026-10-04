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

        // Verify sync_code is live before writing. Defense-in-depth alongside
        // the stream_intervals RLS policy (anon INSERTs without a valid code
        // are rejected at the database even if this check is bypassed).
        const code = (sync_code || '').trim();
        if (!code) {
            return new Response(JSON.stringify({ error: 'Missing sync_code' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: lead } = await supabaseClient
            .from('leads')
            .select('sync_code,status')
            .eq('sync_code', code)
            .eq('status', 'active')
            .maybeSingle();

        if (!lead) {
            const { data: camp } = await supabaseClient
                .from('campaigns')
                .select('sync_code,status')
                .eq('sync_code', code)
                .in('status', ['active', 'pending'])
                .maybeSingle();
            if (!camp) {
                return new Response(JSON.stringify({ error: 'Invalid or expired Sync-Code' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 403,
                });
            }
        }

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