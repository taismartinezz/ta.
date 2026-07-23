-- Cover image for trip history cards — generated once a destination is
-- picked (at itinerary-generation time), so this stays null until then.
alter table trips add column cover_image_url text;

-- Deeper, optional personalization (soft signals only — used to bias
-- itinerary generation, never required, never block submission).
alter table submissions add column favorite_cuisines text[];
alter table submissions add column languages_spoken text[];
alter table submissions add column bucket_list_interest text; -- 'low' | 'medium' | 'high'
alter table submissions add column nightlife_interest text; -- 'low' | 'medium' | 'high'
alter table submissions add column pace_preference text; -- 'relaxed' | 'balanced' | 'packed'

-- Lightweight recommendation capture (v1 — attributed within the same trip
-- only; cross-trip destination matching is deferred, not built here).
create table trip_recommendations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) not null,
  participant_id uuid references participants(id) not null,
  place_name text not null,
  note text,
  created_at timestamptz default now()
);
