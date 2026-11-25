import os
import re
import threading
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.analyzer import analyze_clause_pair
from app.models.schemas import AnalyzePayload, SimplifyTranslatePayload


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "ja": "Japanese", "es": "Spanish"}
NUMERIC_LEGAL_TOKEN = re.compile(
    r"(?ix)(?<![\w])(?:(?:USD|EUR|GBP|INR|JPY|CAD|AUD|RS\.?)\s*[$€£₹¥]?\s*)?"
    r"[$€£₹¥]?\s*\d[\d,]*(?:\s+\d{3}(?:,\d{3})*)*(?:\.\d+)?(?:[-/:.]\d[\d,]*)*"
    r"\s*(?:%|USD|EUR|GBP|INR|JPY|CAD|AUD|RS\.?)?(?![\w])"
)
CURRENCY_PATTERNS = {
    "INR": re.compile(r"₹|(?<!\w)(?:INR|Rs\.?)(?!\w)|\brupees?\b|रु\.?|रुपये|रुपया|रुपए|रुपियों", re.IGNORECASE),
    "USD": re.compile(r"\$|(?<!\w)USD\b|\bdollars?\b|डॉलर|डालर", re.IGNORECASE),
    "EUR": re.compile(r"€|(?<!\w)EUR\b|\beuros?\b", re.IGNORECASE),
    "GBP": re.compile(r"£|(?<!\w)GBP\b|\bpounds?\b", re.IGNORECASE),
    "JPY": re.compile(r"¥|(?<!\w)JPY\b|\byen\b", re.IGNORECASE),
    "CAD": re.compile(r"(?<!\w)CAD\b|\bCanadian dollars?\b", re.IGNORECASE),
    "AUD": re.compile(r"(?<!\w)AUD\b|\bAustralian dollars?\b", re.IGNORECASE),
}

_LOCAL_MODEL_LOCK = threading.Lock()
_LOCAL_INFERENCE_LOCK = threading.Lock()
_LOCAL_MODELS: dict[str, tuple[Any, Any, Any]] = {}
_LOCAL_TRANSLATOR_KEY: str | None = None
_LOCAL_MODEL_ROOT = Path(__file__).resolve().parents[2] / "models" / "local_legal_language"
PARTY_GLOSSARY = {
    "tenant": {"hi": ("किरायेदार", ("पट्टेदार", "भाड़ेदार"), ()), "es": ("inquilino", ("arrendatario",), ())},
    "landlord": {"hi": ("मकान मालिक", ("भूस्वामी",), ()), "es": ("arrendador", ("propietario",), ())},
    "supplier": {
        "hi": ("आपूर्तिकर्ता", ("विनिर्माता", "निर्माता", "प्रदायक"), ("manufacturer", "producer")),
        "es": ("proveedor", ("suministrador",), ("distributor",)),
    },
    "buyer": {"hi": ("खरीदार", ("क्रेता",), ()), "es": ("comprador", (), ())},
    "seller": {"hi": ("विक्रेता", ("बेचने वाला",), ()), "es": ("vendedor", (), ())},
}


def _translate_text_locally(text: str, source_language: str, target_language: str) -> str:
    global _LOCAL_TRANSLATOR_KEY
    use_mbart = "hi" in {source_language, target_language}
    model_key = "MBART50-HI" if use_mbart else "M2M100-ES"
    model_path = str(_LOCAL_MODEL_ROOT / ("mbart-large-50-mmt" if use_mbart else "m2m100-418m"))
    with _LOCAL_MODEL_LOCK:
        if _LOCAL_TRANSLATOR_KEY and _LOCAL_TRANSLATOR_KEY != model_key:
            _LOCAL_MODELS.pop(_LOCAL_TRANSLATOR_KEY, None)
            import gc
            gc.collect()
        _LOCAL_TRANSLATOR_KEY = model_key
        if model_key not in _LOCAL_MODELS:
            try:
                import torch
                from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

                torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
                if use_mbart:
                    from transformers import MBartForConditionalGeneration, MBart50TokenizerFast
                    tokenizer = MBart50TokenizerFast.from_pretrained(model_path, local_files_only=True)
                    model = MBartForConditionalGeneration.from_pretrained(
                        model_path, local_files_only=True, dtype=torch.float16
                    ).to("cpu")
                else:
                    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
                    model = AutoModelForSeq2SeqLM.from_pretrained(model_path, local_files_only=True).to("cpu")
                model.eval()
                _LOCAL_MODELS[model_key] = (torch, tokenizer, model)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        f"The local {model_key} translation model is unavailable. Install its model files under "
                        f"{_LOCAL_MODEL_ROOT} and restart the backend. No clause was sent to a remote service."
                    ),
                ) from exc
        torch, tokenizer, model = _LOCAL_MODELS[model_key]
    try:
        language_codes = {"en": "en_XX", "hi": "hi_IN", "es": "es_XX", "ja": "ja_XX"}
        if use_mbart:
            tokenizer.src_lang = language_codes[source_language]
            target_token_id = tokenizer.lang_code_to_id[language_codes[target_language]]
        else:
            tokenizer.src_lang = source_language
            target_token_id = tokenizer.get_lang_id(target_language)
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with _LOCAL_INFERENCE_LOCK, torch.inference_mode():
            generated = model.generate(
                **inputs,
                max_new_tokens=128,
                num_beams=4,
                forced_bos_token_id=target_token_id,
            )
        translated = tokenizer.decode(generated[0], skip_special_tokens=True).strip()
        if not translated:
            raise RuntimeError("Local translation model returned empty text.")
        _validate_numeric_legal_tokens(text, translated)
        return translated
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Local {source_language.upper()} to {target_language.upper()} translation failed; no translation was returned.",
        ) from exc


def _protect_numeric_legal_tokens(text: str) -> tuple[str, list[tuple[str, str]]]:
    protected: list[tuple[str, str]] = []

    def replace(match: re.Match[str]) -> str:
        marker = f"CLAUSEXNUMTOKEN{len(protected)}X"
        protected.append((marker, match.group(0)))
        return marker

    return NUMERIC_LEGAL_TOKEN.sub(replace, text), protected


def _validate_numeric_legal_tokens(source_text: str, translated_text: str) -> None:
    """Allow localization of separators/currency formatting while preserving value and currency."""
    target_digits = re.sub(r"\D", "", translated_text)
    for match in NUMERIC_LEGAL_TOKEN.finditer(source_text):
        token = match.group(0)
        source_digits = re.sub(r"\D", "", token)
        if source_digits and source_digits not in target_digits:
            raise RuntimeError("A date, amount, or numeric legal term changed during translation.")
        for currency, pattern in CURRENCY_PATTERNS.items():
            if pattern.search(token) and not pattern.search(translated_text):
                raise RuntimeError(f"The {currency} currency marker was lost during translation.")


def _restore_numeric_legal_tokens(text: str, protected: list[tuple[str, str]]) -> str:
    for marker, source_token in protected:
        # Tokenizers may split an opaque marker into subwords or adjust its
        # spacing/case. Match its normalized alphanumeric form, but still reject
        # missing or repeated markers.
        normalized_marker = re.sub(r"[^a-z0-9]", "", marker.casefold())
        char_positions = [index for index, char in enumerate(text) if char.isalnum()]
        normalized_text = "".join(text[index].casefold() for index in char_positions)
        matches = [match.start() for match in re.finditer(re.escape(normalized_marker), normalized_text)]
        if len(matches) != 1:
            raise RuntimeError("A protected date, amount, or numeric legal term changed during translation.")
        start_normalized = matches[0]
        end_normalized = start_normalized + len(normalized_marker)
        start_char = char_positions[start_normalized]
        end_char = char_positions[end_normalized - 1] + 1
        text = text[:start_char] + source_token + text[end_char:]
    return text


def _has_required_legal_anchors(original: str, simplified: str) -> bool:
    """Keep a few high-risk surface distinctions that the small generator drops."""
    source = " ".join(original.casefold().split())
    draft = " ".join(simplified.casefold().split())
    required_groups = [
        ("calendar-day qualifier", ("calendar day", "calendar days")),
        ("business-day qualifier", ("business day", "business days")),
        ("working-day qualifier", ("working day", "working days")),
        ("written-form requirement", ("in writing", "written")),
        ("oral-form requirement", ("orally", "oral")),
        ("strict greater-than condition", ("more than", "greater than", "exceeds")),
        ("minimum threshold", ("at least", "not less than", "no fewer than")),
        ("strict less-than condition", ("less than", "fewer than", "under")),
    ]
    if not all(
        not any(anchor in source for anchor in anchors)
        or any(anchor in draft for anchor in anchors)
        for _, anchors in required_groups
    ):
        return False
    deadline_pattern = re.compile(
        r"\b(?:no later than|not later than|on or before|on or after|before|by|after|within)\s+"
        r"(?:the\s+)?(?:[a-z0-9-]+\s+){0,5}(?:day|days|week|weeks|month|months|year|years|date)\b"
        r"(?:\s+(?:of|in|each|every)\s+[a-z0-9-]+){0,3}",
        re.IGNORECASE,
    )
    for match in deadline_pattern.finditer(source):
        if match.group(0) not in draft:
            return False
    return True


