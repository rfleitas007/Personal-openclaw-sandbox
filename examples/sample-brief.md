# Decision Brief

**Decision:** Should we renew our telehealth platform contract, switch to Vendor B, or negotiate a short-term extension before the non-renewal notice deadline?  
**Horizon:** 2027-01-30 (non-renewal notice deadline)  
**Generated:** 2026-10-03 · PAII Decision Brief Generator (sandbox prototype, rule-based)

> Tags: **FACT** supplied by user · **JUDGMENT** user assessment, not verified · **ASSUMPTION** unverified premise · **INFERENCE** derived by this tool · **MISSING** information gap

## 1. Executive bottom line
**Conditionally ready** · Evidence confidence: **Moderate** (88/100, capped)

- **[INFERENCE]** Conditionally ready. Evidence confidence is moderate (88/100, capped). _(Measures how complete and traceable the supplied evidence is. It does not measure whether any option is correct.)_
- **[INFERENCE]** Provisional lean: Extend. _(Most favourable balance of supplied benefits to drawbacks (1:1), with reversibility used as the tie-breaker (High). Counts are not weighted by importance. Revisit before committing.)_
- **[INFERENCE]** Most valuable next information: verify "Clinician satisfaction with the platform is probably below 50%" _(Shares terms with 3 options, so it may shift the comparison.)_
- **[FACT]** 119 days remain until 2027-01-30. _(Calculated from the supplied deadline.)_

## 2. Known facts
- **[FACT]** Current contract costs $186,000/year; the renewal quote is $214,000/year (+15%) for a 3-year term _(Source: E1)_
- **[FACT]** Dropped or failed sessions averaged 4.1% over Q2–Q3 2026 against a 1.5% SLA target _(Source: E2)_
- **[FACT]** Vendor B quoted $171,000/year on a 2-year term, plus $38,000 one-time implementation _(Source: E3)_
- **[FACT]** Written non-renewal notice must be delivered by 2027-01-30 _(Source: E1)_
- **[FACT]** Two departing clinicians cited platform reliability in exit interviews _(Supplied by user. No source cited.)_

> 1 item was submitted as fact but contained hedged language. Moved to Assumptions.

**Constraints (supplied)**

- **[FACT]** Any platform must be HIPAA-compliant with a signed BAA _(Supplied constraint.)_
- **[FACT]** Migration cannot disrupt clinician scheduling for more than 2 weeks _(Supplied constraint.)_
- **[FACT]** FY27 capital budget is frozen; one-time implementation costs must come from operating budget _(Supplied constraint.)_
- **[FACT]** Platform must support interstate licensure workflows for PSYPACT states _(Supplied constraint.)_

## 3. Assumptions
- **[ASSUMPTION]** Clinician satisfaction with the platform is probably below 50% _(Moved from Known facts: contains hedged language ("probably"). Treat as unverified until confirmed.)_
- **[ASSUMPTION]** Vendor B will likely integrate with our EHR without custom development. _(Stated in Context with hedged language ("likely").)_
- **[ASSUMPTION]** The options listed are the full set of feasible alternatives. _(Implicit. Inferred by tool; confirm no option is missing.)_
- **[ASSUMPTION]** The supplied facts are current as of the decision date. _(Implicit. Inferred by tool.)_
- **[ASSUMPTION]** The stated horizon ("2027-01-30 (non-renewal notice deadline)") is firm and not negotiable. _(Implicit. Inferred by tool.)_

## 4. Important unknowns
- **[MISSING]** Is Vendor B's PSYPACT workflow support confirmed in writing? _(Evidence note E4 is unresolved.)_

## 5. Options: benefits and drawbacks

### A. Renew
Renew the current vendor for 3 years at the quoted price

*Reversibility:* **Low** [INFERENCE] _(Keyword heuristic (commitment cues: 3 years). Verify exit terms.)_

**Benefits**

- **[JUDGMENT]** No migration effort or clinician retraining _(Supplied by user. Not independently verified.)_
- **[JUDGMENT]** Existing BAA and known compliance posture _(Supplied by user. Not independently verified.)_

**Drawbacks**

- **[JUDGMENT]** 15% cost increase locked in for 3 years _(Supplied by user. Not independently verified.)_
- **[JUDGMENT]** Reliability problem is not addressed by the renewal terms _(Supplied by user. Not independently verified.)_

**Links to facts and constraints**

- **[INFERENCE]** Touches constraint: "Migration cannot disrupt clinician scheduling for more than 2 weeks" _(Lexical match between option and constraint. Check compliance explicitly.)_

### B. Switch
Migrate to Vendor B on a 2-year term

*Reversibility:* **Low** [INFERENCE] _(Keyword heuristic (commitment cues: migrate, 2-year). Verify exit terms.)_

**Benefits**

- **[JUDGMENT]** Lower annual cost from year one _(Supplied by user. Not independently verified.)_

**Drawbacks**

- **[JUDGMENT]** $38,000 implementation cost against a frozen budget _(Supplied by user. Not independently verified.)_
- **[JUDGMENT]** Migration and retraining risk to clinician scheduling _(Supplied by user. Not independently verified.)_

**Links to facts and constraints**

- **[INFERENCE]** Touches constraint: "Migration cannot disrupt clinician scheduling for more than 2 weeks" _(Lexical match between option and constraint. Check compliance explicitly.)_
- **[INFERENCE]** Touches constraint: "FY27 capital budget is frozen; one-time implementation costs must come from operating bud…" _(Lexical match between option and constraint. Check compliance explicitly.)_
- **[INFERENCE]** Bears on fact: "Vendor B quoted $171,000/year on a 2-year term, plus $38,000 one-time implementation" _(Lexical match between option and fact.)_

