const { chromium } = require("playwright");
const path = require("path");
const IMG = path.resolve(__dirname, "../../images");

async function bg(page) {
  return await page.evaluate(() => {
    const els = document.querySelectorAll("div");
    const colors = {};
    for (let i = 0; i < Math.min(els.length, 300); i++) {
      const c = getComputedStyle(els[i]).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)") colors[c] = (colors[c] || 0) + 1;
    }
    return Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,4);
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("dialog", d => d.accept().catch(()=>{}));

  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(12000);

  // register + skip
  try { await page.getByPlaceholder("Enter your name").first().fill("John Farmer"); await page.getByText("Continue").first().click(); await page.waitForTimeout(1500);} catch {}
  try { const pw = await page.locator('input[type="password"]').all(); if(pw[0])await pw[0].fill("Test1234!"); if(pw[1])await pw[1].fill("Test1234!"); await page.getByText("Continue").first().click(); await page.waitForTimeout(1500);} catch {}
  try { await page.getByText("Get Started").first().click(); await page.waitForTimeout(2000);} catch {}
  try { await page.getByText("Skip for now").first().click(); await page.waitForTimeout(2500);} catch {}

  // inject demo data + set dark mode ON
  await page.evaluate(() => {
    localStorage.setItem("demoDataEnabled", "1");
    localStorage.setItem("theme-storage", JSON.stringify({ state: { isDarkMode: true }, version: 0 }));
    ["farm","animal","financial","health","inventory","reminder","breeding"].forEach(k => localStorage.removeItem(k+"-storage"));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);

  const screens = [
    ["/(tabs)", "dark-dashboard.png"],
    ["/(tabs)/animals", "dark-animals.png"],
    ["/reports", "dark-reports-real.png"],
    ["/(tabs)/settings", "dark-settings-real.png"],
  ];
  for (const [route, img] of screens) {
    await page.goto("http://localhost:8081" + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    console.log(`${route} bg:`, JSON.stringify(await bg(page)));
    await page.screenshot({ path: path.join(IMG, img), fullPage: false });
    console.log("  SHOT", img);
  }
  await browser.close();
})();
