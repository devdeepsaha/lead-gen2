import React, { useState } from 'react';

export default function PersonalizeModal({ isOpen, onClose, onGenerate, lead, status }) {
  const [thought, setThought] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!thought.trim()) return;
    
    setIsGenerating(true);
    await onGenerate(thought);
    setIsGenerating(false);
    setThought('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">AI Personalization</h3>
            <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
          </div>
          
          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Lead</p>
            <p className="text-sm font-bold text-slate-700">{lead?.name} <span className="text-primary mx-1">/</span> {status}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">What did you notice about their site?</label>
            <textarea
              autoFocus
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="e.g., Their hero section is minimalist, or they have a great blog on SEO..."
              className="w-full h-24 p-4 rounded-xl border-2 border-slate-100 focus:border-primary/30 outline-none text-sm transition-all resize-none"
            />
            
            <div className="mt-6 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isGenerating || !thought.trim()}
                className="flex-[2] bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>magic_button</span>
                )}
                {isGenerating ? 'Generating...' : 'Generate & Copy'}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase text-center tracking-tighter">Powered by Gemini 3.1 Flash Lite</p>
        </div>
      </div>
    </div>
  );
}