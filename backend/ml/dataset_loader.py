"""
ContractNLI Dataset Loader for ClauseX AI — JUDGEBERT Training

Transforms ContractNLI documents, hypotheses, and evidence spans into
standardized legal sentence-pair NLI format:
  - Label 0: Entailment (Meaning / obligation preserved)
  - Label 1: Neutral (Obligation not mentioned / dropped / unrelated)
  - Label 2: Contradiction (Obligation inverted / prohibited / conflicting)
"""

import os
import json
import random
from typing import List, Dict, Optional, Tuple

DEFAULT_DATA_DIR = r"c:\Users\tanwa\OneDrive\Pictures\DATASET for NLP\contract-nli\contract-nli"

LABEL_MAPPING = {
    "Entailment": 0,
    "Neutral": 1,
    "Contradiction": 2,
}
ID2LABEL = {0: "Entailment", 1: "Neutral", 2: "Contradiction"}


def get_default_data_dir() -> str:
    if os.path.exists(DEFAULT_DATA_DIR):
        return DEFAULT_DATA_DIR
    # Fallback search in parent pictures directory
    alt = r"c:\Users\tanwa\OneDrive\Pictures\DATASET for NLP"
    for root, dirs, _ in os.walk(alt):
        if "train.json" in os.listdir(root):
            return root
    raise FileNotFoundError(f"ContractNLI directory not found at {DEFAULT_DATA_DIR}")


def load_raw_contract_nli(data_dir: Optional[str] = None, split: str = "train") -> Dict:
    if data_dir is None:
        data_dir = get_default_data_dir()
    filepath = os.path.join(data_dir, f"{split}.json")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"ContractNLI split file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_sentence_pairs(
    data: Dict,
    balance_neutral: bool = True,
    random_seed: int = 42,
    max_samples: Optional[int] = None,
) -> List[Dict[str, any]]:
    """
    Extracts premise-hypothesis pairs from ContractNLI JSON structure.
    """
    rng = random.Random(random_seed)
    hypotheses = {k: v["hypothesis"] for k, v in data["labels"].items()}

    entailment_pairs = []
    contradiction_pairs = []
    neutral_pairs = []

    for doc in data["documents"]:
        text = doc["text"]
        spans = doc["spans"]
        if not spans:
            continue

        for aset in doc["annotation_sets"]:
            for lbl_key, annot in aset["annotations"].items():
                choice = annot.get("choice")
                evidence_indices = annot.get("spans", [])
                hyp = hypotheses.get(lbl_key, "")

                if not hyp:
                    continue

                if choice == "Entailment" and evidence_indices:
                    # Combine evidence sentence spans
                    evidence_texts = [
                        text[spans[idx][0] : spans[idx][1]].strip()
                        for idx in evidence_indices
                        if idx < len(spans)
                    ]
                    premise = " ".join(t for t in evidence_texts if t)
                    if len(premise.split()) >= 4:
                        entailment_pairs.append({
                            "premise": premise,
                            "hypothesis": hyp,
                            "label": 0,
                            "label_text": "Entailment",
                            "doc_id": doc.get("id"),
                            "label_key": lbl_key,
                        })

                elif choice == "Contradiction" and evidence_indices:
                    evidence_texts = [
                        text[spans[idx][0] : spans[idx][1]].strip()
                        for idx in evidence_indices
                        if idx < len(spans)
                    ]
                    premise = " ".join(t for t in evidence_texts if t)
                    if len(premise.split()) >= 4:
                        contradiction_pairs.append({
                            "premise": premise,
                            "hypothesis": hyp,
                            "label": 2,
                            "label_text": "Contradiction",
                            "doc_id": doc.get("id"),
                            "label_key": lbl_key,
                        })

                elif choice == "NotMentioned":
                    # Sample an uninformative sentence span from the document as neutral premise
                    rand_idx = rng.randint(0, len(spans) - 1)
                    cand_text = text[spans[rand_idx][0] : spans[rand_idx][1]].strip()
                    if len(cand_text.split()) >= 6:
                        neutral_pairs.append({
                            "premise": cand_text,
                            "hypothesis": hyp,
                            "label": 1,
                            "label_text": "Neutral",
                            "doc_id": doc.get("id"),
                            "label_key": lbl_key,
                        })

    # Balance neutral pairs if needed so neutral does not swamp entailment/contradiction
    if balance_neutral and neutral_pairs:
        target_neutral_count = min(len(neutral_pairs), len(entailment_pairs))
        rng.shuffle(neutral_pairs)
        neutral_pairs = neutral_pairs[:target_neutral_count]

    all_pairs = entailment_pairs + contradiction_pairs + neutral_pairs
    rng.shuffle(all_pairs)

    if max_samples and max_samples < len(all_pairs):
        all_pairs = all_pairs[:max_samples]

    return all_pairs


def get_nli_datasets(
    data_dir: Optional[str] = None,
    max_train_samples: Optional[int] = 4000,
    max_val_samples: Optional[int] = 800,
    random_seed: int = 42,
):
    """
    Returns (train_pairs, dev_pairs)
    """
    train_raw = load_raw_contract_nli(data_dir=data_dir, split="train")
    dev_raw = load_raw_contract_nli(data_dir=data_dir, split="dev")

    train_pairs = extract_sentence_pairs(
        train_raw, balance_neutral=True, random_seed=random_seed, max_samples=max_train_samples
    )
    dev_pairs = extract_sentence_pairs(
        dev_raw, balance_neutral=True, random_seed=random_seed, max_samples=max_val_samples
    )

    return train_pairs, dev_pairs
