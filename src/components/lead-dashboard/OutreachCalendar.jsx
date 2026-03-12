import React, { useState, useMemo } from 'react';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OutreachCalendar({ isOpen, onClose, outreachLog = [], onDeleteEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(getLocalDateString());

  // Logic: Map outreach to date keys
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

  // Logic: Filter for Selected Day
  const selectedDayEntries = useMemo(() => {
    return outreachLog.filter(entry => getLocalDateString(new Date(entry.ts)) === selectedDayKey);
  }, [selectedDayKey, outreachLog]);

  // Logic: RECENTLY CHANGED - Monthly Performance Calculation
  const monthlyStats = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    let job = 0, build = 0, buildPlus = 0;
    
    outreachLog.forEach(e => {
      const d = new Date(e.ts);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (e.tplKey === 'job') job++;
        else if (e.tplKey === 'build_no_demo') build++;
        else if (e.tplKey === 'build_demo') buildPlus++;
      }
    });
    
    return { job, build, buildPlus, total: job + build + buildPlus };
  }, [outreachLog, currentDate]);

  // Calendar Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-end animate-in fade-in duration-300"
      onClick={(e) => e.target.id === 'backdrop' && onClose()}
      id="backdrop"
    >
      <div className="w-full max-w-md bg-white h-screen shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
        {/* Header */}
        <header className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Outreach Calendar
            </h1>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-sm font-medium text-slate-500">History Management</p>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Month Navigation */}
          <div className="px-6 pt-6 flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="px-6 mb-8">
            <div className="grid grid-cols-7 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
              {/* Empty slots for start of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-white" />
              ))}
              
              {/* Actual Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const key = getLocalDateString(dateObj);
                const isSelected = selectedDayKey === key;
                const data = dailyHistory[key];

                return (
                  <button 
                    key={key}
                    onClick={() => setSelectedDayKey(key)}
                    className={`aspect-square flex flex-col items-center justify-center gap-1 transition-colors relative
                      ${isSelected ? 'bg-blue-50 border-2 border-primary z-10' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'font-medium text-slate-600'}`}>
                      {day}
                    </span>
                    <div className="flex gap-0.5">
                      {data?.job > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                      {data?.build_no_demo > 0 && <div className="w-1 h-1 rounded-full bg-primary" />}
                      {data?.build_demo > 0 && <div className="w-1 h-1 rounded-full bg-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Activity */}
          <div className="px-6 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Activity for {new Date(selectedDayKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {selectedDayEntries.length > 0 ? selectedDayEntries.map((entry) => (
                <div key={entry.ts} className="flex items-center gap-4 p-4 rounded-lg bg-white border border-slate-100 shadow-sm group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                    ${entry.tplKey === 'job' ? 'bg-emerald-100 text-emerald-600' : 
                      entry.tplKey === 'build_no_demo' ? 'bg-primary/10 text-primary' : 
                      'bg-sky-100 text-sky-600'}`}>
                    <span className="material-symbols-outlined">
                      {entry.tplKey === 'job' ? 'work' : entry.tplKey === 'build_no_demo' ? 'rocket_launch' : 'bolt'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{entry.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                      {entry.tplKey.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <button 
                    onClick={() => onDeleteEntry(entry.ts)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              )) : (
                <p className="text-center py-6 text-slate-400 text-xs italic">No activity for this day.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer / Monthly Performance */}
        <footer className="p-6 bg-slate-50 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Global Performance ({currentDate.toLocaleString('default', { month: 'short' })})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
              <span className="block text-xl font-bold text-slate-800">{monthlyStats.total}</span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Jobs</span>
              <span className="block text-xl font-bold text-slate-800">{monthlyStats.job}</span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold text-primary uppercase">Builds</span>
              <span className="block text-xl font-bold text-slate-800">{monthlyStats.build}</span>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold text-sky-500 uppercase">Build+</span>
              <span className="block text-xl font-bold text-slate-800">{monthlyStats.buildPlus}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}