import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface TelemetryRow {
  id?: string;
  channel_name: string;
  platform: 'youtube' | 'kick';
  session_id: string;
  interval_peak: number;
  interval_avg: number;
  recorded_at: string;
  stream_time_seconds: number;
  sync_code: string;
}

export function useTelemetry(syncCode: string | null) {
  const [data, setData] = useState<TelemetryRow[]>([]);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!syncCode) return;

    // 1. Fetch campaign name + historical data for this campaign on mount
    const fetchData = async () => {
      const { data: camp } = await supabase.from('campaigns').select('campaign_name').eq('sync_code', syncCode).single();
      if (camp) setCampaignName(camp.campaign_name);

      const { data: history } = await supabase
        .from('stream_intervals')
        .select('*')
        .eq('sync_code', syncCode)
        .order('recorded_at', { ascending: true });

      if (history) setData(history);
      setLoading(false);
    };

    fetchData();

    // 2. Subscribe to real-time database INSERTS via WebSockets
    const channel = supabase
      .channel(`telemetry-${syncCode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stream_intervals', filter: `sync_code=eq.${syncCode}` },
        (payload) => setData((prev) => [...prev, payload.new as TelemetryRow])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [syncCode]);

  return { data, loading, campaignName };
}
