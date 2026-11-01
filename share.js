/* ===== Festival Fortune — Share Card Renderer ===== */

function openShareMenu() {
  document.getElementById('share-menu').classList.remove('hidden');
}

function closeShareMenu() {
  document.getElementById('share-menu').classList.add('hidden');
}

function getShareUrl() {
  const fortune = state.currentFortune;
  const key = state.currentFestival;
  if (!fortune || !key) return null;
  const payload = btoa(JSON.stringify({ key, id: fortune.id }));
  return `${location.origin}${location.pathname}#f=${payload}`;
}

function getShareText() {
  const fortune = state.currentFortune;
  const fMeta = state.currentFestival ? (window.FESTIVALS || []).find(f => f.key === state.currentFestival) : null;
  return fortune ? `My ${fMeta ? fMeta.name : 'Festival'} fortune: "${fortune.text}" — via Festival Fortune` : '';
}

async function shareNative(pngBlob) {
  const text = getShareText();
  const url = getShareUrl();
  const files = pngBlob ? [new File([pngBlob], 'festival-fortune.png', { type: 'image/png' })] : [];
  if (navigator.share && (navigator.canShare && navigator.canShare({ files }))) {
    try {
      await navigator.share({ title: 'Festival Fortune', text, url, files });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return true; // user cancelled
    }
  }
  return false;
}

function shareToNetwork(network) {
  const url = getShareUrl();
  const text = getShareText();
  if (!url) { showToast('No fortune to share'); return; }
  let shareUrl = '';
  switch (network) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      break;
    case 'copy':
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => showToast('Link copied!'));
      } else {
        showToast('Clipboard not available');
      }
      return;
  }
  if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
}

async function renderShareCard() {
  const fortune = state.currentFortune;
  const key = state.currentFestival;
  if (!fortune || !key) { showToast('No fortune to share'); return; }

  const data = state._currentData || {};
  const fMeta = (window.FESTIVALS || []).find(f => f.key === key) || {};
  const palette = data.palette || {};
  const canvas = document.getElementById('share-canvas');
  const W = 600, H = 800;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = palette.bg || '#1a1230';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = palette.accent || '#ff6b35';
  ctx.fillRect(0, 0, W, 6);

  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '500 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${fMeta.emoji || ''} ${fMeta.name || key}`, W/2, 50);

  const rarity = fortune.rarity;
  const rarityColors = { common:'#bbb', uncommon:'#64c864', rare:'#6496ff', legendary:'#ffd93d' };
  const rarityLabels = data.rarityLabels || {};
  const rarityLabel = rarityLabels[rarity] || rarity;
  const labelW = ctx.measureText(rarityLabel.toUpperCase()).width + 24;
  const labelX = (W - labelW) / 2;
  ctx.fillStyle = (rarityColors[rarity] || '#bbb') + '22';
  ctx.beginPath();
  ctx.roundRect(labelX, 70, labelW, 26, 6);
  ctx.fill();
  ctx.fillStyle = rarityColors[rarity] || '#bbb';
  ctx.fillText(rarityLabel.toUpperCase(), W/2, 87);

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

  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '400 13px "Segoe UI", sans-serif';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  ctx.fillText(dateStr, W/2, H - 100);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(60, H-80); ctx.lineTo(W-60, H-80); ctx.stroke();

  ctx.fillStyle = palette.muted || '#9a8c7a';
  ctx.font = '500 12px "Segoe UI", sans-serif';
  ctx.fillText('Festival Fortune', W/2, H-50);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

function downloadSharePng() {
  const canvas = document.getElementById('share-canvas');
  const fortune = state.currentFortune;
  const key = state.currentFestival;
  const link = document.createElement('a');
  link.download = `festival-fortune-${key}-${fortune.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function handleShareOption(network) {
  if (network === 'download') {
    downloadSharePng();
    closeShareMenu();
    return;
  }
  if (network === 'native') {
    const blob = await renderShareCard();
    const ok = await shareNative(blob);
    if (!ok && blob) {
      const url = getShareUrl();
      if (url && navigator.clipboard) navigator.clipboard.writeText(url);
      showToast('Native share unavailable — link copied');
    }
    closeShareMenu();
    return;
  }
  await renderShareCard();
  shareToNetwork(network);
  closeShareMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-share');
  if (btn) btn.addEventListener('click', () => { renderShareCard().then(openShareMenu); });

  const closeBtn = document.getElementById('share-close');
  if (closeBtn) closeBtn.addEventListener('click', closeShareMenu);

  document.querySelectorAll('#share-menu .share-option').forEach(opt => {
    opt.addEventListener('click', () => handleShareOption(opt.dataset.network));
  });

  document.querySelector('#share-menu .share-menu-backdrop').addEventListener('click', closeShareMenu);
});
