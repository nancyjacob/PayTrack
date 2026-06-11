const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    pageErrors.push({ message: err.message, stack: err.stack });
  });

  try {
    // First go to the app root
    const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Root page status:', response?.status());
    console.log('Root page URL:', page.url());
    await page.waitForTimeout(2000);

    // Navigate directly to settings
    const resp2 = await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Settings page status:', resp2?.status());
    console.log('Settings page URL:', page.url());
    await page.waitForTimeout(4000);

    // Check page title/body
    const title = await page.title();
    console.log('Page title:', title);

    // Check for Next.js error overlay
    const errorOverlay = await page.$('nextjs-portal');
    console.log('Error overlay present:', !!errorOverlay);

    const bodyHTML = await page.evaluate(() => document.body?.innerHTML?.slice(0, 3000) || '');
    console.log('\n=== BODY HTML SNIPPET ===');
    console.log(bodyHTML.slice(0, 2000));

  } catch (e) {
    console.error('Error during navigation:', e.message);
  }

  console.log('\n=== CONSOLE ERRORS/WARNINGS ===');
  consoleMessages.forEach(m => console.log(`[${m.type}] ${m.text.slice(0, 500)}`));

  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach(e => {
    console.log('Message:', e.message?.slice(0, 1000));
    if (e.stack) console.log('Stack:', e.stack.slice(0, 1000));
    console.log('---');
  });

  await browser.close();
})();
