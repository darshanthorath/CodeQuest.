import { useState, useEffect } from 'react';
import { api } from './api';
import { Dashboard, Missions, Log, Badges, Analytics } from './Pages';

const TABS = ['Home', 'Missions', 'Practice Log', 'Achievements', 'Analytics'];

function Auth({ onAuth }) {
  const [reg, setReg] = useState(false), [err, setErr] = useState('');
  const [f, setF] = useState({ username: '', email: '', password: '' });
  const field = (k, ph, type = 'text') => (
    <input className="input" type={type} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
  );
  const go = async () => {
    try { const d = await api(reg ? '/auth/register' : '/auth/login', { method: 'POST', body: f }); onAuth(d.token, d.user); }
    catch (e) { setErr(e.message); }
  };
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-sm space-y-3">
        <h1 className="text-3xl font-bold">CodeQuest</h1>
        <p>Practice code every day. Earn XP. Level up.</p>
        {reg && field('username', 'Username')}
        {field('email', 'Email', 'email')}
        {field('password', 'Password (6+ characters)', 'password')}
        {err && <p className="text-coral" role="alert">{err}</p>}
        <button className="btn w-full" onClick={go}>{reg ? 'Create account' : 'Log in'}</button>
        <button className="text-sm underline" onClick={() => { setReg(!reg); setErr(''); }}>
          {reg ? 'I already have an account' : 'Create an account'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  const [tab, setTab] = useState('Home'), [toast, setToast] = useState('');
  useEffect(() => {
    if (!localStorage.getItem('cq_token')) return setReady(true);
    api('/dashboard').then((d) => setUser(d.user)).catch(() => {}).finally(() => setReady(true));
  }, []);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 4500); };
  if (!ready) return null;
  if (!user) return <Auth onAuth={(t, u) => { localStorage.setItem('cq_token', t); setUser(u); }} />;
  const P = { user, setUser, notify };
  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">CodeQuest</h1>
        <nav className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg ${tab === t ? 'bg-ink text-white' : 'hover:bg-ink/10'}`}>{t}</button>
          ))}
        </nav>
        <span className="text-sm">{user.username} <button className="underline ml-2" onClick={() => { localStorage.removeItem('cq_token'); setUser(null); }}>Log out</button></span>
      </header>
      {toast && <div role="status" className="fixed bottom-4 right-4 bg-ink text-white rounded-lg px-4 py-3 max-w-xs">{toast}</div>}
      {tab === 'Home' && <Dashboard {...P} />}
      {tab === 'Missions' && <Missions {...P} />}
      {tab === 'Practice Log' && <Log {...P} />}
      {tab === 'Achievements' && <Badges />}
      {tab === 'Analytics' && <Analytics />}
    </div>
  );
}