### C. Extend
Negotiate a 6-month extension at the current price while running a Vendor B pilot with one clinic

*Reversibility:* **High** [INFERENCE] _(Keyword heuristic (flexibility cues: extend, extension, pilot). Verify exit terms.)_

**Benefits**

- **[JUDGMENT]** Preserves optionality and produces real reliability data from the pilot _(Supplied by user. Not independently verified.)_

**Drawbacks**

- **[JUDGMENT]** Current vendor may refuse or charge a premium for a short extension _(Supplied by user. Not independently verified.)_

### D. Status quo / defer _(added by tool as baseline)_
Take no new action now and revisit later. Added as a comparison baseline.

*Reversibility:* **High** [INFERENCE] _(Keyword heuristic (flexibility cues: status quo, defer). Verify exit terms.)_

**Benefits**

- **[MISSING]** No benefits supplied. _(Baseline added by tool. Define what staying put preserves.)_

**Drawbacks**

- **[MISSING]** No drawbacks supplied. _(Baseline added by tool. Define the cost of delay.)_

## 6. Key risks
- **[INFERENCE]** One-way-door exposure: "Renew" looks hard to reverse. _(Keyword heuristic (commitment cues: 3 years). Verify exit terms.)_
- **[INFERENCE]** One-way-door exposure: "Switch" looks hard to reverse. _(Keyword heuristic (commitment cues: migrate, 2-year). Verify exit terms.)_
- **[INFERENCE]** If this assumption is wrong, the analysis shifts: "Clinician satisfaction with the platform is probably below 50%" _(Unverified premise.)_
- **[INFERENCE]** If this assumption is wrong, the analysis shifts: "Vendor B will likely integrate with our EHR without custom development" _(Unverified premise.)_
- **[INFERENCE]** 1 supplied fact has no cited source. _(Unsourced facts cannot be audited or challenged.)_
- **[INFERENCE]** 3 option-constraint interactions need an explicit compliance check. _(See each option's analysis.)_

## 7. Reversibility
- **[INFERENCE]** Options differ in reversibility. A reversible option can buy time to close evidence gaps before a one-way commitment. _(Derived from per-option keyword heuristics.)_
- Renew: **Low**
- Switch: **Low**
- Extend: **High**
- Status quo / defer: **High**

## 8. Information that would most improve the decision
1. **[INFERENCE]** Verify: "Clinician satisfaction with the platform is probably below 50%" _(Shares terms with 3 options, so it may shift the comparison.)_
2. **[INFERENCE]** Verify: "Vendor B will likely integrate with our EHR without custom development" _(Shares terms with 3 options, so it may shift the comparison.)_
3. **[INFERENCE]** Obtain sources for the 1 unsourced fact. _(Makes the fact base auditable.)_
4. **[INFERENCE]** Resolve: "Is Vendor B's PSYPACT workflow support confirmed in writing?" _(Evidence note E4 is unresolved.)_

## 9. Recommended next actions
1. **[INFERENCE]** Verify "Clinician satisfaction with the platform is probably below 50%". Assign an owner and a due date. _(Shares terms with 3 options, so it may shift the comparison.)_
2. **[INFERENCE]** Verify "Vendor B will likely integrate with our EHR without custom development". Assign an owner and a due date. _(Shares terms with 3 options, so it may shift the comparison.)_
3. **[INFERENCE]** Obtain sources for the 1 unsourced fact. Assign an owner and a due date. _(Makes the fact base auditable.)_
4. **[INFERENCE]** Confirm or discard the 1 item moved from facts to assumptions. _(Do not treat them as facts until confirmed.)_
5. **[INFERENCE]** Consider staging through "Extend" while evidence is gathered. _(Keeps options open at lower commitment.)_
6. **[INFERENCE]** Before committing to a hard-to-reverse option, write down the conditions that would trigger reversal. _(Pre-commitment to exit criteria reduces sunk-cost bias.)_
7. **[INFERENCE]** Hold a decision checkpoint by 2026-12-01 (midpoint of the horizon). _(Leaves time to act on the decision before the deadline.)_
8. **[INFERENCE]** Record the decision, its rationale and the key assumptions so the outcome can be reviewed later. _(Supports learning, not just accountability.)_

## 10. Confidence assessment
**Moderate** (88/100). Measures how complete and traceable the supplied evidence is. It does not measure whether any option is correct.

- +20 · 5 supplied facts retained
- +16 · 4 of 5 facts cite an evidence note
- +10 · 4 evidence notes supplied
- +15 · 3 options supplied
- +10 · 3 of 3 options have both benefits and drawbacks
- +10 · 2 stated or reclassified assumptions
- +10 · Quantitative facts present
- +5 · Dated deadline
- −5 · 1 item submitted as fact contained hedged language
- −3 · 1 open question in the inputs
- Capped at Moderate: items submitted as fact were actually assumptions.
- Capped at Moderate: not every fact is sourced.

## Evidence register
- **E1**: Current vendor renewal quote and master services agreement, received 2026-09-12
- **E2**: Internal session logs exported by IT, April–September 2026
- **E3**: Vendor B written proposal dated 2026-09-20
- **E4**: Is Vendor B's PSYPACT workflow support confirmed in writing?
