import React, { useState, useMemo } from 'react';
import LeadTableControls from './LeadTableControls';
import LeadTableDesktop from './LeadTableDesktop';
import LeadTableMobile from './LeadTableMobile';
import LeadTablePagination from './LeadTablePagination';

const TEMPLATES = {
  email: {
    job: { build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a final-year B.Tech CSE student who sits somewhere between a designer and a developer.\n\nWhile most developers focus only on code, I enjoy building experiences where visuals, interaction, and storytelling are just as important as functionality. I work on creative web projects, interactive UI concepts, and design-driven builds where aesthetics and logic meet.\n\nI'm currently exploring opportunities where I can contribute as a creative developer / designer, someone who can think visually and execute technically.\n\nPortfolio:\nhttps://devdeepsahaportfolio.vercel.app/\n\nIf this aligns with what your team is building, I'd genuinely love to connect and learn more.\n\nThanks for your time,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha` },
    build: { build: (name) => `Hi ${name} Team,\n\nI'm Devdeep, a creative developer focused on building modern, performance-driven web experiences.\n\nI wanted to share my portfolio in case you're currently exploring design or development support:\nhttps://devwebstudio.vercel.app/\n\nIf at any point you're considering revamping your website or improving the user experience, I'd be happy to help. I work on clean UI systems, responsive layouts, and structured builds that balance aesthetics with performance.\n\nFeel free to reach out if this sounds relevant.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha` },
    build_plus: { build: (name) => `Hi ${name} Team,\n\nI came across your website and felt there may be an opportunity to modernize the visual experience so it better reflects the quality of your services.\n\nTo demonstrate what I mean, I drafted a quick homepage concept tailored specifically to your brand — see the attached image. It is just a visual direction idea, but I believe it improves clarity, hierarchy, and overall perception while keeping things clean and modern.\n\nI specialize in building structured, performance-optimized websites ranging from clean static builds to React-based interactive platforms and CMS-powered systems, depending on business needs.\n\nYou can view more of my work here:\nhttps://devwebstudio.vercel.app/\n\nIf you are open to discussing a structured revamp, I would be happy to explore this further and share more detailed suggestions.\n\nBest regards,\nDevdeep Saha\ndevdeep120205@gmail.com\nInstagram: @devdeepsaha` }
  },
  whatsapp: {
  job: {
    build: (name) => 
`Hi ${name} team 👋

My name is Devdeep. I'm a web developer who enjoys building design-focused websites and interactive web experiences.

I recently came across your work and thought I'd reach out to see if you're open to collaborating with freelance developers.

Here's a quick look at some of my work:
https://devdeepsahaportfolio.vercel.app/

Would love to connect if that sounds relevant 🙂`
  },

  build: {
    build: (name) => 
`Hi ${name} 👋

I was just checking out your business online and noticed you don't seem to have a dedicated website yet (or it could use a small refresh).

I'm Devdeep, a freelance developer who helps businesses build clean, modern websites that load fast and look professional.

If you're ever considering improving your online presence, I'd be happy to help.

You can see some of my work here:
https://devwebstudio.vercel.app/

No pressure at all — just thought I'd reach out 🙂`
  },

  build_plus: {
    build: (name) => 
`Hi ${name} 👋

I came across your website and had a few ideas on how the homepage could look more modern and structured.

Just for fun, I actually drafted a quick visual concept for how it could look (I'll attach it here).

I'm a freelance web developer who focuses on clean design and fast, performance-optimized websites.

If you're curious to explore the idea further, feel free to check my work:
https://devwebstudio.vercel.app/

Happy to share a few suggestions if you're interested 🙂`
  }
}
};

export default function LeadTable({ 
  leads = [], isAdmin = false, setLeads, searchQuery = '', setSearchQuery, 
  dailyData, setDailyData, outreachLog = [], setOutreachLog    
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [copyMode, setCopyMode] = useState('email'); 
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

      <LeadTableControls 
        isAdmin={isAdmin}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        catFilter={catFilter} setCatFilter={setCatFilter}
        sortType={sortType} setSortType={setSortType}
        setPage={setPage}
        perPage={perPage} setPerPage={setPerPage}
        copyMode={copyMode} setCopyMode={setCopyMode}
        categories={categories}
        totalLeads={leads.length}
        filteredCount={filteredLeads.length}
      />

      <LeadTableDesktop 
        leads={leads} setLeads={setLeads} paginatedLeads={paginatedLeads}
        isAdmin={isAdmin} copyMode={copyMode}
        handleStatusClick={handleStatusClick} handleCopyTemplate={handleCopyTemplate}
        handleEmailCopy={handleEmailCopy} updateLead={updateLead}
      />

      <LeadTableMobile 
        paginatedLeads={paginatedLeads} isAdmin={isAdmin} copyMode={copyMode}
        handleStatusClick={handleStatusClick} handleCopyTemplate={handleCopyTemplate}
        handleEmailCopy={handleEmailCopy} updateLead={updateLead}
      />

      <LeadTablePagination 
        safePage={safePage} totalPages={totalPages} setPage={setPage}
        filteredCount={filteredLeads.length} perPage={perPage}
      />
    </div>
  );
}