const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => logs.push('ERROR: ' + err.message));

  await page.goto('http://127.0.0.1:8083/');
  await page.waitForLoadState('networkidle');
  logs.push('page loaded: ' + await page.title());

  // Test nav links
  await page.click('a[href="#features"]');
  await page.waitForTimeout(400);
  logs.push('features scrollY: ' + await page.evaluate(() => window.scrollY));

  await page.click('a[href="#download"]');
  await page.waitForTimeout(400);
  logs.push('download scrollY: ' + await page.evaluate(() => window.scrollY));

  await page.click('a[href="#contact"]');
  await page.waitForTimeout(400);
  logs.push('contact scrollY: ' + await page.evaluate(() => window.scrollY));

  // Test mobile menu
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#menuToggle');
  await page.waitForTimeout(200);
  const navOpen = await page.evaluate(() => document.getElementById('nav').classList.contains('open'));
  logs.push('mobile nav open: ' + navOpen);

  // Test download buttons
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.click('[data-platform="apk"]');
  await page.waitForTimeout(200);
  await page.click('[data-platform="web"]');
  await page.waitForTimeout(200);

  // Scroll parallax check
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  const phoneTransform = await page.evaluate(() => document.querySelector('.phone-center')?.style.transform);
  logs.push('phone transform after scroll: ' + phoneTransform);

  await browser.close();
  console.log(logs.join('\n'));
})();
