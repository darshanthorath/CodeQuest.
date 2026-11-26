// Dates are handled as "YYYY-MM-DD" strings in the user's LOCAL timezone,
// so a session at 1 AM in India still counts for the correct day.
export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const parse = (s) => new Date(`${s}T00:00:00Z`);

export const addDays = (s, n) => {
  const d = parse(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const weekday = (s) => parse(s).getUTCDay(); // 0 = Sunday

export const prettyDate = (s) =>
  parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
