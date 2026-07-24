-- Optional contact so a nudge can actually notify someone (item 6). Nullable
-- — the app never requires an email, this just unlocks real notifications
-- for participants who choose to share one.
alter table participants add column email text;

-- Explicit trip-requirements gap fixes: where someone is flying from (so
-- flight cost can factor into the budget estimate) and how many days they
-- actually want the trip to be (previously only inferred from date-range
-- overlap, which is why "7 days available" could still produce a 4-day plan).
alter table submissions add column departure_location text;
alter table submissions add column desired_trip_length_days integer;
