import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// RECENTLY CHANGED: The MapController now handles zooming AND automatically opening the popup!
function MapController({ selectedLead, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLead && selectedLead.lat && selectedLead.lng) {
      // 1. Smoothly fly to the location
      map.flyTo([selectedLead.lat, selectedLead.lng], 16, { animate: true, duration: 1.5 });
      
      // 2. Open the popup associated with this specific lead
      const marker = markerRefs.current[selectedLead.id];
      if (marker) {
        // Slight delay to allow the map to start moving before popping it open
        setTimeout(() => marker.openPopup(), 200);
      }
    }
  }, [selectedLead, map, markerRefs]);
  return null;
}

export default function DashboardAnalytics({ 
  leads, 
  dailyData = { goal: 10, counts: { job: 0, build_no_demo: 0, build_demo: 0 } }, 
  dataSource = "cloud",
  selectedMapLead, 
  onViewInDirectory, // RECENTLY CHANGED: Added new prop
  onOpenCalendar 
}) {
  
  // RECENTLY CHANGED: Refs to scroll the page and trigger popups programmatically
  const mapSectionRef = useRef(null);
  const markerRefs = useRef({});

  // Auto-scroll the entire page down to the map when a lead is clicked from the table
  useEffect(() => {
    if (selectedMapLead && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedMapLead]);

  const stats = useMemo(() => {
    const job = leads.filter(l => l.status === "job").length;
    const build = leads.filter(l => l.status === "build").length;
    const buildPlus = leads.filter(l => l.status === "build_plus").length;
    const skip = leads.filter(l => l.status === "none").length;
    const dismissed = leads.filter(l => l.status === "dismissed").length;
    const replied = leads.filter(l => l.replied).length;

    const free = build + buildPlus;
    const tagged = job + free;
    const total = leads.length;
    
    const unset = skip; 
    const pct = total ? Math.round((tagged / total) * 100) : 0;

    return { job, build, buildPlus, skip, dismissed, free, tagged, total, unset, pct, replied };
  }, [leads]);

  const topCategories = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);
  
  const catMax = topCategories[0] ? topCategories[0][1] : 1;
  const catColors = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d", "#43aa8b", "#4d908e", "#577590"];

  const donutPaths = useMemo(() => {
    if (!stats.total) return [];
    const polarToCartesian = (cx, cy, r, angleDeg) => {
      const rad = ((angleDeg - 90) * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const data = [
      { count: stats.job, color: "#10b981" },
      { count: stats.build, color: "#9855f6" },
      { count: stats.buildPlus, color: "#3b82f6" },
      { count: stats.skip, color: "#D3D3D3" },
      { count: stats.dismissed, color: "#ef4444" },
    ];
    
    const active = data.filter((s) => s.count > 0);
    if (!active.length) return [];
    if (active.length === 1) return [{ d: null, singleColor: active[0].color }]; 

    const gapAngle = 2, minAngle = 8;
    const totalGaps = active.length * gapAngle;
    const availableAngle = 360 - totalGaps;
    let angles = active.map((s) => (s.count / stats.total) * availableAngle);
    let totalBorrow = 0;
    
    angles = angles.map((a) => {
      if (a < minAngle) { totalBorrow += minAngle - a; return minAngle; }
      return a;
    });

    const largeTotal = angles.filter((a) => a > minAngle).reduce((s, a) => s + a, 0);
    if (largeTotal > 0 && totalBorrow > 0) {
      angles = angles.map((a) => a > minAngle ? Math.max(minAngle, a - (a / largeTotal) * totalBorrow) : a);
    }

    let currentAngle = 0;
    return active.map((seg, i) => {
      const angle = angles[i];
      const endAngle = currentAngle + angle;
      const start = polarToCartesian(80, 80, 60, currentAngle);
      const end = polarToCartesian(80, 80, 60, endAngle);
      const largeArc = angle > 180 ? 1 : 0;
      const d = `M ${start.x} ${start.y} A 60 60 0 ${largeArc} 1 ${end.x} ${end.y}`;
      currentAngle = endAngle + gapAngle;
      return { d, color: seg.color, strokeWidth: 16 };
    });
  }, [stats]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dailyData.date === todayStr;

  const todayJob = isToday ? (dailyData.counts.job || 0) : 0;
  const todayBuild = isToday ? (dailyData.counts.build_no_demo || 0) : 0;
  const todayBuildPlus = isToday ? (dailyData.counts.build_demo || 0) : 0;

  const dailyTotal = todayJob + todayBuild + todayBuildPlus;
  const dailyPct = Math.min(100, Math.round((dailyTotal / (dailyData.goal || 10)) * 100));

  const mappableLeads = useMemo(() => {
    const statusByName = {};
    leads.forEach(l => {
      if (l.status && l.status !== 'none' && l.name) {
        statusByName[l.name.toLowerCase().trim()] = l.status;
      }
    });

    const validLeads = leads.filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng));
    
    return validLeads.map(l => {
       const key = l.name ? l.name.toLowerCase().trim() : '';
       return {
           ...l,
           status: (l.status !== 'none') ? l.status : (statusByName[key] || 'none')
       };
    }).sort((a, b) => {
      const getPriority = (status) => {
        if (['job', 'build', 'build_plus'].includes(status)) return 2; 
        if (status === 'dismissed') return 1; 
        return 0; 
      };
      return getPriority(a.status) - getPriority(b.status);
    });
  }, [leads]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'job': return '#10b981'; 
      case 'build': return '#9855f6'; 
      case 'build_plus': return '#3b82f6'; 
      case 'dismissed': return '#ef4444'; 
      default: return '#94a3b8'; 
    }
  };

  return (
    <div id="view-dashboard" className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col scroll-smooth">
      <div className="mb-5 hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight">Dashboard Analytics</h1>
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{stats.total}</span> leads loaded · <span className="text-primary font-medium">from {dataSource}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide lg:normal-case lg:tracking-normal">Total</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black">{stats.total || '—'}</h3>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">ALL</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide lg:normal-case lg:tracking-normal">Tagged</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black text-emerald-600">{stats.tagged}</h3>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{stats.pct}%</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide lg:normal-case lg:tracking-normal">Job Leads</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black text-blue-600">{stats.job}</h3>
            <span className="text-blue-500 text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded-full">JOB</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide lg:normal-case lg:tracking-normal">Build</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black text-primary">{stats.free}</h3>
            <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full">BUILD</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide lg:normal-case lg:tracking-normal">Replied</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black text-emerald-600">{stats.replied}</h3>
            <span className="material-symbols-outlined fill-1 text-emerald-400" style={{ fontSize: '18px' }}>mark_email_read</span>
          </div>
        </div>
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 shadow-sm">
          <p className="text-primary text-[10px] font-bold uppercase tracking-wider">Untagged</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className="text-2xl font-black">{stats.unset || '0'}</h3>
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>hourglass_empty</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col lg:col-span-1 lg:row-span-2 order-2 lg:order-1">
          <h3 className="text-base font-bold mb-3">Tagging Progress</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="lh-wrap relative" style={{ width: '160px', height: '160px' }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="60" fill="none" stroke="#1e293b10" strokeWidth="16" />
                {donutPaths.map((p, i) => (
                  p.singleColor ? 
                    <circle key={i} cx="80" cy="80" r="60" fill="none" stroke={p.singleColor} strokeWidth="16" /> :
                    <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={p.strokeWidth} strokeLinecap="butt" />
                ))}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', pointerEvents: 'none' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{stats.pct}%</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>Tagged</span>
              </div>
            </div>

            <div className="mt-4 w-full grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#10b981' }}></span>Job</span><span className="font-black text-slate-800">{stats.job}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#9855f6' }}></span>Build</span><span className="font-black text-slate-800">{stats.build}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#3b82f6' }}></span>Build+</span><span className="font-black text-slate-800">{stats.buildPlus}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#d3d3d3' }}></span>Skip</span><span className="font-black text-slate-800">{stats.skip}</span></div>
              <div className="flex items-center justify-between col-span-2"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }}></span>Dismissed</span><span className="font-black text-slate-800">{stats.dismissed}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-5 order-1 lg:order-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:border-primary/40 transition-all group" onClick={onOpenCalendar}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold group-hover:text-primary transition-colors">Today's Outreach</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="material-symbols-outlined text-primary/40 group-hover:text-primary" style={{ fontSize: '18px' }}>calendar_month</span>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="daily-count-ring relative flex-shrink-0 flex items-center justify-center" style={{ width: '88px', height: '88px' }}>
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                  <circle cx="44" cy="44" r="36" fill="none" stroke="#9855f6" strokeWidth="7" strokeLinecap="round" strokeDasharray="226" strokeDashoffset={226 * (1 - dailyPct / 100)} style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px', transition: 'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{dailyTotal}</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#000' }}>sent</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }}></span>Job</span><span className="font-bold text-slate-700">{todayJob}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full" style={{ background: '#9855f6' }}></span>Build</span><span className="font-bold text-slate-700">{todayBuild}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }}></span>Build+</span><span className="font-bold text-slate-700">{todayBuildPlus}</span></div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: dailyPct + '%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex-1 hidden lg:block order-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Top Categories</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top 8</span>
            </div>
            <div className="space-y-3">
              {topCategories.map(([cat, count], i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{cat}</span>
                    <span className="font-bold text-slate-600 ml-2">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bar-fill h-full rounded-full" style={{ width: Math.round((count / catMax) * 100) + '%', backgroundColor: catColors[i % catColors.length] }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENTLY CHANGED: Added ref here to allow auto-scrolling */}
      <div ref={mapSectionRef} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-800">Geographic Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">{mappableLeads.length} leads with location data</p>
          </div>
          <span className="material-symbols-outlined text-slate-300">public</span>
        </div>
        
        <div className="w-full h-[300px] lg:h-[400px] relative z-0">
          {mappableLeads.length > 0 ? (
            <MapContainer 
              center={[mappableLeads[0].lat, mappableLeads[0].lng]} 
              zoom={5} 
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              <MapController selectedLead={selectedMapLead} markerRefs={markerRefs} />

              {mappableLeads.map(l => (
                <CircleMarker 
                  key={l.id} 
                  center={[l.lat, l.lng]} 
                  radius={6}
                  ref={(r) => { markerRefs.current[l.id] = r; }} // Maps the exact DOM element to this lead
                  pathOptions={{ 
                    color: getStatusColor(l.status), 
                    fillColor: getStatusColor(l.status), 
                    fillOpacity: 0.8,
                    weight: 2
                  }}
                >
                  <Popup className="rounded-lg">
                    <div className="font-display min-w-[150px]">
                      <p className="font-bold text-slate-800 text-sm mb-1">{l.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">{l.category}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: getStatusColor(l.status) }}>
                        {l.status === 'none' ? 'Untagged' : l.status.replace('_', ' ')}
                      </span>
                      
                      {/* RECENTLY CHANGED: This button jumps straight back to the table and searches for the exact lead! */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewInDirectory(l); }} 
                          className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                        >
                          View in Directory <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">location_off</span>
              <p className="text-sm font-semibold">No location data found</p>
              <p className="text-xs max-w-xs text-center mt-1">Upload a CSV containing Latitude and Longitude columns to view the map.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}