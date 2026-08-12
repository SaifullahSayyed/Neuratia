# CogniDetect — Data Ethics & Privacy Statement

> **Status:** Research prototype. This document reflects the intended data-handling
> approach for a production version. Current implementation is pre-launch.

---

## What is collected and why

| Data | Purpose | Stored where |
|---|---|---|
| Email address | Account identity (Supabase Auth) | Supabase Auth |
| Full name, age, education level | Cognitive score normalization (age/education are major confounds in cognitive testing) | Supabase DB — `profiles` table |
| Audio recording of speech task | Acoustic + linguistic biomarker extraction | Supabase Storage (object store) — never on server disk |
| Gaze fixation coordinates + timestamps | Oculomotor metric extraction — **no raw video is ever sent to the server** | Supabase DB — `gaze_results` table |
| Cognitive game event logs | Memory + attention scoring | Supabase DB — `cognitive_game_results` table |
| Computed sub-scores and fused risk indicator | Screening report generation | Supabase DB — `fused_reports` table |
| LLM-generated report text + retrieved RAG context | Audit trail for hallucination review | Supabase DB — `fused_reports` table |

---

## Consent

- Users must check an explicit consent checkbox before any capture task begins.
- Consent state is persisted per assessment session in the database (not just shown and forgotten).
- Users can request deletion of their data at any time via the account settings page (to be implemented in Phase 2+).

---

## Data protection — India's DPDP Act 2023

This project is developed for an Indian research context and references
**India's Digital Personal Data Protection (DPDP) Act, 2023** for data-handling
obligations, not HIPAA (which applies to US-covered entities). Key obligations
this project is designed to align with:

- **Purpose limitation**: Data collected only for the stated screening purpose.
- **Data minimisation**: No raw video is retained. Audio is retained only to support re-analysis if a model is updated. Gaze data is stored as extracted numeric features, not video.
- **Storage limitation**: A retention policy will be defined before any public launch (stub — to be finalized with legal counsel for any non-prototype deployment).
- **User rights**: Right to access and erasure to be implemented in the account settings flow.

---

## Regulatory awareness — CDSCO SaMD classification

If CogniDetect ever moves beyond "research prototype" status toward commercial
or clinical deployment in India, it would likely require assessment under the
**CDSCO (Central Drugs Standard Control Organisation) Software as a Medical
Device (SaMD)** framework.

Based on the intended use (screening aid, not diagnosis; output is a risk flag
for clinical follow-up, not a treatment recommendation), this product would
likely fall under **Class B or Class C SaMD** depending on the severity of the
condition being screened and whether outputs inform clinical decisions.

> ⚠️ **This project makes no claim of CDSCO certification, registration, or
> regulatory clearance.** Any deployment beyond a research prototype requires
> proper regulatory assessment and approval.

---

## Retention and deletion (stub)

- Audio files: retained for [TBD] days post-session, then auto-deleted.
- Scores and reports: retained indefinitely unless user requests deletion.
- Deletion requests: to be implemented via Supabase Storage + database cascade delete.

---

## Security controls

- All data is scoped to the authenticated user's own ID via Postgres Row Level Security.
- Doctors can only access data for patients who have explicitly approved the link.
- The service role key (which bypasses RLS) is used only in the backend and never exposed to the browser.
- Audio files in Supabase Storage are protected by signed URLs with short expiry.
