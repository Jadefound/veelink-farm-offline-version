const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    console.log("Navigating to http://localhost:8082 ...");
    await page.goto("http://localhost:8082", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.title();
    console.log("Page title:", title);
    await page.screenshot({ path: "../../images/01-connectivity-test.png", fullPage: false });
    console.log("Screenshot saved. Connectivity test PASSED.");
  } catch (err) {
    console.error("Connectivity test FAILED:", err.message);
    await page.screenshot({ path: "../../images/01-connectivity-error.png" }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
