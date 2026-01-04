
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Clock, Upload, CheckCircle, AlertCircle, 
  Printer, GraduationCap, X, BookOpen, Brain, Play, Maximize2, Download, ArrowLeft, ArrowRight, Layout
} from 'lucide-react';
import { TestConfig, ExamData, ExamResult } from '../types';
import { GoogleGenAI } from "@google/genai";
import { TEST_GENERATOR_PROMPT, TEST_GRADER_PROMPT } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';
import confetti from 'canvas-confetti';

interface TestPrepSystemProps {
  onBack: () => void;
  checkLimit: () => boolean;
  incrementUsage: () => void;
  onApiError?: () => void;
}

const TestPrepSystem: React.FC<TestPrepSystemProps> = ({ 
  onBack,
  checkLimit,
  incrementUsage,
  onApiError
}) => {
  const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'countdown' | 'testing' | 'grading' | 'result'>('config');
  const [config, setConfig] = useState<TestConfig>({ gradeLevel: 'Lớp 12', examFormat: 'THPT Quốc Gia', topics: '', duration: 45, referenceContent: '' });
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(3);
  const [result, setResult] = useState<ExamResult | null>(null);
  
  // Split Screen Ref
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const startGeneration = async () => {
    if (!checkLimit()) { alert("🔒 Hết lượt tạo đề thi!"); return; }
    setStep('generating');
    incrementUsage();
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Yêu cầu tạo đề thi: Trình độ: ${config.gradeLevel}; Định dạng: ${config.examFormat}; Thời gian: ${config.duration} phút; Chủ đề: ${config.topics || "Tổng hợp"}. ${config.referenceContent ? "Dựa trên tài liệu: " + config.referenceContent.slice(0, 3000) : ""}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: { systemInstruction: TEST_GENERATOR_PROMPT, temperature: 0.5 }
      });
      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: ExamData = JSON.parse(jsonMatch[0]);
        setExamData(parsed);
        setTimeLeft(parsed.duration * 60); 
        setStep('preview');
      } else { throw new Error("Could not parse exam JSON"); }
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi tạo đề thi.");
      setStep('config');
    }
  };

  const handleStartExam = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen().catch(() => {}); }
    setCountdown(3);
    setStep('countdown');
  };

  useEffect(() => {
    if (step === 'countdown') {
      const timer = setInterval(() => { setCountdown(prev => { if (prev <= 1) { clearInterval(timer); setStep('testing'); return 3; } return prev - 1; }); }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'testing') {
      const timer = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); submitExam(); return 0; } return prev - 1; }); }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleAnswerChange = (qId: number, value: string) => { setUserAnswers(prev => ({ ...prev, [qId]: value })); };
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  const submitExam = async () => {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); }
    setStep('grading');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Dữ liệu bài làm: ${JSON.stringify({ examData, userAnswers })}. Chấm điểm JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [{ text: prompt }] },
        config: { systemInstruction: TEST_GRADER_PROMPT, temperature: 0.2 }
      });
      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: ExamResult = JSON.parse(jsonMatch[0]);
        setResult(parsed);
        setStep('result');
        if (parsed.score >= 8) { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }
      } else { throw new Error("Grading JSON failed"); }
    } catch (e: any) {
      alert("Lỗi khi chấm bài.");
      setStep('result'); 
    }
  };

  // --- CONFIG STEP ---
  if (step === 'config') {
    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-3">
               <GraduationCap className="w-8 h-8" /> Luyện Thi Chuyên Sâu
            </h1>
            <p className="opacity-90 text-sm mt-1">Hệ thống tạo đề thi chuẩn Format mới nhất</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div> 
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Trình độ mục tiêu</label> 
                  <select value={config.gradeLevel} onChange={(e) => setConfig({...config, gradeLevel: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"> 
                     <option>Lớp 9 (Vào 10)</option> 
                     <option>Lớp 12 (THPT QG)</option> 
                     <option>TOEIC (450-990)</option> 
                     <option>IELTS (Academic)</option> 
                  </select> 
               </div>
               <div> 
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Thời gian (Phút)</label> 
                  <input type="number" value={config.duration} onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none" /> 
               </div>
               <div className="md:col-span-2"> 
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Chủ đề tập trung (Tùy chọn)</label> 
                  <input type="text" placeholder="VD: Mệnh đề quan hệ, Từ vựng môi trường..." value={config.topics} onChange={(e) => setConfig({...config, topics: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none" /> 
               </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onBack} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
              <button onClick={startGeneration} className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                 <Brain className="w-5 h-5" /> Bắt Đầu Tạo Đề
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING STEPS ---
  if (step === 'generating' || step === 'grading') {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-24 h-24 relative mb-6">
           <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
           <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
           <Brain className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
           {step === 'generating' ? 'AI Đang Thiết Kế Đề Thi...' : 'Đang Chấm Điểm & Phân Tích...'}
        </h2>
        <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát, không tắt trình duyệt.</p>
      </div>
    );
  }

  if (step === 'countdown') {
    return (
      <div className="fixed inset-0 z-[100] bg-indigo-900 flex items-center justify-center">
        <div className="text-white text-[10rem] font-black animate-ping">{countdown}</div>
      </div>
    ); 
  }

  // --- TESTING & RESULT MODES (SPLIT SCREEN) ---
  const isResultMode = step === 'result';
  const isPreview = step === 'preview';

  return (
    <div className="h-full bg-gray-100 flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
         <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <h2 className="font-bold text-gray-800 truncate">{examData?.title}</h2>
         </div>
         
         {step === 'testing' && (
           <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-lg border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {formatTime(timeLeft)}
           </div>
         )}

         <div className="flex gap-2">
            {isPreview && (
              <button onClick={handleStartExam} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 active:scale-95 text-sm flex items-center gap-2">
                 <Play className="w-4 h-4" /> Làm Bài
              </button>
            )}
            {step === 'testing' && (
              <button onClick={() => { if(confirm("Nộp bài ngay?")) submitExam(); }} className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 active:scale-95 text-sm">
                 Nộp Bài
              </button>
            )}
            {isResultMode && (
              <div className="flex items-center gap-2">
                 <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-xl border border-indigo-200">{result?.score}đ</div>
              </div>
            )}
         </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 flex overflow-hidden">
         {/* LEFT PANEL: Reading Passage / Reference (Optional) */}
         {examData?.sections.some(s => s.passageContent) && (
            <div className="w-1/2 h-full overflow-y-auto border-r border-gray-200 bg-white p-6 md:p-8 custom-scrollbar hidden md:block">
               <div className="max-w-2xl mx-auto">
                 <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 sticky top-0 bg-white py-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Tài liệu đọc hiểu
                 </h3>
                 {examData.sections.map((sec, idx) => (
                    sec.passageContent && (
                       <div key={idx} className="mb-8 prose prose-slate prose-sm max-w-none">
                          <h4 className="font-bold text-gray-800 mb-2">{sec.title}</h4>
                          <MarkdownRenderer content={sec.passageContent} />
                          <hr className="my-6 border-gray-100"/>
                       </div>
                    )
                 ))}
               </div>
            </div>
         )}

         {/* RIGHT PANEL: Questions */}
         <div className={`h-full overflow-y-auto bg-gray-50 p-4 md:p-8 custom-scrollbar ${examData?.sections.some(s => s.passageContent) ? 'w-full md:w-1/2' : 'w-full max-w-4xl mx-auto'}`}>
            {isResultMode && result && (
               <div className="mb-8 bg-white rounded-xl p-6 border border-indigo-100 shadow-sm animate-fade-in">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600"/> Nhận xét của giáo viên</h3>
                  <p className="text-gray-600 italic text-sm leading-relaxed border-l-4 border-indigo-500 pl-4 py-1">{result.teacherComment}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                     <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <span className="text-xs font-bold text-green-700 uppercase">Số câu đúng</span>
                        <p className="text-xl font-black text-green-800">{result.correctCount}/{result.totalQuestions}</p>
                     </div>
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="text-xs font-bold text-blue-700 uppercase">Điểm số</span>
                        <p className="text-xl font-black text-blue-800">{result.score}</p>
                     </div>
                  </div>
               </div>
            )}

            {examData?.sections.map((section, sIdx) => (
               <div key={sIdx} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded uppercase">Part {sIdx + 1}</span>
                     <h3 className="font-bold text-gray-800">{section.title}</h3>
                  </div>

                  {/* Mobile-only passage view if needed, or inline passage */}
                  {(!examData.sections.some(s => s.passageContent) || window.innerWidth < 768) && section.passageContent && (
                     <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 text-sm text-gray-700 shadow-sm md:hidden">
                        <MarkdownRenderer content={section.passageContent} />
                     </div>
                  )}

                  <div className="space-y-4">
                     {section.questions.map((q, qIdx) => {
                        const globalQIdx = examData.sections.slice(0, sIdx).reduce((acc, s) => acc + s.questions.length, 0) + qIdx + 1;
                        const userAnswer = userAnswers[globalQIdx];
                        const isCorrect = isResultMode ? userAnswer === q.correctAnswer : null;

                        return (
                           <div key={q.id} className={`bg-white p-4 rounded-xl border transition-all ${isResultMode ? (isCorrect ? 'border-green-200 ring-1 ring-green-200' : 'border-red-200 ring-1 ring-red-200') : 'border-gray-200 hover:border-indigo-200 shadow-sm'}`}>
                              <div className="flex gap-3 mb-3">
                                 <span className="shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">{globalQIdx}</span>
                                 <div className="text-sm text-gray-800 font-medium leading-relaxed">
                                    <MarkdownRenderer content={q.content} />
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                                 {q.options?.map((opt, oIdx) => {
                                    const key = String.fromCharCode(65 + oIdx);
                                    const isSelected = userAnswer === key;
                                    const isKeyCorrect = q.correctAnswer === key;
                                    
                                    let btnClass = "border-gray-100 hover:bg-gray-50 text-gray-600";
                                    if (!isResultMode && isSelected) btnClass = "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500";
                                    if (isResultMode) {
                                       if (isKeyCorrect) btnClass = "border-green-500 bg-green-50 text-green-800 font-bold ring-1 ring-green-500";
                                       else if (isSelected) btnClass = "border-red-300 bg-red-50 text-red-800 line-through opacity-70";
                                       else btnClass = "border-gray-100 opacity-50";
                                    }

                                    return (
                                       <button 
                                          key={oIdx}
                                          disabled={isResultMode || isPreview}
                                          onClick={() => handleAnswerChange(globalQIdx, key)}
                                          className={`text-left text-sm p-3 rounded-lg border transition-all flex items-start gap-2 ${btnClass}`}
                                       >
                                          <span className="font-bold text-[10px] uppercase shrink-0 mt-0.5">{key}.</span>
                                          <span>{opt}</span>
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default TestPrepSystem;
