from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestApiEndpoints:
    def test_health_check_root(self):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "ClauseX AI — JUDGEBERT Inference Service"

    def test_health_check_v1(self):
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"

    def test_analyze_endpoint_success(self):
        payload = {
            "originalText": "The Tenant shall pay all utility bills on or before the first day of each month.",
            "simplifiedText": "The Tenant may pay utility bills on or before the first day of each month.",
            "language": "en",
            "domain": "Real Estate / Commercial Leasing"
        }
        res = client.post("/api/v1/analyze", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert "lmpScore" in data
        assert "preservationStatus" in data
        assert data["preservationStatus"] == "critical_alteration"
        assert "analysis_id" in data
        assert "preservation_score" in data
        assert "overall_status" in data
        assert "obligation_analysis" in data
        assert "condition_analysis" in data

    def test_empty_input_validation_error(self):
        payload = {
            "originalText": "   ",
            "simplifiedText": "Valid simplified text",
            "language": "en"
        }
        res = client.post("/api/v1/analyze", json=payload)
        assert res.status_code == 422

    def test_missing_fields_validation_error(self):
        payload = {
            "originalText": "Some text"
            # simplifiedText missing
        }
        res = client.post("/api/v1/analyze", json=payload)
        assert res.status_code == 422
