export function scenarioImpact(baseKwh, reductionPercent) {
  const reduction = Math.min(100,Math.max(0,Number(reductionPercent)||0));
  return { baseline:Number(baseKwh)||0, projected:(Number(baseKwh)||0)*(1-reduction/100), reductionPercent:reduction };
}
