from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.models.schemas import DocumentParseResponse
from app.core.document_parser import parse_document_file, segment_into_clauses, inspect_docx_media

router = APIRouter()

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = (".pdf", ".docx", ".txt")


@router.post("/parse", response_model=DocumentParseResponse)
async def parse_document(file: UploadFile = File(...)):
    """
    Parses an uploaded legal document (PDF, DOCX, or TXT), validates format and size,
    extracts raw text, and segments the text into structured legal clauses.
    """
    filename = file.filename or "uploaded_document"
    lower_filename = filename.lower()

    # Validate file extension
    if not any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{filename}'. Only .pdf, .docx, and .txt files are supported."
        )

    # Read binary content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # Validate non-empty file
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # Validate file size (max 10 MB)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({len(content)} bytes) exceeds the maximum limit of 10 MB."
        )

    # Parse file contents
    try:
        raw_text, file_type, file_size_bytes, page_count = parse_document_file(filename, content)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while extracting text: {str(e)}"
        )

    # Validate extractable text with format-specific messaging
    if not raw_text or not raw_text.strip():
        if file_type == "DOCX":
            detail_msg = (
                f"No readable text could be extracted from '{filename}'. "
                "The DOCX document contains no text paragraphs, tables, or text boxes (it may be empty or contain only non-OCR images)."
            )
        elif file_type == "PDF":
            detail_msg = (
                f"No readable text could be extracted from '{filename}'. "
                "Image-only or scanned PDFs are not supported without an OCR text layer."
            )
        else:
            detail_msg = f"The uploaded file '{filename}' contains no readable text."

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail_msg
        )

    # Segment into clauses
    clauses = segment_into_clauses(raw_text)

    # Compute size string
    size_kb = file_size_bytes / 1024
    size_str = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{(size_kb / 1024):.2f} MB"

    return DocumentParseResponse(
        filename=filename,
        fileType=file_type,
        fileSize=size_str,
        fileSizeBytes=file_size_bytes,
        rawText=raw_text,
        clauses=clauses,
        clauseCount=len(clauses),
        pageCount=page_count,
        characterCount=len(raw_text),
        wordCount=len(raw_text.split())
    )
