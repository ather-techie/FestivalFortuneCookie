const fs = require('fs');
const path = require('path');
const assert = require('assert');

const festivalsDir = path.join(__dirname, '..', 'festivals');
const requiredFields = ['name', 'vesselSvg', 'palette', 'rarityTiers', 'rarityLabels', 'fortunes'];
const requiredPalette = ['bg', 'text', 'accent', 'muted'];
const validRarities = ['common', 'uncommon', 'rare', 'legendary'];

function validateAll() {
  const folders = fs.readdirSync(festivalsDir).filter(f => fs.statSync(path.join(festivalsDir, f)).isDirectory());
  assert(folders.includes('eid'), 'EID festival folder is missing');

  let totalFortunes = 0;
  for (const folder of folders) {
    const filePath = path.join(festivalsDir, folder, 'fortunes.json');
    assert(fs.existsSync(filePath), `${folder}/fortunes.json does not exist`);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const field of requiredFields) {
      assert(data[field] !== undefined, `${folder}: missing field ${field}`);
    }

    for (const p of requiredPalette) {
      assert(data.palette[p], `${folder}: palette missing ${p}`);
    }

    const rarities = Object.keys(data.rarityTiers);
    for (const r of rarities) {
      assert(validRarities.includes(r), `${folder}: invalid rarity tier ${r}`);
    }
    const weightSum = Object.values(data.rarityTiers).reduce((a, b) => a + b, 0);
    assert.strictEqual(weightSum, 100, `${folder}: rarity weights must sum to 100, got ${weightSum}`);

    assert(Array.isArray(data.fortunes) && data.fortunes.length > 0, `${folder}: fortunes must be a non-empty array`);

    const ids = new Set();
    for (const f of data.fortunes) {
      assert(f.id, `${folder}: fortune missing id`);
      assert(!ids.has(f.id), `${folder}: duplicate fortune id ${f.id}`);
      ids.add(f.id);
      assert(validRarities.includes(f.rarity), `${folder}: fortune ${f.id} has invalid rarity ${f.rarity}`);
      assert(typeof f.text === 'string' && f.text.length > 0, `${folder}: fortune ${f.id} has empty text`);
      if (f.ageBand) {
        assert(Array.isArray(f.ageBand) && f.ageBand.length === 2, `${folder}: fortune ${f.id} ageBand must be [min, max]`);
        assert(f.ageBand[0] <= f.ageBand[1], `${folder}: fortune ${f.id} ageBand min must be <= max`);
      }
    }

    totalFortunes += data.fortunes.length;
  }

  assert(totalFortunes >= 200, `Expected at least 200 fortunes, got ${totalFortunes}`);
  console.log(`✓ Validated ${folders.length} festivals, ${totalFortunes} fortunes`);
}

module.exports = { validateAll };
if (require.main === module) validateAll();
