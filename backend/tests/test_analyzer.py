import pytest
from app.models.schemas import AnalyzePayload
from app.core.analyzer import analyze_clause_pair

class TestClauseAnalyzer:
    def test_equivalent_clauses_high_preservation(self):
        """Equivalent clauses should retain high fidelity and preserved status."""
        payload = AnalyzePayload(
            originalText="The Licensee shall not disclose any Confidential Information to third parties without prior written consent.",
            simplifiedText="The Licensee shall not disclose any Confidential Information to third parties without prior written consent.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "preserved"
        assert result.lmpScore >= 9.0
        assert len(result.criticalChanges) == 0
        assert not result.humanReviewRecommended

    def test_shall_changed_to_may(self):
        """Shall changed to may must trigger deontic weakening critical alteration."""
        payload = AnalyzePayload(
            originalText="The Tenant shall pay all utility bills on or before the first day of each calendar month.",
            simplifiedText="The Tenant may pay utility bills on or before the first day of each calendar month.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "critical_alteration"
        assert result.lmpScore < 8.5
        assert any(c.category == "obligation" and c.severity == "critical" for c in result.criticalChanges)
        assert result.humanReviewRecommended
        assert len(result.deonticBreakdown.shifts) > 0

    def test_must_changed_to_optional_language(self):
        """Must changed to elective phrasing must flag a critical shift."""
        payload = AnalyzePayload(
            originalText="The Service Provider must maintain an active insurance policy during the entire term.",
            simplifiedText="The Service Provider has the right to maintain an active insurance policy if desired.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "critical_alteration"
        assert any(c.category == "obligation" for c in result.criticalChanges)

    def test_removed_deadlines(self):
        """Removing specific statutory or notice periods must be flagged."""
        payload = AnalyzePayload(
            originalText="In the event of a breach, the breaching party shall cure the defect within 30 days of written notice.",
            simplifiedText="If there is a breach, the breaching party shall cure the defect promptly.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "deadline" for c in result.criticalChanges)
        assert "30 days" in result.entitiesBreakdown.originalDates

    def test_changed_numbers_monetary(self):
        """Altering a financial liability cap or dollar amount must be detected as critical."""
        payload = AnalyzePayload(
            originalText="The total aggregate liability of the Supplier under this Agreement shall not exceed $500,000.",
            simplifiedText="The total aggregate liability of the Supplier under this Agreement shall not exceed $50,000.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "monetary" and c.severity == "critical" for c in result.criticalChanges)
        assert "$500,000" in result.entitiesBreakdown.amountMismatches

    def test_removed_negations_polarity_inversion(self):
        """Inverting or dropping express prohibitions/negations must trigger critical alert."""
        payload = AnalyzePayload(
            originalText="Under no circumstances shall the Employee disclose customer financial records.",
            simplifiedText="The Employee shall disclose customer financial records.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "critical_alteration"
        assert any(c.category in ["prohibition", "negation"] for c in result.criticalChanges)

    def test_removed_exceptions_carveouts(self):
        """Dropping legal exceptions or carve-outs must be flagged."""
        payload = AnalyzePayload(
            originalText="Neither party shall be liable for failure to perform, except where such failure is caused by gross negligence or willful misconduct.",
            simplifiedText="Neither party will be held liable for any failure to perform their duties under this contract.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "exception" and c.severity == "critical" for c in result.criticalChanges)
        assert len(result.conditionsBreakdown.droppedExceptions) > 0

    def test_changed_responsible_parties(self):
        """Substituting one contracting party for another must be detected."""
        payload = AnalyzePayload(
            originalText="The Vendor shall indemnify and hold harmless the Customer against all third-party claims.",
            simplifiedText="The Customer shall indemnify and hold harmless the Vendor against all third-party claims.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "entity" and c.severity == "critical" for c in result.criticalChanges)

    def test_changed_conditions_precedent(self):
        """Dropping a condition precedent must convert conditional duty into absolute."""
        payload = AnalyzePayload(
            originalText="The Buyer shall release payment, provided that the Seller delivers the certified inspection report.",
            simplifiedText="The Buyer shall release payment to the Seller.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "condition" and c.severity == "critical" for c in result.criticalChanges)
        assert len(result.conditionsBreakdown.droppedConditions) > 0

    def test_hindi_shall_to_may(self):
        """Hindi deontic weakening: अनिवार्य रूप से / बाध्य होगा changed to सकती है / छूट होगी."""
        payload = AnalyzePayload(
            originalText="किरायेदार प्रत्येक माह की पहली तारीख को अनिवार्य रूप से किराया जमा करने के लिए बाध्य होगा।",
            simplifiedText="किरायेदार प्रत्येक माह की पहली तारीख को किराया जमा कर सकता है।",
            language="hi"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "critical_alteration"
        assert any(c.category == "obligation" for c in result.criticalChanges)

    def test_hindi_dropped_condition(self):
        """Hindi condition precedent dropped: बशर्ते कि missing in simplification."""
        payload = AnalyzePayload(
            originalText="कंपनी कर्मचारी को बोनस का भुगतान करेगी, बशर्ते कि कर्मचारी ने वार्षिक लक्ष्य प्राप्त किया हो।",
            simplifiedText="कंपनी कर्मचारी को बोनस का भुगतान करेगी।",
            language="hi"
        )
        result = analyze_clause_pair(payload)
        assert any(c.category == "condition" for c in result.criticalChanges)

    def test_hindi_model_only_contradiction_is_not_reported_as_confirmed_critical(self, monkeypatch):
        """An experimental Hindi model prediction alone must not become a confirmed critical finding."""
        from ml.inference import MultilingualJudgeBERTInference

        class MockHindiModel:
            def is_available(self):
                return True

            def predict_pair(self, original_text, simplified_text):
                assert original_text.startswith("किरायेदार को हर महीने")
                assert simplified_text.startswith("किरायेदार को हर महीने")
                return {
                    "lmpScore": 1.38,
                    "status": "Critical Legal Alteration",
                    "interpretation": "model-only interpretation",
                    "probabilities": {"entailment": 0.4374, "neutral": 0.0099, "contradiction": 0.5527},
                    "predictedNliLabel": "Contradiction",
                    "device": "cpu",
                    "model": "JudgeBERT v3 Multilingual (XLM-R base; experimental Hindi/Spanish NLI)",
                    "checkpoint": "judgebert_v3_multilingual",
                    "is_v2": False,
                    "is_multilingual": True,
                }

        monkeypatch.setattr(MultilingualJudgeBERTInference, "get_instance", MockHindiModel)
        payload = AnalyzePayload(
            originalText="किरायेदार को हर महीने ₹20,000 किराया देना होगा। मकान मालिक की लिखित अनुमति के बिना वह संपत्ति किसी और को किराये पर नहीं दे सकता।",
            simplifiedText="किरायेदार को हर महीने ₹20,000 किराया देना अनिवार्य है। वह मकान मालिक की पहले से लिखित अनुमति के बिना संपत्ति किसी अन्य व्यक्ति को किराये पर नहीं दे सकता।",
            language="hi",
        )

        result = analyze_clause_pair(payload)

        assert result.modelAnalysis["predictedNliLabel"] == "Contradiction"
        assert result.modelAnalysis["probabilities"]["contradiction"] == 0.5527
        assert result.lmpScore == 1.38  # Preserve the experimental model's raw score.
        assert result.criticalChanges == []
        assert result.summaryMetrics.criticalDifferencesCount == 0
        assert result.preservationStatus == "subtle_shift"
        assert "not a confirmed legal alteration" in result.interpretation

    def test_regression_7_days_versus_seven_days(self):
        """Equivalent numeric expressions: 7 days vs seven days must be recognized as equivalent."""
        payload = AnalyzePayload(
            originalText="The tenant must pay rent within 7 days.",
            simplifiedText="The tenant is required to pay rent within seven days.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "preserved"
        assert result.lmpScore >= 9.0
        assert len(result.criticalChanges) == 0
        assert len(result.entitiesBreakdown.dateMismatches) == 0
        assert not result.humanReviewRecommended

    def test_regression_30_days_versus_thirty_days(self):
        """Equivalent numeric expressions: 30 days vs thirty days must be recognized as equivalent."""
        payload = AnalyzePayload(
            originalText="Notice must be given within 30 days following an event of default.",
            simplifiedText="Notice must be given within thirty days following an event of default.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "preserved"
        assert result.lmpScore >= 9.0
        assert len(result.criticalChanges) == 0
        assert len(result.entitiesBreakdown.dateMismatches) == 0

    def test_regression_must_pay_versus_is_required_to_pay(self):
        """Equivalent obligations: 'must pay' vs 'is required to pay' must express the same obligation."""
        payload = AnalyzePayload(
            originalText="The tenant must pay the full security deposit prior to move-in.",
            simplifiedText="The tenant is required to pay the full security deposit prior to move-in.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "preserved"
        assert result.lmpScore >= 9.0
        assert len(result.criticalChanges) == 0
        assert "Obligation: 'must' modified or omitted" not in result.changed_elements

    def test_regression_must_pay_versus_may_pay_weakened(self):
        """Weakened obligation: 'must pay' vs 'may pay' must still be detected as critical alteration."""
        payload = AnalyzePayload(
            originalText="The tenant must pay rent.",
            simplifiedText="The tenant may pay rent.",
            language="en"
        )
        result = analyze_clause_pair(payload)
        assert result.preservationStatus == "critical_alteration"
        assert result.lmpScore < 8.5
        assert any(c.category == "obligation" and c.severity == "critical" for c in result.criticalChanges)
        assert result.humanReviewRecommended
