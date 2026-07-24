export type TripStatus = "collecting" | "generated" | "finalized";
export type ActivityLevel = "relaxing" | "balanced" | "adventurous";
export type ReactionType = "up" | "down";
export type InterestLevel = "low" | "medium" | "high";
export type PacePreference = "relaxed" | "balanced" | "packed";

export interface Trip {
  id: string;
  slug: string;
  organizer_name: string;
  status: TripStatus;
  cover_image_url: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
  email: string | null;
  edit_token: string | null;
  created_at: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Submission {
  id: string;
  trip_id: string;
  participant_id: string;
  budget_amount: number;
  budget_currency: string;
  available_dates: DateRange[];
  desired_trip_length_days: number | null;
  departure_location: string | null;
  activity_level: ActivityLevel;
  must_haves: string[];
  dealbreakers: string[];
  activity_interests: string[];
  favorite_cuisines: string[] | null;
  languages_spoken: string[] | null;
  bucket_list_interest: InterestLevel | null;
  nightlife_interest: InterestLevel | null;
  pace_preference: PacePreference | null;
  submitted_at: string;
  updated_at: string;
}

export interface ItineraryReaction {
  id: string;
  generated_output_id: string;
  participant_id: string;
  option_index: number;
  reaction: ReactionType;
  created_at: string;
}

export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface ItineraryDay {
  day_number: number;
  activities: string[];
  locations?: GeocodedLocation[];
}

export interface CostBreakdown {
  lodging: number;
  food: number;
  activities: number;
  local_transport: number;
  flights: number;
}

export interface ItineraryOption {
  destination: string;
  destination_reasoning: string;
  tagline?: string;
  photo_url?: string | null;
  label: string;
  estimated_cost_per_person?: number;
  estimated_cost_currency?: string;
  cost_breakdown?: CostBreakdown;
  days: ItineraryDay[];
}

export interface GeneratedOutput {
  id: string;
  trip_id: string;
  destination_pick: string | null;
  itinerary_options: ItineraryOption[] | null;
  open_questions: string[] | null;
  locked_option_index: number | null;
  locked_at: string | null;
  regeneration_feedback: string | null;
  recommended_start_date: string | null;
  created_at: string;
}

export interface TripRecommendation {
  id: string;
  trip_id: string;
  participant_id: string;
  place_name: string;
  note: string | null;
  created_at: string;
}
