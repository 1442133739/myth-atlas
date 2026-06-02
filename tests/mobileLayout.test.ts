import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.MYTH_ATLAS_URL || "http://127.0.0.1:4199";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".mobile-search-toggle", { timeout: 15000 });

  const toggleText = await page.locator(".mobile-search-toggle").innerText();
  assert.match(toggleText, /搜索故事|筛选中/, "mobile sidebar should default to a compact search trigger");

  const bodyDisplay = await page.locator(".sidebar-body").evaluate((element) => getComputedStyle(element).display);
  assert.equal(bodyDisplay, "none", "mobile sidebar body should be collapsed by default");

  await page.locator(".mobile-search-toggle").click();
  await page.waitForSelector(".search-box input", { state: "visible", timeout: 5000 });

  const expandedDisplay = await page.locator(".sidebar-body").evaluate((element) => getComputedStyle(element).display);
  assert.notEqual(expandedDisplay, "none", "mobile sidebar body should be visible after expanding");

  const searchBox = await page.locator(".search-box").boundingBox();
  assert.ok(searchBox && searchBox.height <= 60, "expanded search input should stay compact");

  const bodyTextLength = await page.locator("body").evaluate((body) => body.innerText.trim().length);
  assert.ok(bodyTextLength > 50, "page should render meaningful content");
} finally {
  await browser.close();
}
