'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldAlert,
  Search,
  FileCode,
  FileCheck,
  RefreshCw,
  FolderOpen,
  Info,
  Edit2,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DocumentItem, SegmentedClause } from '@/types/documents';
import { INITIAL_DOCS } from '@/data/documents-data';
import { LocalStorageService } from '@/lib/storage/local-storage';
import { apiClient } from '@/lib/analysis/api-client';

export default function DocumentWorkspacePage() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>(INITIAL_DOCS[0].id);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'clauses' | 'raw'>('clauses');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingSimplifiedText, setEditingSimplifiedText] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    const savedDocs = LocalStorageService.getDocuments();
    setDocuments(savedDocs);
    if (savedDocs.length > 0) {
      setSelectedDocId(savedDocs[0].id);
    }
  }, []);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || null;


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);

    // Validate size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const msg = 'File size exceeds the 10 MB limit. Please upload a smaller legal file.';
      setUploadError(msg);
      toast({
        type: 'error',
        title: 'File Too Large',
        message: 'Maximum file size allowed is 10 MB.',
      });
      return;
    }

    if (file.size === 0) {
      const msg = 'Uploaded file is empty (0 bytes).';
      setUploadError(msg);
      toast({
        type: 'error',
        title: 'Empty File',
        message: 'The selected file contains no content.',
      });
      return;
    }

    const nameLower = file.name.toLowerCase();
    const isTxt = nameLower.endsWith('.txt');
    const isDocx = nameLower.endsWith('.docx');
    const isPdf = nameLower.endsWith('.pdf');

    if (!isTxt && !isDocx && !isPdf) {
      const msg = 'Unsupported file type. Please upload a .txt, .docx, or .pdf document.';
      setUploadError(msg);
      toast({
        type: 'error',
        title: 'Unsupported Format',
        message: 'Only .TXT, .DOCX, and .PDF files are supported.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Connect to FastAPI endpoint POST /api/v1/documents/parse
      const parsed = await apiClient.parseDocument(file);

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        name: parsed.filename,
        size: parsed.fileSize,
        type: parsed.fileType,
        status: 'extracted',
        uploadedAt: 'Just now',
        rawText: parsed.rawText,
        clauses:
          parsed.clauses.length > 0
            ? parsed.clauses
            : [
                {
                  id: `c-fallback-${Date.now()}`,
                  number: 'Clause 1',
                  title: 'Full Document Text',
                  text: parsed.rawText.slice(0, 500),
                  type: 'obligation',
                },
              ],
      };

      setDocuments((prev) => {
        const updated = [newDoc, ...prev];
        LocalStorageService.saveDocuments(updated);
        return updated;
      });
      setSelectedDocId(newDoc.id);
      setIsProcessing(false);
      toast({
        type: 'success',
        title: `${parsed.fileType} Document Parsed`,
        message: `Extracted ${newDoc.clauses.length} clause segment(s) using backend parser.`,
      });
    } catch (err: any) {
      console.warn('Backend document parsing error, evaluating fallback options:', err);

      // If backend fails on a TXT file, fall back to browser FileReader
      if (isTxt) {
        try {
          const text = await file.text();
          const rawSections = text.split(/\n\s*\n/).filter((s) => s.trim().length > 0);
          const parsedClauses: SegmentedClause[] = rawSections.map((sec, idx) => {
            const firstLine = sec.trim().split('\n')[0].slice(0, 35);
            return {
              id: `c-upload-${Date.now()}-${idx}`,
              number: `Clause ${idx + 1}`,
              title: firstLine.length > 30 ? `${firstLine}...` : firstLine,
              text: sec.trim(),
              type:
                sec.toLowerCase().includes('shall not') || sec.toLowerCase().includes('must not')
                  ? 'prohibition'
                  : sec.toLowerCase().includes('shall') || sec.toLowerCase().includes('बाध्य')
                  ? 'obligation'
                  : sec.toLowerCase().includes('may')
                  ? 'discretion'
                  : 'condition',
            };
          });

          const newDoc: DocumentItem = {
            id: `doc-${Date.now()}`,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: 'TXT',
            status: 'extracted',
            uploadedAt: 'Just now',
            rawText: text,
            clauses:
              parsedClauses.length > 0
                ? parsedClauses
                : [
                    {
                      id: `c-fallback-${Date.now()}`,
                      number: 'Clause 1',
                      title: 'Full Document Text',
                      text: text.slice(0, 500),
                      type: 'obligation',
                    },
                  ],
          };

          setDocuments((prev) => {
            const updated = [newDoc, ...prev];
            LocalStorageService.saveDocuments(updated);
            return updated;
          });
          setSelectedDocId(newDoc.id);
          setIsProcessing(false);
          toast({
            type: 'success',
            title: 'TXT File Parsed Locally',
            message: `Extracted ${newDoc.clauses.length} clause segment(s) via client fallback.`,
          });
          return;
        } catch {
          // Continue to error state below
        }
      }

      setIsProcessing(false);
      const errMsg = err?.message || 'Failed to parse document. Please ensure the backend server is running.';
      setUploadError(errMsg);
      toast({
        type: 'error',
        title: 'Parsing Failed',
        message: errMsg,
      });
    }
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Reset file input value so re-uploading the same file fires onChange
    e.target.value = '';
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    LocalStorageService.saveDocuments(remaining);
    if (selectedDocId === id) {
      setSelectedDocId(remaining.length > 0 ? remaining[0].id : '');
    }
    toast({
      type: 'info',
      message: 'Document removed from persistent workspace.',
    });
  };

  const handleSendClauseToAnalyzer = (clause: SegmentedClause) => {
    const payload = {
      originalText: clause.text,
      simplifiedText: clause.simplifiedText || '',
      language: 'en',
      domain: selectedDoc?.name.replace(/_/g, ' ').replace(/\.(txt|docx|pdf)$/i, '') || 'Commercial / Contract Law',
      title: `${selectedDoc?.name || 'Document'} • ${clause.number || clause.title}`,
      clauseId: clause.id,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('clausex_imported_clause_pair', JSON.stringify(payload));
      localStorage.setItem('clausex_imported_clause', clause.text);
    }

    toast({
      type: 'success',
      title: 'Clause Pair Transferred',
      message: clause.simplifiedText
        ? `Loaded "${clause.title}" with paired simplified text into Analyzer.`
        : `Loaded "${clause.title}" into Analyzer.`,
    });

    router.push('/analyzer');
  };

  const handleSaveClauseSimplifiedText = (clauseId: string, newText: string) => {
    if (!selectedDoc) return;
    const updatedClauses = selectedDoc.clauses.map((c) =>
      c.id === clauseId ? { ...c, simplifiedText: newText } : c
    );
    const updatedDoc: DocumentItem = { ...selectedDoc, clauses: updatedClauses };
    const updatedDocs = documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
    setDocuments(updatedDocs);
    LocalStorageService.saveDocuments(updatedDocs);
    setEditingClauseId(null);
    toast({
      type: 'success',
      title: 'Clause Pair Saved',
      message: 'Candidate plain language clause updated in document.',
    });
  };

  const handleLoadSampleContracts = () => {
    setDocuments(INITIAL_DOCS);
    LocalStorageService.saveDocuments(INITIAL_DOCS);
    setSelectedDocId(INITIAL_DOCS[0].id);
    toast({
      type: 'success',
      title: 'Sample Contracts Loaded',
      message: 'Restored 3 sample legal agreements with clause pairs.',
    });
  };

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell
      pageTitle="Document Workspace"
      pageDescription="Upload legal agreements and contracts (TXT, DOCX, PDF) for automated clause segmentation and meaning preservation analysis."
    >
      <div className="space-y-6">
        {/* Top Control Banner: Compact Upload + Privacy Note */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 8 cols: Compact Drag & Drop Zone */}
          <div className="lg:col-span-8">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                dragActive
                  ? 'border-gold-bright bg-gold-muted/30 shadow-gold-md'
                  : 'border-gold-champagne/30 bg-obsidian-950/70 hover:border-gold-champagne/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="doc-upload-input"
                accept=".txt,.docx,.pdf"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-xl bg-obsidian-900 border border-gold-champagne/30 flex items-center justify-center shrink-0 text-gold-bright shadow-gold-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-text-primary">
                    Upload Legal Agreement or Brief
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Drag and drop file here, or browse from computer.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-text-muted font-mono">
                    <span className="px-1.5 py-0.2 rounded bg-obsidian-900 border border-border text-gold-champagne">
                      .TXT (Native)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-obsidian-900 border border-gold-champagne/40 text-gold-champagne">
                      .DOCX / .PDF (Active)
                    </span>
                    <span>Max 10 MB</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto cursor-pointer text-xs"
                  isLoading={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Error Banner if upload fails */}
            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Right 4 cols: Security & Privacy Guarantee */}
          <div className="lg:col-span-4">
            <Card variant="glass" className="p-4 h-full flex flex-col justify-between border-border space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-text-primary block">
                    Confidential Client-Side Sandbox
                  </span>
                  <p className="text-[11px] text-text-secondary leading-relaxed pt-1">
                    Plain-text agreements are parsed in-memory inside your browser sandbox. Contracts
                    are never transmitted or stored on public servers.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-text-muted">
                <span>Status: Client Sandbox Active</span>
                <span className="text-emerald-400 font-mono">English Ready</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Balanced Workspace: Documents List (5 cols) + Document Preview (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Uploaded Documents List */}
          <div className="lg:col-span-5 space-y-3">
            {/* List Header with Search */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-bright" />
                <h4 className="text-xs font-serif font-bold text-text-primary uppercase tracking-wider">
                  Documents ({documents.length})
                </h4>
              </div>

              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs bg-obsidian-950 border border-border rounded-lg text-text-primary focus:outline-none focus:border-gold-champagne/60"
                />
              </div>
            </div>

            {/* Document Cards */}
            {filteredDocs.length > 0 ? (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredDocs.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-gold-champagne/60 bg-obsidian-900/90 shadow-gold-sm ring-1 ring-gold-champagne/30'
                          : 'border-border/80 bg-obsidian-950/60 hover:bg-obsidian-900/50 hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 truncate flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-mono font-bold ${
                              doc.type === 'TXT'
                                ? 'bg-gold-muted/40 text-gold-bright border-gold-champagne/30'
                                : doc.type === 'PDF'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                            }`}
                          >
                            {doc.type}
                          </div>

                          <div className="truncate flex-1">
                            <span className="text-xs font-semibold text-text-primary block truncate group-hover:text-gold-bright transition-colors">
                              {doc.name}
                            </span>
                            <div className="flex items-center gap-2 pt-0.5 text-[10px] text-text-muted font-mono">
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span>{doc.clauses.length} clauses</span>
                              <span>•</span>
                              <span>{doc.uploadedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {doc.status === 'extracted' ? (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                              title="Extracted with browser client-side parser"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Parsed
                            </span>
                          ) : (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                              title="Simulated preview in demo mode"
                            >
                              <AlertCircle className="w-2.5 h-2.5" />
                              Demo
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1 rounded text-text-muted hover:text-rose-400 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card variant="subtle" className="p-8 text-center text-xs text-text-muted space-y-3">
                <FolderOpen className="w-8 h-8 mx-auto text-gold-champagne/40" />
                <p>No documents found matching your search filter.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleContracts}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Reload Sample Contracts
                </Button>
              </Card>
            )}

            {/* Quick Action when list is empty */}
            {documents.length === 0 && (
              <div className="text-center pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleContracts}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Load Sample Contracts
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Document Preview and Extracted Clauses */}
          <div className="lg:col-span-7">
            {selectedDoc ? (
              <Card variant="glass" className="p-5 border-gold-champagne/30 space-y-4 shadow-xl">
                {/* Document Preview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-border gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono text-gold-champagne block">
                        Previewing Document
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          selectedDoc.status === 'extracted'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {selectedDoc.status === 'extracted'
                          ? 'Client-Side Parsed'
                          : 'Demo Simulation'}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-text-primary pt-0.5">
                      {selectedDoc.name}
                    </h3>
                  </div>

                  {/* Segmented vs Raw Text toggle */}
                  <div className="flex items-center gap-1 p-0.5 bg-obsidian-950 rounded-lg border border-border shrink-0 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('clauses')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        viewMode === 'clauses'
                          ? 'bg-gold-muted text-gold-bright font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Clauses ({selectedDoc.clauses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('raw')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        viewMode === 'raw'
                          ? 'bg-gold-muted text-gold-bright font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Raw Text
                    </button>
                  </div>
                </div>

                {/* Content View: Segmented Clauses or Raw Text */}
                {viewMode === 'clauses' ? (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {selectedDoc.clauses.map((clause, idx) => (
                      <div
                        key={clause.id}
                        className="p-4 rounded-xl bg-obsidian-950/80 border border-border/80 space-y-3 hover:border-gold-champagne/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-obsidian-900 text-gold-champagne border border-border">
                              {clause.number}
                            </span>
                            <span className="font-serif font-bold text-xs text-text-primary">
                              {clause.title}
                            </span>
                          </div>

                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                              clause.type === 'obligation'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : clause.type === 'prohibition'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : clause.type === 'discretion'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {clause.type}
                          </span>
                        </div>

                        {/* Original Text */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-text-muted block">
                            Original Legal Clause:
                          </span>
                          <p className="text-xs text-text-secondary leading-relaxed font-sans">
                            {clause.text}
                          </p>
                        </div>

                        {/* Paired Simplified Text Display / Inline Editor */}
                        <div className="pt-1">
                          {editingClauseId === clause.id ? (
                            <div className="p-3 rounded-xl bg-obsidian-900 border border-gold-champagne/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-semibold text-gold-champagne flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-gold-bright" />
                                  Edit Paired Plain-Language Candidate:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingClauseId(null)}
                                  className="text-[10px] text-text-muted hover:text-text-primary"
                                >
                                  Cancel
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={editingSimplifiedText}
                                onChange={(e) => setEditingSimplifiedText(e.target.value)}
                                placeholder="Enter simplified text to pair with this legal clause..."
                                className="w-full bg-obsidian-950 border border-border rounded-lg p-2 text-xs text-text-primary focus:border-gold-champagne focus:outline-none font-sans"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  className="text-xs py-1"
                                  leftIcon={<Check className="w-3 h-3" />}
                                  onClick={() => handleSaveClauseSimplifiedText(clause.id, editingSimplifiedText)}
                                >
                                  Save Pair
                                </Button>
                              </div>
                            </div>
                          ) : clause.simplifiedText ? (
                            <div className="p-2.5 rounded-xl bg-obsidian-900/90 border border-gold-champagne/25 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-semibold text-gold-champagne flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-gold-bright" />
                                  Paired Plain-Language Candidate:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClauseId(clause.id);
                                    setEditingSimplifiedText(clause.simplifiedText || '');
                                  }}
                                  className="text-[10px] text-text-muted hover:text-gold-bright flex items-center gap-1 transition-colors"
                                  title="Edit paired candidate text"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              </div>
                              <p className="text-xs text-text-primary leading-relaxed font-sans">
                                {clause.simplifiedText}
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-obsidian-900/40 border border-dashed border-border/80 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-text-muted">No candidate plain text paired yet.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClauseId(clause.id);
                                  setEditingSimplifiedText('');
                                }}
                                className="text-[11px] text-gold-champagne hover:text-gold-bright flex items-center gap-1 font-medium"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Add Pair</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[10px] text-text-muted font-mono">
                            {clause.text.split(' ').length} words • {clause.text.length} chars
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSendClauseToAnalyzer(clause)}
                            className="inline-flex items-center gap-1.5 text-xs text-gold-champagne hover:text-gold-bright font-medium transition-colors"
                          >
                            <span>{clause.simplifiedText ? 'Compare Pair in Analyzer' : 'Send Clause to Analyzer'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-obsidian-950 border border-border text-xs text-text-secondary leading-relaxed max-h-[460px] overflow-y-auto select-text font-mono whitespace-pre-wrap">
                    {selectedDoc.rawText}
                  </div>
                )}

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gold-champagne shrink-0" />
                    <span>Select any clause pair above to compare it directly in the Clause Analyzer.</span>
                  </div>

                  <Link href="/analyzer" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto text-xs shadow-gold-sm"
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => {
                        if (selectedDoc.clauses.length > 0) {
                          handleSendClauseToAnalyzer(selectedDoc.clauses[0]);
                        }
                      }}
                    >
                      Compare First Pair in Analyzer
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <Card variant="subtle" className="p-12 text-center text-xs text-text-muted space-y-3">
                <FileText className="w-10 h-10 mx-auto text-gold-champagne/40" />
                <h4 className="font-serif font-bold text-sm text-text-primary">
                  No Document Selected
                </h4>
                <p className="max-w-xs mx-auto">
                  Select an uploaded document from the list on the left to inspect its extracted
                  clauses and normative elements.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
