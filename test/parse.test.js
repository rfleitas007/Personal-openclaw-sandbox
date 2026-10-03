import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitItems, hedgeMatch, isOpenQuestion, parseEvidence, findRefs, stripRefs, parseOptions, parseDeadline, orphanAnnotations,
} from '../public/engine/parse.js';

test('splitItems strips bullets and blank lines', () => {
  assert.deepEqual(splitItems('- a\n\n* b\n 1. c\n•  d\n'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(splitItems(undefined), []);
});

test('hedgeMatch detects hedged language but not the month of May', () => {
  assert.equal(hedgeMatch('Revenue will probably fall'), 'probably');
  assert.equal(hedgeMatch('We expect churn to rise'), 'expect');
  assert.equal(hedgeMatch('The board may object'), 'may');
  assert.equal(hedgeMatch('Contract ends May 31'), null);
  assert.equal(hedgeMatch('Revenue fell 4% in Q3'), null);
});

test('isOpenQuestion flags questions and TBD markers', () => {
  assert.ok(isOpenQuestion('Has legal reviewed it?'));
  assert.ok(isOpenQuestion('Budget owner TBD'));
  assert.ok(!isOpenQuestion('Budget is $40k'));
});

test('parseEvidence keeps explicit IDs and fills gaps without collisions', () => {
  const ev = parseEvidence('E2: Logs\nVendor quote\n[E1] Contract');
  assert.deepEqual(ev.map((e) => e.id), ['E2', 'E3', 'E1']);
  assert.equal(ev[0].text, 'Logs');
});

test('findRefs and stripRefs handle single and grouped citations', () => {
  assert.deepEqual(findRefs('Cost is $5 [E1] and rising [E2, e3]'), ['E1', 'E2', 'E3']);
  assert.equal(stripRefs('Cost is $5 [E1]'), 'Cost is $5');
});

test('parseOptions attaches Pro/Con lines to the preceding option', () => {
  const opts = parseOptions('Build: Build in-house\nPro: Control\n+ IP ownership\nCon: Slow\nBuy a vendor tool\nCon: Lock-in');
  assert.equal(opts.length, 2);
  assert.deepEqual(opts[0], { name: 'Build', description: 'Build in-house', pros: ['Control', 'IP ownership'], cons: ['Slow'] });
  assert.equal(opts[1].name, 'Buy a vendor tool');
  assert.deepEqual(opts[1].cons, ['Lock-in']);
});

test('orphanAnnotations counts pro/con lines before any option', () => {
  assert.equal(orphanAnnotations('Pro: x\nCon: y\nA: b'), 2);
  assert.equal(orphanAnnotations('A: b\nPro: x'), 0);
});

test('parseDeadline computes days remaining and rejects impossible dates', () => {
  const now = new Date('2026-10-03T23:30:00Z');
  assert.equal(parseDeadline('2026-10-13 board meeting', now).daysRemaining, 10);
  assert.equal(parseDeadline('end of quarter', now).date, null);
  assert.equal(parseDeadline('2026-02-30', now).invalid, true);
});
