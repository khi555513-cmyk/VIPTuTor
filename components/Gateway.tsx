
import React from 'react';
import { Key, ShieldCheck, Sparkles, Zap, GraduationCap, Lock } from 'lucide-react';

interface GatewayProps {
  onAuthorize: () => void;
}

const Gateway: React.FC<GatewayProps> = ({ onAuthorize }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10 text-center space-y-8 animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6 animate-float">
             <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            VIP<span className="text-indigo-500">Tutor</span> <span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded ml-1 text-indigo-300">PRO</span>
          </h1>
          <p className="text-slate-400 text-sm">Hệ thống gia sư AI thông minh & bảo mật nhất</p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-left">
           <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <Zap className="w-5 h-5 text-indigo-400 mb-2" />
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Tốc độ</h3>
              <p className="text-slate-500 text-[10px] leading-relaxed">Phản hồi tức thì với Gemini 3 Pro.</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-green-400 mb-2" />
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Bảo mật</h3>
              <p className="text-slate-500 text-[10px] leading-relaxed">Dữ liệu được mã hóa đầu cuối AES-256.</p>
           </div>
        </div>

        {/* Action Section */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-inner space-y-6">
           <div className="flex items-center justify-center gap-3 text-indigo-300 text-sm font-medium">
              <Lock className="w-4 h-4" />
              <span>Yêu cầu xác thực API Key</span>
           </div>
           
           <p className="text-slate-400 text-xs leading-relaxed px-4">
             Để sử dụng dịch vụ VIP, bạn cần kết nối API Key từ dự án GCP của mình. Hệ thống sẽ ghi nhớ Key cho lần sử dụng sau.
           </p>

           <button 
             onClick={onAuthorize}
             className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"
           >
              <Key className="w-6 h-6" />
              Kết nối & Bắt đầu
           </button>
           
           <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <Sparkles className="w-3 h-3" />
              Harriss Studio • AI Powered
           </div>
        </div>

        <p className="text-slate-600 text-[10px]">
           By clicking Start, you agree to our Terms of Service regarding Gemini API usage.
        </p>
      </div>
    </div>
  );
};

export default Gateway;
