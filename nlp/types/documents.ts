export interface SegmentedClause {
  id: string;
  number: string;
  title: string;
  text: string;
  simplifiedText?: string;
  type: 'obligation' | 'condition' | 'prohibition' | 'discretion';
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  type: 'TXT' | 'DOCX' | 'PDF';
  status: 'extracted' | 'demo_sample';
  uploadedAt: string;
  clauses: SegmentedClause[];
  rawText: string;
}

export interface ClauseImportPairPayload {
  originalText: string;
  simplifiedText: string;
  language?: 'en' | 'hi';
  domain?: string;
  title?: string;
  clauseId?: string;
}

export interface DocumentParseResponse {
  filename: string;
  fileType: 'TXT' | 'DOCX' | 'PDF';
  fileSize: string;
  fileSizeBytes: number;
  rawText: string;
  clauses: SegmentedClause[];
  clauseCount: number;
  pageCount?: number;
  characterCount: number;
  wordCount: number;
}
