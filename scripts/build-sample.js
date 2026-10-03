// Regenerates examples/sample-brief.md from the built-in sample input.
// Run with: npm run sample
import { writeFile } from 'node:fs/promises';
import { generateBrief } from '../public/engine/generate.js';
import { briefToMarkdown } from '../public/engine/markdown.js';
import { SAMPLE_INPUT, SAMPLE_NOW } from '../public/engine/sample.js';

const result = generateBrief(SAMPLE_INPUT, { now: new Date(`${SAMPLE_NOW}T12:00:00Z`) });
if (!result.ok) {
  console.error(result.errors);
  process.exit(1);
}
const target = new URL('../examples/sample-brief.md', import.meta.url);
await writeFile(target, briefToMarkdown(result.brief));
console.log(`Wrote ${target.pathname}`);
