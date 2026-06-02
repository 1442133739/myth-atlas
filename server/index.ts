import cors from "cors";
import express from "express";
import {
  addComment,
  getCommentsForStory,
  getCountries,
  getRelatedStories,
  getState,
  getStories,
  getStoryById,
  loginUser,
  registerUser,
  updateState
} from "./store";
import type { MythEra, MythTheme } from "./types";

const app = express();
const port = Number(process.env.PORT || 4174);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "myth-atlas-api" });
});

app.get("/api/stories", async (req, res, next) => {
  try {
    const stories = await getStories({
      theme: req.query.theme as MythTheme | "all" | undefined,
      era: req.query.era as MythEra | "all" | undefined,
      q: req.query.q as string | undefined,
      country: req.query.country as string | undefined
    });
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stories/:id", async (req, res, next) => {
  try {
    const story = await getStoryById(req.params.id);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const related = await getRelatedStories(story);
    const comments = await getCommentsForStory(story.id);
    const state = await updateState((current) => ({
      ...current,
      recentIds: [story.id, ...current.recentIds.filter((id) => id !== story.id)].slice(0, 8)
    }));

    res.json({ story, related, comments, state });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stories/:id/comments", async (req, res, next) => {
  try {
    res.json(await getCommentsForStory(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/stories/:id/comments", async (req, res, next) => {
  try {
    const story = await getStoryById(req.params.id);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const comment = await addComment(story.id, String(req.body.userId || ""), String(req.body.body || ""));
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

app.get("/api/countries", async (_req, res, next) => {
  try {
    res.json(await getCountries());
  } catch (error) {
    next(error);
  }
});

app.get("/api/state", async (_req, res, next) => {
  try {
    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.post("/api/favorites/:id", async (req, res, next) => {
  try {
    const story = await getStoryById(req.params.id);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const state = await updateState((current) => {
      const exists = current.favoriteIds.includes(story.id);
      return {
        ...current,
        favoriteIds: exists
          ? current.favoriteIds.filter((id) => id !== story.id)
          : [story.id, ...current.favoriteIds]
      };
    });

    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const user = await registerUser(
      String(req.body.username || ""),
      String(req.body.password || ""),
      String(req.body.displayName || "")
    );
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const user = await loginUser(String(req.body.username || ""), String(req.body.password || ""));
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Myth Atlas API running on http://127.0.0.1:${port}`);
});
