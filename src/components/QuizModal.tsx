import React, { useState } from 'react';
import { Quiz } from '../types';
import { Check, X, ArrowRight, Award, RotateCcw } from 'lucide-react';

interface QuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAttempt: (score: number, answers: { [key: string]: number }) => void;
}

export default function QuizModal({ quiz, isOpen, onClose, onSubmitAttempt }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const hasSelected = selectedAnswers[currentQuestion.id] !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (showResults) return; // Can't change after submitting
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score and show result page
      let calculatedScore = 0;
      quiz.questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          calculatedScore += 1;
        }
      });
      setScore(calculatedScore);
      setShowResults(true);
    }
  };

  const handleSubmitAttempt = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitAttempt(score, selectedAnswers);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in my-8">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{quiz.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {!showResults 
                ? `คำถามข้อที่ ${currentQuestionIndex + 1} จากทั้งหมด ${quiz.questions.length} ข้อ` 
                : 'ผลคะแนนสอบและการเฉลย'}
            </p>
          </div>
          {!showResults && (
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Content */}
        {!showResults ? (
          <div className="p-6">
            {/* Question Text */}
            <div className="mb-6">
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase">
                โจทย์คำถาม
              </span>
              <h3 className="text-slate-800 text-base md:text-lg font-medium mt-3 leading-relaxed">
                {currentQuestion.text}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-100 font-medium'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                      isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-5 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                ออกจากการทดสอบ
              </button>
              <button
                onClick={handleNext}
                disabled={!hasSelected}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-brand-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{currentQuestionIndex === quiz.questions.length - 1 ? 'ส่งคำตอบ' : 'ข้อถัดไป'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Results Header */}
            <div className="text-center py-6 bg-slate-50 rounded-2xl mb-8">
              <Award className="mx-auto text-amber-500 mb-2" size={48} />
              <h3 className="text-xl font-bold text-slate-800">เสร็จสิ้นการทดสอบ!</h3>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-brand-600">{score}</span>
                <span className="text-slate-400 font-light text-xl">/ {quiz.questions.length} คะแนน</span>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                คิดเป็น {Math.round((score / quiz.questions.length) * 100)}% ของเนื้อหาทั้งหมด
              </p>
            </div>

            {/* Explanations List */}
            <h4 className="font-semibold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2">เฉลยพร้อมอธิบายคำตอบอย่างละเอียด</h4>
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 mb-8">
              {quiz.questions.map((q, qIdx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isCorrect ? <Check size={12} /> : <X size={12} />}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{qIdx + 1}. {q.text}</p>
                        
                        <div className="mt-2.5 space-y-1 text-xs">
                          <p className="text-slate-500 flex items-center gap-1">
                            <span>คำตอบของคุณ:</span>
                            <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                              {userAns !== undefined ? `${String.fromCharCode(65 + userAns)}) ${q.options[userAns]}` : 'ไม่ได้ตอบ'}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-slate-500 flex items-center gap-1">
                              <span>คำตอบที่ถูกต้อง:</span>
                              <span className="text-emerald-600 font-semibold">
                                {String.fromCharCode(65 + q.correctAnswer)}) {q.options[q.correctAnswer]}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-700 block mb-1">💡 คำอธิบาย:</span>
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Score Button */}
            <div className="border-t border-slate-100 pt-4 flex gap-3 justify-end">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-xl text-sm transition-all cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>ทดสอบใหม่</span>
              </button>
              <button
                onClick={handleSubmitAttempt}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคะแนนและปิด'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
