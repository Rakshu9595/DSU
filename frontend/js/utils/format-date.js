export function formatDate(value, options = { year:"numeric", month:"short", day:"numeric" }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, options).format(date);
}
