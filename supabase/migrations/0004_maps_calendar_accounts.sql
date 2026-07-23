-- Recommended trip start date (from the LLM's overlap reasoning) — needed to
-- anchor relative day_number values to real calendar dates for the .ics export.
alter table generated_outputs add column recommended_start_date date;

-- Basic accounts (optional layer): a logged-in user's trips/joins get linked
-- to their auth.users id so they can see history and reuse past preferences.
-- The link-based, no-login flow keeps working unchanged for everyone else —
-- these columns are nullable, not a requirement to use the app.
alter table trips add column created_by uuid references auth.users(id);
alter table participants add column user_id uuid references auth.users(id);
