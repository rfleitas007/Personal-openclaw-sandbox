// Browser wiring: read the form, run the engine, render the brief, export Markdown.
// All user text is inserted with textContent (never innerHTML).

import { generateBrief } from './engine/generate.js';
import { briefToMarkdown } from './engine/markdown.js';
import { FIELDS } from './engine/validate.js';
import { SAMPLE_INPUT } from './engine/sample.js';

const $ = (id) => document.getElementById(id);
const form = $('brief-form');
const out = $('brief');
const status = $('status');
let markdown = '';

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const TAG_HELP = {
  FACT: 'Supplied by you as fact',
  JUDGMENT: 'Your assessment. Not verified',
  ASSUMPTION: 'Unverified premise',
  INFERENCE: 'Derived by this tool',
  MISSING: 'Information gap',
};

const chip = (tag) => h('span', { class: `tag tag-${tag.toLowerCase()}`, title: TAG_HELP[tag] }, tag);

function itemList(items, { ordered = false, empty = 'None identified.' } = {}) {
  if (!items.length) return h('p', { class: 'none' }, empty);
  return h(ordered ? 'ol' : 'ul', { class: 'items' }, items.map((it) =>
    h('li', { class: `item item-${it.tag.toLowerCase()}` },
      chip(it.tag),
      h('span', { class: 'item-body' },
        h('span', { class: 'item-text' }, it.text),
        it.basis ? h('span', { class: 'basis' }, it.basis) : null))));
}

const section = (n, title, ...body) =>
  h('section', { class: 'brief-section', id: `s${n}` }, h('h3', {}, h('span', { class: 'num' }, String(n).padStart(2, '0')), title), ...body);

function renderBrief(brief, warnings) {
  const c = brief.confidence;
  const level = c.level.toLowerCase();

  const header = h('header', { class: 'brief-header' },
    h('p', { class: 'eyebrow' }, 'Decision'),
    h('p', { class: 'decision' }, brief.decision),
    h('dl', { class: 'meta' },
      h('div', {}, h('dt', {}, 'Horizon'), h('dd', {}, brief.horizon.text || 'Not stated')),
      brief.horizon.daysRemaining !== null ? h('div', {}, h('dt', {}, 'Days remaining'), h('dd', {}, String(brief.horizon.daysRemaining))) : null,
      h('div', {}, h('dt', {}, 'Generated'), h('dd', {}, brief.generatedOn))));

  const legend = h('div', { class: 'legend', 'aria-label': 'Tag legend' },
    Object.keys(TAG_HELP).map((t) => h('span', { class: 'legend-item' }, chip(t), TAG_HELP[t])));

  const warn = warnings.length
    ? h('aside', { class: 'warnings' }, h('strong', {}, 'Input notes'), h('ul', {}, warnings.map((w) => h('li', {}, w.message))))
    : null;

  const bottom = section(1, 'Executive bottom line',
    h('div', { class: `verdict verdict-${level}` },
      h('span', { class: 'verdict-label' }, brief.readiness),
      h('span', { class: 'verdict-conf' }, `Evidence confidence: ${c.level} · ${c.score}/100${c.capped ? ' (capped)' : ''}`)),
    itemList(brief.bottomLine));

  const facts = section(2, 'Known facts',
    itemList(brief.facts, { empty: 'No supplied facts.' }),
    brief.reclassified ? h('p', { class: 'callout' }, `${brief.reclassified} item${brief.reclassified === 1 ? ' was' : 's were'} submitted as fact but contained hedged language. Moved to Assumptions.`) : null,
    brief.constraints.length ? [h('h4', {}, 'Constraints (supplied)'), itemList(brief.constraints)] : null);

  const options = section(5, 'Options: benefits and drawbacks',
    h('div', { class: 'options' }, brief.options.map((o, i) =>
      h('article', { class: `option${o.origin === 'inferred' ? ' option-inferred' : ''}` },
        h('header', {},
          h('h4', {}, `${String.fromCharCode(65 + i)}. ${o.name}`),
          h('span', { class: `rev rev-${o.reversibility.level.toLowerCase()}`, title: o.reversibility.basis }, `Reversibility: ${o.reversibility.level}`)),
        h('p', { class: 'option-desc' }, o.description, o.origin === 'inferred' ? h('em', {}, ' (added by tool as baseline)') : null),
        h('div', { class: 'procon' },
          h('div', {}, h('h5', {}, 'Benefits'), itemList(o.pros)),
          h('div', {}, h('h5', {}, 'Drawbacks'), itemList(o.cons))),
        o.related.length ? h('details', {}, h('summary', {}, `Links to facts and constraints (${o.related.length})`), itemList(o.related)) : null))));

  const rev = section(7, 'Reversibility',
    itemList([brief.reversibility.summary]),
    h('table', { class: 'rev-table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Option'), h('th', {}, 'Reversibility'), h('th', {}, 'Basis'))),
      h('tbody', {}, brief.reversibility.perOption.map((r) =>
        h('tr', {}, h('td', {}, r.name), h('td', {}, h('span', { class: `rev rev-${r.level.toLowerCase()}` }, r.level)), h('td', { class: 'basis' }, r.basis))))));

  const conf = section(10, 'Confidence assessment',
    h('p', {}, h('strong', {}, `${c.level} (${c.score}/100). `), c.note),
    h('ul', { class: 'factors' }, c.factors.map((f) =>
      h('li', { class: f.delta > 0 ? 'pos' : f.delta < 0 ? 'neg' : 'zero' }, h('span', { class: 'delta' }, `${f.delta > 0 ? '+' : f.delta < 0 ? '−' : '±'}${Math.abs(f.delta)}`), f.text))),
    c.caps.map((cap) => h('p', { class: 'callout' }, cap)));

  const evidence = brief.evidence.length
    ? h('section', { class: 'brief-section' }, h('h3', {}, 'Evidence register'),
      h('dl', { class: 'evidence' }, brief.evidence.flatMap((e) => [h('dt', {}, e.id), h('dd', {}, e.text)])))
    : null;

  const parts = [
    header, legend, warn, bottom, facts,
    section(3, 'Assumptions', itemList(brief.assumptions)),
    section(4, 'Important unknowns', itemList(brief.unknowns)),
    options,
    section(6, 'Key risks', itemList(brief.risks)),
    rev,
    section(8, 'Information that would most improve the decision', itemList(brief.infoNeeds, { ordered: true })),
    section(9, 'Recommended next actions', itemList(brief.nextActions, { ordered: true })),
    conf, evidence,
  ];
  out.replaceChildren(...parts.filter(Boolean)); // replaceChildren would render null as text
}

