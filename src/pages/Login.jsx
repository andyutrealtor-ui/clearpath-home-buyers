import React, { useState } from 'react';

const USERS_KEY = 'clearpath_users';
const SESSION_KEY = 'clearpath_session';

const getUsers = () => {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = () => {
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    const users = getUsers();

    // Create default admin on first login
    if (users.length === 0) {
      setError('No accounts found. Ask your admin to set up your account.');
      return;
    }

    const user = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password);
    if (!user) { setError('Incorrect email or password.'); return; }

    const session = { ...user, loggedInAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    onLogin(session);
  };

  const handleSetup = () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError('An account with that email already exists.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      password: form.password,
      role: users.length === 0 ? 'admin' : form.role,
      createdAt: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    const session = { ...newUser, loggedInAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    onLogin(session);
  };

  const users = getUsers();
  const isFirstUser = users.length === 0;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, background: 'var(--gold)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px'
          }}>🏠</div>
          <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: 'var(--white)' }}>Clear Path Properties LLC</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Your clear path to closing deals</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--white)', borderRadius: 16, padding: 32 }}>
          {isFirstUser ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create Admin Account</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Set up your owner account to get started</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" placeholder="Andy Johnson" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="andy@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSetup}>
                  Create Account & Sign In
                </button>
              </div>
            </>
          ) : mode === 'login' ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sign In</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Clear Path Properties LLC</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Your password" value={form.password} onChange={e => update('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin}>
                  Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create Account</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Team member access</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSetup}>
                  Create Account
                </button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('login')}>
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
