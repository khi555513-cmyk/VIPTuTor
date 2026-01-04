
import React, { useState } from 'react';
import { Key, CheckCircle, AlertTriangle, Loader2, ShieldCheck, ExternalLink, Save } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKey.trim();
    
    if (!key) {
      setError("Vui lòng nhập API Key.");
      return;
    }

    setIsValidating(true);
    setError('');

    const isValid = await validateApiKey(key);

    if (isValid) {
      if (rememberMe) {
        // Save permanently
        localStorage.setItem('gemini_api_key', key);
        sessionStorage.removeItem('gemini_api_key'); // Clear session to avoid conflicts
      } else {
        // Save only for this tab/session
        sessionStorage.setItem('gemini_api_key', key);
        localStorage.removeItem('gemini_api_key'); // Ensure no old key remains
      }
      
      setIsValidating(false);
      onSuccess();
    } else {
      setIsValidating(false);
      setError("API Key không hợp lệ hoặc đã hết hạn mức. Vui lòng kiểm tra lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
           <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Key className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-1">Cấu Hình Kết Nối</h2>
           <p className="text-indigo-100 text-sm">Nhập Google Gemini API Key để bắt đầu</p>
        </div>

        <div className="p-6 md:p-8">
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">API Key của bạn</label>
                <div className="relative">
                   <ShieldCheck className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                   <input 
                     type="password" 
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     placeholder="AIzaSy..."
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                     autoFocus
                   />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                    {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                 </div>
                 <span className="text-sm text-gray-600 select-none">Ghi nhớ API Key cho lần sau</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-slide-up">
                   <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                   <span>{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isValidating}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...
                   </>
                ) : (
                   <>
                     Kiểm tra & Bắt đầu <CheckCircle className="w-5 h-5" />
                   </>
                )}
              </button>
           </form>

           <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">Chưa có API Key?</p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Lấy API Key miễn phí từ Google <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[10px] text-gray-400 mt-4">
                * Key được lưu an toàn trên trình duyệt của bạn (LocalStorage/SessionStorage).
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
