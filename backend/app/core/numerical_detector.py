import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import CriticalChange

CURRENCY_NUMBER_REGEX = re.compile(r"(?:\$|₹|€|£)?\b\d+(?:,\d{3})*(?:\.\d+)?%?\b", re.IGNORECASE)
DEADLINE_REGEX = re.compile(
    r"\b\d+\s*(?:business|calendar)?\s*(?:days|months|years|weeks|hours|दिन|माह|साल|घंटे)\b",
    re.IGNORECASE
)

# Number word mappings for English and Hindi
NUMBER_UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    # Hindi basic numbers
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छह": 6, "सात": 7,
    "आठ": 8, "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "पंद्रह": 15, "बीस": 20,
    "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100
}

NUMBER_TENS = {
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90
}

def normalize_numbers(text: str) -> str:
    """
    Normalizes spelled-out number words (e.g., 'seven', 'thirty', 'twenty-one')
    into numeric digits ('7', '30', '21') to ensure equivalence matching in
    deadlines, timeframes, and numerical expressions.
    """
    # 1. Compound numbers like twenty-one or thirty five
    def replace_compound(m):
        t = NUMBER_TENS[m.group(1).lower()]
        u = NUMBER_UNITS[m.group(2).lower()]
        return str(t + u)

    comp_pattern = re.compile(
        r'\b(' + '|'.join(NUMBER_TENS.keys()) + r')[-\s](' + '|'.join(list(NUMBER_UNITS.keys())[:10]) + r')\b',
        re.IGNORECASE
    )
    text = comp_pattern.sub(replace_compound, text)

    # 2. Standalone tens (twenty, thirty, etc.)
    tens_pattern = re.compile(r'\b(' + '|'.join(NUMBER_TENS.keys()) + r')\b', re.IGNORECASE)
    text = tens_pattern.sub(lambda m: str(NUMBER_TENS[m.group(1).lower()]), text)

    # 3. Units and teens (one, two, seven, twelve, etc.)
    units_pattern = re.compile(r'\b(' + '|'.join(NUMBER_UNITS.keys()) + r')\b', re.IGNORECASE)
    text = units_pattern.sub(lambda m: str(NUMBER_UNITS[m.group(1).lower()]), text)

    return text

def extract_regex(text: str, regex: re.Pattern) -> List[str]:
    matches = regex.findall(text)
    return list(dict.fromkeys([m.strip() for m in matches]))

def detect_numerical_and_deadlines(
    orig_text: str,
    simp_text: str,
    language: str = "en"
) -> Tuple[Dict[str, List[str]], List[CriticalChange], float]:
    # Normalize written number words to digits before comparison
    norm_orig = normalize_numbers(orig_text)
    norm_simp = normalize_numbers(simp_text)

    orig_nums = extract_regex(norm_orig, CURRENCY_NUMBER_REGEX)
    simp_nums = extract_regex(norm_simp, CURRENCY_NUMBER_REGEX)
    missing_nums = [n for n in orig_nums if n not in simp_nums]

    orig_dates = extract_regex(norm_orig, DEADLINE_REGEX)
    simp_dates = extract_regex(norm_simp, DEADLINE_REGEX)
    missing_dates = [d for d in orig_dates if d not in simp_dates]

    critical_changes: List[CriticalChange] = []
    penalty = 0.0

    # 1. Monetary and Numerical Threshold Discrepancy
    orig_curr = [n for n in orig_nums if any(c in n for c in ["$", "₹", "€", "£"])]
    simp_curr = [n for n in simp_nums if any(c in n for c in ["$", "₹", "€", "£"])]

    if orig_curr and simp_curr and orig_curr != simp_curr:
        critical_changes.append(
            CriticalChange(
                id="cc-monetary-alteration",
                category="monetary",
                severity="critical",
                title="Monetary Amount / Cap Discrepancy",
                originalExcerpt=", ".join(orig_curr),
                simplifiedExcerpt=", ".join(simp_curr),
                explanation=f"The financial threshold was altered from {', '.join(orig_curr)} to {', '.join(simp_curr)}.",
                legalSignificance="Directly distorts financial remedy caps, liquidated damages, or agreed payment schedules.",
                evidenceSource="textual_diff"
            )
        )
        penalty += 3.5
    elif missing_nums and len(missing_nums) > 0 and orig_nums and not simp_nums:
        critical_changes.append(
            CriticalChange(
                id="cc-number-omitted",
                category="monetary",
                severity="warning",
                title="Numerical Specificity Lost",
                originalExcerpt=", ".join(missing_nums),
                simplifiedExcerpt="Missing numerical specifications",
                explanation=f"Specific statutory or contractual numbers ({', '.join(missing_nums)}) were omitted during simplification.",
                legalSignificance="Reduces enforceable precision, leaving quantitative obligations ambiguous.",
                evidenceSource="textual_diff"
            )
        )
        penalty += 2.2

    # 2. Deadline & Notice Period Differences
    if orig_dates and not simp_dates:
        critical_changes.append(
            CriticalChange(
                id="cc-deadline-dropped",
                category="deadline",
                severity="warning",
                title="Time Limit or Notice Period Removed",
                originalExcerpt=", ".join(orig_dates),
                simplifiedExcerpt="Unspecified timeframe / promptly",
                explanation=f"The precise operative timeline ({', '.join(orig_dates)}) was eliminated.",
                legalSignificance="Removes strict time-is-of-the-essence protections, risking forfeiture of cure periods.",
                evidenceSource="textual_diff"
            )
        )
        penalty += 2.5
    elif orig_dates and simp_dates and orig_dates != simp_dates:
        critical_changes.append(
            CriticalChange(
                id="cc-deadline-altered",
                category="deadline",
                severity="warning",
                title="Time Limit or Notice Period Altered",
                originalExcerpt=", ".join(orig_dates),
                simplifiedExcerpt=", ".join(simp_dates),
                explanation=f"Original timeline ({', '.join(orig_dates)}) was changed to ({', '.join(simp_dates)}).",
                legalSignificance="Modifies statutory cure windows or dispute escalation deadlines.",
                evidenceSource="textual_diff"
            )
        )
        penalty += 2.0

    breakdown = {
        "originalDates": orig_dates,
        "simplifiedDates": simp_dates,
        "dateMismatches": missing_dates,
        "originalAmounts": orig_nums,
        "simplifiedAmounts": simp_nums,
        "amountMismatches": missing_nums,
    }

    return breakdown, critical_changes, penalty
