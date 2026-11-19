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

// Ask the browser / password manager to save this login. Chrome and Edge show
// their "Save password?" prompt; other browsers fall back to the <form> heuristics.
const offerToSaveLogin = async (email, password, name) => {
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      await navigator.credentials.store(new window.PasswordCredential({ id: email, password, name: name || email }));
    }
  } catch { /* the user dismissed it or the browser doesn't support it */ }
};

const submit = (fn) => (e) => { e.preventDefault(); fn(); };

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
    offerToSaveLogin(user.email, form.password, user.name);
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
    offerToSaveLogin(newUser.email, newUser.password, newUser.name);
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
              <form onSubmit={submit(handleSetup)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="setup-name">Your Name</label>
                  <input id="setup-name" name="name" autoComplete="name" className="form-input" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="setup-email">Email</label>
                  <input id="setup-email" name="email" autoComplete="username" className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="setup-password">Password</label>
                  <input id="setup-password" name="password" autoComplete="new-password" className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Create Account & Sign In
                </button>
              </form>
            </>
          ) : mode === 'login' ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sign In</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Clear Path Properties LLC</p>
              <form onSubmit={submit(handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email</label>
                  <input id="login-email" name="email" autoComplete="username" className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <input id="login-password" name="password" autoComplete="current-password" className="form-input" type="password" placeholder="Your password" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign In
                </button>
                <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setError(''); setMode('signup'); }}>
                  Create a team member account
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create Account</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Team member access</p>
              <form onSubmit={submit(handleSetup)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-name">Full Name</label>
                  <input id="signup-name" name="name" autoComplete="name" className="form-input" placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email</label>
                  <input id="signup-email" name="email" autoComplete="username" className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-password">Password</label>
                  <input id="signup-password" name="password" autoComplete="new-password" className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Create Account
                </button>
                <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setError(''); setMode('login'); }}>
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
