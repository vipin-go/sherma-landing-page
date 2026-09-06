# Business impact: author from first principles

Use this reference when adding or revising an economic calculator. It is an optional
business section, not a required financial claim for every persona. Preserve the
surrounding theme, character, marketing and demo behavior.

## Start with the work

Before choosing defaults, identify the persona's actual buyer, repetitive task,
monthly work unit, hands-on baseline, and required human review. Read its published
description, commands and landing-page content. Do not transplant another persona's
assumptions: restaurant campaigns are not tax forms; researched hiring signals are
not successful placements; a private introduction is not a property sale.

Ask what physically changes, then what the customer would do with that change.
Negative productivity means necessary operating burden reduced. Positive
productivity is the possible higher-value use of the resulting capacity. These are
not two savings to add together. Use plain-language headings for visitors and explain
these terms in the methodology disclosure.

## Three layers, three short steps

These are live calculator tabs, not a submit workflow. Keep styled sliders and
editable numeric values beside the automatically updated summary (stacked on
mobile). There is no calculation submit button. Capacity can appear immediately;
financial results remain incomplete until the visitor supplies the needed inputs
and confirms applicable overlap assumptions. Do not restore salary-based or
automatic agency-fee savings just to make every card display a number.

Make the result panel cost-first: show the all-in operating estimate, itemized
models/media, tools, infrastructure, platform and applicable paid review, plus
an average per work unit. Cost inputs start unset, including the breakdown. An
entered total budget is not evidence of its components: show an explicit missing
breakdown notice instead of manufacturing a split. Per-unit averages are modeled
allocations, not vendor price quotes. Keep capacity and value beneath this cost
explanation. Strike through only genuinely expected avoided spending; never style
contribution, capacity or risk estimates as cancelled invoices or AI discounts.
Author localized `costCopy` from the seed (`breakdown`, `perUnit`, `budgetOnly`,
`benefitNotice`, `remainder`, `allocation`) and preserve `{amount}` in every locale.

### Country currency is not translation

Author the calculator's `currency` as the base unit of every economic assumption.
If a regional page has independently sourced local estimates, record them in that
region's own base currency. Do not invent local wages, fees, tax savings or prices.
The platform maps the detected country to its current CLDR currency and applies
a dated reference FX rate to monetary inputs, limits and results. Hours, units,
percentages and return multiples never get an FX multiplier. User-entered amounts
remain in a stable underlying unit; neither language switches nor delayed country
detection may reinterpret existing numbers. Rate failure retains the base currency
with a visible notice, never a substituted symbol. FX is not local market research.

Add localized `currencyCopy` (`native`, `loading`, `unavailable`, `converted`,
`basis`) using the authoring seed. Preserve `{base}`, `{currency}`, `{date}` exactly.
Translate these notices in every configured locale, including static assets and
regional catalogues. The translation model must not convert numeric assumptions
or choose exchange rates. Runtime conversion works equally on static translations.
Deploy compatible currency support before publishing the additive notice contract.

1. **Your workload:** monthly volume, active minutes per unit, expected share reduced,
   review minutes and who performs review. Workload defaults must be explicitly
   illustrative, not observed performance. Waiting time is not hands-on time.
2. **Operating cost:** a complete monthly budget or itemized models/media, tools,
   infrastructure, Gabriel fees and additional paid review. Do not require tokens,
   provider selection or insider pricing knowledge. Blank means unknown; explicit
   zero means no applicable cost. No financial defaults masquerading as a quote.
3. **Use the capacity:** visitors select outcomes, allocate available hours once,
   and enter only the financial assumptions needed for those outcomes. Keep unused
   categories collapsed. Unallocated capacity has no euro value.

The renderer owns styled accessible controls, bottom step actions, responsive
two-column/stacked presentation, and a live capacity-first summary. Do not author
layout, CSS, React component names or formulas. Hide the return multiple until cost
and selected value assumptions are complete. A zero cost has no defined multiple;
negative net benefit must remain visible. Do not add arbitrary optimistic multipliers.

## Valuation rules

