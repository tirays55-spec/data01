import React, { useState, useEffect } from 'react';
import { UserProfile, QuizAttempt, Progress, AIAnalysis, Quiz } from '../types';
import { UNITS, PRE_TEST_QUIZ, POST_TEST_QUIZ, UNIT_QUIZZES } from '../data/curriculum';
import QuizModal from './QuizModal';
import { 
  BookOpen, Clock, Play, CheckCircle2, Lock, GraduationCap, 
  Award, Sparkles, Brain, LogOut, Loader2, ArrowRight, UserCheck
} from 'lucide-react';

interface StudentDashboardProps {
  user: UserProfile;
  attempts: QuizAttempt[];
  progress: Progress[];
  onAddAttempt: (quizId: string, quizTitle: string, score: number, maxScore: number, answers: any, type: 'pre' | 'post' | 'unit') => Promise<void>;
  onToggleLesson: (lessonId: string) => Promise<void>;
  onSignOut: () => void;
}

export default function StudentDashboard({
  user,
  attempts,
  progress,
  onAddAttempt,
  onToggleLesson,
  onSignOut,
}: StudentDashboardProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>('unit1');

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Filter attempts for this student
  const studentAttempts = attempts.filter((att) => att.uid === user.uid);
  const studentProgressIds = progress
    .filter((p) => p.uid === user.uid && p.completed)
    .map((p) => p.lessonId);

  // Check which tests are taken
  const preTestAttempt = studentAttempts.find((att) => att.quizId === 'pre_test');
  const postTestAttempt = studentAttempts.find((att) => att.quizId === 'post_test');

  const getUnitQuizAttempt = (quizId: string) => {
    return studentAttempts.find((att) => att.quizId === quizId);
  };

  const isLessonCompleted = (lessonId: string) => {
    return studentProgressIds.includes(lessonId);
  };

  const isUnitLessonsCompleted = (unitId: string) => {
    const unit = UNITS.find((u) => u.id === unitId);
    if (!unit) return false;
    return unit.lessons.every((lesson) => isLessonCompleted(lesson.id));
  };

  const activeUnit = UNITS.find((u) => u.id === activeUnitId) || UNITS[0];
  const activeLesson = activeUnit.lessons.find((l) => l.id === activeLessonId);

  // Load active lesson when changing unit
  useEffect(() => {
    if (activeUnit) {
      setActiveLessonId(activeUnit.lessons[0].id);
    }
  }, [activeUnitId]);

  const handleRunAIAnalysis = async () => {
    if (studentAttempts.length === 0) {
      setAnalysisError('กรุณาทำแบบทดสอบก่อนเรียนอย่างน้อย 1 รายการ เพื่อส่งข้อมูลให้ AI วิเคราะห์ผลครับ!');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.displayName,
          classroom: user.classroom,
          studentId: user.studentId,
          attempts: studentAttempts,
        }),
      });

      if (!response.ok) {
        throw new Error('ระบบเซิร์ฟเวอร์ขัดข้องในการเรียกใช้ AI');
      }

      const data = await response.json();
      setAiAnalysis({
        recommendations: data.recommendations,
        weakPoints: data.weakPoints || [],
        strongPoints: data.strongPoints || [],
        suggestedResources: data.suggestedResources || [],
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error(err);
      setAnalysisError('การประมวลผลวิเคราะห์ผลการเรียนด้วย AI เกิดความล่าช้า กรุณากดปุ่มเพื่อลองอีกครั้ง');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuizSubmit = async (score: number, answers: any) => {
    if (!selectedQuiz) return;
    const type = selectedQuiz.id === 'pre_test' ? 'pre' : selectedQuiz.id === 'post_test' ? 'post' : 'unit';
    await onAddAttempt(selectedQuiz.id, selectedQuiz.title, score, selectedQuiz.questions.length, answers, type);
  };

  // Calculate overall progress stats
  const totalLessons = UNITS.reduce((acc, u) => acc + u.lessons.length, 0);
  const completedLessonsCount = studentProgressIds.length;
  const lessonProgressPercent = Math.round((completedLessonsCount / totalLessons) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="student_view">
      {/* Banner / Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <GraduationCap size={36} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">{user.displayName}</h1>
              <span className="text-xs bg-brand-50 text-brand-600 border border-brand-100 px-2.5 py-0.5 rounded-full font-medium">
                นักเรียนรายบุคคล
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              เลขประจำตัว: {user.studentId || 'ไม่ระบุ'} • ชั้นเรียน: {user.classroom || 'ทั่วไป'}
            </p>
          </div>
        </div>

        {/* Mini Stats Card */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex-1 md:flex-initial min-w-[120px] text-center">
            <div className="text-xs text-slate-400">บทเรียนที่เสร็จ</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">
              {completedLessonsCount} / {totalLessons}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${lessonProgressPercent}%` }}></div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 p-4 text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-100 hover:border-rose-100 transition-all text-sm font-medium cursor-pointer"
            id="btn_student_signout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lesson Navigation & Curriculum */}
        <div className="lg:col-span-2 space-y-8">
          {/* Milestone Overview: Pre-test & Post-test */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Award className="text-indigo-600" size={20} />
              <span>การสอบวัดผลการเรียนหลัก</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pre-test card */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">ก่อนเรียน</span>
                    {preTestAttempt && (
                      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} /> ทำการสอบแล้ว
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mt-3">{PRE_TEST_QUIZ.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">วัดความรู้ตั้งต้น 5 ข้อคำถามพื้นฐานวิทยาการคำนวณ</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {preTestAttempt ? (
                    <div className="text-xs text-slate-600">
                      คะแนนที่ได้: <strong className="text-brand-600 text-sm">{preTestAttempt.score}</strong> / {preTestAttempt.maxScore} คะแนน
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedQuiz(PRE_TEST_QUIZ)}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-lg shadow-sm shadow-brand-100 transition-all cursor-pointer text-center"
                      id="btn_start_pre_test"
                    >
                      เริ่มสอบวัดระดับก่อนเรียน
                    </button>
                  )}
                </div>
              </div>

              {/* Post-test card */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded">หลังเรียน</span>
                    {postTestAttempt && (
                      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} /> ทำการสอบแล้ว
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mt-3">{POST_TEST_QUIZ.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">วัดผลสำเร็จเมื่อเรียนรู้ครบทุกหน่วยการเรียนรู้</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {postTestAttempt ? (
                    <div className="text-xs text-slate-600">
                      คะแนนที่ได้: <strong className="text-brand-600 text-sm">{postTestAttempt.score}</strong> / {postTestAttempt.maxScore} คะแนน
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedQuiz(POST_TEST_QUIZ)}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-all cursor-pointer text-center"
                      id="btn_start_post_test"
                    >
                      เริ่มสอบหลังเรียน
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Unit selection and lessons */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Unit Tabs */}
            <div className="bg-slate-50 border-b border-slate-100 flex overflow-x-auto">
              {UNITS.map((unit, uidx) => {
                const isActive = activeUnitId === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => setActiveUnitId(unit.id)}
                    className={`px-5 py-4 text-xs font-medium shrink-0 border-b-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-brand-500 text-brand-600 bg-white font-semibold' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                    }`}
                  >
                    หน่วยที่ {uidx + 1}
                  </button>
                );
              })}
            </div>

            {/* Selected Unit Content */}
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800">{activeUnit.title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeUnit.description}</p>
              </div>

              {/* Grid: Unit Study Area (Left: Lesson list, Right: Lesson details) */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Lesson Selection Column (2/5) */}
                <div className="md:col-span-2 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">หัวข้อย่อยบทเรียน</h4>
                  {activeUnit.lessons.map((lesson) => {
                    const isActive = activeLessonId === lesson.id;
                    const isDone = isLessonCompleted(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                          isActive 
                            ? 'bg-brand-50/50 border-brand-300 text-brand-900 font-medium shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isDone ? (
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                          ) : (
                            <Play className="text-slate-300 shrink-0" size={14} />
                          )}
                          <span className="text-xs truncate">{lesson.title}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                          <Clock size={10} />
                          <span>{lesson.duration}</span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Unlock Unit Quiz */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">แบบทดสอบท้ายหน่วย</h4>
                    {isUnitLessonsCompleted(activeUnit.id) ? (
                      getUnitQuizAttempt(activeUnit.quizId) ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span>สอบผ่านท้ายหน่วยแล้ว</span>
                          </div>
                          <strong>คะแนน: {getUnitQuizAttempt(activeUnit.quizId)?.score} / 3</strong>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const q = UNIT_QUIZZES[activeUnit.quizId];
                            if (q) setSelectedQuiz(q);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-xl shadow-md shadow-brand-100 transition-all cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>สอบท้ายหน่วยที่ {activeUnit.id.replace('unit', '')}</span>
                        </button>
                      )
                    ) : (
                      <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs flex items-center gap-2 font-light">
                        <Lock size={14} />
                        <span>เรียนรู้เนื้อหาครบถ้วนเพื่อปลดล็อกข้อสอบ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Details Area (3/5) */}
                <div className="md:col-span-3 border border-slate-100 rounded-2xl p-4 md:p-6 bg-white flex flex-col justify-between min-h-[420px]">
                  {activeLesson ? (
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Video embeds if available */}
                        {activeLesson.youtubeUrl && (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-100 mb-5">
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={activeLesson.youtubeUrl}
                              title={activeLesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}

                        <h3 className="font-bold text-slate-800 text-base mb-3 leading-snug">
                          {activeLesson.title}
                        </h3>

                        {/* Lesson Content - Scannable format */}
                        <div className="text-xs text-slate-600 leading-relaxed max-h-[220px] overflow-y-auto pr-2 space-y-4 whitespace-pre-line border-t border-slate-50 pt-3">
                          {activeLesson.content}
                        </div>
                      </div>

                      {/* Action to complete */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
                        <span className="text-[10px] text-slate-400 font-light">
                          สถานะเรียน: {isLessonCompleted(activeLesson.id) ? 'เรียนเสร็จสิ้นแล้ว' : 'ยังไม่ได้บันทึกเข้าเรียน'}
                        </span>
                        <button
                          onClick={() => onToggleLesson(activeLesson.id)}
                          className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            isLessonCompleted(activeLesson.id)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-100'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>{isLessonCompleted(activeLesson.id) ? 'ทบทวนเสร็จแล้ว' : 'บันทึกเข้าเรียนรู้นี้'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center text-slate-400">
                      <BookOpen size={48} className="text-slate-200 mb-3" />
                      <p className="text-xs">เลือกหัวข้อด้านซ้ายเพื่อเปิดเรียนรู้บทเรียน</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Academic Coach & Score Summaries */}
        <div className="space-y-8">
          
          {/* Real-time Scores Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              <span>สรุปคะแนนประเมินเรียลไทม์</span>
            </h3>

            <div className="space-y-3.5">
              {/* Pre test */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-700">แบบทดสอบก่อนเรียน</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">วัดสมรรถนะก่อนเริ่มศึกษา</div>
                </div>
                <div className="text-right">
                  {preTestAttempt ? (
                    <span className="text-sm font-bold text-slate-800">{preTestAttempt.score} / 5</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">ยังไม่ทำข้อสอบ</span>
                  )}
                </div>
              </div>

              {/* Unit Scores */}
              {UNITS.map((unit, idx) => {
                const att = getUnitQuizAttempt(unit.quizId);
                return (
                  <div key={unit.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-700">แบบทดสอบหน่วยที่ {idx + 1}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{unit.title}</div>
                    </div>
                    <div className="text-right">
                      {att ? (
                        <span className="text-sm font-bold text-slate-800">{att.score} / 3</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">ยังไม่ทำข้อสอบ</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Post test */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-700">แบบทดสอบหลังเรียน</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">วัดความสำเร็จปลายทางบทเรียน</div>
                </div>
                <div className="text-right">
                  {postTestAttempt ? (
                    <span className="text-sm font-bold text-slate-800">{postTestAttempt.score} / 5</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">ยังไม่ทำข้อสอบ</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Academic Coach & Performance Analysis - Styled using Geometric Balance Dark Theme */}
          <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Brain size={120} className="text-brand-400" />
            </div>

            <div className="flex items-center gap-2.5 mb-4">
              <Sparkles className="text-brand-400" size={20} />
              <h3 className="font-bold text-white text-base tracking-tight">ระบบวิเคราะห์ข้อมูลเชิงลึกด้วย AI</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 font-light">
              AI วิเคราะห์แบบเรียลไทม์จากคะแนนทำโจทย์ การเข้าบทเรียน เพื่อเขียนคำแนะนำส่วนบุคคลและแนวทางการไปเรียนเพิ่มเติม
            </p>

            {analysisError && (
              <div className="mb-4 p-3 bg-rose-950/80 border-l-3 border-rose-500 text-rose-200 text-[10px] rounded leading-relaxed">
                {analysisError}
              </div>
            )}

            {aiAnalysis ? (
              <div className="space-y-4 animate-fade-in">
                {/* Score analysis report content */}
                <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-200 leading-relaxed font-light">
                  <strong className="text-brand-400 font-semibold block mb-1">📝 ผลประเมินเชิงวิชาการ:</strong>
                  {aiAnalysis.recommendations}
                </div>

                {/* Strong points */}
                {aiAnalysis.strongPoints.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 size={12} />
                      <span>จุดเด่นที่คุณทำได้ดีมาก:</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1 font-light">
                      {aiAnalysis.strongPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weak points */}
                {aiAnalysis.weakPoints.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <Brain size={12} />
                      <span>หัวข้อที่ควรทบทวนด่วน:</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1 font-light">
                      {aiAnalysis.weakPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested resources */}
                {aiAnalysis.suggestedResources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <h5 className="text-xs font-semibold text-indigo-400 mb-1.5">📚 ทรัพยากรศึกษาเพิ่มเติม:</h5>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1 font-light">
                      {aiAnalysis.suggestedResources.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-brand-400" />
                      <span>กำลังประมวลผลใหม่...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-brand-400" />
                      <span>ขอวิเคราะห์ผลการสอบใหม่</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-900 cursor-pointer disabled:opacity-50"
                id="btn_run_ai_analysis"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>AI กำลังวิเคราะห์ผลคะแนนสอบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>เริ่มส่งวิเคราะห์ข้อมูลด้วย AI อัจฉริยะ</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz take modal */}
      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          isOpen={!!selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
          onSubmitAttempt={handleQuizSubmit}
        />
      )}
    </div>
  );
}
