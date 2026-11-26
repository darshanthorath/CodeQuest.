import React, { useMemo, useState } from "react";
import {
  Check, ChevronDown, ChevronRight, ExternalLink, Plus, Search, Star, StickyNote, Trash2, X
} from "lucide-react";
import { request } from "./lib.js";

const LEVELS = ["Easy", "Medium", "Hard"];

export function summarize(problems = []) {
  const out = { total: problems.length, solved: 0 };
  LEVELS.forEach((l) => (out[l] = { solved: 0, total: 0 }));
  problems.forEach((p) => {
    const bucket = out[p.difficulty];
    if (!bucket) return;
    bucket.total++;
    if (p.status === "solved") { bucket.solved++; out.solved++; }
  });
  return out;
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/* ---- progress bars: used on the Dashboard and at the top of the DSA sheet ---- */
export function DsaSummary({ problems }) {
  const s = summarize(problems);
  return (
    <div className="dsa-summary">
      <div className="dsa-ring">
        <strong>{s.solved}</strong>
        <small>of {s.total} solved</small>
        <div className="progress-track slim">
          <div className="progress-fill" style={{ width: `${pct(s.solved, s.total)}%` }} />
        </div>
      </div>
      {LEVELS.map((l) => (
        <div className="dsa-level" key={l}>
          <div className="dsa-level-top">
            <span className={`dsa-diff ${l.toLowerCase()}`}>{l}</span>
            <span>{s[l].solved} / {s[l].total}</span>
          </div>
          <div className="progress-track slim">
            <div className={`dsa-fill ${l.toLowerCase()}`} style={{ width: `${pct(s[l].solved, s[l].total)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoteEditor({ problem, onSave, onClose }) {
  const [text, setText] = useState(problem.note || "");
  return (
    <div className="dsa-note-editor">
      <textarea
        rows="4"
        maxLength={5000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Approach, time/space complexity, mistakes to avoid..."
      />
      <div className="dsa-note-actions">
        <small>{text.length}/5000</small>
        <button className="complete-btn" onClick={onClose}>Close</button>
        <button className="primary small-btn" onClick={() => { onSave(text); onClose(); }}>Save note</button>
      </div>
    </div>
  );
}

function AddQuestionModal({ topics, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", topic: "", difficulty: "Medium", url: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await onAdd(form); onClose(); } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">YOUR OWN SHEET</p>
            <h2>Add a DSA question</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X /></button>
        </div>
        <form className="session-form" onSubmit={submit}>
          <label>
            Question title
            <input required maxLength={200} value={form.title} onChange={set("title")} placeholder="Two Sum" />
          </label>
          <div className="form-row">
            <label>
              Topic
              <input required maxLength={60} list="dsa-topics" value={form.topic} onChange={set("topic")} placeholder="Arrays & Hashing" />
              <datalist id="dsa-topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <label>
              Difficulty
              <select value={form.difficulty} onChange={set("difficulty")}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <label>
            Link (optional)
            <input type="url" value={form.url} onChange={set("url")} placeholder="https://leetcode.com/problems/two-sum/" />
          </label>
          <button className="primary full" disabled={busy}>
            Add to my sheet <ChevronRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DsaPage({ token, problems, setProblems, notify, refresh }) {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState("All");
  const [status, setStatus] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [marked, setMarked] = useState(false);
  const [open, setOpen] = useState({});
  const [noteFor, setNoteFor] = useState("");
  const [adding, setAdding] = useState(false);

  const topics = useMemo(() => [...new Set(problems.map((p) => p.topic))], [problems]);
  const filtering = Boolean(q.trim()) || diff !== "All" || status !== "All" || topicFilter !== "All" || marked;

  const visible = problems.filter((p) =>
    (!q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase())) &&
    (diff === "All" || p.difficulty === diff) &&
    (status === "All" || (status === "Solved" ? p.status === "solved" : p.status !== "solved")) &&
    (topicFilter === "All" || p.topic === topicFilter) &&
    (!marked || p.bookmarked)
  );

  const groups = topics
    .map((t, i) => ({
      topic: t,
      index: i,
      all: problems.filter((p) => p.topic === t),
      rows: visible.filter((p) => p.topic === t)
    }))
    .filter((g) => g.rows.length);

  const isOpen = (g) => open[g.topic] ?? (filtering || g.index === 0);

  async function save(problem, patch) {
    setProblems((list) => list.map((x) => (x._id === problem._id ? { ...x, ...patch } : x)));
    try {
      const data = await request(`/problems/${problem._id}/progress`, token, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      if (patch.status === "solved") notify(data.message || "Marked as solved.");
      if (patch.status !== undefined) refresh(); // heatmap, XP, streak and badges change
    } catch (e) {
      notify(e.message);
      refresh();
    }
  }

  async function addQuestion(form) {
    try {
      const data = await request("/problems", token, { method: "POST", body: JSON.stringify(form) });
      notify(data.message || "Question added.");
      await refresh();
    } catch (e) {
      notify(e.message);
      throw e;
    }
  }

  async function removeQuestion(problem) {
    if (!window.confirm(`Delete "${problem.title}" from your sheet?`)) return;
    try {
      await request(`/problems/${problem._id}`, token, { method: "DELETE" });
      await refresh();
    } catch (e) {
      notify(e.message);
    }
  }

  const setAll = (value) => setOpen(Object.fromEntries(topics.map((t) => [t, value])));

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">STRIVER-STYLE PRACTICE SHEET</p>
          <h1>DSA sheet</h1>
          <p className="muted">
            Solve topic by topic. Each first solve earns XP (Easy 30, Medium 50, Hard 80) and lights up your activity calendar.
          </p>
        </div>
        <button className="primary" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add question
        </button>
      </div>

      <div className="panel">
        <DsaSummary problems={problems} />
      </div>

      <div className="dsa-toolbar">
        <div className="dsa-search">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions..." aria-label="Search questions" />
        </div>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} aria-label="Topic">
          <option value="All">All topics</option>
          {topics.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
          <option value="All">All difficulty</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="All">All status</option>
          <option>Solved</option>
          <option>Unsolved</option>
        </select>
        <button className={`dsa-chip${marked ? " on" : ""}`} onClick={() => setMarked(!marked)}>
          <Star size={14} fill={marked ? "currentColor" : "none"} /> Revision
        </button>
        <button className="text-btn" onClick={() => setAll(true)}>Expand all</button>
        <button className="text-btn" onClick={() => setAll(false)}>Collapse all</button>
      </div>

      {!problems.length && <div className="panel"><div className="empty-state"><p>Loading your sheet...</p></div></div>}
      {problems.length > 0 && !groups.length && (
        <div className="panel"><div className="empty-state"><div>⌁</div><p>No questions match these filters.</p></div></div>
      )}

      {groups.map((g) => {
        const solved = g.all.filter((p) => p.status === "solved").length;
        const expanded = isOpen(g);
        return (
          <div className="panel dsa-topic" key={g.topic}>
            <button className="dsa-topic-head" onClick={() => setOpen({ ...open, [g.topic]: !expanded })} aria-expanded={expanded}>
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="dsa-topic-name">{g.topic}</span>
              <span className="dsa-topic-count">{solved} / {g.all.length}</span>
              <span className="progress-track dsa-topic-bar">
                <span className="progress-fill" style={{ width: `${pct(solved, g.all.length)}%` }} />
              </span>
            </button>

            {expanded && g.rows.map((p) => (
              <React.Fragment key={p._id}>
                <div className={`dsa-row${p.status === "solved" ? " solved" : ""}`}>
                  <button
                    className={`dsa-check${p.status === "solved" ? " on" : ""}`}
                    onClick={() => save(p, { status: p.status === "solved" ? "todo" : "solved" })}
                    aria-label={p.status === "solved" ? `Mark ${p.title} as unsolved` : `Mark ${p.title} as solved`}
                    aria-pressed={p.status === "solved"}
                  >
                    {p.status === "solved" && <Check size={14} />}
                  </button>

                  <div className="dsa-title">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.title} <ExternalLink size={12} />
                      </a>
                    ) : <span>{p.title}</span>}
                    {p.custom && <span className="tag">Custom</span>}
                  </div>

                  <span className={`dsa-diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>

                  <button
                    className={`icon-btn${p.bookmarked ? " on" : ""}`}
                    title={p.bookmarked ? "Remove from revision list" : "Add to revision list"}
                    aria-label="Toggle revision"
                    onClick={() => save(p, { bookmarked: !p.bookmarked })}
                  >
                    <Star size={15} fill={p.bookmarked ? "currentColor" : "none"} />
                  </button>

                  <button
                    className={`icon-btn${p.note ? " on" : ""}`}
                    title="Your notes for this question"
                    aria-label="Open notes"
                    onClick={() => setNoteFor(noteFor === p._id ? "" : p._id)}
                  >
                    <StickyNote size={15} />
                  </button>

                  {p.custom && (
                    <button className="icon-btn danger" title="Delete question" aria-label="Delete question" onClick={() => removeQuestion(p)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {noteFor === p._id && (
                  <NoteEditor
                    problem={p}
                    onSave={(text) => { save(p, { note: text }); notify("Note saved."); }}
                    onClose={() => setNoteFor("")}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        );
      })}

      {adding && <AddQuestionModal topics={topics} onClose={() => setAdding(false)} onAdd={addQuestion} />}
    </>
  );
}
