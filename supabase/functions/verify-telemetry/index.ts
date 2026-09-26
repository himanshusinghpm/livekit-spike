import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SECRET_KEY = Deno.env.get('LIVEKIT_SECRET_KEY') || '';

// Standardize CORS headers for ALL responses (success and error)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-livekit-signature',
};

async function verifySignature(payloadString: string, providedSignature: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadString));
    const expectedSignature = Array.from(new Uint8Array(expectedSignatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expectedSignature === providedSignature;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get('x-livekit-signature');
        if (!signature) {
            // ADDED CORS HEADERS TO ERROR
            return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const payloadString = await req.text();
        
        const isValid = await verifySignature(payloadString, signature);
        if (!isValid) {
            // ADDED CORS HEADERS TO ERROR
            return new Response(JSON.stringify({ error: 'Cryptographic verification failed.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const payload = JSON.parse(payloadString);
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data, error } = await supabaseClient
            .from('stream_intervals')
            .insert([
                {
                    channel_name: payload.channel,
                    platform: payload.platform,
                    session_id: payload.session_id,
                    interval_peak: payload.interval_peak,
                    interval_avg: payload.interval_avg,
                    recorded_at: payload.timestamp,
                    stream_time_seconds: payload.stream_time_seconds
                }
            ]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: 'Stored!' }), {
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
