from typing import List, Dict, Any, Tuple
from app.models.schemas import CriticalChange
from app.core.deontic_detector import extract_matches

EN_CONDITIONS = [
    "provided that", "on condition that", "subject to", "in the event that",
    "in the event of", "if", "assuming that", "so long as", "contingent upon",
    "prior to", "conditioned upon", "upon receipt of", "upon satisfaction of"
]

EN_EXCEPTIONS = [
    "except during", "except when", "except if", "except where", "except that",
    "except as", "except for", "except in the case of", "except upon", "except",
    "unless", "excluding", "save for", "other than", "carve-out",
    "notwithstanding the foregoing", "without prejudice to"
]

HI_CONDITIONS = [
    "यदि", "अगर", "बशर्ते", "की शर्त पर", "स्थिति में", "सहमति के बिना",
    "मामले में", "शर्त के अधीन"
]

HI_EXCEPTIONS = [
    "सिवाय", "को छोड़कर", "इसके अतिरिक्त", "के अलावा", "बशर्ते कि नहीं"
]

def detect_conditions_and_exceptions(
    orig_text: str,
    simp_text: str,
    language: str = "en"
) -> Tuple[Dict[str, List[str]], List[CriticalChange], float]:
    is_hindi = language == "hi"
    cond_list = HI_CONDITIONS if is_hindi else EN_CONDITIONS
    exc_list = HI_EXCEPTIONS if is_hindi else EN_EXCEPTIONS

    orig_cond = extract_matches(orig_text, cond_list)
    simp_cond = extract_matches(simp_text, cond_list)

    orig_exc = extract_matches(orig_text, exc_list)
    simp_exc = extract_matches(simp_text, exc_list)

    dropped_cond = [c for c in orig_cond if c not in simp_cond]
    dropped_exc = [e for e in orig_exc if e not in simp_exc]

    critical_changes: List[CriticalChange] = []
    penalty = 0.0

    # 1. Condition Precedent dropped
    if dropped_cond:
        critical_changes.append(
            CriticalChange(
                id="cc-condition-dropped",
                category="condition",
                severity="critical",
                title="शर्त विलोपन (Condition Removed)" if is_hindi else "Condition Precedent Removed",
                originalExcerpt=", ".join(dropped_cond),
                simplifiedExcerpt="Missing conditional clause",
                explanation=(
                    "मूल प्रावधान में आवश्यक पूर्व-शर्त थी जिसे सरल पाठ में हटा दिया गया है।"
                    if is_hindi else
                    f"The original clause stipulated essential conditions precedent ({', '.join(dropped_cond)}), but these were omitted during simplification."
                ),
                legalSignificance="Converts a conditional contractual duty into an absolute, unconditional guarantee.",
                evidenceSource="condition_removal"
            )
        )
        penalty += 3.0

    # 2. Exception omitted
    if dropped_exc:
        critical_changes.append(
            CriticalChange(
                id="cc-exception-dropped",
                category="exception",
                severity="critical",
                title="अपवाद का लोप (Exception Omitted)" if is_hindi else "Substantive Legal Exception Omitted",
                originalExcerpt=", ".join(dropped_exc),
                simplifiedExcerpt="Unqualified general statement",
                explanation=(
                    "मूल नियम का अपवाद सरल पाठ में छोड़ दिया गया।"
                    if is_hindi else
                    f"A crucial legal carve-out or defense ({', '.join(dropped_exc)}) was removed, creating an overbroad unqualified rule."
                ),
                legalSignificance="Failing to preserve exceptions deprives parties of legal defenses and contractual safe harbors.",
                evidenceSource="condition_removal"
            )
        )
        penalty += 2.8

    breakdown = {
        "originalConditions": orig_cond,
        "simplifiedConditions": simp_cond,
        "originalExceptions": orig_exc,
        "simplifiedExceptions": simp_exc,
        "droppedConditions": dropped_cond,
        "droppedExceptions": dropped_exc,
    }

    return breakdown, critical_changes, penalty
