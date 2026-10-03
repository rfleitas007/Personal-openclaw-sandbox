# PAII Decision Brief Generator

A sandbox proof of concept for an executive decision-support tool. You enter a structured problem statement; it produces a concise decision brief that keeps **supplied facts**, **assumptions**, **tool inferences** and **missing information** visibly separate.

> **Sandbox prototype.** It has no network calls, no external APIs, no database, no credentials and no connection to any PAII/COA system. Briefs are generated in the browser by deterministic rules. Nothing leaves the machine.

## Run locally

Requires **Node.js 20+**. There are no dependencies to install.

```bash
npm start            # serves the app at http://localhost:3000 (PORT=4000 npm start to change)
npm test             # runs all automated tests (node:test)
npm run sample       # regenerates examples/sample-brief.md
```

Open http://localhost:3000, select **Load sample**, or fill in the form and select **Generate brief**. Use **Copy Markdown** or **Export .md** to take the brief elsewhere. Printing the page prints only the brief.

## Input format

| Field | Format | How it is used |
|---|---|---|
| Decision / question | Free text (required, 10–500 chars) | Brief headline |
| Context | Free text | Sentences with hedged language ("likely", "we expect") become **assumptions** |
| Known facts | One per line; cite sources as `[E1]` | Unhedged lines become **facts**. Hedged lines are **moved to assumptions**, and the move is flagged |
| Constraints | One per line | Shown as supplied constraints and matched against options |
| Options | `Name: description`, then `Pro:` / `Con:` lines | Each option is analysed. A status-quo baseline is added if none is supplied |
| Evidence / source notes | One per line, `E1: description` | Evidence register. Facts citing a valid ID count as sourced |
| Deadline / horizon | Include a `YYYY-MM-DD` date | Days remaining, horizon risk, checkpoint date |

Lines ending in `?` or containing `TBD`, `unknown` or `pending` in any field are treated as **open questions** (missing information).

## What the brief contains

1. Executive bottom line: readiness verdict, provisional lean (when warranted), most valuable next information
2. Known facts, plus supplied constraints
3. Assumptions: stated, reclassified, and implicit
4. Important unknowns
5. Options with benefits, drawbacks, reversibility, and links to facts and constraints
6. Key risks
7. Reversibility, overall and per option
8. Information that would most improve the decision (ranked)
9. Recommended next actions
10. Confidence assessment with the scoring factors shown
11. Evidence register

### Evidence tags

| Tag | Meaning |
|---|---|
| `FACT` | Supplied by the user as fact, unhedged. Shows its cited source or "No source cited" |
| `JUDGMENT` | The user's own assessment (pros and cons). Not verified |
| `ASSUMPTION` | Unverified premise: stated by the user, reclassified from facts, or implicit |
| `INFERENCE` | Derived by this tool. Every inference shows its basis |
| `MISSING` | Absent or explicitly unresolved information |

A sample brief generated from the built-in example is in [`examples/sample-brief.md`](examples/sample-brief.md).

## Architecture

```
server.js                 Zero-dependency static file server (localhost only, CSP, path-traversal guard)
public/
  index.html              Form and brief layout
  styles.css              Restrained, print-friendly styling (light/dark)
  app.js                  Browser wiring: form → engine → DOM; copy and export
  engine/                 Pure ES modules: no DOM, shared by browser and tests
    parse.js              Line/sentence splitting, hedge detection, options/evidence/deadline parsing
    validate.js           Field schema, errors (blocking) and warnings (non-blocking)
    generate.js           Rule-based brief generator: tagging, options, risks, confidence
    markdown.js           Brief → Markdown (tags preserved)
    sample.js             Fictional sample input
scripts/build-sample.js   Regenerates examples/sample-brief.md
examples/sample-brief.md  Sample output (a test checks it stays in sync)
test/                     node:test suites: parse, validate, generate, markdown, server
docs/ARCHITECTURE.md      Design decisions and known limitations
```

Data flow: `form → validateInput → generateBrief → brief object → (DOM renderer | briefToMarkdown)`. The brief object is the single source of truth, so the screen and the Markdown cannot drift apart.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for design decisions, the confidence model, and known limitations.
