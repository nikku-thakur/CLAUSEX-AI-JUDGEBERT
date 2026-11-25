"""Fine-tune a separate multilingual JudgeBERT checkpoint for en/hi/es.

The existing JudgeBERT v2 checkpoint is never written by this script.
Training combines English legal contrastive pairs, target-language XNLI,
and Hindi legal NLI from IndicConBench. Evaluation keeps XNLI and
IndicConBench held-out splits separate.
"""

from __future__ import annotations

import json
import logging
import math
import random
import re
import time
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
import torch
from datasets import Dataset, load_dataset
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
    set_seed,
)

LOGGER = logging.getLogger("train_judgebert_multilingual")
ROOT = Path(__file__).resolve().parents[1]
DATA_CACHE = ROOT / "ml" / "data_cache"
OUTPUT_DIR = ROOT / "models" / "judgebert_v3_multilingual"
LABEL2ID = {"Entailment": 0, "Neutral": 1, "Contradiction": 2}
ID2LABEL = {value: key for key, value in LABEL2ID.items()}
LANGS = ("hi", "es")
SEED = 42
BASE_MODEL = "FacebookAI/xlm-roberta-base"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def _read_pairs(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        values = json.load(handle)
    result = []
    for row in values:
        label = int(row["label"])
        if label not in ID2LABEL:
            raise ValueError(f"Unknown label {label} in {path}")
        premise = str(row["premise"]).strip()
        hypothesis = str(row["hypothesis"]).strip()
        if premise and hypothesis:
            result.append({"premise": premise, "hypothesis": hypothesis, "label": label})
    return result


def _parse_indic_nli(row: dict[str, Any]) -> tuple[str, str] | None:
    raw = str(row["input"])
    premise_match = re.search(r"Premise\):\s*(.*?)\s*\n\s*\n", raw, flags=re.DOTALL | re.IGNORECASE)
    hypothesis_match = re.search(r"Hypothesis\):\s*(.*)$", raw, flags=re.DOTALL | re.IGNORECASE)
    if not premise_match or not hypothesis_match:
        return None
    premise = premise_match.group(1).strip()
    hypothesis = hypothesis_match.group(1).strip()
    if not premise or not hypothesis:
        return None
    return premise, hypothesis


def _indic_examples(split: str) -> list[dict[str, Any]]:
    dataset = load_dataset("vikhram-labs/IndicConBench", split=split)
    examples: list[dict[str, Any]] = []
    for row in dataset:
        if row["task_type"] != "entailment" or row["language"] != "hi":
            continue
        parsed = _parse_indic_nli(row)
        if not parsed:
            continue
        premise, hypothesis = parsed
        label_text = str(row["output"]).strip().title()
        if label_text not in LABEL2ID:
            continue
        examples.append({
            "premise": premise,
            "hypothesis": hypothesis,
            "label": LABEL2ID[label_text],
            "source": "indicconbench_hindi_legal_crosslingual",
        })
    return examples


def _sample_xnli(language: str, split: str, per_class: int | None = None) -> list[dict[str, Any]]:
    dataset = load_dataset("facebook/xnli", language, split=split)
    if per_class is not None:
        parts = []
        for label in (0, 1, 2):
            group = dataset.filter(lambda row, label=label: int(row["label"]) == label)
            group = group.shuffle(seed=SEED + label).select(range(min(per_class, len(group))))
            parts.extend(group.to_list())
        dataset_rows = parts
    else:
        dataset_rows = dataset.to_list()
    return [
        {"premise": row["premise"], "hypothesis": row["hypothesis"], "label": int(row["label"])}
        for row in dataset_rows
        if row["premise"].strip() and row["hypothesis"].strip() and int(row["label"]) in ID2LABEL
    ]


def _tokenize(dataset: Dataset, tokenizer: Any, max_length: int) -> Dataset:
    return dataset.map(
        lambda batch: tokenizer(batch["premise"], batch["hypothesis"], truncation=True, max_length=max_length),
        batched=True,
        remove_columns=["premise", "hypothesis"],
        desc="Tokenizing sentence pairs",
    )


def _metrics(eval_pred: Any) -> dict[str, float]:
    logits, labels = eval_pred
    predictions = np.asarray(logits).argmax(axis=-1)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, labels=[0, 1, 2], average="macro", zero_division=0
    )
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "macro_precision": float(precision),
        "macro_recall": float(recall),
        "macro_f1": float(f1),
    }


