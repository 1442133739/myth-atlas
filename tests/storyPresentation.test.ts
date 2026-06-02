import assert from "node:assert/strict";
import { buildNarrationScript, buildStoryBody } from "../src/storyPresentation";
import type { Story } from "../src/types";

const sample: Story = {
  id: "sample",
  titleZh: "后羿射日",
  titleEn: "Hou Yi Shoots the Suns",
  country: "中国",
  countryEn: "China",
  region: "East Asia",
  lat: 35,
  lng: 104,
  theme: "sun",
  era: "ancient",
  icon: "☀️",
  imageUrl: "https://example.com/story.jpg",
  summaryZh: "十个太阳一同升起，大地焦裂。后羿拉开神弓，射落九个太阳，只留下一个照耀人间。",
  summaryEn: "Ten suns rose together and scorched the world. Hou Yi drew his divine bow, shot down nine suns, and left one to light the earth.",
  relatedStoryIds: []
};

const bodyZh = buildStoryBody(sample, "zh");
assert.ok(bodyZh.length > sample.summaryZh.length * 2, "Chinese story body should be substantially longer than the summary");
assert.ok(bodyZh.includes("背景") && bodyZh.includes("冲突") && bodyZh.includes("结尾"), "Chinese body should include narrative structure");

const narrationZh = buildNarrationScript(sample, "zh");
assert.ok(narrationZh.includes("稍停") || narrationZh.includes("放慢"), "Chinese narration should include pacing cues");
assert.ok(narrationZh.split(/\n+/).length >= 4, "Chinese narration should be broken into listenable paragraphs");

const bodyEn = buildStoryBody(sample, "en");
assert.ok(bodyEn.length > sample.summaryEn.length * 2, "English story body should be substantially longer than the summary");

const narrationEn = buildNarrationScript(sample, "en");
assert.ok(narrationEn.includes("Pause") || narrationEn.includes("slowly"), "English narration should include pacing cues");
