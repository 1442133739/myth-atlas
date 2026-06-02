import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { generatedStories } from "./generatedStories";
import { moreGeneratedStories } from "./moreGeneratedStories";
import type { AppState, Comment, MythEra, MythTheme, PublicUser, Story, User } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const storiesPath = path.join(rootDir, "data", "stories.json");
const extraStoriesPath = path.join(rootDir, "data", "extraStories.json");
const statePath = path.join(rootDir, "data", "state.json");
const usersPath = path.join(rootDir, "data", "users.json");
const commentsPath = path.join(rootDir, "data", "comments.json");

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
};

const writeJson = async <T>(filePath: string, data: T) => {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
};

const publicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName
});

const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");

export const getStories = async (filters?: {
  theme?: MythTheme | "all";
  era?: MythEra | "all";
  q?: string;
  country?: string;
}) => {
  const stories = await readStories();
  const query = filters?.q?.trim().toLowerCase();
  return stories.filter((story) => {
    const matchesTheme = !filters?.theme || filters.theme === "all" || story.theme === filters.theme;
    const matchesEra = !filters?.era || filters.era === "all" || story.era === filters.era;
    const matchesCountry =
      !filters?.country ||
      story.country === filters.country ||
      story.countryEn.toLowerCase() === filters.country.toLowerCase();
    const matchesQuery =
      !query ||
      [
        story.titleZh,
        story.titleEn,
        story.country,
        story.countryEn,
        story.region,
        story.theme,
        story.era
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesTheme && matchesEra && matchesCountry && matchesQuery;
  });
};

export const getStoryById = async (id: string) => {
  const stories = await readStories();
  return stories.find((story) => story.id === id);
};

export const getState = async () => readJson<AppState>(statePath);

export const updateState = async (updater: (state: AppState) => AppState) => {
  const current = await getState();
  const next = updater(current);
  await writeJson(statePath, next);
  return next;
};

export const getCountries = async () => {
  const stories = await readStories();
  const grouped = new Map<string, { country: string; countryEn: string; region: string; count: number }>();

  for (const story of stories) {
    const current = grouped.get(story.country);
    if (current) {
      current.count += 1;
    } else {
      grouped.set(story.country, {
        country: story.country,
        countryEn: story.countryEn,
        region: story.region,
        count: 1
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
};

export const getRelatedStories = async (story: Story) => {
  const stories = await readStories();
  const explicit = stories.filter((candidate) => story.relatedStoryIds.includes(candidate.id));
  const inferred = stories
    .filter(
      (candidate) =>
        candidate.id !== story.id &&
        !story.relatedStoryIds.includes(candidate.id) &&
        (candidate.theme === story.theme || candidate.era === story.era || candidate.region === story.region)
    )
    .slice(0, 4);

  return [...explicit, ...inferred].slice(0, 6);
};

export const registerUser = async (usernameInput: string, password: string, displayNameInput?: string) => {
  const username = usernameInput.trim().toLowerCase();
  const displayName = (displayNameInput || usernameInput).trim().slice(0, 24);
  if (!/^[a-z0-9_\u4e00-\u9fa5]{2,18}$/i.test(usernameInput.trim())) {
    throw new Error("用户名需要 2-18 位，可包含中文、字母、数字和下划线。");
  }
  if (password.length < 6) {
    throw new Error("密码至少 6 位。");
  }

  const users = await readJson<User[]>(usersPath);
  if (users.some((user) => user.username === username)) {
    throw new Error("用户名已存在。");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user: User = {
    id: crypto.randomUUID(),
    username,
    displayName,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeJson(usersPath, users);
  return publicUser(user);
};

export const loginUser = async (usernameInput: string, password: string) => {
  const username = usernameInput.trim().toLowerCase();
  const users = await readJson<User[]>(usersPath);
  const user = users.find((candidate) => candidate.username === username);
  if (!user || user.passwordHash !== hashPassword(password, user.salt)) {
    throw new Error("用户名或密码不正确。");
  }
  return publicUser(user);
};

export const getCommentsForStory = async (storyId: string) => {
  const comments = await readJson<Comment[]>(commentsPath);
  return comments
    .filter((comment) => comment.storyId === storyId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

export const addComment = async (storyId: string, userId: string, bodyInput: string) => {
  const body = bodyInput.trim();
  if (!body || body.length > 500) {
    throw new Error("评论需要 1-500 字。");
  }

  const users = await readJson<User[]>(usersPath);
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("请先登录。");
  }

  const comments = await readJson<Comment[]>(commentsPath);
  const comment: Comment = {
    id: crypto.randomUUID(),
    storyId,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    body,
    createdAt: new Date().toISOString()
  };
  comments.push(comment);
  await writeJson(commentsPath, comments);
  return comment;
};

const readStories = async () => {
  const [baseStories, extraStories] = await Promise.all([
    readJson<Story[]>(storiesPath),
    readJson<Story[]>(extraStoriesPath)
  ]);
  return [...baseStories, ...extraStories, ...generatedStories, ...moreGeneratedStories];
};
