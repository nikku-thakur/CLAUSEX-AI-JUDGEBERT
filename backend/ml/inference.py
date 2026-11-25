"""
CLAUSEX AI — JUDGEBERT Neural Inference Engine
Loads fine-tuned Transformer checkpoint and produces continuous Legal Meaning Preservation (LMP)
scoring alongside normative entailment/contradiction probabilities.
"""

import os
import logging
from typing import Dict, Any, Optional, Tuple

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

logger = logging.getLogger("judgebert_inference")

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except Exception as _import_err:
    TRANSFORMERS_AVAILABLE = False
    logger.warning(f"PyTorch or Transformers not available at import: {_import_err}")

V2_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "judgebert_v2_contrastive")
)
V1_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "judgebert_checkpoint")
)
V3_MULTILINGUAL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "judgebert_v3_multilingual")
)
CHECKPOINT_DIR = V2_DIR if os.path.exists(os.path.join(V2_DIR, "config.json")) else V1_DIR


class JudgeBERTInference:
    _instance = None

    def __init__(self, model_dir: str = CHECKPOINT_DIR):
        self.model_dir = model_dir
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self._loaded = False
        self._load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if not os.path.exists(os.path.join(self.model_dir, "config.json")):
            logger.info(f"No trained JUDGEBERT checkpoint found at {self.model_dir}. Rule-based fallback remains active.")
            self._loaded = False
            return

        if not TRANSFORMERS_AVAILABLE:
            logger.warning("Transformers library is not available. Neural inference disabled.")
            self._loaded = False
            return

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading JUDGEBERT checkpoint from {self.model_dir} on {self.device}...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir, local_files_only=True)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir, local_files_only=True)
            self.model.to(self.device)
            self.model.eval()
            self._loaded = True
            logger.info("JUDGEBERT neural inference engine loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load JUDGEBERT checkpoint: {e}")
            self._loaded = False


    def is_available(self) -> bool:
        return self._loaded and self.model is not None

    def predict_pair(self, original_text: str, simplified_text: str) -> Dict[str, Any]:
        """
        Evaluates a pair of legal texts:
          original_text: The source contractual clause
          simplified_text: The simplified / plain-language version
        """
        if not self.is_available():
            raise RuntimeError("JUDGEBERT checkpoint is not loaded.")

        import torch

        with torch.no_grad():
            inputs = self.tokenizer(
                original_text,
                simplified_text,
                truncation=True,
                max_length=256,
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().tolist()

            # Class mapping: 0: Entailment, 1: Neutral, 2: Contradiction
            p_entail = probs[0]
            p_neutral = probs[1]
            p_contra = probs[2]

            # Calibrate LMP score on continuous 1.0 to 10.0 scale:
            # High entailment -> 9.0-10.0
            # Neutral / drift -> 5.0-7.0
            # Contradiction -> 1.0-4.0
            raw_fidelity = p_entail - (1.4 * p_contra) - (0.4 * p_neutral)
            norm_fidelity = max(0.0, min(1.0, (raw_fidelity + 0.4) / 1.4))
            lmp_score = round(1.0 + (9.0 * norm_fidelity), 2)

            if p_contra > 0.4 or lmp_score < 4.0:
                status = "Critical Legal Alteration"
                interpretation = (
                    "Significant normative divergence detected. The simplified text introduces "
                    "a contradiction or inverts operative legal obligations."
                )
            elif p_neutral > 0.5 or lmp_score < 7.0:
                status = "Semantic Drift / Ambiguity"
                interpretation = (
                    "Subtle semantic drift or condition omission detected. The core obligations "
                    "may be incomplete or weakened in plain language."
                )
            elif lmp_score >= 8.5:
                status = "Full Legal Meaning Preservation"
                interpretation = (
                    "High legal fidelity confirmed. Operative duties, rights, and conditional "
                    "thresholds are preserved in the simplified text."
                )
            else:
                status = "Substantially Preserved"
                interpretation = (
                    "Substantially preserved with minor stylistic compression. Legal effect remains binding."
                )

            predicted_idx = int(torch.argmax(logits, dim=-1).item())
            labels = ["Entailment", "Neutral", "Contradiction"]

            is_v2 = "judgebert_v2_contrastive" in self.model_dir
            if "judgebert_v3_multilingual" in self.model_dir:
                model_name = "JudgeBERT v3 Multilingual (XLM-R base; experimental Hindi/Spanish NLI)"
            else:
                model_name = (
                    "JUDGEBERT v2 Contrastive (distilbert-base-uncased fine-tuned on Ledgar + ContractNLI)"
                    if is_v2
                    else "JUDGEBERT v1 (distilbert-base-uncased fine-tuned on ContractNLI)"
                )

            return {
                "lmpScore": lmp_score,
                "status": status,
                "interpretation": interpretation,
                "probabilities": {
                    "entailment": round(p_entail, 4),
                    "neutral": round(p_neutral, 4),
                    "contradiction": round(p_contra, 4),
                },
                "predictedNliLabel": labels[predicted_idx],
                "device": self.device,
                "model": model_name,
                "checkpoint": self.model_dir,
                "is_v2": is_v2,
                "is_multilingual": "judgebert_v3_multilingual" in self.model_dir,
            }


class MultilingualJudgeBERTInference(JudgeBERTInference):
    """Separate experimental XLM-R checkpoint; the English v2 singleton is never replaced."""
    _instance = None

    def __init__(self, model_dir: str = V3_MULTILINGUAL_DIR):
        super().__init__(model_dir=model_dir)

