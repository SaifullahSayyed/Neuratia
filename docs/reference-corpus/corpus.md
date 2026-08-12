# Neuratia Reference Corpus

A curated set of evidence-based text chunks used for Retrieval-Augmented Generation (RAG)
when producing AI clinical summaries. Each chunk is drawn from published, peer-reviewed
research. The backend `rag_retrieval.py` module indexes these chunks via TF-IDF and retrieves
the top-k most relevant passages based on the patient's risk profile keywords.

---

## CHUNK 001 | Topic: Speech Biomarkers | Source: Fraser et al. (2016)

**Citation:** Fraser, K.C., Meltzer, J.A., & Rudzicz, F. (2016). Linguistic features identify
Alzheimer's disease in narrative speech. *Journal of Alzheimer's Disease*, 49(1), 271–280.

**Content:**
Spontaneous speech analysis has emerged as a sensitive and cost-effective biomarker for
Alzheimer's disease and MCI. Fraser et al. achieved 81.9% accuracy in distinguishing AD
patients from healthy controls using linguistic features extracted from the DementiaBank
picture description task. Key discriminatory features include: reduced type-token ratio (TTR),
increased filler word frequency ("um", "uh"), longer pause durations between phrases, and
decreased information unit density. Lower TTR values (below 0.4) and filler word rates above
5% per 100 words are associated with elevated cognitive decline risk.

---

## CHUNK 002 | Topic: Speech STT Biomarkers | Source: Luz et al. (2021)

**Citation:** Luz, S., Haider, F., de la Fuente, S., Fromm, D., & MacWhinney, B. (2021).
Detecting cognitive decline using speech only: The ADReSS challenge. *Proceedings of
INTERSPEECH*, 3172–3176.

**Content:**
The ADReSS (Alzheimer's Dementia Recognition through Spontaneous Speech) challenge
demonstrated that acoustic and linguistic features derived solely from spoken picture
descriptions achieve AUC scores of 0.83–0.89 for MCI/AD detection. The most predictive
acoustic features were MFCC coefficients (particularly MFCC 1–4), spectral centroid
variation, and local jitter values above 0.02. Systems leveraging both acoustic embeddings
and transcribed linguistic features consistently outperformed unimodal approaches.

---

## CHUNK 003 | Topic: Gaze / Oculomotor | Source: Antoniades et al. (2013)

**Citation:** Antoniades, C.A., et al. (2013). An international multi-centre study of saccadic
eye movements in patients with progressive supranuclear palsy and Parkinson's disease.
*Journal of Neurology, Neurosurgery & Psychiatry*, 84(4), 405–413.

**Content:**
Antisaccade tasks require participants to look away from a peripheral visual stimulus,
requiring frontal executive suppression of reflexive saccades. Error rates exceeding 30%
on antisaccade paradigms are consistently observed in early frontotemporal and prefrontal
cortical dysfunction. Healthy young adults typically produce error rates of 15–20%;
rates above 30% in older adults suggest inhibitory control impairment associated with
preclinical cognitive decline.

---

## CHUNK 004 | Topic: Gaze / Calibration | Source: Holmqvist et al. (2011)

**Citation:** Holmqvist, K., et al. (2011). *Eye Tracking: A comprehensive guide to methods
and measures*. Oxford University Press.

**Content:**
Fixation stability is quantified by the spatial dispersion of gaze coordinates during
sustained fixation trials. A dispersion exceeding 15px (on a standard 1920×1080 monitor at
60cm viewing distance) indicates clinically meaningful fixation instability. Saccadic reaction
times above 250ms are associated with delayed oculomotor initiation, a marker observed in
MCI and early Alzheimer's disease. Calibration residual errors greater than 10px compromise
metric validity and sessions should be flagged as low confidence.

---

## CHUNK 005 | Topic: Cognitive / Working Memory | Source: Monaco et al. (2013)

**Citation:** Monaco, M., et al. (2013). Normative values for the digit span of the Wechsler
Adult Intelligence Scale-IV. *Psychological Assessment*, 25(4), 1289–1294.

**Content:**
The Wechsler Adult Intelligence Scale-IV (WAIS-IV) digit span subtest is a gold-standard
measure of verbal working memory and short-term memory capacity. Normative reference data
by Monaco et al. provides age and education-stratified expected forward digit span scores.
Adults aged 55–65 with secondary education are expected to achieve spans of 6–7 digits;
spans of 4 or fewer are associated with working memory deficits. Performance below the 25th
percentile for age and education band warrants clinical evaluation.

---

## CHUNK 006 | Topic: Multimodal Fusion | Source: Toth et al. (2018)

**Citation:** Toth, L., et al. (2018). A speech recognition-based solution for the automatic
detection of mild cognitive impairment from spontaneous speech. *Current Alzheimer Research*,
15(2), 130–138.

**Content:**
Multimodal cognitive screening systems combining speech, gaze, and executive function measures
outperform unimodal approaches. Systems integrating at least two modalities achieve sensitivity
improvements of 8–12% over single-modality baselines. The combination of speech biomarkers and
oculomotor measures is particularly powerful for detecting MCI before clinical symptom onset,
as each modality captures a distinct neurobiological pathway: phonological access (speech),
visuospatial executive function (gaze), and verbal working memory (digit span).

---

## CHUNK 007 | Topic: Clinical Thresholds / Risk Framing

**Citation:** Petersen, R.C., et al. (2018). Practice guideline update summary: Mild cognitive
impairment. *Neurology*, 90(3), 126–135. (American Academy of Neurology)

**Content:**
Screening tools that identify "high risk signal" patterns should be followed up with
comprehensive neuropsychological evaluation by a qualified clinician. A positive screening
result does not constitute a diagnosis of MCI or Alzheimer's disease. The American Academy
of Neurology guidelines recommend that all abnormal cognitive screening results be reviewed
by a physician before any clinical interpretation. Lifestyle factors, sleep quality,
medications, and depression can all produce transient cognitive screening signal elevations.
