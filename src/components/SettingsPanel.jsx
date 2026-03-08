import React, { useState, useMemo } from 'react';

export default function SettingsPanel({ leads, setLeads, dailyData, setDailyData, syncStatus, onForceSync }) {
  const [goalInput, setGoalInput] = useState(dailyData.goal || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ msg: '', type: '' }); // type: 'success', 'error', 'loading', or ''

  // Derived stats for the "Current Dataset" card
  const stats = useMemo(() => {
    const tagged = leads.filter(l => ['job', 'build', 'build_plus'].includes(l.status)).length;
    const categories = new Set(leads.map(l => l.category)).size;
    return { total: leads.length, tagged, categories };
  }, [leads]);

  // CHANGED: Converted the vanilla JS CSV parser into a React utility function
  const parseCSVRow = (line) => {
    const result = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQ = !inQ;
      else if (c === "," && !inQ) { result.push(cur); cur = ""; }
      else cur += c;
    }
    result.push(cur);
    return result.map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"'));
  };

  const parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVRow(lines[0]).map((h) => h.trim());
    
    const idx = (names) => {
      for (const n of names) {
        const i = headers.findIndex((h) => h.toLowerCase() === n.toLowerCase());
        if (i >= 0) return i;
      }
      return -1;
    };
    
    const col = {
      id: idx(["Place ID", "id", "place_id"]),
      name: idx(["Business Name", "name", "business_name"]),
      phone: idx(["Phone", "phone"]),
      website: idx(["Website", "website", "url"]),
      email: idx(["Emails", "Email", "email"]),
      category: idx(["Category", "category"]),
      address: idx(["Address", "address"]),
      rating: idx(["Rating", "rating"]),
      reviews: idx(["Reviews", "reviews", "review_count"]),
    };
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < 3) continue;
      const g = (c) => (c >= 0 ? (row[c] || "").trim() : "");
      results.push({
        id: g(col.id) || `csv_${i}_${Date.now()}`,
        name: g(col.name),
        phone: g(col.phone),
        website: g(col.website),
        email: g(col.email),
        category: g(col.category) || "Uncategorized",
        address: g(col.address),
        rating: parseFloat(g(col.rating)) || null,
        reviews: parseInt(g(col.reviews)) || null,
        status: 'none',
        replied: false,
        checked: false
      });
    }
    return results.filter((r) => r.name);
  };

  // CHANGED: Handlers for Drag and Drop uploading via React synthetic events
  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setUploadStatus({ msg: 'Please drop a valid .csv file', type: 'error' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) throw new Error("No valid rows found in CSV");
        
        setUploadStatus({ msg: `Parsed ${parsed.length} rows — processing...`, type: 'loading' });
        
        // Merge logic: Add new leads while skipping existing IDs
        const existingIds = new Set(leads.map(l => l.id));
        const newLeads = parsed.filter(l => !existingIds.has(l.id));
        
        setLeads(prev => [...prev, ...newLeads]);
        setUploadStatus({ msg: `✅ Done! Added ${newLeads.length} new leads · Skipped ${parsed.length - newLeads.length} duplicates`, type: 'success' });
        
        // Simulating API POST if needed:
        // await fetch('/api/leads', { method: 'POST', body: JSON.stringify(newLeads) });
      } catch (err) {
        setUploadStatus({ msg: `❌ Upload failed: ${err.message}`, type: 'error' });
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const saveDailyGoal = () => {
    const val = Math.max(1, Math.min(200, goalInput));
    const newDaily = { ...dailyData, goal: val };
    setDailyData(newDaily);
    try { localStorage.setItem("lf_daily_v1", JSON.stringify(newDaily)); } catch (e) {}
    alert(`🎯 Goal set to ${val}/day`);
  };

  // Danger Zone Actions
  const downloadStatusBackup = () => {
    const map = {};
    leads.forEach((l) => { map[l.id] = l.status; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(map, null, 2)], { type: "application/json" }));
    a.download = "leadflow_statuses_backup.json";
    a.click();
  };

  const resetAllStatuses = () => {
    if (!window.confirm("Reset ALL status tags on all devices?")) return;
    setLeads(prev => prev.map(l => ({ ...l, status: 'none', replied: false })));
  };

  const resetLeadsData = () => {
    if (!window.confirm("Wipe ALL leads from cloud? This removes them entirely.")) return;
    setLeads([]);
  };

  return (
    <div id="view-settings" className="flex-1 p-6 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Manage leads data, sync, and backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {/* CSV Upload */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Add New Leads from CSV</h3>
              <p className="text-xs text-slate-400 mt-0.5">Drop a new scrape CSV — duplicates are skipped automatically, existing statuses are untouched.</p>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wide">Cloud Upload</span>
          </div>
          
          <div 
            className={`border-2 dashed rounded-12px p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary hover:bg-primary/5'}`}
            style={{ borderRadius: '12px', borderStyle: 'dashed' }}
            onClick={() => document.getElementById('csv-file-input').click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="material-symbols-outlined text-primary/40 block mb-2" style={{ fontSize: '36px' }}>upload_file</span>
            <p className="text-sm font-semibold text-slate-500">Drop CSV here or <span className="text-primary">click to browse</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Expects: Place ID, Business Name, Phone, Website, Emails, Category, Address, Rating, Reviews</p>
            <input type="file" id="csv-file-input" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          
          {uploadStatus.msg && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : uploadStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
              {uploadStatus.msg}
            </div>
          )}
        </div>

        {/* Daily Goal */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-1">Daily Outreach Goal</h3>
          <p className="text-xs text-slate-400 mb-3">Set your daily target for outreach messages sent.</p>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              min="1" max="200" 
              value={goalInput} 
              onChange={(e) => setGoalInput(parseInt(e.target.value) || 1)}
              className="w-20 h-9 rounded-lg border border-primary/20 px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary/50" 
            />
            <button onClick={saveDailyGoal} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
              Save Goal
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Today's count: <span className="font-bold text-primary">{(dailyData.counts.job || 0) + (dailyData.counts.build_no_demo || 0) + (dailyData.counts.build_demo || 0)}</span> sent
          </p>
        </div>

        {/* Sync */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-1">Cloud Sync</h3>
          <p className="text-xs text-slate-400 mb-3">Status tags and leads sync automatically to Vercel KV.</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full inline-block ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-sm font-semibold text-slate-700">{syncStatus === 'synced' ? 'All changes saved' : 'Syncing...'}</span>
          </div>
          <button onClick={onForceSync} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary text-sm font-bold hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span> Force sync
          </button>
        </div>

        {/* Backup / Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-1">Backup Statuses</h3>
          <p className="text-xs text-slate-400 mb-3">Download a JSON snapshot of all current tags.</p>
          <button onClick={downloadStatusBackup} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> Download JSON
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-3">Current Dataset</h3>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex justify-between"><span>Total leads</span><span className="font-bold text-slate-800">{stats.total}</span></div>
            <div className="flex justify-between"><span>Tagged</span><span className="font-bold text-emerald-600">{stats.tagged}</span></div>
            <div className="flex justify-between"><span>Categories</span><span className="font-bold text-slate-800">{stats.categories}</span></div>
            <div className="flex justify-between"><span>Data source</span><span className="font-bold text-primary">Local / File</span></div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-2 bg-white rounded-xl border border-red-100 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-1 text-red-600">Danger Zone</h3>
          <p className="text-xs text-slate-400 mb-3">These actions affect all devices and cannot be undone.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={resetAllStatuses} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_forever</span> Reset all status tags
            </button>
            <button onClick={resetLeadsData} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>database</span> Wipe leads from memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}