export type TripStatus = "collecting" | "generated" | "finalized";
export type ActivityLevel = "relaxing" | "balanced" | "adventurous";

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
}
