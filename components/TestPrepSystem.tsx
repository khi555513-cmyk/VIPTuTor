
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Clock, Upload, CheckCircle, AlertCircle, 
  Printer, GraduationCap, X, BookOpen, Brain, Play, Maximize2, Download
} from 'lucide-react';
import { TestConfig, ExamData, ExamResult } from '../types';
import { GoogleGenAI } from "@google/genai";
import mammoth from 'mammoth';
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
  const [config, setConfig] = useState<TestConfig>({ gradeLevel: 'Lớp 12', examFormat: 'THPT Quốc Gia', topics: '', duration: 60, referenceContent: '' });
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(3);
  const [result, setResult] = useState<ExamResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startGeneration = async () => {
    if (!checkLimit()) { alert("🔒 Hết lượt tạo đề thi!"); return; }
    setStep('generating');
    incrementUsage();
    try {
      // CRITICAL: Always use process.env.API_KEY directly and create instance right before calling.
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Yêu cầu tạo đề thi: Trình độ: ${config.gradeLevel}; Định dạng: ${config.examFormat}; Thời gian: ${config.duration} phút; Chủ đề: ${config.topics || "Tổng hợp"}. ${config.referenceContent ? "Dựa trên tài liệu: " + config.referenceContent.slice(0, 3000) : ""}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: { systemInstruction: TEST_GENERATOR_PROMPT, temperature: 0.5 }
      });
      // Access .text property directly.
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
      if ((e?.message?.includes("Requested entity was not found") || e?.status === 404 || e?.status === 403) && onApiError) { onApiError(); }
      alert("Lỗi khi tạo đề thi. Vui lòng kiểm tra lại API Key.");
      setStep('config');
    }
  };

  const handleStartExam = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen().catch(() => {}); }
    setCountdown(3);
    setStep('countdown');
  };

  const handleExitFullScreen = () => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } };

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
    handleExitFullScreen();
    setStep('grading');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Dữ liệu bài làm: ${JSON.stringify({ examData, userAnswers })}. Chấm điểm theo format JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [{ text: prompt }] },
        config: { systemInstruction: TEST_GRADER_PROMPT, temperature: 0.2 }
      });
      // Access .text property directly.
      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: ExamResult = JSON.parse(jsonMatch[0]);
        setResult(parsed);
        setStep('result');
        if (parsed.score >= 8) { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }
      } else { throw new Error("Grading JSON failed"); }
    } catch (e: any) {
      console.error(e);
      if ((e?.message?.includes("Requested entity was not found") || e?.status === 404 || e?.status === 403) && onApiError) { onApiError(); }
      alert("Lỗi khi chấm bài.");
      setStep('result'); 
    }
  };

  const handleExportWord = () => {
    if (!examData) return;
    const content = document.getElementById('exam-paper-content')?.innerHTML;
    const preHtml = "<html><head><meta charset='utf-8'></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + content + postHtml;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${examData.title}.doc`;
    link.click();
  };

  const handlePrintPDF = () => { window.print(); };

  if (step === 'config') {
    return (
      <div className="h-full bg-slate-50 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-4 md:p-8 animate-fade-in my-auto">
          <div className="flex items-center gap-4 mb-6 md:mb-8 border-b pb-4 md:pb-6">
            <div className="bg-indigo-600 p-3 md:p-4 rounded-xl text-white shadow-lg shrink-0"> <GraduationCap className="w-6 h-6 md:w-8 md:h-8" /> </div>
            <div> <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">Hệ Thống Luyện Thi Pro</h1> <p className="text-gray-500 text-sm md:text-base">Thiết kế đề thi chuẩn 99% - Phân tích chuyên sâu</p> </div>
          </div>
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <div> <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trình độ / Lớp</label> <select value={config.gradeLevel} onChange={(e) => setConfig({...config, gradeLevel: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg"> <option>Lớp 9 (Luyện thi vào 10)</option> <option>Lớp 12 (Tốt nghiệp THPT)</option> <option>TOEIC</option> <option>IELTS</option> </select> </div>
               <div> <label className="block text-sm font-semibold text-gray-700 mb-1.5">Định dạng đề thi</label> <input type="text" value={config.examFormat} onChange={(e) => setConfig({...config, examFormat: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg" /> </div>
            </div>
            <div className="pt-4 flex flex-col md:flex-row gap-3 md:gap-4">
              <button onClick={onBack} className="w-full md:w-auto px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"> Hủy bỏ </button>
              <button onClick={startGeneration} className="w-full md:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"> <Brain className="w-5 h-5" /> Thiết Kế Đề Thi Ngay </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'generating' || step === 'grading') {
    return ( <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-6"> <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in"> <div className="relative w-20 h-20 mx-auto mb-6"> <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div> <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div> </div> <h2 className="text-xl font-bold text-gray-800 mb-2"> {step === 'generating' ? 'Đang Thiết Kế Đề Thi...' : 'AI Đang Chấm Bài...'} </h2> </div> </div> );
  }

  if (step === 'countdown') { return ( <div className="fixed inset-0 z-50 bg-indigo-900 flex items-center justify-center"> <div className="text-white text-9xl font-black animate-bounce"> {countdown} </div> </div> ); }

  const isPreviewMode = step === 'preview';
  const isTestingMode = step === 'testing';
  const isResultMode = step === 'result';

  return (
    <div className={`h-full bg-gray-100 overflow-y-auto flex flex-col items-center relative ${isTestingMode ? 'bg-slate-800' : ''}`}>
      {isPreviewMode && (
         <div className="sticky top-0 z-40 w-full bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center animate-fade-in">
            <div className="flex items-center gap-3"> <div className="bg-indigo-100 p-2 rounded-lg"> <FileText className="w-6 h-6 text-indigo-600" /> </div> <h2 className="font-bold text-gray-800">Xem Trước Đề Thi</h2> </div>
            <div className="flex gap-2"> <button onClick={handleExportWord} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm"> Word </button> <button onClick={handleStartExam} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg animate-pulse text-sm"> Làm Bài </button> </div>
         </div>
      )}
      {!isPreviewMode && (
        <div className="sticky top-0 z-40 w-full bg-slate-900 text-white px-6 py-3 shadow-md flex justify-between items-center">
           <div className="flex items-center gap-4"> <span className="font-bold text-lg">{examData?.title}</span> {isTestingMode && ( <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-full font-mono font-bold text-sm"> <Clock className="w-4 h-4" /> {formatTime(timeLeft)} </div> )} </div>
           <div className="flex gap-3"> {isResultMode && ( <button onClick={onBack} className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm border border-gray-600"> Thoát </button> )} {isTestingMode && ( <button onClick={submitExam} className="bg-green-600 text-white px-6 py-1.5 rounded-lg font-bold shadow-lg text-sm"> Nộp Bài </button> )} </div>
        </div>
      )}
      {isResultMode && result && (
        <div className="w-full max-w-5xl mt-6 bg-white rounded-xl shadow-lg border-t-4 border-indigo-600 p-6 animate-fade-in mx-4">
           <div className="flex gap-6"> <div className="text-left"> <div className="inline-block p-4 rounded-full bg-indigo-50 border-4 border-indigo-100 mb-2"> <span className="text-4xl font-black text-indigo-700">{result.score}</span> </div> <p className="font-bold text-gray-800">{result.correctCount}/{result.totalQuestions} Câu đúng</p> </div> <div className="flex-1 space-y-4"> <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"> <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-1"> <GraduationCap className="w-5 h-5 text-indigo-600" /> Lời phê giáo viên: </h4> <p className="text-gray-700 italic">"{result.teacherComment}"</p> </div> </div> </div>
        </div>
      )}
      <div id="exam-paper-content" className={`w-full max-w-5xl mx-auto bg-white shadow-md my-8 p-14 text-gray-900 leading-relaxed font-serif text-justify ${isPreviewMode ? 'pointer-events-none select-none' : ''}`}>
        <div className="border-b-2 border-black pb-4 mb-8 text-center"> <h1 className="text-2xl font-bold uppercase mb-2">{examData?.title}</h1> <p className="italic font-medium text-gray-700">{examData?.subtitle}</p> </div>
        {examData?.sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-10 section-container">
            <h2 className="font-bold text-lg mb-4 uppercase text-black border-b border-gray-300 pb-1"> {section.title} </h2>
            {section.passageContent && ( <div className="reading-box bg-gray-50 border border-gray-300 p-6 mb-6"> <MarkdownRenderer content={section.passageContent} /> </div> )}
            <div className="space-y-6">
              {section.questions.map((q, qIdx) => {
                const questionNumber = section.questions.reduce((acc, curr, currIdx) => currIdx < qIdx ? acc + 1 : acc, 0) + examData.sections.slice(0, sIdx).reduce((acc, s) => acc + s.questions.length, 0) + 1;
                const userAnswer = userAnswers[questionNumber];
                const isCorrect = isResultMode ? userAnswer === q.correctAnswer : null;
                return (
                  <div key={q.id} className="relative pl-1">
                    {isResultMode && ( <div className="absolute -left-8 top-1"> {isCorrect ? ( <CheckCircle className="w-6 h-6 text-green-600" /> ) : ( <X className="w-6 h-6 text-red-600" /> )} </div> )}
                    <div className="flex gap-2 mb-3 items-baseline"> <span className="font-bold text-lg">Q.{questionNumber}:</span> <div className="flex-1 text-lg"> <MarkdownRenderer content={q.content} /> </div> </div>
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 ml-2">
                        {q.options.map((opt, oIdx) => {
                          const key = String.fromCharCode(65 + oIdx); 
                          const isSelected = userAnswer === key;
                          const isKeyCorrect = q.correctAnswer === key;
                          let className = "flex items-start gap-2 p-1.5 rounded cursor-pointer ";
                          if (!isResultMode) { className += isSelected ? "bg-indigo-50 font-bold text-indigo-900" : "hover:bg-gray-50"; } 
                          else { if (isKeyCorrect) className += "bg-green-100 text-green-900 font-bold "; else if (isSelected && !isKeyCorrect) className += "bg-red-100 text-red-900 line-through "; else className += "opacity-60 "; }
                          return ( <div key={oIdx} onClick={() => !isResultMode && !isPreviewMode && handleAnswerChange(questionNumber, key)} className={className} > <span className={`w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-xs font-bold ${isSelected && !isResultMode ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-800'}`}> {key} </span> <span className="text-base pt-0.5">{opt}</span> </div> );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPrepSystem;
