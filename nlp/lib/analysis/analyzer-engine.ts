import {
  AnalysisResult,
  ChangeCategory,
  CriticalChange,
  DeonticModalityBreakdown,
  ConditionsExceptionsBreakdown,
  EntitiesDatesAmountsBreakdown,
  Language,
  PreservationStatus,
  SeverityLevel,
  TextSpan,
} from '@/types/analysis';

// English Lexicon
const EN_OBLIGATIONS = [
  'shall',
  'must',
  'is required to',
  'are required to',
  'will be obliged to',
  'agrees to',
  'covenants to',
  'covenants and agrees',
  'undertakes to',
  'is obligated to',
];

const EN_PERMISSIONS = [
  'may',
  'can',
  'is permitted to',
  'are permitted to',
  'at its sole discretion',
  'at its election',
  'is authorized to',
  'has the right to',
];

const EN_PROHIBITIONS = [
  'shall not',
  'must not',
  'may not',
  'under no circumstances',
  'is prohibited from',
  'will not',
  'cannot',
  'not permitted to',
];

const EN_CONDITIONS = [
  'provided that',
  'on condition that',
  'subject to',
  'in the event that',
  'in the event of',
  'if',
  'assuming that',
  'so long as',
  'contingent upon',
];

const EN_EXCEPTIONS = [
  'except where',
  'except that',
  'except as',
  'except for',
  'unless',
  'excluding',
  'save for',
  'other than',
  'carve-out',
];

// Hindi Lexicon
const HI_OBLIGATIONS = [
  'होगा',
  'होगी',
  'होंगे',
  'अनिवार्य रूप से',
  'बाध्य होगा',
  'बाध्य होगी',
  'कर्तव्य होगा',
  'आवश्यक है',
  'करना पड़ेगा',
  'देना होगा',
  'वापस करेगा',
];

const HI_PERMISSIONS = [
  'सकता है',
  'सकती है',
  'सकते हैं',
  'हकदार होगा',
  'छूट होगी',
  'अनुमति है',
  'अपनी सुविधा अनुसार',
  'अधिकार होगा',
];

const HI_PROHIBITIONS = [
  'नहीं करेगा',
  'नहीं कर सकता',
  'प्रतिबंधित है',
  'मनाही है',
  'वर्जित है',
  'अधिकार नहीं होगा',
  'नहीं देगा',
];

const HI_CONDITIONS = [
  'यदि',
  'अगर',
  'बशर्ते',
  'की शर्त पर',
  'स्थिति में',
  'सहमति के बिना',
  'मामले में',
];

const HI_EXCEPTIONS = [
  'सिवाय',
  'को छोड़कर',
  'इसके अतिरिक्त',
  'के अलावा',
  'बशर्ते कि नहीं',
];

function extractMatches(text: string, patterns: string[]): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const pat of patterns) {
    if (lower.includes(pat.toLowerCase())) {
      matched.push(pat);
    }
  }
  return Array.from(new Set(matched));
}

function extractRegex(text: string, regex: RegExp): string[] {
  const matches: string[] = [];
  const re = new RegExp(regex.source, regex.flags);
  let match;
  while ((match = re.exec(text)) !== null) {
    matches.push(match[0].trim());
  }
  return Array.from(new Set(matches));
}

