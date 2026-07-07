import React, { useState } from 'react';
import { LogIn, BookOpen, GraduationCap, Users, AlertCircle, Lock, User, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (
    role: 'student' | 'teacher',
    customData?: { displayName: string; studentId: string; classroom: string }
  ) => void;
  isLoading: boolean;
}

export default function AuthScreen({ onLogin, isLoading }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  
  // Student form state
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classroom, setClassroom] = useState('ม.3/1');
  const [studentError, setStudentError] = useState<string | null>(null);

  // Teacher/Admin form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);

    if (!studentName.trim()) {
      setStudentError('กรุณาระบุชื่อ-นามสกุล ของนักเรียน');
      return;
    }
    if (!studentId.trim() || isNaN(Number(studentId))) {
      setStudentError('กรุณาระบุเลขประจำตัวนักเรียนเป็นตัวเลขเท่านั้น');
      return;
    }

    onLogin('student', {
      displayName: studentName.trim(),
      studentId: studentId.trim(),
      classroom
    });
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);

    if (username === 'admin' && password === '1234') {
      onLogin('teacher');
    } else {
      setTeacherError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (ระบุ Username: admin และ Password: 1234)');
    }
  };

  // Pre-fill quick helper
  const handleQuickStudentFill = () => {
    setStudentName('เด็กชายพูนทรัพย์ เรียนดี');
    setStudentId('30199');
    setClassroom('ม.3/1');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Banner */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 translate-x-12 -translate-y-6">
            <BookOpen size={240} />
          </div>
          <GraduationCap className="mx-auto mb-4 bg-white/15 p-3 rounded-2xl border border-white/20" size={56} />
          <h1 className="text-2xl font-bold tracking-tight">วิทยาการคำนวณ ม.3</h1>
          <p className="text-sky-100 text-sm mt-2 font-light">
            ระบบบทเรียนออนไลน์ พร้อมระบบทดสอบและการวิเคราะห์ข้อมูลเรียลไทม์
          </p>
        </div>

        {/* Form Body with Tab Navigation */}
        <div className="p-8">
          
          {/* Custom Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('student');
                setStudentError(null);
                setTeacherError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap size={16} />
              <span>สำหรับนักเรียน</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('teacher');
                setStudentError(null);
                setTeacherError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users size={16} />
              <span>คุณครู / ผู้ดูแลระบบ</span>
            </button>
          </div>

          {activeTab === 'student' ? (
            /* Student Form */
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              {studentError && (
                <div className="p-3.5 bg-amber-50 border-l-3 border-amber-500 text-amber-950 text-xs rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ชื่อ-นามสกุลนักเรียน</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="ระบุชื่อ-นามสกุล (เช่น เด็กชายพูนทรัพย์ เรียนดี)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 font-medium rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">เลขประจำตัวนักเรียน</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                    placeholder="เช่น 30199"
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 font-semibold rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ห้องเรียน</label>
                  <select
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 font-semibold rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none cursor-pointer"
                  >
                    <option value="ม.3/1">ม.3/1</option>
                    <option value="ม.3/2">ม.3/2</option>
                    <option value="ม.3/3">ม.3/3</option>
                    <option value="ม.3/4">ม.3/4</option>
                    <option value="ม.3/5">ม.3/5</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-brand-100 active:scale-[0.98]"
              >
                <LogIn size={18} />
                <span>ลงชื่อเข้าห้องเรียน</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleQuickStudentFill}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>ใช้ชื่อนักเรียนจำลองสำหรับทดสอบระบบ</span>
                </button>
              </div>
            </form>
          ) : (
            /* Teacher/Admin Form */
            <form onSubmit={handleTeacherSubmit} className="space-y-5">
              {teacherError && (
                <div className="p-3.5 bg-rose-50 border-l-3 border-rose-500 text-rose-950 text-xs rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{teacherError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น admin"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 font-medium rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ป้อนรหัสผ่าน (เช่น 1234)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 font-medium rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.98]"
              >
                <LogIn size={18} />
                <span>ลงชื่อเข้าสู่ระบบจัดการเรียน (Admin)</span>
              </button>

              <div className="text-center text-[11px] text-slate-400 font-medium">
                (ผู้ดูแลระบบทดสอบระบุ: admin / 1234)
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 font-light">
          โครงการระบบเรียนรู้อัจฉริยะวิทยาการคำนวณ ม.3
        </div>
      </div>
    </div>
  );
}
