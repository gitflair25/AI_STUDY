import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, getDocFromServer } from 'firebase/firestore';
import { StudyMaterial, MaterialType } from './types';
import { generateStudyMaterial, deepDive } from './services/gemini';
import Navbar from './components/Navbar';
import GeneratorForm from './components/GeneratorForm';
import MaterialCard from './components/MaterialCard';
import Modal from './components/Modal';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import FlashcardsView from './components/FlashcardsView';
import StudyBuddy from './components/StudyBuddy';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, History, LayoutGrid, Info, ChevronRight, GraduationCap, Map } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getLocalMaterialsKey = (uid: string) => `studyai_local_materials_${uid}`;

  const loadLocalMaterials = (uid: string) => {
    try {
      const raw = localStorage.getItem(getLocalMaterialsKey(uid));
      if (!raw) return [] as StudyMaterial[];
      return JSON.parse(raw) as StudyMaterial[];
    } catch (error) {
      console.error('Failed to load local materials:', error);
      return [] as StudyMaterial[];
    }
  };

  const saveLocalMaterial = (uid: string, material: StudyMaterial) => {
    try {
      const existing = loadLocalMaterials(uid);
      const next = [material, ...existing.filter(m => m.id !== material.id)];
      localStorage.setItem(getLocalMaterialsKey(uid), JSON.stringify(next));
    } catch (error) {
      console.error('Failed to persist local material:', error);
    }
  };

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firebase connection error: The client is offline. Please check your Firebase configuration and authorized domains.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setMaterials([]);
      return;
    }

    const q = query(
      collection(db, 'study_materials'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyMaterial));
      const localMaterials = loadLocalMaterials(user.uid);
      const merged = [
        ...docs,
        ...localMaterials.filter(local => !docs.some(remote => remote.id === local.id)),
      ];
      setMaterials(merged);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async (topic: string, type: MaterialType) => {
    if (!user) return;
    
    setIsGenerating(true);
    let generatedContent: string = '';
    try {
      generatedContent = (await generateStudyMaterial(topic, type)) || '';
      if (!generatedContent || !generatedContent.trim()) {
        throw new Error('Gemini returned empty content');
      }

      const maxStoredChars = type === 'pyq' || type === 'roadmap' ? 150000 : 100000;
      const storedContent = generatedContent.length > maxStoredChars
        ? generatedContent.slice(0, maxStoredChars)
        : generatedContent;

      if (storedContent.length !== generatedContent.length) {
        console.warn(`Truncated ${type} content from ${generatedContent.length} to ${storedContent.length} characters before saving.`);
      }
      
      await addDoc(collection(db, 'study_materials'), {
        userId: user.uid,
        topic,
        type,
        content: storedContent,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Generation failed", error);
      console.error('Firestore save failed with code:', (error as any)?.code);

      const localMaterial: StudyMaterial = {
        id: `local_${Date.now()}`,
        userId: user.uid,
        topic,
        type,
        content: generatedContent,
        createdAt: new Date().toISOString()
      };

      saveLocalMaterial(user.uid, localMaterial);
      setMaterials(prev => [localMaterial, ...prev]);
      alert("Saved locally because Firestore blocked the write. Check your Library.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'study_materials', id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleDownload = () => {
    if (!selectedMaterial) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(selectedMaterial.topic, margin, yPos);
    yPos += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Material Type: ${selectedMaterial.type.toUpperCase()}`, margin, yPos);
    yPos += 15;

    // Content
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black

    let contentText = selectedMaterial.content;

    if (selectedMaterial.type === 'quiz') {
      try {
        const quizData = JSON.parse(selectedMaterial.content);
        contentText = quizData.map((q: any, i: number) => (
          `${i + 1}. ${q.question}\nOptions: ${q.options.join(', ')}\nCorrect Answer: ${q.correctAnswer}\nExplanation: ${q.explanation}\n`
        )).join('\n');
      } catch (error) {
        console.error('Failed to parse quiz data for PDF:', error);
      }
    } else if (selectedMaterial.type === 'flashcards') {
      try {
        const flashData = JSON.parse(selectedMaterial.content);
        contentText = flashData.map((f: any, i: number) => (
          `Card ${i + 1}\nFront: ${f.front}\nBack: ${f.back}\n`
        )).join('\n');
      } catch (error) {
        console.error('Failed to parse flashcards data for PDF:', error);
      }
    }

    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(contentText, contentWidth);
    
    // Add lines to PDF, handling page breaks
    lines.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    doc.save(`${selectedMaterial.topic.replace(/\s+/g, '_')}_${selectedMaterial.type}.pdf`);
  };

  const handleDeepDive = async () => {
    if (!selectedMaterial || isDeepDiving) return;
    
    setIsDeepDiving(true);
    try {
      const expandedContent = await deepDive(selectedMaterial.content, selectedMaterial.topic);
      const updatedMaterial = {
        ...selectedMaterial,
        content: selectedMaterial.content + "\n\n---\n\n## 🚀 Deep Dive Expansion\n\n" + expandedContent
      };
      
      setSelectedMaterial(updatedMaterial);
      setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? updatedMaterial : m));
    } catch (error) {
      console.error('Deep dive failed:', error);
    } finally {
      setIsDeepDiving(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <Navbar user={user} />

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500"
            >
              <BookOpen size={48} />
            </motion.div>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Master Any Subject with <span className="text-emerald-500">AI</span>
            </h1>
            <p className="mb-10 max-w-2xl text-base text-zinc-400 sm:text-lg lg:text-xl">
              Generate custom study summaries, interactive quizzes, and flashcards in seconds. 
              Perfect for final year student projects and exam preparation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/60">
                <Sparkles size={16} className="text-emerald-500" />
                AI-Powered
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/60">
                <History size={16} className="text-blue-500" />
                Save Progress
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/60">
                <LayoutGrid size={16} className="text-purple-500" />
                Multi-Format
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 xl:gap-10">
            {/* Left Column: Generator */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="space-y-6 xl:sticky xl:top-24 xl:space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Generate Material</h2>
                  <p className="mt-1 text-zinc-400">Create new study content using AI.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-2xl sm:p-8">
                  <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
                </div>
                
                <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5 sm:p-6">
                  <h4 className="mb-4 font-bold text-white flex items-center gap-2">
                    <LayoutGrid size={18} className="text-blue-400" />
                    RGPV Quick Links
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="https://www.rgpv.ac.in/" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                        Official Website <ChevronRight size={14} />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.rgpv.ac.in/Uni/frm_ViewSyllabus.aspx" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                        Syllabus <ChevronRight size={14} />
                      </a>
                    </li>
                    <li>
                      <a href="http://result.rgpv.ac.in/Result/ProgramSelect.aspx" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-blue-400 transition-colors flex items-center justify-between">
                        Results <ChevronRight size={14} />
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5 sm:p-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Pro Tip</h4>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                        Be specific with your topics (e.g., "Photosynthesis in C4 plants") to get more detailed and accurate study materials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Library</h2>
                  <p className="mt-1 text-zinc-400">Access your saved study materials.</p>
                </div>
                <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-white/40 uppercase tracking-widest">
                  {materials.length} Items
                </span>
              </div>

              {materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
                  <div className="mb-4 text-zinc-600">
                    <History size={48} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">No materials yet</h3>
                  <p className="text-zinc-500">Generate your first study material to see it here.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence>
                    {materials.map((m) => (
                      <MaterialCard
                        key={m.id}
                        material={m}
                        onSelect={setSelectedMaterial}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onDownload={handleDownload}
        onDeepDive={handleDeepDive}
        isDeepDiving={isDeepDiving}
        title={selectedMaterial?.topic || ''}
      >
        {(selectedMaterial?.type === 'summary' || selectedMaterial?.type === 'pyq' || selectedMaterial?.type === 'roadmap') && (
          <SummaryView content={selectedMaterial.content} />
        )}
        {selectedMaterial?.type === 'quiz' && (
          <QuizView content={selectedMaterial.content} />
        )}
        {selectedMaterial?.type === 'flashcards' && (
          <FlashcardsView content={selectedMaterial.content} />
        )}
      </Modal>

      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            &copy; 2026 StudyAI. Built with Gemini AI for Final Year Student Projects.
          </p>
        </div>
      </footer>
      <StudyBuddy />
    </div>
  );
}