def _normalize_party_terms(text: str, english_pair: str, target_language: str) -> tuple[str, list[str]]:
    """Normalize a few known party translations where local MT confuses legal roles."""
    notes: list[str] = []
    english = english_pair.casefold()
    for role, languages in PARTY_GLOSSARY.items():
        if target_language not in languages:
            continue
        if not re.search(rf"\b{re.escape(role)}\b", english):
            continue
        canonical, alternatives, conflicting_english_terms = languages[target_language]
        if any(re.search(rf"\b{re.escape(term)}\b", english) for term in conflicting_english_terms):
            continue
        for alternative in alternatives:
            if alternative in text:
                text = text.replace(alternative, canonical)
                notes.append(f"Local glossary normalized the translated party term for '{role}'.")
    return text, notes


def _align_party_role_order(text: str, simplified_english: str, target_language: str) -> tuple[str, list[str]]:
    """Use source order to repair role swaps such as landlord translated as tenant."""
    if target_language not in {"hi", "es"}:
        return text, []

    english_roles: list[str] = []
    for match in re.finditer(r"\b(?:tenant|landlord|supplier|buyer|seller)\b", simplified_english, re.IGNORECASE):
        english_roles.append(match.group(0).casefold())

    target_patterns: list[tuple[str, str]] = []
    for role, languages in PARTY_GLOSSARY.items():
        canonical, alternatives, _ = languages[target_language]
        for term in (canonical, *alternatives):
            target_patterns.append((term, role))
    if not english_roles or not target_patterns:
        return text, []

    candidates: list[tuple[int, int, str]] = []
    for term, role in target_patterns:
        for match in re.finditer(re.escape(term), text, re.IGNORECASE):
            candidates.append((match.start(), match.end(), role))
    candidates.sort(key=lambda item: (item[0], -(item[1] - item[0])))
    mentions: list[tuple[int, int, str]] = []
    for start, end, role in candidates:
        if not mentions or start >= mentions[-1][1]:
            mentions.append((start, end, role))

    if len(mentions) != len(english_roles):
        return text, ["The local glossary could not align every named party in the translated draft; review party roles carefully."]

    edits = []
    for (start, end, translated_role), source_role in zip(mentions, english_roles):
        canonical = PARTY_GLOSSARY[source_role][target_language][0]
        if translated_role != source_role or text[start:end] != canonical:
            edits.append((start, end, canonical))
    if not edits:
        return text, []
    for start, end, replacement in reversed(edits):
        text = text[:start] + replacement + text[end:]
    return text, ["The local glossary aligned named party roles to the English draft order."]


def _translate_text(text: str, source_language: str, target_language: str) -> str:
    """Prefer configured Google Translation; otherwise use local mBART/M2M translators."""
    if source_language == target_language:
        return text

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not project_id or not credentials_path:
        if source_language in {"en", "hi", "es"} and target_language in {"en", "hi", "es"}:
            return _translate_text_locally(text, source_language, target_language)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=(
            f"No local translation model is available for {source_language.upper()} to {target_language.upper()}. "
            "Set GOOGLE_CLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS for Google Cloud Translation."
        ))
    if not Path(credentials_path).is_file():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Translation credentials file configured by GOOGLE_APPLICATION_CREDENTIALS was not found.",
        )

    try:
        from google.cloud import translate_v3

        client = translate_v3.TranslationServiceClient()
        location = os.getenv("GOOGLE_CLOUD_TRANSLATION_LOCATION", "global")
        protected_text, protected_tokens = _protect_numeric_legal_tokens(text)
        request: dict[str, Any] = {
            "parent": f"projects/{project_id}/locations/{location}",
            "contents": [protected_text],
            "mime_type": "text/plain",
            "source_language_code": source_language,
            "target_language_code": target_language,
        }
        glossary = os.getenv("GOOGLE_CLOUD_TRANSLATION_GLOSSARY")
        if glossary:
            request["glossary_config"] = {"glossary": glossary}

        response = client.translate_text(request=request)
        if glossary and response.glossary_translations:
            translated = response.glossary_translations[0].translated_text
        else:
            translated = response.translations[0].translated_text
        if not translated.strip():
            raise RuntimeError("Google Cloud Translation returned empty text.")
        return _restore_numeric_legal_tokens(translated, protected_tokens)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google Cloud Translation failed. Check backend credentials, API access, and project configuration.",
        ) from exc


