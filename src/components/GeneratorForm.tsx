import React, { useState } from 'react';
import { MaterialType } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface GeneratorFormProps {
  onGenerate: (topic: string, type: MaterialType) => Promise<void>;
  isGenerating: boolean;
}

export default function GeneratorForm({ onGenerate, isGenerating }: GeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [branch, setBranch] = useState('');
  const [type, setType] = useState<MaterialType>('summary');

  const [isRgpvMode, setIsRgpvMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      let fullTopic = branch ? `${branch}: ${topic.trim()}` : topic.trim();
      if (isRgpvMode) fullTopic = `[RGPV EXAM MODE] ${fullTopic}`;
      onGenerate(fullTopic, type);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Settings</label>
        <button
          type="button"
          onClick={() => setIsRgpvMode(!isRgpvMode)}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold transition-all sm:text-xs ${
            isRgpvMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40'
          }`}
        >
          <Sparkles size={12} />
          RGPV EXAM MODE
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Branch / Subject (Optional)</label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="e.g. CS, Mechanical, Engineering Physics..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Topic or Subject</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Quantum Computing, French Revolution, Photosynthesis..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Material Type</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(['summary', 'quiz', 'flashcards', 'pyq', 'roadmap'] as MaterialType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                type === t
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t === 'pyq' ? 'RGPV PYQ' : t === 'roadmap' ? 'Roadmap' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !topic.trim()}
        className="group relative w-full overflow-hidden rounded-2xl bg-emerald-500 py-4 font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Generating Detailed Content...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generate Study Material</span>
            </>
          )}
        </div>
      </button>
      
      <p className="text-center text-[10px] text-white/30 uppercase tracking-widest">
        Note: Generating high-quality, detailed content may take 10-15 seconds.
      </p>
    </form>
  );
}
