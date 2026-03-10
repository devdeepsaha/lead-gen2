import React, { useState, useMemo } from 'react';

export default function SettingsPanel({ leads, isAdmin = false, adminKey = "", setLeads, dailyData, setDailyData, syncStatus, onForceSync }) {
  const [goalInput, setGoalInput] = useState(dailyData.goal || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ msg: '', type: '' });

  const stats = useMemo(() => {
    const tagged = leads.filter(l => ['job', 'build', 'build_plus'].includes(l.status)).length;
    const categories = new Set(leads.map(l => l.category)).size;
    
    const payloadString = JSON.stringify(leads);
    const bytes = new Blob([payloadString]).size;
    const kb = bytes / 1024;
    const mb = bytes / (1024 * 1024);
    
    const sizeDisplay = bytes > 1024 * 1024 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
    const percentOfLimit = Math.min(100, Math.round((kb / 1024) * 100)); 

    return { total: leads.length, tagged, categories, sizeDisplay, percentOfLimit, kb };
  }, [leads]);

  // RECENTLY CHANGED: Deep sync pushes BOTH the leads and the statuses
  const handleDeepSync = async () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to sync.");
    setUploadStatus({ msg: "Pushing all data to Vercel KV...", type: "loading" });
    try {
      const resLeads = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leads)
      });
      if (!resLeads.ok) throw new Error("Failed to sync base leads.");
      await onForceSync();
      setUploadStatus({ msg: "✅ Deep Cloud Sync Complete!", type: "success" });
      setTimeout(() => setUploadStatus({ msg: '', type: '' }), 4000);
    } catch (err) {
      setUploadStatus({ msg: `❌ Sync failed: ${err.message}`, type: "error" });
    }
  };

  // RECENTLY CHANGED: Restored the missing backup function
  const downloadStatusBackup = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to download database backups.");
    const map = {};
    leads.forEach((l) => { map[l.id] = { status: l.status, replied: l.replied }; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(map, null, 2)], { type: "application/json" }));
    a.download = "leadflow_backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
        name: g(col.name), phone: g(col.phone), website: g(col.website), email: g(col.email),
        category: g(col.category) || "Uncategorized", address: g(col.address),
        rating: parseFloat(g(col.rating)) || null, reviews: parseInt(g(col.reviews)) || null,
        lat: parseFloat(g(col.lat)) || null, lng: parseFloat(g(col.lng)) || null,
        status: 'none', replied: false, checked: false
      });
    }
    return results.filter((r) => r.name);
  };

  const handleFile = (file) => {
    if (!isAdmin) return setUploadStatus({ msg: '🔒 Admin Mode required.', type: 'error' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        const existingMap = new Map(leads.map(l => [l.id, l]));
        parsed.forEach(p => {
          if (existingMap.has(p.id)) {
            const ex = existingMap.get(p.id);
            existingMap.set(p.id, { ...ex, ...p, status: ex.status, replied: ex.replied });
          } else { existingMap.set(p.id, p); }
        });
        setLeads(Array.from(existingMap.values()));
        setUploadStatus({ msg: `✅ CSV staged. Use 'Force Sync' or 'Smart Cleanup' to save.`, type: 'success' });
      } catch (err) { setUploadStatus({ msg: `❌ Parse error.`, type: 'error' }); }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleSmartCleanup = async () => {
    if (!isAdmin) return alert("🔒 Admin Mode required.");
    setUploadStatus({ msg: "Cleaning and saving...", type: "loading" });
    const uniqueMap = new Map();
    leads.forEach(l => {
      const key = l.name.toLowerCase().trim();
      if (uniqueMap.has(key)) {
        const ex = uniqueMap.get(key);
        uniqueMap.set(key, { ...ex, phone: ex.phone || l.phone, email: ex.email || l.email, lat: ex.lat || l.lat, lng: ex.lng || l.lng });
      } else { uniqueMap.set(key, { ...l }); }
    });
    const cleaned = Array.from(uniqueMap.values());
    setLeads(cleaned);
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleaned) });
      const fileContent = `const FALLBACK_LEADS = ${JSON.stringify(cleaned, null, 2)};\n\nexport default FALLBACK_LEADS;`;
      const blob = new Blob([fileContent], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'fallback-leads-cleaned.js'; a.click();
      setUploadStatus({ msg: `✅ Cleaned! Local file downloaded.`, type: 'success' });
    } catch (err) { setUploadStatus({ msg: `❌ Cloud error.`, type: 'error' }); }
  };

  const resetAllStatuses = () => {
    if (!isAdmin) return alert("🔒 Admin Mode required.");
    if (window.confirm("Reset all statuses?")) setLeads(leads.map(l => ({ ...l, status: 'none', replied: false })));
  };

  const resetLeadsData = async () => {
    if (!isAdmin) return alert("🔒 Admin Mode required.");
    if (window.confirm("NUKE THE CLOUD?")) {
      try {
        await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
        setUploadStatus({ msg: "✅ Cloud Wiped.", type: "success" });
      } catch (e) { setUploadStatus({ msg: "❌ Wipe failed.", type: "error" }); }
    }
  };

  return (
    <div id="view-settings" className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col pb-24 md:pb-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">Settings {!isAdmin && '🔒'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        <div className="md:col-span-2 bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-3">CSV Upload</h3>
          <div className="border-2 dashed rounded-xl p-8 text-center cursor-pointer hover:bg-primary/5" onClick={() => isAdmin && document.getElementById('csv-file-input').click()} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0])}}>
            <span className="material-symbols-outlined text-4xl text-slate-300">upload_file</span>
            <p className="text-sm font-semibold text-slate-500 mt-2">Drop CSV or click to browse</p>
            <input type="file" id="csv-file-input" accept=".csv" className="hidden" onChange={e=>handleFile(e.target.files[0])} disabled={!isAdmin} />
          </div>
          {uploadStatus.msg && <div className="mt-3 p-3 rounded-lg text-sm bg-slate-50 border">{uploadStatus.msg}</div>}
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Data Management</h3>
          <div className="flex flex-col gap-3">
            <button onClick={handleDeepSync} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary font-bold text-sm hover:bg-primary/5"><span className="material-symbols-outlined text-[16px]">sync</span> Force Cloud Sync</button>
            <button onClick={downloadStatusBackup} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold"><span className="material-symbols-outlined text-[16px]">download</span> Download Backup JSON</button>
            <button onClick={handleSmartCleanup} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-blue-500 text-white font-bold text-sm"><span className="material-symbols-outlined text-[16px]">cleaning_services</span> Smart Deduplicate</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-3">Current Dataset</h3>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex justify-between"><span>Total leads</span><span className="font-bold text-slate-800">{stats.total}</span></div>
            <div className="flex justify-between"><span>Payload Size</span><span className="font-bold text-primary">{stats.sizeDisplay}</span></div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-primary h-full" style={{ width: `${stats.percentOfLimit}%` }}></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-red-100 p-5">
          <h3 className="font-bold text-sm text-red-600 mb-3">Danger Zone</h3>
          <div className="flex gap-3">
            <button onClick={resetAllStatuses} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-sm">Reset tags</button>
            <button onClick={resetLeadsData} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-sm">Wipe cloud</button>
          </div>
        </div>
      </div>
    </div>
  );
}