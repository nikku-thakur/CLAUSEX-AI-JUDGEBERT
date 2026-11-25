import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import CriticalChange, DeonticShift

EN_OBLIGATIONS = [
    "shall", "must", "is required to", "are required to", "will be obliged to",
    "agrees to", "covenants to", "covenants and agrees", "undertakes to", "is obligated to",
    "have an obligation to", "has an obligation to"
]

EN_PERMISSIONS = [
    "may", "can", "is permitted to", "are permitted to", "at its sole discretion",
    "at its election", "is authorized to", "has the right to", "optional", "entitled to"
]

EN_PROHIBITIONS = [
    "shall not", "must not", "may not", "under no circumstances", "is prohibited from",
    "will not", "cannot", "not permitted to", "in no event shall", "no party shall"
]

HI_OBLIGATIONS = [
    "होगा", "होगी", "होंगे", "अनिवार्य रूप से", "बाध्य होगा", "बाध्य होगी",
    "कर्तव्य होगा", "आवश्यक है", "करना पड़ेगा", "देना होगा", "वापस करेगा"
]

HI_PERMISSIONS = [
    "सकता है", "सकती है", "सकते हैं", "हकदार होगा", "छूट होगी", "अनुमति है",
    "अपनी सुविधा अनुसार", "अधिकार होगा", "ऐच्छिक है"
]

HI_PROHIBITIONS = [
    "नहीं करेगा", "नहीं कर सकता", "प्रतिबंधित है", "मनाही है", "वर्जित है",
    "अधिकार नहीं होगा", "नहीं देगा", "किसी भी परिस्थिति में नहीं"
]

def extract_matches(text: str, patterns: List[str]) -> List[str]:
    lower = text.lower()
    matched = []
    for pat in patterns:
        # Check whole word boundary for single short words like 'may', 'shall', 'can'
        if len(pat) <= 5 and re.match(r'^[a-zA-Z]+$', pat):
            if re.search(r'\b' + re.escape(pat.lower()) + r'\b', lower):
                matched.append(pat)
        else:
            if pat.lower() in lower:
                matched.append(pat)
    return list(dict.fromkeys(matched))


