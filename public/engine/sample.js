// A realistic, fictional sample input. All organisations and figures are invented.

export const SAMPLE_NOW = '2026-10-03';

export const SAMPLE_INPUT = {
  decision: 'Should we renew our telehealth platform contract, switch to Vendor B, or negotiate a short-term extension before the non-renewal notice deadline?',
  context: [
    'Regional outpatient behavioral health group: 42 clinicians across three states, with about 68% of sessions delivered by video.',
    'The current platform contract auto-renews for three years unless written notice is given.',
    'Clinical leadership reports frustration with dropped sessions, while finance is focused on containing FY27 costs.',
    'Vendor B will likely integrate with our EHR without custom development.',
  ].join(' '),
  facts: [
    'Current contract costs $186,000/year; the renewal quote is $214,000/year (+15%) for a 3-year term [E1]',
    'Dropped or failed sessions averaged 4.1% over Q2–Q3 2026 against a 1.5% SLA target [E2]',
    'Vendor B quoted $171,000/year on a 2-year term, plus $38,000 one-time implementation [E3]',
    'Written non-renewal notice must be delivered by 2027-01-30 [E1]',
    'Two departing clinicians cited platform reliability in exit interviews',
    'Clinician satisfaction with the platform is probably below 50%',
  ].join('\n'),
  constraints: [
    'Any platform must be HIPAA-compliant with a signed BAA',
    'Migration cannot disrupt clinician scheduling for more than 2 weeks',
    'FY27 capital budget is frozen; one-time implementation costs must come from operating budget',
    'Platform must support interstate licensure workflows for PSYPACT states',
  ].join('\n'),
  options: [
    'Renew: Renew the current vendor for 3 years at the quoted price',
    'Pro: No migration effort or clinician retraining',
    'Pro: Existing BAA and known compliance posture',
    'Con: 15% cost increase locked in for 3 years',
    'Con: Reliability problem is not addressed by the renewal terms',
    'Switch: Migrate to Vendor B on a 2-year term',
    'Pro: Lower annual cost from year one',
    'Con: $38,000 implementation cost against a frozen budget',
    'Con: Migration and retraining risk to clinician scheduling',
    'Extend: Negotiate a 6-month extension at the current price while running a Vendor B pilot with one clinic',
    'Pro: Preserves optionality and produces real reliability data from the pilot',
    'Con: Current vendor may refuse or charge a premium for a short extension',
  ].join('\n'),
  evidence: [
    'E1: Current vendor renewal quote and master services agreement, received 2026-09-12',
    'E2: Internal session logs exported by IT, April–September 2026',
    'E3: Vendor B written proposal dated 2026-09-20',
    'E4: Is Vendor B\'s PSYPACT workflow support confirmed in writing?',
  ].join('\n'),
  deadline: '2027-01-30 (non-renewal notice deadline)',
};
