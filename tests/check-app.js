const fs = require('fs');
const path = require('path');
const assert = require('assert');

const appPath = path.join(__dirname, '..', 'app.js');
const htmlPath = path.join(__dirname, '..', 'index.html');
const sharePath = path.join(__dirname, '..', 'share.js');
const cssPath = path.join(__dirname, '..', 'styles.css');

function checkApp() {
  const app = fs.readFileSync(appPath, 'utf8');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const share = fs.readFileSync(sharePath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  // EID festival
  assert(app.includes("key: 'eid'"), 'app.js: EID festival is missing');
  assert(app.includes("name: 'Eid'"), 'app.js: Eid name is missing');

  // Theme toggle
  assert(html.includes('theme-toggle'), 'index.html: theme toggle button is missing');
  assert(app.includes('initTheme'), 'app.js: initTheme function is missing');
  assert(app.includes('toggleTheme'), 'app.js: toggleTheme function is missing');
  assert(app.includes('applyTheme'), 'app.js: applyTheme function is missing');
  assert(css.includes("[data-theme='light']"), 'styles.css: light theme overrides are missing');
  assert(css.includes('--bg:#0f0a1a'), 'styles.css: dark theme base is missing');

  // Share menu
  assert(html.includes('share-menu'), 'index.html: share menu is missing');
  assert(share.includes('openShareMenu'), 'share.js: openShareMenu is missing');
  assert(share.includes('closeShareMenu'), 'share.js: closeShareMenu is missing');
  assert(share.includes('shareToNetwork'), 'share.js: shareToNetwork is missing');
  assert(share.includes('shareNative'), 'share.js: shareNative is missing');
  assert(share.includes('downloadSharePng'), 'share.js: downloadSharePng is missing');
  assert(html.includes('data-network="twitter"'), 'index.html: Twitter option missing');
  assert(html.includes('data-network="whatsapp"'), 'index.html: WhatsApp option missing');
  assert(html.includes('data-network="copy"'), 'index.html: Copy Link option missing');
  assert(css.includes('.share-menu'), 'styles.css: share menu styles are missing');

  // OG meta tags
  assert(html.includes('og:title'), 'index.html: OG title meta tag missing');
  assert(html.includes('og:image'), 'index.html: OG image meta tag missing');
  assert(html.includes('twitter:card'), 'index.html: Twitter card meta tag missing');
  assert(app.includes('updateOgTags'), 'app.js: updateOgTags function missing');
  assert(share.includes('getAppUrl'), 'share.js: getAppUrl function missing');
  assert(share.includes('/api/fortune'), 'share.js: API fortune route missing');

  // Clear journal button in Journal view + shared handler
  assert(html.includes('btn-clear-journal-view'), 'index.html: journal view clear button missing');
  assert(html.includes('btn-clear-journal"'), 'index.html: settings clear button missing');
  assert(app.includes('function clearJournal'), 'app.js: clearJournal function missing');
  assert(css.includes('.journal-header-row'), 'styles.css: journal header row styles missing');

  // Full dates + year + region tag on festival cards
  assert(app.includes('function dateLabel'), 'app.js: dateLabel function missing');
  assert(app.includes("MONTH_SHORT"), 'app.js: MONTH_SHORT constant missing');
  assert(app.includes('}, ${year}'), 'app.js: dateLabel missing year suffix');
  assert(!app.includes('${f.startMonth}/${f.startDay}'), 'app.js: old numeric date format still present');
  assert(app.includes('festival-region'), 'app.js: region tag not rendered on cards');
  assert(app.includes("region: 'Worldwide'"), 'app.js: region field missing from festival registry');
  assert(css.includes('.festival-region'), 'styles.css: region tag styles missing');

  // OG images directory
  const ogDir = path.join(__dirname, '..', 'og-images');
  assert(fs.existsSync(ogDir), 'og-images directory missing');
  const ogFiles = fs.readdirSync(ogDir).filter(f => f.endsWith('.png'));
  assert(ogFiles.includes('default.png'), 'og-images/default.png missing');
  assert(ogFiles.length >= 247, `Expected 247+ OG images, found ${ogFiles.length}`);

  // API serverless function
  const apiPath = path.join(__dirname, '..', 'api', 'fortune.js');
  assert(fs.existsSync(apiPath), 'api/fortune.js serverless function missing');

  console.log('✓ App structure checks passed');
}

module.exports = { checkApp };
if (require.main === module) checkApp();
