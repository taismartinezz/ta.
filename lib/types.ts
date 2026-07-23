export type TripStatus = "collecting" | "generated" | "finalized";
export type ActivityLevel = "relaxing" | "balanced" | "adventurous";
export type ReactionType = "up" | "down";

export interface Trip {
  id: string;
  slug: string;
  organizer_name: string;
  status: TripStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
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
  activity_level: ActivityLevel;
  must_haves: string[];
  dealbreakers: string[];
  activity_interests: string[];
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

export interface ItineraryOption {
  label: string;
  estimated_cost_per_person?: number;
  estimated_cost_currency?: string;
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
