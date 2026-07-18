const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push("PAGEERROR: " + err.message));

  try {
    console.log("Navigating to http://localhost:8081 (Metro will bundle, may take 60-120s) ...");
    await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 180000 });
    console.log("DOM loaded. Waiting for app to render...");
    await page.waitForTimeout(15000);

    const title = await page.title();
    console.log("Page title:", title);

    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log("Body text (first 500 chars):", JSON.stringify(bodyText));

    await page.screenshot({ path: "../../images/02-app-initial-load.png", fullPage: false });
    console.log("Screenshot saved: 02-app-initial-load.png");

    if (consoleErrors.length > 0) {
      console.log("\n=== CONSOLE ERRORS (" + consoleErrors.length + ") ===");
      consoleErrors.slice(0, 20).forEach((e, i) => console.log(`[${i + 1}] ${e}`));
    } else {
      console.log("\nNo console errors detected.");
    }
    console.log("\nSMOKE TEST COMPLETE");
  } catch (err) {
    console.error("SMOKE TEST FAILED:", err.message);
    await page.screenshot({ path: "../../images/02-app-error.png" }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
