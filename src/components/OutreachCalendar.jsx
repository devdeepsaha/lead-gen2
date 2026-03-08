import React, { useState, useMemo } from 'react';

// RECENTLY CHANGED: Added onDeleteEntry to props to allow removing accidental instances
export default function OutreachCalendar({ isOpen, onClose, outreachLog = [], onDeleteEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  // Maps the outreach log into a date-based object for the calendar dots
  const dailyHistory = useMemo(() => {
    const history = {};
    outreachLog.forEach(entry => {
      const date = new Date(entry.ts);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    return outreachLog.filter(entry => {
      const date = new Date(entry.ts);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return key === selectedDayKey;
    });
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

  return (
    <div id="cal-modal-backdrop" className="open" onClick={(e) => e.target.id === 'cal-modal-backdrop' && onClose()}>
      <div id="cal-modal" className="max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Outreach Calendar</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage your outreach history</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-base font-black text-slate-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-bold text-slate-400 uppercase">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`prev-${i}`} className="cal-day other-month" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data = dailyHistory[key];
              const isToday = key === new Date().toISOString().split('T')[0];

              return (
                <div 
                  key={key} 
                  className={`cal-day ${data ? 'has-data' : ''} ${isToday ? 'is-today' : ''} ${selectedDayKey === key ? 'selected' : ''}`}
                  onClick={() => data && setSelectedDayKey(key)}
                >
                  <span className="cal-day-num">{day}</span>
                  {data && (
                    <div className="cal-dot-row">
                      {data.job > 0 && <span className="cal-dot" style={{ background: '#10b981' }} />}
                      {data.build_no_demo > 0 && <span className="cal-dot" style={{ background: '#9855f6' }} />}
                      {data.build_demo > 0 && <span className="cal-dot" style={{ background: '#3b82f6' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDayKey && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-black text-slate-800 mb-3">{selectedDayKey} Instances</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedDayEntries.length > 0 ? selectedDayEntries.map((entry) => (
                  <div key={entry.ts} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{entry.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{entry.tplKey.replace(/_/g, ' ')}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteEntry(entry.ts)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                )) : (
                  <p className="text-center text-xs text-slate-400 py-4">No outreach logged for this day.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 mt-auto">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">All-Time Statistics</p>
            <div className="flex justify-between">
              <div className="text-center"><span className="block text-lg font-black text-slate-800">{allTime.total}</span><span className="text-[10px] text-slate-400 font-bold">Total</span></div>
              <div className="text-center"><span className="block text-lg font-black text-emerald-500">{allTime.job}</span><span className="text-[10px] text-slate-400 font-bold">Job</span></div>
              <div className="text-center"><span className="block text-lg font-black text-primary">{allTime.build}</span><span className="text-[10px] text-slate-400 font-bold">Build</span></div>
              <div className="text-center"><span className="block text-lg font-black text-blue-500">{allTime.buildPlus}</span><span className="text-[10px] text-slate-400 font-bold">Build+</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}