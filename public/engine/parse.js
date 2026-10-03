// Text parsing helpers. Pure functions, no DOM, shared by browser and tests.

const BULLET = /^\s*(?:[-*•▪◦]|\d+[.)])\s+/;

/** Split a multi-line field into trimmed items, stripping list bullets. */
export function splitItems(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, '').trim())
    .filter(Boolean);
}

/** Split free text into sentences (used for the Context field). */
export function splitSentences(text) {
  return splitItems(text)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Words that signal a claim is an expectation or belief rather than an observed fact.
// "may" is excluded when followed by a number (the month, e.g. "May 2027").
const HEDGE = /\b(probably|likely|unlikely|possibly|presumably|may(?!\s+\d)|might|could|expect(?:s|ed)?|assum(?:e|es|ed|ing|ption)|estimat(?:e|es|ed)|believ(?:e|es|ed)|think|thinks|seems?|appears?|should|anticipat(?:e|es|ed)|hope|hopefully|roughly|approximately|projected|forecast(?:s|ed)?|guess)\b/i;

/** Return the first hedge word found in `text`, or null. */
export function hedgeMatch(text) {
  const m = String(text).match(HEDGE);
  return m ? m[0].toLowerCase() : null;
}

const UNCERTAIN = /\b(tbd|tbc|unknown|unclear|unconfirmed|pending|not yet (?:known|confirmed|decided))\b|\?\s*$/i;

/** True when an item is an open question or explicitly flagged as unknown. */
export function isOpenQuestion(text) {
  return UNCERTAIN.test(String(text));
}

export function hasNumber(text) {
  return /\d/.test(String(text));
}

/** Parse evidence notes. Lines may start with "E3:" or "[E3]"; otherwise IDs are assigned in order. */
export function parseEvidence(text) {
  const lines = splitItems(text);
  const used = new Set();
  const parsed = lines.map((line) => {
    const m = line.match(/^\[?(E\d+)\]?\s*[:.)-]?\s*(.*)$/i);
    if (m) {
      const id = m[1].toUpperCase();
      if (!used.has(id)) {
        used.add(id);
        return { id, text: m[2].trim() || line };
      }
    }
    return { id: null, text: line };
  });
  let n = 1;
  for (const e of parsed) {
    if (e.id) continue;
    while (used.has(`E${n}`)) n++;
    e.id = `E${n}`;
    used.add(e.id);
  }
  return parsed;
}

/** Extract citation references like [E1] or [E1, E3] from an item. */
export function findRefs(text) {
  const refs = [];
  for (const group of String(text).matchAll(/\[((?:E\d+\s*,?\s*)+)\]/gi)) {
    for (const id of group[1].match(/E\d+/gi)) refs.push(id.toUpperCase());
  }
  return [...new Set(refs)];
}

export function stripRefs(text) {
  return String(text).replace(/\s*\[(?:E\d+\s*,?\s*)+\]/gi, '').trim();
}

/**
 * Parse the Options field. Each non-annotation line starts a new option, written as
 * "Name: description". Lines beginning "Pro:" / "+" or "Con:" attach to the previous option.
 */
export function parseOptions(text) {
  const options = [];
  for (const line of splitItems(text)) {
    const pro = line.match(/^(?:pro|benefit|upside)\s*:\s*(.+)$/i) || line.match(/^\+\s*(.+)$/);
    const con = line.match(/^(?:con|drawback|downside|cost)\s*:\s*(.+)$/i);
    const current = options[options.length - 1];
    if ((pro || con) && current) {
      (pro ? current.pros : current.cons).push((pro || con)[1].trim());
      continue;
    }
    if (pro || con) continue; // annotation with no option to attach to; validation warns
    const m = line.match(/^([^:]{1,60}):\s+(.+)$/);
    const name = m ? m[1].trim() : line.split(/\s+/).slice(0, 6).join(' ');
    options.push({ name, description: m ? m[2].trim() : line, pros: [], cons: [] });
  }
  return options;
}

/** Count Pro/Con lines that appear before any option (so validation can warn about them). */
export function orphanAnnotations(text) {
  let count = 0;
  for (const line of splitItems(text)) {
    const isAnnotation = /^(?:pro|benefit|upside|con|drawback|downside|cost)\s*:/i.test(line) || /^\+\s/.test(line);
    if (!isAnnotation) break;
    count++;
  }
  return count;
}

/** Find an ISO date (YYYY-MM-DD) in a deadline string and compute whole days remaining. */
export function parseDeadline(text, now = new Date()) {
  const raw = String(text ?? '').trim();
  const m = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (!m) return { text: raw, date: null, daysRemaining: null };
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (date.getUTCMonth() !== +m[2] - 1 || date.getUTCDate() !== +m[3]) {
    return { text: raw, date: null, daysRemaining: null, invalid: true };
  }
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { text: raw, date: m[0], daysRemaining: Math.round((date - today) / 86400000) };
}

export function addDays(now, days) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  return d.toISOString().slice(0, 10);
}

const STOP = new Set(('about above after again against also among because been before being below between both ' +
  'cannot could does doing down during each from further have having here into itself just more most must ' +
  'only other over same should some such than that their them then there these they this those through under ' +
  'until very what when where which while will with within without would your our ours option options current ' +
  'year years').split(' '));

/** Crude keyword set (lower-cased, 6-char prefix stems) used for lexical matching. */
export function keywords(text) {
  const words = String(text).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [];
  return new Set(words.filter((w) => !STOP.has(w)).map((w) => w.slice(0, 6)));
}

/** Number of shared keywords between two texts. */
export function overlap(a, b) {
  const kb = keywords(b);
  let n = 0;
  for (const k of keywords(a)) if (kb.has(k)) n++;
  return n;
}
