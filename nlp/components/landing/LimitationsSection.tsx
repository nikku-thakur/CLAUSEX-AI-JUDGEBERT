import React from 'react';
import { ShieldAlert, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const LimitationsSection: React.FC = () => {
  return (
    <section id="limitations" className="py-20 border-t border-border bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-gold rounded-2xl p-8 sm:p-10 border border-gold-champagne/30 shadow-2xl max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian-950 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-gold-bright">
                Responsible AI & Legal Scope Disclaimer
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Ethical boundaries and operational limitations of the ClauseX research prototype.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-secondary leading-relaxed pt-2 border-t border-border">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text-primary">Not Legal Advice:</strong> ClauseX AI is an
                  experimental academic prototype built for explainable AI evaluation. It does not
                  constitute formal legal counsel or create an attorney-client relationship.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text-primary">Human-in-the-Loop Requirement:</strong>{' '}
                  Critical agreements must always be verified by licensed legal professionals before
                  execution. Automated scores should serve as an audit aid, not final adjudication.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text-primary">Data Privacy & Client Confidentiality:</strong>{' '}
                  In demo mode, text analysis executes entirely in the client browser. No client-confidential
                  clause data is logged, shared, or indexed externally.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text-primary">Jurisdictional Context:</strong> Statutory
                  implications vary across jurisdictions (e.g. US Common Law vs Indian State Acts).
                  Always verify domain applicability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
