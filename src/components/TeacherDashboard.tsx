import React, { useState } from 'react';
import { UserProfile, QuizAttempt, Progress, AIAnalysis } from '../types';
import { UNITS } from '../data/curriculum';
import { DEMO_USERS, DEMO_ATTEMPTS } from '../data/demoData';
import { 
  Users, Award, TrendingUp, CheckSquare, Sparkles, Brain, BookOpen,
  Filter, CheckCircle2, ChevronRight, Loader2, ArrowLeft, RefreshCw, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface TeacherDashboardProps {
  user: UserProfile;
  attempts: QuizAttempt[];
  progress: Progress[];
  allProfiles: UserProfile[];
  onSeedDemoData: () => Promise<void>;
  onClearDemoData: () => Promise<void>;
  onSignOut: () => void;
}

export default function TeacherDashboard({
  user,
  attempts,
  progress,
  allProfiles,
  onSeedDemoData,
  onClearDemoData,
  onSignOut,
}: TeacherDashboardProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  
  // AI student analysis states
  const [studentAiReport, setStudentAiReport] = useState<string | null>(null);
  const [isAnalyzingStudent, setIsAnalyzingStudent] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Filtering students by classroom
  const classrooms = ['all', 'ม.3/1', 'ม.3/2'];
  
  const filteredProfiles = allProfiles.filter(p => {
    if (p.role !== 'student') return false;
    if (selectedClass === 'all') return true;
    return p.classroom === selectedClass;
  });

  // Calculate metrics
  const totalEnrolled = filteredProfiles.length;

  // Pre-test & Post-test scores calculations
  const filteredProfileUids = filteredProfiles.map(p => p.uid);
  const filteredAttempts = attempts.filter(att => filteredProfileUids.includes(att.uid));

  const preTestAttempts = filteredAttempts.filter(att => att.quizId === 'pre_test');
  const postTestAttempts = filteredAttempts.filter(att => att.quizId === 'post_test');

  const avgPreScore = preTestAttempts.length > 0 
    ? parseFloat((preTestAttempts.reduce((acc, att) => acc + att.score, 0) / preTestAttempts.length).toFixed(1))
    : 0;

  const avgPostScore = postTestAttempts.length > 0 
    ? parseFloat((postTestAttempts.reduce((acc, att) => acc + att.score, 0) / postTestAttempts.length).toFixed(1))
    : 0;

  const improvementPercent = avgPreScore > 0 
    ? Math.round(((avgPostScore - avgPreScore) / avgPreScore) * 100)
    : 0;

  // Average lesson progress
  const filteredProgress = progress.filter(p => filteredProfileUids.includes(p.uid) && p.completed);
  const totalPossibleLessons = totalEnrolled * 8; // 8 lessons total in curriculum
  const lessonCompletionPercent = totalPossibleLessons > 0
    ? Math.round((filteredProgress.length / totalPossibleLessons) * 100)
    : 0;

  // Formulating data for pre-test vs post-test growth chart
  const studentGrowthData = filteredProfiles.map(student => {
    const pre = attempts.find(att => att.uid === student.uid && att.quizId === 'pre_test');
    const post = attempts.find(att => att.uid === student.uid && att.quizId === 'post_test');
    return {
      name: student.displayName || 'นักเรียน',
      'ก่อนเรียน': pre ? pre.score : 0,
      'หลังเรียน': post ? post.score : 0,
    };
  }).filter(d => d['ก่อนเรียน'] > 0 || d['หลังเรียน'] > 0);

  // Formulating data for unit quiz average score chart
  const unitQuizAverages = UNITS.map(unit => {
    const unitAttempts = filteredAttempts.filter(att => att.quizId === unit.quizId);
    const avg = unitAttempts.length > 0
      ? parseFloat((unitAttempts.reduce((acc, att) => acc + att.score, 0) / unitAttempts.length).toFixed(1))
      : 0;
    return {
      name: `หน่วยที่ ${unit.id.replace('unit', '')}`,
      'คะแนนเฉลี่ย': avg,
      'คะแนนเต็ม': 3
    };
  });

  const getStudentLessonCount = (studentUid: string) => {
    return progress.filter(p => p.uid === studentUid && p.completed).length;
  };

  const getStudentQuizScore = (studentUid: string, quizId: string) => {
    const attempt = attempts.find(att => att.uid === studentUid && att.quizId === quizId);
    return attempt ? `${attempt.score}/${attempt.maxScore}` : '-';
  };

  const handleAnalyzeStudent = async (student: UserProfile) => {
    const studentAttempts = attempts.filter(att => att.uid === student.uid);
    if (studentAttempts.length === 0) {
      setAiError('นักเรียนท่านนี้ยังไม่เคยทำแบบทดสอบใดๆ จึงไม่มีข้อมูลให้ AI สามารถประมวลผลได้');
      return;
    }

    setIsAnalyzingStudent(true);
    setAiError(null);
    setStudentAiReport(null);

    try {
      const response = await fetch('/api/analyze-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.displayName,
          classroom: student.classroom,
          studentId: student.studentId,
          attempts: studentAttempts,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      setStudentAiReport(data.recommendations);
    } catch (err: any) {
      console.error(err);
      setAiError('การดึงรายงานวิเคราะห์ AI ล้มเหลว โปรดลองอีกครั้ง');
    } finally {
      setIsAnalyzingStudent(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="teacher_view">
      
      {/* Header Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">แดชบอร์ดสรุปสถิติครูเรียลไทม์</h1>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-full font-medium">
              คุณครูผู้จัดการวิชา
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            วิเคราะห์คะแนน ความก้าวหน้า และตรวจสอบสมรรถนะนักเรียน ม.3 ด้วย AI
          </p>
        </div>

        {/* Database Control Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {allProfiles.length <= 1 ? (
            <button
              onClick={onSeedDemoData}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
              id="btn_seed_demo"
            >
              <RefreshCw size={14} />
              <span>เติมข้อมูลจำลอง 5 นักเรียน (ตรวจสอบแดชบอร์ด)</span>
            </button>
          ) : (
            <button
              onClick={onClearDemoData}
              className="flex items-center gap-2 px-4.5 py-2.5 text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium text-xs rounded-xl transition-all cursor-pointer"
              id="btn_clear_demo"
            >
              <span>ล้างฐานข้อมูลตัวอย่าง</span>
            </button>
          )}

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-xl transition-all text-xs font-semibold cursor-pointer"
            id="btn_teacher_signout"
          >
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Aggregate Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400">จำนวนนักเรียนในชั้น</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{totalEnrolled} คน</div>
          </div>
        </div>

        {/* Pre-test score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400">ค่าเฉลี่ยสอบก่อนเรียน</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{avgPreScore} / 5</div>
          </div>
        </div>

        {/* Post-test score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400">ค่าเฉลี่ยสอบหลังเรียน</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5 flex items-baseline gap-1.5">
              <span>{avgPostScore} / 5</span>
              {improvementPercent > 0 && (
                <span className="text-xs text-emerald-600 font-semibold">({`+${improvementPercent}%`})</span>
              )}
            </div>
          </div>
        </div>

        {/* Progression Rates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400">อัตราการเรียนเนื้อหาครบ</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{lessonCompletionPercent}%</div>
          </div>
        </div>
      </div>

      {/* Dashboard Charts & Insights */}
      {totalEnrolled > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
          {/* Chart 1: Pre-test vs Post-test score growth */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="text-indigo-600" size={16} />
              <span>เปรียบเทียบผลสอบก่อนเรียนและหลังเรียนรายบุคคล</span>
            </h3>
            {studentGrowthData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ก่อนเรียน" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="หลังเรียน" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex justify-center items-center text-slate-400 text-xs">
                รอนักเรียนเริ่มทดสอบเพื่อวาดสถิติ
              </div>
            )}
          </div>

          {/* Chart 2: Unit quiz average scores */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="text-sky-600" size={16} />
              <span>คะแนนเฉลี่ยผลสอบย่อยรายหน่วย (เต็ม 3 คะแนน)</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitQuizAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                  <Bar dataKey="คะแนนเฉลี่ย" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-8 text-center text-amber-800 text-xs font-light mb-8">
          ไม่มีข้อมูลนักเรียนอยู่ในระบบวิชาการ ณ ขณะนี้ กรุณากดปุ่ม "เติมข้อมูลจำลอง 5 นักเรียน" เพื่อตรวจสอบสถิติและวิเคราะห์กราฟเรียลไทม์
        </div>
      )}

      {/* Main Student Table & Interactive Drill Down Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Column: Student Listing (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="text-indigo-600" size={18} />
              <span>บัญชีรายชื่อนักเรียนและคะแนนวัดประเมิน</span>
            </h3>

            {/* Class filter tabs */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1 rounded-xl">
              {classrooms.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {cls === 'all' ? 'ทุกห้อง' : cls}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3.5">เลขประจําตัว</th>
                  <th className="px-6 py-3.5">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3.5">ห้องเรียน</th>
                  <th className="px-6 py-3.5 text-center">บทเรียน (8)</th>
                  <th className="px-6 py-3.5 text-center">ก่อนเรียน (5)</th>
                  <th className="px-6 py-3.5 text-center">หลังเรียน (5)</th>
                  <th className="px-6 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map(student => {
                  const isSelected = selectedStudent?.uid === student.uid;
                  return (
                    <tr 
                      key={student.uid}
                      className={`text-xs hover:bg-slate-50/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/20 font-medium' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono">{student.studentId || '-'}</td>
                      <td className="px-6 py-4 text-slate-800">{student.displayName}</td>
                      <td className="px-6 py-4 text-slate-500">{student.classroom || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                          {getStudentLessonCount(student.uid)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">
                        {getStudentQuizScore(student.uid, 'pre_test')}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-brand-600">
                        {getStudentQuizScore(student.uid, 'post_test')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setStudentAiReport(null);
                          }}
                          className="px-3 py-1.5 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg font-medium transition-all cursor-pointer"
                        >
                          ตรวจดูรายงาน
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลนักเรียนของชั้นนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Column: Student Drill-Down & AI Analyzer Panel (1/3) - Styled using Geometric Balance Dark Theme */}
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col justify-between min-h-[400px]">
          {selectedStudent ? (
            <div className="space-y-6 animate-fade-in">
              {/* Student Header */}
              <div>
                <span className="text-[10px] font-bold text-brand-400 bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">
                  ข้อมูลการเรียนละเอียด
                </span>
                <h4 className="text-base font-bold text-white mt-3.5 tracking-tight">{selectedStudent.displayName}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  เลขประจำตัว: {selectedStudent.studentId || '-'} • ห้องเรียน: {selectedStudent.classroom || '-'}
                </p>
              </div>

              {/* Quiz Detailed scores */}
              <div>
                <h5 className="text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">ผลทดสอบสรุปย่อย:</h5>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">ก่อนเรียน</span>
                    <strong className="text-slate-200 text-sm font-bold">{getStudentQuizScore(selectedStudent.uid, 'pre_test')}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">หลังเรียน</span>
                    <strong className="text-brand-400 text-sm font-bold">{getStudentQuizScore(selectedStudent.uid, 'post_test')}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">สอบย่อยหน่วยที่ 1</span>
                    <strong className="text-slate-200 text-sm font-bold">{getStudentQuizScore(selectedStudent.uid, 'quiz_unit1')}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-850 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">สอบย่อยหน่วยที่ 2</span>
                    <strong className="text-slate-200 text-sm font-bold">{getStudentQuizScore(selectedStudent.uid, 'quiz_unit2')}</strong>
                  </div>
                </div>
              </div>

              {/* AI Pedagogical Advisor */}
              <div className="pt-4 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-400" />
                  <span>รายงานแนะแนววิชาการด้วย AI:</span>
                </h5>

                {aiError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-900 text-rose-200 text-[10px] rounded leading-relaxed mb-3">
                    {aiError}
                  </div>
                )}

                {studentAiReport ? (
                  <div className="p-4 bg-slate-800/90 rounded-lg border border-slate-700 text-xs text-slate-200 leading-relaxed font-light whitespace-pre-line max-h-[180px] overflow-y-auto pr-1">
                    {studentAiReport}
                  </div>
                ) : (
                  <button
                    onClick={() => handleAnalyzeStudent(selectedStudent)}
                    disabled={isAnalyzingStudent}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-900 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingStudent ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>AI กำลังวิเคราะห์แนวทาง...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>วิเคราะห์ทักษะนักเรียนด้วย AI</span>
                      </>
                    )
                    }
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 my-auto">
              <BookOpen size={48} className="text-slate-600 mb-3" />
              <p className="text-xs text-slate-300">คลิกเลือก "ตรวจดูรายงาน" ของนักเรียน <br />เพื่อเรียกดูสถิติเจาะลึกและสรุป AI รายคน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
