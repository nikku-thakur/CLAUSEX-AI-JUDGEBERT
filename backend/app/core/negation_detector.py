import re
from typing import List, Tuple
from app.models.schemas import CriticalChange

EN_NEGATIONS = [
    r"\bnot\b", r"\bno\b", r"\bneither\b", r"\bnor\b", r"\bnever\b",
    r"\bnone\b", r"\bwithout\b", r"\bcannot\b", r"\bunauthorized\b",
    r"\bnon-exclusive\b", r"\bprohibited\b", r"\bunlawful\b"
]

HI_NEGATIONS = [
    r"नहीं", r"न\b", r"बिना", r"ना\b", r"वर्जित", r"मना"
]

def count_negations(text: str, language: str = "en") -> int:
    patterns = HI_NEGATIONS if language == "hi" else EN_NEGATIONS
    count = 0
    lower = text.lower()
    for pat in patterns:
        count += len(re.findall(pat, lower))
    return count

def detect_negation_inversion(
    orig_text: str,
    simp_text: str,
    language: str = "en"
) -> Tuple[List[CriticalChange], float]:
    orig_neg = count_negations(orig_text, language)
    simp_neg = count_negations(simp_text, language)

    critical_changes: List[CriticalChange] = []
    penalty = 0.0

    # Polarity switch: original has clear negative assertion, simplified has zero negation
    if orig_neg > 0 and simp_neg == 0:
        # Check if text is not trivial
        if len(orig_text.split()) > 3:
            critical_changes.append(
                CriticalChange(
                    id="cc-negation-inversion",
                    category="negation",
                    severity="critical",
                    title="नकारात्मकता का लोप / ध्रुवता परिवर्तन" if language == "hi" else "Negation Polarity Inversion",
                    originalExcerpt=f"Contained {orig_neg} negative modifier(s)",
                    simplifiedExcerpt="Zero negative modifiers (Affirmative statement)",
                    explanation=(
                        "मूल पाठ में नकारात्मक प्रतिबंध या अस्वीकरण था जो सरल पाठ में सकारात्मक बना दिया गया।"
                        if language == "hi" else
                        "The original clause contained explicit negative qualifiers or restrictions which were dropped, inverting the legal polarity."
                    ),
                    legalSignificance="Inverting negation completely reverses rights and liabilities under contract law.",
                    evidenceSource="negation_inversion"
                )
            )
            penalty += 4.2

    return critical_changes, penalty
