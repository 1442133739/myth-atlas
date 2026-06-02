export type MythTheme =
  | "sun"
  | "flood"
  | "fire"
  | "dragon"
  | "love"
  | "moon"
  | "underworld"
  | "hero"
  | "creation";

export type MythEra = "ancient" | "classical" | "medieval" | "modern";

export interface Story {
  id: string;
  titleZh: string;
  titleEn: string;
  country: string;
  countryEn: string;
  region: string;
  lat: number;
  lng: number;
  theme: MythTheme;
  era: MythEra;
  icon: string;
  imageUrl: string;
  summaryZh: string;
  summaryEn: string;
  relatedStoryIds: string[];
}

export interface AppState {
  favoriteIds: string[];
  recentIds: string[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
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
