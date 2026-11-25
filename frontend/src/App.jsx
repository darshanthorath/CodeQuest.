
import React, { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, CalendarDays, Check, ChevronRight,
  Code2, Flame, Home, LogOut, Medal, Plus, Shield,
  Sparkles, Target, Trash2, Trophy, UserRound, X
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Tooltip, Legend
} from "chart.js";

import "./style.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
);

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const today = () => new Date().toISOString().slice(0, 10);

const money = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({
    message: "Unexpected server response"
  }));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

const navItems = [
  ["Dashboard", Home],
  ["Practice Log", BookOpen],
  ["Missions", Target],
  ["Achievements", Medal],
  ["Analytics", BarChart3],
  ["Profile", UserRound]
];

/* ---------------- AUTHENTICATION ---------------- */

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await request(
        `/auth/${mode === "login" ? "login" : "register"}`,
        null,
        {
          method: "POST",
          body: JSON.stringify(form)
        }
      );

      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand-mark">
          <Code2 size={25} />
        </div>

        <p className="eyebrow">YOUR CODING ADVENTURE STARTS HERE</p>

        <h1>
          {mode === "login"
            ? "Welcome back, coder"
            : "Create your quest"}
        </h1>

        <p className="muted">
          Build consistency. Earn XP. Become legendary.
        </p>

        <form onSubmit={submit} className="form-stack">
          {mode === "register" && (
            <label>
              Username
              <input
                required
                value={form.username}
                onChange={e =>
                  setForm({ ...form, username: e.target.value })
                }
                placeholder="Your coding name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={e =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength="6"
              type="password"
              value={form.password}
              onChange={e =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="At least 6 characters"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary full" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Enter CodeQuest"
                : "Create account"}
            <ChevronRight size={17} />
          </button>
        </form>

        <p className="switch-auth">
          {mode === "login"
            ? "New to CodeQuest?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        </p>

        <div className="auth-foot">
          <Shield size={14} />
          Your progress is private to your account
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN APPLICATION ---------------- */

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("cq_token") || ""
  );

  const [page, setPage] = useState("Dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState("");

  const emptyForm = {
    language: "Java",
    topic: "Arrays",
    problemTitle: "",
    durationMinutes: 30,
    difficulty: "Easy",
    solvedProblem: false,
    notes: ""
  };

  const [form, setForm] = useState(emptyForm);

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  }

  function authSuccess(data) {
    localStorage.setItem("cq_token", data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.removeItem("cq_token");
    setToken("");
    setDashboard(null);
    setSessions([]);
    setMissions([]);
    setAchievements([]);
    setAnalytics(null);
    setPage("Dashboard");
  }

  async function loadAll() {
    if (!token) return;

    setLoading(true);

    try {
      const [d, s, m, a, an] = await Promise.all([
        request("/dashboard", token),
        request("/sessions", token),
        request("/missions", token),
        request("/achievements", token),
        request("/analytics", token)
      ]);

      setDashboard(d);
      setSessions(Array.isArray(s) ? s : []);
      setMissions(Array.isArray(m) ? m : []);
      setAchievements(Array.isArray(a) ? a : []);
      setAnalytics(an);
    } catch (e) {
      notify(e.message);

      if (
        e.message.toLowerCase().includes("log in") ||
        e.message.toLowerCase().includes("expired") ||
        e.message.toLowerCase().includes("token")
      ) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  async function saveSession(e) {
    e.preventDefault();

    try {
      const sessionData = {
        ...form,
        durationMinutes: Number(form.durationMinutes)
      };

      if (editId) {
        const data = await request(`/sessions/${editId}`, token, {
          method: "PUT",
          body: JSON.stringify(sessionData)
        });

        notify(data.message || "Practice log updated.");
      } else {
        const data = await request("/sessions", token, {
          method: "POST",
          body: JSON.stringify({
            ...sessionData,
            date: today()
          })
        });

        notify(data.message || "Practice session saved.");
      }

      setShowForm(false);
      setEditId("");
      setForm(emptyForm);
      await loadAll();
    } catch (e) {
      notify(e.message);
    }
  }

  async function deleteSession(id) {
    if (!window.confirm("Delete this practice log?")) return;

    try {
      const data = await request(`/sessions/${id}`, token, {
        method: "DELETE"
      });

      notify(data.message || "Session deleted.");
      await loadAll();
    } catch (e) {
      notify(e.message);
    }
  }

  async function completeMission(id) {
    try {
      const data = await request(`/missions/${id}/complete`, token, {
        method: "POST"
      });

      notify(data.message || "Mission completed!");
      await loadAll();
    } catch (e) {
      notify(e.message);
    }
  }

  function editSession(session) {
    setForm({
      language: session.language,
      topic: session.topic,
      problemTitle: session.problemTitle || "",
      durationMinutes: session.durationMinutes,
      difficulty: session.difficulty,
      solvedProblem: session.solvedProblem,
      notes: session.notes || ""
    });

    setEditId(session._id);
    setShowForm(true);
  }

  function openNewSession() {
    setEditId("");
    setForm(emptyForm);
    setShowForm(true);
  }

  if (!token) {
    return <Auth onAuth={authSuccess} />;
  }

  const user = dashboard?.user;
  const stats = dashboard?.stats;

  const xpProgress = user ? (user.totalXP || 0) % 500 : 0;
  const pct = xpProgress / 5;

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">
            <Code2 />
          </span>

          <span>
            Code<span className="accent">Quest</span>
            <small>LEVEL UP YOUR CODING</small>
          </span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navItems.map(([name, Icon]) => (
            <button
              key={name}
              className={
                page === name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              {name}
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="avatar">
              {user?.username?.[0]?.toUpperCase() || "C"}
            </div>

            <div>
              <b>{user?.username || "Coder"}</b>
              <small>Level {user?.level || 1} Explorer</small>
            </div>
          </div>

          <button className="nav-item logout" onClick={logout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="breadcrumb">CODEQUEST</span>
            <h2>{page}</h2>
          </div>

          <div className="top-actions">
            <span className="date-chip">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </span>

            <div className="avatar small">
              {user?.username?.[0]?.toUpperCase() || "C"}
            </div>
          </div>
        </header>

        {loading && !dashboard ? (
          <div className="loading">Loading your quest...</div>
        ) : (
          <div className="content">

            {page === "Dashboard" && (
              <Dashboard
                user={user}
                stats={stats}
                missions={missions}
                sessions={sessions}
                xpProgress={xpProgress}
                pct={pct}
                setPage={setPage}
                openForm={openNewSession}
                completeMission={completeMission}
              />
            )}

            {page === "Practice Log" && (
              <PracticePage
                sessions={sessions}
                openForm={openNewSession}
                edit={editSession}
                remove={deleteSession}
              />
            )}

            {page === "Missions" && (
              <MissionsPage
                missions={missions}
                complete={completeMission}
              />
            )}

            {page === "Achievements" && (
              <AchievementsPage achievements={achievements} />
            )}

            {page === "Analytics" && (
              <AnalyticsPage analytics={analytics} />
            )}

            {page === "Profile" && (
              <ProfilePage user={user} stats={stats} />
            )}

          </div>
        )}
      </main>

      {/* ADD / EDIT SESSION MODAL */}

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">BUILD YOUR MOMENTUM</p>
                <h2>
                  {editId
                    ? "Edit practice session"
                    : "Log a coding session"}
                </h2>
              </div>

              <button
                className="icon-btn"
                onClick={() => setShowForm(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={saveSession} className="session-form">

              <label>
                Programming language
                <input
                  required
                  value={form.language}
                  onChange={e =>
                    setForm({ ...form, language: e.target.value })
                  }
                  placeholder="Java"
                />
              </label>

              <label>
                Topic studied
                <input
                  required
                  value={form.topic}
                  onChange={e =>
                    setForm({ ...form, topic: e.target.value })
                  }
                  placeholder="Arrays, OOP, SQL..."
                />
              </label>

              <label>
                Problem title
                <input
                  value={form.problemTitle}
                  onChange={e =>
                    setForm({ ...form, problemTitle: e.target.value })
                  }
                  placeholder="Two Sum (optional)"
                />
              </label>

              <div className="form-row">
                <label>
                  Duration (minutes)
                  <input
                    required
                    type="number"
                    min="1"
                    max="1440"
                    value={form.durationMinutes}
                    onChange={e =>
                      setForm({
                        ...form,
                        durationMinutes: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Difficulty
                  <select
                    value={form.difficulty}
                    onChange={e =>
                      setForm({ ...form, difficulty: e.target.value })
                    }
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
              </div>

              <label className="check-label">
                <input
                  type="checkbox"
                  checked={form.solvedProblem}
                  onChange={e =>
                    setForm({
                      ...form,
                      solvedProblem: e.target.checked
                    })
                  }
                />
                I solved a coding problem
                <span className="xp-hint">+50 bonus XP</span>
              </label>

              <label>
                What did you learn?
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={e =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Write a short learning note..."
                />
              </label>

              <div className="reward-note">
                <Sparkles size={17} />
                Earn <b>{20 + (form.solvedProblem ? 50 : 0)} XP</b>
                {" "}for this session
              </div>

              <button className="primary full">
                Save practice session
                <ChevronRight size={17} />
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */

function Dashboard({
  user, stats, missions, sessions, xpProgress, pct,
  setPage, openForm, completeMission
}) {
  const recent = sessions.slice(0, 4);
  const done = missions.filter(m => m.completed).length;

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> YOUR JOURNEY CONTINUES
          </p>

          <h1>
            Ready to level up,{" "}
            <span className="gradient-text">
              {user?.username || "Coder"}
            </span>?
          </h1>

          <p className="muted">
            Every line of code brings you closer to mastery.
          </p>
        </div>

        <button className="primary" onClick={openForm}>
          <Plus size={18} /> Log practice
        </button>
      </section>

      <section className="hero-grid">
        <div className="level-card">
          <div className="level-top">
            <div>
              <span className="subtle">CURRENT RANK</span>
              <h2>{user?.levelName || "Code Beginner"}</h2>
              <p>
                Level {user?.level || 1}
                <span className="rank-tag">CODING EXPLORER</span>
              </p>
            </div>

            <div className="level-emblem">
              <Trophy size={32} />
            </div>
          </div>

          <div className="xp-line">
            <span>EXPERIENCE POINTS</span>
            <b>{user?.totalXP || 0} XP</b>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="progress-foot">
            <span>{xpProgress} / 500 XP</span>
            <span>{500 - xpProgress} XP to next level</span>
          </div>
        </div>

        <div className="streak-card">
          <div className="streak-icon">
            <Flame size={26} />
          </div>

          <span className="subtle">CURRENT STREAK</span>

          <div className="big-number">
            {user?.currentStreak || 0}
            <small> days</small>
          </div>

          <p>Keep the fire alive!</p>

          <div className="streak-bottom">
            Best streak
            <b>{user?.longestStreak || 0} days</b>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <Stat
          icon={Code2}
          label="Total sessions"
          value={stats?.totalSessions || 0}
          foot="Practice sessions"
        />

        <Stat
          icon={Target}
          label="Problems solved"
          value={stats?.problemsSolved || 0}
          foot="Keep solving"
        />

        <Stat
          icon={CalendarDays}
          label="Practice time"
          value={money(stats?.totalMinutes || 0)}
          foot="Total focused time"
        />

        <Stat
          icon={Flame}
          label="Today's progress"
          value={`${stats?.todayMinutes || 0} min`}
          foot="Time invested today"
        />
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DAILY OBJECTIVES</p>
              <h3>Today's missions</h3>
            </div>

            <button
              className="text-btn"
              onClick={() => setPage("Missions")}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          <div className="mission-progress">
            <span>{done} of {missions.length} completed</span>
            <span>
              {missions.length
                ? Math.round(done / missions.length * 100)
                : 0}%
            </span>
          </div>

          <div className="progress-track slim">
            <div
              className="progress-fill"
              style={{
                width: `${
                  missions.length
                    ? done / missions.length * 100
                    : 0
                }%`
              }}
            />
          </div>

          <div className="mission-list">
            {missions.slice(0, 3).map(m => (
              <div className="mission-row" key={m._id}>
                <div
                  className={
                    m.completed
                      ? "mission-check checked"
                      : "mission-check"
                  }
                >
                  {m.completed
                    ? <Check size={15} />
                    : <Target size={15} />}
                </div>

                <div className="mission-copy">
                  <b>{m.title}</b>
                  <small>{m.description}</small>
                </div>

                <span className="reward">+{m.xpReward} XP</span>

                {!m.completed && (
                  <button
                    className="complete-btn"
                    onClick={() => completeMission(m._id)}
                  >
                    Claim
                  </button>
                )}
              </div>
            ))}

            {!missions.length && (
              <Empty text="No missions available." />
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR ACTIVITY</p>
              <h3>Recent sessions</h3>
            </div>

            <button
              className="text-btn"
              onClick={() => setPage("Practice Log")}
            >
              See history <ChevronRight size={15} />
            </button>
          </div>

          {recent.length ? (
            recent.map(s => (
              <div className="recent-row" key={s._id}>
                <div className="language-icon">
                  <Code2 size={18} />
                </div>

                <div className="recent-copy">
                  <b>{s.topic}</b>
                  <small>{s.language} · {s.date}</small>
                </div>

                <span className="duration">
                  {s.durationMinutes} min
                </span>
              </div>
            ))
          ) : (
            <Empty text="No sessions yet. Log your first coding practice!" />
          )}
        </div>
      </section>
    </>
  );
}

/* ---------------- STAT CARD ---------------- */

function Stat({ icon: Icon, label, value, foot }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={19} />
      </div>

      <span className="subtle">{label}</span>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}

/* ---------------- PRACTICE LOG ---------------- */

function PracticePage({ sessions, openForm, edit, remove }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">YOUR LEARNING HISTORY</p>
          <h1>Practice journal</h1>
          <p className="muted">
            Every session is a step forward.
          </p>
        </div>

        <button className="primary" onClick={openForm}>
          <Plus size={18} /> Add session
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3>
            All practice sessions
            <span className="count-pill">{sessions.length}</span>
          </h3>
        </div>

        {sessions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TOPIC / PROBLEM</th>
                  <th>LANGUAGE</th>
                  <th>DURATION</th>
                  <th>XP</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map(s => (
                  <tr key={s._id}>
                    <td>{s.date}</td>

                    <td>
                      <b>{s.topic}</b>
                      <small className="table-sub">
                        {s.problemTitle || s.difficulty}
                      </small>
                    </td>

                    <td>
                      <span className="tag">{s.language}</span>
                    </td>

                    <td>{s.durationMinutes} min</td>
                    <td className="xp-text">+{s.xpEarned}</td>

                    <td>
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => edit(s)}
                      >
                        ✎
                      </button>

                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => remove(s._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Your journal is empty. Add your first practice session." />
        )}
      </div>
    </>
  );
}

/* ---------------- MISSIONS ---------------- */

function MissionsPage({ missions, complete }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">SMALL STEPS, BIG PROGRESS</p>
          <h1>Daily missions</h1>
          <p className="muted">
            Complete today's objectives to earn bonus XP.
          </p>
        </div>

        <div className="mission-date">
          <CalendarDays size={17} />
          {today()}
        </div>
      </div>

      <div className="mission-cards">
        {missions.map((m, i) => (
          <div
            className={`mission-card ${m.completed ? "mission-done" : ""}`}
            key={m._id}
          >
            <div className="mission-card-icon">
              {["⌁", "⌘", "✎"][i % 3]}
            </div>

            <span className="subtle">
              DAILY MISSION {String(i + 1).padStart(2, "0")}
            </span>

            <h3>{m.title}</h3>
            <p>{m.description}</p>

            <div className="mission-card-foot">
              <span className="reward">✦ {m.xpReward} XP</span>

              {m.completed ? (
                <span className="completed-label">
                  <Check size={15} /> Completed
                </span>
              ) : (
                <button
                  className="primary small-btn"
                  onClick={() => complete(m._id)}
                >
                  Complete mission
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!missions.length && (
        <div className="panel">
          <Empty text="No missions available right now." />
        </div>
      )}
    </>
  );
}

/* ---------------- ACHIEVEMENTS ---------------- */

function AchievementsPage({ achievements }) {
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">RECOGNITION UNLOCKED</p>
          <h1>Achievements</h1>
          <p className="muted">
            Celebrate the milestones in your coding journey.
          </p>
        </div>

        <div className="mission-date">
          <Trophy size={17} />
          {unlocked}/{achievements.length} unlocked
        </div>
      </div>

      <div className="achievement-grid">
        {achievements.map(a => (
          <div
            className={`achievement-card ${a.unlocked ? "unlocked" : ""}`}
            key={a.id}
          >
            <div className="achievement-icon">{a.icon}</div>

            <div>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              {a.progress && <small>{a.progress}</small>}
            </div>

            <span className="lock-label">
              {a.unlocked ? "UNLOCKED" : "LOCKED"}
            </span>
          </div>
        ))}
      </div>

      {!achievements.length && (
        <div className="panel">
          <Empty text="Your achievements will appear here." />
        </div>
      )}
    </>
  );
}

/* ---------------- ANALYTICS ---------------- */

function AnalyticsPage({ analytics }) {
  if (!analytics) {
    return (
      <div className="panel">
        Loading analytics...
      </div>
    );
  }

  const weekly = analytics.weekly || [];
  const langs = analytics.languages || [];

  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">MEASURE YOUR MOMENTUM</p>
          <h1>Coding analytics</h1>
          <p className="muted">
            Understand your habits and keep improving.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat
          icon={Code2}
          label="Sessions"
          value={analytics.totalSessions || 0}
          foot="All time"
        />

        <Stat
          icon={Target}
          label="Problems solved"
          value={analytics.solved || 0}
          foot="All time"
        />

        <Stat
          icon={CalendarDays}
          label="Total practice"
          value={money(analytics.totalMinutes || 0)}
          foot="Focused learning"
        />
      </div>

      <div className="two-col analytics-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LAST 7 DAYS</p>
              <h3>Practice minutes</h3>
            </div>
          </div>

          <div className="chart-box">
            {weekly.length ? (
              <Bar
                data={{
                  labels: weekly.map(d =>
                    new Date(`${d.date}T00:00:00`).toLocaleDateString(
                      "en",
                      { weekday: "short" }
                    )
                  ),
                  datasets: [{
                    label: "Minutes",
                    data: weekly.map(d => d.minutes),
                    backgroundColor: "#8067f5",
                    borderRadius: 7
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: "#252c42" },
                      ticks: { color: "#929bb3" }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: "#929bb3" }
                    }
                  }
                }}
              />
            ) : (
              <Empty text="Add practice sessions to see your weekly chart." />
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR TOOLKIT</p>
              <h3>Languages practiced</h3>
            </div>
          </div>

          {langs.length ? (
            <div className="donut-box">
              <Doughnut
                data={{
                  labels: langs.map(x => x.language),
                  datasets: [{
                    data: langs.map(x => x.minutes),
                    backgroundColor: [
                      "#8067f5",
                      "#20c7a5",
                      "#f4b860",
                      "#e879a8",
                      "#4ba6e8"
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#aab2c8",
                        padding: 16
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <Empty text="Add sessions in different languages to see your breakdown." />
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- PROFILE ---------------- */

function ProfilePage({ user, stats }) {
  return (
    <>
      <div className="profile-hero">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() || "C"}
        </div>

        <p className="eyebrow">PLAYER PROFILE</p>
        <h1>{user?.username}</h1>
        <p className="muted">{user?.email}</p>

        <span className="rank-tag">
          {user?.levelName} · LEVEL {user?.level}
        </span>
      </div>

      <div className="stat-grid">
        <Stat
          icon={Sparkles}
          label="Total XP"
          value={user?.totalXP || 0}
          foot="Experience earned"
        />

        <Stat
          icon={Flame}
          label="Current streak"
          value={`${user?.currentStreak || 0} days`}
          foot="Consecutive practice days"
        />

        <Stat
          icon={Trophy}
          label="Longest streak"
          value={`${user?.longestStreak || 0} days`}
          foot="Personal best"
        />

        <Stat
          icon={BookOpen}
          label="Sessions"
          value={stats?.totalSessions || 0}
          foot="Logged sessions"
        />
      </div>
    </>
  );
}

/* ---------------- EMPTY STATE ---------------- */

function Empty({ text }) {
  return (
    <div className="empty-state">
      <div>⌁</div>
      <p>{text}</p>
    </div>
  );
}
