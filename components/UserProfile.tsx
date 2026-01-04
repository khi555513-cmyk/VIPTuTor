

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AccountTier, DailyUsage } from '../types';
import { User, Camera, Save, CreditCard, LogOut, Crown, Star, CheckCircle, Zap, MessageCircle, AlertTriangle, Key, ShieldCheck, ShoppingCart, Sparkles } from 'lucide-react';
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

  const handleBuyNow = (pkgName: string) => {
    // Mở Zalo để mua gói
    window.open(ZALO_CONSULTATION_URL, '_blank');
  };
  
  const handleActivateCode = () => {
    setActivationMsg(null);
    const code = activationCode.trim().toUpperCase();
    if (!code) { setActivationMsg({ type: 'error', text: "Vui lòng nhập mã." }); return; }
    
    // Kiểm tra nếu mã đã từng được sử dụng trên tài khoản này
    if (profile.usedCodes && profile.usedCodes.includes(code)) {
      setActivationMsg({ type: 'error', text: "Mã này đã được sử dụng." });
      return;
    }

    const config = ACTIVATION_CODES[code];
    if (config) {
       let newExpiry: number | null = null;
       const months = config.months;
       
       if (months >= 900) { 
         newExpiry = null; // Vĩnh viễn
       } else {
         const now = Date.now();
         const currentExpiry = (profile.subscriptionExpiry && profile.subscriptionExpiry > now) ? profile.subscriptionExpiry : now;
         const additionalTime = months * 30 * 24 * 60 * 60 * 1000;
         newExpiry = currentExpiry + additionalTime;
       }

       const updatedProfile: UserProfile = { 
         ...formData, 
         accountTier: config.tier, 
         subscriptionExpiry: newExpiry, 
         usedCodes: [...(profile.usedCodes || []), code] // Gạch mã đi (lưu vào list đã dùng)
       };
       
       setFormData(updatedProfile);
       onUpdateProfile(updatedProfile);
       setActivationMsg({ type: 'success', text: `Đã kích hoạt ${config.tier.toUpperCase()}!` });
       setActivationCode('');
       setTimeout(() => { setActivationMsg(null); setIsActivationOpen(false); }, 2000);
    } else {
      setActivationMsg({ type: 'error', text: "Mã không hợp lệ." });
    }
  };

  const limits = TIER_LIMITS[profile.accountTier];

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="h-12 border-b flex items-center px-4 bg-white shadow-sm shrink-0">
        <h1 className="font-bold text-gray-800 text-sm md:text-base">Hồ sơ & Gói cước</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* Top Section: Avatar & Stats Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center">
             <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-indigo-100">
                   {formData.avatar ? ( <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> ) : ( <User className="w-full h-full p-4 text-gray-400" /> )}
                </div>
                {isEditing && ( <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-sm"><Camera className="w-3 h-3" /></button> )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
             </div>
             
             <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-2">
                   {isEditing ? (
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border rounded px-2 py-1 text-sm font-bold" />
                   ) : (
                      <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
                   )}
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${profile.accountTier === 'vip' ? 'bg-amber-100 text-amber-700' : profile.accountTier === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {profile.accountTier} Member
                   </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Tham gia: {new Date(profile.joinDate).toLocaleDateString('vi-VN')}</p>
             </div>

             <div className="flex gap-2">
                {!isEditing ? (
                   <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">Sửa</button>
                ) : (
                   <><button onClick={() => setIsEditing(false)} className="px-3 py-2 text-xs font-bold text-gray-500">Hủy</button><button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Lưu</button></>
                )}
             </div>
          </div>

          {/* Usage Compact */}
          <div className="grid grid-cols-3 gap-3">
             {[
               { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Tin nhắn', val: dailyUsage.messagesCount, max: limits.messages },
               { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Đề thi', val: dailyUsage.testsGenerated, max: limits.tests },
               { icon: Zap, color: 'text-green-600', bg: 'bg-green-50', label: 'Game', val: dailyUsage.gamesPlayed, max: limits.games }
             ].map((stat, i) => (
               <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className={`p-1.5 rounded-lg mb-1 ${stat.bg} ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                  <span className="text-lg font-black text-gray-800 leading-none">{stat.val}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/ {stat.max > 9000 ? '∞' : stat.max}</span>
               </div>
             ))}
          </div>

          {/* Activation Area */}
          <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-3">
             <div className="flex-1">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2"><Key className="w-4 h-4" /> Kích hoạt mã Code</h3>
                <p className="text-[10px] text-indigo-400 mt-0.5">Nhập mã VIP/Pro bạn đã nhận được từ Zalo.</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="PRO-XXXX..." 
                  className="flex-1 sm:w-40 px-3 py-2 text-sm border border-indigo-200 rounded-lg uppercase placeholder-indigo-200 focus:outline-none focus:border-indigo-500"
                />
                <button onClick={handleActivateCode} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 whitespace-nowrap">
                   Kích hoạt
                </button>
             </div>
          </div>
          {activationMsg && (
             <div className={`text-xs px-3 py-2 rounded-lg font-medium text-center ${activationMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {activationMsg.text}
             </div>
          )}

          {/* Pricing Grid Compact */}
          <div>
             <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Gói Dịch Vụ</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
               {SUBSCRIPTION_PACKAGES.map((pkg) => {
                 const isCurrent = profile.accountTier === pkg.tier;
                 const isBasic = pkg.tier === 'basic';
                 return (
                   <div key={pkg.id} className={`p-3 rounded-xl border transition-all flex flex-col relative bg-white hover:shadow-md ${isCurrent ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'} ${pkg.isPopular ? 'shadow-indigo-100' : ''}`}>
                      {pkg.isPopular && <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">HOT</span>}
                      
                      <div className="mb-2">
                         <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${pkg.tier === 'vip' ? 'bg-amber-100 text-amber-700' : isBasic ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                           {pkg.tier}
                         </span>
                         <h4 className="font-bold text-gray-800 text-sm mt-1">{pkg.name}</h4>
                      </div>
                      
                      <div className="mb-3">
                         <span className="text-lg font-black text-gray-900">{pkg.priceVND > 0 ? (pkg.priceVND/1000).toLocaleString() + 'k' : 'Free'}</span>
                      </div>

                      <ul className="space-y-1 mb-3 flex-1">
                        {pkg.features.slice(0, 2).map((f, i) => (
                          <li key={i} className="text-[10px] text-gray-500 flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> <span className="line-clamp-1">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrent ? (
                        <div className="py-2 bg-gray-50 text-gray-400 text-[10px] font-bold text-center rounded-lg uppercase">Đang dùng</div>
                      ) : !isBasic ? (
                        <button onClick={() => handleBuyNow(pkg.name)} className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold text-center rounded-lg uppercase transition-colors">Mua Ngay</button>
                      ) : (
                        <div className="py-2 bg-gray-50 text-gray-300 text-[10px] font-bold text-center rounded-lg uppercase">Mặc định</div>
                      )}
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
             {profile.accountTier !== 'basic' && (
               <button onClick={onCancelSubscription} className="text-red-500 text-xs font-medium hover:underline">Hủy gói cước hiện tại</button>
             )}
             <button onClick={onResetApp} className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1 ml-auto"><LogOut className="w-3 h-3" /> Reset App</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileView;