from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.schemas import SimplifyTranslatePayload
from app.services import simplification


SOURCE_CLAUSES = {
    "en": "The tenant shall pay rent by the fifth day of each month.",
    "hi": "किरायेदार हर महीने की पांच तारीख तक किराया देगा।",
    "ja": "借主は毎月5日までに賃料を支払うものとする。",
    "es": "El inquilino deberá pagar el alquiler antes del día cinco de cada mes.",
}
ENGLISH_ORIGINAL = "The tenant must pay rent by the fifth day of each month."
ENGLISH_DRAFT = "The tenant is required to pay rent by the fifth day of each month."


def _payload(source="en", target="en"):
    return SimplifyTranslatePayload(
        originalText=SOURCE_CLAUSES[source],
        sourceLanguage=source,
        targetLanguage=target,
    )


def _passing_analysis(payload):
    assert payload.language == "en"
    return SimpleNamespace(
        modelAnalysis={"is_v2": True, "predictedNliLabel": "Entailment"},
        preservationStatus="preserved",
    )


def test_non_english_original_is_translated_then_generated_and_verified_in_english(monkeypatch):
    calls = []

    def fake_translate(text, source, target):
        calls.append(("translate", source, target, text))
        if target == "en":
            return ENGLISH_ORIGINAL
        return "TEST_TARGET_TRANSLATION"

    def fake_generate(english_original):
        calls.append(("generate", english_original))
        assert english_original == ENGLISH_ORIGINAL
        return ENGLISH_DRAFT

    def fake_analyze(payload):
        calls.append(("analyze", payload.originalText, payload.simplifiedText, payload.language))
        return _passing_analysis(payload)

    monkeypatch.setattr(simplification, "_translate_text", fake_translate)
    monkeypatch.setattr(simplification, "_generate_simplified_english", fake_generate)
    monkeypatch.setattr(simplification, "analyze_clause_pair", fake_analyze)

    result = simplification.simplify_translate(_payload("hi", "hi"))

    assert calls == [
        ("translate", "hi", "en", SOURCE_CLAUSES["hi"]),
        ("generate", ENGLISH_ORIGINAL),
        ("analyze", ENGLISH_ORIGINAL, ENGLISH_DRAFT, "en"),
        ("translate", "en", "hi", ENGLISH_DRAFT),
    ]
    assert result["originalEnglish"] == ENGLISH_ORIGINAL
    assert result["simplifiedEnglish"] == ENGLISH_DRAFT
    assert result["translatedText"] == "TEST_TARGET_TRANSLATION"
    assert result["translationCompleted"] is True


@pytest.mark.parametrize("language", ["en", "hi", "ja", "es"])
def test_generation_pipeline_keeps_both_analysis_inputs_english(monkeypatch, language):
    seen = {}

    def fake_translate(text, source, target):
        seen.setdefault("translations", []).append((source, target, text))
        return ENGLISH_ORIGINAL if target == "en" else f"translated-{target}"

    monkeypatch.setattr(simplification, "_translate_text", fake_translate)
    monkeypatch.setattr(simplification, "_generate_simplified_english", lambda text: ENGLISH_DRAFT)

    def fake_analyze(payload):
        seen["analysis"] = (payload.originalText, payload.simplifiedText, payload.language)
        return _passing_analysis(payload)

    monkeypatch.setattr(simplification, "analyze_clause_pair", fake_analyze)
    result = simplification.simplify_translate(_payload(language, language))

    expected_english_original = SOURCE_CLAUSES["en"] if language == "en" else ENGLISH_ORIGINAL
    assert result["originalEnglish"] == expected_english_original
    assert result["simplifiedEnglish"] == ENGLISH_DRAFT
    assert seen["analysis"] == (expected_english_original, ENGLISH_DRAFT, "en")
    assert all(source != "translated" for source, _, _ in seen.get("translations", []))


def test_english_to_english_needs_no_translation_call(monkeypatch):
    monkeypatch.setattr(
        simplification,
        "_translate_text",
        lambda *_: pytest.fail("English-to-English must not call the translation provider"),
    )
    monkeypatch.setattr(simplification, "_generate_simplified_english", lambda _: ENGLISH_DRAFT)
    monkeypatch.setattr(simplification, "analyze_clause_pair", _passing_analysis)

    result = simplification.simplify_translate(_payload("en", "en"))
    assert result["originalEnglish"] == SOURCE_CLAUSES["en"]
    assert result["translatedText"] == ENGLISH_DRAFT


def test_flagged_english_pair_remains_translatable_with_clear_warning(monkeypatch):
    monkeypatch.setattr(simplification, "_translate_text", lambda *_: "translated-for-review")
    monkeypatch.setattr(simplification, "_generate_simplified_english", lambda _: ENGLISH_DRAFT)
    monkeypatch.setattr(
        simplification,
        "analyze_clause_pair",
        lambda _: SimpleNamespace(
            modelAnalysis={"is_v2": True, "predictedNliLabel": "Contradiction"},
            preservationStatus="critical_alteration",
        ),
    )

    result = simplification.simplify_translate(_payload("en", "es"))
    assert result["originalEnglish"] == SOURCE_CLAUSES["en"]
    assert result["simplifiedEnglish"] == ENGLISH_DRAFT
    assert result["translatedText"] == "translated-for-review"
    assert result["translationCompleted"] is True
    assert "flagged a possible meaning change" in result["targetLanguageValidation"]
    assert "not been independently validated" in result["targetLanguageValidation"]


def test_missing_google_credentials_uses_local_translation_for_hindi_and_spanish(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    calls = []
    monkeypatch.setattr(
        simplification,
        "_translate_text_locally",
        lambda text, source, target: calls.append((source, target, text)) or "local translation",
    )

    assert simplification._translate_text(SOURCE_CLAUSES["hi"], "hi", "en") == "local translation"
    assert simplification._translate_text(SOURCE_CLAUSES["es"], "es", "en") == "local translation"
    assert [(source, target) for source, target, _ in calls] == [("hi", "en"), ("es", "en")]


def test_missing_generation_credentials_uses_local_model(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(simplification, "_generate_simplified_english_locally", lambda text: f"local: {text}")

    assert simplification._generate_simplified_english(ENGLISH_ORIGINAL) == f"local: {ENGLISH_ORIGINAL}"


def test_generator_cannot_return_original_as_its_own_draft(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "unit-test-key")
    monkeypatch.setattr(
        simplification.httpx,
        "post",
        lambda *args, **kwargs: SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {
                "output": [{"type": "message", "content": [{"type": "output_text", "text": ENGLISH_ORIGINAL}]}]
            },
        ),
    )

    with pytest.raises(HTTPException) as error:
        simplification._generate_simplified_english(ENGLISH_ORIGINAL)

    assert error.value.status_code == 502
    assert "generation failed" in error.value.detail


def test_generator_preserves_dates_and_amounts_exactly(monkeypatch):
    source = "Tenant must pay USD $1,500.50 by 2026-12-31."
    monkeypatch.setenv("OPENAI_API_KEY", "unit-test-key")
    requested = {}

    def fake_post(_url, **kwargs):
        requested["input"] = kwargs["json"]["input"][1]["content"]
        protected = requested["input"]
        return SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {
                "output": [{
                    "type": "message",
                    "content": [{"type": "output_text", "text": f"Tenant is required to pay {protected.split(' by ')[0].split('pay ')[1]} by {protected.split(' by ')[1]}"}],
                }]
            },
        )

    monkeypatch.setattr(simplification.httpx, "post", fake_post)
    result = simplification._generate_simplified_english(source)

    assert "$1,500.50" in result
    assert "2026-12-31" in result
    assert "CLAUSEXNUMTOKEN" in requested["input"]


def test_numeric_dates_and_amounts_are_protected_and_restored_exactly():
    source = "The Tenant must pay USD $1,500.50 by 2026-12-31 within 30 days."
    protected, markers = simplification._protect_numeric_legal_tokens(source)

    assert "1,500.50" not in protected
    assert "2026-12-31" not in protected
    assert simplification._restore_numeric_legal_tokens(f"Translated: {protected}", markers) == f"Translated: {source}"


def test_local_numeric_guard_accepts_equivalent_rupee_formatting():
    simplification._validate_numeric_legal_tokens(
        "The tenant shall pay ₹20,000 by 2026-12-31.",
        "The tenant must pay Rs. 20, 000 by 2026-12-31.",
    )
    simplification._validate_numeric_legal_tokens("Rs. 20, 000", "रु. 20,000")


def test_local_numeric_guard_rejects_currency_or_amount_changes():
    with pytest.raises(RuntimeError, match="currency marker"):
        simplification._validate_numeric_legal_tokens("Pay ₹20,000.", "Pay $20,000.")
    with pytest.raises(RuntimeError, match="numeric legal term"):
        simplification._validate_numeric_legal_tokens("Pay ₹20,000.", "Pay Rs. 2,000.")


def test_local_hindi_party_glossary_corrects_supplier_role():
    translated, notes = simplification._normalize_party_terms(
        "विनिर्माता वस्तुओं को भेजेगा।",
        "The supplier must deliver the goods.",
        "hi",
    )

    assert translated == "आपूर्तिकर्ता वस्तुओं को भेजेगा।"
    assert notes


def test_local_party_glossary_keeps_manufacturer_when_source_mentions_it():
    translated, notes = simplification._normalize_party_terms(
        "आपूर्तिकर्ता, जो निर्माता भी है, सामान देगा।",
        "The supplier is also the manufacturer and must deliver the goods.",
        "hi",
    )

    assert translated == "आपूर्तिकर्ता, जो निर्माता भी है, सामान देगा।"
    assert notes == []


def test_local_role_order_repairs_hindi_landlord_tenant_swap():
    translated, notes = simplification._align_party_role_order(
        "घर (किरायेदार) में रहने वाले व्यक्ति को भुगतान करना है। वे अपने किरायेदार से अनुमति लेंगे।",
        "The person who lives in the house (tenant) must pay. They need permission from their landlord.",
        "hi",
    )

    assert translated == "घर (किरायेदार) में रहने वाले व्यक्ति को भुगतान करना है। वे अपने मकान मालिक से अनुमति लेंगे।"
    assert notes


def test_translation_fails_if_numeric_legal_token_was_dropped():
    protected, markers = simplification._protect_numeric_legal_tokens("Payment is due in 30 days.")
    assert "CLAUSEXNUMTOKEN0X" in protected
    with pytest.raises(RuntimeError, match="protected date, amount"):
        simplification._restore_numeric_legal_tokens("Translated: Payment is due.", markers)
