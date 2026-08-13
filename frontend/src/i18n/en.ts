export const en = {
  // Nav / App
  appName: "NeuratiaDetect",
  patientPortal: "Patient Portal",
  clinicianPortal: "Clinician Portal",
  signIn: "Sign In to Screening Portal",
  signOut: "Sign Out",
  dashboard: "Dashboard",
  loading: "Loading...",
  authenticating: "Authenticating session...",

  // Landing
  heroTitle: "Early cognitive screening,",
  heroTitleHighlight: "powered by AI",
  heroSubtitle: "Neuratia combines spontaneous speech analysis, client-side gaze tracking, and cognitive mini-games into a risk-flag report for clinicians.",
  warningTitle: "⚠️ Screening aid only — not a medical diagnosis",
  warningBody: "Research prototype. All scores are informational indicators only.",
  stat1Value: "3", stat1Label: "Modalities",
  stat2Value: "< 12", stat2Label: "Minutes",
  stat3Value: "India", stat3Label: "First",
  stat4Value: "Zero", stat4Label: "Hardware",

  // Patient Dashboard
  welcomePatient: "Welcome,",
  completeModules: "Complete all 3 assessment modules below to generate your screening report.",
  activeSession: "Active Session:",
  consentSigned: "Consent Signed",
  modalitiesDone: "Modalities Done",
  startSession: "Click any task below to review informed consent & start your screening session.",
  progressStepper: "Assessment Progress",

  // Tasks
  speechTitle: "1. Speech Analysis",
  speechDesc: "Record spontaneous speech describing a picture prompt. Acoustic & pause feature extraction.",
  startSpeech: "Start Speech Task",

  gazeTitle: "2. Gaze Tracking",
  gazeDesc: "9-point calibration, smooth pursuit, & antisaccade tasks powered by browser MediaPipe WASM.",
  startGaze: "Start Gaze Task",

  cognitiveTitle: "3. Cognitive Games",
  cognitiveDesc: "Digit span memory task normalized against age and education baseline norms.",
  startCognitive: "Start Cognitive Games",

  // Fusion Report
  fusionTitle: "Multimodal Fusion Report",
  generateReport: "Generate Report",
  riskLow: "Low Risk",
  riskModerate: "Moderate Risk",
  riskHigh: "High Risk",
  exportPdf: "Export PDF",

  // Consent Modal
  consentTitle: "Informed Consent",
  consentBody: "This is a research screening tool. Your data will be processed to compute cognitive risk indicators. No medical diagnosis is made. You may stop at any time.",
  consentAge: "Your age",
  consentEducation: "Education level",
  consentAgree: "I consent & want to begin",
  consentCancel: "Cancel",
  eduPrimary: "Primary (up to Class 8)",
  eduSecondary: "Secondary (Class 9–12)",
  eduGraduate: "Graduate",
  eduPostgrad: "Post-Graduate",

  // Doctor Dashboard
  linkedPatients: "Linked Patients",
  noPatients: "No linked patient records found.",
  lastSession: "Last session",
  sessions: "sessions",
  riskTrend: "Risk Score Trend",
  modalityBreakdown: "Modality Breakdown",
  sessionHistory: "Session History",
  viewReport: "View Report",
  patientAge: "Age",
  patientSessions: "Total Sessions",

  // Health Dot
  serverOk: "Server OK",
  serverUnreachable: "Server unreachable — check your connection or Render dashboard",

  // Language picker
  langEn: "EN",
  langHi: "हिं",
  langUr: "اُر",
};

export type TranslationKeys = keyof typeof en;