def _evaluate_report(trainer: Trainer, dataset: Dataset, name: str, provenance: str) -> dict[str, Any]:
    predictions = trainer.predict(dataset)
    predicted = np.asarray(predictions.predictions).argmax(axis=-1)
    truth = np.asarray(predictions.label_ids)
    p, r, f, support = precision_recall_fscore_support(
        truth, predicted, labels=[0, 1, 2], zero_division=0
    )
    classwise = {
        ID2LABEL[index]: {
            "precision": float(p[index]),
            "recall": float(r[index]),
            "f1": float(f[index]),
            "support": int(support[index]),
        }
        for index in range(3)
    }
    return {
        "dataset": name,
        "provenance": provenance,
        "samples": int(len(truth)),
        "accuracy": float(accuracy_score(truth, predicted)),
        "macro": {
            "precision": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="macro", zero_division=0)[0]),
            "recall": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="macro", zero_division=0)[1]),
            "f1": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="macro", zero_division=0)[2]),
        },
        "micro": {
            "precision": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="micro", zero_division=0)[0]),
            "recall": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="micro", zero_division=0)[1]),
            "f1": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="micro", zero_division=0)[2]),
        },
        "weighted": {
            "precision": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="weighted", zero_division=0)[0]),
            "recall": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="weighted", zero_division=0)[1]),
            "f1": float(precision_recall_fscore_support(truth, predicted, labels=[0, 1, 2], average="weighted", zero_division=0)[2]),
        },
        "classwise": classwise,
        "confusion_matrix_rows_true_cols_predicted": confusion_matrix(truth, predicted, labels=[0, 1, 2]).tolist(),
        "label_order": [ID2LABEL[i] for i in range(3)],
    }


def _balanced_sample(rows: list[dict[str, Any]], per_class: int, seed: int) -> list[dict[str, Any]]:
    sampled: list[dict[str, Any]] = []
    for label in (0, 1, 2):
        group = [row for row in rows if int(row["label"]) == label]
        random.Random(seed + label).shuffle(group)
        sampled.extend(group[:min(per_class, len(group))])
    return sampled


def prepare_data(
    per_class_xnli: int = 100,
    per_class_english: int = 150,
    per_class_indic: int = 75,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, list[dict[str, Any]]], dict[str, list[dict[str, Any]]]]:
    train_en = _balanced_sample(_read_pairs(DATA_CACHE / "train_contrastive.json"), per_class_english, SEED)
    val_en = _read_pairs(DATA_CACHE / "val_contrastive.json")
    train: list[dict[str, Any]] = [dict(row, source="english_legal_existing") for row in train_en]
    validation: list[dict[str, Any]] = [dict(row, source="english_legal_validation") for row in val_en]

    # Target-language XNLI train is machine-translated MultiNLI. Only the
    # official train split is used here; official validation/test remain held out.
    validation_sets: dict[str, list[dict[str, Any]]] = {"english_legal_validation": val_en}
    heldout_sets: dict[str, list[dict[str, Any]]] = {}
    for language in LANGS:
        xnli_train = _sample_xnli(language, "train", per_class=per_class_xnli)
        train.extend(dict(row, source=f"xnli_{language}_machine_translated_train") for row in xnli_train)
        language_validation = _sample_xnli(language, "validation")
        language_test = _sample_xnli(language, "test")
        validation.extend(dict(row, source=f"xnli_{language}_validation") for row in language_validation)
        validation_sets[f"xnli_{language}_validation"] = language_validation
        heldout_sets[f"xnli_{language}_test"] = language_test

    indic_train = _balanced_sample(_indic_examples("train"), per_class_indic, SEED + 100)
    indic_validation = _indic_examples("validation")
    indic_test = _indic_examples("test")
    train.extend(indic_train)
    validation.extend(dict(row, source="indicconbench_hindi_legal_validation") for row in indic_validation)
    validation_sets["indicconbench_hi_legal_validation"] = indic_validation
    heldout_sets["indicconbench_hi_legal_test"] = indic_test

    random.Random(SEED).shuffle(train)
    random.Random(SEED).shuffle(validation)
    return train, validation, validation_sets, heldout_sets


