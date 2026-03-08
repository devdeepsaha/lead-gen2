import React, { useState, useMemo } from 'react';

const TEMPLATES = {
  email: {
    job: {
      build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a final-year B.Tech CSE student who sits somewhere between a designer and a developer.\n\nWhile most developers focus only on code, I enjoy building experiences where visuals, interaction, and storytelling are just as important as functionality. I work on creative web projects, interactive UI concepts, and design-driven builds where aesthetics and logic meet.\n\nI'm currently exploring opportunities where I can contribute as a creative developer / designer, someone who can think visually and execute technically.\n\nPortfolio:\nhttps://devdeepsahaportfolio.vercel.app/\n\nIf this aligns with what your team is building, I'd genuinely love to connect and learn more.\n\nThanks for your time,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
    },
    build: {
      build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a creative developer focused on building modern, performance-driven web experiences.\n\nI wanted to share my portfolio in case you're currently exploring design or development support:\nhttps://devwebstudio.vercel.app/\n\nIf at any point you're considering revamping your website or improving the user experience, I'd be happy to help. I work on clean UI systems, responsive layouts, and structured builds that balance aesthetics with performance.\n\nFeel free to reach out if this sounds relevant.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
    },
    build_plus: {
      build: (name) => `Hi ${name} Team,\n\nI came across your website and felt there may be an opportunity to modernize the visual experience so it better reflects the quality of your services.\n\nTo demonstrate what I mean, I drafted a quick homepage concept tailored specifically to your brand — see the attached image. It is just a visual direction idea, but I believe it improves clarity, hierarchy, and overall perception while keeping things clean and modern.\n\nI specialize in building structured, performance-optimized websites ranging from clean static builds to React-based interactive platforms and CMS-powered systems, depending on business needs.\n\nYou can view more of my work here:\nhttps://devwebstudio.vercel.app/\n\nIf you are open to discussing a structured revamp, I would be happy to explore this further and share more detailed suggestions.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha`,
    }
  },
  whatsapp: {
    job: {
      build: (name) => `Hey ${name} team 👋 I'm Devdeep, a final-year CSE student & creative web developer.\n\nI love building aesthetic, high-performance websites where design and logic meet. Would love to connect if you're looking for someone who can think visually and execute technically!\n\nCheck out my work: https://devdeepsahaportfolio.vercel.app/\n\nLet me know if you're open to a quick chat! 🚀`
    },
    build: {
      build: (name) => `Hey ${name} team! 👋 I'm Devdeep, a freelance web developer.\n\nI help businesses build super clean, fast, and modern websites. I'd love to help out if you're ever looking to upgrade your digital presence or improve your user experience.\n\nCheck out my work here: https://devwebstudio.vercel.app/\n\nLet's connect! 🚀`
    },
    build_plus: {
      build: (name) => `Hey ${name} team 👋 I checked out your site and noticed a huge opportunity to modernize the design and user experience!\n\nI actually created a quick homepage concept for you to show what I mean (see attached image 📎). I specialize in high-performance web revamps that look clean and modern.\n\nTake a look at my portfolio: https://devwebstudio.vercel.app/\n\nWould love to chat if you're open to upgrading your site! 🚀`
    }
  }
};

