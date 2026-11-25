import { AnalysisResult } from '@/types/analysis';

export function downloadJson(data: unknown, filename: string): void {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(markdown: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(headers: string[], rows: (string | number)[][], filename: string): void {
  if (typeof window === 'undefined') return;
  const escapeCsv = (val: string | number) => {
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  const content = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateAnalysisMarkdownReport(analysis: AnalysisResult): string {
  const isDemo = analysis.sourceEngine === 'deterministic_demo_engine';

  return `# CLAUSEX AI — LEGAL MEANING PRESERVATION REPORT
**Analysis Reference:** \`${analysis.id}\`  
**Timestamp:** ${new Date(analysis.timestamp).toUTCString()}  
**Language:** ${analysis.language.toUpperCase()}  
**Domain:** ${analysis.domain || 'General Legal / Commercial'}  
**Engine:** ${isDemo ? 'ClauseX Deterministic Heuristic Demo Engine (Research Prototype)' : 'JUDGEBERT Transformer Regression Model'}

---

## 1. EVALUATION SUMMARY
- **Legal Meaning Preservation (LMP) Score:** **${analysis.lmpScore.toFixed(1)} / 10.0**
- **Preservation Status:** **${analysis.preservationStatus.replace('_', ' ').toUpperCase()}**
- **Human Review Recommendation:** ${analysis.humanReviewRecommended ? 'CRITICAL / MANDATORY' : 'Routine'}
- **Interpretation:** ${analysis.interpretation}

---

## 2. ORIGINAL CLAUSE TEXT
> ${analysis.originalText}

## 3. SIMPLIFIED CLAUSE TEXT
> ${analysis.simplifiedText}

---

## 4. DETECTED CRITICAL & NOTABLE DIFFERENCES (${analysis.criticalChanges.length})
${
  analysis.criticalChanges.length === 0
    ? '_No critical deontic shifts, negation changes, or condition removals detected._'
    : analysis.criticalChanges
        .map(
          (c, i) => `### ${i + 1}. [${c.severity.toUpperCase()}] ${c.title}
- **Category:** ${c.category}
- **Original Excerpt:** "${c.originalExcerpt}"
- **Simplified Excerpt:** "${c.simplifiedExcerpt}"
- **Explanation:** ${c.explanation}
- **Legal Significance:** ${c.legalSignificance}
- **Evidence Source:** \`${c.evidenceSource}\`
`
        )
        .join('\n')
}

---

## 5. OPERATIVE MODALITY & CONDITION COMPARISON
- **Original Obligations:** ${analysis.deonticBreakdown.originalObligations.join(', ') || 'None explicit'}
- **Simplified Obligations:** ${analysis.deonticBreakdown.simplifiedObligations.join(', ') || 'None explicit'}
- **Original Permissions:** ${analysis.deonticBreakdown.originalPermissions.join(', ') || 'None explicit'}
- **Simplified Permissions:** ${analysis.deonticBreakdown.simplifiedPermissions.join(', ') || 'None explicit'}
- **Original Conditions Precedent:** ${analysis.conditionsBreakdown.originalConditions.join(', ') || 'None'}
- **Dropped Conditions:** ${analysis.conditionsBreakdown.droppedConditions.join(', ') || 'None'}
- **Dropped Exceptions:** ${analysis.conditionsBreakdown.droppedExceptions.join(', ') || 'None'}

---

## 6. RESEARCH PROTOTYPE & LEGAL LIMITATIONS DISCLAIMER
${
  isDemo
    ? '> **NOTICE:** This report was produced by an illustrative deterministic demo analyzer. It does NOT represent trained JUDGEBERT inference or official legal counsel. Do not rely on these results as legal advice.'
    : '> **NOTICE:** This automated report is produced by a research AI prototype for explainable legal review. It is intended to assist human attorneys, not replace legal professionals or provide definitive legal advice.'
}
`;
}
