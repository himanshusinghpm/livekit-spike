-- LiveKit telemetry hardening: enforce that stream_intervals INSERTs only land
-- when the incoming sync_code belongs to an ACTIVE account.
-- Covers both anchors:
--   1) public.leads      (sync_code + status='active') — primary paid-account gate
--   2) public.campaigns  (sync_code + status IN ('active','pending')) — LK- campaign handshake
-- Idempotent: safe to re-run via `supabase db push`.

-- Ensure sync_code column exists on leads (leads predates sync codes).
alter table public.leads add column if not exists sync_code text;

-- Unique index so the EXISTS() checks below are cheap and deterministic.
create unique index if not exists leads_sync_code_uidx on public.leads (sync_code);

-- ---------------------------------------------------------------------------
-- stream_intervals hardening (telemetry table written by verify-telemetry + REST)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.stream_intervals') is null then
    create table public.stream_intervals (
      id uuid primary key default gen_random_uuid(),
      channel_name text,
      platform text,
      session_id text,
      interval_peak integer,
      interval_avg integer,
      recorded_at timestamptz default now(),
      stream_time_seconds integer default 0,
      sync_code text,
      created_at timestamptz default now()
    );
  else
    alter table public.stream_intervals add column if not exists sync_code text;
    alter table public.stream_intervals add column if not exists channel_name text;
    alter table public.stream_intervals add column if not exists platform text;
    alter table public.stream_intervals add column if not exists session_id text;
    alter table public.stream_intervals add column if not exists interval_peak integer;
    alter table public.stream_intervals add column if not exists interval_avg integer;
    alter table public.stream_intervals add column if not exists recorded_at timestamptz;
    alter table public.stream_intervals add column if not exists stream_time_seconds integer;
  end if;
end
$$;

alter table public.stream_intervals enable row level security;

-- Drop legacy permissive policies (if any) so junk inserts cannot slip through.
drop policy if exists stream_intervals_insert_any on public.stream_intervals;
drop policy if exists stream_intervals_insert_valid_sync on public.stream_intervals;
drop policy if exists stream_intervals_select_own on public.stream_intervals;
drop policy if exists stream_intervals_read on public.stream_intervals;

-- INSERT gate: sync_code must match an ACTIVE lead OR a live campaign.
-- anon + authenticated both funnel through the extension / edge function.
create policy stream_intervals_insert_valid_sync
  on public.stream_intervals
  for insert
  to anon, authenticated
  with check (
    sync_code is not null
    and btrim(sync_code) <> ''
    and (
      exists (
        select 1 from public.leads l
        where l.sync_code::text = btrim(stream_intervals.sync_code::text)
          and l.status = 'active'
      )
      or exists (
        select 1 from public.campaigns c
        where c.sync_code::text = btrim(stream_intervals.sync_code::text)
          and c.status in ('active', 'pending')
      )
    )
  );

-- Read path for dashboards (agency hub reads own campaign telemetry via anon key).
-- Keep permissive for MVP (sync codes are unguessable capabilities); writes are the gate.
create policy stream_intervals_read
  on public.stream_intervals
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- leads / campaigns self-read for extension sync-code validation (options.js)
-- The extension does: GET /rest/v1/leads?sync_code=eq.XXX&select=sync_code,status
-- Without a SELECT policy, anon reads return [] and every code looks invalid.
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.campaigns enable row level security;

drop policy if exists leads_validate_sync_code on public.leads;
create policy leads_validate_sync_code
  on public.leads
  for select
  to anon, authenticated
  using (true);

drop policy if exists campaigns_validate_sync_code on public.campaigns;
create policy campaigns_validate_sync_code
  on public.campaigns
  for select
  to anon, authenticated
  using (true);

grant select on public.leads to anon, authenticated;
grant select on public.campaigns to anon, authenticated;
grant insert on public.stream_intervals to anon, authenticated;
grant select on public.stream_intervals to anon, authenticated;
