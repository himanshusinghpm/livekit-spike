'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { Activity, Users, Clock, Radio } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChannel, setCurrentChannel] = useState('deenthegreat');

  useEffect(() => {
    async function fetchTelemetry() {
      const { data: intervals, error } = await supabase
        .from('stream_intervals')
        .select('*')
        .eq('channel_name', currentChannel)
        .order('recorded_at', { ascending: true });

      if (error) return console.error('Error fetching data:', error);

      // Clean dirty data
      const cleanData = intervals.filter(row => row.stream_time_seconds && row.stream_time_seconds > 60);

      // Extract unique Session IDs for the dropdown
      const uniqueSessions = Array.from(new Set(cleanData.map(row => row.session_id).filter(Boolean))) as string[];
      setSessions(uniqueSessions);
      
      const activeSession = selectedSession || (uniqueSessions.length > 0 ? uniqueSessions[uniqueSessions.length - 1] : null);
      if (!selectedSession && activeSession) setSelectedSession(activeSession);

      // Filter data by selected session (or time window)
      const sessionData = cleanData.filter(row => row.session_id === activeSession || row.platform === 'youtube');

      // Map/Reduce: Group by the minute to align dual-stream telemetry
      const timeMap = new Map();
      
      sessionData.forEach(row => {
        if (!row.recorded_at) return;
        
        const date = new Date(row.recorded_at);
        date.setSeconds(0, 0); 
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!timeMap.has(timeStr)) {
          timeMap.set(timeStr, { 
            timeLabel: timeStr, 
            kick: 0, 
            youtube: 0, 
            total: 0,
            stream_time_seconds: row.stream_time_seconds
          });
        }

        const entry = timeMap.get(timeStr);
        if (row.platform === 'kick') entry.kick = row.interval_peak || 0;
        if (row.platform === 'youtube') entry.youtube = row.interval_peak || 0;
        
        entry.total = entry.kick + entry.youtube;
      });

      const mergedData = Array.from(timeMap.values());
      
      // Calculate time labels based on stream seconds
      const formattedData = mergedData.map((row) => {
        const hours = Math.floor(row.stream_time_seconds / 3600);
        const minutes = Math.floor((row.stream_time_seconds % 3600) / 60);
        const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        return { ...row, timeLabel: timeLabel };
      });

      setData(formattedData);
      setLoading(false);
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 60000);
    return () => clearInterval(interval);
  }, [currentChannel, selectedSession]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-orange-500 font-mono animate-pulse">Establishing Broadcast Link...</div>;
  }

  const latestData = data[data.length - 1];
  const peakTotal = Math.max(...data.map(d => d.total || 0));
  const avgTotal = Math.round(data.reduce((acc, curr) => acc + (curr.total || 0), 0) / (data.length || 1));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans selection:bg-orange-500/30">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              <p className="text-orange-500 font-mono text-xs tracking-[0.2em] uppercase">ON AIR / TELEMETRY FEED</p>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Live Campaign <span className="text-orange-500">Telemetry</span></h1>
            <p className="text-slate-500 text-sm max-w-md">A real-time control surface for audience velocity, campaign health, and signal integrity.</p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="bg-[#111111] px-4 py-3 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-orange-500" />
                <span className="text-xs font-mono text-slate-400">SESSION</span>
              </div>
              <select 
                className="bg-transparent text-white font-mono text-sm outline-none cursor-pointer w-full text-right"
                value={selectedSession || ''}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                {sessions.length === 0 && <option value="">No Broadcasts</option>}
                {sessions.map(id => (
                  <option key={id} value={id} className="bg-slate-900">{id}</option>
                ))}
              </select>
            </div>
            <div className="bg-orange-500/10 px-4 py-2 rounded-lg text-orange-500 font-mono text-sm border border-orange-500/20 text-right">
              TARGET // @{currentChannel.toUpperCase()}
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'PEAK CCV (AGGREGATED)', value: peakTotal.toLocaleString(), icon: Users, desc: 'All-time high for session' },
            { label: 'AVG CCV (AGGREGATED)', value: avgTotal.toLocaleString(), icon: Activity, desc: 'Session average' },
            { label: 'SESSION DURATION', value: latestData?.timeLabel || '--', icon: Clock, desc: 'Live window' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#111111] p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs tracking-widest uppercase">
                  <stat.icon size={14} className="text-orange-500" /> 
                  <span>{stat.label}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-white tracking-tight">{stat.value || '--'}</div>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-mono">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-[#111111] p-6 rounded-xl border border-slate-800 h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-sm font-mono tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]">01</span>
              Viewership Timeline
            </h2>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border border-slate-800 px-2 py-1 rounded">VOD Relative</span>
          </div>
          
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#4b5563" tick={{fill: '#4b5563', fontSize: 11, fontFamily: 'monospace'}} tickMargin={10} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" tick={{fill: '#4b5563', fontSize: 11, fontFamily: 'monospace'}} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#374151', color: '#f8fafc', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                />
                
                <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af', paddingBottom: '15px' }} />
                
                <Area type="monotone" dataKey="kick" name="Kick" stroke="#53fc18" strokeWidth={2} fillOpacity={0.05} fill="#53fc18" />
                <Area type="monotone" dataKey="youtube" name="YouTube" stroke="#ff0000" strokeWidth={2} fillOpacity={0.05} fill="#ff0000" />
                <Area type="monotone" dataKey="total" name="Total Audience" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorOrange)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}