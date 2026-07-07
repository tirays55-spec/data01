import React, { useState, useEffect } from 'react';
import { auth, db, signOut, onAuthStateChanged } from './firebase';
import { 
  collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { UserProfile, QuizAttempt, Progress } from './types';
import { DEMO_USERS, DEMO_ATTEMPTS } from './data/demoData';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ProfileModal from './components/ProfileModal';
import { BookOpen, GraduationCap, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('class_app_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Firestore real-time synchronized arrays
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  // Listen to Firestore updates (attempts, progress, users)
  useEffect(() => {
    // Only fetch data if we have someone logged in (real or demo)
    if (!user) {
      setAttempts([]);
      setProgress([]);
      setAllProfiles([]);
      return;
    }

    // Subscribe to attempts
    const unsubAttempts = onSnapshot(collection(db, 'quiz_attempts'), (snapshot) => {
      const list: QuizAttempt[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QuizAttempt);
      });
      setAttempts(list);
    }, (error) => {
      console.warn("Attempts Firestore listener suspended:", error);
    });

    // Subscribe to lesson completion progress
    const unsubProgress = onSnapshot(collection(db, 'progress'), (snapshot) => {
      const list: Progress[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Progress);
      });
      setProgress(list);
    }, (error) => {
      console.warn("Progress Firestore listener suspended:", error);
    });

    // Subscribe to user list
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as UserProfile);
      });
      setAllProfiles(list);
    }, (error) => {
      console.warn("Users Firestore listener suspended:", error);
    });

    return () => {
      unsubAttempts();
      unsubProgress();
      unsubUsers();
    };
  }, [user?.uid]);

  const handleSaveProfileSetup = async (classroom: string, studentId: string) => {
    if (!user) return;
    setIsLoading(true);

    const updatedProfile: UserProfile = {
      ...user,
      classroom,
      studentId,
      createdAt: Date.now()
    };

    try {
      // Save to firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: updatedProfile.email,
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        role: updatedProfile.role,
        classroom: updatedProfile.classroom,
        studentId: updatedProfile.studentId,
        createdAt: updatedProfile.createdAt
      });

      setUser(updatedProfile);
      setShowProfileSetup(false);
    } catch (error) {
      console.error("Error saving profile to Firestore:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (
    role: 'student' | 'teacher',
    customData?: { displayName: string; studentId: string; classroom: string }
  ) => {
    setIsLoading(true);
    try {
      if (role === 'teacher') {
        const adminUser: UserProfile = {
          uid: 'admin_teacher',
          email: 'admin.somsri@school.ac.th',
          displayName: 'ครูสมศรี (Admin)',
          photoURL: null,
          role: 'teacher'
        };
        setUser(adminUser);
        localStorage.setItem('class_app_user', JSON.stringify(adminUser));
      } else if (customData) {
        const studentUser: UserProfile = {
          uid: `student_${customData.studentId || Date.now()}`,
          email: `${customData.studentId || 'student'}@school.ac.th`,
          displayName: customData.displayName,
          photoURL: null,
          role: 'student',
          classroom: customData.classroom,
          studentId: customData.studentId,
          createdAt: Date.now()
        };
        // Also save student to Firestore so the teacher dashboard shows them
        await setDoc(doc(db, 'users', studentUser.uid), {
          email: studentUser.email,
          displayName: studentUser.displayName,
          photoURL: studentUser.photoURL,
          role: studentUser.role,
          classroom: studentUser.classroom,
          studentId: studentUser.studentId,
          createdAt: studentUser.createdAt
        });
        setUser(studentUser);
        localStorage.setItem('class_app_user', JSON.stringify(studentUser));
      }
    } catch (e) {
      console.error("Login error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      localStorage.removeItem('class_app_user');
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAttempt = async (
    quizId: string, 
    quizTitle: string, 
    score: number, 
    maxScore: number, 
    answers: any, 
    type: 'pre' | 'post' | 'unit'
  ) => {
    if (!user) return;
    const attemptId = `${user.uid}_${quizId}_${Date.now()}`;
    const newAttempt: QuizAttempt = {
      id: attemptId,
      uid: user.uid,
      studentName: user.displayName || 'นักเรียนตัวอย่าง',
      studentId: user.studentId,
      classroom: user.classroom,
      quizId,
      quizTitle,
      score,
      maxScore,
      answers,
      timestamp: Date.now(),
      type
    };

    try {
      await setDoc(doc(db, 'quiz_attempts', attemptId), newAttempt);
    } catch (error) {
      console.error("Error storing attempt in Firestore:", error);
      // Local fallback if offline or permissions issue
      setAttempts((prev) => [...prev, newAttempt]);
    }
  };

  const handleToggleLesson = async (lessonId: string) => {
    if (!user) return;
    const progressId = `${user.uid}_${lessonId}`;
    const alreadyCompleted = progress.some(p => p.uid === user.uid && p.lessonId === lessonId && p.completed);

    const newProgress: Progress = {
      id: progressId,
      uid: user.uid,
      lessonId,
      completed: !alreadyCompleted,
      completedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'progress', progressId), newProgress);
    } catch (error) {
      console.error("Error setting progress in Firestore:", error);
      // Fallback
      setProgress((prev) => {
        const filtered = prev.filter(p => p.id !== progressId);
        return [...filtered, newProgress];
      });
    }
  };

  const handleSeedDemoData = async () => {
    setIsLoading(true);
    try {
      // Seed Users
      for (const demoUser of DEMO_USERS) {
        await setDoc(doc(db, 'users', demoUser.uid), {
          email: demoUser.email,
          displayName: demoUser.displayName,
          photoURL: demoUser.photoURL,
          role: demoUser.role,
          classroom: demoUser.classroom,
          studentId: demoUser.studentId,
          createdAt: Date.now()
        });
      }

      // Seed Attempts
      for (const att of DEMO_ATTEMPTS) {
        await setDoc(doc(db, 'quiz_attempts', att.id), {
          uid: att.uid,
          studentName: att.studentName,
          studentId: att.studentId,
          classroom: att.classroom,
          quizId: att.quizId,
          quizTitle: att.quizTitle,
          score: att.score,
          maxScore: att.maxScore,
          answers: att.answers,
          timestamp: att.timestamp,
          type: att.type
        });
      }
      
      // Seed Progresses
      const progressesToSeed = [
        { id: 'p_1_1', uid: 'student_1', lessonId: 'lesson1_1', completed: true, completedAt: Date.now() },
        { id: 'p_1_2', uid: 'student_1', lessonId: 'lesson1_2', completed: true, completedAt: Date.now() },
        { id: 'p_1_3', uid: 'student_1', lessonId: 'lesson2_1', completed: true, completedAt: Date.now() },
        
        { id: 'p_2_1', uid: 'student_2', lessonId: 'lesson1_1', completed: true, completedAt: Date.now() },
        { id: 'p_2_2', uid: 'student_2', lessonId: 'lesson1_2', completed: true, completedAt: Date.now() },
        { id: 'p_2_3', uid: 'student_2', lessonId: 'lesson2_1', completed: true, completedAt: Date.now() },
        { id: 'p_2_4', uid: 'student_2', lessonId: 'lesson2_2', completed: true, completedAt: Date.now() },
        { id: 'p_2_5', uid: 'student_2', lessonId: 'lesson3_1', completed: true, completedAt: Date.now() },
        { id: 'p_2_6', uid: 'student_2', lessonId: 'lesson3_2', completed: true, completedAt: Date.now() },
        { id: 'p_2_7', uid: 'student_2', lessonId: 'lesson4_1', completed: true, completedAt: Date.now() },
        { id: 'p_2_8', uid: 'student_2', lessonId: 'lesson4_2', completed: true, completedAt: Date.now() },

        { id: 'p_3_1', uid: 'student_3', lessonId: 'lesson1_1', completed: true, completedAt: Date.now() },
        { id: 'p_3_2', uid: 'student_3', lessonId: 'lesson1_2', completed: true, completedAt: Date.now() },

        { id: 'p_4_1', uid: 'student_4', lessonId: 'lesson1_1', completed: true, completedAt: Date.now() },

        { id: 'p_5_1', uid: 'student_5', lessonId: 'lesson1_1', completed: true, completedAt: Date.now() },
        { id: 'p_5_2', uid: 'student_5', lessonId: 'lesson1_2', completed: true, completedAt: Date.now() },
        { id: 'p_5_3', uid: 'student_5', lessonId: 'lesson2_1', completed: true, completedAt: Date.now() },
        { id: 'p_5_4', uid: 'student_5', lessonId: 'lesson3_1', completed: true, completedAt: Date.now() },
      ];
      
      for (const prog of progressesToSeed) {
        await setDoc(doc(db, 'progress', prog.id), {
          uid: prog.uid,
          lessonId: prog.lessonId,
          completed: prog.completed,
          completedAt: prog.completedAt
        });
      }

    } catch (error) {
      console.error("Error seeding Firestore demo data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDemoData = async () => {
    setIsLoading(true);
    try {
      // Clear Users in DEMO_USERS
      for (const demoUser of DEMO_USERS) {
        await deleteDoc(doc(db, 'users', demoUser.uid));
      }

      // Clear attempts in DEMO_ATTEMPTS
      for (const att of DEMO_ATTEMPTS) {
        await deleteDoc(doc(db, 'quiz_attempts', att.id));
      }

      // Clear progresses
      const progressIdsToClear = [
        'p_1_1', 'p_1_2', 'p_1_3', 'p_2_1', 'p_2_2', 'p_2_3', 'p_2_4', 'p_2_5', 'p_2_6', 'p_2_7', 'p_2_8',
        'p_3_1', 'p_3_2', 'p_4_1', 'p_5_1', 'p_5_2', 'p_5_3', 'p_5_4'
      ];
      for (const id of progressIdsToClear) {
        await deleteDoc(doc(db, 'progress', id));
      }

    } catch (error) {
      console.error("Error clearing demo data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header bar - Geometric Balance Design */}
      <header className="bg-white border-b border-slate-200 shrink-0 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-brand-100">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">วิทยาการคำนวณ ม.3</h1>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded uppercase tracking-wider">Live Sync</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">ระบบห้องเรียนอัจฉริยะ (Real-time AI Classroom)</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            {/* System Status Indicators from Geometric Balance */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">System Status</span>
                <span className="text-xs text-brand-600 font-semibold">Firebase Connected</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-600">Sync Active</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
            </div>

            {user && (
              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{user.displayName}</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wider">
                    {user.role === 'teacher' ? 'บทบาท: คุณครู' : `นักเรียนห้อง ${user.classroom || '-'}`}
                  </span>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center border border-slate-800">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 bg-slate-50">
        {isLoading ? (
          <div className="h-[75vh] flex flex-col justify-center items-center gap-3">
            <Loader2 className="animate-spin text-brand-600" size={40} />
            <p className="text-xs text-slate-400">กำลังเชื่อมโยงฐานข้อมูลกับ Firebase...</p>
          </div>
        ) : !user ? (
          <AuthScreen onLogin={handleLogin} isLoading={isLoading} />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard
            user={user}
            attempts={attempts}
            progress={progress}
            allProfiles={allProfiles}
            onSeedDemoData={handleSeedDemoData}
            onClearDemoData={handleClearDemoData}
            onSignOut={handleSignOut}
          />
        ) : (
          <StudentDashboard
            user={user}
            attempts={attempts}
            progress={progress}
            onAddAttempt={handleAddAttempt}
            onToggleLesson={handleToggleLesson}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Profile setup modal for new Gmail logins */}
      {showProfileSetup && (
        <ProfileModal
          isOpen={showProfileSetup}
          onSave={handleSaveProfileSetup}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