def train_multilingual(
    epochs: int = 3,
    per_class_xnli: int = 100,
    per_class_english: int = 150,
    per_class_indic: int = 75,
    batch_size: int = 2,
    gradient_accumulation_steps: int = 8,
    max_length: int = 128,
    seed: int = SEED,
) -> dict[str, Any]:
    set_seed(seed)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    started = time.time()
    train_rows, validation_rows, validation_sets, heldout = prepare_data(
        per_class_xnli=per_class_xnli,
        per_class_english=per_class_english,
        per_class_indic=per_class_indic,
    )
    # Keep data counts only; training content remains in local dataset cache.
    source_counts = dict(Counter(row.get("source", "unspecified") for row in train_rows))
    LOGGER.info("Training examples: %d; validation examples: %d", len(train_rows), len(validation_rows))
    LOGGER.info("Training source counts: %s", source_counts)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL,
        num_labels=3,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    model.gradient_checkpointing_enable()
    collator = DataCollatorWithPadding(tokenizer=tokenizer, pad_to_multiple_of=8)
    train_ds = _tokenize(Dataset.from_list(train_rows), tokenizer, max_length)
    validation_ds = _tokenize(Dataset.from_list(validation_rows), tokenizer, max_length)

    use_cuda = torch.cuda.is_available()
    optimizer_steps_per_epoch = math.ceil(len(train_rows) / (batch_size * gradient_accumulation_steps))
    warmup_steps = max(1, int(optimizer_steps_per_epoch * epochs * 0.1))
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "training_checkpoints"),
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=1,
        learning_rate=2e-5,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=2,
        gradient_accumulation_steps=gradient_accumulation_steps,
        num_train_epochs=epochs,
        weight_decay=0.01,
        warmup_steps=warmup_steps,
        logging_steps=100,
        fp16=use_cuda,
        gradient_checkpointing=True,
        dataloader_num_workers=0,
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        greater_is_better=True,
        report_to="none",
        seed=seed,
        data_seed=seed,
        optim="adamw_torch",
    )
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=validation_ds,
        processing_class=tokenizer,
        data_collator=collator,
        compute_metrics=_metrics,
    )
    result = trainer.train()
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    validation_dataset_results = []
    for name, rows in validation_sets.items():
        dataset = _tokenize(Dataset.from_list(rows), tokenizer, max_length)
        validation_dataset_results.append(_evaluate_report(trainer, dataset, name, "Validation split; used for model selection and reported separately from test data."))

    final_test_results = []
    for name, rows in heldout.items():
        dataset = _tokenize(Dataset.from_list(rows), tokenizer, max_length)
        provenance = (
            "Official held-out XNLI split; general-domain NLI, machine-translated examples."
            if name.startswith("xnli_")
            else "Official IndicConBench article-held-out Hindi legal entailment split; premise/hypothesis language is as supplied by the dataset, including mixed-language examples."
        )
        final_test_results.append(_evaluate_report(trainer, dataset, name, provenance))

    summary = {
        "version": "judgebert_v3_multilingual_experimental",
        "base_model": BASE_MODEL,
        "languages_trained": ["en", "hi", "es"],
        "language_model_routes": {"en": "existing JudgeBERT v2", "hi": "new XLM-R multilingual checkpoint", "es": "new XLM-R multilingual checkpoint"},
        "checkpoint_path": str(OUTPUT_DIR),
        "source_checkpoint_preserved": str(ROOT / "models" / "judgebert_v2_contrastive"),
        "training_sources": {
            "existing_english_legal_contrastive_pairs_per_class": per_class_english,
            "xnli_machine_translated_training_per_target_language_per_class": per_class_xnli,
            "indicconbench_hindi_legal_nli_per_class": per_class_indic,
            "indicconbench_hindi_legal_nli_sampled": source_counts.get("indicconbench_hindi_legal_crosslingual", 0),
            "training_source_counts": source_counts,
        },
        "validation_samples": len(validation_rows),
        "validation_metrics": trainer.evaluate(),
        "validation_dataset_results": validation_dataset_results,
        "training_parameters": {
            "epochs": epochs,
            "per_device_batch_size": batch_size,
            "gradient_accumulation_steps": gradient_accumulation_steps,
            "max_length": max_length,
            "warmup_steps": warmup_steps,
            "seed": seed,
            "fp16": use_cuda,
            "device": "cuda" if use_cuda else "cpu",
            "gpu_name": torch.cuda.get_device_name(0) if use_cuda else None,
        },
        "train_runtime_seconds": round(time.time() - started, 2),
        "trainer_metrics": result.metrics,
        "heldout_test_results": final_test_results,
        "limitations": [
            "This is an experimental multilingual NLI checkpoint, not a legally validated Hindi/Spanish contract model.",
            "XNLI is general-domain and its non-English training data is machine-translated.",
            "Existing English legal pairs are retained in English; they are not translated into target languages for training.",
            "Hindi legal training/evaluation uses constitutional NLI, not contract-clause simplification; the benchmark includes mixed English/Hindi examples.",
            "The public Spanish legal simplification corpus was not used as three-way NLI because its simplified outputs are not independently label-validated for legal preservation.",
            "The training run uses a small balanced subset to fit available hardware; its results are a prototype, not a production-quality/legal validation claim.",
            "No native, expert-annotated Spanish legal clause-pair test set was found in this project; Spanish legal performance must not be claimed from XNLI scores.",
            "The existing rule-based analyzer is not thereby multilingual; its Spanish checks remain unsupported unless separately translated or implemented.",
        ],
    }
    (OUTPUT_DIR / "evaluation_report.json").write_text(json.dumps({"results": final_test_results}, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUTPUT_DIR / "training_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def evaluate_saved_checkpoint(
    per_class_xnli: int = 100,
    per_class_english: int = 150,
    per_class_indic: int = 75,
    max_length: int = 128,
) -> dict[str, Any]:
    """Recompute language-separated validation and held-out metrics without retraining."""
    summary_path = OUTPUT_DIR / "training_summary.json"
    if not summary_path.exists():
        raise FileNotFoundError("No completed training summary exists; run training before evaluation.")
    _, validation_rows, validation_sets, heldout = prepare_data(
        per_class_xnli=per_class_xnli,
        per_class_english=per_class_english,
        per_class_indic=per_class_indic,
    )
    tokenizer = AutoTokenizer.from_pretrained(str(OUTPUT_DIR), local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(str(OUTPUT_DIR), local_files_only=True)
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "evaluation_only"),
        per_device_eval_batch_size=2,
        fp16=torch.cuda.is_available(),
        dataloader_num_workers=0,
        report_to="none",
    )
    trainer = Trainer(
        model=model,
        args=args,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer, pad_to_multiple_of=8),
        compute_metrics=_metrics,
    )
    combined_validation = _tokenize(Dataset.from_list(validation_rows), tokenizer, max_length)
    validation_metrics = trainer.evaluate(combined_validation)
    validation_dataset_results = [
        _evaluate_report(
            trainer,
            _tokenize(Dataset.from_list(rows), tokenizer, max_length),
            name,
            "Validation split; not included in held-out test metrics.",
        )
        for name, rows in validation_sets.items()
    ]
    heldout_test_results = [
        _evaluate_report(
            trainer,
            _tokenize(Dataset.from_list(rows), tokenizer, max_length),
            name,
            "Official held-out test split; never used for training or model selection."
            if name.startswith("xnli_")
            else "Official IndicConBench article-held-out Hindi legal entailment test split; examples retain the dataset's mixed-language form.",
        )
        for name, rows in heldout.items()
    ]
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["validation_samples"] = len(validation_rows)
    summary["validation_metrics"] = validation_metrics
    summary["validation_dataset_results"] = validation_dataset_results
    summary["heldout_test_results"] = heldout_test_results
    summary["evaluation_note"] = "Validation and held-out test metrics are separated. Test sets were not used for training or model selection."
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    report = {
        "version": summary.get("version"),
        "checkpoint": str(OUTPUT_DIR),
        "validation": {"combined": validation_metrics, "datasets": validation_dataset_results},
        "heldout_test_results": heldout_test_results,
        "label_order": [ID2LABEL[i] for i in range(3)],
    }
    (OUTPUT_DIR / "evaluation_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return report


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--per-class-xnli", type=int, default=100)
    parser.add_argument("--per-class-english", type=int, default=150)
    parser.add_argument("--per-class-indic", type=int, default=75)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--gradient-accumulation-steps", type=int, default=8)
    parser.add_argument("--max-length", type=int, default=128)
    parser.add_argument("--evaluate-only", action="store_true", help="Recompute validation/test metrics for the saved checkpoint without training")
    arguments = parser.parse_args()
    options = vars(arguments)
    evaluate_only = options.pop("evaluate_only")
    if evaluate_only:
        evaluation_options = {
            key: options[key]
            for key in ("per_class_xnli", "per_class_english", "per_class_indic", "max_length")
        }
        result = evaluate_saved_checkpoint(**evaluation_options)
    else:
        result = train_multilingual(**options)
    print(json.dumps(result, indent=2, ensure_ascii=False))
