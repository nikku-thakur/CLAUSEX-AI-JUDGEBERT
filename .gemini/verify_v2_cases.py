import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

from ml.inference import JudgeBERTInference, CHECKPOINT_DIR, V2_DIR, V1_DIR
from app.models.schemas import AnalyzePayload
from app.core.analyzer import analyze_clause_pair

print("=" * 60)
print("CHECKPOINT VERIFICATION")
print("=" * 60)
print(f"V2_DIR: {V2_DIR} (exists: {os.path.exists(V2_DIR)})")
print(f"V1_DIR: {V1_DIR} (exists: {os.path.exists(V1_DIR)})")
print(f"CHECKPOINT_DIR: {CHECKPOINT_DIR}")

infer = JudgeBERTInference.get_instance()
print(f"Loaded checkpoint dir: {infer.model_dir}")
print(f"Active device: {infer.device}")
print(f"Inference loaded: {infer.is_available()}")

cases = [
    {
        "name": "Case 1: Meaning-preserving paraphrase",
        "orig": "The tenant must pay rent within 7 days.",
        "simp": "The tenant is required to pay rent within seven days.",
    },
    {
        "name": "Case 2: must -> may obligation change",
        "orig": "The tenant must pay rent within 7 days.",
        "simp": "The tenant may pay rent within 7 days.",
    },
    {
        "name": "Case 3: Dropped unless exception",
        "orig": "The tenant must pay rent within 7 days unless the landlord grants an extension.",
        "simp": "The tenant must pay rent within 7 days.",
    },
]

print("\n" + "=" * 60)
print("STANDALONE NEURAL INFERENCE ON 3 TEST CASES")
print("=" * 60)
for c in cases:
    pred = infer.predict_pair(c["orig"], c["simp"])
    print(f"\n--- {c['name']} ---")
    print(f"Original:   \"{c['orig']}\"")
    print(f"Rewritten:  \"{c['simp']}\"")
    print(f"Predicted NLI Label: {pred['predictedNliLabel']}")
    print(f"Probabilities: {pred['probabilities']}")
    print(f"LMP Score: {pred['lmpScore']}/10.0")
    print(f"Status: {pred['status']}")
    print(f"Interpretation: {pred['interpretation']}")
