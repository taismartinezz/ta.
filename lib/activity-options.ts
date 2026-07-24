export const ACTIVITY_INTEREST_OPTIONS = [
  "hiking",
  "beach",
  "museums",
  "nightlife",
  "food & dining",
  "shopping",
  "relaxation & spa",
  "adventure sports",
  "sightseeing",
  "nature",
] as const;

export const ACTIVITY_INTEREST_EMOJI: Record<(typeof ACTIVITY_INTEREST_OPTIONS)[number], string> = {
  hiking: "🥾",
  beach: "🏖️",
  museums: "🖼️",
  nightlife: "🌃",
  "food & dining": "🍜",
  shopping: "🛍️",
  "relaxation & spa": "💆",
  "adventure sports": "🪂",
  sightseeing: "📸",
  nature: "🌲",
};
