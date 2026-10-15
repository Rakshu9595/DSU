export function summarizeDetections(detections) {
  return detections.reduce((summary, item) => {
    const count=Number.isFinite(item.count)?item.count:0;
    if (/switch|socket|outlet|fitting|lighting|light/i.test(`${item.category} ${item.name}`)) summary.fittings += count;
    else summary.appliances += count;
    summary.lowConfidence += Number.isFinite(item.confidence)&&item.confidence < .75 ? 1 : 0;
    return summary;
  }, { appliances:0, fittings:0, lowConfidence:0 });
}
