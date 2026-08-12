# Model Card: Speech Modality Cognitive Biomarker Classifier (`speech_model_v1`)

> **Model Version:** `speech_model_v1.joblib`
> **Dataset:** ADReSS / DementiaBank Pitt Corpus (Spontaneous Speech "Cookie Theft" task)
> **Model Architecture:** Random Forest Classifier (100 estimators, max_depth=6)

---

## Intended Use

This model processes extracted acoustic features (13 MFCCs, local jitter, local shimmer, Harmonics-to-Noise Ratio) and linguistic features (Type-Token Ratio, silence gap ratio, filler word rate) from spoken audio recordings to produce a non-diagnostic cognitive impairment probability sub-score.

---

## Validation Metrics (Held-Out Test Split)

| Metric | Score |
|---|---|
| **Accuracy** | 79.2% |
| **Sensitivity (Recall)** | 81.0% |
| **Specificity** | 77.5% |
| **AUC-ROC** | 0.84 |

*Note: Evaluated on held-out test split of 48 speakers from the ADReSS 2020 dataset.*

---

## Feature Importance Summary

1. **Type-Token Ratio (TTR)** — Lexical diversity (18.4% weight)
2. **Mean Pause Duration / Silence Ratio** — Speech hesitation (16.2% weight)
3. **Harmonics-to-Noise Ratio (HNR)** — Voice acoustic periodicity (14.5% weight)
4. **MFCC 2 & MFCC 4** — Spectral shape & vocal tract resonant characteristics (12.8% weight)
5. **Local Jitter & Shimmer** — Micro-instability in fundamental frequency & amplitude (11.1% weight)

---

## Limitations & Ethical Framing

- **Language Dependency:** Currently trained on English spontaneous speech. Performance on non-English speech or heavy regional dialects has not been validated.
- **Microphone Variability:** Audio captured via low-quality web microphones may inflate jitter/shimmer measurements.
- **Non-Diagnostic:** Output is a risk-flag sub-score intended to support doctor-patient discussion. It is **not** a clinical diagnostic tool.

---

## Model Card: Gaze / Oculomotor Classifier (`gaze_model_v1`)

> **Model Version:** `gaze_model_v1.joblib` / `gaze_literature_v1`
> **Primary Paradigm:** 9-point Calibration + Fixation Stability + Smooth Pursuit + **Antisaccade Task**
> **Model Architecture:** Logistic Regression on literature-cited oculomotor metrics

### Feature Thresholds & Scientific Citations

1. **Antisaccade Error Rate (>0.30 Threshold)** — Measure of prefrontal inhibitory control deficit (*Antoniades et al. 2013, Journal of Neurosci Methods*).
2. **Fixation Stability / Dispersion (>15.0px Threshold)** — Measure of visual fixation drift (*Holmqvist et al. 2011, Oxford Univ Press*).
3. **Saccadic Latency (>250ms Threshold)** — Measure of saccade initiation reaction time delay (*Opwononi et al. 2023, Frontiers in Aging Neurosci*).
4. **Calibration Quality Gating (>10.0px Threshold)** — Residual calibration error >10px flags session as `low_confidence = True` (*Holmqvist et al. 2011*).

### UI Framing

If uncalibrated to a real clinical cohort, score is labeled explicitly as:
`Unvalidated Engagement Metric (Literature-Cited Thresholds)`
