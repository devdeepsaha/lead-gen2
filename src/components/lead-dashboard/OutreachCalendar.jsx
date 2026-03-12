import React, { useState, useMemo } from 'react';

// This helper forces the date to strictly use your local timezone
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OutreachCalendar({ isOpen, onClose, outreachLog = [], onDeleteEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  // Maps the outreach log into a date-based object for the calendar dots
  const dailyHistory = useMemo(() => {
    const history = {};
    outreachLog.forEach(entry => {
      const key = getLocalDateString(new Date(entry.ts));
      if (!history[key]) history[key] = { job: 0, build_no_demo: 0, build_demo: 0 };
      
      if (entry.tplKey === 'job') history[key].job++;
      else if (entry.tplKey === 'build_no_demo') history[key].build_no_demo++;
      else if (entry.tplKey === 'build_demo') history[key].build_demo++;
    });
    return history;
  }, [outreachLog]);

  // Filters individual entries for the specific day you click on
  const selectedDayEntries = useMemo(() => {
    if (!selectedDayKey) return [];
    return outreachLog.filter(entry => getLocalDateString(new Date(entry.ts)) === selectedDayKey);
  }, [selectedDayKey, outreachLog]);

  const allTime = useMemo(() => {
    let tJob = 0, tBuild = 0, tBuildPlus = 0;
    outreachLog.forEach(e => {
      if (e.tplKey === 'job') tJob++;
      else if (e.tplKey === 'build_no_demo') tBuild++;
      else if (e.tplKey === 'build_demo') tBuildPlus++;
    });
    return { job: tJob, build: tBuild, buildPlus: tBuildPlus, total: outreachLog.length };
  }, [outreachLog]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDayKey(null);
  };

  if (!isOpen) return null;

  const localTodayStr = getLocalDateString(new Date());

  return (
    <div 
      id="cal-modal-backdrop" 
      // RECENTLY CHANGED: Set z-[9999] to ensure it is above all layout elements
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex justify-end transition-all" 
      onClick={(e) => e.target.id === 'cal-modal-backdrop' && onClose()}
    >
      <div 
        id="cal-modal" 
        // RECENTLY CHANGED: Added slide-in animation and high-depth shadow
        className="bg-white h-full max-w-md w-full shadow-[-10px_0_50px_-15px_rgba(0,0,0,0.3)] flex flex-col animate-slide-in-right" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Outreach Calendar</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">History Management</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-primary transition-all">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-primary transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`prev-${i}`} className="h-11" />)}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const key = getLocalDateString(loopDate);
              const data = dailyHistory[key];
              const isToday = key === localTodayStr;

              return (
                <div 
                  key={key} 
                  className={`relative h-11 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-2 
                    ${isToday ? 'border-primary/20 bg-primary/5' : 'border-transparent hover:bg-slate-50'} 
                    ${selectedDayKey === key ? 'border-primary bg-primary/5 shadow-sm' : ''}`}
                  onClick={() => setSelectedDayKey(key)}
                >
                  <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-slate-700'}`}>{day}</span>
                  {data && (
                    <div className="flex gap-0.5 mt-0.5 absolute bottom-1.5">
                      {data.job > 0 && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                      {data.build_no_demo > 0 && <span className="w-1 h-1 rounded-full bg-primary" />}
                      {data.build_demo > 0 && <span className="w-1 h-1 rounded-full bg-blue-500" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDayKey && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {new Date(selectedDayKey).toLocaleDateString('default', { month: 'short', day: 'numeric' })} Activity
                </h3>
                <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                  {selectedDayEntries.length} Sent
                </span>
              </div>
              
              <div className="space-y-2">
                {selectedDayEntries.length > 0 ? selectedDayEntries.map((entry) => (
                  <div key={entry.ts} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{entry.name}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 
                        ${entry.tplKey === 'job' ? 'text-emerald-500' : entry.tplKey === 'build_no_demo' ? 'text-primary' : 'text-blue-500'}`}>
                        {entry.tplKey.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDeleteEntry(entry.ts)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <span className="material-symbols-outlined !text-[18px]">delete</span>
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Empty Log</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Global Performance</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center border-r border-slate-100 last:border-0">
                <span className="block text-lg font-black text-slate-900">{allTime.total}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400">Total</span>
              </div>
              <div className="text-center border-r border-slate-100 last:border-0">
                <span className="block text-lg font-black text-emerald-500">{allTime.job}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400">Job</span>
              </div>
              <div className="text-center border-r border-slate-100 last:border-0">
                <span className="block text-lg font-black text-primary">{allTime.build}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400">Build</span>
              </div>
              <div className="text-center">
                <span className="block text-lg font-black text-blue-500">{allTime.buildPlus}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400">B+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
   );
}