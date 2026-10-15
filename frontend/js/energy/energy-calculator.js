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
