// Decision brief generator. Deterministic and rule-based: it restructures and audits what the
// user supplied. It does not invent facts. Every output item carries an epistemic tag.

import {
  splitItems, splitSentences, hedgeMatch, isOpenQuestion, hasNumber, parseEvidence, findRefs,
  stripRefs, parseOptions, parseDeadline, addDays, overlap,
} from './parse.js';
import { validateInput } from './validate.js';

export const TAGS = {
  FACT: 'FACT', // supplied by the user as fact and not hedged
  JUDGMENT: 'JUDGMENT', // user's evaluative claim (pros/cons); not verified
  ASSUMPTION: 'ASSUMPTION', // stated, reclassified, or implicit belief that has not been verified
  INFERENCE: 'INFERENCE', // derived by this tool from the inputs
  MISSING: 'MISSING', // information that is absent or explicitly unresolved
};

const item = (tag, text, basis = '') => ({ tag, text, basis });

const LOW_REVERSIBILITY = /\b(sign(?:ing)?|commit(?:ment)?|acquir\w*|acquisition|purchas\w*|buy(?:ing)?|terminat\w*|lay ?offs?|divest\w*|sell(?:ing)?|clos(?:e|ing|ure)|shut\w*|migrat\w*|replac\w*|exclusive|merg\w*|build(?:ing)?|launch\w*|hire|hiring|fire|eliminat\w*|decommission\w*|multi-year|\d+[- ]years?)\b/gi;
const HIGH_REVERSIBILITY = /\b(pilot\w*|trial\w*|test(?:ing)?|experiment\w*|defer\w*|delay\w*|wait|postpon\w*|extension|extend|short-term|month-to-month|phased?|interim|temporar\w*|prototype|explor\w*|evaluat\w*|status quo|do nothing|maintain|lease|reversible|opt-out)\b/gi;
const STATUS_QUO = /\b(status quo|do nothing|no change|defer|postpone|wait|maintain|keep (?:the )?current|continue as is)\b/i;

function cues(text, re) {
  return [...new Set((String(text).match(re) ?? []).map((s) => s.toLowerCase()))];
}

function assessReversibility(text) {
  const low = cues(text, LOW_REVERSIBILITY);
  const high = cues(text, HIGH_REVERSIBILITY);
  let level;
  if (!low.length && !high.length) level = 'Unclear';
  else if (high.length > low.length) level = 'High';
  else if (low.length > high.length) level = 'Low';
  else level = 'Mixed';
  const parts = [];
  if (low.length) parts.push(`commitment cues: ${low.join(', ')}`);
  if (high.length) parts.push(`flexibility cues: ${high.join(', ')}`);
  return {
    level,
    basis: parts.length ? `Keyword heuristic (${parts.join('; ')}). Verify exit terms.` : 'No reversibility cues in the option text. Exit terms unknown.',
  };
}

// Shorten text for quoting inside another sentence (drops a trailing full stop).
const truncate = (text, n = 90) => {
  const s = text.replace(/\.$/, '');
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};

