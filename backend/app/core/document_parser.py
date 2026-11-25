import io
import re
import uuid
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Tuple, Optional
from pypdf import PdfReader
from docx import Document

from app.models.schemas import ParsedClause, ClauseType


def detect_clause_type(text: str) -> ClauseType:
    """Classifies a clause into obligation, prohibition, discretion, or condition."""
    lower = text.lower()
    
    # Prohibitions have highest precedence
    if any(p in lower for p in [
        "shall not", "must not", "may not", "will not", "neither party shall",
        "prohibited", "is not permitted", "under no circumstances",
        "नहीं करेगा", "अनुमति नहीं", "प्रतिबंधित"
    ]):
        return "prohibition"
    
    # Conditions
    if any(c in lower for c in [
        "provided that", "subject to", "in the event that", "on condition that",
        "conditional upon", "if and only if", "बशर्ते कि", "शर्त पर", "यदि"
    ]):
        return "condition"
    
    # Discretion / Permissions
    if any(d in lower for d in [
        "may", "is entitled to", "at its discretion", "at its sole discretion",
        "has the option to", "reserves the right", "अधिकार होगा", "सकता है"
    ]):
        return "discretion"
    
    # Default to obligation for legal clauses (shall, must, will, agrees, etc.)
    return "obligation"


def segment_into_clauses(text: str) -> List[ParsedClause]:
    """
    Intelligently segments legal document text into structured clauses.
    Detects standard clause/section markers (e.g. Clause 1, Section 2.1, Article III, खंड 1)
    or splits by structural paragraph breaks.
    """
    cleaned = text.strip()
    if not cleaned:
        return []

    # Pattern for standard legal headers:
    # e.g., "Clause 1. Term", "SECTION 2 - CONFIDENTIALITY", "Article IV: Indemnity", "खंड 1:"
    header_pattern = re.compile(
        r'(?:^|\n\s*\n)\s*(?P<header>(?:(?:Clause|CLAUSE|Section|SECTION|Article|ARTICLE|खंड|धारा)\s+[\dIVXivx]+[A-Za-z\.\-]*)'
        r'|(?:\d+[\.\)]\s+[A-Z][^\n]{3,60}))',
        re.MULTILINE
    )

    matches = list(header_pattern.finditer(cleaned))
    raw_blocks: List[Tuple[str, str]] = []

    if len(matches) >= 2:
        # Document contains clear structured clause headers
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(cleaned)
            block = cleaned[start:end].strip()
            header_text = match.group("header").strip()
            raw_blocks.append((header_text, block))
    else:
        # Fallback to paragraph-based segmentation (split on double newlines)
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n+', cleaned) if p.strip()]
        for idx, p in enumerate(paragraphs):
            first_line = p.split('\n')[0].strip()
            raw_blocks.append((first_line, p))

    # If the document had only 1 massive block without double newlines, split on sentence groups
    if len(raw_blocks) == 1 and len(raw_blocks[0][1]) > 800:
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', raw_blocks[0][1])
        if len(sentences) > 2:
            raw_blocks = []
            chunk_size = 2
            for i in range(0, len(sentences), chunk_size):
                chunk = " ".join(sentences[i:i + chunk_size]).strip()
                if chunk:
                    first_line = chunk.split('\n')[0].strip()
                    raw_blocks.append((first_line, chunk))

    clauses: List[ParsedClause] = []
    for idx, (header_hint, block_text) in enumerate(raw_blocks):
        if not block_text.strip():
            continue

        # Extract or derive title
        lines = [line.strip() for line in block_text.split('\n') if line.strip()]
        first_line = lines[0] if lines else f"Clause {idx + 1}"
        
        # Clean title
        clean_title = re.sub(r'^(?:Clause|CLAUSE|Section|SECTION|Article|ARTICLE|खंड|धारा)\s+[\dIVXivx\.\-]*[:\.\-]?\s*', '', first_line).strip()
        if not clean_title or len(clean_title) < 3:
            clean_title = first_line[:40]
        if len(clean_title) > 45:
            clean_title = clean_title[:42] + "..."

        clause_num = f"Clause {idx + 1}"
        num_match = re.search(r'(?:Clause|Section|Article|खंड|धारा)\s+([\dIVXivx\.\-]+)', first_line, re.IGNORECASE)
        if num_match:
            clause_num = f"Clause {num_match.group(1).rstrip('.:-')}"

        clause_type = detect_clause_type(block_text)

        clauses.append(ParsedClause(
            id=f"c-parsed-{uuid.uuid4().hex[:8]}-{idx + 1}",
            number=clause_num,
            title=clean_title,
            text=block_text,
            type=clause_type,
            simplifiedText=None
        ))

    # If no clauses parsed, create a fallback single clause
    if not clauses and cleaned:
        clauses.append(ParsedClause(
            id=f"c-parsed-{uuid.uuid4().hex[:8]}-1",
            number="Clause 1",
            title=cleaned[:35] + ("..." if len(cleaned) > 35 else ""),
            text=cleaned,
            type=detect_clause_type(cleaned),
            simplifiedText=None
        ))

    return clauses


