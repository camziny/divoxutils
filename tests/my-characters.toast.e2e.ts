import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const mockSearchPayload = {
  results: [
    {
      character_web_id: "mock-web-id-1",
      name: "Mocktoast",
      level: 50,
      class_name: "Healer",
      guild_info: { guild_name: "Guild" },
      realm_points: 1200,
      heraldCharacterWebId: "mock-web-id-1",
      heraldName: "Mocktoast",
      heraldServerName: "Ywain",
      heraldRealm: 2,
      heraldRace: "Norseman",
      heraldClassName: "Healer",
      heraldLevel: 50,
      heraldGuildName: "Guild",
      heraldRealmPoints: 1200,
      heraldBountyPoints: 0,
      heraldTotalKills: 0,
      heraldTotalDeaths: 0,
      heraldTotalDeathBlows: 0,
      heraldTotalSoloKills: 0,
      heraldMidgardKills: 0,
      heraldMidgardDeaths: 0,
      heraldMidgardDeathBlows: 0,
      heraldMidgardSoloKills: 0,
      heraldAlbionKills: 0,
      heraldAlbionDeaths: 0,
      heraldAlbionDeathBlows: 0,
      heraldAlbionSoloKills: 0,
      heraldHiberniaKills: 0,
      heraldHiberniaDeaths: 0,
      heraldHiberniaDeathBlows: 0,
      heraldHiberniaSoloKills: 0,
      heraldMasterLevel: "0",
    },
  ],
};

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.route("**/api/characters/search?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSearchPayload),
    });
  });

  await page.route("**/api/characters/add", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify([{ id: 1 }]),
    });
  });

  await page.route("**/api/userCharacters/**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Character successfully deleted" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${baseUrl}/user-characters`, { waitUntil: "domcontentloaded" });

  if (page.url().includes("/sign-in")) {
    console.log("Please sign in in the opened browser window.");
    await page.waitForURL(/\/user-characters/, { timeout: 240000 });
  }

  await page.waitForSelector('[data-testid="character-search-input"]', { timeout: 30000 });

  await page.fill('[data-testid="character-search-input"]', "mock");
  await page.waitForSelector('[data-testid="character-search-result-mock-web-id-1"]', { timeout: 15000 });
  await page.click('[data-testid="character-search-result-mock-web-id-1"]');
  await page.click('[data-testid="add-characters-button"]');
  await page.waitForSelector("text=Successfully added 1 character", { timeout: 15000 });

  const deleteButtons = page.locator('[data-testid^="delete-character-"]');
  const deleteCount = await deleteButtons.count();
  assert.ok(
    deleteCount > 0,
    "No delete buttons found. Ensure the signed-in user has at least one character."
  );

  await deleteButtons.first().click();
  await page.waitForSelector('[data-testid="delete-confirm-submit"]', { timeout: 10000 });
  await page.click('[data-testid="delete-confirm-submit"]');
  await page.waitForSelector("text=Successfully deleted", { timeout: 15000 });

  console.log("Toast e2e passed: add and delete success toasts are visible.");
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
