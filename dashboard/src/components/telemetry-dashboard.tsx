'use client'

import { useEffect, useState } from 'react'
import type { ElementType } from 'react'
import { Activity, ChevronDown, Clock3, Radio, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '@/lib/supabase'

const TARGET_CHANNEL = 'deenthegreat'

type StreamInterval = {
  session_id: string | null
  interval_peak: number
  interval_avg: number
  stream_time_seconds: number
  recorded_at: string
}

/** A stream_intervals row reshaped for the chart (v0 expects `time` + `viewers`). */
type ChartPoint = StreamInterval & { time: string; viewers: number }

type Kpi = {
  label: string
  value: string
  detail: string
  icon: ElementType
  tone: string
  change: string
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : '—'
}

/** Inter-interval velocity, used for the metric card chips. */
function deltaLabel(points: ChartPoint[], key: 'interval_peak' | 'interval_avg') {
  if (points.length < 2) return '—'
  const previous = points[points.length - 2][key]
  const latest = points[points.length - 1][key]
  if (!previous) return '—'
  const pct = ((latest - previous) / previous) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function MetricCard({ label, value, detail, icon: Icon, tone, change }: Kpi) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400"><Icon aria-hidden="true" className="size-4" />{label}</div>
        <span className="metric-change">{change}</span>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3"><p className="text-3xl font-bold tracking-[-0.05em] text-stone-100 sm:text-4xl">{value}</p><p className="mb-1 text-[11px] text-stone-500">{detail}</p></div>
    </article>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">{label}</p><p className="mt-1 text-lg font-bold text-[#ff8a3d]">{payload[0].value.toLocaleString('en-US')} <span className="text-xs font-normal text-stone-400">viewers</span></p></div>
}

export function TelemetryDashboard() {
  const [data, setData] = useState<ChartPoint[]>([])
  const [sessions, setSessions] = useState<string[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentChannel] = useState(TARGET_CHANNEL)

  useEffect(() => {
    async function fetchTelemetry() {
      const { data: intervals, error } = await supabase
        .from('stream_intervals')
        .select('*')
        .eq('channel_name', currentChannel)
        .order('recorded_at', { ascending: true })

      if (error) return console.error('Error fetching data:', error)

      // VOD sanitization: drop legacy rows with a missing/zero relative timestamp
      const cleanData = (intervals as StreamInterval[]).filter(
        (row) => row.stream_time_seconds && row.stream_time_seconds > 60
      )

      // Session grouping (broadcast-isolation)
      const uniqueSessions = Array.from(
        new Set(cleanData.map((row) => row.session_id).filter((id): id is string => Boolean(id)))
      )
      setSessions(uniqueSessions)

      const activeSession =
        selectedSession || (uniqueSessions.length > 0 ? uniqueSessions[uniqueSessions.length - 1] : null)
      if (!selectedSession && activeSession) setSelectedSession(activeSession)

      const sessionData = cleanData.filter((row) => row.session_id === activeSession)

      setData(
        sessionData.map((row) => ({
          ...row,
          time: formatDuration(row.stream_time_seconds),
          viewers: row.interval_peak,
        }))
      )
      setSyncedAt(new Date().toLocaleTimeString('en-GB', { hour12: false }))
      setLoading(false)
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 60000)
    return () => clearInterval(interval)
  }, [currentChannel, selectedSession])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10100f]">
        <span className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff8a3d]">
          <span className="live-pulse size-2 rounded-full bg-[#ff8a3d]" />
          Establishing telemetry feed
        </span>
      </main>
    )
  }

  const latestData = data[data.length - 1]

  const kpis: Kpi[] = [
    { label: 'Peak CCV', value: formatCount(latestData?.interval_peak), detail: 'Session high', icon: TrendingUp, tone: 'lime', change: deltaLabel(data, 'interval_peak') },
    { label: 'Avg CCV', value: formatCount(latestData?.interval_avg), detail: 'Session average', icon: Users, tone: 'coral', change: deltaLabel(data, 'interval_avg') },
    { label: 'Session Duration', value: latestData ? formatDuration(latestData.stream_time_seconds) : '—', detail: 'Live window', icon: Clock3, tone: 'blue', change: data.length ? 'LIVE' : '—' },
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#10100f] text-stone-100">
      <div className="noise-layer pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1460px] px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
        <header className="mb-10 border-b border-stone-800/80 pb-7">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff8a3d]"><span className="live-pulse size-2 rounded-full bg-[#ff8a3d]" />On air / telemetry feed <span className="text-stone-700">//</span> Session {selectedSession ?? '—'}</div>
              <div className="flex items-center gap-3"><span className="brand-stamp">LCT<span>+</span></span><span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">Broadcast operations</span></div>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.07em] text-stone-100 sm:text-5xl lg:text-6xl">Live Campaign <span className="text-[#ff8a3d]">Telemetry</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-stone-400">A real-time control surface for audience velocity, campaign health, and signal integrity.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="session-select flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-stone-700 bg-stone-900/80 px-4 py-3 sm:w-[410px] sm:flex-none">
                <Radio aria-hidden="true" className="size-4 text-[#ff8a3d]" />
                <span className="sr-only">Select broadcast session</span>
                <select value={selectedSession ?? ''} onChange={(event) => setSelectedSession(event.target.value)} className="w-full appearance-none bg-transparent text-sm font-bold text-stone-200 outline-none">
                  {sessions.length === 0 && <option value="">No broadcasts found</option>}
                  {sessions.map((id) => (<option key={id} value={id}>Broadcast Session · {id}</option>))}
                </select>
                <ChevronDown aria-hidden="true" className="size-4 text-stone-500" />
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.06] px-4 py-3 text-sm text-stone-100"><Activity aria-hidden="true" className="size-4 text-[#ff8a3d]" /><span className="text-stone-500">Target /</span><span className="font-bold">@{currentChannel}</span></div>
            </div>
          </div>
        </header>

        <section aria-labelledby="overview-heading"><div className="mb-4 flex items-center justify-between"><h2 id="overview-heading" className="section-kicker">Session overview</h2><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600">{syncedAt ? `Synced ${syncedAt}` : 'Awaiting sync'}</span></div><div className="grid gap-3 md:grid-cols-3">{kpis.map((kpi) => <MetricCard key={kpi.label} {...kpi} />)}</div></section>

        <section className="telemetry-panel mt-5 overflow-hidden rounded-lg" aria-labelledby="timeline-heading">
          <div className="flex flex-col gap-5 border-b border-stone-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><div className="flex items-center gap-3"><span className="panel-index">01</span><h2 id="timeline-heading" className="text-lg font-bold tracking-tight text-stone-100">Viewership timeline</h2></div><p className="mt-2 pl-11 text-xs text-stone-500">VOD relative · Concurrent viewers over session runtime</p></div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"><span className="size-2 rounded-full bg-[#ff8a3d]" /> Viewers <span className="mx-2 text-stone-700">/</span> {latestData ? formatDuration(latestData.stream_time_seconds) : '—'} total</div></div>
          <div className="h-[390px] px-2 pb-5 pt-7 sm:h-[470px] sm:px-6 sm:pb-7">
            {data.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">No session telemetry recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="orangeArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8a3d" stopOpacity={0.35} /><stop offset="72%" stopColor="#ff8a3d" stopOpacity={0.08} /><stop offset="100%" stopColor="#ff8a3d" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(168,162,158,0.14)" strokeDasharray="2 6" vertical={false} /><XAxis dataKey="time" tick={{ fill: '#78716c', fontSize: 11 }} axisLine={{ stroke: 'rgba(168,162,158,0.2)' }} tickLine={false} dy={12} minTickGap={40} /><YAxis tick={{ fill: '#78716c', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`)} domain={[0, 'auto']} width={42} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(215,255,63,0.4)', strokeDasharray: '4 4' }} /><Area type="monotone" dataKey="viewers" stroke="#ff8a3d" strokeWidth={2.5} fill="url(#orangeArea)" activeDot={{ r: 5, fill: '#ff8a3d', stroke: '#10100f', strokeWidth: 3 }} /></AreaChart></ResponsiveContainer>
            )}
          </div>
        </section>
        <footer className="flex items-center justify-between pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600"><span>Intervals captured <strong className="text-stone-400">{data.length}</strong></span><span>Telemetry stream secure</span></footer>
      </div>
    </main>
  )
}

export default TelemetryDashboard

