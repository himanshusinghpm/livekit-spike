-- Add Dodo Payments two-way audit trail columns to leads
alter table public.leads
  add column if not exists dodo_subscription_id text,
  add column if not exists billing_email text;
