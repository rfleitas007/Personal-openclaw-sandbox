import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInput } from '../public/engine/validate.js';

const now = new Date('2026-10-03T12:00:00Z');

test('decision is required', () => {
  const { errors } = validateInput({}, { now });
  assert.deepEqual(errors.map((e) => e.field), ['decision']);
});

test('non-object and non-string input is handled without throwing', () => {
  assert.equal(validateInput(null, { now }).errors.length, 1);
  const { input } = validateInput({ decision: 12345678901, facts: null }, { now });
  assert.equal(input.decision, '12345678901');
  assert.equal(input.facts, '');
});

test('too-short decision and over-length fields are errors', () => {
  assert.match(validateInput({ decision: 'Hire?' }, { now }).errors[0].message, /too short/);
  const { errors } = validateInput({ decision: 'Should we expand?', context: 'x'.repeat(5001) }, { now });
  assert.equal(errors[0].field, 'context');
});

test('too many lines is an error', () => {
  const { errors } = validateInput({ decision: 'Should we expand?', facts: Array(61).fill('fact 1').join('\n') }, { now });
  assert.equal(errors[0].field, 'facts');
});

test('incomplete input produces warnings, not errors', () => {
  const { errors, warnings } = validateInput({ decision: 'Should we expand to Denver?' }, { now });
  assert.equal(errors.length, 0);
  assert.deepEqual(warnings.map((w) => w.field).sort(), ['deadline', 'evidence', 'facts', 'options']);
});

test('past, undated and invalid deadlines warn', () => {
  const base = { decision: 'Should we expand to Denver?' };
  assert.match(validateInput({ ...base, deadline: '2026-01-01' }, { now }).warnings.at(-1).message, /has passed/);
  assert.match(validateInput({ ...base, deadline: 'Q4' }, { now }).warnings.at(-1).message, /YYYY-MM-DD/);
  assert.match(validateInput({ ...base, deadline: '2026-13-01' }, { now }).warnings.at(-1).message, /invalid/);
});

test('a single option and orphan pro/con lines warn', () => {
  const { warnings } = validateInput({ decision: 'Should we expand to Denver?', options: 'Pro: cheap\nExpand: open office' }, { now });
  const msgs = warnings.filter((w) => w.field === 'options').map((w) => w.message).join(' ');
  assert.match(msgs, /Only one option/);
  assert.match(msgs, /ignored/);
});
