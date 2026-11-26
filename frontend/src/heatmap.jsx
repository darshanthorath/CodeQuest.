import React from "react";
import { today, addDays, weekday, prettyDate } from "./date.js";

// GitHub-dark greens, same idea as the LeetCode submission calendar
const COLORS = ["#1d2640", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const level = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);

export default function Heatmap({ days = {} }) {
  const end = today();
  const start = addDays(end, -364);
  const pad = weekday(start); // empty cells so each column starts on Sunday

  const cells = [...Array(pad).fill(null), ...Array.from({ length: 365 }, (_, i) => addDays(start, i))];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  let total = 0, active = 0, best = 0, run = 0;
  for (let i = 0; i < 365; i++) {
    const n = days[addDays(start, i)] || 0;
    total += n;
    if (n > 0) { active++; run++; best = Math.max(best, run); } else run = 0;
  }

  const monthLabels = weeks.map((w) => {
    const first = w.find(Boolean);
    const [, m, d] = first.split("-").map(Number);
    return d <= 7 ? MONTHS[m - 1] : "";
  });

  return (
    <div className="hm-wrap">
      <div className="hm-stats">
        <span><b>{total}</b> activities in the past year</span>
        <span>Active days: <b>{active}</b></span>
        <span>Max streak: <b>{best}</b></span>
      </div>

      <div className="hm-scroll">
        <div className="hm">
          <div className="hm-months">
            {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
          </div>
          <div className="hm-grid">
            {weeks.map((w, wi) => (
              <div className="hm-week" key={wi}>
                {w.map((d, di) => {
                  if (!d) return <span key={`p${di}`} className="hm-cell blank" />;
                  const n = days[d] || 0;
                  return (
                    <span
                      key={d}
                      className={`hm-cell${d === end ? " today" : ""}`}
                      style={{ background: COLORS[level(n)] }}
                      title={`${n} ${n === 1 ? "activity" : "activities"} on ${prettyDate(d)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hm-legend">
        <span>Less</span>
        {COLORS.map((c) => <span key={c} className="hm-cell" style={{ background: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}
