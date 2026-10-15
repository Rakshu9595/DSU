export function normalizeAnalysis(result) {
  if (!result || typeof result !== "object" || !Array.isArray(result.detections)) {
    throw new TypeError("Analysis response must include a detections array.");
  }
  const detections=result.detections.map((item) => {
    const rawBox=item.box&&typeof item.box==="object"?item.box:null;
    const box=rawBox&&[rawBox.x,rawBox.y,rawBox.width,rawBox.height].every((value)=>Number.isFinite(Number(value)))
      ?{x:Number(rawBox.x),y:Number(rawBox.y),width:Number(rawBox.width),height:Number(rawBox.height)}:null;
    const countValue=Number(item.count),confidenceValue=Number(item.confidence),wattsValue=Number(item.watts);
    return {
      name: String(item.name || "Unlabelled object"),
      category: String(item.category || "Other"),
      count:item.count!=null&&Number.isFinite(countValue)&&countValue>=0?countValue:null,
      confidence:item.confidence!=null&&Number.isFinite(confidenceValue)?Math.max(0,Math.min(1,confidenceValue)):null,
      watts:item.watts!=null&&Number.isFinite(wattsValue)&&wattsValue>=0?wattsValue:null,
      box:box&&box.x>=0&&box.x<=1&&box.y>=0&&box.y<=1&&box.width>0&&box.height>0?box:null
    };
  });
  const confidenceItems=detections.filter((item)=>Number.isFinite(item.confidence));
  const totalCount=confidenceItems.reduce((sum,item)=>sum+(item.count??1),0);
  const calculatedConfidence=totalCount?Math.round(confidenceItems.reduce((sum,item)=>sum+item.confidence*(item.count??1),0)/totalCount*100):null;
  return {
    ...result,
    detections,
    summary:{...(result.summary||{}),avgConfidence:result.summary?.avgConfidence!=null&&Number.isFinite(Number(result.summary.avgConfidence))?Number(result.summary.avgConfidence):calculatedConfidence}
  };
}
