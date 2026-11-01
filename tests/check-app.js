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

  console.log('✓ App structure checks passed');
}

module.exports = { checkApp };
if (require.main === module) checkApp();
