const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 812 });
  
  // Go to the home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for bottom nav to load
  await page.waitForSelector('nav.fixed.bottom-0', { timeout: 5000 });
  
  // Take a screenshot of the full page
  await page.screenshot({ 
    path: 'bottom-nav-screenshot.png',
    fullPage: true 
  });
  
  // Also take a screenshot of just the bottom nav
  const bottomNav = await page.$('nav.fixed.bottom-0');
  if (bottomNav) {
    await bottomNav.screenshot({ path: 'bottom-nav-only.png' });
  }
  
  // Check what components are loaded
  const hasBottomNav = await page.$('nav.fixed.bottom-0') !== null;
  const navItems = await page.$$eval('nav.fixed.bottom-0 a', links => 
    links.map(link => ({
      href: link.href,
      text: link.innerText
    }))
  );
  
  console.log('Has bottom nav:', hasBottomNav);
  console.log('Nav items:', navItems);
  
  // Check if Target icon exists (lucide-react class)
  const hasTargetIcon = await page.evaluate(() => {
    const svgs = document.querySelectorAll('nav.fixed.bottom-0 svg');
    let foundTarget = false;
    svgs.forEach(svg => {
      // Target icon has a circle and crosshair path
      const paths = svg.querySelectorAll('path, circle');
      if (paths.length >= 2) {
        // Check for circle element (Target icon has a circle)
        const hasCircle = Array.from(paths).some(el => el.tagName.toLowerCase() === 'circle');
        if (hasCircle) foundTarget = true;
      }
    });
    return foundTarget;
  });
  
  console.log('Has Target icon:', hasTargetIcon);
  
  await browser.close();
})().catch(console.error);