/**
 * Pre-renders OG images for every fortune.
 * Usage: node scripts/generate-og-images.js
 *
 * Requires: npm install canvas --save-dev
 * Output: og-images/<fortune-id>.png + og-images/default.png
 */

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const festivalsDir = path.join(__dirname, '..', 'festivals');
const outputDir = path.join(__dirname, '..', 'og-images');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const W = 600, H = 800;

const FESTIVAL_META = {
  halloween:      { name: 'Halloween',      emoji: '🎃' },
  christmas:      { name: 'Christmas',      emoji: '🎄' },
  diwali:         { name: 'Diwali',         emoji: '🪔' },
  eid:            { name: 'Eid',            emoji: '🌙' },
  'lunar-new-year': { name: 'Lunar New Year', emoji: '🐉' },
  valentine:      { name: "Valentine's Day", emoji: '💕' },
  birthday:       { name: 'Birthday',       emoji: '🎂' },
};

function renderFortuneImage(fortune, festivalKey, data) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const palette = data.palette || {};
  const meta = FESTIVAL_META[festivalKey] || { name: festivalKey, emoji: '' };
  const rarityLabels = data.rarityLabels || {};

  // Background
  ctx.fillStyle = palette.bg || '#1a1230';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = palette.accent || '#ff6b35';
  ctx.fillRect(0, 0, W, 6);

  // Festival badge
  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '500 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${meta.emoji} ${meta.name}`, W / 2, 50);

  // Rarity badge
  const rarity = fortune.rarity;
  const rarityColors = { common: '#bbb', uncommon: '#64c864', rare: '#6496ff', legendary: '#ffd93d' };
  const rarityLabel = rarityLabels[rarity] || rarity;
  ctx.font = '600 12px sans-serif';
  const labelW = ctx.measureText(rarityLabel.toUpperCase()).width + 24;
  const labelX = (W - labelW) / 2;
  ctx.fillStyle = (rarityColors[rarity] || '#bbb') + '22';
  ctx.beginPath();
  ctx.roundRect(labelX, 70, labelW, 26, 6);
  ctx.fill();
  ctx.fillStyle = rarityColors[rarity] || '#bbb';
  ctx.font = '600 12px sans-serif';
  ctx.fillText(rarityLabel.toUpperCase(), W / 2, 87);

  // Fortune text — word wrap
  ctx.fillStyle = palette.text || '#e8dcc4';
  ctx.font = '600 24px Georgia, serif';
  ctx.textAlign = 'center';
  const words = fortune.text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line + (line ? ' ' : '') + w;
    if (ctx.measureText(test).width > W - 80 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineHeight = 34;
  const startY = H / 2 - (lines.length * lineHeight) / 2 + 20;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));

  // Date
  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '400 13px sans-serif';
  ctx.fillText('Festival Fortune', W / 2, H - 50);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(60, H - 80);
  ctx.lineTo(W - 60, H - 80);
  ctx.stroke();

  return canvas;
}

function renderDefaultImage() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f0a1a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ff6b35';
  ctx.fillRect(0, 0, W, 6);

  ctx.fillStyle = '#ffd93d';
  ctx.font = '700 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Festival Fortune', W / 2, H / 2 - 30);

  ctx.fillStyle = '#9a8c7a';
  ctx.font = '400 18px sans-serif';
  ctx.fillText('One cookie per day. One truth per cookie.', W / 2, H / 2 + 20);

  ctx.font = '400 14px sans-serif';
  ctx.fillText('🎃 🎄 🪔 🌙 🐉 💕 🎂', W / 2, H / 2 + 70);

  return canvas;
}

// --- Main ---
let total = 0;
const folders = fs.readdirSync(festivalsDir).filter(f =>
  fs.statSync(path.join(festivalsDir, f)).isDirectory()
);

for (const folder of folders) {
  const filePath = path.join(festivalsDir, folder, 'fortunes.json');
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const fortune of data.fortunes) {
    const canvas = renderFortuneImage(fortune, folder, data);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `${fortune.id}.png`), buf);
    total++;
  }
}

// Default image
const defaultCanvas = renderDefaultImage();
fs.writeFileSync(path.join(outputDir, 'default.png'), defaultCanvas.toBuffer('image/png'));

console.log(`Generated ${total} fortune images + default.png in ${outputDir}`);
