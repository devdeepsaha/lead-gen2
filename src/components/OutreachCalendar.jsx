import React, { useState, useMemo } from 'react';

export default function OutreachCalendar({ isOpen, onClose, outreachLog = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  // CHANGED: Map the outreach log array into a date-based object for the calendar
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

  // All-time totals logic
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
      <div id="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Outreach Calendar</h2>
            <p className="text-xs text-slate-400 mt-0.5">Full history of all messages sent</p>
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
                    <>
                      <span className="cal-total-badge">{(data.job || 0) + (data.build_no_demo || 0) + (data.build_demo || 0)}</span>
                      <div className="cal-dot-row">
                        {data.job > 0 && <span className="cal-dot" style={{ background: '#10b981' }} />}
                        {data.build_no_demo > 0 && <span className="cal-dot" style={{ background: '#9855f6' }} />}
                        {data.build_demo > 0 && <span className="cal-dot" style={{ background: '#3b82f6' }} />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDayKey && dailyHistory[selectedDayKey] && (
            <div id="cal-detail" className="mt-4">
              <h3 className="text-sm font-black text-slate-800 mb-3">{selectedDayKey} Breakdown</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xl font-black text-emerald-600">{dailyHistory[selectedDayKey].job}</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Job</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-primary/5 rounded-lg">
                  <span className="text-xl font-black text-primary">{dailyHistory[selectedDayKey].build_no_demo}</span>
                  <span className="text-[10px] font-bold text-primary uppercase">Build</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-xl font-black text-blue-600">{dailyHistory[selectedDayKey].build_demo}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase">Build+</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">All-Time Totals</p>
            <div className="flex gap-6">
              <div><span className="block text-lg font-black text-slate-800">{allTime.total}</span><span className="text-[10px] text-slate-400 font-bold">Total</span></div>
              <div><span className="block text-lg font-black text-emerald-500">{allTime.job}</span><span className="text-[10px] text-slate-400 font-bold">Job</span></div>
              <div><span className="block text-lg font-black text-primary">{allTime.build}</span><span className="text-[10px] text-slate-400 font-bold">Build</span></div>
              <div><span className="block text-lg font-black text-blue-500">{allTime.buildPlus}</span><span className="text-[10px] text-slate-400 font-bold">Build+</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}