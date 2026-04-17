import React from 'react';
import { StudyMaterial } from '../types';
import { FileText, HelpCircle, Layers, Trash2, ChevronRight, GraduationCap, Map } from 'lucide-react';
import { motion } from 'motion/react';

interface MaterialCardProps {
  material: StudyMaterial;
  onSelect: (material: StudyMaterial) => void;
  onDelete: (id: string) => void;
}

export default function MaterialCard({ material, onSelect, onDelete }: MaterialCardProps) {
  const getIcon = () => {
    switch (material.type) {
      case 'summary': return FileText;
      case 'quiz': return HelpCircle;
      case 'flashcards': return Layers;
      case 'pyq': return GraduationCap;
      case 'roadmap': return Map;
      default: return FileText;
    }
  };

  const getColor = () => {
    switch (material.type) {
      case 'summary': return 'bg-blue-500';
      case 'quiz': return 'bg-purple-500';
      case 'flashcards': return 'bg-orange-500';
      case 'pyq': return 'bg-emerald-500';
      case 'roadmap': return 'bg-rose-500';
      default: return 'bg-zinc-500';
    }
  };

  const Icon = getIcon();
  const colorClass = getColor();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-black/50"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass} shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (material.id) onDelete(material.id);
          }}
          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1">
        <h3 className="mb-1 text-lg font-semibold text-white line-clamp-1">{material.topic}</h3>
        <p className="text-sm capitalize text-white/50">{material.type}</p>
      </div>

      <button
        onClick={() => onSelect(material)}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-all group-hover:bg-white/10"
      >
        Open Material
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
}
