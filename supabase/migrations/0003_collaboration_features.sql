-- Editable submissions: one row per participant (enforced), with a
-- last-updated timestamp so the group can see what changed.
alter table submissions add column updated_at timestamptz default now();
alter table submissions add constraint submissions_participant_id_key unique (participant_id);

-- Identity safeguard: a private per-participant edit token so revisiting your
-- own preferences doesn't depend on localStorage surviving, and one person
-- can't accidentally land on and overwrite someone else's submission.
-- Generated in application code (crypto.randomBytes), not a SQL default, so
-- no extension dependency — nullable so existing rows aren't broken.
alter table participants add column edit_token text unique;

-- Itinerary reactions: one thumbs up/down per participant per option per
-- generation run. Re-voting updates the row (upsert on this constraint).
create table itinerary_reactions (
  id uuid primary key default gen_random_uuid(),
  generated_output_id uuid references generated_outputs(id) not null,
  participant_id uuid references participants(id) not null,
  option_index int not null,
  reaction text not null, -- 'up' | 'down'
  created_at timestamptz default now(),
  unique (generated_output_id, participant_id, option_index)
);

-- Lock-in ("this is our final choice") and regenerate-with-feedback history.
alter table generated_outputs add column locked_option_index int;
alter table generated_outputs add column locked_at timestamptz;
alter table generated_outputs add column regeneration_feedback text;

-- RLS: reactions carry no sensitive data (just a vote), so anyone with the
-- trip link can read/write via the API routes. Keep consistent with the
-- rest of the schema — writes go through server routes using the secret
-- key, but allow anon SELECT in case a future client-side read needs it.
alter table itinerary_reactions enable row level security;
create policy "itinerary reactions are readable by anyone with the link"
  on itinerary_reactions for select
  using (true);