def extract_pdf_text(file_bytes: bytes) -> Tuple[str, int]:
    """Extracts text and page count from a PDF binary stream."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Corrupt or invalid PDF file format: {str(e)}")

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception:
            raise ValueError("The PDF document is password-protected and cannot be parsed.")

    pages_text: List[str] = []
    for page in reader.pages:
        try:
            p_text = page.extract_text()
            if p_text and p_text.strip():
                pages_text.append(p_text.strip())
        except Exception:
            continue

    raw_text = "\n\n".join(pages_text).strip()
    return raw_text, len(reader.pages)


def extract_docx_text(file_bytes: bytes) -> Tuple[str, int]:
    """
    Extracts text from a DOCX binary stream.
    Supports standard body paragraphs, tables (including multi-line cells and nested tables),
    section headers and footers, text boxes (w:txbxContent), shapes, content controls (w:sdt),
    and falls back to deep OpenXML part extraction for maximal document coverage.
    """
    sections_text: List[str] = []
    seen_texts: set = set()

    def add_text_block(t: str):
        cleaned = t.strip()
        if cleaned and cleaned not in seen_texts:
            seen_texts.add(cleaned)
            sections_text.append(cleaned)

    # Strategy 1: python-docx object model with xpath for textboxes and sections
    try:
        doc = Document(io.BytesIO(file_bytes))

        # 1. Section Headers
        for section in doc.sections:
            for header in [section.header, getattr(section, 'first_page_header', None), getattr(section, 'even_page_header', None)]:
                if not header:
                    continue
                for p in header.paragraphs:
                    add_text_block(p.text)
                for table in header.tables:
                    for row in table.rows:
                        row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                        if row_cells:
                            add_text_block(" | ".join(row_cells))

        # 2. Main Body Paragraphs
        for p in doc.paragraphs:
            add_text_block(p.text)

        # 3. Main Body Tables (handling multi-line paragraphs in cells)
        for table in doc.tables:
            for row in table.rows:
                row_cells = []
                for cell in row.cells:
                    cell_text = "\n".join([cp.text.strip() for cp in cell.paragraphs if cp.text.strip()]) or cell.text.strip()
                    if cell_text:
                        row_cells.append(cell_text)
                if row_cells:
                    add_text_block(" | ".join(row_cells))

        # 4. Text Boxes & Drawings (w:txbxContent)
        try:
            txbx_paragraphs = doc.element.xpath('.//w:txbxContent//w:p')
            for p_node in txbx_paragraphs:
                text_runs = p_node.xpath('.//w:t/text()')
                p_text = "".join(text_runs).strip()
                add_text_block(p_text)
        except Exception:
            pass

        # 5. Content Controls / SDT (Structured Document Tags)
        try:
            sdt_paragraphs = doc.element.xpath('.//w:sdtContent//w:p')
            for p_node in sdt_paragraphs:
                text_runs = p_node.xpath('.//w:t/text()')
                p_text = "".join(text_runs).strip()
                add_text_block(p_text)
        except Exception:
            pass

        # 6. Embedded Drawing / Picture Alt-Text & Captions
        try:
            doc_prs = doc.element.xpath('.//wp:docPr')
            for doc_pr in doc_prs:
                descr = doc_pr.get('descr', '').strip()
                title = doc_pr.get('title', '').strip()
                if descr:
                    add_text_block(descr)
                elif title and not any(generic in title.lower() for generic in ['picture', 'image']):
                    add_text_block(title)
        except Exception:
            pass

        # 7. Section Footers
        for section in doc.sections:
            for footer in [section.footer, getattr(section, 'first_page_footer', None), getattr(section, 'even_page_footer', None)]:
                if not footer:
                    continue
                for p in footer.paragraphs:
                    add_text_block(p.text)
                for table in footer.tables:
                    for row in table.rows:
                        row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                        if row_cells:
                            add_text_block(" | ".join(row_cells))

        if sections_text:
            return "\n\n".join(sections_text).strip(), 1
    except Exception:
        # Fall through to deep XML extraction
        pass

    # Strategy 2: Deep XML Parsing across all XML parts in the DOCX zip package
    try:
        xml_blocks: List[str] = []
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            candidate_files = [
                f for f in z.namelist()
                if f.startswith("word/") and f.endswith(".xml")
                and not any(ignore in f for ignore in ["styles", "settings", "fontTable", "theme", "webSettings", "glossary"])
            ]
            candidate_files.sort(key=lambda x: (
                0 if "document.xml" in x else
                1 if "header" in x else
                2 if "footer" in x else
                3 if "footnotes" in x or "endnotes" in x else 4
            ))

            for xml_file in candidate_files:
                try:
                    tree = ET.fromstring(z.read(xml_file))
                    for elem in tree.iter():
                        tag_name = elem.tag.split("}")[-1]
                        if tag_name == "p":
                            p_words = []
                            for child in elem.iter():
                                child_tag = child.tag.split("}")[-1]
                                if child_tag == "t" and child.text:
                                    p_words.append(child.text)
                                elif child_tag in ["br", "cr"]:
                                    p_words.append("\n")
                                elif child_tag == "tab":
                                    p_words.append(" ")
                            p_line = "".join(p_words).strip()
                            if p_line and p_line not in seen_texts:
                                seen_texts.add(p_line)
                                xml_blocks.append(p_line)
                except Exception:
                    continue

        if xml_blocks:
            return "\n\n".join(xml_blocks).strip(), 1
    except Exception as e:
        raise ValueError(f"Corrupt or invalid DOCX file format: {str(e)}")

    return "\n\n".join(sections_text).strip(), 1


def extract_txt_text(file_bytes: bytes) -> Tuple[str, int]:
    """Extracts text from a plain text byte sequence."""
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            return file_bytes.decode(enc).strip(), 1
        except UnicodeDecodeError:
            continue
    raise ValueError("Unable to decode text file with standard encodings (UTF-8, Latin-1).")


def parse_document_file(filename: str, file_bytes: bytes) -> Tuple[str, str, int, Optional[int]]:
    """
    Identifies file type and parses raw text.
    Returns: (raw_text, normalized_file_type, file_size_bytes, page_count)
    """
    lower_name = filename.lower()
    file_size_bytes = len(file_bytes)

    if lower_name.endswith(".pdf"):
        file_type = "PDF"
        raw_text, page_count = extract_pdf_text(file_bytes)
    elif lower_name.endswith(".docx"):
        file_type = "DOCX"
        raw_text, page_count = extract_docx_text(file_bytes)
    elif lower_name.endswith(".txt"):
        file_type = "TXT"
        raw_text, page_count = extract_txt_text(file_bytes)
    else:
        raise ValueError(f"Unsupported file format '{filename}'. Only .pdf, .docx, and .txt files are supported.")

    return raw_text, file_type, file_size_bytes, page_count


def inspect_docx_media(file_bytes: bytes) -> List[str]:
    """
    Returns list of embedded image/media filenames found in the DOCX package (e.g. ['image1.png']).
    Useful for distinguishing empty documents from scanned or image-only documents.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            return sorted([
                f.split("/")[-1] for f in z.namelist()
                if f.startswith("word/media/") and f.split("/")[-1]
            ])
    except Exception:
        return []
