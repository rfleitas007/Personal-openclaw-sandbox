// Render a generated brief object as Markdown. The same tags shown in the browser are kept,
// so the epistemic status of each line survives copy/paste.

const esc = (s) => String(s).replace(/([\\`*_<>])/g, '\\$1').replace(/\s*\n\s*/g, ' ');

const line = (it) => `- **[${it.tag}]** ${esc(it.text)}${it.basis ? ` _(${esc(it.basis)})_` : ''}`;
const list = (items, empty = '_None identified._') => (items.length ? items.map(line).join('\n') : empty);

export function briefToMarkdown(brief) {
  const out = [];
  out.push('# Decision Brief');
  out.push('');
  out.push(`**Decision:** ${esc(brief.decision)}  `);
  out.push(`**Horizon:** ${brief.horizon.text ? esc(brief.horizon.text) : '_Not stated_'}  `);
  out.push(`**Generated:** ${brief.generatedOn} · PAII Decision Brief Generator (sandbox prototype, rule-based)`);
  out.push('');
  out.push('> Tags: **FACT** supplied by user · **JUDGMENT** user assessment, not verified · **ASSUMPTION** unverified premise · **INFERENCE** derived by this tool · **MISSING** information gap');
  out.push('');

  out.push('## 1. Executive bottom line');
  out.push(`**${brief.readiness}** · Evidence confidence: **${brief.confidence.level}** (${brief.confidence.score}/100${brief.confidence.capped ? ', capped' : ''})`);
  out.push('');
  out.push(list(brief.bottomLine));
  out.push('');

  out.push('## 2. Known facts');
  out.push(list(brief.facts, '_No supplied facts._'));
  if (brief.reclassified) {
    out.push('');
    out.push(`> ${brief.reclassified} item${brief.reclassified === 1 ? ' was' : 's were'} submitted as fact but contained hedged language. Moved to Assumptions.`);
  }
  if (brief.constraints.length) {
    out.push('');
    out.push('**Constraints (supplied)**');
    out.push('');
    out.push(list(brief.constraints));
  }
  out.push('');

  out.push('## 3. Assumptions');
  out.push(list(brief.assumptions));
  out.push('');

  out.push('## 4. Important unknowns');
  out.push(list(brief.unknowns));
  out.push('');

  out.push('## 5. Options: benefits and drawbacks');
  brief.options.forEach((o, i) => {
    out.push('');
    out.push(`### ${String.fromCharCode(65 + i)}. ${esc(o.name)}${o.origin === 'inferred' ? ' _(added by tool as baseline)_' : ''}`);
    out.push(esc(o.description));
    out.push('');
    out.push(`*Reversibility:* **${o.reversibility.level}** [INFERENCE] _(${esc(o.reversibility.basis)})_`);
    out.push('');
    out.push('**Benefits**');
    out.push('');
    out.push(list(o.pros));
    out.push('');
    out.push('**Drawbacks**');
    out.push('');
    out.push(list(o.cons));
    if (o.related.length) {
      out.push('');
      out.push('**Links to facts and constraints**');
      out.push('');
      out.push(list(o.related));
    }
  });
  out.push('');

  out.push('## 6. Key risks');
  out.push(list(brief.risks));
  out.push('');

  out.push('## 7. Reversibility');
  out.push(line(brief.reversibility.summary));
  for (const r of brief.reversibility.perOption) out.push(`- ${esc(r.name)}: **${r.level}**`);
  out.push('');

  out.push('## 8. Information that would most improve the decision');
  out.push(brief.infoNeeds.map((it, i) => `${i + 1}. ${line(it).slice(2)}`).join('\n'));
  out.push('');

  out.push('## 9. Recommended next actions');
  out.push(brief.nextActions.map((it, i) => `${i + 1}. ${line(it).slice(2)}`).join('\n'));
  out.push('');

  out.push('## 10. Confidence assessment');
  out.push(`**${brief.confidence.level}** (${brief.confidence.score}/100). ${esc(brief.confidence.note)}`);
  out.push('');
  for (const f of brief.confidence.factors) out.push(`- ${f.delta >= 0 ? '+' : '−'}${Math.abs(f.delta)} · ${esc(f.text)}`);
  for (const c of brief.confidence.caps) out.push(`- ${esc(c)}`);
  out.push('');

  if (brief.evidence.length) {
    out.push('## Evidence register');
    for (const e of brief.evidence) out.push(`- **${e.id}**: ${esc(e.text)}`);
    out.push('');
  }

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
