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
  
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // RECENTLY CHANGED: All table states are now lifted here so they don't reset when changing tabs!
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [copyMode, setCopyMode] = useState('email'); 
  const [rangeFilters, setRangeFilters] = useState({
    ratingMin: 0,
    ratingMax: 5,
    reviewsMin: 0,
    reviewsMax: 5000 // Matches MAX_REVIEWS_SLIDER
  });

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

  const syncToCloud = async (updatedLeads, updatedDaily, updatedOutreach, currentKey) => {
    try {
      if (!Array.isArray(updatedLeads)) return;
      setSyncStatus('syncing');
      
      const statuses = {};
      updatedLeads.forEach(l => { 
        if(l && l.id) statuses[l.id] = { status: l.status, replied: l.replied }; 
      });

      const res = await fetch('/api/statuses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: currentKey,
          statuses,
          daily: updatedDaily || dailyData,
          outreach: updatedOutreach || outreachLog,
          history: { [(updatedDaily || dailyData).date]: (updatedDaily || dailyData).counts }
        }),
      });

      if (res.status === 401) {
        setSyncStatus('error');
        alert("Unauthorized: Incorrect Admin Key.");
        setIsAdmin(false);
        setAdminKey("");
        return;
      }
      
      if (!res.ok) throw new Error("Server error " + res.status);
      setSyncStatus('synced');
      
    } catch (e) { 
      console.error("Sync failed", e);
      setSyncStatus('error'); 
    }
  };

  const handleUpdateLeads = (newLeads) => {
    setLeads(newLeads);
    syncToCloud(newLeads, dailyData, outreachLog, adminKey);
  };

  const handleUpdateDaily = (newDaily) => {
    setDailyData(newDaily);
    syncToCloud(leads, newDaily, outreachLog, adminKey);
  };

  const handleUpdateOutreach = (newOutreach) => {
    setOutreachLog(newOutreach);
    syncToCloud(leads, dailyData, newOutreach, adminKey);
  };

  const handleDeleteOutreach = (timestamp) => {
    if (!isAdmin) return alert("Unlock Admin Mode to delete history.");
    const deletedEntry = outreachLog.find(e => e.ts === timestamp);
    if (!deletedEntry) return;

    const updatedLog = outreachLog.filter(e => e.ts !== timestamp);
    const today = new Date().toISOString().split('T')[0];
    const entryDate = new Date(deletedEntry.ts).toISOString().split('T')[0];
    
    let updatedDaily = dailyData;
    if (entryDate === today) {
      const newCounts = { ...dailyData.counts };
      if (newCounts[deletedEntry.tplKey] > 0) newCounts[deletedEntry.tplKey]--;
      updatedDaily = { ...dailyData, counts: newCounts };
      setDailyData(updatedDaily);
    }
    setOutreachLog(updatedLog);
    syncToCloud(leads, updatedDaily, updatedLog, adminKey);
  };

  const handleExportMarked = () => {
    const marked = leads.filter((l) => l.checked);
    if (!marked.length) return alert("No leads checked! Select them in the directory first.");
    const header = ["Name", "Phone", "Website", "Email", "Category", "Rating", "Reviews", "Status"];
    const rows = marked.map((l) => 
      [l.name, l.phone, l.website, l.email, l.category, l.rating, l.reviews, l.status]
        .map(v => `"${(v || "").toString().replace(/"/g, '""')}"`)
    );
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads_export.csv";
    a.click();
  };

  const NavItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Home' },
    { id: 'leads', icon: 'view_list', label: 'Directory' },
    { id: 'outreach', icon: 'mail', label: 'Log' },
    { id: 'settings', icon: 'settings', label: 'Setup' }
  ];

  return (
    <div className="bg-background-light text-slate-900 font-display h-screen flex flex-col overflow-hidden">
      <OutreachCalendar isOpen={isCalOpen} onClose={() => setIsCalOpen(false)} outreachLog={outreachLog} onDeleteEntry={handleDeleteOutreach} />

      {isLoading && (
        <div id="loading-overlay" className="fixed inset-0 bg-white/95 z-[9999] flex flex-col items-center justify-center gap-4">
          <div className="spinner border-3 border-primary/20 border-t-primary rounded-full w-10 h-10 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Connecting to Vercel KV...</p>
        </div>
      )}

      <header className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-4 lg:px-6 py-3 z-30 shadow-sm lg:shadow-none">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>table_view</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm lg:text-lg font-black leading-tight uppercase lg:normal-case">LeadFlow</h2>
              <span className="text-[9px] lg:text-[10px] font-bold text-primary uppercase tracking-widest hidden sm:block">CSV Enterprise</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-1 border-l border-primary/20 pl-6 ml-2">
            <label className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400" style={{ fontSize: '18px' }}>search</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 w-80 rounded-lg border border-primary/15 bg-primary/5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all" placeholder="Search leads, domains..." />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button onClick={() => { if(isAdmin){setIsAdmin(false);setAdminKey("");}else{const p=prompt("Admin Key:");if(p){setAdminKey(p);setIsAdmin(true);}} }} className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center transition-all ${isAdmin ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={isAdmin ? "Lock Admin Mode" : "Unlock Admin Mode"}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isAdmin ? 'lock_open' : 'lock'}</span>
          </button>
          <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-slate-500">
            <span className={`sync-dot w-2 h-2 rounded-full inline-block ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="hidden sm:inline font-medium">{syncStatus === 'synced' ? 'Synced' : syncStatus === 'error' ? 'Sync Error' : 'Saving...'}</span>
          </div>
          <button onClick={handleExportMarked} className="flex h-8 lg:h-10 items-center gap-1 lg:gap-2 rounded-lg bg-primary px-3 lg:px-4 text-[11px] lg:text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all ml-1 lg:ml-0">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>ios_share</span><span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`hidden lg:flex flex-col border-r border-primary/10 bg-white transition-all duration-300 z-20`} style={{ width: sidebarCollapsed ? '72px' : '240px' }}>
          <div className="flex items-center justify-center p-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">{sidebarCollapsed ? 'side_navigation' : 'menu_open'}</span>
            </button>
          </div>
          <nav className="flex flex-col gap-2 px-3 mt-2">
            {NavItems.map(item => (
              <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.id); }} className={`flex items-center rounded-xl transition-all duration-200 ${sidebarCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'} ${activeView === item.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-primary/5'}`}>
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '22px' }}>{item.icon}</span>
                {!sidebarCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background-light pb-20 lg:pb-0 w-full">
          {activeView === 'dashboard' && <DashboardAnalytics leads={leads} dailyData={dailyData} onOpenCalendar={() => setIsCalOpen(true)} />}
          
          {/* RECENTLY CHANGED: Feeding all the persistent state variables down into the table */}
          {activeView === 'leads' && (
            <LeadTable 
              leads={leads} 
              isAdmin={isAdmin} 
              setLeads={handleUpdateLeads} 
              dailyData={dailyData} 
              setDailyData={handleUpdateDaily} 
              outreachLog={outreachLog}
              setOutreachLog={handleUpdateOutreach}
              
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              catFilter={catFilter} setCatFilter={setCatFilter}
              sortType={sortType} setSortType={setSortType}
              page={page} setPage={setPage}
              perPage={perPage} setPerPage={setPerPage}
              copyMode={copyMode} setCopyMode={setCopyMode}
              rangeFilters={rangeFilters} setRangeFilters={setRangeFilters}
            />
          )}
          
          {activeView === 'outreach' && <OutreachLog leads={leads} outreachLog={outreachLog} setOutreachLog={handleUpdateOutreach} />}
          {activeView === 'settings' && <SettingsPanel leads={leads} isAdmin={isAdmin} adminKey={adminKey} setLeads={handleUpdateLeads} dailyData={dailyData} setDailyData={handleUpdateDaily} syncStatus={syncStatus} onForceSync={() => syncToCloud(leads, dailyData, outreachLog, adminKey)} />}
        </main>

        <nav className="lg:hidden absolute bottom-0 left-0 right-0 border-t border-primary/10 bg-white px-4 pb-safe pt-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center max-w-lg mx-auto pb-1">
            {NavItems.map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex flex-col items-center gap-0.5 pt-1 ${activeView === item.id ? 'text-primary' : 'text-slate-400'}`}>
                <span className={`material-symbols-outlined ${activeView === item.id ? 'fill-1' : ''}`} style={{ fontSize: '24px' }}>{item.icon}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        
      </div>
    </div>
  );
}