export function generateBrief(rawInput, { now = new Date() } = {}) {
  const { input, errors, warnings } = validateInput(rawInput, { now });
  if (errors.length) return { ok: false, errors, warnings };

  // ---- Evidence --------------------------------------------------------------------------
  const evidence = parseEvidence(input.evidence);
  const evidenceIds = new Set(evidence.map((e) => e.id));

  // ---- Facts vs. assumptions ---------------------------------------------------------------
  const facts = [];
  const assumptions = [];
  const unknowns = [];
  let reclassified = 0;
  let sourcedFacts = 0;
  const brokenRefs = new Set();

  for (const raw of splitItems(input.facts)) {
    const refs = findRefs(raw);
    const valid = refs.filter((r) => evidenceIds.has(r));
    refs.filter((r) => !evidenceIds.has(r)).forEach((r) => brokenRefs.add(r));
    const text = stripRefs(raw);
    const hedge = hedgeMatch(text);
    if (isOpenQuestion(text)) {
      unknowns.push(item(TAGS.MISSING, text, 'Listed under Known facts but phrased as an open question.'));
    } else if (hedge) {
      reclassified++;
      assumptions.push(item(TAGS.ASSUMPTION, text,
        `Moved from Known facts: contains hedged language ("${hedge}"). Treat as unverified until confirmed.`));
    } else {
      if (valid.length) sourcedFacts++;
      facts.push({ ...item(TAGS.FACT, text, valid.length ? `Source: ${valid.join(', ')}` : 'Supplied by user. No source cited.'), refs: valid });
    }
  }

  for (const s of splitSentences(input.context)) {
    if (isOpenQuestion(s)) unknowns.push(item(TAGS.MISSING, s, 'Open question in Context.'));
    else if (hedgeMatch(s)) assumptions.push(item(TAGS.ASSUMPTION, s, `Stated in Context with hedged language ("${hedgeMatch(s)}").`));
  }

  const constraints = [];
  for (const c of splitItems(input.constraints)) {
    if (isOpenQuestion(c)) unknowns.push(item(TAGS.MISSING, c, 'Constraint is unresolved.'));
    else if (hedgeMatch(c)) assumptions.push(item(TAGS.ASSUMPTION, c, `Constraint stated with hedged language ("${hedgeMatch(c)}"). Confirm it is binding.`));
    else constraints.push(item(TAGS.FACT, c, 'Supplied constraint.'));
  }
  const statedAssumptions = assumptions.length;

  // Implicit assumptions every brief rests on. They are surfaced, not hidden.
  const parsedOptions = parseOptions(input.options);
  if (parsedOptions.length) {
    assumptions.push(item(TAGS.ASSUMPTION, 'The options listed are the full set of feasible alternatives.', 'Implicit. Inferred by tool; confirm no option is missing.'));
  }
  if (facts.length) {
    assumptions.push(item(TAGS.ASSUMPTION, 'The supplied facts are current as of the decision date.', 'Implicit. Inferred by tool.'));
  }
  const deadline = parseDeadline(input.deadline, now);
  if (deadline.text) {
    assumptions.push(item(TAGS.ASSUMPTION, `The stated horizon ("${truncate(deadline.text, 60)}") is firm and not negotiable.`, 'Implicit. Inferred by tool.'));
  }

  // ---- Options -----------------------------------------------------------------------------
  const options = parsedOptions.map((o) => ({ ...o, origin: 'supplied' }));
  if (!options.some((o) => STATUS_QUO.test(`${o.name} ${o.description}`))) {
    options.push({
      name: 'Status quo / defer',
      description: 'Take no new action now and revisit later. Added as a comparison baseline.',
      pros: [], cons: [], origin: 'inferred',
    });
  }

  const optionViews = options.map((o) => {
    const fullText = [o.name, o.description, ...o.pros, ...o.cons].join(' ');
    // Reversibility reads only the option itself: pros/cons often mention commitments in the negative.
    const reversibility = assessReversibility(`${o.name} ${o.description}`);
    const related = [];
    for (const c of constraints) {
      if (overlap(fullText, c.text) >= 2) related.push(item(TAGS.INFERENCE, `Touches constraint: "${truncate(c.text)}"`, 'Lexical match between option and constraint. Check compliance explicitly.'));
    }
    for (const f of facts) {
      if (overlap(fullText, f.text) >= 3) related.push(item(TAGS.INFERENCE, `Bears on fact: "${truncate(f.text)}"`, 'Lexical match between option and fact.'));
    }
    const pros = o.pros.map((p) => item(TAGS.JUDGMENT, p, 'Supplied by user. Not independently verified.'));
    const cons = o.cons.map((c) => item(TAGS.JUDGMENT, c, 'Supplied by user. Not independently verified.'));
    if (!pros.length) pros.push(item(TAGS.MISSING, 'No benefits supplied.', o.origin === 'inferred' ? 'Baseline added by tool. Define what staying put preserves.' : 'Add "Pro:" lines under this option.'));
    if (!cons.length) cons.push(item(TAGS.MISSING, 'No drawbacks supplied.', o.origin === 'inferred' ? 'Baseline added by tool. Define the cost of delay.' : 'Add "Con:" lines under this option.'));
    return {
      name: o.name,
      description: o.description,
      origin: o.origin,
      tag: o.origin === 'inferred' ? TAGS.INFERENCE : TAGS.JUDGMENT,
      pros, cons, related, reversibility,
      score: o.pros.length - o.cons.length,
      complete: o.pros.length > 0 && o.cons.length > 0,
    };
  });
  const supplied = optionViews.filter((o) => o.origin === 'supplied');

  // ---- Unknowns ----------------------------------------------------------------------------
  const emptyField = (key, label, why) => { if (!input[key]) unknowns.push(item(TAGS.MISSING, `No ${label} supplied.`, why)); };
  // Ordered by how much each gap weakens the brief; the first ones surface as top information needs.
  emptyField('facts', 'known facts', 'Nothing in this brief is grounded in a supplied fact.');
  emptyField('options', 'options', 'Alternatives have not been defined.');
  emptyField('evidence', 'evidence or source notes', 'Facts cannot be traced to sources.');
  emptyField('constraints', 'constraints', 'Budget, legal, policy and timing limits are unknown. Options cannot be screened.');
  emptyField('deadline', 'deadline', 'Urgency and the cost of delay are unknown.');
  emptyField('context', 'context', 'Stakeholders, history and why the decision is needed now are unknown.');
  for (const s of splitItems(input.options).filter(isOpenQuestion)) unknowns.push(item(TAGS.MISSING, s, 'Open question in Options.'));
  for (const e of evidence.filter((e) => isOpenQuestion(e.text))) unknowns.push(item(TAGS.MISSING, e.text, `Evidence note ${e.id} is unresolved.`));
  if (facts.length && !facts.some((f) => hasNumber(f.text))) {
    unknowns.push(item(TAGS.MISSING, 'No quantitative facts (costs, volumes, dates, rates).', 'Every supplied fact is qualitative. Magnitudes cannot be compared.'));
  }
  if (brokenRefs.size) {
    unknowns.push(item(TAGS.MISSING, `Citations with no matching evidence note: ${[...brokenRefs].join(', ')}.`, 'Add the missing evidence entries or correct the citation.'));
  }
  for (const o of supplied.filter((o) => !o.complete)) {
    unknowns.push(item(TAGS.MISSING, `Incomplete trade-off analysis for "${o.name}".`, 'Benefits or drawbacks have not been supplied.'));
  }

  // ---- Confidence (in the evidence base, not in any option) ---------------------------------
  const factors = [];
  let score = 0;
  const add = (delta, text) => { score += delta; factors.push({ delta, text }); };
  add(facts.length >= 3 ? 20 : facts.length ? 10 : 0, `${facts.length} supplied fact${facts.length === 1 ? '' : 's'} retained`);
  const sourcedRatio = facts.length ? sourcedFacts / facts.length : 0;
  add(Math.round(20 * sourcedRatio), `${sourcedFacts} of ${facts.length} facts cite an evidence note`);
  add(evidence.length ? 10 : 0, evidence.length ? `${evidence.length} evidence note${evidence.length === 1 ? '' : 's'} supplied` : 'No evidence notes');
  add(supplied.length >= 2 ? 15 : supplied.length === 1 ? 5 : 0, `${supplied.length} option${supplied.length === 1 ? '' : 's'} supplied`);
  const complete = supplied.filter((o) => o.complete).length;
  add(supplied.length && complete === supplied.length ? 10 : complete ? 5 : 0, `${complete} of ${supplied.length} options have both benefits and drawbacks`);
  add(statedAssumptions <= 2 ? 10 : statedAssumptions <= 5 ? 5 : 0, `${statedAssumptions} stated or reclassified assumption${statedAssumptions === 1 ? '' : 's'}`);
  add(facts.some((f) => hasNumber(f.text)) ? 10 : 0, facts.some((f) => hasNumber(f.text)) ? 'Quantitative facts present' : 'No quantitative facts');
  add(deadline.date ? 5 : deadline.text ? 2 : 0, deadline.date ? 'Dated deadline' : deadline.text ? 'Deadline stated without a date' : 'No deadline');
  if (reclassified) add(-5 * Math.min(reclassified, 3), `${reclassified} item${reclassified === 1 ? '' : 's'} submitted as fact contained hedged language`);
  const openCount = unknowns.filter((u) => /Open question|unresolved|phrased as an open question/.test(u.basis)).length;
  if (openCount) add(-3 * Math.min(openCount, 5), `${openCount} open question${openCount === 1 ? '' : 's'} in the inputs`);
  score = Math.max(0, Math.min(100, score));

  let level = score >= 75 ? 'High' : score >= 45 ? 'Moderate' : 'Low';
  const caps = [];
  if (level === 'High' && reclassified) caps.push('items submitted as fact were actually assumptions');
  if (level === 'High' && sourcedRatio < 1) caps.push('not every fact is sourced');
  if (caps.length) level = 'Moderate';
  const confidence = {
    level, score, factors, capped: caps.length > 0,
    caps: caps.map((c) => `Capped at Moderate: ${c}.`),
    note: 'Measures how complete and traceable the supplied evidence is. It does not measure whether any option is correct.',
  };

  // ---- Risks -------------------------------------------------------------------------------
  const risks = [];
  if (deadline.daysRemaining !== null && deadline.daysRemaining >= 0 && deadline.daysRemaining <= 14) {
    risks.push(item(TAGS.INFERENCE, `Compressed horizon: ${deadline.daysRemaining} day${deadline.daysRemaining === 1 ? '' : 's'} to deadline.`, 'Little time to close evidence gaps. Favour reversible moves.'));
  }
  if (deadline.daysRemaining !== null && deadline.daysRemaining < 0) {
    risks.push(item(TAGS.INFERENCE, 'The stated deadline has passed. Defaults may already be in effect.', `Deadline ${deadline.date}.`));
  }
  for (const o of optionViews.filter((o) => o.reversibility.level === 'Low')) {
    risks.push(item(TAGS.INFERENCE, `One-way-door exposure: "${o.name}" looks hard to reverse.`, o.reversibility.basis));
  }
  for (const a of assumptions.filter((a) => !a.basis.startsWith('Implicit')).slice(0, 3)) {
    risks.push(item(TAGS.INFERENCE, `If this assumption is wrong, the analysis shifts: "${truncate(a.text)}"`, 'Unverified premise.'));
  }
  const unsourced = facts.length - sourcedFacts;
  if (unsourced > 0) {
    risks.push(item(TAGS.INFERENCE, `${unsourced} supplied fact${unsourced === 1 ? ' has' : 's have'} no cited source.`, 'Unsourced facts cannot be audited or challenged.'));
  }
  const constraintTouches = optionViews.reduce((n, o) => n + o.related.filter((r) => r.text.startsWith('Touches constraint')).length, 0);
  if (constraintTouches) {
    risks.push(item(TAGS.INFERENCE, `${constraintTouches} option-constraint interaction${constraintTouches === 1 ? '' : 's'} need an explicit compliance check.`, 'See each option\'s analysis.'));
  }
  if (!input.constraints) {
    risks.push(item(TAGS.INFERENCE, 'No constraints were stated, so options have not been screened for feasibility.', 'An option may fail a budget, legal or policy test.'));
  }
  if (!risks.length) risks.push(item(TAGS.MISSING, 'No risks could be derived from the inputs.', 'Add constraints, assumptions and option drawbacks.'));

  // ---- Reversibility summary -----------------------------------------------------------------
  const levels = optionViews.map((o) => o.reversibility.level);
  let reversibilitySummary;
  if (supplied.length && supplied.every((o) => o.reversibility.level === 'Low')) {
    reversibilitySummary = 'Every supplied option looks hard to reverse. Treat this as a one-way-door decision and raise the evidence bar.';
  } else if (levels.includes('Low') && levels.includes('High')) {
    reversibilitySummary = 'Options differ in reversibility. A reversible option can buy time to close evidence gaps before a one-way commitment.';
  } else if (levels.every((l) => l === 'High')) {
    reversibilitySummary = 'All options appear reversible. Bias toward acting and learning, not more analysis.';
  } else {
    reversibilitySummary = 'Reversibility is unclear for at least one option. Confirm exit terms, notice periods and switching costs.';
  }

  // ---- Information that would most improve the decision ---------------------------------------
  const infoNeeds = [];
  const loadBearing = assumptions
    .filter((a) => !a.basis.startsWith('Implicit'))
    .map((a) => ({ a, weight: supplied.reduce((n, o) => n + (overlap(`${o.name} ${o.description} ${o.pros.map((p) => p.text).join(' ')} ${o.cons.map((c) => c.text).join(' ')}`, a.text) >= 1 ? 1 : 0), 0) }))
    .sort((x, y) => y.weight - x.weight);
  for (const { a, weight } of loadBearing.slice(0, 3)) {
    infoNeeds.push(item(TAGS.INFERENCE, `Verify: "${truncate(a.text)}"`, weight ? `Shares terms with ${weight} option${weight === 1 ? '' : 's'}, so it may shift the comparison.` : 'Unverified premise.'));
  }
  if (unsourced > 0) infoNeeds.push(item(TAGS.INFERENCE, `Obtain sources for the ${unsourced} unsourced fact${unsourced === 1 ? '' : 's'}.`, 'Makes the fact base auditable.'));
  for (const u of unknowns.filter((u) => !u.text.startsWith('No ')).slice(0, 3)) {
    infoNeeds.push(item(TAGS.INFERENCE, `Resolve: "${truncate(u.text)}"`, u.basis));
  }
  for (const u of unknowns.filter((u) => u.text.startsWith('No ')).slice(0, 2)) {
    infoNeeds.push(item(TAGS.INFERENCE, u.text.replace(/^No (.+) supplied\.$/, 'Supply $1.'), u.basis));
  }
  if (!infoNeeds.length) infoNeeds.push(item(TAGS.INFERENCE, 'No major gaps detected in the supplied inputs.', 'Stress-test the facts with someone who disagrees.'));
  const topInfoNeeds = infoNeeds.slice(0, 6);

  // ---- Provisional lean & bottom line ------------------------------------------------------
  const readiness = {
    Low: 'Not decision-ready',
    Moderate: 'Conditionally ready',
    High: 'Decision-ready on the supplied evidence',
  }[level];

  let lean = null;
  const scorable = supplied.filter((o) => o.complete);
  if (level !== 'Low' && scorable.length >= 2) {
    const rank = (o) => o.score + ({ High: 0.5, Mixed: 0.1, Unclear: 0, Low: -0.25 }[o.reversibility.level]);
    const sorted = [...scorable].sort((x, y) => rank(y) - rank(x));
    if (rank(sorted[0]) > rank(sorted[1])) {
      lean = item(TAGS.INFERENCE, `Provisional lean: ${sorted[0].name}.`,
        `Most favourable balance of supplied benefits to drawbacks (${sorted[0].pros.length}:${sorted[0].cons.length}), with reversibility used as the tie-breaker (${sorted[0].reversibility.level}). Counts are not weighted by importance. Revisit before committing.`);
    }
  }

  const reversibleOption = optionViews.find((o) => o.reversibility.level === 'High');
  const bottomLine = [];
  bottomLine.push(item(TAGS.INFERENCE, `${readiness}. Evidence confidence is ${level.toLowerCase()} (${score}/100${caps.length ? ', capped' : ''}).`, confidence.note));
  if (lean) bottomLine.push(lean);
  else if (level === 'Low') bottomLine.push(item(TAGS.INFERENCE, 'No option is recommended. The evidence base is too thin to separate the options.', 'Close the information gaps below first.'));
  else bottomLine.push(item(TAGS.INFERENCE, 'No option clearly leads on the supplied trade-offs.', 'Benefits and drawbacks are balanced or incomplete. The choice turns on how they are weighted.'));
  if (topInfoNeeds[0]) bottomLine.push(item(TAGS.INFERENCE, `Most valuable next information: ${topInfoNeeds[0].text.replace(/^(Verify|Resolve): /, (m, w) => `${w.toLowerCase()} `)}`, topInfoNeeds[0].basis));
  if (deadline.daysRemaining !== null) {
    bottomLine.push(item(TAGS.FACT, deadline.daysRemaining >= 0 ? `${deadline.daysRemaining} days remain until ${deadline.date}.` : `Deadline ${deadline.date} passed ${-deadline.daysRemaining} days ago.`, 'Calculated from the supplied deadline.'));
  }

  // ---- Next actions --------------------------------------------------------------------------
  const nextActions = [];
  for (const n of topInfoNeeds.slice(0, 3)) {
    const t = n.text.replace(/^(Verify|Resolve): /, '$1 ');
    nextActions.push(item(TAGS.INFERENCE, `${t}${/[.!?]$/.test(t) ? '' : '.'} Assign an owner and a due date.`, n.basis));
  }
  if (reclassified) nextActions.push(item(TAGS.INFERENCE, `Confirm or discard the ${reclassified} item${reclassified === 1 ? '' : 's'} moved from facts to assumptions.`, 'Do not treat them as facts until confirmed.'));
  if (level !== 'High' && reversibleOption && optionViews.some((o) => o.reversibility.level === 'Low')) {
    nextActions.push(item(TAGS.INFERENCE, `Consider staging through "${reversibleOption.name}" while evidence is gathered.`, 'Keeps options open at lower commitment.'));
  }
  if (optionViews.some((o) => o.reversibility.level === 'Low')) {
    nextActions.push(item(TAGS.INFERENCE, 'Before committing to a hard-to-reverse option, write down the conditions that would trigger reversal.', 'Pre-commitment to exit criteria reduces sunk-cost bias.'));
  }
  if (deadline.daysRemaining !== null && deadline.daysRemaining >= 4) {
    nextActions.push(item(TAGS.INFERENCE, `Hold a decision checkpoint by ${addDays(now, Math.floor(deadline.daysRemaining / 2))} (midpoint of the horizon).`, 'Leaves time to act on the decision before the deadline.'));
  }
  nextActions.push(item(TAGS.INFERENCE, 'Record the decision, its rationale and the key assumptions so the outcome can be reviewed later.', 'Supports learning, not just accountability.'));

  return {
    ok: true,
    warnings,
    brief: {
      decision: input.decision,
      context: input.context,
      generatedOn: now.toISOString().slice(0, 10),
      horizon: deadline,
      readiness,
      bottomLine,
      facts,
      constraints,
      reclassified,
      assumptions,
      unknowns,
      options: optionViews,
      risks,
      reversibility: { summary: item(TAGS.INFERENCE, reversibilitySummary, 'Derived from per-option keyword heuristics.'), perOption: optionViews.map((o) => ({ name: o.name, ...o.reversibility })) },
      infoNeeds: topInfoNeeds,
      nextActions,
      confidence,
      evidence,
    },
  };
}
