const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8081";
const IMG = path.resolve(__dirname, "../../images");
const findings = [];
const consoleErrors = [];

function finding(severity, area, description) {
  findings.push({ severity, area, description });
  console.log(`  [${severity}] (${area}) ${description}`);
}

async function shot(page, name, label) {
  await page.screenshot({ path: path.join(IMG, name), fullPage: false });
  console.log(`  SHOT ${name}${label ? " - " + label : ""}`);
}

async function fullshot(page, name, label) {
  await page.screenshot({ path: path.join(IMG, name), fullPage: true });
  console.log(`  SHOT(full) ${name}${label ? " - " + label : ""}`);
}

async function safe(label, fn) {
  try { await fn(); return true; }
  catch (e) { console.log(`  ! [${label}] ${e.message.split("\n")[0]}`); return false; }
}

async function bodyText(page, n = 200) {
  return (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, n);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

  console.log("\n===== VEELINK FARM QA AUDIT V2 =====\n");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(12000);

  // REGISTRATION
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

  // CREATE FARM
  console.log("[CREATE FARM]");
  console.log("  now:", await bodyText(page, 120));
  await safe("farm-name", async () => {
    await page.getByPlaceholder("Enter farm name").first().fill("Green Valley Ranch");
  });
  await safe("farm-loc", async () => {
    await page.getByPlaceholder("Enter farm location").first().fill("Lagos, Nigeria");
  });
  await safe("farm-size", async () => {
    await page.getByPlaceholder("Enter size").first().fill("250");
  });
  // Farm Type dropdown (SelectField)
  await safe("farm-type", async () => {
    await page.getByText("Select farm type").first().click();
    await page.waitForTimeout(1000);
    await shot(page, "farm-type-dropdown.png", "Farm type dropdown");
    // pick first option
    for (const t of ["Cattle", "Mixed", "Dairy", "Poultry", "Livestock", "Sheep", "Goat"]) {
      const ok = await safe("pick-" + t, async () => {
        await page.getByText(t, { exact: true }).first().click({ timeout: 1500 });
      });
      if (ok) break;
    }
    await page.waitForTimeout(800);
  });
  await shot(page, "farm-form-filled.png", "Farm form filled");
  await safe("create-farm", async () => {
    await page.getByText("Create Farm").first().click();
    await page.waitForTimeout(4000);
  });
  console.log("  after farm:", await bodyText(page, 150));
  await shot(page, "dashboard-nodata.png", "Dashboard empty");

  // LOAD DEMO DATA via settings
  console.log("[LOAD DEMO DATA]");
  await safe("nav-settings", async () => {
    await page.goto(BASE + "/(tabs)/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
  });
  await fullshot(page, "settings-full.png", "Settings full");
  await safe("demo", async () => {
    await page.getByText("Load Demo Data").first().click();
    await page.waitForTimeout(1500);
    await shot(page, "demo-confirm.png", "Demo confirm dialog");
    for (const t of ["Load Demo", "Load", "Confirm", "OK", "Yes", "Continue"]) {
      const ok = await safe("conf-" + t, async () => {
        await page.getByText(t, { exact: false }).last().click({ timeout: 1500 });
      });
      if (ok) break;
    }
    await page.waitForTimeout(4000);
  });
  console.log("  demo errors so far:", consoleErrors.length);

  // NAVIGATE ALL SCREENS via direct URL
  const screens = [
    ["/(tabs)", "dash-data.png", "Dashboard w/ data"],
    ["/(tabs)/animals", "animals-data.png", "Animals list"],
    ["/(tabs)/health", "health-data.png", "Health records"],
    ["/(tabs)/financial", "financial-data.png", "Financial"],
    ["/reports", "reports-data.png", "Reports"],
    ["/inventory", "inventory-data.png", "Inventory"],
    ["/reminders", "reminders-data.png", "Reminders"],
    ["/breeding", "breeding-data.png", "Breeding"],
    ["/(tabs)/settings", "settings-data.png", "Settings"],
  ];
  console.log("[NAVIGATE SCREENS]");
  for (const [route, img, label] of screens) {
    await safe("nav-" + route, async () => {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3500);
      await fullshot(page, img, label);
      const txt = await bodyText(page, 180);
      console.log(`  ${route}: ${txt}`);
      if (txt.length < 20) finding("HIGH", route, "Screen appears blank/empty");
    });
  }

  // TEST ADD ANIMAL FORM
  console.log("[ADD ANIMAL FORM]");
  await safe("add-animal", async () => {
    await page.goto(BASE + "/animal/add", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await fullshot(page, "animal-add-form.png", "Add animal form");
    console.log("  add-animal:", await bodyText(page, 200));
  });

  // TEST ADD FINANCIAL FORM (check DatePickerField)
  console.log("[ADD FINANCIAL FORM]");
  await safe("add-fin", async () => {
    await page.goto(BASE + "/financial/add", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await fullshot(page, "financial-add-form.png", "Add transaction form");
  });

  // TEST DATE PICKER
  console.log("[DATE PICKER TEST]");
  await safe("datepicker", async () => {
    const dateInputs = await page.locator('input[type="date"]').all();
    console.log(`  found ${dateInputs.length} native date inputs`);
    if (dateInputs.length === 0) finding("MED", "DatePicker", "No native date input found on financial/add");
  });

  // DARK MODE
  console.log("[DARK MODE]");
  await safe("dark", async () => {
    await page.goto(BASE + "/(tabs)/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    // find and click dark mode switch
    const switches = await page.locator('[role="switch"], [aria-checked]').all();
    console.log(`  found ${switches.length} switches`);
    let toggled = false;
    for (const t of ["Dark Mode", "Dark Theme", "Dark"]) {
      const ok = await safe("toggle-" + t, async () => {
        await page.getByText(t, { exact: false }).first().click({ timeout: 1500 });
      });
      if (ok) { toggled = true; break; }
    }
    if (!toggled && switches.length) { await switches[0].click().catch(() => {}); }
    await page.waitForTimeout(2000);
    await fullshot(page, "dark-settings.png", "Dark mode settings");
    // check dashboard in dark
    await page.goto(BASE + "/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await fullshot(page, "dark-reports.png", "Dark mode reports");
  });

  // RESPONSIVE
  console.log("[RESPONSIVE]");
  await safe("mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "mobile-reports.png", "Mobile reports");
  });

  // ERRORS
  console.log("\n[CONSOLE ERRORS]");
  const uniq = [...new Set(consoleErrors)];
  console.log(`  total: ${consoleErrors.length}, unique: ${uniq.length}`);
  uniq.slice(0, 30).forEach((e, i) => console.log(`  [${i + 1}] ${e.slice(0, 180)}`));
  if (uniq.length) finding("MED", "Console", `${uniq.length} unique console error(s): ${uniq[0].slice(0, 80)}`);

  fs.writeFileSync(path.join(__dirname, "audit-results.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), consoleErrors: uniq, findings }, null, 2));
  console.log("\n===== AUDIT V2 COMPLETE =====");
  await browser.close();
})();