export default function LeadTable({ 
  leads = [], 
  isAdmin = false, 
  setLeads, 
  searchQuery = '', 
  setSearchQuery, 
  dailyData, 
  setDailyData,
  outreachLog = [], 
  setOutreachLog    
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [copyMode, setCopyMode] = useState('email'); 
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
        const q = String(searchQuery).toLowerCase();
        const n = String(l.name || '').toLowerCase();
        const p = String(l.phone || '').toLowerCase();
        const e = String(l.email || '').toLowerCase();
        const c = String(l.category || '').toLowerCase();
        
        if (!n.includes(q) && !p.includes(q) && !e.includes(q) && !c.includes(q)) return false;
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

  // RECENTLY CHANGED: Maps directly over the leads array and passes it instantly, preventing stale closures
  const updateLead = (id, updates) => {
    if (!isAdmin && updates.status) return showToast("🔒 Unlock Admin Mode to tag leads.");
    if (!isAdmin && updates.replied !== undefined) return showToast("🔒 Unlock Admin Mode to change reply status.");
    
    const newLeads = leads.map(l => l.id === id ? { ...l, ...updates } : l);
    setLeads(newLeads);
  };

  const handleStatusClick = (id, newStatus) => {
    if (!isAdmin) return showToast("🔒 Unlock Admin Mode to tag leads.");
    const lead = leads.find(l => l.id === id);
    const finalStatus = lead.status === newStatus ? 'none' : newStatus;
    updateLead(id, { status: finalStatus });
  };

  const handleCopyTemplate = (lead) => {
    const tpl = TEMPLATES[copyMode][lead.status];
    if (!tpl) return showToast("Tag lead as Job, Build, or Build+ first");

    const msg = tpl.build(lead.name);

    const logOutreach = () => {
      showToast(`📋 Copied ${copyMode} format for ${lead.name}`);
      if (!isAdmin) return;

      const actualTplKey = lead.status === 'build' ? 'build_no_demo' : lead.status === 'build_plus' ? 'build_demo' : lead.status;
      const newEntry = { id: lead.id, name: lead.name, category: lead.category || "", tplKey: actualTplKey, ts: Date.now() };

      setOutreachLog([newEntry, ...outreachLog]);

      const today = new Date().toISOString().split('T')[0];
      const newCounts = { ...dailyData.counts };
      if (newCounts[actualTplKey] !== undefined) newCounts[actualTplKey]++;
      setDailyData({ ...dailyData, date: today, counts: newCounts });
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(logOutreach).catch(logOutreach);
    } else {
      logOutreach();
    }
  };

  const handleEmailCopy = (email) => {
    navigator.clipboard.writeText(email).then(() => showToast("📋 Copied " + email));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background-light md:bg-white">
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-xl whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* ── HEADER CONTROLS ── */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-white md:border-b border-primary/10 sticky top-0 z-10 shadow-sm md:shadow-none">
        <div className="md:hidden flex items-stretch rounded-xl shadow-sm h-11 mb-3">
          <div className="flex items-center justify-center pl-4 bg-white rounded-l-xl border border-r-0 border-primary/15">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>search</span>
          </div>
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="flex-1 bg-white border border-l-0 border-primary/15 rounded-r-xl px-3 text-sm outline-none focus:border-primary/40 placeholder:text-slate-400" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Lead Directory {!isAdmin && <span className="material-symbols-outlined text-slate-300 text-lg">lock</span>}
              </h1>
              <div className="flex bg-slate-100 rounded-lg p-1 ml-2">
                <button className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${copyMode === 'email' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setCopyMode('email')}>Email</button>
                <button className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${copyMode === 'whatsapp' ? 'bg-[#25D366] shadow text-white' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setCopyMode('whatsapp')}>WhatsApp</button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{filteredLeads.length} results · tag each as Job, Build, Build+, or Skip.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="md:hidden flex bg-slate-100 rounded-lg p-1 mb-1">
              <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${copyMode === 'email' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`} onClick={() => setCopyMode('email')}>Email</button>
              <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${copyMode === 'whatsapp' ? 'bg-[#25D366] shadow-sm text-white' : 'text-slate-400'}`} onClick={() => setCopyMode('whatsapp')}>WhatsApp</button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-0 md:border md:border-primary/15 md:rounded-lg">
              {['all', 'job', 'build', 'build_plus', 'none', 'dismissed', 'replied'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`flex-shrink-0 h-8 md:h-auto px-4 md:px-3 md:py-1.5 text-xs font-bold transition-all rounded-full md:rounded-none md:border-r md:last:border-r-0 border-primary/15 ${
                    statusFilter === s 
                      ? 'bg-primary text-white border-transparent md:border-primary/15' 
                      : 'text-slate-500 bg-white border border-primary/15 md:border-transparent hover:bg-primary/5'
                  }`}
                >
                  {s === 'none' ? 'Unset' : s === 'build_plus' ? 'Build+' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-none">
                <button onClick={() => { setCatDropOpen(!catDropOpen); setSortDropOpen(false); }} className="w-full flex items-center justify-between md:justify-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                  <span className="material-symbols-outlined text-primary md:hidden" style={{ fontSize: '15px' }}>filter_list</span>
                  <span>{catFilter === 'all' ? 'All Categories' : (catFilter.length > 12 ? catFilter.slice(0,12)+'...' : catFilter)}</span>
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
                </button>
                {catDropOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-80 overflow-y-auto bg-white border border-primary/15 rounded-xl shadow-lg">
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
              <div className="relative flex-1 md:flex-none">
                <button onClick={() => { setSortDropOpen(!sortDropOpen); setCatDropOpen(false); }} className="w-full flex items-center justify-between md:justify-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                  <span className="hidden md:inline material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>sort</span>
                  <span>Sort: {sortType === 'default' ? 'Default' : sortType.split('_')[0].toUpperCase()}</span>
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
                </button>
                {sortDropOpen && (
                  <div className="absolute top-full right-0 mt-1 z-50 w-48 bg-white border border-primary/15 rounded-xl shadow-lg flex flex-col p-1 text-sm">
                    {[{ id: 'default', label: 'Default Order' }, { id: 'name_asc', label: 'Name A → Z' }, { id: 'rating_desc', label: 'Highest Rated' }, { id: 'reviews_desc', label: 'Most Reviews' }, { id: 'cat_name', label: 'Category → Name' }].map(opt => (
                      <button key={opt.id} onClick={() => { setSortType(opt.id); setSortDropOpen(false); setPage(1); }} className={`text-left px-3 py-2 rounded-lg ${sortType === opt.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>{opt.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="h-8 px-2 rounded-lg border border-primary/15 text-xs font-semibold text-slate-600 bg-white outline-none hidden md:block">
                <option value="10">10/page</option><option value="15">15/page</option><option value="25">25/page</option><option value="50">50/page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. DESKTOP VIEW ── */}
      <div className="hidden md:block flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-sm" style={{ minWidth: '1000px' }}>
          <thead className="sticky top-0 z-10 bg-primary/5 border-b border-primary/10 text-slate-500">
            <tr>
              {/* RECENTLY CHANGED: Cleanly mapping out the checkboxes without using the stale closure */}
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-primary w-3.5 h-3.5"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const idsOnPage = paginatedLeads.map(l => l.id);
                    const newLeads = leads.map(l => idsOnPage.includes(l.id) ? { ...l, checked } : l);
                    setLeads(newLeads);
                  }}
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Business & Website</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Rating</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Reviews</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Copy</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Replied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {paginatedLeads.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-16 text-slate-400">No leads match your filters.</td></tr>
            ) : paginatedLeads.map((l) => {
              const urlObj = l.website ? new URL(l.website.startsWith('http') ? l.website : `https://${l.website}`).hostname.replace('www.', '') : null;
              return (
                <tr key={l.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={l.checked || false} onChange={(e) => updateLead(l.id, { checked: e.target.checked })} className="rounded border-slate-300 text-primary w-3.5 h-3.5"/>
                  </td>
                  <td className="px-4 py-4 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm truncate max-w-[220px] block">{l.name}</span>
                      {urlObj && <a href={l.website} target="_blank" rel="noreferrer" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span></a>}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[220px]">{urlObj ? <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-primary">{urlObj}</a> : <span className="text-slate-300">no website</span>}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-wider whitespace-nowrap max-w-[130px] overflow-hidden text-ellipsis border border-primary/10">{l.category}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center justify-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-amber-700 font-bold text-xs">
                      <span className="material-symbols-outlined fill-1 text-amber-400" style={{ fontSize: '13px' }}>star</span>{l.rating || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-medium text-slate-500">{l.reviews ? Number(l.reviews).toLocaleString() : "—"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-slate-600 font-mono">{l.phone || "—"}</span>
                      {l.email && <span className="text-[10px] text-primary truncate max-w-[140px] cursor-pointer hover:underline font-medium" onClick={() => handleEmailCopy(l.email)} title="Click to copy">{l.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`tbl-seg mx-auto w-fit flex border border-slate-200 rounded-lg overflow-hidden ${!isAdmin ? 'opacity-40 grayscale' : ''}`}>
                      <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'job')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'job' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Job</button>
                      <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'build')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'build' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Build</button>
                      <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'build_plus')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'build_plus' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Build+</button>
                      <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'none')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'none' ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Skip</button>
                      <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'dismissed')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'dismissed' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-50'}`}>✕</button>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <button disabled={!['job', 'build', 'build_plus'].includes(l.status)} onClick={() => handleCopyTemplate(l)} className={`flex-shrink-0 w-7 h-7 rounded-md inline-flex items-center justify-center transition-all ${!['job', 'build', 'build_plus'].includes(l.status) ? 'bg-slate-100 text-slate-300 cursor-default' : copyMode === 'whatsapp' ? 'bg-[#25D366] text-white hover:bg-[#20bd5a] cursor-pointer active:scale-95' : 'bg-primary text-white hover:bg-primary/80 cursor-pointer active:scale-95'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button disabled={!isAdmin} onClick={() => updateLead(l.id, { replied: !l.replied })} className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${l.replied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300 hover:bg-emerald-50 hover:text-emerald-400"}`}>
                      <span className="material-symbols-outlined fill-1" style={{ fontSize: '16px' }}>{l.replied ? "mark_email_read" : "mail"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 2. MOBILE VIEW (Card Format) ── */}
      <div className="md:hidden flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {paginatedLeads.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined block text-4xl mb-2">search_off</span>
            No leads found.
          </div>
        ) : paginatedLeads.map((l) => {
          const urlObj = l.website ? new URL(l.website.startsWith('http') ? l.website : `https://${l.website}`).hostname.replace('www.', '') : null;
          return (
            <div key={l.id} className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">{l.name}</h3>
                    {urlObj ? (
                      <a className="text-primary text-xs font-medium flex items-center gap-0.5" href={l.website} target="_blank" rel="noreferrer">
                        <span className="truncate">{urlObj}</span><span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">No website</span>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {l.phone && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '13px' }}>phone</span>{l.phone}
                        </span>
                      )}
                      {l.email && (
                        <span className="text-[11px] text-primary cursor-pointer border-b border-dashed border-primary/40 hover:text-purple-700 hover:border-purple-700 transition-colors" onClick={() => handleEmailCopy(l.email)}>
                          {l.email}
                        </span>
                      )}
                    </div>
                    
                    {l.reviews && (
                      <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>reviews</span>
                        {Number(l.reviews).toLocaleString()} Reviews
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {l.rating && (
                      <div className="flex items-center gap-1 text-slate-700 text-[11px] font-bold">
                        <span className="material-symbols-outlined fill-1 text-amber-400" style={{ fontSize: '14px' }}>star</span>{l.rating}
                      </div>
                    )}
                    <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">{l.category}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 px-3 py-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`flex flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm ${!isAdmin ? 'opacity-40 grayscale' : ''}`}>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'job')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'job' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Job</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'build')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'build' ? 'bg-primary text-white' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Build</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'build_plus')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'build_plus' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 border-r border-slate-100'}`}>B+</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'none')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'none' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Skip</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'dismissed')} className={`w-8 py-2 text-[10px] font-black uppercase transition-colors flex items-center justify-center ${l.status === 'dismissed' ? 'bg-red-500 text-white' : 'bg-white text-slate-400'}`}>✕</button>
                  </div>
                  <button disabled={!['job', 'build', 'build_plus'].includes(l.status)} onClick={() => handleCopyTemplate(l)} className={`flex-shrink-0 w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all ${!['job', 'build', 'build_plus'].includes(l.status) ? 'bg-slate-200 text-slate-400' : copyMode === 'whatsapp' ? 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/20' : 'bg-primary text-white shadow-md shadow-primary/20'}`}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span></button>
                  <button disabled={!isAdmin} onClick={() => updateLead(l.id, { replied: !l.replied })} className={`flex-shrink-0 w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all ${l.replied ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-300'}`}><span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>{l.replied ? "mark_email_read" : "mail"}</span></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Pagination */}
      <div className="hidden md:flex items-center justify-between border-t border-primary/10 bg-white px-5 py-3">
        <p className="text-xs text-slate-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredLeads.length)} of {filteredLeads.length}</p>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span></button>
          <span className="text-xs font-bold text-slate-600 px-2">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span></button>
        </div>
      </div>
      
      {/* Mobile Pagination */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-t border-primary/10">
        <p className="text-xs text-slate-500">{filteredLeads.length > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredLeads.length)} of ${filteredLeads.length}` : '0 results'}</p>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-7 h-7 flex items-center justify-center rounded border border-primary/15 text-slate-500 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span></button>
          <span className="text-xs font-bold text-slate-600 px-1">{page}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-7 h-7 flex items-center justify-center rounded border border-primary/15 text-slate-500 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span></button>
        </div>
      </div>
    </div>
  );
}