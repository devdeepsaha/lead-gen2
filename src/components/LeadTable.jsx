import React, { useState, useMemo } from 'react';

const TEMPLATES = {
  job: {
    build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a final-year B.Tech CSE student who sits somewhere between a designer and a developer.\n\nWhile most developers focus only on code, I enjoy building experiences where visuals, interaction, and storytelling are just as important as functionality. I work on creative web projects, interactive UI concepts, and design-driven builds where aesthetics and logic meet.\n\nI'm currently exploring opportunities where I can contribute as a creative developer / designer, someone who can think visually and execute technically.\n\nPortfolio:\nhttps://devdeepsahaportfolio.vercel.app/\n\nIf this aligns with what your team is building, I'd genuinely love to connect and learn more.\n\nThanks for your time,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
  },
  build: {
    build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a creative developer focused on building modern, performance-driven web experiences.\n\nI wanted to share my portfolio in case you're currently exploring design or development support:\nhttps://webdevstudio.vercel.app/\n\nIf at any point you're considering revamping your website or improving the user experience, I'd be happy to help. I work on clean UI systems, responsive layouts, and structured builds that balance aesthetics with performance.\n\nFeel free to reach out if this sounds relevant.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
  },
  build_plus: {
    build: (name) => `Hi ${name} Team,\n\nI came across your website and felt there may be an opportunity to modernize the visual experience so it better reflects the quality of your services.\n\nTo demonstrate what I mean, I drafted a quick homepage concept tailored specifically to your brand — see the attached image. It is just a visual direction idea, but I believe it improves clarity, hierarchy, and overall perception while keeping things clean and modern.\n\nI specialize in building structured, performance-optimized websites ranging from clean static builds to React-based interactive platforms and CMS-powered systems, depending on business needs.\n\nYou can view more of my work here:\nhttps://webdevstudio.vercel.app/\n\nIf you are open to discussing a structured revamp, I would be happy to explore this further and share more detailed suggestions.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
  },
};

// RECENTLY CHANGED: Added dailyData and setDailyData as destructured props
export default function LeadTable({ leads = [], setLeads, searchQuery = '', dailyData, setDailyData }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [sortDropOpen, setSortDropOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const categories = useMemo(() => {
    const counts = {};
    leads.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let arr = leads.filter((l) => {
      if (statusFilter === "replied") {
        if (!l.replied) return false;
      } else if (statusFilter !== "all" && l.status !== statusFilter) {
        return false;
      }
      if (catFilter !== "all" && l.category !== catFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(
          l.name.toLowerCase().includes(q) ||
          (l.phone && l.phone.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.category && l.category.toLowerCase().includes(q))
        )) return false;
      }
      return true;
    });

    switch (sortType) {
      case "name_asc": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc": arr.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "reviews_desc": arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)); break;
      case "reviews_asc": arr.sort((a, b) => (a.reviews || 0) - (b.reviews || 0)); break;
      case "rating_desc": arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "rating_asc": arr.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
      case "cat_reviews": arr.sort((a, b) => a.category.localeCompare(b.category) || (b.reviews || 0) - (a.reviews || 0)); break;
      case "cat_rating": arr.sort((a, b) => a.category.localeCompare(b.category) || (b.rating || 0) - (a.rating || 0)); break;
      case "cat_name": arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)); break;
      default: break;
    }
    return arr;
  }, [leads, statusFilter, catFilter, sortType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / perPage));
  if (page > totalPages) setPage(totalPages);

  const paginatedLeads = filteredLeads.slice((page - 1) * perPage, page * perPage);

  const updateLead = (id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleStatusClick = (id, newStatus) => {
    const lead = leads.find(l => l.id === id);
    const finalStatus = lead.status === newStatus ? 'none' : newStatus;
    updateLead(id, { status: finalStatus });
  };

  // RECENTLY CHANGED: Implemented foolproof fallback copy and linked it to the daily dashboard tracker
  const handleCopyTemplate = (lead) => {
    const tplKey = lead.status === 'build_no_demo' ? 'build' : lead.status;
    const tpl = TEMPLATES[tplKey];
    if (!tpl) return showToast("Tag lead as Job, Build, or Build+ first");

    const msg = tpl.build(lead.name);

    const logOutreach = () => {
      showToast("📋 Copied template for " + lead.name);
      
      try {
        const raw = localStorage.getItem("lf_outreach_log");
        let currentLog = raw ? JSON.parse(raw) : [];
        const actualTplKey = lead.status === 'build' ? 'build_no_demo' : lead.status === 'build_plus' ? 'build_demo' : lead.status;
        
        currentLog.unshift({
          id: lead.id,
          name: lead.name,
          category: lead.category || "",
          tplKey: actualTplKey,
          ts: Date.now()
        });
        
        localStorage.setItem("lf_outreach_log", JSON.stringify(currentLog.slice(0, 500)));

        // Update the Dashboard Daily Rings!
        setDailyData(prev => {
          const today = new Date().toISOString().split('T')[0];
          const isToday = prev.date === today;
          const newCounts = isToday ? { ...prev.counts } : { job: 0, build_no_demo: 0, build_demo: 0 };
          
          if (newCounts[actualTplKey] !== undefined) {
            newCounts[actualTplKey]++;
          }

          const newData = { ...prev, date: today, counts: newCounts };
          localStorage.setItem("lf_daily_v1", JSON.stringify(newData));
          return newData;
        });

      } catch (e) {
        console.error("Failed to save outreach log", e);
      }
    };

    // Foolproof copy method (helps bypass local development permissions)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(logOutreach).catch(() => {
          const ta = document.createElement("textarea");
          ta.value = msg;
          ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          logOutreach();
      });
    } else {
        const ta = document.createElement("textarea");
        ta.value = msg;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        logOutreach();
    }
  };

  const handleEmailCopy = (email) => {
    navigator.clipboard.writeText(email).then(() => showToast("📋 Copied " + email));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Temporary Toast for Copy Actions */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-xl">
          {toastMsg}
        </div>
      )}

      {/* Control Bar */}
      <div className="px-6 py-4 border-b border-primary/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Lead Directory</h1>
            <p className="text-xs text-slate-500">{leads.length} leads · tag each as Job, Build, Build+, or Skip.</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-primary/15 rounded-lg overflow-hidden">
              {['all', 'job', 'build', 'build_plus', 'none', 'dismissed', 'replied'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold transition-all border-r last:border-r-0 border-primary/15 ${
                    statusFilter === s ? 'bg-primary text-white' : 'text-slate-500 bg-white hover:bg-primary/5'
                  }`}
                >
                  {s === 'none' ? 'Unset' : s === 'build_plus' ? 'Build+' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <button onClick={() => { setCatDropOpen(!catDropOpen); setSortDropOpen(false); }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '15px' }}>filter_list</span>
                <span>{catFilter === 'all' ? 'Category' : (catFilter.length > 14 ? catFilter.slice(0,14)+'...' : catFilter)}</span>
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
              </button>
              {catDropOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] max-h-80 overflow-y-auto bg-white border border-primary/15 rounded-xl shadow-lg">
                  <div onClick={() => { setCatFilter('all'); setCatDropOpen(false); setPage(1); }} className={`p-2 text-sm cursor-pointer flex justify-between ${catFilter === 'all' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                    All Categories <span className="opacity-50 text-xs">{leads.length}</span>
                  </div>
                  {categories.map(([c, count]) => (
                    <div key={c} onClick={() => { setCatFilter(c); setCatDropOpen(false); setPage(1); }} className={`p-2 text-sm cursor-pointer flex justify-between ${catFilter === c ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                      {c} <span className="opacity-50 text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button onClick={() => { setSortDropOpen(!sortDropOpen); setCatDropOpen(false); }} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>sort</span>
                <span>Sort: {sortType.split('_')[0].toUpperCase()}</span>
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
              </button>
              {sortDropOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 w-48 bg-white border border-primary/15 rounded-xl shadow-lg flex flex-col p-1 text-sm">
                  {[
                    { id: 'default', label: 'Default Order' },
                    { id: 'name_asc', label: 'Name A → Z' },
                    { id: 'rating_desc', label: 'Highest Rated' },
                    { id: 'reviews_desc', label: 'Most Reviews' },
                    { id: 'cat_name', label: 'Category → Name' }
                  ].map(opt => (
                    <button key={opt.id} onClick={() => { setSortType(opt.id); setSortDropOpen(false); setPage(1); }} className={`text-left px-3 py-2 rounded-lg ${sortType === opt.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="h-8 px-2 rounded-lg border border-primary/15 text-xs font-semibold text-slate-600 bg-white outline-none">
              <option value="10">10/page</option>
              <option value="15">15/page</option>
              <option value="25">25/page</option>
              <option value="50">50/page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm" style={{ minWidth: '900px' }}>
          <thead className="sticky top-0 z-10 bg-primary/5 border-b border-primary/10 text-slate-500">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-primary w-3.5 h-3.5"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const idsOnPage = paginatedLeads.map(l => l.id);
                    setLeads(prev => prev.map(l => idsOnPage.includes(l.id) ? { ...l, checked } : l));
                  }}
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Business & Website</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Rating</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Reviews</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Copy</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Replied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 bg-white">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-16 text-slate-400">
                  <span className="material-symbols-outlined block text-5xl mb-3">search_off</span>
                  No leads match your filters.
                </td>
              </tr>
            ) : paginatedLeads.map((l) => {
              const urlObj = l.website ? new URL(l.website.startsWith('http') ? l.website : `https://${l.website}`).hostname.replace('www.', '') : null;
              
              return (
                <tr key={l.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={l.checked || false} onChange={(e) => updateLead(l.id, { checked: e.target.checked })} className="rounded border-slate-300 text-primary w-3.5 h-3.5"/>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{l.name}</span>
                      {urlObj && <a href={l.website} target="_blank" rel="noreferrer" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span></a>}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {urlObj ? <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-primary">{urlObj}</a> : <span className="text-slate-300">no website</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold uppercase max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap">{l.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined fill-1 text-amber-400" style={{ fontSize: '13px' }}>star</span>
                      <span className="font-bold text-slate-700 text-sm">{l.rating || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-500">{l.reviews ? Number(l.reviews).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-slate-600 font-mono">{l.phone || "—"}</p>
                    {l.email && <p className="text-[10px] text-primary truncate max-w-[140px] cursor-pointer hover:underline" onClick={() => handleEmailCopy(l.email)} title="Click to copy">{l.email}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="tbl-seg mx-auto w-fit flex border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => handleStatusClick(l.id, 'job')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'job' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Job</button>
                      <button onClick={() => handleStatusClick(l.id, 'build')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'build' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Build</button>
                      <button onClick={() => handleStatusClick(l.id, 'build_plus')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'build_plus' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>B+</button>
                      <button onClick={() => handleStatusClick(l.id, 'none')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'none' ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Skip</button>
                      <button onClick={() => handleStatusClick(l.id, 'dismissed')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'dismissed' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-50'}`}>✕</button>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button 
                      disabled={!['job', 'build', 'build_plus'].includes(l.status)}
                      onClick={() => handleCopyTemplate(l)}
                      className={`flex-shrink-0 w-7 h-7 rounded-md inline-flex items-center justify-center transition-all ${['job', 'build', 'build_plus'].includes(l.status) ? 'bg-primary text-white hover:bg-primary/80 cursor-pointer active:scale-95' : 'bg-slate-100 text-slate-300 cursor-default'}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => updateLead(l.id, { replied: !l.replied })} className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${l.replied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300 hover:bg-emerald-50 hover:text-emerald-400"}`}>
                      <span className="material-symbols-outlined fill-1" style={{ fontSize: '16px' }}>{l.replied ? "mark_email_read" : "mail"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="flex items-center justify-between border-t border-primary/10 bg-white px-5 py-3">
        <p className="text-xs text-slate-500">
          Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredLeads.length)} of {filteredLeads.length}
        </p>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
          </button>
          <span className="text-xs font-bold text-slate-600 px-2">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}