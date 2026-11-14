# Gap analysis (as of Phase 4 shared modules)

## Built and tested (69 tests)
shell: login flow, roles, project selector | shared: format-utils, calc-engine, api-client (header-name reads),
audit-log (soft delete only), vendor-master (Master parsing, admin-only edit), trip-entry, diesel-urea-entry,
payment-ledger (vendor statement), pnl-dashboard (data only), reports (truck-wise / vendor-wise totals).

## NOT built yet (blocked on information)
1. projects/<name>/config.js + project pages: need each live Apps Script Web App URL, its GET/POST request format
   (from each Code.gs) and each sheet's exact header names. Without the request format, a page cannot read/write safely.
2. Screens (HTML) for entry, ledger, P&L and reports. The modules return data; rendering is not built.
3. One integration test per project: needs a TEST sheet/tab per project.
4. Real Firebase login: needs firebaseConfig (docs/firebase-setup.md).

## Rules found in project notes that differ from the platform prompt. Please confirm each:
A. TDS 0%: Hopper Master allows an explicit 0 (= no TDS), blank = 1%. Engine now accepts 0, 1, 2 (prompt said only 1 or 2).
B. MIRA MUNDLY: notes say revenue - TDS - diesel, THEN GST added on that final amount. Prompt says GST on Basic only.
   Engine follows the PROMPT. Not changed for MIRA until you confirm.
C. HOPPER 63 notes: "Net (Revenue - Diesel/Urea/Other/TP) then minus TDS%". Prompt says TDS on Basic only.
   Engine follows the PROMPT. Please confirm which is right.
D. Driver TP (per-trip incentive) and FLYASH advance: engine supports them only as "other" deductions. Not auto-generated yet.
E. Language: notes for FLYASH and MIRA say English only; prompt says Hindi/English mixed. UI text is English for now.
F. Spelling "Depo" (FLYASH) is not used anywhere yet because FLYASH screens are not built.
G. Rates are locked at entry time from Master (matches Hopper's final decision). A later Master change never edits old rows.
