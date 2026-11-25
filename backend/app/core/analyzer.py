import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    AnalyzePayload,
    AnalysisResult,
    DeonticModalityBreakdown,
    ConditionsExceptionsBreakdown,
    EntitiesDatesAmountsBreakdown,
    SummaryMetrics,
)
from app.core.deontic_detector import detect_deontic_shifts
from app.core.condition_detector import detect_conditions_and_exceptions
from app.core.negation_detector import detect_negation_inversion
from app.core.numerical_detector import detect_numerical_and_deadlines
from app.core.party_detector import detect_party_shifts
from app.core.span_aligner import compute_spans
from app.core.scoring import calculate_lmp_score

def analyze_clause_pair(payload: AnalyzePayload) -> AnalysisResult:
    orig = payload.originalText.strip()
    simp = payload.simplifiedText.strip()
    lang = payload.language

    # Spanish lexical rule detectors are not implemented. Do not run English patterns
    # against Spanish and present their results as meaningful checks.
    if lang == "es":
        deontic_bd = {"originalObligations": [], "simplifiedObligations": [], "originalPermissions": [], "simplifiedPermissions": [], "originalProhibitions": [], "simplifiedProhibitions": []}
        shifts, deontic_crit, deontic_pen = [], [], 0.0
        cond_bd = {"originalConditions": [], "simplifiedConditions": [], "originalExceptions": [], "simplifiedExceptions": [], "droppedConditions": [], "droppedExceptions": []}
        cond_crit, cond_pen, neg_crit, neg_pen = [], 0.0, [], 0.0
        num_bd = {"originalAmounts": [], "simplifiedAmounts": [], "dateMismatches": [], "originalDates": [], "simplifiedDates": [], "amountMismatches": []}
        num_crit, num_pen = [], 0.0
        party_bd = {"originalEntities": [], "simplifiedEntities": [], "entityMismatches": []}
        party_crit, party_pen = [], 0.0
    else:
        # Existing English and partial Hindi rule checks.
        deontic_bd, shifts, deontic_crit, deontic_pen = detect_deontic_shifts(orig, simp, lang)
        cond_bd, cond_crit, cond_pen = detect_conditions_and_exceptions(orig, simp, lang)
        neg_crit, neg_pen = detect_negation_inversion(orig, simp, lang)
        num_bd, num_crit, num_pen = detect_numerical_and_deadlines(orig, simp, lang)
        party_bd, party_crit, party_pen = detect_party_shifts(orig, simp, lang)

    # Aggregate critical changes
    all_critical = deontic_crit + cond_crit + neg_crit + num_crit + party_crit
    total_penalty = deontic_pen + cond_pen + neg_pen + num_pen + party_pen

    # Word stats
    words_orig = len(orig.split())
    words_simp = len(simp.split())
    compression = round((words_simp / words_orig * 100), 1) if words_orig > 0 else 100.0

    # 6. LMP Score & Status (Rule-based)
    lmp_score, status, interp = calculate_lmp_score(all_critical, total_penalty, compression)

    # 7. Neural model: preserve English v2; use the separate XLM-R checkpoint for Hindi/Spanish.
    neural_pred = None
    if lang in ("en", "hi", "es"):
        try:
            if lang == "en":
                from ml.inference import JudgeBERTInference
                infer_engine = JudgeBERTInference.get_instance()
            else:
                from ml.inference import MultilingualJudgeBERTInference
                infer_engine = MultilingualJudgeBERTInference.get_instance()
            if infer_engine.is_available():
                neural_pred = infer_engine.predict_pair(orig, simp)
        except Exception:
            pass

    if lang in ("hi", "es") and neural_pred:
        # For these languages the direct multilingual model is the primary classifier.
        # Rule scores remain explanatory only (and Spanish lexical rules are intentionally omitted).
        lmp_score = neural_pred["lmpScore"]
        if neural_pred["status"] == "Critical Legal Alteration":
            status = "critical_alteration"
        elif neural_pred["status"] == "Semantic Drift / Ambiguity":
            status = "subtle_shift"
        else:
            status = "preserved"
        interp = neural_pred["interpretation"]
        if lang == "hi" and any(change.severity == "critical" for change in all_critical):
            # Keep positive findings from the existing partial Hindi rules from being
            # erased by a conflicting neural prediction.
            status = "critical_alteration"
            lmp_score = min(lmp_score, 3.9)
            interp = "The experimental multilingual model and/or the partial Hindi rule checks flag a possible legal meaning change; obtain independent legal review."
        elif lang == "hi" and status == "critical_alteration":
            # The Hindi checkpoint has weak held-out XNLI results and its direct
            # prediction is not calibrated as a legal finding. Do not label a pair
            # as a confirmed critical alteration based only on this experimental
            # classifier when the partial Hindi rules found no critical difference.
            # Keep its score and probabilities intact for transparency, but surface
            # the disagreement as a review-required subtle shift.
            status = "subtle_shift"
            contradiction_probability = neural_pred.get("probabilities", {}).get("contradiction", 0.0)
            interp = (
                "The experimental Hindi model predicted possible contradiction "
                f"({contradiction_probability:.1%}), but the partial Hindi rule checks found no critical difference. "
                "This model-only signal is not a confirmed legal alteration; obtain independent legal review."
            )
    elif lang in ("hi", "es"):
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="The experimental Hindi/Spanish JudgeBERT v3 checkpoint is not available. Train or install the multilingual checkpoint before analyzing these languages.")


    # 8. Word-level text spans for visual diff
    orig_spans, simp_spans = compute_spans(orig, simp, all_critical)


    # Categorize preserved, changed, missing elements for Phase 5 API Contract
    preserved_elements = []
    changed_elements = []
    missing_elements = []

    # Preserved obligations
    for ob in deontic_bd["originalObligations"]:
        if ob in deontic_bd["simplifiedObligations"]:
            preserved_elements.append(f"Obligation: '{ob}'")
        elif deontic_bd["simplifiedObligations"] and not any(s.severity == "critical" for s in shifts):
            # Equivalent obligation preserved with different phrasing (e.g. "must" -> "is required to")
            simp_obs_str = ", ".join(deontic_bd["simplifiedObligations"])
            preserved_elements.append(f"Obligation: '{ob}' preserved as equivalent duty ('{simp_obs_str}')")
        else:
            changed_elements.append(f"Obligation: '{ob}' modified or omitted")

    # Preserved conditions
    for cond in cond_bd["originalConditions"]:
        if cond in cond_bd["simplifiedConditions"]:
            preserved_elements.append(f"Condition: '{cond}'")
        else:
            missing_elements.append(f"Condition: '{cond}' dropped")

    # Preserved exceptions
    for exc in cond_bd["originalExceptions"]:
        if exc in cond_bd["simplifiedExceptions"]:
            preserved_elements.append(f"Exception: '{exc}'")
        else:
            missing_elements.append(f"Exception: '{exc}' dropped")

    # Preserved numbers and deadlines
    for num in num_bd["originalAmounts"]:
        if num in num_bd["simplifiedAmounts"]:
            preserved_elements.append(f"Amount/Number: '{num}'")
        else:
            missing_elements.append(f"Amount/Number: '{num}' altered or missing")

    for dt in num_bd["originalDates"]:
        if dt in num_bd["simplifiedDates"]:
            preserved_elements.append(f"Deadline: '{dt}'")
        else:
            missing_elements.append(f"Deadline: '{dt}' altered or missing")

    if lang != "es" and not all_critical and not missing_elements and not changed_elements:
        preserved_elements.append("Operative legal intent and contractual liability balance")

    explanations = [c.explanation for c in all_critical]
    warnings = [f"[{c.severity.upper()}] {c.title}: {c.legalSignificance}" for c in all_critical]

    analysis_id = f"analysis-{uuid.uuid4().hex[:12]}"

    return AnalysisResult(
        id=analysis_id,
        analysis_id=analysis_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        language=lang,
        domain=payload.domain or "General Commercial / Contract Law",
        jurisdiction=payload.jurisdiction or "General Jurisprudence",
        originalText=orig,
        simplifiedText=simp,
        legalContext=payload.legalContext,
        lmpScore=lmp_score,
        preservation_score=lmp_score,
        preservationStatus=status,
        overall_status=status,
        interpretation=interp,
        humanReviewRecommended=status != "preserved" or lang in ("hi", "es"),
        humanReviewReason=(
            (
                f"Experimental multilingual NLI classified this pair as {neural_pred.get('predictedNliLabel')}; it is not legally validated, so obtain independent legal review."
                if lang in ("hi", "es") and neural_pred
                else f"{len(all_critical)} significant difference(s) detected between original legal force and simplified text."
                ) if (status != "preserved" or lang in ("hi", "es")) else None
        ),
        ruleExplanation=(
            (
                f"Evaluated via ClauseX JUDGEBERT Neural & Deontic Analysis Pipeline. "
                f"Neural Inference [{neural_pred.get('model')} on {neural_pred.get('device')}]: "
                f"Predicted {neural_pred.get('predictedNliLabel')} "
                f"(Entailment: {neural_pred.get('probabilities', {}).get('entailment', 0.0):.1%}, "
                f"Contradiction: {neural_pred.get('probabilities', {}).get('contradiction', 0.0):.1%}, "
                f"Neutral: {neural_pred.get('probabilities', {}).get('neutral', 0.0):.1%}), "
                f"Neural LMP: {neural_pred.get('lmpScore', 0.0):.1f}/10. " +
                ("Spanish lexical rule checks are not available; do not interpret empty rule breakdowns as verification. " if lang == "es" else
                 "Hindi rule checks are partial and may not cover all legal wording. ") +
                ("English rule-based detectors also analyzed deontic modal shifts, conditions, exceptions, polarity, numbers, dates, and parties." if lang == "en" else
                 "The multilingual model analyzed the clause pair directly in the selected language.")
            )
            if neural_pred else (
                "Evaluated via ClauseX JUDGEBERT Semantic & Deontic Analysis Pipeline v1.0. "
                "Pipeline rigorously checks deontic modal shifts (shall/must vs may/can), conditions precedent, "
                "exceptions, polarity inversions, numerical caps, statutory deadlines, and responsible party assignments."
            )
        ),
        modelAnalysis=neural_pred,
        sourceEngine="judgebert_backend_service",

        criticalChanges=all_critical,
        originalSpans=orig_spans,
        simplifiedSpans=simp_spans,
        deonticBreakdown=DeonticModalityBreakdown(
            originalObligations=deontic_bd["originalObligations"],
            simplifiedObligations=deontic_bd["simplifiedObligations"],
            originalPermissions=deontic_bd["originalPermissions"],
            simplifiedPermissions=deontic_bd["simplifiedPermissions"],
            originalProhibitions=deontic_bd["originalProhibitions"],
            simplifiedProhibitions=deontic_bd["simplifiedProhibitions"],
            shifts=shifts,
        ),
        conditionsBreakdown=ConditionsExceptionsBreakdown(
            originalConditions=cond_bd["originalConditions"],
            simplifiedConditions=cond_bd["simplifiedConditions"],
            originalExceptions=cond_bd["originalExceptions"],
            simplifiedExceptions=cond_bd["simplifiedExceptions"],
            droppedConditions=cond_bd["droppedConditions"],
            droppedExceptions=cond_bd["droppedExceptions"],
        ),
        entitiesBreakdown=EntitiesDatesAmountsBreakdown(
            originalDates=num_bd["originalDates"],
            simplifiedDates=num_bd["simplifiedDates"],
            dateMismatches=num_bd["dateMismatches"],
            originalAmounts=num_bd["originalAmounts"],
            simplifiedAmounts=num_bd["simplifiedAmounts"],
            amountMismatches=num_bd["amountMismatches"],
            originalEntities=party_bd["originalEntities"],
            simplifiedEntities=party_bd["simplifiedEntities"],
            entityMismatches=party_bd["entityMismatches"],
        ),
        summaryMetrics=SummaryMetrics(
            wordsOriginal=words_orig,
            wordsSimplified=words_simp,
            compressionRatio=compression,
            criticalDifferencesCount=len([c for c in all_critical if c.severity == "critical"]),
            warningDifferencesCount=len([c for c in all_critical if c.severity == "warning"]),
            infoDifferencesCount=len([c for c in all_critical if c.severity == "info"]),
        ),
        preserved_elements=preserved_elements,
        changed_elements=changed_elements,
        missing_elements=missing_elements,
        obligation_analysis={
            "original": deontic_bd["originalObligations"],
            "simplified": deontic_bd["simplifiedObligations"],
            "shifts": [s.model_dump() for s in shifts],
        },
        condition_analysis={
            "original": cond_bd["originalConditions"],
            "simplified": cond_bd["simplifiedConditions"],
            "dropped": cond_bd["droppedConditions"],
        },
        exception_analysis={
            "original": cond_bd["originalExceptions"],
            "simplified": cond_bd["simplifiedExceptions"],
            "dropped": cond_bd["droppedExceptions"],
        },
        negation_analysis={
            "prohibitions": deontic_bd["originalProhibitions"],
            "simplified_prohibitions": deontic_bd["simplifiedProhibitions"],
            "inversion_detected": any(c.evidenceSource == "negation_inversion" for c in all_critical),
        },
        numerical_analysis={
            "original": num_bd["originalAmounts"],
            "simplified": num_bd["simplifiedAmounts"],
            "mismatches": num_bd["amountMismatches"],
        },
        deadline_analysis={
            "original": num_bd["originalDates"],
            "simplified": num_bd["simplifiedDates"],
            "mismatches": num_bd["dateMismatches"],
        },
        explanations=explanations,
        warnings=warnings,
    )
