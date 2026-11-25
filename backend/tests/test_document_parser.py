import io
from fastapi.testclient import TestClient
from docx import Document
from app.main import app

client = TestClient(app)

SAMPLE_VALID_PDF = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
72 712 Td
(Clause 1. The Borrower shall repay the principal on or before December 31.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000416 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
492
%%EOF
"""


def create_sample_docx_bytes() -> bytes:
    doc = Document()
    doc.add_heading("Section 1: Confidentiality Obligations", level=1)
    doc.add_paragraph("Each receiving party shall keep all confidential proprietary data strictly secret and shall not disclose trade secrets.")
    doc.add_heading("Section 2: Permitted Disclosures", level=1)
    doc.add_paragraph("A party may disclose confidential information if required by a court of law.")
    doc.add_heading("Section 3: Termination Conditions", level=1)
    doc.add_paragraph("Provided that either party provides thirty days written notice, this contract shall terminate.")
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


class TestDocumentParserEndpoint:
    def test_parse_valid_docx(self):
        docx_bytes = create_sample_docx_bytes()
        files = {
            "file": ("contract_agreement.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["filename"] == "contract_agreement.docx"
        assert data["fileType"] == "DOCX"
        assert data["clauseCount"] >= 3
        assert len(data["clauses"]) >= 3
        
        # Verify classification
        types = [c["type"] for c in data["clauses"]]
        assert "prohibition" in types
        assert "discretion" in types or "condition" in types
        assert all(len(c["text"]) > 10 for c in data["clauses"])

    def test_parse_valid_pdf(self):
        files = {
            "file": ("loan_contract.pdf", SAMPLE_VALID_PDF, "application/pdf")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["filename"] == "loan_contract.pdf"
        assert data["fileType"] == "PDF"
        assert data["pageCount"] == 1
        assert "shall repay" in data["rawText"]
        assert len(data["clauses"]) >= 1

    def test_parse_valid_txt(self):
        txt_content = (
            "Clause 1. Rent Payment\n"
            "The Tenant shall pay the monthly base rent of $4,500 on the first day of each month.\n\n"
            "Clause 2. Subleasing Restriction\n"
            "The Tenant shall not sublease or assign the premises without Landlord's written consent.\n\n"
            "Clause 3. Access Rights\n"
            "The Landlord may enter the premises upon giving 24 hours advance notice."
        ).encode("utf-8")
        
        files = {
            "file": ("lease_agreement.txt", txt_content, "text/plain")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["filename"] == "lease_agreement.txt"
        assert data["fileType"] == "TXT"
        assert data["clauseCount"] == 3
        assert data["clauses"][0]["type"] == "obligation"
        assert data["clauses"][1]["type"] == "prohibition"
        assert data["clauses"][2]["type"] == "discretion"

    def test_empty_file_rejected(self):
        files = {
            "file": ("empty.pdf", b"", "application/pdf")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 400
        assert "empty" in res.json()["detail"].lower()

    def test_invalid_extension_rejected(self):
        files = {
            "file": ("malicious_script.exe", b"MZ...", "application/octet-stream")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 400
        assert "unsupported" in res.json()["detail"].lower()

    def test_corrupt_file_handled(self):
        files = {
            "file": ("corrupt.pdf", b"NOT_A_REAL_PDF_HEADER", "application/pdf")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code in [400, 422]

    def test_oversized_file_rejected(self):
        # 11 MB dummy file
        oversized = b"x" * (11 * 1024 * 1024)
        files = {
            "file": ("giant_document.txt", oversized, "text/plain")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 400
        assert "exceeds" in res.json()["detail"].lower()

    def test_parse_docx_with_textboxes_and_headers(self):
        """Regression test: verifies DOCX with text in text boxes and headers is extracted successfully."""
        from docx.oxml import parse_xml
        from docx.oxml.ns import nsdecls

        doc = Document()
        # Add header
        doc.sections[0].header.paragraphs[0].text = "Header Clause: Master Professional Services Agreement"
        
        # Add drawing textbox
        p = doc.add_paragraph()
        xml_str = (
            f'<w:r {nsdecls("w")}><w:drawing><w:txbxContent>'
            '<w:p><w:r><w:t>Clause 1. Textbox Covenant: Neither party shall disclose confidential trade secrets.</w:t></w:r></w:p>'
            '</w:txbxContent></w:drawing></w:r>'
        )
        p._p.append(parse_xml(xml_str))

        # Add table
        table = doc.add_table(rows=1, cols=2)
        table.rows[0].cells[0].text = "Clause 2. Payment Terms"
        table.rows[0].cells[1].text = "The Client shall pay all invoices within thirty calendar days."

        buf = io.BytesIO()
        doc.save(buf)

        files = {
            "file": ("complex_contract_with_textboxes.docx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["fileType"] == "DOCX"
        assert data["clauseCount"] >= 2
        raw_text = data["rawText"]
        assert "Neither party shall disclose" in raw_text
        assert "thirty calendar days" in raw_text
        assert "Master Professional Services" in raw_text

    def test_parse_empty_docx_returns_docx_specific_error(self):
        """Verifies an empty DOCX returns a DOCX-specific error without mentioning PDFs or OCR scans."""
        blank_doc = Document()
        buf = io.BytesIO()
        blank_doc.save(buf)

        files = {
            "file": ("blank_template.docx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 422
        detail = res.json()["detail"]
        assert "DOCX" in detail
        assert "PDF" not in detail
        assert "scanned PDFs" not in detail

    def test_parse_empty_pdf_returns_pdf_specific_error(self):
        """Verifies a blank PDF returns a PDF/OCR-specific error."""
        blank_pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
            b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
            b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n188\n%%EOF\n"
        )
        files = {
            "file": ("scanned_blank.pdf", blank_pdf, "application/pdf")
        }
        res = client.post("/api/v1/documents/parse", files=files)
        assert res.status_code == 422
        detail = res.json()["detail"]
        assert "PDF" in detail
        assert "OCR" in detail
