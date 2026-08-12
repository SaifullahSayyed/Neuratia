# CogniDetect — ML Training Scripts

This directory contains all model training scripts and Jupyter notebooks.

## Rules (read before adding anything here)

1. **Never run training at request time.** The FastAPI backend loads pre-trained
   model *artifacts* (`.joblib`, `.pt`, etc.). It does not train at runtime.

2. **Run on free compute.** All scripts here are designed to run on:
   - Google Colab (free T4 GPU): upload the notebook and run
   - Kaggle Notebooks (free GPU/TPU): import and run

3. **Dataset access.** Training data (DementiaBank Pitt Corpus, ADReSS/ADReSSo)
   must be obtained separately by signing TalkBank's data-use agreement at
   https://dementia.talkbank.org/. Do not commit dataset files to this repo.

4. **Model versioning.** Every trained model must be saved with a version in
   its filename (e.g., `speech_model_v1.joblib`) and accompanied by a
   `model_card.md` reporting accuracy, AUC, sensitivity, and specificity on
   the held-out test split. Unversioned, undocumented model files will not
   be accepted.

## Planned scripts (added in Phase 3+)

| Script | Phase | Description |
|---|---|---|
| `train_speech_classifier.ipynb` | Phase 3 | Fine-tune DistilBERT on ADReSS transcripts |
| `extract_acoustic_features.py` | Phase 3 | librosa + parselmouth feature extraction |
| `train_gaze_classifier.ipynb` | Phase 4 | Logistic regression on oculomotor metrics |
| `fusion_ablation.ipynb` | Phase 5 | Ablation study: speech / gaze / games |
| `embed_reference_corpus.py` | Phase 6 | Embed RAG corpus into Supabase pgvector |
