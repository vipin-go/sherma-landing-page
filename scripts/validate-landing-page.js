#!/usr/bin/env node
const fs = require('fs');

const ALLOWED_ICONS = new Set([
  'heart', 'shield-check', 'sparkles', 'chat', 'users', 'lock', 'check', 'star',
  'search', 'lightbulb', 'user-plus', 'calendar', 'question-mark', 'envelope',
]);
const ALLOWED_ROLES = new Set(['user', 'assistant']);
const ALLOWED_DESIGN_VARIANTS = new Set(['default', 'signature', 'banking', 'form-operations']);
const ALLOWED_BRAND_MARKS = new Set(['heart', 'image', 'initial']);
const ALLOWED_NAV_TARGETS = new Set([
  'meet', 'about', 'capabilities', 'use-cases', 'trust',
  'how-it-works', 'stories', 'faq', 'contact',
]);
const ALLOWED_PALETTES = new Set(['coral', 'ocean', 'forest', 'purple', 'slate', 'research', 'maroon', 'stone', 'emerald', 'custom']);
const ALLOWED_THEME_COLORS = new Set(['purple', 'indigo', 'blue', 'green', 'orange', 'pink', 'red', 'teal', 'gray', 'slate', 'maroon', 'stone', 'emerald']);
const ALLOWED_THEME_MODES = new Set(['light', 'dark']);
const ALLOWED_BUILTIN_FONTS = new Set(['dm-sans', 'inter', 'system', 'roboto', 'poppins', 'outfit']);
const NORMALIZED_HEX = /^#[0-9a-f]{6}$/;
const SAFE_GOOGLE_FONT = /^[A-Za-z0-9][A-Za-z0-9 .'-]{0,79}$/;
const BRAND_COLOR_KEYS = ['canvas', 'surface', 'sidebar', 'text', 'accent', 'userBubble'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message) {
  throw new Error(message);
}

function validateIcon(icon, label, required = false) {
  if (icon === undefined) {
    if (required) fail(`${label} is required`);
    return;
  }
  if (!ALLOWED_ICONS.has(icon)) {
    fail(`${label} "${icon}" is not one of: ${[...ALLOWED_ICONS].join(', ')}`);
  }
}

function contrastRatio(first, second) {
  const luminance = (hex) => {
    const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return (0.2126 * values[0]) + (0.7152 * values[1]) + (0.0722 * values[2]);
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function assertNoEmoji(value, path = 'landingPage') {
  if (typeof value === 'string') {
    if (/\p{Extended_Pictographic}/u.test(value)) {
      fail(`${path} must not contain emoji; use a supported icon key instead`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEmoji(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'emoji') fail(`${path}.emoji is no longer supported; use ${path}.icon`);
      assertNoEmoji(item, `${path}.${key}`);
    });
  }
}

function validateFormOperations(landingPage) {
  const root = landingPage.formOperations;
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    fail('landingPage.formOperations is required when design.variant is "form-operations"');
  }
  const get = (path) => path.split('.').reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, root);
  const requireString = (path) => {
    const value = get(path);
    if (typeof value !== 'string' || !value.trim()) fail(`landingPage.formOperations.${path} is required`);
  };
  const requireArray = (path, minimum = 1) => {
    const value = get(path);
    if (!Array.isArray(value) || value.length < minimum) {
      fail(`landingPage.formOperations.${path} must contain at least ${minimum} item${minimum === 1 ? '' : 's'}`);
    }
    return value;
  };
  [
    'heroDemo.sampleLabel', 'heroDemo.demoNote', 'heroDemo.openingReply',
    'heroDemo.greetingReply', 'heroDemo.instructionReply', 'heroDemo.reviewReply',
    'heroDemo.approvedReply', 'heroDemo.escalatedReply', 'heroDemo.fallbackReply',
    'heroDemo.trace.label', 'heroDemo.trace.status', 'heroDemo.trace.reviewLabel',
    'heroDemo.review.label', 'heroDemo.review.status', 'heroDemo.review.approveLabel', 'heroDemo.review.sendBackLabel',
    'heroDemo.results.approvedTitle', 'heroDemo.results.approvedBody',
    'heroDemo.results.escalatedTitle', 'heroDemo.results.escalatedBody',
    'principle.kicker', 'principle.heading', 'principle.body', 'principle.traceLabel',
    'principle.traceId', 'principle.traceBody', 'principle.guaranteesKicker', 'principle.guaranteesHeading',
    'impact.kicker', 'impact.heading', 'impact.body', 'process.kicker', 'process.heading', 'process.body',
    'useCases.kicker', 'useCases.heading', 'useCases.body', 'useCases.customIntake.heading',
    'useCases.customIntake.body', 'useCases.customIntake.ctaLabel', 'useCases.customIntake.note',
    'useCases.customIntake.successHeading', 'useCases.customIntake.successBody',
    'useCases.customIntake.editLabel', 'useCases.customIntake.emailSubject',
    'workedExample.kicker', 'workedExample.heading', 'workedExample.body', 'workedExample.before',
    'workedExample.after', 'workedExample.linkLabel', 'workedExample.emailSubject',
    'workedExample.card.label', 'workedExample.card.period', 'workedExample.card.status',
    'workedExample.card.summaryLabel', 'workedExample.card.summary', 'workedExample.card.actionLabel',
    'workedExample.card.actionNote', 'workedExample.card.note', 'control.kicker', 'control.heading',
    'control.body', 'control.boundary.label', 'control.boundary.approvalLabel',
    'control.boundary.executionLabel', 'control.boundary.sourceNote', 'control.boundary.guarantee',
    'leadCapture.kicker', 'leadCapture.heading', 'leadCapture.body', 'leadCapture.ctaLabel',
    'leadCapture.successHeading', 'leadCapture.successBody', 'leadCapture.emailLabel',
    'leadCapture.privacyNote', 'leadCapture.emailSubject', 'footer.tagline', 'footer.poweredBy',
    'footer.copyright', 'footer.closingStatement',
  ].forEach(requireString);

  requireArray('proofItems', 4);
  const traceSteps = requireArray('heroDemo.trace.steps');
  traceSteps.forEach((step, index) => {
    if (!step || !['done', 'active', 'pending'].includes(step.state)) {
      fail(`landingPage.formOperations.heroDemo.trace.steps[${index}].state must be done, active, or pending`);
    }
    for (const key of ['title', 'detail']) {
      if (!step[key] || !String(step[key]).trim()) fail(`landingPage.formOperations.heroDemo.trace.steps[${index}].${key} is required`);
    }
  });
  requireArray('heroDemo.review.fields').forEach((field, index) => {
    for (const key of ['label', 'value', 'sourceLabel']) {
      if (!field?.[key] || !String(field[key]).trim()) fail(`landingPage.formOperations.heroDemo.review.fields[${index}].${key} is required`);
    }
  });
  requireArray('principle.traceSteps').forEach((step, index) => {
    if (step?.state && !['done', 'active', 'pending'].includes(step.state)) {
      fail(`landingPage.formOperations.principle.traceSteps[${index}].state must be done, active, or pending`);
    }
  });
  requireArray('principle.guarantees', 6).forEach((item, index) => validateIcon(item?.icon, `landingPage.formOperations.principle.guarantees[${index}].icon`, true));
  requireArray('impact.items').forEach((item, index) => {
    validateIcon(item?.icon, `landingPage.formOperations.impact.items[${index}].icon`, true);
    item?.metric?.values?.forEach((value, valueIndex) => {
      if (!Number.isFinite(value) || value < 0 || value > 100) fail(`landingPage.formOperations.impact.items[${index}].metric.values[${valueIndex}] must be between 0 and 100`);
    });
  });
  requireArray('process.steps', 6).forEach((step, index) => {
    if (!['persona', 'human'].includes(step?.actor)) fail(`landingPage.formOperations.process.steps[${index}].actor must be persona or human`);
    validateIcon(step?.icon, `landingPage.formOperations.process.steps[${index}].icon`, true);
  });
  requireArray('useCases.items', 7).forEach((item, index) => {
    if (!['live', 'next', 'custom'].includes(item?.status)) fail(`landingPage.formOperations.useCases.items[${index}].status must be live, next, or custom`);
  });
  requireArray('workedExample.card.rows');
  requireArray('control.points').forEach((item, index) => validateIcon(item?.icon, `landingPage.formOperations.control.points[${index}].icon`, true));
  requireArray('control.boundary.badges');
  requireArray('control.boundary.steps');
  requireArray('footer.groups');
  if (!landingPage.contact?.email || !EMAIL.test(landingPage.contact.email)) {
    fail('landingPage.contact.email must be a valid email for the Form Operations handoff');
  }
  for (const [path, value] of [
    ['landingPage.header.logoImageUrl', landingPage.header?.logoImageUrl],
    ['landingPage.heroCharacterImage', landingPage.heroCharacterImage],
  ]) {
    if (!value || !/^https:\/\//i.test(value) || !/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(value)) {
      fail(`${path} must be a direct HTTPS image URL with a supported image extension`);
    }
  }
}

function validate(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (parsed.schemaVersion !== 2) fail('schemaVersion must be 2');
  if (!parsed.resourceKey || !String(parsed.resourceKey).trim()) fail('resourceKey is required');
  if (parsed.runtimeDataPolicy !== 'definitions_only') fail('runtimeDataPolicy must be "definitions_only"');

  const landingPage = parsed.landingPage;
  if (!landingPage || typeof landingPage !== 'object') fail('landingPage object is required');
  if (!landingPage.headline || !String(landingPage.headline).trim()) fail('landingPage.headline is required');
  assertNoEmoji(landingPage);

  if (landingPage.design !== undefined) {
    const design = landingPage.design;
    if (!design || typeof design !== 'object') fail('landingPage.design must be an object');
    if (design.variant !== undefined && !ALLOWED_DESIGN_VARIANTS.has(design.variant)) {
      fail(`landingPage.design.variant must be one of: ${[...ALLOWED_DESIGN_VARIANTS].join(', ')}`);
    }
    if (design.defaultThemeMode !== undefined && !ALLOWED_THEME_MODES.has(design.defaultThemeMode)) {
      fail('landingPage.design.defaultThemeMode must be "light" or "dark"');
    }
    if (design.theme !== undefined) {
      const theme = design.theme;
      if (!theme || typeof theme !== 'object') fail('landingPage.design.theme must be an object');
      if (theme.palette !== undefined && !ALLOWED_PALETTES.has(theme.palette)) {
        fail(`landingPage.design.theme.palette must be one of: ${[...ALLOWED_PALETTES].join(', ')}`);
      }
      if (!ALLOWED_THEME_COLORS.has(theme.primaryColor)) {
        fail(`landingPage.design.theme.primaryColor must be one of: ${[...ALLOWED_THEME_COLORS].join(', ')}`);
      }
      for (const key of ['secondaryColor', 'accentColor']) {
        if (theme[key] !== undefined && !ALLOWED_THEME_COLORS.has(theme[key])) {
          fail(`landingPage.design.theme.${key} must be one of: ${[...ALLOWED_THEME_COLORS].join(', ')}`);
        }
      }
    }
    if (design.brand !== undefined) {
      const brand = design.brand;
      if (!brand || typeof brand !== 'object' || Array.isArray(brand)) fail('landingPage.design.brand must be an object');
      if (brand.presetRevision !== undefined && brand.presetRevision !== 1) {
        fail('landingPage.design.brand.presetRevision must be 1');
      }
      if (brand.colors !== undefined) {
        if (!brand.colors || typeof brand.colors !== 'object' || Array.isArray(brand.colors)) {
          fail('landingPage.design.brand.colors must be an object');
        }
        for (const mode of ['light', 'dark']) {
          const seeds = brand.colors[mode];
          if (seeds === undefined) continue;
          if (!seeds || typeof seeds !== 'object' || Array.isArray(seeds)) {
            fail(`landingPage.design.brand.colors.${mode} must be an object`);
          }
          for (const [key, value] of Object.entries(seeds)) {
            if (!BRAND_COLOR_KEYS.includes(key)) fail(`landingPage.design.brand.colors.${mode}.${key} is not a supported brand seed`);
            if (!NORMALIZED_HEX.test(value)) fail(`landingPage.design.brand.colors.${mode}.${key} must be normalized #rrggbb`);
          }
          if (seeds.text && seeds.surface && contrastRatio(seeds.text, seeds.surface) < 4.5) {
            fail(`landingPage.design.brand.colors.${mode}.text must have at least 4.5:1 contrast against surface`);
          }
          if (seeds.text && seeds.canvas && contrastRatio(seeds.text, seeds.canvas) < 4.5) {
            fail(`landingPage.design.brand.colors.${mode}.text must have at least 4.5:1 contrast against canvas`);
          }
          if (seeds.accent && seeds.surface && contrastRatio(seeds.accent, seeds.surface) < 3) {
            console.warn(`Warning: landingPage.design.brand.colors.${mode}.accent is below 3:1 contrast against surface`);
          }
        }
      }
      if (brand.typography !== undefined) {
        if (!brand.typography || typeof brand.typography !== 'object' || Array.isArray(brand.typography)) {
          fail('landingPage.design.brand.typography must be an object');
        }
        for (const [role, choice] of Object.entries(brand.typography)) {
          if (!['body', 'display', 'label'].includes(role)) fail(`landingPage.design.brand.typography.${role} is not supported`);
          if (!choice || typeof choice !== 'object' || Array.isArray(choice)) fail(`landingPage.design.brand.typography.${role} must be an object`);
          if (choice.source === 'builtin') {
            if (!ALLOWED_BUILTIN_FONTS.has(choice.family)) fail(`landingPage.design.brand.typography.${role}.family is not a supported built-in font`);
          } else if (choice.source === 'google') {
            if (typeof choice.family !== 'string' || !SAFE_GOOGLE_FONT.test(choice.family.trim())) {
              fail(`landingPage.design.brand.typography.${role}.family is not a safe Google Font family name`);
            }
          } else {
            fail(`landingPage.design.brand.typography.${role}.source must be "builtin" or "google"`);
          }
        }
      }
    }
  }
  if (landingPage.design?.variant === 'form-operations') validateFormOperations(landingPage);

  if (landingPage.header !== undefined) {
    const header = landingPage.header;
    if (!header || typeof header !== 'object') fail('landingPage.header must be an object');
    if (header.brandMark !== undefined && !ALLOWED_BRAND_MARKS.has(header.brandMark)) {
      fail(`landingPage.header.brandMark must be one of: ${[...ALLOWED_BRAND_MARKS].join(', ')}`);
    }
    if (header.ctaLabel !== undefined && typeof header.ctaLabel !== 'string') {
      fail('landingPage.header.ctaLabel must be a string');
    }
    if (header.navItems !== undefined) {
      if (!Array.isArray(header.navItems)) fail('landingPage.header.navItems must be an array');
      header.navItems.forEach((item, index) => {
        const label = `landingPage.header.navItems[${index}]`;
        if (!item || typeof item !== 'object') fail(`${label} must be an object`);
        if (!item.label || !String(item.label).trim()) fail(`${label}.label is required`);
        if (!ALLOWED_NAV_TARGETS.has(item.target)) {
          fail(`${label}.target must be one of: ${[...ALLOWED_NAV_TARGETS].join(', ')}`);
        }
      });
    }
  }

  for (const key of ['badge', 'headlineAccent', 'headlineLine2', 'subheadline', 'ctaLabel', 'secondaryCtaLabel']) {
    if (landingPage[key] !== undefined && typeof landingPage[key] !== 'string') {
      fail(`landingPage.${key} must be a string`);
    }
  }
  if (landingPage.headlineAccent && !landingPage.headline.includes(landingPage.headlineAccent)) {
    fail('landingPage.headlineAccent must be a substring of landingPage.headline');
  }

  if (landingPage.featureTags !== undefined) {
    if (!Array.isArray(landingPage.featureTags)) fail('landingPage.featureTags must be an array');
    landingPage.featureTags.forEach((tag, index) => {
      if (typeof tag !== 'string' || !tag.trim()) fail(`landingPage.featureTags[${index}] must be a non-empty string`);
    });
  }

  if (landingPage.demoConversation !== undefined) {
    if (!Array.isArray(landingPage.demoConversation)) fail('landingPage.demoConversation must be an array');
    landingPage.demoConversation.forEach((message, index) => {
      const label = `landingPage.demoConversation[${index}]`;
      if (!message || typeof message !== 'object') fail(`${label} must be an object`);
      if (!ALLOWED_ROLES.has(message.role)) fail(`${label}.role must be "user" or "assistant"`);
      if (!message.text || !String(message.text).trim()) fail(`${label}.text is required`);
    });
  }

  if (landingPage.heroChat !== undefined) {
    const heroChat = landingPage.heroChat;
    if (!heroChat || typeof heroChat !== 'object') fail('landingPage.heroChat must be an object');
    for (const key of ['statusLabel', 'inputPlaceholder']) {
      if (heroChat[key] !== undefined && typeof heroChat[key] !== 'string') {
        fail(`landingPage.heroChat.${key} must be a string`);
      }
    }
    if (heroChat.suggestedPrompts !== undefined) {
      if (!Array.isArray(heroChat.suggestedPrompts)) fail('landingPage.heroChat.suggestedPrompts must be an array');
      heroChat.suggestedPrompts.forEach((prompt, index) => {
        if (typeof prompt !== 'string' || !prompt.trim()) {
          fail(`landingPage.heroChat.suggestedPrompts[${index}] must be a non-empty string`);
        }
      });
    }
  }

  const features = landingPage.features;
  if (features !== undefined) {
    if (!Array.isArray(features)) fail('landingPage.features must be an array');
    features.forEach((feature, index) => {
      const label = `landingPage.features[${index}]`;
      if (!feature || typeof feature !== 'object') fail(`${label} must be an object`);
      if (!feature.title || !String(feature.title).trim()) fail(`${label}.title is required`);
      if (!feature.body || !String(feature.body).trim()) fail(`${label}.body is required`);
      validateIcon(feature.icon, `${label}.icon`);
    });
  }

  if (landingPage.gallery !== undefined) {
    const gallery = landingPage.gallery;
    if (!gallery || typeof gallery !== 'object') fail('landingPage.gallery must be an object');
    validateIcon(gallery.icon, 'landingPage.gallery.icon');
    if (!gallery.heading || !String(gallery.heading).trim()) fail('landingPage.gallery.heading is required');
    if (gallery.headingAccent !== undefined && typeof gallery.headingAccent !== 'string') {
      fail('landingPage.gallery.headingAccent must be a string');
    }
    if (gallery.headingAccent && !gallery.heading.includes(gallery.headingAccent)) {
      fail('landingPage.gallery.headingAccent must be a substring of landingPage.gallery.heading');
    }
    if (gallery.body !== undefined && typeof gallery.body !== 'string') fail('landingPage.gallery.body must be a string');
    if (!Array.isArray(gallery.items) || gallery.items.length === 0) fail('landingPage.gallery.items must be a non-empty array');
    gallery.items.forEach((item, index) => {
      const label = `landingPage.gallery.items[${index}]`;
      if (!item || typeof item !== 'object') fail(`${label} must be an object`);
      for (const key of ['image', 'alt', 'caption']) {
        if (!item[key] || !String(item[key]).trim()) fail(`${label}.${key} is required`);
      }
    });
  }

  if (landingPage.bento !== undefined) {
    const bento = landingPage.bento;
    if (!bento || typeof bento !== 'object') fail('landingPage.bento must be an object');
    for (const key of ['photoTall', 'photoWide']) {
      const photo = bento[key];
      if (!photo || typeof photo !== 'object') fail(`landingPage.bento.${key} must be an object`);
      for (const field of ['image', 'alt', 'name', 'meta']) {
        if (!photo[field] || !String(photo[field]).trim()) fail(`landingPage.bento.${key}.${field} is required`);
      }
    }
    for (const key of ['mainCard', 'ctaCard', 'smallCardA', 'smallCardB']) {
      const card = bento[key];
      if (!card || typeof card !== 'object') fail(`landingPage.bento.${key} must be an object`);
      validateIcon(card.icon, `landingPage.bento.${key}.icon`, true);
      for (const field of ['title', 'body']) {
        if (!card[field] || !String(card[field]).trim()) fail(`landingPage.bento.${key}.${field} is required`);
      }
    }
    if (!bento.ctaCard.ctaLabel || !String(bento.ctaCard.ctaLabel).trim()) {
      fail('landingPage.bento.ctaCard.ctaLabel is required');
    }
    if (bento.mainCard.tags !== undefined) {
      if (!Array.isArray(bento.mainCard.tags)) fail('landingPage.bento.mainCard.tags must be an array');
      bento.mainCard.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || !tag.trim()) fail(`landingPage.bento.mainCard.tags[${index}] must be a non-empty string`);
      });
    }
  }

  if (landingPage.statement !== undefined) {
    const statement = landingPage.statement;
    if (!statement || typeof statement !== 'object') fail('landingPage.statement must be an object');
    if (!statement.kicker || !String(statement.kicker).trim()) fail('landingPage.statement.kicker is required');
    if (!Array.isArray(statement.segments) || statement.segments.length === 0) {
      fail('landingPage.statement.segments must be a non-empty array');
    }
    statement.segments.forEach((segment, index) => {
      const label = `landingPage.statement.segments[${index}]`;
      if (!segment || typeof segment !== 'object') fail(`${label} must be an object`);
      if (!segment.text || !String(segment.text).trim()) fail(`${label}.text is required`);
      if (segment.tone !== undefined && !['strong', 'muted', 'iris', 'accent'].includes(segment.tone)) {
        fail(`${label}.tone must be one of: strong, muted, iris, accent`);
      }
    });
  }

  if (landingPage.deployment !== undefined) {
    const deployment = landingPage.deployment;
    if (!deployment || typeof deployment !== 'object') fail('landingPage.deployment must be an object');
    for (const key of ['kicker', 'heading', 'body', 'personaLabel', 'platformLabel', 'note']) {
      if (!deployment[key] || !String(deployment[key]).trim()) fail(`landingPage.deployment.${key} is required`);
    }
    if (!Array.isArray(deployment.items) || deployment.items.length === 0) {
      fail('landingPage.deployment.items must be a non-empty array');
    }
    deployment.items.forEach((item, index) => {
      const label = `landingPage.deployment.items[${index}]`;
      if (!item || typeof item !== 'object') fail(`${label} must be an object`);
      for (const key of ['code', 'title', 'body']) {
        if (!item[key] || !String(item[key]).trim()) fail(`${label}.${key} is required`);
      }
    });
    if (!Array.isArray(deployment.boundaryItems) || deployment.boundaryItems.length === 0) {
      fail('landingPage.deployment.boundaryItems must be a non-empty array');
    }
    deployment.boundaryItems.forEach((item, index) => {
      if (typeof item !== 'string' || !item.trim()) fail(`landingPage.deployment.boundaryItems[${index}] must be a non-empty string`);
    });
  }

  if (landingPage.useCases !== undefined) {
    const useCases = landingPage.useCases;
    if (!useCases || typeof useCases !== 'object') fail('landingPage.useCases must be an object');
    validateIcon(useCases.icon, 'landingPage.useCases.icon');
    if (!useCases.heading || !String(useCases.heading).trim()) fail('landingPage.useCases.heading is required');
    if (useCases.headingAccent !== undefined && typeof useCases.headingAccent !== 'string') {
      fail('landingPage.useCases.headingAccent must be a string');
    }
    if (useCases.headingAccent && !useCases.heading.includes(useCases.headingAccent)) {
      fail('landingPage.useCases.headingAccent must be a substring of landingPage.useCases.heading');
    }
    if (!Array.isArray(useCases.items) || useCases.items.length === 0) {
      fail('landingPage.useCases.items must be a non-empty array');
    }
    useCases.items.forEach((item, index) => {
      const label = `landingPage.useCases.items[${index}]`;
      if (!item || typeof item !== 'object') fail(`${label} must be an object`);
      if (!item.label || !String(item.label).trim()) fail(`${label}.label is required`);
      for (const key of ['number', 'mode', 'outcome', 'summary', 'inputSummary', 'outputSummary']) {
        if (item[key] !== undefined && typeof item[key] !== 'string') fail(`${label}.${key} must be a string`);
      }

      if (!Array.isArray(item.inputs) || item.inputs.length === 0) fail(`${label}.inputs must be a non-empty array`);
      item.inputs.forEach((input, i) => {
        const l = `${label}.inputs[${i}]`;
        if (!input || typeof input !== 'object') fail(`${l} must be an object`);
        for (const key of ['code', 'description']) {
          if (!input[key] || !String(input[key]).trim()) fail(`${l}.${key} is required`);
        }
      });

      if (!Array.isArray(item.capabilities) || item.capabilities.length === 0) fail(`${label}.capabilities must be a non-empty array`);
      item.capabilities.forEach((capability, i) => {
        const l = `${label}.capabilities[${i}]`;
        if (!capability || typeof capability !== 'object') fail(`${l} must be an object`);
        for (const key of ['modality', 'description']) {
          if (!capability[key] || !String(capability[key]).trim()) fail(`${l}.${key} is required`);
        }
      });

      if (!Array.isArray(item.outputs) || item.outputs.length === 0) fail(`${label}.outputs must be a non-empty array`);
      item.outputs.forEach((output, i) => {
        if (typeof output !== 'string' || !output.trim()) fail(`${label}.outputs[${i}] must be a non-empty string`);
      });

      if (!Array.isArray(item.workflow) || item.workflow.length === 0) fail(`${label}.workflow must be a non-empty array`);
      item.workflow.forEach((step, i) => {
        const l = `${label}.workflow[${i}]`;
        if (!step || typeof step !== 'object') fail(`${l} must be an object`);
        for (const key of ['stage', 'description']) {
          if (!step[key] || !String(step[key]).trim()) fail(`${l}.${key} is required`);
        }
      });

      if (!item.selfLearning || typeof item.selfLearning !== 'object') fail(`${label}.selfLearning must be an object`);
      for (const key of ['learns', 'neverChanges']) {
        if (!item.selfLearning[key] || !String(item.selfLearning[key]).trim()) fail(`${label}.selfLearning.${key} is required`);
      }
    });
  }

  if (landingPage.platform !== undefined) {
    const platform = landingPage.platform;
    if (!platform || typeof platform !== 'object') fail('landingPage.platform must be an object');
    for (const key of ['kicker', 'heading', 'body']) {
      if (!platform[key] || !String(platform[key]).trim()) fail(`landingPage.platform.${key} is required`);
    }
    if (!Array.isArray(platform.items) || platform.items.length === 0) fail('landingPage.platform.items must be a non-empty array');
    platform.items.forEach((item, index) => {
      const label = `landingPage.platform.items[${index}]`;
      if (!item || typeof item !== 'object') fail(`${label} must be an object`);
      for (const key of ['image', 'title', 'body']) {
        if (!item[key] || !String(item[key]).trim()) fail(`${label}.${key} is required`);
      }
      if (item.alt !== undefined && typeof item.alt !== 'string') fail(`${label}.alt must be a string`);
    });
  }

  if (landingPage.trust !== undefined) {
    const trust = landingPage.trust;
    if (!trust || typeof trust !== 'object') fail('landingPage.trust must be an object');
    for (const key of ['kicker', 'heading', 'body', 'statusLabel', 'statusValue', 'statusDetail']) {
      if (!trust[key] || !String(trust[key]).trim()) fail(`landingPage.trust.${key} is required`);
    }
    if (!Array.isArray(trust.controls) || trust.controls.length === 0) fail('landingPage.trust.controls must be a non-empty array');
    trust.controls.forEach((control, index) => {
      const label = `landingPage.trust.controls[${index}]`;
      if (!control || typeof control !== 'object') fail(`${label} must be an object`);
      for (const key of ['title', 'body']) {
        if (!control[key] || !String(control[key]).trim()) fail(`${label}.${key} is required`);
      }
    });
  }

  if (landingPage.footer !== undefined) {
    const footer = landingPage.footer;
    if (!footer || typeof footer !== 'object') fail('landingPage.footer must be an object');
    if (!footer.tagline || !String(footer.tagline).trim()) fail('landingPage.footer.tagline is required');
    for (const key of ['exploreLabel', 'useCasesLabel', 'getStartedLabel']) {
      if (footer[key] !== undefined && typeof footer[key] !== 'string') fail(`landingPage.footer.${key} must be a string`);
    }
    if (footer.useCaseLinks !== undefined) {
      if (!Array.isArray(footer.useCaseLinks)) fail('landingPage.footer.useCaseLinks must be an array');
      footer.useCaseLinks.forEach((label, index) => {
        if (typeof label !== 'string' || !label.trim()) fail(`landingPage.footer.useCaseLinks[${index}] must be a non-empty string`);
      });
    }
  }

  if (landingPage.howItWorks !== undefined) {
    const howItWorks = landingPage.howItWorks;
    if (!howItWorks || typeof howItWorks !== 'object') fail('landingPage.howItWorks must be an object');
    validateIcon(howItWorks.icon, 'landingPage.howItWorks.icon');
    for (const key of ['kicker', 'heading']) {
      if (!howItWorks[key] || !String(howItWorks[key]).trim()) fail(`landingPage.howItWorks.${key} is required`);
    }
    if (howItWorks.headingAccent !== undefined && typeof howItWorks.headingAccent !== 'string') {
      fail('landingPage.howItWorks.headingAccent must be a string');
    }
    if (howItWorks.headingAccent && !howItWorks.heading.includes(howItWorks.headingAccent)) {
      fail('landingPage.howItWorks.headingAccent must be a substring of landingPage.howItWorks.heading');
    }
    if (!Array.isArray(howItWorks.steps) || howItWorks.steps.length === 0) {
      fail('landingPage.howItWorks.steps must be a non-empty array');
    }
    howItWorks.steps.forEach((step, index) => {
      const label = `landingPage.howItWorks.steps[${index}]`;
      if (!step || typeof step !== 'object') fail(`${label} must be an object`);
      validateIcon(step.icon, `${label}.icon`, true);
      for (const key of ['title', 'body']) {
        if (!step[key] || !String(step[key]).trim()) fail(`${label}.${key} is required`);
      }
    });
  }

  if (landingPage.faqs !== undefined) {
    if (!Array.isArray(landingPage.faqs)) fail('landingPage.faqs must be an array');
    landingPage.faqs.forEach((faq, index) => {
      const label = `landingPage.faqs[${index}]`;
      if (!faq || typeof faq !== 'object') fail(`${label} must be an object`);
      if (!faq.question || !String(faq.question).trim()) fail(`${label}.question is required`);
      if (!faq.answer || !String(faq.answer).trim()) fail(`${label}.answer is required`);
    });
  }

  if (landingPage.stories !== undefined) {
    const stories = landingPage.stories;
    if (!stories || typeof stories !== 'object') fail('landingPage.stories must be an object');
    validateIcon(stories.icon, 'landingPage.stories.icon');
    for (const key of ['heading', 'quote', 'attribution']) {
      if (!stories[key] || !String(stories[key]).trim()) fail(`landingPage.stories.${key} is required`);
    }
    for (const key of ['kicker', 'meta']) {
      if (stories[key] !== undefined && typeof stories[key] !== 'string') {
        fail(`landingPage.stories.${key} must be a string`);
      }
    }
    if (stories.people !== undefined) {
      if (!Array.isArray(stories.people)) fail('landingPage.stories.people must be an array');
      stories.people.forEach((person, index) => {
        const label = `landingPage.stories.people[${index}]`;
        if (!person || typeof person !== 'object') fail(`${label} must be an object`);
        if (!person.image || !String(person.image).trim()) fail(`${label}.image is required`);
        if (!person.alt || !String(person.alt).trim()) fail(`${label}.alt is required`);
      });
    }
    if (stories.stats !== undefined) {
      if (!Array.isArray(stories.stats)) fail('landingPage.stories.stats must be an array');
      stories.stats.forEach((stat, index) => {
        const label = `landingPage.stories.stats[${index}]`;
        if (!stat || typeof stat !== 'object') fail(`${label} must be an object`);
        if (!stat.value || !String(stat.value).trim()) fail(`${label}.value is required`);
        if (!stat.label || !String(stat.label).trim()) fail(`${label}.label is required`);
        validateIcon(stat.icon, `${label}.icon`);
      });
    }
  }

  if (landingPage.faqIntro !== undefined) {
    const faqIntro = landingPage.faqIntro;
    if (!faqIntro || typeof faqIntro !== 'object') fail('landingPage.faqIntro must be an object');
    validateIcon(faqIntro.icon, 'landingPage.faqIntro.icon');
    if (!faqIntro.heading || !String(faqIntro.heading).trim()) fail('landingPage.faqIntro.heading is required');
    if (faqIntro.kicker !== undefined && typeof faqIntro.kicker !== 'string') {
      fail('landingPage.faqIntro.kicker must be a string');
    }
  }

  if (landingPage.contact !== undefined) {
    const contact = landingPage.contact;
    if (!contact || typeof contact !== 'object') fail('landingPage.contact must be an object');
    for (const key of ['heading', 'body', 'email']) {
      if (contact[key] !== undefined && typeof contact[key] !== 'string') {
        fail(`landingPage.contact.${key} must be a string`);
      }
    }
  }

  if (landingPage.backgroundVideo !== undefined) {
    const backgroundVideo = landingPage.backgroundVideo;
    if (!backgroundVideo || typeof backgroundVideo !== 'object') fail('landingPage.backgroundVideo must be an object');
    if (!backgroundVideo.src || !String(backgroundVideo.src).trim()) fail('landingPage.backgroundVideo.src is required');
    if (backgroundVideo.poster !== undefined && typeof backgroundVideo.poster !== 'string') {
      fail('landingPage.backgroundVideo.poster must be a string');
    }
  }

  if (landingPage.backgroundImage !== undefined) {
    const backgroundImage = landingPage.backgroundImage;
    if (!backgroundImage || typeof backgroundImage !== 'object') fail('landingPage.backgroundImage must be an object');
    if (!backgroundImage.src || !String(backgroundImage.src).trim()) fail('landingPage.backgroundImage.src is required');
    if (backgroundImage.alt !== undefined && typeof backgroundImage.alt !== 'string') {
      fail('landingPage.backgroundImage.alt must be a string');
    }
  }

  if (landingPage.backgroundVideo !== undefined && landingPage.backgroundImage !== undefined) {
    fail('landingPage must use either backgroundVideo or backgroundImage, not both');
  }

  if (landingPage.closing !== undefined) {
    const closing = landingPage.closing;
    if (!closing || typeof closing !== 'object') fail('landingPage.closing must be an object');
    if (!closing.heading || !String(closing.heading).trim()) fail('landingPage.closing.heading is required');
    for (const key of ['kicker', 'body', 'ctaLabel']) {
      if (closing[key] !== undefined && typeof closing[key] !== 'string') {
        fail(`landingPage.closing.${key} must be a string`);
      }
    }
  }
}

const filePath = process.argv[2] || 'assets/landing-page.json';
try {
  validate(filePath);
  console.log(`Valid landing page definition: ${filePath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
