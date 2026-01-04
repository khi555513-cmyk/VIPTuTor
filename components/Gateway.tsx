
import React, { useState } from 'react';
import { Key, ShieldCheck, Sparkles, Zap, GraduationCap, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface GatewayProps {
  onAuthorized: (key: string) => void;
}

const Gateway: React.FC<GatewayProps> = ({ onAuthorized }) => {
  const [keyInput, setKeyInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!keyInput.trim()) {
      setError("Vui lòng nhập API Key.");
      return;
    }

    setError(null);
    setIsValidating(true);

    const isValid = await validateApiKey(keyInput.trim());
    
    if (isValid) {
      onAuthorized(keyInput.trim());
    } else {
      setError("API Key không hợp lệ hoặc bị cấm tại vùng của bạn.");
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[150px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] opacity-10 animate-pulse"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 text-center space-y-8 animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-700 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] mb-8 animate-float">
             <GraduationCap className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
            VIP<span className="text-indigo-500">Tutor</span> <span className="text-xs font-bold bg-indigo-500/20 px-2 py-1 rounded-md text-indigo-400 align-top ml-1">AI 3.0</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">Khám phá sức mạnh tri thức không giới hạn</p>
        </div>

        {/* Action Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl space-y-8">
           <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-[0.2em]">
                <Lock className="w-4 h-4" />
                <span>Xác thực bảo mật</span>
              </div>
              <p className="text-slate-500 text-sm">Nhập hoặc dán Google Gemini API Key để bắt đầu phiên học tập.</p>
           </div>

           <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                   <Key className={`w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-slate-500 group-focus-within:text-indigo-500'}`} />
                </div>
                <input 
                  type="password"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setError(null); }}
                  placeholder="AIzaSyB..."
                  className={`w-full bg-slate-800/50 border-2 pl-14 pr-5 py-5 rounded-2xl text-white font-mono text-sm outline-none transition-all placeholder:text-slate-700 ${error ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5 focus:border-indigo-500 focus:bg-slate-800 shadow-inner'}`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-slide-up bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                   <AlertCircle className="w-4 h-4" />
                   {error}
                </div>
              )}

              <button 
                onClick={handleValidate}
                disabled={isValidating || !keyInput}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    Kích hoạt Gia sư AI
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
           </div>
           
           <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 text-xs font-bold hover:text-indigo-300 transition-colors flex items-center justify-center gap-2">
                 Chưa có API Key? Lấy miễn phí tại Google AI Studio <ArrowRight className="w-3 h-3" />
              </a>
              <div className="flex items-center justify-center gap-4 text-slate-600">
                 <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold uppercase tracking-wider">End-to-End Encrypted</span></div>
                 <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                 <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold uppercase tracking-wider">Low Latency</span></div>
              </div>
           </div>
        </div>

        <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">
           Harriss Studio • Powered by Google Gemini 3 Pro
        </p>
      </div>
    </div>
  );
};

export default Gateway;
