"""
CLAUSEX AI — Contrastive Local Dataset Builder
Constructs leak-free legal sentence-pair NLI datasets from validated local files:
  - C:\\Users\\tanwa\\OneDrive\\Pictures\\DATASET for NLP\\Ledgar\\
  - C:\\Users\\tanwa\\OneDrive\\Pictures\\DATASET for NLP\\contract-nli\\contract-nli\\

Features:
  1. Strict train/val/test isolation (using official Ledgar train vs validation files, and ContractNLI train vs dev).
  2. Deontic minimal contrastive pairs (must/shall <-> is required to [Entailment] vs must/shall -> may [Contradiction]).
  3. Exception-drop contrastive pairs (clause with unless/except/provided that -> clause with exception removed [Contradiction]).
  4. ContractNLI broad contractual inference pairs.
"""

import os
import re
import json
import random
import pyarrow.parquet as pq
from typing import List, Dict, Tuple

LEDGAR_TRAIN = r"C:\Users\tanwa\OneDrive\Pictures\DATASET for NLP\Ledgar\train-00000-of-00001.parquet"
LEDGAR_VAL = r"C:\Users\tanwa\OneDrive\Pictures\DATASET for NLP\Ledgar\validation-00000-of-00001.parquet"
CONTRACT_NLI_TRAIN = r"C:\Users\tanwa\OneDrive\Pictures\DATASET for NLP\contract-nli\contract-nli\train.json"
CONTRACT_NLI_DEV = r"C:\Users\tanwa\OneDrive\Pictures\DATASET for NLP\contract-nli\contract-nli\dev.json"

CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data_cache"))


def generate_deontic_pairs(texts: List[str], max_pairs: int = 1500, seed: int = 42) -> List[Dict]:
    """
    Extracts sentences containing deontic auxiliaries and creates contrastive pairs:
      - Preserved (Entailment): must <-> is required to, shall <-> must, may <-> is permitted to
      - Inverted (Contradiction): must/shall -> may, shall not -> may, may -> must
    """
    rng = random.Random(seed)
    pairs = []
    shuffled_texts = list(texts)
    rng.shuffle(shuffled_texts)

    for text in shuffled_texts:
        clean = " ".join(text.split())
        if len(clean.split()) < 8 or len(clean.split()) > 50:
            continue

        # Pattern 1: 'shall not' / 'must not' (Prohibition)
        if re.search(r"\bshall not\b", clean, re.IGNORECASE):
            # Preserved: 'shall not' -> 'is prohibited from' / 'is not permitted to'
            rewritten_pres = re.sub(r"\bshall not\b", "is not permitted to", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_pres, "label": 0, "type": "deontic_prohibition_preserved"})

            # Inverted: 'shall not' -> 'may' (Prohibition turned into permission)
            rewritten_flip = re.sub(r"\bshall not\b", "may", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_flip, "label": 2, "type": "deontic_prohibition_to_permission"})

        # Pattern 2: 'must' / 'shall' (Mandatory obligation)
        elif re.search(r"\bshall\b", clean, re.IGNORECASE) and not re.search(r"\bshall not\b", clean, re.IGNORECASE):
            # Preserved: 'shall' -> 'must' or 'is required to'
            rewritten_pres = re.sub(r"\bshall\b", "is required to", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_pres, "label": 0, "type": "deontic_obligation_preserved"})

            # Inverted: 'shall' -> 'may' (Obligation turned into discretionary option)
            rewritten_flip = re.sub(r"\bshall\b", "may", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_flip, "label": 2, "type": "deontic_obligation_to_permission"})

        elif re.search(r"\bmust\b", clean, re.IGNORECASE) and not re.search(r"\bmust not\b", clean, re.IGNORECASE):
            # Preserved: 'must' -> 'is required to'
            rewritten_pres = re.sub(r"\bmust\b", "is required to", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_pres, "label": 0, "type": "deontic_obligation_preserved"})

            # Inverted: 'must' -> 'may'
            rewritten_flip = re.sub(r"\bmust\b", "may", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_flip, "label": 2, "type": "deontic_obligation_to_permission"})

        # Pattern 3: 'may' (Permission / discretion)
        elif re.search(r"\bmay\b", clean, re.IGNORECASE):
            # Preserved: 'may' -> 'is permitted to'
            rewritten_pres = re.sub(r"\bmay\b", "is permitted to", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_pres, "label": 0, "type": "deontic_permission_preserved"})

            # Inverted: 'may' -> 'must' (Discretion turned into obligation)
            rewritten_flip = re.sub(r"\bmay\b", "must", clean, count=1, flags=re.IGNORECASE)
            pairs.append({"premise": clean, "hypothesis": rewritten_flip, "label": 2, "type": "deontic_permission_to_obligation"})

        if len(pairs) >= max_pairs:
            break

    return pairs[:max_pairs]


