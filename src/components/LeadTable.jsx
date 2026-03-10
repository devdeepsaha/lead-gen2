import React, { useState, useMemo } from 'react';
import LeadTableControls from './LeadTableControls';
import LeadTableDesktop from './LeadTableDesktop';
import LeadTableMobile from './LeadTableMobile';
import LeadTablePagination from './LeadTablePagination';
import { TEMPLATES } from '../data/templates';

// RECENTLY CHANGED: Local time helper added here too
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeadTable({ 
  leads = [], isAdmin = false, setLeads, 
  dailyData, setDailyData, outreachLog = [], setOutreachLog,
  
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  catFilter, setCatFilter,
  sortType, setSortType,
  page, setPage,
  perPage, setPerPage,
  copyMode, setCopyMode,
  rangeFilters, setRangeFilters,

  onLocate 
}) {
  
  const [toastMsg, setToastMsg] = useState(null);

  const MAX_REVIEWS_SLIDER = 5000;

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

      const r = l.rating || 0;
      const rev = l.reviews || 0;
      if (r < rangeFilters.ratingMin || r > rangeFilters.ratingMax) return false;
      if (rev < rangeFilters.reviewsMin) return false;
      if (rangeFilters.reviewsMax < MAX_REVIEWS_SLIDER && rev > rangeFilters.reviewsMax) return false;
      
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
  }, [leads, statusFilter, catFilter, sortType, searchQuery, rangeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / perPage));
  const safePage = Math.min(page, totalPages) || 1;
  const paginatedLeads = filteredLeads.slice((safePage - 1) * perPage, safePage * perPage);

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

      // RECENTLY CHANGED: Generates "today" string using local IST time instead of UTC to fix the rollover bug
      const today = getLocalDateString();
      let newCounts = dailyData.date === today ? { ...dailyData.counts } : { job: 0, build_no_demo: 0, build_demo: 0 };
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

  // RECENTLY CHANGED: Added phone copy handler to match email copy behavior
  const handlePhoneCopy = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone).then(() => showToast("📞 Copied phone: " + phone));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background-light md:bg-white">
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-xl whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      <LeadTableControls 
        isAdmin={isAdmin}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        catFilter={catFilter} setCatFilter={setCatFilter}
        sortType={sortType} setSortType={setSortType}
        rangeFilters={rangeFilters} setRangeFilters={setRangeFilters}
        setPage={setPage}
        perPage={perPage} setPerPage={setPerPage}
        copyMode={copyMode} setCopyMode={setCopyMode}
        categories={categories}
        totalLeads={leads.length}
        filteredCount={filteredLeads.length}
      />

      {/* RECENTLY CHANGED: Passed handlePhoneCopy down */}
      <LeadTableDesktop 
        leads={leads} setLeads={setLeads} paginatedLeads={paginatedLeads}
        isAdmin={isAdmin} copyMode={copyMode}
        handleStatusClick={handleStatusClick} handleCopyTemplate={handleCopyTemplate}
        handleEmailCopy={handleEmailCopy} handlePhoneCopy={handlePhoneCopy} 
        updateLead={updateLead}
        onLocate={onLocate} 
      />

      {/* RECENTLY CHANGED: Passed handlePhoneCopy down */}
      <LeadTableMobile 
        paginatedLeads={paginatedLeads} isAdmin={isAdmin} copyMode={copyMode}
        handleStatusClick={handleStatusClick} handleCopyTemplate={handleCopyTemplate}
        handleEmailCopy={handleEmailCopy} handlePhoneCopy={handlePhoneCopy}
        updateLead={updateLead}
        onLocate={onLocate} 
      />

      <LeadTablePagination 
        safePage={safePage} totalPages={totalPages} setPage={setPage}
        filteredCount={filteredLeads.length} perPage={perPage}
      />
    </div>
  );
}