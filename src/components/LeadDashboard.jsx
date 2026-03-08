import React, { useState, useEffect } from 'react';
import DashboardAnalytics from './DashboardAnalytics';
import LeadTable from './LeadTable';
import OutreachLog from './OutreachLog';
import SettingsPanel from './SettingsPanel';
import FALLBACK_LEADS from '../data/fallback-leads';

export default function LeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState('Loading leads...');
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncState] = useState('synced'); 
  
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
      setLoadingMsg('Fetching leads from cloud...');
      
      let fetchedLeads = null;

      try {
        const res = await fetch('/api/leads').catch(() => null);
        
        if (res && res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            fetchedLeads = await res.json();
          } else {
            console.warn("API route returned HTML instead of JSON. Using fallback.");
          }
        }
      } catch (err) {
        console.warn("Failed to load leads from API", err);
      } 

      if (Array.isArray(fetchedLeads) && fetchedLeads.length > 0) {
        setLeads(fetchedLeads.map(l => ({ ...l, id: String(l.id), status: "none", replied: false, checked: false })));
      } else {
        setLeads(FALLBACK_LEADS.map((l, i) => ({
          ...l,
          id: String(l.id || i + 1),
          status: "none",
          replied: false,
          checked: false,
        })));
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  const handleExport = () => {
    const marked = leads.filter((l) => l.checked);
    if (!marked.length) return alert("No leads checked! Use checkboxes to select.");
    
    const header = ["Name", "Phone", "Website", "Email", "Category", "Rating", "Reviews", "Address", "Status"];
    const rows = marked.map((l) =>
      [l.name, l.phone, l.website, l.email, l.category, l.rating, l.reviews, l.address, l.status].map((v) => {
        const s = (v || "").toString().replace(/"/g, '""');
        return `"${s}"`;
      })
    );
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads_export.csv";
    a.click();
  };

  const forceSync = () => {
    setSyncState('syncing');
    setTimeout(() => setSyncState('synced'), 1000); 
  };

  return (
    <div className="bg-background-light text-slate-900 font-display">
      {isLoading && (
        <div id="loading-overlay" className="fixed inset-0 bg-[#f7f5f8]/95 z-[9999] flex flex-col items-center justify-center gap-4">
          <div className="spinner border-3 border-primary/20 border-t-primary rounded-full w-10 h-10 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">{loadingMsg}</p>
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
            <div className="hidden md:flex items-center gap-1 border-l border-primary/20 pl-6 ml-2">
              <label className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400" style={{ fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-80 rounded-lg border border-primary/15 bg-primary/5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                  placeholder="Search leads, domains, phone..."
                />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`sync-dot w-2 h-2 rounded-full inline-block ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Saving...' : 'Error'}</span>
            </div>
            <button
              onClick={handleExport}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ios_share</span>
              <span>Export Marked</span>
            </button>
            <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              LF
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className={`hidden w-60 flex-col border-r border-primary/10 bg-white lg:flex flex-shrink-0 sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ padding: '16px 12px', transition: 'width 0.2s ease', width: sidebarCollapsed ? '56px' : '240px' }}>
            <div className="flex items-center justify-between mb-5 px-1">
              {!sidebarCollapsed && <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sidebar-section-title">Navigation</h3>}
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="sidebar-toggle w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary flex-shrink-0 mx-auto">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {sidebarCollapsed ? 'right_panel_close' : 'left_panel_close'}
                </span>
              </button>
            </div>
            <div className="mb-6">
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
                  { id: 'leads', icon: 'view_list', label: 'Lead Directory' },
                  { id: 'outreach', icon: 'mail', label: 'Outreach' },
                  { id: 'settings', icon: 'settings', label: 'Settings' }
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${activeView === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 hover:bg-primary/5 hover:text-primary'}`}
                  >
                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 overflow-hidden flex flex-col bg-background-light">
            {activeView === 'dashboard' && <DashboardAnalytics leads={leads} dailyData={dailyData} />}
            {/* RECENTLY CHANGED: Passed dailyData and setDailyData to LeadTable so it can update the dashboard counts */}
            {activeView === 'leads' && <LeadTable leads={leads} setLeads={setLeads} searchQuery={searchQuery} dailyData={dailyData} setDailyData={setDailyData} />}
            {activeView === 'outreach' && <OutreachLog leads={leads} />}
            {activeView === 'settings' && (
              <SettingsPanel 
                leads={leads} 
                setLeads={setLeads} 
                dailyData={dailyData} 
                setDailyData={setDailyData} 
                syncStatus={syncStatus} 
                onForceSync={forceSync} 
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}