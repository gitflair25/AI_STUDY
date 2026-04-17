export type MaterialType = 'summary' | 'quiz' | 'flashcards' | 'pyq' | 'roadmap';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyMaterial {
  id?: string;
  userId: string;
  topic: string;
  type: MaterialType;
  content: string; // Markdown for summary, JSON string for quiz/flashcards
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
