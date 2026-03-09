import React, { useState, useMemo } from 'react';

// RECENTLY CHANGED: This helper forces the date to strictly use your local timezone, completely ignoring UTC!
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
      // RECENTLY CHANGED: Strictly converting the timestamp to a local date key
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

  // RECENTLY CHANGED: Calculates "Today" purely based on your local browser clock
  const localTodayStr = getLocalDateString(new Date());

  return (
    <div id="cal-modal-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end" onClick={(e) => e.target.id === 'cal-modal-backdrop' && onClose()}>
      <div id="cal-modal" className="bg-white h-full max-w-md w-full shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Outreach Calendar</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage your outreach history</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-base font-black text-slate-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`prev-${i}`} className="h-10 rounded-lg opacity-0" />)}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const key = getLocalDateString(loopDate);
              const data = dailyHistory[key];
              const isToday = key === localTodayStr;

              return (
                <div 
                  key={key} 
                  className={`relative h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border ${isToday ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-slate-50'} ${selectedDayKey === key ? 'ring-2 ring-primary border-transparent shadow-sm' : ''}`}
                  onClick={() => setSelectedDayKey(key)}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-slate-700'}`}>{day}</span>
                  {data && (
                    <div className="flex gap-0.5 mt-0.5 absolute bottom-1.5">
                      {data.job > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />}
                      {data.build_no_demo > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#9855f6' }} />}
                      {data.build_demo > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDayKey && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800">{new Date(selectedDayKey).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} Instances</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{selectedDayEntries.length} sent</span>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {selectedDayEntries.length > 0 ? selectedDayEntries.map((entry) => (
                  <div key={entry.ts} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex flex-col min-w-0 mr-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{entry.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${entry.tplKey === 'job' ? 'text-emerald-500' : entry.tplKey === 'build_no_demo' ? 'text-primary' : 'text-blue-500'}`}>
                        {entry.tplKey.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDeleteEntry(entry.ts)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete log entry"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                    <span className="material-symbols-outlined mb-2 opacity-50 text-3xl">event_busy</span>
                    <p className="text-xs font-medium">No outreach logged for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-4 border-t border-slate-100 flex-shrink-0">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">All-Time Statistics</p>
            <div className="flex justify-between px-2">
              <div className="text-center"><span className="block text-xl font-black text-slate-800 leading-none mb-1">{allTime.total}</span><span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total</span></div>
              <div className="text-center"><span className="block text-xl font-black text-emerald-500 leading-none mb-1">{allTime.job}</span><span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Job</span></div>
              <div className="text-center"><span className="block text-xl font-black text-primary leading-none mb-1">{allTime.build}</span><span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Build</span></div>
              <div className="text-center"><span className="block text-xl font-black text-blue-500 leading-none mb-1">{allTime.buildPlus}</span><span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Build+</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}