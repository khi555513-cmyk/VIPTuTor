
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AccountTier, DailyUsage } from '../types';
import { User, Mail, Phone, Target, Camera, Save, CreditCard, LogOut, Crown, Star, CheckCircle, Zap, Shield, ShoppingCart, Loader2, MessageCircle, AlertTriangle, Key, Edit2, ShieldCheck, RefreshCw, Lock, ChevronDown, ChevronUp, Globe, Sparkles } from 'lucide-react';
import { TIER_LIMITS, SUBSCRIPTION_PACKAGES, ZALO_CONSULTATION_URL, ACTIVATION_CODES } from '../constants';

interface UserProfileProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  dailyUsage: DailyUsage;
  onCancelSubscription: () => void;
  onResetApp: () => void;
  onManageApiKey: () => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ 
  profile, 
  onUpdateProfile,
  dailyUsage,
  onCancelSubscription,
  onResetApp
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...profile }));
  }, [profile]);
  
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activationMsg, setActivationMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        onUpdateProfile({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContactZalo = () => {
    window.open(ZALO_CONSULTATION_URL, '_blank');
  };
  
  const handleActivateCode = () => {
    setActivationMsg(null);
    const code = activationCode.trim().toUpperCase();
    if (!code) { setActivationMsg({ type: 'error', text: "Vui lòng nhập mã." }); return; }
    if (profile.usedCodes && profile.usedCodes.includes(code)) {
      setActivationMsg({ type: 'error', text: "Mã này đã được bạn sử dụng rồi." });
      return;
    }
    const config = ACTIVATION_CODES[code];
    if (config) {
       let newExpiry: number | null = null;
       const months = config.months;
       if (months >= 900) { newExpiry = null; } 
       else {
         const now = Date.now();
         const currentExpiry = (profile.subscriptionExpiry && profile.subscriptionExpiry > now) ? profile.subscriptionExpiry : now;
         const additionalTime = months * 30 * 24 * 60 * 60 * 1000;
         newExpiry = currentExpiry + additionalTime;
       }
       const updatedProfile: UserProfile = { ...formData, accountTier: config.tier, subscriptionExpiry: newExpiry, usedCodes: [...(profile.usedCodes || []), code] };
       setFormData(updatedProfile);
       onUpdateProfile(updatedProfile);
       setActivationMsg({ type: 'success', text: `Kích hoạt thành công gói ${config.tier.toUpperCase()} (${months >= 900 ? 'Vĩnh viễn' : months + ' tháng'}).` });
       setActivationCode('');
       setTimeout(() => { setActivationMsg(null); setIsActivationOpen(false); }, 3000);
    } else {
      setActivationMsg({ type: 'error', text: "Mã không hợp lệ." });
    }
  };

  const renderTierBadge = (tier: AccountTier) => {
    switch (tier) {
      case 'vip': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-shimmer whitespace-nowrap"> <Crown className="w-3 h-3 fill-white" /> PREMIUM VIP </div> );
      case 'pro': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap"> <Star className="w-3 h-3 fill-white" /> PRO STUDENT </div> );
      default: return ( <div className="flex items-center gap-1 bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"> BASIC PLAN </div> );
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="h-14 md:h-16 border-b flex items-center px-4 md:px-6 bg-white shadow-sm shrink-0">
        <h1 className="font-bold text-lg md:text-xl text-gray-800 truncate">Hồ sơ cá nhân & VIP</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* VIP Status Banner */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-40 h-40" /></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-indigo-500 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
                   <h3 className="font-black text-xl tracking-tight">KẾT NỐI VIP HOẠT ĐỘNG</h3>
                </div>
                <p className="text-indigo-200 text-sm max-w-md">Chào mừng bạn đã tham gia hệ thống Gia sư Siêu Cấp. Mọi tính năng AI đã được mở khóa hoàn toàn cho tài khoản của bạn.</p>
             </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-indigo-600 relative"></div>
            <div className="px-6 md:px-10 pb-10 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-8 gap-6">
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 rounded-3xl border-8 border-white bg-gray-200 overflow-hidden shadow-xl">
                    {formData.avatar ? ( <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300"> <User className="w-16 h-16" /> </div> )}
                  </div>
                  {isEditing && ( <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg"> <Camera className="w-5 h-5" /> </button> )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2 justify-center md:justify-start">
                     <h2 className="text-3xl font-black text-gray-900 tracking-tight">{profile.name}</h2>
                     <div className="mb-1">{renderTierBadge(profile.accountTier)}</div>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Học viên từ {new Date(profile.joinDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="mt-4 md:mt-0">
                   {!isEditing ? ( 
                     <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm tracking-widest transition-all active:scale-95"> CHỈNH SỬA </button> 
                   ) : ( 
                     <div className="flex gap-3"> 
                        <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold"> HỦY </button> 
                        <button onClick={handleSave} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm tracking-widest transition-all"> LƯU </button> 
                     </div> 
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Tin nhắn AI</p>
                <p className="text-2xl font-black text-indigo-600">{dailyUsage.messagesCount} <span className="text-sm font-medium text-gray-300">/ ∞</span></p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Đề thi đã tạo</p>
                <p className="text-2xl font-black text-purple-600">{dailyUsage.testsGenerated} <span className="text-sm font-medium text-gray-300">/ ∞</span></p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Mini Games</p>
                <p className="text-2xl font-black text-green-600">{dailyUsage.gamesPlayed} <span className="text-sm font-medium text-gray-300">/ ∞</span></p>
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="text-center sm:text-left">
                  <h3 className="font-black text-red-600 mb-1">KHÔI PHỤC DỮ LIỆU</h3>
                  <p className="text-xs text-gray-400 font-medium"> Xóa toàn bộ lịch sử trò chuyện và cài đặt cục bộ. </p>
               </div>
               <button onClick={onResetApp} className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-xs font-black tracking-widest transition-all"> 
                 RESET APP
               </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
