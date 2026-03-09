import React, { useState, useMemo } from 'react';

export default function SettingsPanel({ leads, isAdmin = false, adminKey = "", setLeads, dailyData, setDailyData, syncStatus, onForceSync }) {
  const [goalInput, setGoalInput] = useState(dailyData.goal || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ msg: '', type: '' });

  const stats = useMemo(() => {
    const tagged = leads.filter(l => ['job', 'build', 'build_plus'].includes(l.status)).length;
    const categories = new Set(leads.map(l => l.category)).size;
    return { total: leads.length, tagged, categories };
  }, [leads]);

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
      lat: idx(["Latitude", "lat", "latitude"]),
      lng: idx(["Longitude", "lng", "lon", "longitude"]),
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
        lat: parseFloat(g(col.lat)) || null,
        lng: parseFloat(g(col.lng)) || null,
        status: 'none',
        replied: false,
        checked: false
      });
    }
    return results.filter((r) => r.name);
  };

  const handleFile = (file) => {
    if (!isAdmin) {
      setUploadStatus({ msg: '🔒 Unlock Admin Mode to upload CSV files.', type: 'error' });
      return;
    }

    if (!file || !file.name.endsWith('.csv')) {
      setUploadStatus({ msg: 'Please drop a valid .csv file', type: 'error' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) throw new Error("No valid rows found in CSV");
        
        setUploadStatus({ msg: `Parsed ${parsed.length} rows — staging data in memory...`, type: 'loading' });
        
        const existingMap = new Map(leads.map(l => [l.id, l]));
        let addedCount = 0;
        let updatedCount = 0;

        parsed.forEach(parsedLead => {
          if (existingMap.has(parsedLead.id)) {
            const existingLead = existingMap.get(parsedLead.id);
            existingMap.set(parsedLead.id, {
              ...existingLead,             
              ...parsedLead,               
              status: existingLead.status, 
              replied: existingLead.replied, 
              checked: existingLead.checked
            });
            updatedCount++;
          } else {
            existingMap.set(parsedLead.id, parsedLead);
            addedCount++;
          }
        });
        
        const newLeadsArray = Array.from(existingMap.values());
        
        // 1. Update UI instantly with the massive payload
        setLeads(newLeadsArray); 

        // RECENTLY CHANGED: Removed the fetch API call from here completely! 
        // We now just stage the massive data in the UI so the server doesn't crash on a 400 Bad Request.
        
        setUploadStatus({ 
          msg: `✅ Loaded ${addedCount} new leads and updated ${updatedCount} in memory. Please click 'Smart Deduplicate' to clean and save to the cloud!`, 
          type: 'success' 
        });
        
      } catch (err) {
        setUploadStatus({ msg: `❌ Upload failed: ${err.message}`, type: 'error' });
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDragOver = (e) => { e.preventDefault(); if (isAdmin) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isAdmin) return setUploadStatus({ msg: '🔒 Unlock Admin Mode to upload CSV files.', type: 'error' });
    handleFile(e.dataTransfer.files[0]);
  };

  // RECENTLY CHANGED: Smart Deduplicate now handles pushing to the cloud AFTER shrinking the payload size.
  const handleSmartCleanup = async () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to clean the database.");
    if (!window.confirm("This will scan for duplicates, merge their contact info/tags, and push the cleaned database to Vercel. Proceed?")) return;

    setUploadStatus({ msg: "Cleaning duplicates and saving to cloud...", type: "loading" });

    const uniqueMap = new Map();
    let removedCount = 0;

    leads.forEach(lead => {
      const key = lead.name.toLowerCase().trim();
      
      if (uniqueMap.has(key)) {
        removedCount++;
        const existing = uniqueMap.get(key);

        let bestStatus = existing.status;
        if (existing.status === 'none' && lead.status !== 'none') bestStatus = lead.status;

        uniqueMap.set(key, {
          ...existing,
          status: bestStatus,
          replied: existing.replied || lead.replied,
          phone: existing.phone || lead.phone,
          email: existing.email || lead.email,
          lat: existing.lat || lead.lat,
          lng: existing.lng || lead.lng
        });
      } else {
        uniqueMap.set(key, { ...lead });
      }
    });

    const cleanedLeads = Array.from(uniqueMap.values());
    
    // Instantly update UI with the cleaned data
    setLeads(cleanedLeads);

    try {
      // RECENTLY CHANGED: Push the smaller, cleaned array straight to the cloud as a raw array.
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedLeads) 
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}. The payload might still be too large for free tier.`);

      setUploadStatus({ 
        msg: `✅ Cleanup complete! Removed ${removedCount} duplicates and saved pristine data to Vercel KV cloud.`, 
        type: 'success' 
      });

    } catch (err) {
      setUploadStatus({ msg: `❌ Cloud save failed: ${err.message}`, type: 'error' });
    }
  };

  const saveDailyGoal = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to change the daily goal.");
    const val = Math.max(1, Math.min(200, goalInput));
    const newDaily = { ...dailyData, goal: val };
    setDailyData(newDaily);
    alert(`🎯 Goal set to ${val}/day`);
  };

  const downloadStatusBackup = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to download database backups.");
    const map = {};
    leads.forEach((l) => { map[l.id] = l.status; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(map, null, 2)], { type: "application/json" }));
    a.download = "leadflow_statuses_backup.json";
    a.click();
  };

  const resetAllStatuses = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to reset statuses.");
    if (!window.confirm("Reset ALL status tags on all devices? This will wipe your progress.")) return;
    const newLeads = leads.map(l => ({ ...l, status: 'none', replied: false }));
    setLeads(newLeads);
  };

  const resetLeadsData = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to wipe the database.");
    if (!window.confirm("Wipe ALL leads from memory? This removes them entirely and cannot be undone.")) return;
    setLeads([]);
  };

  return (
    <div id="view-settings" className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col pb-24 md:pb-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Settings {!isAdmin && <span className="material-symbols-outlined text-slate-300 text-xl">lock</span>}
          </h1>
          <p className="text-sm text-slate-500">Manage leads data, sync, and backups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        
        {/* CSV Upload */}
        <div className={`md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all ${!isAdmin ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Add or Update Leads from CSV</h3>
              <p className="text-xs text-slate-400 mt-0.5">Drop a CSV to enrich existing leads (like adding map coordinates) or add new ones. Your manual status tags are preserved.</p>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wide">Staged Upload</span>
          </div>
          
          <div 
            className={`border-2 dashed rounded-xl p-8 text-center transition-all ${!isAdmin ? 'cursor-not-allowed bg-slate-50 border-slate-200' : isDragging ? 'border-primary bg-primary/5 cursor-pointer' : 'border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer'}`}
            style={{ borderStyle: 'dashed' }}
            onClick={() => isAdmin ? document.getElementById('csv-file-input').click() : setUploadStatus({ msg: '🔒 Unlock Admin Mode to upload.', type: 'error' })}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className={`material-symbols-outlined block mb-2 ${isAdmin ? 'text-primary/40' : 'text-slate-300'}`} style={{ fontSize: '36px' }}>{isAdmin ? 'upload_file' : 'lock'}</span>
            <p className="text-sm font-semibold text-slate-500">Drop CSV here or <span className={isAdmin ? "text-primary" : ""}>click to browse</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Expects: Place ID, Business Name, Phone, Website, Emails, Category, Address, Rating, Reviews, Latitude, Longitude</p>
            <input type="file" id="csv-file-input" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={!isAdmin} />
          </div>
          
          {uploadStatus.msg && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : uploadStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              {uploadStatus.msg}
            </div>
          )}
        </div>

        {/* Sync & Backup */}
        <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${!isAdmin ? 'opacity-60' : ''}`}>
          <h3 className="font-bold text-sm mb-1">Data Management</h3>
          <p className="text-xs text-slate-400 mb-4">Sync statuses to cloud or deduplicate database.</p>
          
          <div className="flex flex-col gap-3">
            <button onClick={onForceSync} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${isAdmin ? 'border-primary/20 text-primary hover:bg-primary/5' : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span> Force Cloud Sync
            </button>
            <button onClick={downloadStatusBackup} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${isAdmin ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> Download Backup JSON
            </button>
            
            <button onClick={handleSmartCleanup} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 mt-2 rounded-lg text-white text-sm font-bold transition-all ${isAdmin ? 'bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20' : 'bg-slate-300 cursor-not-allowed'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cleaning_services</span> Smart Deduplicate (Cloud)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-3">Current Dataset</h3>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex justify-between"><span>Total leads</span><span className="font-bold text-slate-800">{stats.total}</span></div>
            <div className="flex justify-between"><span>Tagged</span><span className="font-bold text-emerald-600">{stats.tagged}</span></div>
            <div className="flex justify-between"><span>Categories</span><span className="font-bold text-slate-800">{stats.categories}</span></div>
            <div className="flex justify-between"><span>Data source</span><span className="font-bold text-primary">Vercel KV Cloud</span></div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`md:col-span-2 bg-white rounded-xl border border-red-100 p-5 shadow-sm ${!isAdmin ? 'opacity-60' : ''}`}>
          <h3 className="font-bold text-sm mb-1 text-red-600">Danger Zone</h3>
          <p className="text-xs text-slate-400 mb-3">These actions affect all devices and cannot be undone.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={resetAllStatuses} disabled={!isAdmin} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${isAdmin ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_forever</span> Reset all status tags
            </button>
            <button onClick={resetLeadsData} disabled={!isAdmin} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${isAdmin ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>database</span> Wipe leads from memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}