| Outcome | Valid basis | Do not claim |
|---|---|---|
| Capacity | Net hours after existing-team review | Hours × unchanged salary is cash saved |
| Cash avoided | Explicit paid work or spend that actually stops, bounded by current spend | The same hours again as both contractor invoices and hourly savings |
| Higher-value work | Allocated hours × incremental contribution, not gross revenue | Freed time is automatically sold |
| Throughput | Capacity-supported extra units, capped by demand, × contribution per unit | Capacity alone proves demand or revenue |
| Hiring | Genuinely planned hire, covered workload, entered deferral period | An automatic FTE or headcount-saving claim |
| Errors | Expected distinct avoided incidents × incremental loss | Labor or incidents counted elsewhere |
| Risk | Change in monthly event probability × exposure | A guarantee, compliance result or cash saving |
| Cycle time | Elapsed days improved, shown operationally | An invented value for speed |

Existing-team review reduces available capacity; extra paid review enters operating
cost instead. A total budget already includes paid review; do not add it again.
Contribution excludes the AI operating costs that the calculator subtracts once.
Require explicit non-overlap confirmation for financial outcomes and explicit
confirmation of a genuinely planned hire. This confirms assumptions, not their
truth: all outputs remain modeled, never independently verified customer results.

Economic value = cash avoided + contribution + separately identified expected loss
reduction. Net benefit = value − operating cost. Return multiple = value / cost.
Annualize the same assumptions without growth; hiring savings stop at the entered
month. Keep risk expectations separately visible in the breakdown.

## Authoring contract

Keep landing-page schema version 2. Add `roiCalculator.methodologyVersion: 2` with
heading, subheading, disclaimer, currency, locale, optional existing section CTA,
empty `inputs: []`, empty `metrics: []`, and `businessImpact`:

- `defaults`: exactly `volume`, `minutes`, `automation`, `review`; numbers only.
- `fields`: the supported input catalogue, each with `label` and `help`.
- `copy`: the complete localized interface catalogue, including `navLabel`.
  Use `navLabel: "ROI"` and `heading: "ROI Calculator"` in canonical English.
  Translate the section heading while keeping the compact ROI navigation acronym.
  Persona-specific explanations remain in the supporting copy and methodology.
- `outcomes`: one to seven unique `{ id, label, help }` entries selected from
  `cash`, `higher_value`, `throughput`, `hiring`, `error`, `risk`, `cycle_time`.
  Include only outcomes meaningful for this persona; no invented outcome IDs.
- `burden`, `opportunity`: one to four concrete, persona-specific examples each.

Generate the complete editable seed, rather than omitting required UI copy:

```bash
node scripts/create-business-impact.cjs --name "Example" --unit "Forms each month" --output /tmp/example-impact.json
```

Read and adapt the result to the persona before placing it in the canonical child
landing page. Never copy financial values from a screenshot. Preserve stable
persona names and CTA targets. Legacy arithmetic fields are not a v2 escape hatch.
Unsupported keys, missing labels, duplicate outcomes and financial defaults fail
the canonical validator, shared by the platform and standalone tooling.

## Localization and verification

### Household versus retail

For a Grocery Twin with two editions, keep `landingPage.roiCalculator` for Retail
and put the Home model in `landingPage.groceryTwin.homeRoiCalculator`. Both use the
same validated calculator contract; never clone retail assumptions into Home.
`createHouseholdImpactCalculator()` supplies an editable authoring seed, not a
runtime fallback. Home renders only its own enabled configuration.

Ground household volume in grocery/meal-planning sessions, not locations, staff,
orders or SKUs. Subtract time spent checking ingredients, allergies and the cart.
Never monetize personal time or imply cooking, shopping or travel are automated.
The optional `error` outcome can model edible food waste avoided as portions ×
ingredient cost, clearly labeled as a user estimate and counted only where using
the food replaces future spending. Do not also count the same food as discounts or
duplicate purchases avoided. Leave monetary assumptions unset. Offer time for
everyday life, not contribution margin, staffing reductions or guaranteed savings.
Localize every label and keep this model separate from Retail in every locale.

All labels, help, notices and accessibility copy belong to the model and translate
with the landing page. IDs, currency, defaults and methodology version do not.
Changing language must preserve entered numbers and their currency. Preserve the
existing regional catalogue; do not replace market pages with a neutral clone.

Use the maintained incremental translation generator after authoring; mirror the
child, manifest and locale assets into the parent. Never invent translation hashes
or treat an English fallback as a completed locale. Do not publish v2 content to a
backend that lacks v2 validation/rendering support.

Verify a blank financial state, explicit zero, negative return, review treatment,
allocation overflow, limited hiring months, missing evidence, overlap warnings,
keyboard controls, RTL, language changes and mobile layout. Existing pages without
the v2 opt-in must retain their behavior. The calculator makes no model calls and
does not persist visitor assumptions or authorize any persona action.
