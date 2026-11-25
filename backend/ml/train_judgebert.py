"""
CLAUSEX AI — JUDGEBERT Transformer Fine-Tuning Pipeline
Trained on ContractNLI (Natural Language Inference on Legal Contracts)
Optimized for NVIDIA GeForce RTX 3050 6GB Laptop GPU (Ampere)
"""

import os
import sys
import json
import logging
from dataclasses import dataclass
from typing import Dict, Any, Optional

import torch
from torch.utils.data import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    DataCollatorWithPadding,
    set_seed,
)
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support

try:
    from ml.dataset_loader import get_nli_datasets, ID2LABEL, LABEL_MAPPING
except ImportError:
    from dataset_loader import get_nli_datasets, ID2LABEL, LABEL_MAPPING

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_judgebert")

DEFAULT_MODEL_NAME = "distilbert-base-uncased"
OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "judgebert_checkpoint")
)


class ContractNLIPairDataset(Dataset):
    def __init__(self, pairs, tokenizer, max_length=256):
        self.pairs = pairs
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        item = self.pairs[idx]
        encoding = self.tokenizer(
            item["premise"],
            item["hypothesis"],
            truncation=True,
            max_length=self.max_length,
            padding=False,  # dynamically padded by collator
        )
        encoding["labels"] = int(item["label"])
        return encoding


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(axis=-1)
    acc = accuracy_score(labels, preds)
    macro_f1 = f1_score(labels, preds, average="macro", zero_division=0)
    weighted_f1 = f1_score(labels, preds, average="weighted", zero_division=0)
    p, r, _, _ = precision_recall_fscore_support(labels, preds, average="macro", zero_division=0)

    return {
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "macro_precision": round(float(p), 4),
        "macro_recall": round(float(r), 4),
    }


def train(
    base_model: str = DEFAULT_MODEL_NAME,
    output_dir: str = OUTPUT_DIR,
    epochs: int = 2,
    batch_size: int = 16,
    learning_rate: float = 3e-5,
    max_length: int = 256,
    max_train_samples: int = 4000,
    max_val_samples: int = 800,
    seed: int = 42,
):
    set_seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    # 1. Hardware Check
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Target training device: {device}")
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
        logger.info(f"Using GPU: {gpu_name} ({vram_mb:.0f} MiB VRAM)")
        torch.cuda.empty_cache()

    # 2. Load and preprocess ContractNLI pairs
    logger.info("Loading ContractNLI dataset splits...")
    train_pairs, dev_pairs = get_nli_datasets(
        max_train_samples=max_train_samples,
        max_val_samples=max_val_samples,
        random_seed=seed,
    )
    logger.info(f"Prepared {len(train_pairs)} training pairs and {len(dev_pairs)} validation pairs.")

    # 3. Initialize Tokenizer & Model
    logger.info(f"Loading base model and tokenizer: {base_model}")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model,
        num_labels=3,
        id2label=ID2LABEL,
        label2id=LABEL_MAPPING,
    )

    # 4. Wrap in Datasets
    train_dataset = ContractNLIPairDataset(train_pairs, tokenizer, max_length=max_length)
    dev_dataset = ContractNLIPairDataset(dev_pairs, tokenizer, max_length=max_length)
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # 5. Training Arguments tailored for RTX 3050 6GB
    use_fp16 = torch.cuda.is_available()
    training_args = TrainingArguments(
        output_dir=os.path.join(output_dir, "training_checkpoints"),
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=1,
        learning_rate=learning_rate,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        num_train_epochs=epochs,
        weight_decay=0.01,
        warmup_steps=50,
        logging_steps=25,
        fp16=use_fp16,
        dataloader_num_workers=0,  # Windows process stability
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        greater_is_better=True,
        report_to="none",
        disable_tqdm=False,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=dev_dataset,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    # 6. Execute Training
    logger.info("Starting Transformer fine-tuning run...")
    train_result = trainer.train()

    # 7. Evaluate on validation set
    logger.info("Evaluating fine-tuned model on dev split...")
    eval_metrics = trainer.evaluate()
    logger.info(f"Evaluation metrics: {eval_metrics}")

    # 8. Save Final Model Artifacts
    logger.info(f"Saving fine-tuned JUDGEBERT model to: {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    summary = {
        "base_model": base_model,
        "dataset": "ContractNLI",
        "task": "Legal Clause Pair NLI & Meaning Preservation",
        "train_samples": len(train_pairs),
        "val_samples": len(dev_pairs),
        "epochs": epochs,
        "batch_size": batch_size,
        "fp16": use_fp16,
        "device": device,
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A",
        "train_runtime_seconds": round(train_result.metrics.get("train_runtime", 0), 2),
        "eval_accuracy": eval_metrics.get("eval_accuracy"),
        "eval_macro_f1": eval_metrics.get("eval_macro_f1"),
        "eval_weighted_f1": eval_metrics.get("eval_weighted_f1"),
        "eval_loss": eval_metrics.get("eval_loss"),
    }

    summary_path = os.path.join(output_dir, "training_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info(f"Training completed successfully! Summary written to {summary_path}")
    return summary


if __name__ == "__main__":
    train()
