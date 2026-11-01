/**
 * Vercel serverless function that serves HTML with correct OG meta tags
 * for social media crawlers that can't read URL hash fragments.
 *
 * Route: /api/fortune?key=<key>&id=<id>
 * Returns HTML with og:image pointing to /og-images/<id>.png
 * then redirects browsers to the main app with the hash.
 */

const fs = require('fs');
const path = require('path');

const festivalsDir = path.join(process.cwd(), 'festivals');

const FESTIVAL_META = {
  halloween: 'Halloween',
  christmas: 'Christmas',
  diwali: 'Diwali',
  eid: 'Eid',
  'lunar-new-year': 'Lunar New Year',
  valentine: "Valentine's Day",
  birthday: 'Birthday',
};

function loadFortune(key, id) {
  const filePath = path.join(festivalsDir, key, 'fortunes.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const fortune = data.fortunes.find(f => f.id === id);
    return fortune ? { fortune, name: data.name, palette: data.palette, rarityLabels: data.rarityLabels } : null;
  } catch {
    return null;
  }
}

module.exports = function handler(req, res) {
  const { key, id } = req.query;
  // Always use the production domain — VERCEL_URL points to the internal
  // deployment URL, which social crawlers cannot fetch.
  const baseUrl = 'https://festivalfortunecookie.vercel.app';

  if (!key || !id) {
    res.setHeader('Location', baseUrl);
    res.statusCode = 302;
    res.end();
    return;
  }

  const data = loadFortune(key, id);
  const festivalName = data ? (data.name || FESTIVAL_META[key] || key) : 'Festival';
  const fortuneText = data ? data.fortune.text : 'Crack a themed fortune cookie for every festival.';
  const ogImage = `${baseUrl}/og-images/${id}.png`;
  const appUrl = `${baseUrl}/#f=${Buffer.from(JSON.stringify({ key, id })).toString('base64')}`;
  const ogDesc = fortuneText.length > 200 ? fortuneText.slice(0, 197) + '…' : fortuneText;

  res.setHeader('Content-Type', 'text/html');
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My ${festivalName} Fortune — Festival Fortune</title>
  <meta property="og:title" content="My ${festivalName} Fortune">
  <meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="800">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${appUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="My ${festivalName} Fortune">
  <meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${ogImage}">
  <meta http-equiv="refresh" content="0;url=${appUrl}">
</head>
<body>
  <p>Redirecting to <a href="${appUrl}">Festival Fortune</a>...</p>
</body>
</html>`);
};
