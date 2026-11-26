import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Search, StickyNote, Trash2, Upload } from "lucide-react";
import { request, requestBlob } from "./lib.js";
import { prettyDate } from "./date.js";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.doc,.docx,.ppt,.pptx";

const sizeLabel = (bytes = 0) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const canPreview = (type = "") => type === "application/pdf" || type === "text/plain" || type.startsWith("image/");

export default function NotesPage({ token, topics = [], notify, refresh }) {
  const [notes, setNotes] = useState(null);
  const [form, setForm] = useState({ title: "", topic: "", text: "" });
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [q, setQ] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [expanded, setExpanded] = useState({});

  const load = useCallback(
    () => request("/notes", token).then(setNotes).catch((e) => notify(e.message)),
    [token]
  );
  useEffect(() => { load(); }, [load]);

  const topicOptions = useMemo(
    () => [...new Set(["General", ...topics, ...(notes || []).map((n) => n.topic)])],
    [topics, notes]
  );

  function pickFile(f) {
    if (!f) return;
    if (f.size > MAX_BYTES) { notify("File is too large. Maximum size is 5 MB."); return; }
    setFile(f);
    if (!form.title) setForm((old) => ({ ...old, title: f.name.replace(/\.[^.]+$/, "") }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return notify("Please give your note a title.");
    if (!file && !form.text.trim()) return notify("Add a file or write some notes first.");

    const body = new FormData();
    body.append("title", form.title.trim());
    body.append("topic", form.topic.trim() || "General");
    body.append("text", form.text);
    if (file) body.append("file", file); // keep the file last

    setBusy(true);
    try {
      const data = await request("/notes", token, { method: "POST", body });
      notify(data.message || "Note saved.");
      setForm({ title: "", topic: "", text: "" });
      setFile(null);
      setFileKey((k) => k + 1);
      await load();
      refresh();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openFile(n, download) {
    // open the tab first (inside the click) so the browser does not block the pop-up
    const tab = !download ? window.open("", "_blank") : null;
    try {
      const blob = await requestBlob(`/notes/${n._id}/file`, token);
      const url = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = n.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) {
      if (tab) tab.close();
      notify(err.message);
    }
  }

  async function remove(n) {
    if (!window.confirm(`Delete "${n.title}"?`)) return;
    try {
      await request(`/notes/${n._id}`, token, { method: "DELETE" });
      await load();
    } catch (err) {
      notify(err.message);
    }
  }

  const shown = (notes || []).filter((n) =>
    (topicFilter === "All" || n.topic === topicFilter) &&
    (!q.trim() || `${n.title} ${n.text} ${n.fileName}`.toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">YOUR STUDY LIBRARY</p>
          <h1>Notes</h1>
          <p className="muted">
            Upload PDFs, handwritten-note photos or documents, or write notes right here. Saving a note counts as activity for the day.
          </p>
        </div>
      </div>

      <div className="notes-layout">
        <form className="panel note-form session-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEW NOTE</p>
              <h3>Upload or write</h3>
            </div>
          </div>

          <label>
            Title
            <input maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Binary Search patterns" />
          </label>

          <label>
            Topic
            <input maxLength={60} list="note-topics" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="General" />
            <datalist id="note-topics">{topicOptions.map((t) => <option key={t} value={t} />)}</datalist>
          </label>

          <label>
            Written notes (optional)
            <textarea rows="5" maxLength={20000} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Key ideas, formulas, code snippets..." />
          </label>

          <label
            className={`note-drop${dragging ? " drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          >
            <Upload size={22} />
            <span>{file ? `${file.name} (${sizeLabel(file.size)})` : "Click or drop a file here"}</span>
            <small>PDF, image, TXT, MD, DOC/DOCX, PPT/PPTX · up to 5 MB</small>
            <input key={fileKey} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          {file && (
            <button type="button" className="text-btn" onClick={() => { setFile(null); setFileKey((k) => k + 1); }}>
              Remove selected file
            </button>
          )}

          <button className="primary full" disabled={busy}>
            {busy ? "Uploading..." : "Save note"} <Upload size={16} />
          </button>
        </form>

        <div>
          <div className="dsa-toolbar">
            <div className="dsa-search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes..." aria-label="Search notes" />
            </div>
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} aria-label="Topic">
              <option value="All">All topics</option>
              {topicOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {notes === null && <div className="panel"><div className="empty-state"><p>Loading notes...</p></div></div>}
          {notes && !shown.length && (
            <div className="panel">
              <div className="empty-state">
                <div>⌁</div>
                <p>{notes.length ? "No notes match your search." : "No notes yet. Upload your first one."}</p>
              </div>
            </div>
          )}

          {shown.map((n) => {
            const long = n.text.length > 260;
            const full = expanded[n._id];
            return (
              <div className="panel note-card" key={n._id}>
                <div className="note-icon">{n.hasFile ? <FileText size={20} /> : <StickyNote size={20} />}</div>
                <div className="note-body">
                  <h3>{n.title}</h3>
                  <p className="note-meta">
                    <span className="tag">{n.topic}</span>
                    <span>{prettyDate(n.date)}</span>
                    {n.hasFile && <span>{n.fileName} · {sizeLabel(n.fileSize)}</span>}
                  </p>
                  {n.text && (
                    <p className="note-text">{long && !full ? `${n.text.slice(0, 260)}…` : n.text}</p>
                  )}
                  {long && (
                    <button className="text-btn" onClick={() => setExpanded({ ...expanded, [n._id]: !full })}>
                      {full ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
                <div className="note-actions">
                  {n.hasFile && canPreview(n.fileType) && (
                    <button className="icon-btn" title="View" aria-label="View file" onClick={() => openFile(n, false)}><Eye size={15} /></button>
                  )}
                  {n.hasFile && (
                    <button className="icon-btn" title="Download" aria-label="Download file" onClick={() => openFile(n, true)}><Download size={15} /></button>
                  )}
                  <button className="icon-btn danger" title="Delete" aria-label="Delete note" onClick={() => remove(n)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
