import React, { useState } from 'react';
import { UserCheck, GraduationCap } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onSave: (classroom: string, studentId: string) => Promise<void>;
  isLoading: boolean;
}

export default function ProfileModal({ isOpen, onSave, isLoading }: ProfileModalProps) {
  const [classroom, setClassroom] = useState('ม.3/1');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId.trim()) {
      setError('กรุณากรอกเลขประจำตัวนักเรียนก่อนดำเนินงานครับ');
      return;
    }

    if (!/^\d+$/.test(studentId)) {
      setError('เลขประจำตัวนักเรียนควรเป็นตัวเลขล้วนเท่านั้นครับ');
      return;
    }

    try {
      await onSave(classroom, studentId.trim());
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-brand-600 text-white p-6 text-center">
          <GraduationCap className="mx-auto mb-3" size={44} />
          <h2 className="text-xl font-bold">ข้อมูลนักเรียนรายบุคคล</h2>
          <p className="text-sky-100 text-xs mt-1.5 font-light">
            กรุณากรอกข้อมูลเพื่อเริ่มต้นระบบบทเรียนและการบันทึกคะแนน
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border-l-3 border-rose-500 text-rose-800 text-xs rounded leading-relaxed">
              {error}
            </div>
          )}

          {/* Classroom */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">ห้องเรียนของคุณ</label>
            <select
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="ม.3/1">มัธยมศึกษาปีที่ 3/1 (ม.3/1)</option>
              <option value="ม.3/2">มัธยมศึกษาปีที่ 3/2 (ม.3/2)</option>
              <option value="ม.3/3">มัธยมศึกษาปีที่ 3/3 (ม.3/3)</option>
              <option value="ม.3/4">มัธยมศึกษาปีที่ 3/4 (ม.3/4)</option>
            </select>
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">เลขประจำตัวนักเรียน</label>
            <input
              type="text"
              placeholder="เช่น 30101"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              maxLength={10}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-100 cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <UserCheck size={18} />
            <span>{isLoading ? 'กำลังบันทึก...' : 'เริ่มเข้าเรียนรู้บทเรียน'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