def _generate_simplified_english_locally(original_english: str) -> str:
    model_path = str(_LOCAL_MODEL_ROOT / "qwen2.5-1.5b-instruct")
    model_key = "Qwen2.5-1.5B-Instruct"
    with _LOCAL_MODEL_LOCK:
        if model_key not in _LOCAL_MODELS:
            try:
                import torch
                from transformers import AutoModelForCausalLM, AutoTokenizer

                torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
                tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
                model = AutoModelForCausalLM.from_pretrained(
                    model_path, local_files_only=True, dtype=torch.float16
                ).to("cpu")
                model.eval()
                _LOCAL_MODELS[model_key] = (torch, tokenizer, model)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        f"The local {model_key} model is unavailable. Install its model files under "
                        f"{_LOCAL_MODEL_ROOT} and restart the backend. No clause was sent to a remote service."
                    ),
                ) from exc
        torch, tokenizer, model = _LOCAL_MODELS[model_key]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a cautious legal plain-language editor. Rewrite the clause so a non-lawyer can understand it. "
                "Preserve every obligation, permission, prohibition, exception, condition, deadline, date, amount, "
                "responsible party, scope limit, and legal consequence exactly. Keep every party name and the full "
                "deadline phrase verbatim. Keep precise legal qualifiers such as calendar day, business day, in writing, "
                "and more than unchanged. Do not replace a party or legal action with a description or broader synonym. "
                "Make only small, clear wording changes around those fixed terms. Do not infer or add anything. "
                "If a safe rewrite is uncertain, return the original clause. Return only the clause."
            ),
        },
        {
            "role": "user",
            "content": "Rewrite this legal clause in simpler plain English while preserving its exact legal meaning:\n" + original_english,
        },
    ]
    try:
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
        with _LOCAL_INFERENCE_LOCK, torch.inference_mode():
            generated = model.generate(
                **inputs, max_new_tokens=256, do_sample=False,
            )
        generated_only = generated[0][inputs["input_ids"].shape[1]:]
        simplified = tokenizer.decode(generated_only, skip_special_tokens=True).strip()
        if not simplified:
            raise RuntimeError("Local generation model returned empty text.")
        _validate_numeric_legal_tokens(original_english, simplified)
        if not _has_required_legal_anchors(original_english, simplified):
            raise RuntimeError("Local simplification omitted a high-risk legal qualifier; no draft was returned.")
        if " ".join(simplified.split()).casefold() == " ".join(original_english.split()).casefold():
            raise RuntimeError("Local generation model returned the original clause unchanged.")
        return simplified
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Local English simplification failed. Review the clause manually; no draft was returned.",
        ) from exc


