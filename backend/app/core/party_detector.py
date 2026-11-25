import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import CriticalChange

COMMON_LEGAL_ENTITIES = [
    "Seller", "Buyer", "Customer", "Provider", "Supplier", "Vendor",
    "Licensor", "Licensee", "Tenant", "Landlord", "Company", "Employee",
    "Contractor", "Client", "Disclosing Party", "Receiving Party",
    "Borrower", "Lender", "Indemnifying Party", "Indemnified Party",
    "विक्रेता", "क्रेता", "ग्राहक", "कंपनी", "कर्मचारी", "किरायेदार", "मकान मालिक"
]

def extract_parties(text: str) -> List[str]:
    # Extract entities in order of appearance in the text
    found = []
    # Search for all entity matches with their start positions
    matches = []
    for entity in COMMON_LEGAL_ENTITIES:
        pattern = r"\b" + re.escape(entity) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            matches.append((m.start(), entity))
    matches.sort(key=lambda x: x[0])
    for _, entity in matches:
        if entity not in found:
            found.append(entity)
    return found

def detect_party_shifts(
    orig_text: str,
    simp_text: str,
    language: str = "en"
) -> Tuple[Dict[str, List[str]], List[CriticalChange], float]:
    orig_parties = extract_parties(orig_text)
    simp_parties = extract_parties(simp_text)

    missing_parties = [p for p in orig_parties if not any(p.lower() == sp.lower() for sp in simp_parties)]
    critical_changes: List[CriticalChange] = []
    penalty = 0.0

    # 1. Role swap: same entities present, but primary obligor / subject inverted
    if len(orig_parties) >= 2 and len(simp_parties) >= 2:
        if orig_parties[0].lower() != simp_parties[0].lower():
            critical_changes.append(
                CriticalChange(
                    id="cc-party-role-inversion",
                    category="entity",
                    severity="critical",
                    title="Contractual Role Inversion / Party Substitution",
                    originalExcerpt=f"Primary performing party: {orig_parties[0]} (beneficiary: {orig_parties[1]})",
                    simplifiedExcerpt=f"Inverted performing party: {simp_parties[0]} (beneficiary: {simp_parties[1]})",
                    explanation=(
                        f"The legal obligation was originally assigned to {orig_parties[0]}, but in the simplified text "
                        f"it has been reassigned to {simp_parties[0]}. This inverts the burden of performance."
                    ),
                    legalSignificance="Completely shifts liability and indemnification burdens to the counterparty.",
                    evidenceSource="entity_check"
                )
            )
            penalty += 3.8
    # 2. Entity substitution: different entities
    elif len(orig_parties) > 0 and len(simp_parties) > 0 and set(p.lower() for p in orig_parties) != set(p.lower() for p in simp_parties):
        critical_changes.append(
            CriticalChange(
                id="cc-party-shift",
                category="entity",
                severity="critical",
                title="Responsible Party Shift / Role Substitution",
                originalExcerpt=", ".join(orig_parties),
                simplifiedExcerpt=", ".join(simp_parties),
                explanation=f"The operative legal parties in the clause shifted from {', '.join(orig_parties)} to {', '.join(simp_parties)}.",
                legalSignificance="Altering the named entity misallocates liability and duty of performance between contracting parties.",
                evidenceSource="entity_check"
            )
        )
        penalty += 3.2
    # 3. Named party generalized to passive voice
    elif missing_parties and len(simp_parties) == 0:
        critical_changes.append(
            CriticalChange(
                id="cc-party-generalized",
                category="entity",
                severity="warning",
                title="Responsible Entity Generalized or Omitted",
                originalExcerpt=", ".join(missing_parties),
                simplifiedExcerpt="Passive voice / generic pronoun",
                explanation=f"Named legal entities ({', '.join(missing_parties)}) were replaced with passive phrasing or unspecified actors.",
                legalSignificance="Ambiguity regarding who must perform increases litigation risk under privity of contract doctrine.",
                evidenceSource="entity_check"
            )
        )
        penalty += 2.0

    breakdown = {
        "originalEntities": orig_parties,
        "simplifiedEntities": simp_parties,
        "entityMismatches": missing_parties,
    }

    return breakdown, critical_changes, penalty
