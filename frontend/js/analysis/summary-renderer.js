export function summarizeDetections(detections) {
  return detections.reduce((summary, item) => {
    if (/switch|socket|outlet/i.test(item.category)) summary.fittings += item.count;
    else summary.appliances += item.count;
    summary.lowConfidence += item.confidence < .75 ? 1 : 0;
    return summary;
  }, { appliances:0, fittings:0, lowConfidence:0 });
}
