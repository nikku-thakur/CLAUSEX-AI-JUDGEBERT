import re
from typing import List, Tuple
from app.models.schemas import TextSpan, CriticalChange

def tokenize(text: str) -> List[str]:
    # Retain punctuation, words, and whitespace as individual tokens
    return re.findall(r'[\w$€₹\d%]+|[.,!?;:()"]|\s+', text) or []

def compute_spans(
    original: str,
    simplified: str,
    critical_changes: List[CriticalChange]
) -> Tuple[List[TextSpan], List[TextSpan]]:
    orig_tokens = tokenize(original)
    simp_tokens = tokenize(simplified)

    orig_words = [t for t in orig_tokens if not t.isspace()]
    simp_words = [t for t in simp_tokens if not t.isspace()]

    orig_set = set(w.lower() for w in orig_words)
    simp_set = set(w.lower() for w in simp_words)

    orig_spans: List[TextSpan] = []
    for token in orig_tokens:
        if token.isspace():
            orig_spans.append(TextSpan(text=token, type="unchanged"))
            continue

        lower = token.lower()
        is_missing = lower not in simp_set

        # Check if this token matches a critical change excerpt
        matched_crit = next(
            (c for c in critical_changes if len(lower) > 3 and lower in c.originalExcerpt.lower()),
            None
        )

        if matched_crit:
            orig_spans.append(
                TextSpan(
                    text=token,
                    type="removed",
                    category=matched_crit.category,
                    severity=matched_crit.severity,
                    explanation=matched_crit.explanation
                )
            )
        elif is_missing:
            orig_spans.append(
                TextSpan(
                    text=token,
                    type="removed",
                    severity="info",
                    explanation="Omitted or rephrased during simplification"
                )
            )
        else:
            orig_spans.append(TextSpan(text=token, type="unchanged"))

    simp_spans: List[TextSpan] = []
    for token in simp_tokens:
        if token.isspace():
            simp_spans.append(TextSpan(text=token, type="unchanged"))
            continue

        lower = token.lower()
        is_new = lower not in orig_set

        matched_crit = next(
            (c for c in critical_changes if len(lower) > 3 and lower in c.simplifiedExcerpt.lower()),
            None
        )

        if matched_crit:
            simp_spans.append(
                TextSpan(
                    text=token,
                    type="added",
                    category=matched_crit.category,
                    severity=matched_crit.severity,
                    explanation=matched_crit.explanation
                )
            )
        elif is_new:
            simp_spans.append(
                TextSpan(
                    text=token,
                    type="added",
                    severity="info",
                    explanation="Added or substituted phrasing in simplified text"
                )
            )
        else:
            simp_spans.append(TextSpan(text=token, type="unchanged"))

    return orig_spans, simp_spans
