const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = asset => JSON.parse(fs.readFileSync(path.join(root, asset), 'utf8'));
const page = read('assets/landing-page.json').landingPage;

// Country selection replaces the entire base page. Each country and its cached
// translations must therefore own the calculator; base-only content disappears.
function assertCalculator(landingPage, source) {
  const calculator = landingPage.roiCalculator;
  assert.equal(calculator?.enabled, true, `${source}: ROI is enabled`);
  assert.equal(calculator.methodologyVersion, 2, `${source}: guided methodology`);
  assert.ok(calculator.heading?.trim(), `${source}: section heading`);
  assert.equal(calculator.businessImpact?.copy.navLabel, 'ROI', `${source}: short menu label`);
  assert.ok(calculator.costCopy?.breakdown?.trim(), `${source}: itemized cost copy`);
}

test('Sherma base and all country pages expose the ROI calculator', () => {
  assertCalculator(page, 'base');
  const regions = page.localization.regionalPages;
  assert.ok(regions.some(region => region.countryCodes.includes('NL')));
  for (const region of regions) assertCalculator(region.page, region.key);
});

test('all cached language/market variants retain localized ROI controls', () => {
  const entries = page.localization.translation.generatedTranslations;
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    const translated = read(entry.assetPath).landingPage;
    assertCalculator(translated, entry.assetPath);
  }
});
