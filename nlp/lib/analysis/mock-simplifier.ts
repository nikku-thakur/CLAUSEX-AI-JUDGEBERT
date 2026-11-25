/**
 * Temporary, local-only simplification for the analyzer workflow.
 * This deliberately makes a small set of wording substitutions and leaves all
 * dates, amounts, parties, conditions, exceptions, and other text untouched.
 * It is a draft aid, not a legal safety check.
 */
const wordingVariants: Array<Array<[RegExp, string]>> = [
  [
    [/\bshall not\b/gi, 'must not'],
    [/\bshall\b/gi, 'must'],
    [/\bprovided that\b/gi, 'only if'],
    [/\bnotwithstanding\b/gi, 'even if'],
    [/\bprior written consent\b/gi, 'written permission in advance'],
    [/\bhereby agrees to\b/gi, 'agrees to'],
    [/\bin the event that\b/gi, 'if'],
    [/\bprior to\b/gi, 'before'],
    [/\bpursuant to\b/gi, 'under'],
    [/\butilize\b/gi, 'use'],
    [/\bterminate\b/gi, 'end'],
  ],
  [
    [/\bshall not\b/gi, 'is not allowed to'],
    [/\bshall\b/gi, 'is required to'],
    [/\bprovided that\b/gi, 'as long as'],
    [/\bnotwithstanding\b/gi, 'despite'],
    [/\bprior written consent\b/gi, 'permission in writing beforehand'],
    [/\bhereby agrees to\b/gi, 'agrees to'],
    [/\bin the event that\b/gi, 'if'],
    [/\bprior to\b/gi, 'before'],
    [/\bpursuant to\b/gi, 'under'],
    [/\butilize\b/gi, 'use'],
    [/\bterminate\b/gi, 'end'],
  ],
];

export function simplifyClauseMock(originalText: string, variant = 0): string {
  const rules = wordingVariants[Math.abs(variant) % wordingVariants.length];
  return rules.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement as string), originalText);
}
