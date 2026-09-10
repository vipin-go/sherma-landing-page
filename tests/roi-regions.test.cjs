const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = asset => JSON.parse(fs.readFileSync(path.join(root, asset), 'utf8'));
const page = read('assets/landing-page.json').landingPage;

function assertCalculator(landingPage, source) {
  const calculator = landingPage.roiCalculator;
  assert.equal(calculator?.enabled, true, `${source}: ROI is enabled`);
  assert.equal(calculator.methodologyVersion, 2, `${source}: guided methodology`);
  assert.ok(calculator.heading?.trim(), `${source}: section heading`);
  assert.equal(calculator.businessImpact?.copy.navLabel, 'ROI', `${source}: short menu label`);
  assert.ok(calculator.costCopy?.breakdown?.trim(), `${source}: itemized cost copy`);
}

// Regions adapt individual sections on top of the base page, so the base
// calculator is always present and no country replaces the whole page.
test('Sherma exposes the ROI calculator and adapts regions per section', () => {
  assertCalculator(page, 'base');
  assert.equal(page.localization.regionAdaptation?.enabled, true, 'region adaptation is enabled');
  assert.equal(page.localization.regionalPages, undefined, 'complete regional pages are replaced by region sections');
});

test('all cached base language variants retain localized ROI controls', () => {
  const entries = page.localization.translation.generatedTranslations;
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    assert.equal(entry.regionKey ?? null, null, `${entry.assetPath}: base-page translation`);
    assertCalculator(read(entry.assetPath).landingPage, entry.assetPath);
  }
});

test('every declared region has a reviewed profile and an adaptable calculator section', () => {
  const regions = read('assets/landing-page/regions.json');
  assert.ok(regions.sections.roiCalculator, 'roiCalculator is region-adapted');
  assert.ok(regions.regions.some(region => region.countryCodes.includes('NL')), 'the Netherlands is declared');
  for (const region of regions.regions) {
    assert.equal(read(region.profile).review.status, 'reviewed', `${region.key}: reviewed profile`);
  }
});
