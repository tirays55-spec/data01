export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher';
  classroom?: string; // e.g., "ม.3/1", "ม.3/2"
  studentId?: string; // e.g., "30101"
  createdAt?: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown supported
  youtubeUrl?: string; // For video lesson
  duration: string; // e.g., "20 นาที"
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quizId: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index (0-3)
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  unitId?: string; // undefined for pre-test/post-test
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  uid: string;
  studentName: string;
  studentId?: string;
  classroom?: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  answers: { [questionId: string]: number };
  timestamp: number;
  type: 'pre' | 'post' | 'unit';
}

export interface Progress {
  id: string; // `${uid}_${lessonId}`
  uid: string;
  lessonId: string;
  completed: boolean;
  completedAt: number;
}

export interface AIAnalysis {
  recommendations: string;
  weakPoints: string[];
  strongPoints: string[];
  suggestedResources: string[];
  timestamp: number;
}
