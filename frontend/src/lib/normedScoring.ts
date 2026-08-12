
export type AgeBand = "18-39" | "40-59" | "60-74" | "75+";
export type EducationBand = "primary" | "secondary" | "undergraduate" | "postgraduate";

const DIGIT_SPAN_EXPECTED_BASELINES: Record<AgeBand, Record<EducationBand, number>> = {
  "18-39": {
    primary: 5.5,
    secondary: 6.2,
    undergraduate: 6.8,
    postgraduate: 7.2,
  },
  "40-59": {
    primary: 5.2,
    secondary: 5.8,
    undergraduate: 6.4,
    postgraduate: 6.8,
  },
  "60-74": {
    primary: 4.6,
    secondary: 5.2,
    undergraduate: 5.8,
    postgraduate: 6.2,
  },
  "75+": {
    primary: 4.1,
    secondary: 4.7,
    undergraduate: 5.2,
    postgraduate: 5.6,
  },
};

export function getAgeBand(age?: number): AgeBand {
  if (!age || age < 40) return "18-39";
  if (age < 60) return "40-59";
  if (age < 75) return "60-74";
  return "75+";
}

export function getEducationBand(edu?: string): EducationBand {
  if (!edu) return "secondary";
  const e = edu.toLowerCase();
  if (e.includes("primary") || e.includes("school")) return "primary";
  if (e.includes("post") || e.includes("master") || e.includes("phd")) return "postgraduate";
  if (e.includes("under") || e.includes("bachelor") || e.includes("degree")) return "undergraduate";
  return "secondary";
}

export function calculateNormedDigitSpanScore(
  maxSpanAchieved: number,
  age?: number,
  education?: string,
): { sub_score: number; age_band: AgeBand; education_band: EducationBand; expected_baseline: number } {
  const age_band = getAgeBand(age);
  const education_band = getEducationBand(education);
  const expected_baseline = DIGIT_SPAN_EXPECTED_BASELINES[age_band][education_band];

  const spanRatio = maxSpanAchieved / expected_baseline;
  const sub_score = Math.min(1.0, Math.max(0.1, Math.round(spanRatio * 0.85 * 100) / 100));

  return {
    sub_score,
    age_band,
    education_band,
    expected_baseline,
  };
}
