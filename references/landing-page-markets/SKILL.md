---
name: landing-page-markets
description: Create, translate, validate, and refresh IP-selected country-specific variants for a Git-backed landing page while preserving authoritative market terminology.
---

# Landing Page Markets

Use this skill when a landing page needs country-specific content rather than a direct translation of one global page. A market changes jurisdictional terminology, examples, official portals, credentials, currency, and date conventions. Language selection then translates that already-selected market page and must never change the market.

## Required inputs

- Persona repository path containing `assets/chat-config.json` and its landing-page child.
- One uppercase ISO alpha-2 country, or a reviewed market manifest.
- Canonical source language, visitor default language, and canonical BCP-47 locale.
- Current authoritative government sources for every jurisdiction-specific term or workflow claim.
- A reviewed protected-term glossary.

Never infer legal filing obligations, rates, or deadlines. If reliable official evidence is unavailable, keep the copy generic and flag it for review.

## Asset model

The landing-page child is authoritative:

```text
assets/landing-page.json
assets/landing-page.fr.json
assets/markets/fr/landing-page.json
assets/markets/fr/landing-page.en.json
assets/markets/fr/landing-page.de.json
```

`assets/markets/<country>/landing-page.json` is the canonical market envelope. It records the country, locale, source/default languages, base revision, context revision, glossary, official sources, adaptation index, and complete page. Do not duplicate its canonical language as `landing-page.<language>.json`.

The complete canonical page is also materialized into `landingPage.localization.regionalPages[]`. `marketContext.sourceAssetPath` points back to the envelope. The translation manifest uses country-directory paths and carries the matching `translationContextRevision`.

## Workflow

1. Inspect the parent/child status and preserve unrelated changes.
2. Research market terminology using current official government sources.
3. Add or review the country in a market manifest. Keep the glossary narrow and authoritative.
4. Run inventory/dry-run first.
5. Run the generator with `--apply`. It refreshes the neutral base translations, creates canonical markets, reuses unchanged translated paths, translates only market adaptations, and writes 37 non-canonical assets per market.
6. Run both the market check and the normal landing translation check.
7. Commit/push the landing-page child first. Then mirror assets and the updated child Git reference in the parent and commit/push it.

One market:

```bash
npx tsx server/skills/landing-page-markets/scripts/generate-landing-page-market.ts \
  --repo /absolute/path/to/persona \
  --country IN \
  --source-language en \
  --default-language en \
  --locale en-IN \
  --inventory
```

Manifest mode:

```bash
npx tsx server/skills/landing-page-markets/scripts/generate-landing-page-market.ts \
  --repo /absolute/path/to/persona \
  --manifest server/skills/landing-page-markets/references/sherma-markets.json \
  --provider openai \
  --confirm-external \
  --apply
```

Validation:

```bash
npx tsx server/skills/landing-page-markets/scripts/generate-landing-page-market.ts \
  --repo /absolute/path/to/persona \
  --manifest server/skills/landing-page-markets/references/sherma-markets.json \
  --check
```

## Invariants

- IP country selects a market before any language preference is applied.
- A language preference never changes `activeRegion`.
- The market source language overrides the global landing-page source language.
- Protected terms remain byte-for-byte unchanged in every market translation.
- Translation cache keys include market, locale, source language, target language, and context revision.
- Changing locale, source language, glossary, or official evidence invalidates unsafe reuse.
- Only human-facing strings may change. Do not change design, media, URLs, commands, identifiers, workflow behavior, placeholders, security rules, or approval boundaries.
- Writes must be complete and validated before Git commits are created.
- Preserve unrelated parent changes by staging only generated market paths and the intended localization update.

## Sherma profile

`references/sherma-markets.json` is the reviewed 25-market rollout manifest. In particular, India is `IN / en-IN` with English as both source and default while `GST`, `GSTR-3B`, and `GST Portal` remain protected. France uses the official `TVA` form, not `TAV`. China uses `zh-CN`; Taiwan uses `zh-TW` and Traditional Chinese.

