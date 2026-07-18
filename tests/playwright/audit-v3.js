const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8081";
const IMG = path.resolve(__dirname, "../../images");
const findings = [];
const consoleErrors = [];

async function shot(page, name, label, full = true) {
  await page.screenshot({ path: path.join(IMG, name), fullPage: full });
  console.log(`  SHOT ${name}${label ? " - " + label : ""}`);
}
async function safe(label, fn) {
  try { await fn(); return true; }
  catch (e) { console.log(`  ! [${label}] ${e.message.split("\n")[0]}`); return false; }
}
async function bt(page, n = 200) {
  return (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, n);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));
  page.on("dialog", (d) => d.accept().catch(() => {}));

  console.log("\n===== AUDIT V3 (with demo data injection) =====\n");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(12000);

  // REGISTER
  console.log("[REGISTER]");
  await safe("name", async () => {
    await page.getByPlaceholder("Enter your name").first().fill("John Farmer");
    await page.getByText("Continue").first().click();
    await page.waitForTimeout(2000);
  });
  await safe("password", async () => {
    const pw = await page.locator('input[type="password"]').all();
    if (pw[0]) await pw[0].fill("Test1234!");
    if (pw[1]) await pw[1].fill("Test1234!");
    await page.getByText("Continue").first().click();
    await page.waitForTimeout(2000);
  });
  await safe("finish", async () => {
    await page.getByText("Get Started").first().click();
    await page.waitForTimeout(3000);
  });

  // Skip farm creation - we'll inject demo data instead
  await safe("skip-farm", async () => {
    await page.getByText("Skip for now").first().click();
    await page.waitForTimeout(3000);
  });

  // INJECT DEMO DATA
  console.log("[INJECT DEMO DATA]");
  await page.evaluate(() => {
    localStorage.setItem("demoDataEnabled", "1");
    localStorage.removeItem("farm-storage");
    localStorage.removeItem("animal-storage");
    localStorage.removeItem("financial-storage");
    localStorage.removeItem("health-storage");
    localStorage.removeItem("inventory-storage");
    localStorage.removeItem("reminder-storage");
    localStorage.removeItem("breeding-storage");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  console.log("  after inject:", await bt(page, 200));

  // NAVIGATE ALL SCREENS
  const screens = [
    ["/(tabs)", "p-dashboard.png", "Dashboard"],
    ["/(tabs)/animals", "p-animals.png", "Animals"],
    ["/(tabs)/health", "p-health.png", "Health"],
    ["/(tabs)/financial", "p-financial.png", "Financial"],
    ["/reports", "p-reports.png", "Reports"],
    ["/inventory", "p-inventory.png", "Inventory"],
    ["/reminders", "p-reminders.png", "Reminders"],
    ["/breeding", "p-breeding.png", "Breeding"],
  ];
  console.log("[SCREENS WITH DATA]");
  for (const [route, img, label] of screens) {
    await safe("nav-" + route, async () => {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3500);
      await shot(page, img, label);
      console.log(`  ${route}: ${await bt(page, 160)}`);
    });
  }

  // ANIMAL DETAIL - click first animal
  console.log("[ANIMAL DETAIL]");
  await safe("animal-detail", async () => {
    await page.goto(BASE + "/(tabs)/animals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    // Click first animal card (look for an ID like text)
    const cards = await page.locator('text=/^(C|G|S|P|H)\\d{3}/').all();
    console.log(`  found ${cards.length} animal id matches`);
    if (cards.length) {
      await cards[0].click();
      await page.waitForTimeout(3000);
      await shot(page, "p-animal-detail.png", "Animal detail");
      console.log("  detail:", await bt(page, 150));
    } else {
      // try clicking any card region
      await page.mouse.click(640, 300);
      await page.waitForTimeout(2500);
      await shot(page, "p-animal-detail.png", "Animal detail (fallback)");
    }
  });

  // SEARCH TEST on animals
  console.log("[SEARCH TEST]");
  await safe("search", async () => {
    await page.goto(BASE + "/(tabs)/animals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const searchBox = page.getByPlaceholder(/search/i).first();
    await searchBox.fill("Cattle", { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot(page, "p-animals-search.png", "Animals search");
  });

  // DARK MODE (toggle via switch)
  console.log("[DARK MODE]");
  await safe("dark", async () => {
    await page.goto(BASE + "/(tabs)/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const sw = await page.locator('[role="switch"]').all();
    console.log(`  switches: ${sw.length}`);
    if (sw.length) { await sw[0].click(); await page.waitForTimeout(2000); }
    await shot(page, "p-dark-settings.png", "Dark settings");
    await page.goto(BASE + "/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    await shot(page, "p-dark-reports.png", "Dark reports");
    await page.goto(BASE + "/(tabs)", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "p-dark-dashboard.png", "Dark dashboard");
    // toggle back to light
    await page.goto(BASE + "/(tabs)/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const sw2 = await page.locator('[role="switch"]').all();
    if (sw2.length) { await sw2[0].click(); await page.waitForTimeout(1500); }
  });

  // RESPONSIVE
  console.log("[RESPONSIVE]");
  await safe("tablet", async () => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(BASE + "/(tabs)", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "p-tablet-dashboard.png", "Tablet dashboard", false);
  });
  await safe("mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/(tabs)", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "p-mobile-dashboard.png", "Mobile dashboard", false);
    await page.goto(BASE + "/(tabs)/animals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "p-mobile-animals.png", "Mobile animals", false);
  });

  // ERRORS
  const uniq = [...new Set(consoleErrors)];
  console.log(`\n[ERRORS] total ${consoleErrors.length}, unique ${uniq.length}`);
  uniq.slice(0, 20).forEach((e, i) => console.log(`  [${i + 1}] ${e.slice(0, 160)}`));

  fs.writeFileSync(path.join(__dirname, "audit-v3-results.json"),
    JSON.stringify({ ts: new Date().toISOString(), consoleErrors: uniq }, null, 2));
  console.log("\n===== V3 COMPLETE =====");
  await browser.close();
})();
