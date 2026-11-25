import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { api, localDate } from './api';
Chart.register(...registerables);

const useGet = (p) => {
  const [d, setD] = useState(null);
  const load = () => api(p).then(setD).catch(() => {});
  useEffect(() => { load(); }, []);
  return [d, load];
};

export function Dashboard({ user }) {
  const [d] = useGet('/dashboard');
  const u = d?.user || user;
  const days = [...Array(35)].map((_, i) => {
    const t = new Date(); t.setDate(t.getDate() - 34 + i);
    return new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  });
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card md:col-span-2">
        <p>Level {u.level}</p>
        <h2 className="text-3xl font-bold">{u.title}</h2>
        <div className="h-3 bg-ink/10 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-amber" style={{ width: Math.round((u.into / u.need) * 100) + '%' }} />
        </div>
        <p className="mt-1 text-sm">{u.into} / {u.need} XP to level {u.level + 1}. Total: {u.totalXP} XP</p>
      </div>
      <div className="card">
        <p>Current streak</p>
        <p className="text-4xl font-bold text-coral">{u.currentStreak} days</p>
        <p className="text-sm">Longest: {u.longestStreak} days</p>
      </div>
      <div className="card">
        <p>Today</p>
        <p className="text-2xl font-bold">{d?.todaySessions ?? 0} sessions</p>
        <p className="text-sm">Missions: {d?.missionsDone ?? 0} of {d?.missionsTotal ?? 0} done</p>
      </div>
      <div className="card md:col-span-2">
        <p className="mb-2">Practice calendar, last 5 weeks</p>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((x) => <div key={x} title={x} className={`aspect-square rounded ${d?.practicedDays.includes(x) ? 'bg-teal' : 'bg-ink/10'} ${x === localDate() ? 'ring-2 ring-amber' : ''}`} />)}
        </div>
      </div>
      <div className="card md:col-span-3 text-sm">
        {u.username} has logged {u.totalSessions} sessions, solved {u.problemsSolved} problems and practiced {u.totalMinutes} minutes.
      </div>
    </div>
  );
}

export function Missions({ setUser, notify }) {
  const [ms, load] = useGet('/missions');
  const done = async (m) => {
    try {
      const d = await api(`/missions/${m._id}/complete`, { method: 'POST' });
      setUser(d.user); notify(`Mission complete: +${m.xpReward} XP`); load();
    } catch (e) { notify(e.message); }
  };
  if (!ms) return <p>Loading missions...</p>;
  return (
    <div className="space-y-3">
      {ms.map((m) => (
        <div key={m._id} className="card flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{m.title}</p>
            <p className="text-sm">{Math.min(m.progress, m.target)} / {m.target}, +{m.xpReward} XP</p>
          </div>
          {m.completed ? <span className="text-teal font-medium">Done</span>
            : m.type === 'manual' ? <button className="btn" onClick={() => done(m)}>Mark done</button>
            : <span className="text-sm">Log a session to progress</span>}
        </div>
      ))}
    </div>
  );
}

export function Log({ setUser, notify }) {
  const empty = { language: 'Java', topic: '', problemTitle: '', solved: false, durationMinutes: 30, difficulty: 'Easy', notes: '' };
  const [f, setF] = useState(empty), [list, load] = useGet('/sessions'), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async () => {
    setErr('');
    try {
      const d = await api('/sessions', { method: 'POST', body: { ...f, durationMinutes: +f.durationMinutes } });
      setUser(d.user); setF(empty); load();
      notify([`+${d.xpGained} XP`, ...d.missionsDone.map((t) => 'Mission done: ' + t), ...d.newBadges.map((b) => 'Badge unlocked: ' + b)].join('. '));
    } catch (e) { setErr(e.message); }
  };
  const remove = async (id) => { await api('/sessions/' + id, { method: 'DELETE' }); load(); };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card space-y-3 self-start">
        <h2 className="font-bold text-lg">Log a session</h2>
        <select className="input" value={f.language} onChange={set('language')}>{['Java', 'Python', 'JavaScript', 'C++', 'C', 'Other'].map((l) => <option key={l}>{l}</option>)}</select>
        <input className="input" placeholder="Topic (for example, Arrays)" value={f.topic} onChange={set('topic')} />
        <input className="input" placeholder="Problem title (optional)" value={f.problemTitle} onChange={set('problemTitle')} />
        <div className="flex gap-2">
          <input className="input" type="number" min="1" value={f.durationMinutes} onChange={set('durationMinutes')} aria-label="Minutes" />
          <select className="input" value={f.difficulty} onChange={set('difficulty')}>{['Easy', 'Medium', 'Hard'].map((l) => <option key={l}>{l}</option>)}</select>
        </div>
        <label className="flex gap-2 items-center"><input type="checkbox" checked={f.solved} onChange={set('solved')} /> I solved a problem (+50 XP)</label>
        <textarea className="input" rows="3" placeholder="What did you learn?" value={f.notes} onChange={set('notes')} />
        {err && <p className="text-coral" role="alert">{err}</p>}
        <button className="btn w-full" onClick={submit}>Save session (+20 XP)</button>
      </div>
      <div className="space-y-2">
        {list?.length === 0 && <p className="card">No sessions yet. Log your first one to start your streak.</p>}
        {list?.map((s) => (
          <div key={s._id} className="card flex justify-between gap-2">
            <div>
              <p className="font-medium">{s.language}: {s.topic}</p>
              <p className="text-sm">{s.date}, {s.durationMinutes} min, {s.difficulty}{s.solved ? ', solved' : ''}</p>
              {s.notes && <p className="text-sm mt-1">{s.notes}</p>}
            </div>
            <button className="text-sm underline" onClick={() => remove(s._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Badges() {
  const [b] = useGet('/achievements');
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {b?.map((x) => (
        <div key={x.key} className={`card ${x.unlocked ? 'border-amber border-2' : 'opacity-50'}`}>
          <p className="font-bold">{x.name}</p>
          <p className="text-sm">{x.desc}</p>
          <p className="text-sm mt-2 text-teal">{x.unlocked ? 'Unlocked' : 'Locked'}</p>
        </div>
      ))}
    </div>
  );
}

function Bars({ labels, data, label }) {
  const ref = useRef();
  useEffect(() => {
    const c = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets: [{ label, data, backgroundColor: '#1F7A6B', borderRadius: 4 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    return () => c.destroy();
  }, [labels.join(), data.join()]);
  return <canvas ref={ref} />;
}

export function Analytics() {
  const [a] = useGet('/analytics');
  if (!a) return <p>Loading...</p>;
  const T = a.totals;
  const stats = [['Sessions', T.sessions], ['Problems solved', T.problems], ['Minutes practiced', T.minutes], ['XP earned', T.xp], ['Current streak', T.streak], ['Longest streak', T.longest]];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {stats.map(([k, v]) => <div key={k} className="card"><p className="text-2xl font-bold">{v}</p><p className="text-sm">{k}</p></div>)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card"><p className="mb-2">Minutes per day, last 7 days</p><Bars label="Minutes" labels={a.week.map((w) => w.date.slice(5))} data={a.week.map((w) => w.minutes)} /></div>
        <div className="card"><p className="mb-2">Sessions by language</p><Bars label="Sessions" labels={Object.keys(a.langs)} data={Object.values(a.langs)} /></div>
      </div>
    </div>
  );
}
