export function formatNumber(value, digits = 1, locale = undefined) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(Number(value) || 0);
}
export function formatCurrency(value, currency = "INR", locale = "en-IN") {
  try { return new Intl.NumberFormat(locale, { style:"currency", currency, maximumFractionDigits:0 }).format(Number(value) || 0); }
  catch { return `${formatNumber(value, 0)} ${currency}`; }
}
