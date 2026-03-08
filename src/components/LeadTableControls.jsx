import React, { useState } from 'react';

export default function LeadTableControls({
  isAdmin, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  catFilter, setCatFilter, sortType, setSortType, setPage, perPage, setPerPage,
  copyMode, setCopyMode, categories, totalLeads, filteredCount
}) {
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [sortDropOpen, setSortDropOpen] = useState(false);

  return (
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
          <p className="text-xs text-slate-500 mt-0.5">{filteredCount} results · tag each as Job, Build, Build+, or Skip.</p>
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
                    All Categories <span className="opacity-50 text-xs">{totalLeads}</span>
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
  );
}