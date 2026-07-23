-- trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, -- short random string, used in the shareable link e.g. /trip/abc123
  organizer_name text not null,
  status text not null default 'collecting', -- collecting | generated | finalized
  created_at timestamptz default now()
);

-- participants (someone who opened the link and entered a name — no auth/login)
create table participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  name text not null,
  created_at timestamptz default now()
);

-- submissions (one per participant per trip)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  participant_id uuid references participants(id) not null,
  budget_amount numeric not null,
  budget_currency text default 'USD',
  available_dates jsonb not null, -- array of date ranges, e.g. [{"start":"2026-08-01","end":"2026-08-07"}]
  activity_level text not null, -- 'relaxing' | 'balanced' | 'adventurous'
  must_haves text[], -- free text tags
  dealbreakers text[],
  activity_interests text[], -- e.g. ['hiking','beach','museums','nightlife']
  submitted_at timestamptz default now()
);

-- budget_flags (tracks the private outlier-flagging flow)
create table budget_flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) not null,
  flagged_as_outlier boolean not null,
  participant_adjusted boolean default false, -- did they change their number after seeing the flag
  shared_to_group_anonymously boolean default false, -- did they opt to surface it
  created_at timestamptz default now()
);

-- generated_outputs (one row per generation run for a trip)
create table generated_outputs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  raw_llm_response jsonb not null, -- full response, for debugging/evals
  destination_pick text,
  itinerary_options jsonb, -- array of 2 itinerary objects, see prompt schema below
  open_questions text[],
  created_at timestamptz default now()
);

-- Realtime: track submission/participant *existence* only (live group view),
-- never broadcast raw submission content to everyone.
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table submissions;
