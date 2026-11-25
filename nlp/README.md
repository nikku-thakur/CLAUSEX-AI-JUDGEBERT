# ClauseX AI — Explainable Multilingual Legal Meaning Preservation Using JUDGEBERT

ClauseX AI is a research-oriented legal technology platform designed to investigate whether simplified English and Hindi legal texts preserve the essential obligations, conditions, exceptions, and intent of the original.

---

## Key Capabilities

- **Legal Meaning Preservation (LMP) Scoring:** Evaluates normative fidelity on a calibrated 1.0 to 10.0 scale.
- **Deontic Shift Analysis:** Detects subtle inversions between obligations (*shall*, *must*, *अनिवार्य*), permissions (*may*, *can*, *सकती है*), and prohibitions (*shall not*, *cannot*).
- **Multilingual Support:** Purpose-built for English common law agreements and Hindi legal statutory corpora (including tenancy, employment, consumer protection, and contract law).
- **Explainable Evidence Highlighting:** Verbatim token-level difference highlighting (additions, omissions, critical alterations) with statutory significance notes.
- **Academic Benchmark Suite:** Quantitative comparison showing why generic embedding Cosine Similarity (Pearson r ~0.41) and BERTScore (Pearson r ~0.58) fail on legal nuances where JUDGEBERT transformer regression succeeds.
- **16 Difficult Legal Scenarios:** Pre-curated edge cases covering condition drops, deadline shortening, monetary cap truncations, and entity substitutions.
- **Human Annotation Hub:** Pairwise scoring workspace with inter-annotator rubric guidance and batch CSV/JSON export.

---

## Design System: Obsidian Gold

- **Background:** `#08090D`
- **Secondary Background:** `#101218`
- **Elevated Cards:** `#151820`
- **Champagne Gold:** `#D6B46A`
- **Bright Gold:** `#F4CD7A`
- **Primary Text:** `#F4F0E7`
- **Secondary Text:** `#A4A7B0`
- **Borders:** `rgba(214, 180, 106, 0.18)`
- **Success:** Muted Emerald (`#10B981`)
- **Warning:** Amber (`#F59E0B`)
- **Critical Changes:** Refined Coral Red (`#F87171`)
- **Typography:** Editorial Serif (*Cinzel*) for titles; Clean Modern Sans (*Inter*) for interface.

---

## Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Vanilla Tailwind CSS with custom Obsidian Gold design system
- **Motion & Interaction:** Framer Motion, HTML5 Canvas 192-frame cinematic playback
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Storage:** LocalStorage with recovery & seed initializers
- **Exporting:** Client-side JSON, CSV, Markdown, and formatted Print-to-PDF

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with fonts & SEO
│   ├── globals.css             # Obsidian Gold design tokens & print styles
│   ├── page.tsx                # Cinematic landing page
│   ├── dashboard/page.tsx      # Research overview & metric counters
│   ├── analyzer/page.tsx       # Core clause analyzer
│   ├── change-explorer/page.tsx# Categorized legal changes explorer
│   ├── documents/page.tsx      # Document workspace (browser TXT parsing)
│   ├── history/page.tsx        # Analysis history with filters & export
│   ├── research/page.tsx       # JUDGEBERT architecture & experiment configs
│   ├── benchmarks/page.tsx     # Recharts correlation & error distribution
│   ├── annotations/page.tsx    # Human gold-standard annotation hub
│   ├── difficult-cases/page.tsx# 16 curated legal scenario templates
│   ├── settings/page.tsx       # System preferences & demo storage reset
│   └── not-found.tsx           # Custom 404 page
├── components/
│   ├── layout/                 # Navbar, Sidebar, AppShell, Footer
│   ├── landing/                # Hero canvas player & 9 landing sections
│   ├── analyzer/               # Input panel, results view, spans, reports
│   ├── charts/                 # ScoreGauge & BenchmarkCharts
│   └── ui/                     # Button, Badge, Card, Modal, Toast
├── data/
│   ├── sample-cases.ts         # 10 illustrative bilingual sample cases
│   ├── difficult-cases.ts      # 16 difficult legal scenarios
│   ├── benchmark-data.ts       # Pearson/Spearman/MAE/RMSE comparison data
│   └── annotations-data.ts    # Initial annotation records & rubric
├── lib/
│   ├── analysis/               # Deterministic demo engine & API client
│   ├── storage/                # LocalStorage service with auto-recovery
│   ├── export/                 # Markdown, CSV, and JSON download utilities
│   └── utils/                  # Tailwind cn utility
└── types/                      # Strict TypeScript interfaces
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build for Production

```bash
npm run build
npm run start
```

---

## Backend Integration

By default, ClauseX AI runs in offline demo mode using its deterministic, transparent rule-based engine. To connect a trained JUDGEBERT FastAPI service:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Update `NEXT_PUBLIC_API_URL` to your FastAPI server endpoint (e.g. `http://localhost:8000/api/v1`).
3. Set `NEXT_PUBLIC_DEMO_MODE=false`.

---

## Responsible AI & Limitations Disclaimer

ClauseX AI is an experimental academic prototype designed to support informed legal meaning evaluation. It is **not** an attorney and does **not** provide definitive legal advice. Critical agreements must always be verified by qualified legal counsel.