function tokenize(text: string): string[] {
  return text.match(/[\w$€₹\d%]+|[.,!?;:()"]|\s+/g) || [];
}

/**
 * Computes a word-level token diff between original and simplified text
 */
function computeSpans(
  original: string,
  simplified: string,
  criticalChanges: CriticalChange[]
): { originalSpans: TextSpan[]; simplifiedSpans: TextSpan[] } {
  const origTokens = tokenize(original);
  const simpTokens = tokenize(simplified);

  const origWords = origTokens.filter((t) => !/^\s+$/.test(t));
  const simpWords = simpTokens.filter((t) => !/^\s+$/.test(t));

  const origSet = new Set(origWords.map((w) => w.toLowerCase()));
  const simpSet = new Set(simpWords.map((w) => w.toLowerCase()));

  const originalSpans: TextSpan[] = origTokens.map((token) => {
    if (/^\s+$/.test(token)) {
      return { text: token, type: 'unchanged' };
    }
    const lower = token.toLowerCase();
    const isMissingInSimp = !simpSet.has(lower);

    // check if this token is part of a critical change
    const matchedCrit = criticalChanges.find(
      (c) => c.originalExcerpt.toLowerCase().includes(lower) && lower.length > 3
    );

    if (matchedCrit) {
      return {
        text: token,
        type: 'removed',
        category: matchedCrit.category,
        severity: matchedCrit.severity,
        explanation: matchedCrit.explanation,
      };
    }

    if (isMissingInSimp) {
      return {
        text: token,
        type: 'removed',
        severity: 'info',
        explanation: 'Omitted or rephrased during simplification',
      };
    }

    return { text: token, type: 'unchanged' };
  });

  const simplifiedSpans: TextSpan[] = simpTokens.map((token) => {
    if (/^\s+$/.test(token)) {
      return { text: token, type: 'unchanged' };
    }
    const lower = token.toLowerCase();
    const isNew = !origSet.has(lower);

    const matchedCrit = criticalChanges.find(
      (c) => c.simplifiedExcerpt.toLowerCase().includes(lower) && lower.length > 3
    );

    if (matchedCrit) {
      return {
        text: token,
        type: 'added',
        category: matchedCrit.category,
        severity: matchedCrit.severity,
        explanation: matchedCrit.explanation,
      };
    }

    if (isNew) {
      return {
        text: token,
        type: 'added',
        severity: 'info',
        explanation: 'Added or substituted phrasing in simplified text',
      };
    }

    return { text: token, type: 'unchanged' };
  });

  return { originalSpans, simplifiedSpans };
}

/**
 * Deterministic, rule-based legal clause analyzer
 * Clearly labelled as a transparent heuristic baseline for research review
 */
export function analyzeLegalClause(
  original: string,
  simplified: string,
  language: Language = 'en',
  domain?: string,
  jurisdiction?: string,
  legalContext?: string
): AnalysisResult {
  const origClean = original.trim();
  const simpClean = simplified.trim();

  const isHindi = language === 'hi';

  const obligationsList = isHindi ? HI_OBLIGATIONS : EN_OBLIGATIONS;
  const permissionsList = isHindi ? HI_PERMISSIONS : EN_PERMISSIONS;
  const prohibitionsList = isHindi ? HI_PROHIBITIONS : EN_PROHIBITIONS;
  const conditionsList = isHindi ? HI_CONDITIONS : EN_CONDITIONS;
  const exceptionsList = isHindi ? HI_EXCEPTIONS : EN_EXCEPTIONS;

  // 1. Modality Extraction
  const origObligations = extractMatches(origClean, obligationsList);
  const simpObligations = extractMatches(simpClean, obligationsList);
  const origPermissions = extractMatches(origClean, permissionsList);
  const simpPermissions = extractMatches(simpClean, permissionsList);
  const origProhibitions = extractMatches(origClean, prohibitionsList);
  const simpProhibitions = extractMatches(simpClean, prohibitionsList);

  // 2. Conditions & Exceptions
  const origConditions = extractMatches(origClean, conditionsList);
  const simpConditions = extractMatches(simpClean, conditionsList);
  const origExceptions = extractMatches(origClean, exceptionsList);
  const simpExceptions = extractMatches(simpClean, exceptionsList);

  const droppedConditions = origConditions.filter((c) => !simpConditions.includes(c));
  const droppedExceptions = origExceptions.filter((e) => !simpExceptions.includes(e));

  // 3. Numbers, Dates, Amounts
  const numberRegex = /(?:\$|₹|€|£)?\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/g;
  const origNumbers = extractRegex(origClean, numberRegex);
  const simpNumbers = extractRegex(simpClean, numberRegex);
  const missingNumbers = origNumbers.filter((n) => !simpNumbers.includes(n));

  const dateRegex = /\b\d+\s*(?:business|calendar)?\s*(?:days|months|years|weeks|hours|दिन|माह|साल)\b/gi;
  const origDates = extractRegex(origClean, dateRegex);
  const simpDates = extractRegex(simpClean, dateRegex);
  const missingDates = origDates.filter((d) => !simpDates.includes(d));

  // 4. Critical Changes Detection
  const criticalChanges: CriticalChange[] = [];
  const shifts: DeonticModalityBreakdown['shifts'] = [];
  let scoreDeduction = 0;

  // Check: Obligation weakened to permission
  if (
    (origObligations.length > 0 && simpPermissions.length > 0 && simpObligations.length === 0) ||
    (origClean.toLowerCase().includes('shall') && simpClean.toLowerCase().includes('may')) ||
    (origClean.includes('अनिवार्य') && simpClean.includes('सकती'))
  ) {
    criticalChanges.push({
      id: `cc-${Date.now()}-1`,
      category: 'obligation',
      severity: 'critical',
      title: isHindi ? 'बाध्यता में दुर्बलता (Shall to May)' : 'Deontic Weakening: Mandatory Duty Relaxed to Discretion',
      originalExcerpt: origObligations[0] || (isHindi ? 'अनिवार्य रूप से' : 'shall / must'),
      simplifiedExcerpt: simpPermissions[0] || (isHindi ? 'सकती है' : 'may / can'),
      explanation: isHindi
        ? 'मूल अनुबंध में अनिवार्य कर्तव्य था, जिसे सरल पाठ में ऐच्छिक बना दिया गया।'
        : 'The original clause imposes a legally binding obligation ("shall/must"). The simplified text reduces this to an optional permission ("may/can"), removing legal liability for non-performance.',
      legalSignificance:
        'Eliminates breach-of-contract remedies by converting enforceable promises into discretionary acts.',
      evidenceSource: 'deontic_shift',
    });
    shifts.push({
      from: 'Obligation (Shall / Must)',
      to: 'Permission (May / Can)',
      impact: 'Mandatory obligation converted to discretionary choice',
      severity: 'critical',
    });
    scoreDeduction += 3.8;
  }

  // Check: Permission converted into obligation
  if (
    (origPermissions.length > 0 && origObligations.length === 0 && simpObligations.length > 0) ||
    (origClean.toLowerCase().includes('may') && simpClean.toLowerCase().includes('required to'))
  ) {
    criticalChanges.push({
      id: `cc-${Date.now()}-2`,
      category: 'permission',
      severity: 'critical',
      title: isHindi ? 'अनुमति का बाध्यता में परिवर्तन' : 'Discretionary Permission Converted into Mandatory Obligation',
      originalExcerpt: origPermissions[0] || 'may / at its election',
      simplifiedExcerpt: simpObligations[0] || 'is required to / must',
      explanation: isHindi
        ? 'मूल अधिकार को सरल पाठ में एक अनिवार्य कानूनी दायित्व में बदल दिया गया।'
        : 'The original granted an elective discretionary right. The simplified clause inadvertently creates an affirmative mandatory duty.',
      legalSignificance:
        'Imposes unexpected continuous compliance obligations and unintended breach liability.',
      evidenceSource: 'deontic_shift',
    });
    shifts.push({
      from: 'Permission (May)',
      to: 'Obligation (Required)',
      impact: 'Elective privilege burdened with mandatory performance',
      severity: 'critical',
    });
    scoreDeduction += 3.5;
  }

  // Check: Prohibition omitted or negated
  if (
    (origProhibitions.length > 0 && simpProhibitions.length === 0) ||
    (origClean.toLowerCase().includes('under no circumstances') && !simpClean.toLowerCase().includes('no')) ||
    (origClean.toLowerCase().includes('in no event') && !simpClean.toLowerCase().includes('no'))
  ) {
    criticalChanges.push({
      id: `cc-${Date.now()}-3`,
      category: 'prohibition',
      severity: 'critical',
      title: isHindi ? 'निषेध की अनुपस्थिति / विलोपन' : 'Negative Prohibition or Disclaimer Omitted',
      originalExcerpt: origProhibitions[0] || 'under no circumstances shall / shall not',
      simplifiedExcerpt: 'Omitted or stated affirmatively',
      explanation: isHindi
        ? 'मूल पाठ का स्पष्ट निषेध सरल पाठ में गायब है।'
        : 'The original clause contained an express negative bar or liability disclaimer. The simplified version eliminated the prohibition or inverted its polarity.',
      legalSignificance:
        'Exposes the party to uncapped strict liability or allows previously forbidden conduct.',
      evidenceSource: 'negation_inversion',
    });
    scoreDeduction += 4.5;
  }

  // Check: Condition Precedent dropped
  if (droppedConditions.length > 0) {
    criticalChanges.push({
      id: `cc-${Date.now()}-4`,
      category: 'condition',
      severity: 'critical',
      title: isHindi ? 'शर्त विलोपन (Condition Removed)' : 'Condition Precedent Removed',
      originalExcerpt: droppedConditions.join(', '),
      simplifiedExcerpt: 'Missing conditional clause',
      explanation: isHindi
        ? 'मूल प्रावधान में आवश्यक पूर्व-शर्त थी जिसे हटा दिया गया है।'
        : `The original clause stipulated essential conditions precedent (${droppedConditions.join(', ')}), but these were dropped during simplification.`,
      legalSignificance:
        'Converts a conditional contractual duty into an absolute, unconditional guarantee.',
      evidenceSource: 'condition_removal',
    });
    scoreDeduction += 3.0;
  }

  // Check: Exception omitted
  if (droppedExceptions.length > 0) {
    criticalChanges.push({
      id: `cc-${Date.now()}-5`,
      category: 'exception',
      severity: 'critical',
      title: isHindi ? 'अपवाद का लोप (Exception Omitted)' : 'Substantive Legal Exception Omitted',
      originalExcerpt: droppedExceptions.join(', '),
      simplifiedExcerpt: 'Unqualified general statement',
      explanation: isHindi
        ? 'मूल नियम का अपवाद सरल पाठ में छोड़ दिया गया।'
        : `A crucial legal carve-out (${droppedExceptions.join(', ')}) was removed, creating an overbroad unqualified rule.`,
      legalSignificance:
        'Failing to preserve exceptions deprives parties of legal defenses and safe harbors.',
      evidenceSource: 'condition_removal',
    });
    scoreDeduction += 2.8;
  }

  // Check: Monetary differences
  if (missingNumbers.length > 0) {
    const origCurr = origNumbers.find((n) => n.startsWith('$') || n.startsWith('₹') || n.startsWith('€'));
    const simpCurr = simpNumbers.find((n) => n.startsWith('$') || n.startsWith('₹') || n.startsWith('€'));
    if (origCurr && simpCurr && origCurr !== simpCurr) {
      criticalChanges.push({
        id: `cc-${Date.now()}-6`,
        category: 'monetary',
        severity: 'critical',
        title: 'Monetary Amount / Cap Discrepancy',
        originalExcerpt: origCurr,
        simplifiedExcerpt: simpCurr,
        explanation: `The financial threshold was altered from ${origCurr} to ${simpCurr}.`,
        legalSignificance:
          'Directly distorts financial remedy caps, liquidated damages, or payment schedules.',
        evidenceSource: 'textual_diff',
      });
      scoreDeduction += 3.5;
    }
  }

  // Check: Date / Deadline differences
  if (missingDates.length > 0) {
    criticalChanges.push({
      id: `cc-${Date.now()}-7`,
      category: 'deadline',
      severity: 'warning',
      title: 'Time Limit or Notice Period Alteration',
      originalExcerpt: missingDates.join(', '),
      simplifiedExcerpt: simpDates.join(', ') || 'Unspecified timeframe',
      explanation: `Original timeline (${missingDates.join(', ')}) was modified or made vague.`,
      legalSignificance:
        'Statutory cure periods or dispute notification windows may be compromised.',
      evidenceSource: 'textual_diff',
    });
    scoreDeduction += 2.0;
  }

  // Word statistics & Compression
  const wordsOrig = origClean.split(/\s+/).filter(Boolean).length;
  const wordsSimp = simpClean.split(/\s+/).filter(Boolean).length;
  const compressionRatio = wordsOrig > 0 ? Number(((wordsSimp / wordsOrig) * 100).toFixed(1)) : 100;

  // Excessive compression penalty
  if (compressionRatio < 30 && criticalChanges.length === 0) {
    scoreDeduction += 1.5;
    criticalChanges.push({
      id: `cc-${Date.now()}-8`,
      category: 'omitted_content',
      severity: 'warning',
      title: 'High Text Truncation / Potential Meaning Loss',
      originalExcerpt: `${wordsOrig} words`,
      simplifiedExcerpt: `${wordsSimp} words (${compressionRatio}% retention)`,
      explanation:
        'The clause was heavily compressed. Check that recitals, warranties, or definitions were not lost.',
      legalSignificance:
        'Extreme brevity in legal drafting frequently truncates nuanced evidentiary standards.',
      evidenceSource: 'textual_diff',
    });
  }

  // Final LMP Score Calculation (1.0 to 10.0 scale)
  let rawScore = 10.0 - scoreDeduction;
  if (rawScore < 1.0) rawScore = 1.0;
  if (rawScore > 10.0) rawScore = 10.0;
  const lmpScore = Number(rawScore.toFixed(1));

  let preservationStatus: PreservationStatus = 'preserved';
  if (lmpScore < 6.0 || criticalChanges.some((c) => c.severity === 'critical')) {
    preservationStatus = 'critical_alteration';
  } else if (lmpScore < 8.5 || criticalChanges.some((c) => c.severity === 'warning')) {
    preservationStatus = 'subtle_shift';
  }

  // Cautious interpretation
  let interpretation = '';
  if (preservationStatus === 'preserved') {
    interpretation =
      'The simplified text preserves operative legal obligations, conditions, and core legal intent with high fidelity. No critical deontic shifts or condition omissions were detected.';
  } else if (preservationStatus === 'subtle_shift') {
    interpretation =
      'The simplified text communicates the general business meaning, but introduces subtle shifts in phrasing, time limits, or qualifications that warrant review by legal counsel.';
  } else {
    interpretation =
      'CAUTION: Potential critical legal alteration detected. The simplified text modifies essential operative duties (e.g. duty relaxation, dropped exceptions, or altered liability). It is not recommended to execute or rely on the simplified version without formal legal review.';
  }

  const { originalSpans, simplifiedSpans } = computeSpans(origClean, simpClean, criticalChanges);

  return {
    id: `analysis-${Date.now()}`,
    timestamp: new Date().toISOString(),
    language,
    domain: domain || 'General Commercial / Contract Law',
    jurisdiction: jurisdiction || 'General Jurisprudence',
    originalText: origClean,
    simplifiedText: simpClean,
    legalContext,
    lmpScore,
    preservationStatus,
    interpretation,
    humanReviewRecommended: preservationStatus !== 'preserved',
    humanReviewReason:
      preservationStatus !== 'preserved'
        ? `${criticalChanges.length} significant difference(s) detected between original legal force and simplified text.`
        : undefined,
    ruleExplanation:
      'Evaluated via ClauseX Deterministic Rule-Based Engine v1.0. Analysis examines deontic modality tokens (shall/must vs may/can), negation polarity, conditions precedent, exception carve-outs, numbers, and deadlines. Connect JUDGEBERT backend service for transformer regression embeddings.',
    sourceEngine: 'deterministic_demo_engine',
    criticalChanges,
    originalSpans,
    simplifiedSpans,
    deonticBreakdown: {
      originalObligations: origObligations,
      simplifiedObligations: simpObligations,
      originalPermissions: origPermissions,
      simplifiedPermissions: simpPermissions,
      originalProhibitions: origProhibitions,
      simplifiedProhibitions: simpProhibitions,
      shifts,
    },
    conditionsBreakdown: {
      originalConditions: origConditions,
      simplifiedConditions: simpConditions,
      originalExceptions: origExceptions,
      simplifiedExceptions: simpExceptions,
      droppedConditions,
      droppedExceptions,
    },
    entitiesBreakdown: {
      originalDates: origDates,
      simplifiedDates: simpDates,
      dateMismatches: missingDates,
      originalAmounts: origNumbers,
      simplifiedAmounts: simpNumbers,
      amountMismatches: missingNumbers,
      originalEntities: [],
      simplifiedEntities: [],
      entityMismatches: [],
    },
    summaryMetrics: {
      wordsOriginal: wordsOrig,
      wordsSimplified: wordsSimp,
      compressionRatio,
      criticalDifferencesCount: criticalChanges.filter((c) => c.severity === 'critical').length,
      warningDifferencesCount: criticalChanges.filter((c) => c.severity === 'warning').length,
      infoDifferencesCount: criticalChanges.filter((c) => c.severity === 'info').length,
    },
  };
}