def _generate_simplified_english(original_english: str) -> str:
    """Generate English simplification with configured API or local Qwen fallback."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _generate_simplified_english_locally(original_english)

    model = os.getenv("CLAUSEX_SIMPLIFICATION_MODEL", "gpt-5.4-mini")
    developer_instructions = (
        "Rewrite the supplied English legal clause in clearer, simpler English. Return only the rewritten clause. "
        "Preserve every obligation, permission, prohibition, exception, condition, deadline, date, amount, "
        "responsible party, scope limit, and legal consequence exactly in meaning. Do not add, remove, weaken, "
        "or strengthen rights or duties. Do not summarize away any operative detail. If a phrase cannot be "
        "simplified without changing its legal effect, retain that phrase verbatim."
    )
    protected_english, protected_tokens = _protect_numeric_legal_tokens(original_english)
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "store": False,
                "max_output_tokens": 1800,
                "input": [
                    {"role": "developer", "content": developer_instructions},
                    {"role": "user", "content": protected_english},
                ],
            },
            timeout=75.0,
        )
        response.raise_for_status()
        data = response.json()
        text_parts = [
            content.get("text", "")
            for item in data.get("output", [])
            if item.get("type") == "message"
            for content in item.get("content", [])
            if content.get("type") == "output_text"
        ]
        simplified = "\n".join(part.strip() for part in text_parts if part.strip()).strip()
        if not simplified:
            raise RuntimeError("Generation provider returned no clause text.")
        simplified = _restore_numeric_legal_tokens(simplified, protected_tokens)
        if " ".join(simplified.split()).casefold() == " ".join(original_english.split()).casefold():
            raise RuntimeError("Generation provider returned the original clause unchanged.")
        return simplified
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="English simplification generation failed. Check OPENAI_API_KEY, model access, and backend connectivity.",
        ) from exc


def _response(
    *,
    original_english: str,
    simplified_english: str,
    target_language: str,
    verification: Any,
    translated_text: str = "",
    translation_completed: bool = False,
    translation_error: str | None = None,
    verification_warning: str | None = None,
    translation_notes: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "originalEnglish": original_english,
        "simplifiedEnglish": simplified_english,
        "translatedText": translated_text,
        "targetLanguage": target_language,
        "translationCompleted": translation_completed,
        "translationError": translation_error,
        "englishVerification": verification,
        "targetLanguageValidation": (
            " ".join(([verification_warning] if verification_warning else []) + (translation_notes or []))
            + (" " if verification_warning or translation_notes else "")
        ) + (
            "JudgeBERT v2 and rule-based checks evaluated only the English original and English draft. "
            "Translated text has not been independently validated."
        ),
        "generationNotice": (
            "English draft generated with Qwen2.5-1.5B-Instruct locally (no clause sent to a generation API). "
            "This general-purpose model is experimental for legal simplification; carefully review all legal details. "
            "JudgeBERT v2 verifies only the English pair, and the translated text is not independently validated."
            if not os.getenv("OPENAI_API_KEY") else
            "English draft generated by the configured text-generation service. Neither this draft nor the translated text is guaranteed to be legally accurate."
        ),
    }


def simplify_translate(payload: SimplifyTranslatePayload) -> dict[str, Any]:
    """Translate source to English, generate, verify English pair, then translate output."""
    original_english = (
        payload.originalText
        if payload.sourceLanguage == "en"
        else _translate_text(payload.originalText, payload.sourceLanguage, "en")
    )
    simplified_english = _generate_simplified_english(original_english)

    verification = analyze_clause_pair(
        AnalyzePayload(
            originalText=original_english,
            simplifiedText=simplified_english,
            language="en",
            domain=payload.domain,
            jurisdiction=payload.jurisdiction,
            legalContext=payload.legalContext,
        )
    )
    model_analysis = verification.modelAnalysis or {}
    if not model_analysis.get("is_v2"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JudgeBERT v2 is unavailable. The English pair was not verified and no translated draft was returned.",
        )

    verification_warning = None
    if payload.targetLanguage != "en" and (
        verification.preservationStatus != "preserved"
        or model_analysis.get("predictedNliLabel") != "Entailment"
    ):
        verification_warning = (
            "Warning: JudgeBERT v2 or the English rule analysis flagged a possible meaning change "
            f"(JudgeBERT: {model_analysis.get('predictedNliLabel', 'unavailable')}; "
            f"rule status: {verification.preservationStatus}). The translated draft is shown for manual review."
        )

    if payload.targetLanguage == "en":
        translated = simplified_english
        translation_notes = []
    else:
        try:
            translated = _translate_text(simplified_english, "en", payload.targetLanguage)
            translated, translation_notes = _normalize_party_terms(
                translated,
                f"{original_english}\n{simplified_english}",
                payload.targetLanguage,
            )
            translated, role_notes = _align_party_role_order(
                translated,
                simplified_english,
                payload.targetLanguage,
            )
            translation_notes.extend(role_notes)
        except HTTPException as exc:
            if exc.status_code not in (status.HTTP_502_BAD_GATEWAY, status.HTTP_503_SERVICE_UNAVAILABLE):
                raise
            return _response(
                original_english=original_english,
                simplified_english=simplified_english,
                target_language=payload.targetLanguage,
                verification=verification,
                translation_error=exc.detail,
            )

    return _response(
        original_english=original_english,
        simplified_english=simplified_english,
        target_language=payload.targetLanguage,
        verification=verification,
        translated_text=translated,
        translation_completed=True,
        verification_warning=verification_warning,
        translation_notes=translation_notes,
    )
