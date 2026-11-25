from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, model_validator, ConfigDict
from datetime import datetime, timezone

Language = Literal["en", "hi", "es"]
OutputLanguage = Literal["en", "hi", "ja", "es"]
PreservationStatus = Literal["preserved", "subtle_shift", "critical_alteration"]
SeverityLevel = Literal["critical", "warning", "info"]
ChangeCategory = Literal[
    "obligation",
    "permission",
    "prohibition",
    "negation",
    "condition",
    "exception",
    "deadline",
    "monetary",
    "entity",
    "scope",
    "omitted_content",
    "added_content",
]

class AnalyzePayload(BaseModel):
    originalText: str = Field(..., min_length=3, description="Original legal clause")
    simplifiedText: str = Field(..., min_length=3, description="Simplified legal clause")
    language: Language = Field("en", description="Language code: en, hi, or es")
    domain: Optional[str] = Field(None, description="Legal domain, e.g. Commercial Leasing")
    jurisdiction: Optional[str] = Field(None, description="Legal jurisdiction")
    legalContext: Optional[str] = Field(None, description="Optional background context")

    @model_validator(mode="before")
    @classmethod
    def validate_inputs(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Also allow snake_case aliases if sent
            if "original_text" in data and "originalText" not in data:
                data["originalText"] = data["original_text"]
            if "simplified_text" in data and "simplifiedText" not in data:
                data["simplifiedText"] = data["simplified_text"]
            if "legal_context" in data and "legalContext" not in data:
                data["legalContext"] = data["legal_context"]
        return data


class SimplifyTranslatePayload(BaseModel):
    originalText: str = Field(..., min_length=3, description="Original legal clause in the selected source language")
    sourceLanguage: OutputLanguage = Field("en", description="Language used in originalText")
    targetLanguage: OutputLanguage = Field("en", description="Requested output language")
    domain: Optional[str] = None
    jurisdiction: Optional[str] = None
    legalContext: Optional[str] = None


class TextSpan(BaseModel):
    text: str
    type: Literal["unchanged", "added", "removed", "modified"]
    category: Optional[ChangeCategory] = None
    severity: Optional[SeverityLevel] = None
    explanation: Optional[str] = None
    charStart: Optional[int] = None
    charEnd: Optional[int] = None


class CriticalChange(BaseModel):
    id: str
    category: ChangeCategory
    severity: SeverityLevel
    title: str
    originalExcerpt: str
    simplifiedExcerpt: str
    explanation: str
    legalSignificance: str
    evidenceSource: Literal[
        "textual_diff",
        "deontic_shift",
        "condition_removal",
        "entity_check",
        "negation_inversion",
    ]


class DeonticShift(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(..., alias="from")
    to: str
    impact: str
    severity: SeverityLevel


class DeonticModalityBreakdown(BaseModel):
    originalObligations: List[str] = Field(default_factory=list)
    simplifiedObligations: List[str] = Field(default_factory=list)
    originalPermissions: List[str] = Field(default_factory=list)
    simplifiedPermissions: List[str] = Field(default_factory=list)
    originalProhibitions: List[str] = Field(default_factory=list)
    simplifiedProhibitions: List[str] = Field(default_factory=list)
    shifts: List[DeonticShift] = Field(default_factory=list)


class ConditionsExceptionsBreakdown(BaseModel):
    originalConditions: List[str] = Field(default_factory=list)
    simplifiedConditions: List[str] = Field(default_factory=list)
    originalExceptions: List[str] = Field(default_factory=list)
    simplifiedExceptions: List[str] = Field(default_factory=list)
    droppedConditions: List[str] = Field(default_factory=list)
    droppedExceptions: List[str] = Field(default_factory=list)


class EntitiesDatesAmountsBreakdown(BaseModel):
    originalDates: List[str] = Field(default_factory=list)
    simplifiedDates: List[str] = Field(default_factory=list)
    dateMismatches: List[str] = Field(default_factory=list)
    originalAmounts: List[str] = Field(default_factory=list)
    simplifiedAmounts: List[str] = Field(default_factory=list)
    amountMismatches: List[str] = Field(default_factory=list)
    originalEntities: List[str] = Field(default_factory=list)
    simplifiedEntities: List[str] = Field(default_factory=list)
    entityMismatches: List[str] = Field(default_factory=list)


class SummaryMetrics(BaseModel):
    wordsOriginal: int
    wordsSimplified: int
    compressionRatio: float
    criticalDifferencesCount: int
    warningDifferencesCount: int
    infoDifferencesCount: int


class AnalysisResult(BaseModel):
    # Core frontend identifiers
    id: str
    timestamp: str
    language: Language
    domain: Optional[str] = "General Commercial / Contract Law"
    jurisdiction: Optional[str] = "General Jurisprudence"
    originalText: str
    simplifiedText: str
    legalContext: Optional[str] = None

    # Scores and status
    lmpScore: float
    preservationStatus: PreservationStatus
    interpretation: str
    humanReviewRecommended: bool
    humanReviewReason: Optional[str] = None
    ruleExplanation: str
    sourceEngine: Literal["judgebert_backend_service", "deterministic_demo_engine"] = "judgebert_backend_service"

    # Breakdowns matching frontend
    criticalChanges: List[CriticalChange] = Field(default_factory=list)
    originalSpans: List[TextSpan] = Field(default_factory=list)
    simplifiedSpans: List[TextSpan] = Field(default_factory=list)
    deonticBreakdown: DeonticModalityBreakdown
    conditionsBreakdown: ConditionsExceptionsBreakdown
    entitiesBreakdown: EntitiesDatesAmountsBreakdown
    summaryMetrics: SummaryMetrics

    # Phase 5 API Contract additional fields
    analysis_id: str
    preservation_score: float
    overall_status: PreservationStatus
    preserved_elements: List[str] = Field(default_factory=list)
    changed_elements: List[str] = Field(default_factory=list)
    missing_elements: List[str] = Field(default_factory=list)
    obligation_analysis: Dict[str, Any] = Field(default_factory=dict)
    condition_analysis: Dict[str, Any] = Field(default_factory=dict)
    exception_analysis: Dict[str, Any] = Field(default_factory=dict)
    negation_analysis: Dict[str, Any] = Field(default_factory=dict)
    numerical_analysis: Dict[str, Any] = Field(default_factory=dict)
    deadline_analysis: Dict[str, Any] = Field(default_factory=dict)
    explanations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    modelAnalysis: Optional[Dict[str, Any]] = None


class SimplifyTranslateResponse(BaseModel):
    originalEnglish: str
    simplifiedEnglish: str
    translatedText: str
    targetLanguage: OutputLanguage
    translationCompleted: bool
    translationError: Optional[str] = None
    englishVerification: AnalysisResult
    targetLanguageValidation: str
    generationNotice: str



class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ClauseX AI — JUDGEBERT Inference Service"
    version: str = "1.0.0"
    mode: str = "production_backend"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    supported_languages: List[str] = ["en", "hi", "es"]


ClauseType = Literal["obligation", "condition", "prohibition", "discretion"]


class ParsedClause(BaseModel):
    id: str
    number: str
    title: str
    text: str
    type: ClauseType = "obligation"
    simplifiedText: Optional[str] = None


class DocumentParseResponse(BaseModel):
    filename: str
    fileType: Literal["PDF", "DOCX", "TXT"]
    fileSize: str
    fileSizeBytes: int
    rawText: str
    clauses: List[ParsedClause]
    clauseCount: int
    pageCount: Optional[int] = None
    characterCount: int
    wordCount: int
