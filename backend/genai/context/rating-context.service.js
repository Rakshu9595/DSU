
const RATING_SCALE = Object.freeze({
  A: { min: 90, label: "Excellent energy efficiency" },
  B: { min: 75, label: "Good energy efficiency" },
  C: { min: 60, label: "Moderate energy efficiency" },
  D: { min: 40, label: "Low energy efficiency" },
  E: { min: 0, label: "Very low energy efficiency" }
});

/**
 * Calculates an energy-efficiency rating from a supplied score.
 *
 * Important:
 * The score must come from a defined, evidence-based evaluation.
 * This service does not infer efficiency from appliance visibility alone.
 */
export function getEfficiencyRating(score) {
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100
  ) {
    return {
      available: false,
      grade: null,
      score: null,
      label: "Insufficient data",
      reason: "A valid efficiency score from 0 to 100 is required."
    };
  }

  const grade = Object.entries(RATING_SCALE).find(
    ([, details]) => score >= details.min
  );

  const [letter, details] = grade;

  return {
    available: true,
    grade: letter,
    score: Math.round(score),
    label: details.label,
    reason: "Based on the supplied efficiency score."
  };
}

/**
 * Creates a rating context using an explicitly supplied score
 * and supporting evidence.
 */
export function createRatingContext({
  score = null,
  scoreMethod = null,
  evidence = [],
  baselineAvailable = false
} = {}) {
  if (!Array.isArray(evidence)) {
    throw new Error("evidence must be an array.");
  }

  const hasValidMethod =
    typeof scoreMethod === "string" && scoreMethod.trim().length > 0;

  // Without a documented scoring method and a baseline, do not
  // present the score as a verified efficiency rating.
  if (!hasValidMethod || baselineAvailable !== true) {
    return {
      available: false,
      grade: null,
      score: null,
      label: "Not rated",
      scoreMethod: hasValidMethod ? scoreMethod.trim() : null,
      baselineAvailable: baselineAvailable === true,
      evidenceCount: evidence.length,
      reason:
        "A documented scoring method and a suitable comparison baseline are required.",
      recommendations: [
        "Collect reliable appliance power and usage information.",
        "Define an appropriate benchmark for the building or appliance type.",
        "Document how the efficiency score is calculated before assigning a grade."
      ]
    };
  }

  const rating = getEfficiencyRating(score);

  return {
    ...rating,
    scoreMethod: scoreMethod.trim(),
    baselineAvailable: true,
    evidenceCount: evidence.length,
    recommendations: rating.available
      ? [
          "Review the supporting evidence and benchmark.",
          "Identify practical opportunities to reduce unnecessary usage.",
          "Recalculate the rating when more reliable data becomes available."
        ]
      : [
          "Provide a valid score between 0 and 100."
        ]
  };
}

/**
 * Formats rating information for inclusion in a GenAI prompt.
 */
export function formatRatingContext(ratingContext) {
  if (
    !ratingContext ||
    typeof ratingContext !== "object" ||
    Array.isArray(ratingContext)
  ) {
    throw new Error("A valid rating context is required.");
  }

  return [
    "VISIONTWIN ENERGY-EFFICIENCY RATING",
    `Rating available: ${ratingContext.available === true}`,
    `Grade: ${ratingContext.grade ?? "Not assigned"}`,
    `Score: ${ratingContext.score ?? "Not available"}`,
    `Label: ${ratingContext.label ?? "Not rated"}`,
    `Scoring method: ${ratingContext.scoreMethod ?? "Not provided"}`,
    `Comparison baseline available: ${ratingContext.baselineAvailable === true}`,
    `Supporting evidence count: ${ratingContext.evidenceCount ?? 0}`,
    `Reason: ${ratingContext.reason ?? "Not provided"}`,
    "",
    "AI INSTRUCTIONS:",
    "Do not invent an efficiency score or grade.",
    "Do not describe this rating as an official appliance energy label.",
    "Distinguish an internally calculated score from a certified rating.",
    "Explain missing data and avoid claiming verified savings."
  ].join("\n");
}

export default createRatingContext;