def generate_exception_pairs(texts: List[str], max_pairs: int = 1000, seed: int = 42) -> List[Dict]:
    """
    Extracts clauses with 'unless', 'except that', 'provided that' and creates contrastive pairs:
      - Preserved (Entailment): Original clause rewritten with equivalent exception phrasing
      - Omitted (Contradiction): Same clause with the exception clause stripped!
    """
    rng = random.Random(seed)
    pairs = []
    shuffled_texts = list(texts)
    rng.shuffle(shuffled_texts)

    exception_patterns = [
        (r"^(.*?),\s*unless\s+([^,.;]+[.;]?)$", "unless"),
        (r"^(.*?),\s*except\s+that\s+([^,.;]+[.;]?)$", "except that"),
        (r"^(.*?),\s*provided\s+that\s+([^,.;]+[.;]?)$", "provided that"),
    ]

    for text in shuffled_texts:
        clean = " ".join(text.split())
        if len(clean.split()) < 10 or len(clean.split()) > 60:
            continue

        for pat, marker in exception_patterns:
            m = re.match(pat, clean, re.IGNORECASE)
            if m:
                base_clause = m.group(1).strip()
                condition = m.group(2).strip()
                if len(base_clause.split()) >= 6 and len(condition.split()) >= 3:
                    stripped = base_clause + ("." if not base_clause.endswith(".") else "")

                    # 1. Stripped exception -> Contradiction / Alteration
                    pairs.append({
                        "premise": clean,
                        "hypothesis": stripped,
                        "label": 2,  # Contradiction: dropping an exception invalidates the legal consequence
                        "type": f"exception_dropped_{marker}"
                    })

                    # 2. Preserved exception -> Entailment
                    if marker == "unless":
                        rewritten_pres = f"{base_clause}, except if {condition}"
                    elif marker == "provided that":
                        rewritten_pres = f"{base_clause}, on the condition that {condition}"
                    else:
                        rewritten_pres = f"{base_clause}, with the exception that {condition}"

                    pairs.append({
                        "premise": clean,
                        "hypothesis": rewritten_pres,
                        "label": 0,
                        "type": f"exception_preserved_{marker}"
                    })
                    break

        if len(pairs) >= max_pairs:
            break

    return pairs[:max_pairs]


def load_contract_nli_pairs(json_path: str, max_pairs: int = 2500, seed: int = 42) -> List[Dict]:
    """Loads paired premises and hypotheses from ContractNLI JSON."""
    rng = random.Random(seed)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    hypotheses = {k: v["hypothesis"] for k, v in data["labels"].items()}
    pairs = []

    for doc in data["documents"]:
        text = doc["text"]
        spans = doc["spans"]
        if not spans:
            continue

        for aset in doc["annotation_sets"]:
            for lbl_key, annot in aset["annotations"].items():
                choice = annot.get("choice")
                evidence_idx = annot.get("spans", [])
                hyp = hypotheses.get(lbl_key, "")
                if not hyp:
                    continue

                if choice == "Entailment" and evidence_idx:
                    ev_texts = [text[spans[i][0]:spans[i][1]].strip() for i in evidence_idx if i < len(spans)]
                    premise = " ".join(t for t in ev_texts if t)
                    if len(premise.split()) >= 5:
                        pairs.append({"premise": premise, "hypothesis": hyp, "label": 0, "type": "contract_nli_entailment"})

                elif choice == "Contradiction" and evidence_idx:
                    ev_texts = [text[spans[i][0]:spans[i][1]].strip() for i in evidence_idx if i < len(spans)]
                    premise = " ".join(t for t in ev_texts if t)
                    if len(premise.split()) >= 5:
                        pairs.append({"premise": premise, "hypothesis": hyp, "label": 2, "type": "contract_nli_contradiction"})

                elif choice == "NotMentioned" and spans:
                    rand_i = rng.randint(0, len(spans) - 1)
                    premise = text[spans[rand_i][0]:spans[rand_i][1]].strip()
                    if len(premise.split()) >= 8:
                        pairs.append({"premise": premise, "hypothesis": hyp, "label": 1, "type": "contract_nli_neutral"})

    rng.shuffle(pairs)
    return pairs[:max_pairs]


def build_contrastive_splits() -> Tuple[List[Dict], List[Dict]]:
    """
    Builds non-overlapping Train and Validation splits using strictly disjoint source files.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    train_cache = os.path.join(CACHE_DIR, "train_contrastive.json")
    val_cache = os.path.join(CACHE_DIR, "val_contrastive.json")

    # 1. Load Ledgar Train clauses (60,000)
    print("Reading Ledgar Train clauses...")
    ledgar_train_table = pq.read_table(LEDGAR_TRAIN)
    ledgar_train_texts = ledgar_train_table["text"].to_pylist()

    # 2. Load Ledgar Validation clauses (10,000, completely disjoint from train)
    print("Reading Ledgar Validation clauses (disjoint set)...")
    ledgar_val_table = pq.read_table(LEDGAR_VAL)
    ledgar_val_texts = ledgar_val_table["text"].to_pylist()

    # 3. Generate Training Set
    print("Generating Training deontic and exception contrastive pairs...")
    train_deontic = generate_deontic_pairs(ledgar_train_texts, max_pairs=1800, seed=42)
    train_exceptions = generate_exception_pairs(ledgar_train_texts, max_pairs=1200, seed=42)
    train_nli = load_contract_nli_pairs(CONTRACT_NLI_TRAIN, max_pairs=2500, seed=42)

    train_all = train_deontic + train_exceptions + train_nli
    random.Random(42).shuffle(train_all)

    # 4. Generate Validation Set (Zero overlap: derived from Ledgar Val and ContractNLI Dev)
    print("Generating Validation deontic and exception contrastive pairs...")
    val_deontic = generate_deontic_pairs(ledgar_val_texts, max_pairs=400, seed=123)
    val_exceptions = generate_exception_pairs(ledgar_val_texts, max_pairs=300, seed=123)
    val_nli = load_contract_nli_pairs(CONTRACT_NLI_DEV, max_pairs=600, seed=123)

    val_all = val_deontic + val_exceptions + val_nli
    random.Random(123).shuffle(val_all)

    print(f"Total Training Pairs:   {len(train_all)}")
    print(f"Total Validation Pairs: {len(val_all)}")

    with open(train_cache, "w", encoding="utf-8") as f:
        json.dump(train_all, f, indent=2)
    with open(val_cache, "w", encoding="utf-8") as f:
        json.dump(val_all, f, indent=2)

    print(f"Saved cached datasets to {CACHE_DIR}")
    return train_all, val_all


if __name__ == "__main__":
    build_contrastive_splits()
