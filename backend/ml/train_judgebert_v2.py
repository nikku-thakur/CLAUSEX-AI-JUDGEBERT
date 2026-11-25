"""
CLAUSEX AI — JUDGEBERT v2 Contrastive Fine-Tuning Pipeline
Trained on:
  - Local Ledgar Deontic & Exception Contrastive Pairs
  - Local ContractNLI Contract Inference Pairs
Hardware: NVIDIA GeForce RTX 3050 6GB Laptop GPU (Ampere)
Saved to: backend/models/judgebert_v2_contrastive (Separate from v1 checkpoint)
"""

import os
import sys
import json
import logging
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_judgebert_v2")

BASE_MODEL = "distilbert-base-uncased"
OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "judgebert_v2_contrastive")
)
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data_cache"))

ID2LABEL = {0: "Entailment", 1: "Neutral", 2: "Contradiction"}
LABEL2ID = {"Entailment": 0, "Neutral": 1, "Contradiction": 2}


class ContrastivePairDataset(Dataset):
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
            padding=False,
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


def train_v2(
    base_model: str = BASE_MODEL,
    output_dir: str = OUTPUT_DIR,
    epochs: int = 2,
    batch_size: int = 16,
    learning_rate: float = 3e-5,
    max_length: int = 256,
    seed: int = 42,
):
    set_seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    # 1. Device check
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Target training device: {device}")
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
        logger.info(f"Using GPU: {gpu_name} ({vram_mb:.0f} MiB VRAM)")
        torch.cuda.empty_cache()

    # 2. Load locally cached contrastive splits
    train_cache = os.path.join(CACHE_DIR, "train_contrastive.json")
    val_cache = os.path.join(CACHE_DIR, "val_contrastive.json")

    if not os.path.exists(train_cache) or not os.path.exists(val_cache):
        from ml.contrastive_dataset_builder import build_contrastive_splits
        train_pairs, val_pairs = build_contrastive_splits()
    else:
        logger.info(f"Loading cached contrastive splits from {CACHE_DIR}...")
        with open(train_cache, "r", encoding="utf-8") as f:
            train_pairs = json.load(f)
        with open(val_cache, "r", encoding="utf-8") as f:
            val_pairs = json.load(f)

    logger.info(f"Loaded {len(train_pairs)} training pairs and {len(val_pairs)} validation pairs.")

    # 3. Initialize Tokenizer & Model
    logger.info(f"Loading base model and tokenizer: {base_model}")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model,
        num_labels=3,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    # 4. Wrap in PyTorch Datasets
    train_dataset = ContrastivePairDataset(train_pairs, tokenizer, max_length=max_length)
    val_dataset = ContrastivePairDataset(val_pairs, tokenizer, max_length=max_length)
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
        dataloader_num_workers=0,
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
        eval_dataset=val_dataset,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    # 6. Execute Training
    logger.info("Starting JudgeBERT v2 Contrastive fine-tuning run on GPU...")
    train_result = trainer.train()

    # 7. Evaluate on validation set
    logger.info("Evaluating fine-tuned model on dev/val split...")
    eval_metrics = trainer.evaluate()
    logger.info(f"Evaluation metrics: {eval_metrics}")

    # 8. Save Final Model Artifacts
    logger.info(f"Saving fine-tuned JudgeBERT v2 model to: {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    summary = {
        "version": "v2_contrastive",
        "base_model": base_model,
        "datasets_used": [
            "Local Ledgar (Train 60k / Val 10k disjoint)",
            "Local ContractNLI (Train 423 / Dev 61 disjoint)"
        ],
        "training_samples": len(train_pairs),
        "validation_samples": len(val_pairs),
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
        "checkpoint_path": output_dir,
    }

    summary_path = os.path.join(output_dir, "training_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info(f"JudgeBERT v2 training completed successfully! Summary written to {summary_path}")
    return summary


if __name__ == "__main__":
    train_v2()
