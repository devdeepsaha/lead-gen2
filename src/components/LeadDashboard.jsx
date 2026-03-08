import React, { useState, useEffect } from 'react';
import DashboardAnalytics from './DashboardAnalytics';
import LeadTable from './LeadTable';
import OutreachLog from './OutreachLog';
import SettingsPanel from './SettingsPanel';
import OutreachCalendar from './OutreachCalendar';
import FALLBACK_LEADS from '../data/fallback-leads';

export default function LeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [outreachLog, setOutreachLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [isCalOpen, setIsCalOpen] = useState(false);
  
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [dailyData, setDailyData] = useState({
    date: new Date().toISOString().split('T')[0],
    goal: 10,
    counts: { job: 0, build_no_demo: 0, build_demo: 0 }
  });

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      let fetchedLeads = null;
      let fetchedStatuses = {};
      let fetchedOutreach = [];

      try {
        const [lRes, sRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/statuses')
        ]).catch(() => [null, null]);

        if (lRes?.ok) fetchedLeads = await lRes.json();
        if (sRes?.ok) {
          const sData = await sRes.json();
          fetchedStatuses = sData.statuses || sData;
          if (sData.outreach) fetchedOutreach = sData.outreach;
          if (sData.daily) setDailyData(sData.daily);
        }
      } catch (err) { console.error(err); }

      const baseLeads = (Array.isArray(fetchedLeads) && fetchedLeads.length > 0) ? fetchedLeads : FALLBACK_LEADS;
      const mergedLeads = baseLeads.map(l => ({
        ...l,
        id: String(l.id),
        status: (typeof fetchedStatuses[l.id] === 'object' ? fetchedStatuses[l.id].status : fetchedStatuses[l.id]) || "none",
        replied: (typeof fetchedStatuses[l.id] === 'object' ? !!fetchedStatuses[l.id].replied : false),
        checked: false
      }));

      setLeads(mergedLeads);
      setOutreachLog(fetchedOutreach);
      setIsLoading(false);
    };
    initializeApp();
  }, []);

  const syncToCloud = async (updatedLeads, updatedDaily, updatedOutreach) => {
    // RECENTLY CHANGED: Validation to prevent crashing if updatedLeads isn't an array
    if (!Array.isArray(updatedLeads)) return;

    setSyncStatus('syncing');
    const statuses = {};
    updatedLeads.forEach(l => {
      statuses[l.id] = { status: l.status, replied: l.replied };
    });

    const outreachToSync = updatedOutreach || outreachLog;
    const dailyToSync = updatedDaily || dailyData;

    try {
      await fetch('/api/statuses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statuses,
          daily: dailyToSync,
          outreach: outreachToSync,
          history: { [dailyToSync.date]: dailyToSync.counts }
        }),
      });
      setSyncStatus('synced');
    } catch (e) { setSyncStatus('error'); }
  };

  // RECENTLY CHANGED: Added logic to delete instances and update daily counts
  const handleDeleteOutreach = (timestamp) => {
    const deletedEntry = outreachLog.find(e => e.ts === timestamp);
    if (!deletedEntry) return;

    const updatedLog = outreachLog.filter(e => e.ts !== timestamp);
    
    const today = new Date().toISOString().split('T')[0];
    const entryDate = new Date(deletedEntry.ts).toISOString().split('T')[0];
    
    let updatedDaily = dailyData;
    if (entryDate === today) {
      const newCounts = { ...dailyData.counts };
      if (newCounts[deletedEntry.tplKey] > 0) {
        newCounts[deletedEntry.tplKey]--;
      }
      updatedDaily = { ...dailyData, counts: newCounts };
      setDailyData(updatedDaily);
    }

    setOutreachLog(updatedLog);
    syncToCloud(leads, updatedDaily, updatedLog);
  };

  return (
    <div className="bg-background-light text-slate-900 font-display">
      <OutreachCalendar 
        isOpen={isCalOpen} 
        onClose={() => setIsCalOpen(false)} 
        outreachLog={outreachLog}
        onDeleteEntry={handleDeleteOutreach} // Linked to new function
      />

      {isLoading && (
        <div id="loading-overlay" className="fixed inset-0 bg-[#f7f5f8]/95 z-[9999] flex flex-col items-center justify-center gap-4">
          <div className="spinner border-3 border-primary/20 border-t-primary rounded-full w-10 h-10 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Connecting to Vercel KV...</p>
        </div>
      )}

      <div className="desktop-only relative flex min-h-screen flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/90 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>table_view</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-black leading-tight tracking-tight">LeadFlow</h2>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">CSV Enterprise</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`sync-dot w-2 h-2 rounded-full inline-block ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{syncStatus === 'synced' ? 'Synced' : 'Saving...'}</span>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">LF</div>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className={`hidden w-60 flex-col border-r border-primary/10 bg-white lg:flex flex-shrink-0 sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: sidebarCollapsed ? '56px' : '240px' }}>
            <nav className="flex flex-col gap-1 px-3 mt-4">
                {[{ id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'leads', icon: 'view_list', label: 'Lead Directory' }, { id: 'outreach', icon: 'mail', label: 'Outreach' }, { id: 'settings', icon: 'settings', label: 'Settings' }].map((item) => (
                  <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.id); }} className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${activeView === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 hover:bg-primary/5'}`}>
                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </a>
                ))}
            </nav>
          </aside>

          <main className="flex-1 overflow-hidden flex flex-col bg-background-light">
            {activeView === 'dashboard' && <DashboardAnalytics leads={leads} dailyData={dailyData} onOpenCalendar={() => setIsCalOpen(true)} />}
            
            {activeView === 'leads' && (
              <LeadTable 
                leads={leads} 
                setLeads={(updated) => {
                  // RECENTLY CHANGED: Safe functional update to prevent TypeErrors
                  setLeads(prev => {
                    const next = typeof updated === 'function' ? updated(prev) : updated;
                    syncToCloud(next, dailyData, outreachLog);
                    return next;
                  });
                }} 
                searchQuery={searchQuery} 
                dailyData={dailyData} 
                setDailyData={(d) => { setDailyData(d); syncToCloud(leads, d, outreachLog); }}
                outreachLog={outreachLog}
                setOutreachLog={(o) => { setOutreachLog(o); syncToCloud(leads, dailyData, o); }}
              />
            )}
            
            {activeView === 'outreach' && <OutreachLog leads={leads} outreachLog={outreachLog} setOutreachLog={(o) => { setOutreachLog(o); syncToCloud(leads, dailyData, o); }} />}
            {activeView === 'settings' && <SettingsPanel leads={leads} setLeads={(updated) => { setLeads(updated); syncToCloud(updated); }} dailyData={dailyData} setDailyData={(d) => { setDailyData(d); syncToCloud(leads, d); }} syncStatus={syncStatus} onForceSync={() => syncToCloud(leads, dailyData)} />}
          </main>
        </div>
      </div>
    </div>
  );
}