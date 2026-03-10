import React, { useState, useEffect } from 'react';
import DashboardAnalytics from './DashboardAnalytics';
import LeadTable from './LeadTable';
import OutreachLog from './OutreachLog';
import SettingsPanel from './SettingsPanel';
import OutreachCalendar from './OutreachCalendar';
import FALLBACK_LEADS from '../data/fallback-leads';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [outreachLog, setOutreachLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [isCalOpen, setIsCalOpen] = useState(false);
  
  // RECENTLY CHANGED: Added dataMode to toggle between Local and Cloud
  const [dataMode, setDataMode] = useState('local'); 
  const [dataSource, setDataSource] = useState("Local File");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [copyMode, setCopyMode] = useState('email'); 
  const [rangeFilters, setRangeFilters] = useState({
    ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 
  });

  const [dailyData, setDailyData] = useState({
    date: getLocalDateString(),
    goal: 10,
    counts: { job: 0, build_no_demo: 0, build_demo: 0 }
  });

  const [selectedMapLead, setSelectedMapLead] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Authentication Logic
  const handleToggleAdmin = async () => {
    if (isAdmin) { setIsAdmin(false); setAdminKey(""); return; }
    const input = prompt("Enter Admin Security Key:");
    if (!input) return;
    try {
      const res = await fetch(`/api/statuses?auth=${encodeURIComponent(input)}`, { cache: 'no-store' });
      if (res.ok) {
        setAdminKey(input); setIsAdmin(true);
        sessionStorage.setItem('admin_session_key', input);
      } else { alert("❌ Invalid Key."); }
    } catch (err) { alert("⚠️ Connection error."); }
  };

  useEffect(() => {
    const savedKey = sessionStorage.getItem('admin_session_key');
    if (savedKey) {
      fetch(`/api/statuses?auth=${encodeURIComponent(savedKey)}`)
        .then(res => { if(res.ok) { setAdminKey(savedKey); setIsAdmin(true); } });
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { setSearchQuery(''); setShowShortcutsHelp(false); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (e.key === '?') { e.preventDefault(); setShowShortcutsHelp(prev => !prev); }
      if (key === 'c') { e.preventDefault(); setSearchQuery(''); }
      if (key === 's') {
        e.preventDefault();
        setRangeFilters({ ratingMin: 3.5, ratingMax: 4.5, reviewsMin: 50, reviewsMax: 500 });
        setPage(1); setActiveView('leads'); 
      }
      if (key === 'r') {
        e.preventDefault();
        setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 });
        setPage(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rangeFilters]);

  // RECENTLY CHANGED: Hybrid initialization logic
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      let fetchedCloudLeads = [];
      let fetchedStatuses = {};
      let fetchedOutreach = [];

      try {
        const timestamp = Date.now();
        const [lRes, sRes] = await Promise.all([
          fetch(`/api/leads?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
          fetch(`/api/statuses?t=${timestamp}`, { cache: 'no-store' }).catch(() => null)
        ]);

        if (lRes?.ok) fetchedCloudLeads = await lRes.json();
        if (sRes?.ok) {
          const sData = await sRes.json();
          fetchedStatuses = sData.statuses || sData;
          if (sData.outreach) fetchedOutreach = sData.outreach;
          if (sData.daily) setDailyData(sData.daily);
        }
      } catch (err) { console.error(err); }

      // Selection logic based on dataMode
      const baseLeads = (dataMode === 'cloud' && Array.isArray(fetchedCloudLeads) && fetchedCloudLeads.length > 0)
        ? fetchedCloudLeads 
        : FALLBACK_LEADS;

      // Always apply Cloud Statuses/Tags to the chosen base
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
      setDataSource(dataMode === 'cloud' ? "Vercel Cloud" : "Local File");
    };
    initializeApp();
  }, [dataMode]); // Re-run when toggle changes

  const syncToCloud = async (updatedLeads, updatedDaily, updatedOutreach, currentKey) => {
    try {
      if (!Array.isArray(updatedLeads)) return;
      setSyncStatus('syncing');
      const statuses = {};
      updatedLeads.forEach(l => { if(l && l.id) statuses[l.id] = { status: l.status, replied: l.replied }; });
      const res = await fetch('/api/statuses', {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: currentKey, statuses, daily: updatedDaily || dailyData,
          outreach: updatedOutreach || outreachLog,
          history: { [(updatedDaily || dailyData).date]: (updatedDaily || dailyData).counts }
        }),
      });
      if (res.status === 401) { 
        setSyncStatus('error'); setIsAdmin(false); setAdminKey(""); 
        sessionStorage.removeItem('admin_session_key'); return; 
      }
      setSyncStatus('synced');
    } catch (e) { setSyncStatus('error'); }
  };

  const handleUpdateLeads = (newLeads) => { setLeads(newLeads); syncToCloud(newLeads, dailyData, outreachLog, adminKey); };
  const handleUpdateDaily = (newDaily) => { setDailyData(newDaily); syncToCloud(leads, newDaily, outreachLog, adminKey); };
  const handleUpdateOutreach = (newOutreach) => { setOutreachLog(newOutreach); syncToCloud(leads, dailyData, newOutreach, adminKey); };

  const handleLocateOnMap = (lead) => {
    if (!lead.lat || !lead.lng) return alert("No coordinates.");
    setSelectedMapLead({ ...lead, _triggerTime: Date.now() }); setActiveView('dashboard');
  };

  const handleViewInDirectory = (lead) => {
    setSearchQuery(lead.name); setStatusFilter('all'); setCatFilter('all');
    setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 });
    setActiveView('leads'); setPage(1);
  };

  const NavItems = [{ id: 'dashboard', icon: 'dashboard', label: 'Home' }, { id: 'leads', icon: 'view_list', label: 'Directory' }, { id: 'outreach', icon: 'mail', label: 'Log' }, { id: 'settings', icon: 'settings', label: 'Setup' }];

  return (
    <div className="bg-background-light text-slate-900 font-display h-screen flex flex-col overflow-hidden">
      <OutreachCalendar isOpen={isCalOpen} onClose={() => setIsCalOpen(false)} outreachLog={outreachLog} onDeleteEntry={(ts) => {/* handle delete */}} />
      {isLoading && (
        <div className="fixed inset-0 bg-white/95 z-[9999] flex flex-col items-center justify-center gap-4">
          <div className="spinner border-3 border-primary/20 border-t-primary rounded-full w-10 h-10 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Syncing Hybrid Data...</p>
        </div>
      )}
      
      <header className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-4 lg:px-6 py-3 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"><span className="material-symbols-outlined">table_view</span></div>
            <h2 className="text-sm lg:text-lg font-black uppercase">LeadFlow</h2>
          </div>
          
          {/* RECENTLY CHANGED: Data Mode Toggle Dropdown */}
          <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-slate-400" style={{fontSize: '16px'}}>database</span>
            <select 
              value={dataMode} 
              onChange={(e) => setDataMode(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 cursor-pointer"
            >
              <option value="local">Local File</option>
              <option value="cloud">Cloud DB</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleToggleAdmin} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isAdmin ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
            <span className="material-symbols-outlined">{isAdmin ? 'lock_open' : 'lock'}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="hidden sm:inline font-bold uppercase tracking-tighter">{syncStatus}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`hidden lg:flex flex-col border-r border-primary/10 bg-white`} style={{ width: sidebarCollapsed ? '72px' : '240px' }}>
          <nav className="flex flex-col gap-2 px-3 mt-4">{NavItems.map(item => (<a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.id); }} className={`flex items-center rounded-xl px-4 py-3 gap-3 ${activeView === item.id ? 'bg-primary text-white' : 'text-slate-500 hover:bg-primary/5'}`}><span className="material-symbols-outlined">{item.icon}</span>{!sidebarCollapsed && <span className="font-bold text-sm">{item.label}</span>}</a>))}</nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background-light pb-20 lg:pb-0 w-full relative">
          {activeView === 'dashboard' && <DashboardAnalytics leads={leads} dailyData={dailyData} selectedMapLead={selectedMapLead} dataSource={dataSource} onViewInDirectory={handleViewInDirectory} onOpenCalendar={() => setIsCalOpen(true)} />}
          {activeView === 'leads' && ( <LeadTable leads={leads} isAdmin={isAdmin} setLeads={handleUpdateLeads} dailyData={dailyData} setDailyData={handleUpdateDaily} outreachLog={outreachLog} setOutreachLog={handleUpdateOutreach} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} catFilter={catFilter} setCatFilter={setCatFilter} sortType={sortType} setSortType={setSortType} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} copyMode={copyMode} setCopyMode={setCopyMode} rangeFilters={rangeFilters} setRangeFilters={setRangeFilters} onLocate={handleLocateOnMap} /> )}
          {activeView === 'outreach' && <OutreachLog leads={leads} outreachLog={outreachLog} setOutreachLog={handleUpdateOutreach} />}
          {activeView === 'settings' && <SettingsPanel leads={leads} isAdmin={isAdmin} adminKey={adminKey} setLeads={handleUpdateLeads} dailyData={dailyData} setDailyData={handleUpdateDaily} syncStatus={syncStatus} onForceSync={() => syncToCloud(leads, dailyData, outreachLog, adminKey)} />}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-primary/10 bg-white px-4 pb-safe pt-2 z-[60] shadow-lg">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {NavItems.map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex flex-col items-center gap-0.5 pt-1 ${activeView === item.id ? 'text-primary' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}