const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8081";
const IMG = path.resolve(__dirname, "../../images");
const findings = [];
const consoleErrors = [];

function finding(severity, area, description, evidence) {
  findings.push({ severity, area, description, evidence: evidence || "" });
  console.log(`  [${severity}] (${area}) ${description}`);
}

async function shot(page, name, label) {
  const file = path.join(IMG, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  screenshot: ${name}${label ? " - " + label : ""}`);
}

async function clickText(page, text, opts = {}) {
  const el = page.getByText(text, { exact: opts.exact || false }).first();
  await el.click({ timeout: opts.timeout || 8000 });
}

async function safe(label, fn) {
  try {
    await fn();
    return true;
  } catch (e) {
    console.log(`  ! step failed [${label}]: ${e.message.split("\n")[0]}`);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push("PAGEERROR: " + err.message));

  console.log("\n========== VEELINK FARM - FULL QA AUDIT ==========\n");

  // ---------- REGISTRATION ----------
  console.log("[1] REGISTRATION FLOW");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(12000);

  // Step 1: Name
  await safe("reg-name", async () => {
    const input = page.getByPlaceholder("Enter your name").first();
    await input.fill("John Farmer");
    await shot(page, "reg-01-name.png", "Registration step 1");
    await clickText(page, "Continue");
    await page.waitForTimeout(2000);
  });

  // Test: does Continue work with empty name? (go back and check validation)
  await shot(page, "reg-02-security.png", "Registration step 2 (security)");

  // Step 2: Security - look for password fields
  await safe("reg-security", async () => {
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("  step2 text:", JSON.stringify(bodyText.slice(0, 200)));
    // Try to fill password fields
    const pwInputs = await page.locator('input[type="password"]').all();
    console.log(`  found ${pwInputs.length} password inputs`);
    if (pwInputs.length >= 1) {
      await pwInputs[0].fill("Test1234!");
      if (pwInputs.length >= 2) await pwInputs[1].fill("Test1234!");
    }
    await shot(page, "reg-03-password-filled.png");
    await safe("reg-continue2", () => clickText(page, "Continue"));
    await page.waitForTimeout(2000);
  });

  // Step 3: Biometric / finish
  await safe("reg-finish", async () => {
    await shot(page, "reg-04-biometric.png", "Registration step 3");
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("  step3 text:", JSON.stringify(bodyText.slice(0, 200)));
    // Try common finish buttons
    for (const t of ["Get Started", "Finish", "Skip", "Continue", "Done", "Complete Setup"]) {
      const found = await safe("finish-" + t, async () => {
        await clickText(page, t, { timeout: 2500 });
        return true;
      });
      if (found) { await page.waitForTimeout(2500); break; }
    }
  });

  await page.waitForTimeout(4000);
  await shot(page, "post-register.png", "After registration");
  const afterReg = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log("  after registration:", JSON.stringify(afterReg));

  // ---------- DASHBOARD ----------
  console.log("\n[2] DASHBOARD");
  await safe("dashboard", async () => {
    await shot(page, "dashboard-empty.png", "Dashboard (no data)");
  });

  // ---------- LOAD DEMO DATA (via Settings) ----------
  console.log("\n[3] LOAD DEMO DATA");
  await safe("goto-settings", async () => {
    await clickText(page, "Settings");
    await page.waitForTimeout(2500);
    await shot(page, "settings.png", "Settings screen");
  });
  await safe("load-demo", async () => {
    await clickText(page, "Load Demo Data");
    await page.waitForTimeout(1500);
    await shot(page, "load-demo-alert.png", "Load demo confirm");
    // Confirm in dialog
    for (const t of ["Load", "Confirm", "OK", "Yes"]) {
      const ok = await safe("confirm-" + t, () => clickText(page, t, { timeout: 2000 }));
      if (ok) break;
    }
    await page.waitForTimeout(3000);
  });

  // ---------- NAVIGATE ALL TABS ----------
  const tabs = ["Dashboard", "Animals", "Health", "Financial", "Settings"];
  console.log("\n[4] TAB NAVIGATION");
  for (const tab of tabs) {
    await safe("tab-" + tab, async () => {
      await clickText(page, tab);
      await page.waitForTimeout(2500);
      await shot(page, `tab-${tab.toLowerCase()}.png`, tab + " tab");
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 150));
      console.log(`  ${tab}:`, JSON.stringify(txt.replace(/\n/g, " ")));
    });
  }

  // ---------- ANIMALS DETAIL ----------
  console.log("\n[5] ANIMALS - detail & interactions");
  await safe("animals-explore", async () => {
    await clickText(page, "Animals");
    await page.waitForTimeout(2000);
    // Try to click first animal card
    await shot(page, "animals-list.png", "Animals list");
  });

  // ---------- REPORTS ----------
  console.log("\n[6] REPORTS");
  await safe("reports", async () => {
    await page.goto(BASE + "/reports", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "reports.png", "Reports screen");
  });

  // ---------- INVENTORY ----------
  console.log("\n[7] INVENTORY");
  await safe("inventory", async () => {
    await page.goto(BASE + "/inventory", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "inventory.png", "Inventory screen");
  });

  // ---------- REMINDERS ----------
  console.log("\n[8] REMINDERS");
  await safe("reminders", async () => {
    await page.goto(BASE + "/reminders", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "reminders.png", "Reminders screen");
  });

  // ---------- BREEDING ----------
  console.log("\n[9] BREEDING");
  await safe("breeding", async () => {
    await page.goto(BASE + "/breeding", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "breeding.png", "Breeding screen");
  });

  // ---------- DARK MODE ----------
  console.log("\n[10] DARK MODE");
  await safe("dark-mode", async () => {
    await page.goto(BASE + "/(tabs)/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    // Try to toggle dark mode
    for (const t of ["Dark Mode", "Dark Theme", "Theme", "Appearance"]) {
      const ok = await safe("toggle-" + t, () => clickText(page, t, { timeout: 2000 }));
      if (ok) { await page.waitForTimeout(1500); break; }
    }
    await shot(page, "dark-mode-settings.png", "Dark mode");
  });

  // ---------- RESPONSIVE (tablet + mobile) ----------
  console.log("\n[11] RESPONSIVE LAYOUTS");
  await safe("tablet", async () => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "responsive-tablet.png", "Tablet 1024px");
  });
  await safe("mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "responsive-mobile.png", "Mobile 390px");
  });

  // ---------- CONSOLE ERRORS ----------
  console.log("\n[12] CONSOLE ERRORS SUMMARY");
  const uniqueErrors = [...new Set(consoleErrors)];
  console.log(`  Total console errors: ${consoleErrors.length} (${uniqueErrors.length} unique)`);
  uniqueErrors.slice(0, 30).forEach((e, i) => console.log(`  [${i + 1}] ${e.slice(0, 200)}`));

  // Write findings + errors to file
  const report = {
    timestamp: new Date().toISOString(),
    consoleErrors: uniqueErrors,
    findings,
  };
  fs.writeFileSync(path.join(__dirname, "audit-results.json"), JSON.stringify(report, null, 2));
  console.log("\n========== AUDIT COMPLETE ==========");
  console.log("Results written to audit-results.json");

  await browser.close();
})();
