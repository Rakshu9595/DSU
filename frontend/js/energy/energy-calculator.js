export function calculateEnergy(watts, hoursPerDay, days = 1) {
  const power = Number(watts);
  const hours = Number(hoursPerDay);
  if (!Number.isFinite(power) || !Number.isFinite(hours) || power < 0 || hours < 0) throw new RangeError("Power and runtime must be non-negative numbers.");
  return power * hours * days / 1000;
}

export function estimateCost(kwh, tariff) {
  const energy = Number(kwh); const rate = Number(tariff);
  if (!Number.isFinite(energy) || !Number.isFinite(rate) || energy < 0 || rate < 0) throw new RangeError("Energy and tariff must be non-negative numbers.");
  return energy * rate;
}

export function estimateDeviceSavings(devices,{deviceIds,reductionPercent,tariff,runtimeMultiplier=1,days=30}={}) {
  if(!Array.isArray(devices))throw new TypeError("Device data must be a list.");
  const reduction=Number(reductionPercent),runtime=Number(runtimeMultiplier),period=Number(days),rate=Number(tariff);
  if(!Number.isFinite(reduction)||reduction<0||reduction>100||!Number.isFinite(runtime)||runtime<0||!Number.isFinite(period)||period<0||!Number.isFinite(rate)||rate<0)throw new RangeError("Savings inputs must be finite non-negative values with reduction at most 100%.");
  const ids=Array.isArray(deviceIds)?deviceIds:[];
  const selected=ids.length?devices.filter((device)=>ids.includes(device.id)):devices;
  if(ids.length&&ids.some((id)=>!selected.some((device)=>device.id===id)))return null;
  const dailyKwh=selected.reduce((sum,device)=>sum+calculateEnergy(device.watts,Math.min(24,Number(device.hours)*runtime)),0);
  const savedDailyKwh=dailyKwh*reduction/100;
  return {savedDailyKwh,monthlySavings:estimateCost(savedDailyKwh*period,rate)};
}
