import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ARVTool from './pages/ARVTool';
import MAOCalc from './pages/MAOCalc';
import LOI from './pages/LOI';
import CallScripts from './pages/CallScripts';
import { Settings } from './pages/OtherPages';
import Login from './pages/Login';

// Leads, follow-ups and agent contacts now live in HubSpot (filled by the daily
// scheduled task). This app is the deal-analysis toolkit: ARV → MAO → LOI, plus call scripts.

const SETTINGS_KEY = 'clearpath_settings';
const DEAL_KEY = 'clearpath_deal';

const defaultSettings = {
  name: 'Andy Johnson', phone: '', email: '',
  leadCap: 5, callStart: '07:00', callEnd: '20:00',
  activeStates: ['TX', 'UT', 'CO', 'AZ']
};

const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
};
const store = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

export default function App() {
  const [page, setPage] = useState('arv');
  const [currentUser, setCurrentUser] = useState(() => load('clearpath_session', null));
  const [settings, setSettings] = useState(() => load(SETTINGS_KEY, defaultSettings));
  const [deal, setDeal] = useState(() => load(DEAL_KEY, {}));

  useEffect(() => { store(SETTINGS_KEY, settings); }, [settings]);
  useEffect(() => { store(DEAL_KEY, deal); }, [deal]);

  const handleLogout = () => {
    try { localStorage.removeItem('clearpath_session'); } catch { /* ignore */ }
    setCurrentUser(null);
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  const renderPage = () => {
    switch (page) {
      case 'arv': return <ARVTool deal={deal} setDeal={setDeal} setPage={setPage} />;
      case 'mao': return <MAOCalc deal={deal} setDeal={setDeal} setPage={setPage} />;
      case 'loi': return <LOI deal={deal} settings={settings} />;
      case 'scripts': return <CallScripts deal={deal} settings={settings} />;
      case 'settings': return <Settings settings={settings} setSettings={setSettings} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={setPage} deal={deal} currentUser={currentUser} onLogout={handleLogout} />
      <main style={{
        marginLeft: 'var(--sidebar-width)', flex: 1,
        minHeight: '100vh', background: 'var(--off-white)', overflowX: 'hidden'
      }}>
        {renderPage()}
      </main>
    </div>
  );
}