function readForm() {
  return Object.fromEntries(FIELDS.map((f) => [f.key, $(f.key).value]));
}

function showErrors(errors) {
  for (const f of FIELDS) {
    $(`${f.key}-error`).textContent = '';
    $(f.key).removeAttribute('aria-invalid');
  }
  for (const e of errors) {
    $(`${e.field}-error`).textContent = e.message;
    $(e.field).setAttribute('aria-invalid', 'true');
  }
  if (errors.length) $(errors[0].field).focus();
}

function setExportEnabled(on) {
  $('copy').disabled = !on;
  $('download').disabled = !on;
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const result = generateBrief(readForm());
  showErrors(result.ok ? [] : result.errors);
  if (!result.ok) {
    status.textContent = 'Fix the highlighted fields to generate a brief.';
    return;
  }
  renderBrief(result.brief, result.warnings);
  markdown = briefToMarkdown(result.brief);
  setExportEnabled(true);
  status.textContent = 'Brief generated.';
  if (window.matchMedia('(max-width: 960px)').matches) out.scrollIntoView({ behavior: 'smooth' });
});

$('load-sample').addEventListener('click', () => {
  for (const f of FIELDS) $(f.key).value = SAMPLE_INPUT[f.key];
  form.requestSubmit();
});

$('clear').addEventListener('click', () => {
  form.reset();
  showErrors([]);
  markdown = '';
  setExportEnabled(false);
  status.textContent = '';
  out.replaceChildren(h('div', { class: 'empty' }, h('p', {}, 'Form cleared.')));
});

$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(markdown);
    status.textContent = 'Markdown copied to clipboard.';
  } catch {
    // Fallback for browsers that block the async clipboard API (e.g. non-secure contexts).
    const ta = h('textarea', { class: 'offscreen', readonly: '' });
    ta.value = markdown;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    status.textContent = ok ? 'Markdown copied to clipboard.' : 'Copy failed. Use Export .md instead.';
  }
});

$('download').addEventListener('click', () => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `decision-brief-${new Date().toISOString().slice(0, 10)}.md` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status.textContent = 'Markdown file exported.';
});
