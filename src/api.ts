import type { AppState, Comment, CountrySummary, MythEra, MythTheme, PublicUser, Story, StoryDetails } from "./types";

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const fetchStories = (params: {
  theme: MythTheme;
  era: MythEra;
  q: string;
  country: string;
}) => {
  const search = new URLSearchParams();
  if (params.theme !== "all") search.set("theme", params.theme);
  if (params.era !== "all") search.set("era", params.era);
  if (params.q) search.set("q", params.q);
  if (params.country) search.set("country", params.country);
  return request<Story[]>(`/api/stories?${search.toString()}`);
};

export const fetchStoryDetails = (id: string) => request<StoryDetails>(`/api/stories/${id}`);

export const fetchCountries = () => request<CountrySummary[]>("/api/countries");

export const fetchState = () => request<AppState>("/api/state");

export const toggleFavorite = (id: string) =>
  request<AppState>(`/api/favorites/${id}`, {
    method: "POST"
  });

export const register = (payload: { username: string; displayName: string; password: string }) =>
  request<PublicUser>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

export const login = (payload: { username: string; password: string }) =>
  request<PublicUser>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

export const postComment = (storyId: string, payload: { userId: string; body: string }) =>
  request<Comment>(`/api/stories/${storyId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
