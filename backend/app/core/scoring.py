from typing import List, Tuple
from app.models.schemas import CriticalChange, PreservationStatus

def calculate_lmp_score(
    critical_changes: List[CriticalChange],
    deductions: float,
    compression_ratio: float
) -> Tuple[float, PreservationStatus, str]:
    # Excessive truncation penalty if compression is extreme (< 30%) with no other changes
    if compression_ratio < 30.0 and len(critical_changes) == 0:
        deductions += 1.5

    raw_score = 10.0 - deductions
    if raw_score < 1.0:
        raw_score = 1.0
    elif raw_score > 10.0:
        raw_score = 10.0

    lmp_score = round(raw_score, 1)

    has_critical = any(c.severity == "critical" for c in critical_changes)
    has_warning = any(c.severity == "warning" for c in critical_changes)

    if lmp_score < 6.0 or has_critical:
        preservation_status: PreservationStatus = "critical_alteration"
        interpretation = (
            "CAUTION: Potential critical legal alteration detected. The simplified text modifies essential "
            "operative duties (e.g. duty relaxation, dropped exceptions, altered liability, or changed responsible parties). "
            "It is not recommended to execute or rely on the simplified version without formal legal review."
        )
    elif lmp_score < 8.5 or has_warning:
        preservation_status = "subtle_shift"
        interpretation = (
            "The simplified text communicates the general business meaning, but introduces subtle shifts in phrasing, "
            "deadlines, or secondary qualifications that warrant careful review by legal counsel."
        )
    else:
        preservation_status = "preserved"
        interpretation = (
            "The simplified text preserves operative legal obligations, conditions, and core legal intent with high fidelity. "
            "No critical deontic shifts, dropped conditions, or altered liabilities were detected."
        )

    return lmp_score, preservation_status, interpretation
