import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import ARVTool from './pages/ARVTool';
import { FollowUps, Buyers, Settings } from './pages/OtherPages';
import LeadSearch from './pages/LeadSearch';
import LOI from './pages/LOI';
import { initialLeads, initialBuyers } from './data/leads';

const LEADS_KEY = 'clearpath_leads';
const BUYERS_KEY = 'clearpath_buyers';
const SETTINGS_KEY = 'clearpath_settings';

const defaultSettings = {
  name: 'Andy Johnson', phone: '', email: '',
  leadCap: 5, callStart: '07:00', callEnd: '20:00',
  activeStates: ['TX', 'UT', 'CO', 'AZ']
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem(LEADS_KEY);
      return saved ? JSON.parse(saved) : initialLeads;
    } catch { return initialLeads; }
  });
  const [buyers, setBuyers] = useState(() => {
    try {
      const saved = localStorage.getItem(BUYERS_KEY);
      return saved ? JSON.parse(saved) : initialBuyers;
    } catch { return initialBuyers; }
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch { return defaultSettings; }
  });

  useEffect(() => { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem(BUYERS_KEY, JSON.stringify(buyers)); }, [buyers]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const renderPage = () => {
    switch (page) {
      case 'search': return <LeadSearch leads={leads} setLeads={setLeads} settings={settings} />;
      case 'loi': return <LOI leads={leads} settings={settings} />;
      case 'dashboard': return <Dashboard leads={leads} setPage={setPage} setSelectedLead={setSelectedLead} />;
      case 'leads': return <Leads leads={leads} setLeads={setLeads} selectedLead={selectedLead} setSelectedLead={setSelectedLead} />;
      case 'followups': return <FollowUps leads={leads} setLeads={setLeads} />;
      case 'arv': return <ARVTool />;
      case 'buyers': return <Buyers buyers={buyers} setBuyers={setBuyers} />;
      case 'settings': return <Settings settings={settings} setSettings={setSettings} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={(p) => { setPage(p); setSelectedLead(null); }} leads={leads} />
      <main style={{
        marginLeft: 'var(--sidebar-width)', flex: 1,
        minHeight: '100vh', background: 'var(--off-white)', overflowX: 'hidden'
      }}>
        {renderPage()}
      </main>
    </div>
  );
}
