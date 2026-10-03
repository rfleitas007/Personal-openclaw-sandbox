# Architecture and design decisions

## Goals

- Prove the shape of an evidence-disciplined decision brief, not its eventual intelligence.
- Be easy to inspect: a reviewer should be able to read every rule in one sitting.
- Run safely in a sandbox: nothing external is called, and there is nothing to install.

## Stack

| Choice | Why |
|---|---|
| Plain HTML/CSS/ES modules, no framework | The UI is one form and one document. A framework would add build tooling without changing the outcome. |
| Node built-in `http` server (~70 lines) | Browsers block ES modules over `file://`, so a server is needed. Node is already required for the tests. |
| `node:test` + `node:assert` | Built in. No `node_modules`. |
| Engine as pure modules under `public/engine/` | The browser and the tests run the same code. No DOM dependency means everything is unit-testable. |

Total runtime and dev dependencies: **zero**.

## Key decisions

### 1. Rule-based generation, not an LLM

The brief says not to connect to external APIs, so generation is deterministic. That has a real advantage for this proof of concept: every statement in the brief can be traced to an input line or a named rule, and the same input always produces the same brief (this is tested). The cost is shallow reasoning. The tool **restructures and audits** the user's thinking; it does not supply domain knowledge. A later version could add an LLM behind the same `brief` object contract (see Extension path).

### 2. Evidence discipline is structural, not cosmetic

- Every output item is `{ tag, text, basis }`. The renderer and the Markdown exporter cannot emit an untagged line.
- **Facts are only what the user supplied as fact without hedging.** The tool never creates a `FACT` except one arithmetic derivation (days remaining from a supplied date), and that item's basis says so.
- **Hedged "facts" are demoted, never promoted.** A line in Known facts containing "probably", "we expect", "should" and similar words moves to Assumptions with a note saying why. This is deliberately conservative: a false demotion costs the user a moment to rephrase, while a false promotion corrupts the brief.
- Pros and cons are tagged `JUDGMENT`, not `FACT`. They are the user's assessments.
- **Implicit assumptions are surfaced**, for example "the options listed are the full set" and "the deadline is firm."
- Tool-added content (the status-quo baseline, reversibility ratings, option-fact links) is tagged `INFERENCE` and states its basis, including when the basis is only a keyword heuristic.

### 3. Confidence measures the evidence base, not the answer

The score (0–100) adds up visible factors: number of facts, share of facts that are sourced, evidence notes, options supplied, completeness of pros and cons, assumption load, quantitative content, and a dated deadline. It subtracts for reclassified facts and open questions. All factors are shown in the brief.

Bands: **High** ≥ 75, **Moderate** ≥ 45, **Low** below that. **High is capped to Moderate** if any fact is unsourced or any "fact" was reclassified. A brief built on unaudited facts should not read as high confidence however complete it looks.

### 4. Recommendations are withheld by default

The tool gives a *provisional lean* only when confidence is at least Moderate, at least two supplied options have both pros and cons, and one option leads strictly. Ranking is (pros − cons), with reversibility as a tie-breaker. The lean is tagged `INFERENCE` and says plainly that the counts are not weighted by importance. Otherwise the bottom line says no option is recommended and explains why. An executive brief that confidently picks an option from thin inputs is worse than one that says "not ready, and here is what would make it ready."

### 5. Reversibility as a first-class dimension

Executives often under-weight how reversible a decision is. Each option gets a High, Low, Mixed or Unclear rating from commitment cues ("sign", "3-year", "migrate") versus flexibility cues ("pilot", "extend", "defer"). Only the option's name and description are read, because pros and cons often mention commitments in the negative ("no migration effort"). When reversibility differs across options, the tool suggests staging through the reversible one.

### 6. Graceful degradation

Only the decision field is required. Every other gap becomes a non-blocking warning plus a `MISSING` item, and a minimal input still produces a coherent brief. The confidence is Low, the bottom line says "Not decision-ready", and the information needs list what to supply first.

### 7. Safety

- User text is rendered only with `textContent`. A headless-browser check during development confirmed that injected markup is not executed.
- The server binds to `127.0.0.1`, serves GET/HEAD only from `public/`, rejects path traversal, malformed encodings and null bytes, and sends a strict CSP (`connect-src 'none'`). The page cannot make network requests even if code were injected.
- No storage: input is not persisted. Closing the tab discards it.

## Known limitations

- **Lexical heuristics.** Hedge detection, reversibility and option-constraint links use keyword matching. They will miss paraphrases ("it's a safe bet that…") and can over-match. Every such item is labelled as heuristic so the reader can discount it.
- **Negation is not understood.** "Not likely" is still hedged, which is correct. "No migration" in an option description would still count as a commitment cue.
- **English only.**
- **Pros and cons are counted, not weighted.** This is why the lean is provisional and explained.
- **No domain knowledge.** The tool cannot tell you a risk you did not hint at.

## Extension path

The `brief` object returned by `generateBrief` is the contract between analysis and presentation. A future version could:

1. Add an LLM-assisted step that proposes extra risks or options, tagged `INFERENCE` with model provenance, without ever writing `FACT` items. Keep the rule-based tagger as a guardrail on its output.
2. Add per-option weighting (impact × likelihood) in place of pro and con counts.
3. Persist briefs and track decision outcomes against the assumptions recorded at decision time.
