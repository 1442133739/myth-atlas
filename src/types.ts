export type MythTheme =
  | "all"
  | "sun"
  | "flood"
  | "fire"
  | "dragon"
  | "love"
  | "moon"
  | "underworld"
  | "hero"
  | "creation";

export type MythEra = "all" | "ancient" | "classical" | "medieval" | "modern";

export interface Story {
  id: string;
  titleZh: string;
  titleEn: string;
  country: string;
  countryEn: string;
  region: string;
  lat: number;
  lng: number;
  theme: Exclude<MythTheme, "all">;
  era: Exclude<MythEra, "all">;
  icon: string;
  imageUrl: string;
  summaryZh: string;
  summaryEn: string;
  relatedStoryIds: string[];
}

export interface CountrySummary {
  country: string;
  countryEn: string;
  region: string;
  count: number;
}

export interface AppState {
  favoriteIds: string[];
  recentIds: string[];
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  username: string;
  displayName: string;
  body: string;
  createdAt: string;
}

export interface StoryDetails {
  story: Story;
  related: Story[];
  comments: Comment[];
  state: AppState;
}
