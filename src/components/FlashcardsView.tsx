import React, { useState } from 'react';
import { Flashcard } from '../types';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsViewProps {
  content: string;
}

export default function FlashcardsView({ content }: FlashcardsViewProps) {
  let cards: Flashcard[] = [];
  try {
    cards = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse flashcards content:', error);
  }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((i) => (i + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx((i) => (i - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-8">
      <div className="perspective-1000 relative h-80 w-full max-w-md cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          className="preserve-3d relative h-full w-full"
        >
          {/* Front */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-800 p-8 text-center shadow-2xl">
            <span className="absolute top-6 text-xs font-bold uppercase tracking-widest text-white/20">Question</span>
            <p className="text-2xl font-bold text-white leading-tight">{cards[currentIdx].front}</p>
            <div className="absolute bottom-6 flex items-center gap-2 text-xs font-medium text-white/40">
              <RotateCw size={14} />
              Click to flip
            </div>
          </div>

          {/* Back */}
          <div 
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-2xl"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="absolute top-6 text-xs font-bold uppercase tracking-widest text-emerald-500/40">Answer</span>
            <p className="text-xl font-medium text-white leading-relaxed">{cards[currentIdx].back}</p>
            <div className="absolute bottom-6 flex items-center gap-2 text-xs font-medium text-emerald-500/40">
              <RotateCw size={14} />
              Click to flip
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-sm font-bold text-white/40 tabular-nums">
          {currentIdx + 1} / {cards.length}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
