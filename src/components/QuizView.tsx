import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  content: string;
}

export default function QuizView({ content }: QuizViewProps) {
  let questions: QuizQuestion[] = [];
  try {
    questions = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse quiz content:', error);
  }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      if (score >= questions.length / 2) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
          <CheckCircle2 size={64} />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-white">Quiz Completed!</h2>
        <p className="mb-8 text-xl text-white/60">
          You scored <span className="font-bold text-emerald-400">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>
        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-8 py-3 font-semibold text-white transition-all hover:bg-white/20"
        >
          <RotateCcw size={20} />
          Try Again
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-white/5">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <h3 className="text-2xl font-bold text-white leading-tight">{currentQuestion.question}</h3>

          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const isCorrect = option === currentQuestion.correctAnswer;
              const isSelected = option === selectedOption;
              
              let variantClasses = "border-white/5 bg-white/5 text-white/80 hover:bg-white/10";
              if (isAnswered) {
                if (isCorrect) variantClasses = "border-emerald-500/50 bg-emerald-500/20 text-emerald-400";
                else if (isSelected) variantClasses = "border-red-500/50 bg-red-500/20 text-red-400";
                else variantClasses = "opacity-40 border-white/5 bg-white/5 text-white/80";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-all ${variantClasses}`}
                >
                  <span className="font-medium">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/5 p-6"
            >
              <p className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-2">Explanation</p>
              <p className="text-white/80 leading-relaxed">{currentQuestion.explanation}</p>
            </motion.div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
