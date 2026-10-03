import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateBrief } from '../public/engine/generate.js';
import { briefToMarkdown } from '../public/engine/markdown.js';
import { SAMPLE_INPUT, SAMPLE_NOW } from '../public/engine/sample.js';

const now = new Date(`${SAMPLE_NOW}T12:00:00Z`);

test('markdown contains every required section in order', () => {
  const md = briefToMarkdown(generateBrief(SAMPLE_INPUT, { now }).brief);
  const headings = [
    'Executive bottom line', 'Known facts', 'Assumptions', 'Important unknowns', 'Options: benefits and drawbacks',
    'Key risks', 'Reversibility', 'Information that would most improve the decision', 'Recommended next actions',
    'Confidence assessment',
  ];
  let last = -1;
  for (const h of headings) {
    const i = md.indexOf(`. ${h}\n`);
    assert.ok(i > last, `missing or out of order: ${h}`);
    last = i;
  }
});

test('markdown preserves epistemic tags and escapes markup in user text', () => {
  const { brief } = generateBrief({ decision: 'Should we ship *now* or <later>?', facts: 'Bug count is 3' }, { now });
  const md = briefToMarkdown(brief);
  assert.match(md, /\*\*\[FACT\]\*\* Bug count is 3/);
  assert.match(md, /Should we ship \\\*now\\\* or \\<later\\>\?/);
});

test('examples/sample-brief.md is up to date with the engine (run `npm run sample`)', async () => {
  const committed = await readFile(new URL('../examples/sample-brief.md', import.meta.url), 'utf8');
  assert.equal(committed, briefToMarkdown(generateBrief(SAMPLE_INPUT, { now }).brief));
});
