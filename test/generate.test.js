import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateBrief, TAGS } from '../public/engine/generate.js';
import { SAMPLE_INPUT, SAMPLE_NOW } from '../public/engine/sample.js';

const now = new Date(`${SAMPLE_NOW}T12:00:00Z`);
const gen = (input) => generateBrief(input, { now });

test('invalid input returns errors and no brief', () => {
  const r = gen({ decision: '' });
  assert.equal(r.ok, false);
  assert.equal(r.brief, undefined);
});

test('hedged "facts" are moved to assumptions, never kept as facts', () => {
  const { brief } = gen({ decision: 'Should we raise prices?', facts: 'Churn is 3% [E1]\nCustomers will probably accept a 5% rise', evidence: 'E1: Billing export' });
  assert.deepEqual(brief.facts.map((f) => f.text), ['Churn is 3%']);
  assert.equal(brief.reclassified, 1);
  const moved = brief.assumptions.find((a) => a.text.startsWith('Customers will probably'));
  assert.equal(moved.tag, TAGS.ASSUMPTION);
  assert.match(moved.basis, /Moved from Known facts/);
});

test('every output item carries a known epistemic tag', () => {
  const { brief } = gen(SAMPLE_INPUT);
  const all = [
    ...brief.bottomLine, ...brief.facts, ...brief.constraints, ...brief.assumptions, ...brief.unknowns,
    ...brief.risks, ...brief.infoNeeds, ...brief.nextActions, brief.reversibility.summary,
    ...brief.options.flatMap((o) => [...o.pros, ...o.cons, ...o.related]),
  ];
  const valid = new Set(Object.values(TAGS));
  for (const it of all) assert.ok(valid.has(it.tag), `bad tag on "${it.text}"`);
});

test('only supplied, unhedged statements are tagged FACT', () => {
  const { brief } = gen(SAMPLE_INPUT);
  for (const f of brief.facts) assert.equal(f.tag, TAGS.FACT);
  assert.ok(!brief.facts.some((f) => /probably/.test(f.text)));
  // Pros/cons are user judgments, not facts.
  for (const o of brief.options) for (const p of [...o.pros, ...o.cons]) assert.notEqual(p.tag, TAGS.FACT);
});

test('facts track whether they cite valid evidence; broken citations become unknowns', () => {
  const { brief } = gen({ decision: 'Should we raise prices?', facts: 'Churn is 3% [E1]\nARPU is $40 [E9]\nNPS is 41', evidence: 'E1: Billing export' });
  assert.deepEqual(brief.facts.map((f) => f.refs), [['E1'], [], []]);
  assert.ok(brief.unknowns.some((u) => /E9/.test(u.text)));
});

test('a status-quo baseline is added (and labelled) when none is supplied', () => {
  const { brief } = gen({ decision: 'Should we raise prices?', options: 'Raise: Raise 5%\nPro: Margin\nCon: Churn' });
  const base = brief.options.at(-1);
  assert.equal(base.origin, 'inferred');
  assert.equal(base.tag, TAGS.INFERENCE);
  const { brief: b2 } = gen({ decision: 'Should we raise prices?', options: 'Raise: Raise 5%\nHold: Maintain current pricing' });
  assert.equal(b2.options.filter((o) => o.origin === 'inferred').length, 0);
});

test('reversibility heuristic separates commitments from pilots', () => {
  const { brief } = gen({ decision: 'Should we change vendor?', options: 'Sign: Sign a 3-year exclusive contract\nPilot: Run a 60-day pilot with one team' });
  const levels = Object.fromEntries(brief.reversibility.perOption.map((r) => [r.name, r.level]));
  assert.equal(levels.Sign, 'Low');
  assert.equal(levels.Pilot, 'High');
});

test('minimal input degrades gracefully to a low-confidence, not-ready brief', () => {
  const r = gen({ decision: 'Should we hire a second analyst?' });
  assert.equal(r.ok, true);
  assert.equal(r.brief.confidence.level, 'Low');
  assert.equal(r.brief.readiness, 'Not decision-ready');
  assert.ok(r.brief.bottomLine.some((b) => /No option is recommended/.test(b.text)));
  assert.ok(r.brief.unknowns.some((u) => u.text === 'No known facts supplied.'));
  assert.ok(r.warnings.length > 0);
});

test('confidence is capped below High when facts are unsourced or reclassified', () => {
  const { brief } = gen(SAMPLE_INPUT);
  assert.equal(brief.confidence.level, 'Moderate');
  assert.ok(brief.confidence.score >= 75);
  assert.equal(brief.confidence.capped, true);
});

test('a fully sourced, complete input can reach High confidence', () => {
  const { brief } = gen({
    decision: 'Should we renew the office lease?',
    facts: 'Rent is $12,000/month [E1]\nHeadcount in office averages 14 of 40 [E2]\nLease ends 2027-03-31 [E1]',
    evidence: 'E1: Lease agreement\nE2: Badge data, last 6 months',
    options: 'Renew: Renew for 5 years\nPro: Price lock\nCon: Overpaying for space\nDownsize: Lease a smaller space short-term\nPro: Saves ~$60k/yr\nCon: Move disruption',
    deadline: '2026-12-31',
  });
  assert.equal(brief.confidence.level, 'High');
  assert.equal(brief.readiness, 'Decision-ready on the supplied evidence');
});

test('short horizons add a compressed-horizon risk and checkpoints use the midpoint', () => {
  const { brief } = gen({ decision: 'Should we accept the offer?', deadline: '2026-10-10' });
  assert.ok(brief.risks.some((r) => /Compressed horizon: 7 days/.test(r.text)));
  assert.ok(brief.nextActions.some((a) => /checkpoint by 2026-10-06/.test(a.text)));
});

test('generation is deterministic', () => {
  assert.deepEqual(gen(SAMPLE_INPUT), gen(SAMPLE_INPUT));
});
