-- submission_events: a privacy-safe existence signal for the live group view.
-- Supabase Realtime only delivers Postgres Changes to a client if the anon
-- role has a SELECT policy for that table, and RLS is row-level (not
-- column-level) — so a policy permissive enough to power Realtime on
-- `submissions` directly would let anyone inspect the raw websocket payload
-- and read other participants' budgets/dealbreakers. This table mirrors only
-- trip_id + participant_id, so it can be safely opened up to anon while
-- `submissions` itself stays fully locked down.
create table submission_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  participant_id uuid references participants(id) not null,
  created_at timestamptz default now()
);

create or replace function public.handle_new_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into submission_events (trip_id, participant_id)
  values (new.trip_id, new.participant_id);
  return new;
end;
$$;

create trigger on_submission_insert
after insert on submissions
for each row execute function public.handle_new_submission();

-- nudges: lightweight log so a participant sees "the group is waiting on
-- you" next time they open their submit page. No email/push infra in scope,
-- so this is a pull-based signal, not a live push notification.
create table nudges (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  participant_id uuid references participants(id) not null,
  created_at timestamptz default now()
);

-- RLS: participants and submission_events carry no sensitive fields, so
-- anyone holding the trip link can read them — this is what powers the live
-- group view over Realtime. submissions/budget_flags/generated_outputs/nudges
-- stay closed to anon; all access to those goes through server routes using
-- the secret key.
alter table participants enable row level security;
create policy "participants are readable by anyone with the link"
  on participants for select
  using (true);

alter table submission_events enable row level security;
create policy "submission events are readable by anyone with the link"
  on submission_events for select
  using (true);

alter publication supabase_realtime add table submission_events;
