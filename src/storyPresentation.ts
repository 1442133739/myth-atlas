import type { Story } from "./types";

const themeZh: Record<Story["theme"], string> = {
  sun: "太阳与光明",
  flood: "洪水与重生",
  fire: "火焰与文明",
  dragon: "龙与异兽",
  love: "爱情与誓言",
  moon: "月亮与夜空",
  underworld: "冥界与归途",
  hero: "英雄与试炼",
  creation: "创世与起源"
};

const themeEn: Record<Story["theme"], string> = {
  sun: "sunlight and power",
  flood: "flood and renewal",
  fire: "fire and civilization",
  dragon: "dragons and legendary creatures",
  love: "love and vows",
  moon: "the moon and night",
  underworld: "the underworld and return",
  hero: "heroes and trials",
  creation: "creation and origins"
};

export function buildStoryBody(story: Story, language: "zh" | "en") {
  if (language === "en") {
    return [
      `Background: In ${story.countryEn}, this tale belongs to the world of ${themeEn[story.theme]}. People told it to explain fear, hope, and the fragile order between human life and the unseen world.`,
      `Story: ${story.summaryEn} Around that brief memory grows a fuller scene: families watch the sky and the land for signs, elders repeat warnings, and the main figure must choose between safety and a dangerous duty.`,
      `Conflict: The heart of the myth is not only wonder, but pressure. Something in the world has gone out of balance, and the hero, deity, lover, or trickster has to pay a price to restore it.`,
      `Ending: When the tale closes, it leaves more than an event. It leaves a rule for the community: courage matters, promises matter, and every miracle asks people to remember what nearly disappeared.`
    ].join("\n\n");
  }

  return [
    `背景：在${story.country}的传说里，这个故事属于“${themeZh[story.theme]}”的母题。它不只是一个奇观，而是古人用来解释天地、人心和命运边界的一段记忆。`,
    `情节：${story.summaryZh} 如果把这段传说展开来看，故事开始于一个秩序被打破的时刻：人们看见天空、河流、火焰或黑夜发生异常，村落、王国或神灵的世界都被迫停下来等待答案。`,
    `冲突：真正的紧张来自选择。故事中的人物不能只旁观，他们要在恐惧、责任、爱情、牺牲或荣誉之间作决定；每一步都可能让世界恢复，也可能让自己永远失去原来的生活。`,
    `结尾：传说结束时，留下的并不只是胜利或失败，而是一句古老的提醒：人类会把最害怕的事讲成故事，也会把最渴望守住的光，藏进故事里一代代传下去。`
  ].join("\n\n");
}

export function buildNarrationScript(story: Story, language: "zh" | "en") {
  if (language === "en") {
    return [
      `${story.titleEn}.`,
      "Pause. Begin slowly, as if opening an old book by firelight.",
      buildStoryBody(story, "en"),
      "Pause again. Let the final sentence settle before ending."
    ].join("\n\n");
  }

  return [
    `《${story.titleZh}》。`,
    "稍停。放慢一点，像在夜色里给孩子讲一个古老传说。",
    buildStoryBody(story, "zh"),
    "再稍停。最后一句要轻一些，让故事的余味留下来。"
  ].join("\n\n");
}

export function buildNarrationSegments(story: Story, language: "zh" | "en") {
  const title = language === "zh" ? `《${story.titleZh}》` : story.titleEn;
  const body = buildStoryBody(story, language).split(/\n\n+/);
  return [title, ...body];
}
