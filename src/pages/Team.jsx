import React, { useState } from 'react';

const USERS_KEY = 'clearpath_users';
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

export default function Team({ currentUser }) {
  const [users, setUsers] = useState(getUsers());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="fade-in" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Team</h1>
        <div style={{ padding: 24, background: 'var(--gray-100)', borderRadius: 10, color: 'var(--text-muted)' }}>
          Only admins can manage team members.
        </div>
      </div>
    );
  }

  const addUser = () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setError('Email already exists.'); return; }
    const newUser = { id: Date.now(), name: form.name, email: form.email, password: form.password, role: form.role, createdAt: new Date().toISOString() };
    const updated = [...users, newUser];
    saveUsers(updated);
    setUsers(updated);
    setForm({ name: '', email: '', password: '', role: 'viewer' });
    setShowAdd(false);
  };

  const removeUser = (id) => {
    if (id === currentUser.id) { alert("You can't remove yourself."); return; }
    if (!window.confirm('Remove this team member?')) return;
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
  };

  const toggleRole = (id) => {
    const updated = users.map(u => u.id === id ? { ...u, role: u.role === 'admin' ? 'viewer' : 'admin' } : u);
    saveUsers(updated);
    setUsers(updated);
  };

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Team Members</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Member</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map(u => (
          <div key={u.id} className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: u.role === 'admin' ? 'var(--navy)' : 'var(--gray-200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
                color: u.role === 'admin' ? 'var(--gold)' : 'var(--text-secondary)', flexShrink: 0
              }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {u.name} {u.id === currentUser.id && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
              <span className={`badge badge-${u.role === 'admin' ? 'navy' : 'gray'}`}>{u.role}</span>
              {u.id !== currentUser.id && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleRole(u.id)}>
                    {u.role === 'admin' ? 'Make Viewer' : 'Make Admin'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeUser(u.id)}>Remove</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal fade-in">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Team Member</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: 14 }}>
                {[['name','Full Name','text'],['email','Email','email'],['password','Password','password']].map(([f,l,t]) => (
                  <div key={f} className="form-group">
                    <label className="form-label">{l}</label>
                    <input className="form-input" type={t} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="viewer">Viewer — can see leads, cannot delete or change settings</option>
                    <option value="admin">Admin — full access</option>
                  </select>
                </div>
                {error && <div style={{ color: '#DC2626', fontSize: 13 }}>⚠️ {error}</div>}
                <div style={{ padding: 12, background: 'var(--gray-100)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Share the app URL + these login credentials with your team member.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={addUser}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