def detect_deontic_shifts(
    orig_text: str,
    simp_text: str,
    language: str = "en"
) -> Tuple[Dict[str, List[str]], List[DeonticShift], List[CriticalChange], float]:
    is_hindi = language == "hi"
    ob_list = HI_OBLIGATIONS if is_hindi else EN_OBLIGATIONS
    perm_list = HI_PERMISSIONS if is_hindi else EN_PERMISSIONS
    prohib_list = HI_PROHIBITIONS if is_hindi else EN_PROHIBITIONS

    orig_ob = extract_matches(orig_text, ob_list)
    simp_ob = extract_matches(simp_text, ob_list)

    orig_perm = extract_matches(orig_text, perm_list)
    simp_perm = extract_matches(simp_text, perm_list)

    orig_prohib = extract_matches(orig_text, prohib_list)
    simp_prohib = extract_matches(simp_text, prohib_list)

    shifts: List[DeonticShift] = []
    critical_changes: List[CriticalChange] = []
    penalty = 0.0

    orig_lower = orig_text.lower()
    simp_lower = simp_text.lower()

    # 1. Obligation weakened to permission (shall/must -> may/can)
    has_orig_ob = len(orig_ob) > 0 or ("shall" in orig_lower or "must" in orig_lower or "अनिवार्य" in orig_text)
    has_simp_ob = len(simp_ob) > 0 or ("shall" in simp_lower or "must" in simp_lower or "अनिवार्य" in simp_text)
    has_simp_perm = len(simp_perm) > 0 or ("may" in simp_lower or "can" in simp_lower or "सकती" in simp_text or "सकता" in simp_text)

    if has_orig_ob and not has_simp_ob and has_simp_perm:
        critical_changes.append(
            CriticalChange(
                id=f"cc-deontic-weakening",
                category="obligation",
                severity="critical",
                title="बाध्यता में दुर्बलता (Shall to May)" if is_hindi else "Deontic Weakening: Mandatory Duty Relaxed to Discretion",
                originalExcerpt=orig_ob[0] if orig_ob else ("अनिवार्य रूप से" if is_hindi else "shall / must"),
                simplifiedExcerpt=simp_perm[0] if simp_perm else ("सकती है" if is_hindi else "may / can"),
                explanation=(
                    "मूल अनुबंध में अनिवार्य कर्तव्य था, जिसे सरल पाठ में ऐच्छिक बना दिया गया।"
                    if is_hindi else
                    'The original clause imposes a binding legal obligation ("shall/must"). The simplified text reduces this to discretionary permission ("may/can"), eliminating enforceable liability for non-performance.'
                ),
                legalSignificance="Eliminates breach-of-contract remedies by converting enforceable covenants into optional acts.",
                evidenceSource="deontic_shift"
            )
        )
        shifts.append(
            DeonticShift(
                from_="Obligation (Shall / Must)" if not is_hindi else "अनिवार्य कर्तव्य",
                to="Permission (May / Can)" if not is_hindi else "ऐच्छिक अनुमति",
                impact="Mandatory obligation converted to discretionary choice",
                severity="critical"
            )
        )
        penalty += 3.8

    # 2. Permission converted to obligation (may -> shall/must/required)
    has_orig_perm = len(orig_perm) > 0 or ("may" in orig_lower or "optional" in orig_lower or "सकती" in orig_text)
    if has_orig_perm and not has_orig_ob and has_simp_ob:
        critical_changes.append(
            CriticalChange(
                id=f"cc-deontic-hardening",
                category="permission",
                severity="critical",
                title="अनुमति का बाध्यता में परिवर्तन" if is_hindi else "Discretionary Permission Converted into Mandatory Obligation",
                originalExcerpt=orig_perm[0] if orig_perm else ("सकती है" if is_hindi else "may / optional"),
                simplifiedExcerpt=simp_ob[0] if simp_ob else ("होगा / आवश्यक" if is_hindi else "is required to / must"),
                explanation=(
                    "मूल अधिकार को सरल पाठ में एक अनिवार्य कानूनी दायित्व में बदल दिया गया।"
                    if is_hindi else
                    "The original granted an elective discretionary right. The simplified clause inadvertently creates an affirmative mandatory duty."
                ),
                legalSignificance="Imposes unexpected continuous compliance duties and unintended breach liabilities.",
                evidenceSource="deontic_shift"
            )
        )
        shifts.append(
            DeonticShift(
                from_="Permission (May / Elective)" if not is_hindi else "ऐच्छिक अनुमति",
                to="Obligation (Required / Must)" if not is_hindi else "अनिवार्य बाध्यता",
                impact="Elective privilege burdened with mandatory performance",
                severity="critical"
            )
        )
        penalty += 3.5

    # 3. Prohibition removed or inverted
    has_orig_prohib = len(orig_prohib) > 0 or ("under no circumstances" in orig_lower or "in no event" in orig_lower or "shall not" in orig_lower)
    has_simp_prohib = len(simp_prohib) > 0 or ("shall not" in simp_lower or "must not" in simp_lower or "प्रतिबंधित" in simp_text)

    if has_orig_prohib and not has_simp_prohib:
        critical_changes.append(
            CriticalChange(
                id=f"cc-prohibition-omitted",
                category="prohibition",
                severity="critical",
                title="निषेध की अनुपस्थिति / विलोपन" if is_hindi else "Negative Prohibition or Disclaimer Omitted",
                originalExcerpt=orig_prohib[0] if orig_prohib else ("प्रतिबंधित है" if is_hindi else "shall not / under no circumstances"),
                simplifiedExcerpt="Omitted or stated affirmatively",
                explanation=(
                    "मूल पाठ का स्पष्ट निषेध सरल पाठ में गायब है।"
                    if is_hindi else
                    "The original clause contained an express negative bar or liability disclaimer. The simplified version eliminated the prohibition."
                ),
                legalSignificance="Exposes the party to uncapped liability or authorizes previously forbidden conduct.",
                evidenceSource="negation_inversion"
            )
        )
        penalty += 4.5

    breakdown = {
        "originalObligations": orig_ob,
        "simplifiedObligations": simp_ob,
        "originalPermissions": orig_perm,
        "simplifiedPermissions": simp_perm,
        "originalProhibitions": orig_prohib,
        "simplifiedProhibitions": simp_prohib,
    }

    return breakdown, shifts, critical_changes, penalty
