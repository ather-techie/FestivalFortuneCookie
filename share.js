/* ===== Festival Fortune — Share Card Renderer ===== */

function renderShareCard() {
  const fortune = state.currentFortune;
  const key = state.currentFestival;
  if (!fortune || !key) { showToast('No fortune to share'); return; }

  const data = state._currentData || {};
  const fMeta = FESTIVALS.find(f => f.key === key) || {};
  const palette = data.palette || {};
  const canvas = document.getElementById('share-canvas');
  const W = 600, H = 800;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = palette.bg || '#1a1230';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = palette.accent || '#ff6b35';
  ctx.fillRect(0, 0, W, 6);

  // Festival badge
  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '500 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${fMeta.emoji || ''} ${fMeta.name || key}`, W/2, 50);

  // Rarity badge
  const rarity = fortune.rarity;
  const rarityColors = { common:'#bbb', uncommon:'#64c864', rare:'#6496ff', legendary:'#ffd93d' };
  const rarityLabels = data.rarityLabels || {};
  const rarityLabel = rarityLabels[rarity] || rarity;
  ctx.fillStyle = rarityColors[rarity] || '#bbb';
  ctx.font = '600 12px "Segoe UI", sans-serif';
  const labelW = ctx.measureText(rarityLabel.toUpperCase()).width + 24;
  const labelX = (W - labelW) / 2;
  ctx.fillStyle = (rarityColors[rarity] || '#bbb') + '22';
  ctx.beginPath();
  ctx.roundRect(labelX, 70, labelW, 26, 6);
  ctx.fill();
  ctx.fillStyle = rarityColors[rarity] || '#bbb';
  ctx.fillText(rarityLabel.toUpperCase(), W/2, 87);

  // Fortune text — word wrap
  ctx.fillStyle = palette.text || '#e8dcc4';
  ctx.font = '600 24px Georgia, serif';
  ctx.textAlign = 'center';
  const words = fortune.text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line + (line ? ' ' : '') + w;
    if (ctx.measureText(test).width > W - 80 && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);

  const lineHeight = 34;
  const startY = H/2 - (lines.length * lineHeight)/2 + 20;
  lines.forEach((l, i) => ctx.fillText(l, W/2, startY + i * lineHeight));

  // Date
  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '400 13px "Segoe UI", sans-serif';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  ctx.fillText(dateStr, W/2, H - 100);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(60, H-80); ctx.lineTo(W-60, H-80); ctx.stroke();

  // Footer
  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '500 12px "Segoe UI", sans-serif';
  ctx.fillText('Festival Fortune', W/2, H-50);

  // Download as PNG
  const link = document.createElement('a');
  link.download = `festival-fortune-${key}-${fortune.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  // Also copy share URL
  const payload = btoa(JSON.stringify({ key, id: fortune.id }));
  const url = `${location.origin}${location.pathname}#f=${payload}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('Card downloaded, link copied!'));
  } else {
    showToast('Card downloaded!');
  }
}
