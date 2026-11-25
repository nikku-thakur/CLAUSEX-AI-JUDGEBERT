import os
import sys
import json

sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app
from ml.inference import JudgeBERTInference, CHECKPOINT_DIR, V2_DIR, V1_DIR

client = TestClient(app)

print("=" * 80)
print("1. CHECKPOINT RESOLUTION & BACKEND MODEL LOADING VERIFICATION")
print("=" * 80)
print(f"V2 Expected Checkpoint Dir: {V2_DIR}")
print(f"V2 config.json exists:     {os.path.exists(os.path.join(V2_DIR, 'config.json'))}")
print(f"V1 Fallback Dir:            {V1_DIR}")
print(f"V1 config.json exists:     {os.path.exists(os.path.join(V1_DIR, 'config.json'))}")
print(f"Active CHECKPOINT_DIR:     {CHECKPOINT_DIR}")

infer_engine = JudgeBERTInference.get_instance()
print(f"Instance model_dir:        {infer_engine.model_dir}")
print(f"Is v2 checkpoint loaded:   {'judgebert_v2_contrastive' in infer_engine.model_dir}")
print(f"Is model loaded:           {infer_engine.is_available()}")
print(f"Inference device:          {infer_engine.device}")

test_cases = [
    {
        "id": "case_1_paraphrase",
        "title": "Case 1: Meaning-Preserving Paraphrase",
        "payload": {
            "originalText": "The tenant must pay rent within 7 days.",
            "simplifiedText": "The tenant is required to pay rent within seven days.",
            "language": "en",
            "domain": "Real Estate / Commercial Leasing"
        }
    },
    {
        "id": "case_2_modality_shift",
        "title": "Case 2: must -> may Obligation Weakening",
        "payload": {
            "originalText": "The tenant must pay rent within 7 days.",
            "simplifiedText": "The tenant may pay rent within 7 days.",
            "language": "en",
            "domain": "Real Estate / Commercial Leasing"
        }
    },
    {
        "id": "case_3_dropped_exception",
        "title": "Case 3: Dropped unless Exception",
        "payload": {
            "originalText": "The tenant must pay rent within 7 days unless the landlord grants an extension.",
            "simplifiedText": "The tenant must pay rent within 7 days.",
            "language": "en",
            "domain": "Real Estate / Commercial Leasing"
        }
    }
]

print("\n" + "=" * 80)
print("2. END-TO-END FASTAPI ENDPOINT INFERENCE (/api/v1/analyze)")
print("=" * 80)

results = {}

for tc in test_cases:
    print(f"\n>>> Running {tc['title']} ...")
    response = client.post("/api/v1/analyze", json=tc["payload"])
    assert response.status_code == 200, f"Failed with {response.status_code}: {response.text}"
    data = response.json()
    results[tc["id"]] = data

    print(f"HTTP Status:          {response.status_code} OK")
    print(f"sourceEngine:         {data.get('sourceEngine')}")
    print(f"lmpScore:             {data.get('lmpScore')}/10.0")
    print(f"preservationStatus:   {data.get('preservationStatus')}")
    print(f"humanReviewRequired:  {data.get('humanReviewRecommended')}")
    
    # Model Analysis (Neural)
    ma = data.get("modelAnalysis") or {}
    print(f"[Neural Model]")
    print(f"  Model:              {ma.get('model')}")
    print(f"  Checkpoint:         {ma.get('checkpoint')}")
    print(f"  Predicted Label:    {ma.get('predictedNliLabel')}")
    print(f"  Probabilities:      {ma.get('probabilities')}")
    print(f"  Neural LMP:         {ma.get('lmpScore')}/10.0")
    print(f"  Device:             {ma.get('device')}")

    # Rule-Based Analysis (Symbolic)
    print(f"[Rule-Based Breakdown]")
    deontic = data.get("deonticBreakdown", {})
    cond = data.get("conditionsBreakdown", {})
    shifts = deontic.get("shifts", [])
    dropped_exc = cond.get("droppedExceptions", [])
    dropped_cond = cond.get("droppedConditions", [])
    print(f"  Original Duties:    {deontic.get('originalObligations')}")
    print(f"  Simplified Duties:  {deontic.get('simplifiedObligations')}")
    formatted_shifts = [s.get('from', '') + ' -> ' + s.get('to', '') + ' (' + s.get('severity', '') + ')' for s in shifts]
    print(f"  Deontic Shifts:     {formatted_shifts}")

    print(f"  Original Exc:       {cond.get('originalExceptions')}")
    print(f"  Simplified Exc:     {cond.get('simplifiedExceptions')}")
    print(f"  Dropped Exc:        {dropped_exc}")
    print(f"  Critical Changes:   {len(data.get('criticalChanges', []))} flagged")
    for cc in data.get("criticalChanges", []):
        print(f"    - [{cc.get('severity').upper()}] {cc.get('title')}: {cc.get('explanation')}")

    print(f"[Pipeline Explanation]")
    print(f"  {data.get('ruleExplanation')}")

# Save full JSON evidence
with open(".gemini/endpoint_e2e_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nFull JSON evidence saved to .gemini/endpoint_e2e_results.json")
