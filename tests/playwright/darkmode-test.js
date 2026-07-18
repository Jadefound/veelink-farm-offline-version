const { chromium } = require("playwright");

async function bgColor(page) {
  return await page.evaluate(() => {
    // find the largest container's bg color
    const root = document.querySelector("#root") || document.body;
    const style = getComputedStyle(root);
    // sample several elements
    const els = document.querySelectorAll("div");
    const colors = {};
    for (let i = 0; i < Math.min(els.length, 200); i++) {
      const bg = getComputedStyle(els[i]).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") colors[bg] = (colors[bg] || 0) + 1;
    }
    return { rootBg: style.backgroundColor, topColors: Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,5) };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({ viewport: { width: 1280, height: 800 } }).then(c => c.newPage());
  page.on("dialog", d => d.accept().catch(()=>{}));

  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(12000);

  // quick register + skip
  const tryFill = async (ph, val) => { try { await page.getByPlaceholder(ph).first().fill(val); } catch {} };
  await tryFill("Enter your name", "Test");
  try { await page.getByText("Continue").first().click(); await page.waitForTimeout(1500); } catch {}
  try {
    const pw = await page.locator('input[type="password"]').all();
    if (pw[0]) await pw[0].fill("Test1234!"); if (pw[1]) await pw[1].fill("Test1234!");
    await page.getByText("Continue").first().click(); await page.waitForTimeout(1500);
  } catch {}
  try { await page.getByText("Get Started").first().click(); await page.waitForTimeout(2000); } catch {}
  try { await page.getByText("Skip for now").first().click(); await page.waitForTimeout(2500); } catch {}

  // Go to settings
  await page.goto("http://localhost:8081/(tabs)/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  console.log("BEFORE toggle (settings):", JSON.stringify(await bgColor(page)));

  // Click the dark mode switch
  const switches = await page.locator('[role="switch"]').all();
  console.log("switches found:", switches.length);
  if (switches.length) {
    await switches[0].click();
    await page.waitForTimeout(2500);
  } else {
    // try clicking the Dark Mode text
    try { await page.getByText("Dark Mode").first().click(); await page.waitForTimeout(2000); } catch {}
  }

  console.log("AFTER toggle (settings):", JSON.stringify(await bgColor(page)));
  await page.screenshot({ path: "../../images/dark-check-settings.png", fullPage: false });

  // Check theme-storage in localStorage
  const themeStore = await page.evaluate(() => localStorage.getItem("theme-storage"));
  console.log("theme-storage:", themeStore);

  await browser.close();
})();
