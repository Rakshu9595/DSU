export function normalizeAnalysis(result) {
  if (!result || typeof result !== "object" || !Array.isArray(result.detections)) {
    throw new TypeError("Analysis response must include a detections array.");
  }
  return {
    ...result,
    detections: result.detections.map((item) => ({
      name: String(item.name || "Unlabelled object"),
      category: String(item.category || "Other"),
      count: Math.max(0, Number(item.count) || 0),
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
      watts: Math.max(0, Number(item.watts) || 0),
      box: item.box && typeof item.box === "object" ? item.box : null
    }))
  };
}
