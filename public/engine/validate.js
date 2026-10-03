// Input validation. Errors block generation; warnings are shown alongside the brief.

import { parseDeadline, parseOptions, orphanAnnotations, splitItems } from './parse.js';

export const FIELDS = [
  { key: 'decision', label: 'Decision / question', required: true, max: 500 },
  { key: 'context', label: 'Context', max: 5000 },
  { key: 'facts', label: 'Known facts', max: 5000 },
  { key: 'constraints', label: 'Constraints', max: 3000 },
  { key: 'options', label: 'Options under consideration', max: 5000 },
  { key: 'evidence', label: 'Evidence / source notes', max: 5000 },
  { key: 'deadline', label: 'Deadline / decision horizon', max: 200 },
];

const MAX_ITEMS = 60;

/** Normalise raw input (any shape) into trimmed strings and report problems. */
export function validateInput(raw, { now = new Date() } = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const input = {};
  const errors = [];
  const warnings = [];

  for (const f of FIELDS) {
    const v = src[f.key];
    input[f.key] = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
    if (input[f.key].length > f.max) {
      errors.push({ field: f.key, message: `${f.label} is too long (${input[f.key].length} of ${f.max} characters max).` });
    }
    if (splitItems(input[f.key]).length > MAX_ITEMS) {
      errors.push({ field: f.key, message: `${f.label} has more than ${MAX_ITEMS} lines. Condense it to what matters most for the decision.` });
    }
  }

  if (!input.decision) {
    errors.push({ field: 'decision', message: 'State the decision or question being decided.' });
  } else if (input.decision.length < 10) {
    errors.push({ field: 'decision', message: 'The decision is too short to analyse. Write it as a full question.' });
  }

  if (!input.facts) warnings.push({ field: 'facts', message: 'No known facts supplied. The brief will rest entirely on assumptions.' });
  if (!input.evidence) warnings.push({ field: 'evidence', message: 'No evidence or source notes supplied. Facts cannot be traced to sources.' });

  const options = parseOptions(input.options);
  if (options.length === 0) {
    warnings.push({ field: 'options', message: 'No options supplied. The brief will only add a status-quo baseline.' });
  } else if (options.length === 1) {
    warnings.push({ field: 'options', message: 'Only one option supplied. A single option is a proposal, not a decision.' });
  }
  if (orphanAnnotations(input.options) > 0) {
    warnings.push({ field: 'options', message: 'Pro/Con lines before the first option were ignored. Put each option name on its own line first.' });
  }

  if (!input.deadline) {
    warnings.push({ field: 'deadline', message: 'No deadline or decision horizon given. Urgency cannot be assessed.' });
  } else {
    const d = parseDeadline(input.deadline, now);
    if (d.invalid) {
      warnings.push({ field: 'deadline', message: 'The deadline contains an invalid calendar date.' });
    } else if (d.daysRemaining !== null && d.daysRemaining < 0) {
      warnings.push({ field: 'deadline', message: `The deadline (${d.date}) has passed.` });
    } else if (d.date === null) {
      warnings.push({ field: 'deadline', message: 'Add the deadline as a YYYY-MM-DD date so days remaining can be calculated.' });
    }
  }

  return { input, errors, warnings };
}
