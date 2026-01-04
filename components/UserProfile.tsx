
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
    
    // Kiểm tra nếu mã đã từng được sử dụng trên tài khoản này
    if (profile.usedCodes && profile.usedCodes.includes(code)) {
      setActivationMsg({ type: 'error', text: "Mã này đã được bạn sử dụng rồi." });
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
       setActivationMsg({ type: 'success', text: `Kích hoạt thành công gói ${config.tier.toUpperCase()}!` });
       setActivationCode('');
       setTimeout(() => { setActivationMsg(null); setIsActivationOpen(false); }, 3000);
    } else {
      setActivationMsg({ type: 'error', text: "Mã không hợp lệ hoặc đã hết hạn." });
    }
  };

  const renderTierBadge = (tier: AccountTier) => {
    switch (tier) {
      case 'vip': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-shimmer whitespace-nowrap"> <Crown className="w-3 h-3 fill-white" /> PREMIUM VIP </div> );
      case 'pro': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap"> <Star className="w-3 h-3 fill-white" /> PRO STUDENT </div> );
      default: return ( <div className="flex items-center gap-1 bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"> BASIC PLAN </div> );
    }
  };

  const limits = TIER_LIMITS[profile.accountTier];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="h-14 md:h-16 border-b flex items-center px-4 md:px-6 bg-white shadow-sm shrink-0">
        <h1 className="font-bold text-lg md:text-xl text-gray-800 truncate">Hồ sơ cá nhân & VIP</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* VIP Status Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/10">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Crown className="w-64 h-64" /></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-500/20 backdrop-blur rounded-2xl border border-white/20"><ShieldCheck className="w-8 h-8 text-indigo-300" /></div>
                    <div>
                      <h3 className="font-black text-2xl tracking-tight uppercase">Tài khoản {profile.accountTier}</h3>
                      <p className="text-indigo-300 text-xs font-bold tracking-widest uppercase mt-0.5">Hệ thống AI VIP PRO v2.4</p>
                    </div>
                  </div>
                  <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
                    {profile.accountTier === 'basic' 
                      ? 'Bạn đang dùng bản giới hạn. Nâng cấp ngay để mở khóa toàn bộ quyền năng AI!' 
                      : 'Chào mừng bạn đến với thế giới học tập không giới hạn. Mọi tính năng cao cấp đã được kích hoạt.'}
                  </p>
                </div>
                {profile.accountTier !== 'basic' && (
                  <button onClick={onCancelSubscription} className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-5 py-3 rounded-2xl text-xs font-black tracking-widest transition-all active:scale-95">
                    HỦY GÓI CƯỚC
                  </button>
                )}
             </div>
          </div>

          {/* Usage Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><MessageCircle className="w-5 h-5" /></div>
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tin nhắn AI</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{dailyUsage.messagesCount} <span className="text-sm font-medium text-gray-300">/ {limits.messages > 9000 ? '∞' : limits.messages}</span></p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                   <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${Math.min((dailyUsage.messagesCount/limits.messages)*100, 100)}%` }}></div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Sparkles className="w-5 h-5" /></div>
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đề thi VIP</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{dailyUsage.testsGenerated} <span className="text-sm font-medium text-gray-300">/ {limits.tests > 9000 ? '∞' : limits.tests}</span></p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                   <div className="bg-purple-600 h-full transition-all duration-500" style={{ width: `${Math.min((dailyUsage.testsGenerated/limits.tests)*100, 100)}%` }}></div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-green-50 rounded-xl text-green-600"><Zap className="w-5 h-5" /></div>
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mini Games</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{dailyUsage.gamesPlayed} <span className="text-sm font-medium text-gray-300">/ {limits.games > 9000 ? '∞' : limits.games}</span></p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                   <div className="bg-green-600 h-full transition-all duration-500" style={{ width: `${Math.min((dailyUsage.gamesPlayed/limits.games)*100, 100)}%` }}></div>
                </div>
             </div>
          </div>

          {/* Pricing & Activation Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-6 md:p-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div> 
                  <h3 className="font-black text-gray-900 flex items-center gap-3 text-2xl"> 
                    <ShoppingCart className="w-7 h-7 text-indigo-600" /> 
                    Bảng Giá Kích Hoạt 
                  </h3> 
                  <p className="text-sm text-gray-400 mt-1 font-medium italic">Liên hệ Admin qua Zalo để nhận mã ưu đãi VIP ngay hôm nay.</p> 
                </div>
                <button onClick={() => setIsActivationOpen(!isActivationOpen)} className="w-full md:w-auto bg-indigo-50 text-indigo-700 px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-indigo-100 flex items-center justify-center gap-3 border-2 border-indigo-100 transition-all active:scale-95"> 
                  <Key className="w-5 h-5" /> {isActivationOpen ? 'ĐÓNG NHẬP MÃ' : 'NHẬP MÃ KÍCH HOẠT'} 
                </button>
             </div>
             
             {isActivationOpen && ( 
               <div className="mb-10 bg-indigo-50/50 p-6 md:p-8 rounded-[2rem] border-4 border-dashed border-indigo-100 animate-pop-in relative overflow-hidden"> 
                 <div className="absolute -top-10 -right-10 p-2 opacity-5"> <Key className="w-48 h-48 text-indigo-600" /> </div> 
                 <label className="block text-sm font-black text-indigo-900 mb-4 uppercase tracking-widest">Mã kích hoạt nhận từ Zalo:</label> 
                 <div className="flex flex-col sm:flex-row gap-3 relative z-10"> 
                   <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} placeholder="Nhập mã code tại đây..." className="flex-1 p-5 border-2 border-indigo-200 rounded-2xl uppercase font-mono text-lg tracking-[0.2em] outline-none shadow-inner focus:border-indigo-500 bg-white" /> 
                   <button onClick={handleActivateCode} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 sm:py-0 rounded-2xl font-black tracking-widest transition-all shadow-xl shadow-indigo-900/20 active:scale-95"> KÍCH HOẠT </button> 
                 </div> 
                 {activationMsg && ( 
                   <div className={`mt-5 text-sm flex items-center gap-3 font-bold px-4 py-3 rounded-xl ${activationMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}> 
                     {activationMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} 
                     {activationMsg.text} 
                   </div> 
                 )} 
               </div> 
             )}

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"> 
               {SUBSCRIPTION_PACKAGES.map((pkg) => { 
                 const isCurrent = profile.accountTier === pkg.tier;
                 const isBasic = pkg.tier === 'basic';
                 
                 return ( 
                   <div key={pkg.id} className={`relative flex flex-col p-6 rounded-[2.5rem] border-2 transition-all hover:-translate-y-2 hover:shadow-2xl ${isCurrent ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-100 bg-white'} ${pkg.isPopular ? 'ring-4 ring-indigo-500/10' : ''}`}> 
                     {pkg.isLifetime && <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10 animate-bounce">VĨNH VIỄN</div>} 
                     {pkg.isPopular && <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10">BÁN CHẠY</div>} 
                     
                     <div className="mb-4"> 
                       <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{pkg.name}</h4> 
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full inline-block uppercase tracking-widest ${pkg.tier === 'vip' ? 'bg-amber-100 text-amber-700' : isBasic ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}> 
                         Gói {pkg.tier.toUpperCase()} 
                       </span> 
                     </div> 
                     
                     <div className="mb-6"> 
                       <span className="text-2xl font-black text-gray-900">{pkg.priceVND > 0 ? `${pkg.priceVND.toLocaleString()}đ` : 'Miễn Phí'}</span> 
                       <span className="text-[10px] text-gray-400 font-bold block uppercase mt-1"> 
                         {pkg.isLifetime ? 'Thanh toán 1 lần' : pkg.durationMonths > 0 ? `/ ${pkg.durationMonths} tháng` : 'Mặc định'} 
                       </span> 
                     </div> 
                     
                     <ul className="text-xs text-gray-600 space-y-3 mb-8 flex-1"> 
                       {pkg.features.map((f, i) => ( 
                         <li key={i} className="flex items-start gap-2.5"> 
                           <CheckCircle className={`w-4 h-4 shrink-0 ${isBasic ? 'text-gray-300' : 'text-green-500'}`} /> 
                           <span className="font-medium leading-tight">{f}</span> 
                         </li> 
                       ))} 
                     </ul> 
                     
                     {isCurrent ? (
                       <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-xs tracking-widest border border-gray-200 text-center uppercase"> 
                         ĐANG SỬ DỤNG 
                       </div>
                     ) : !isBasic ? ( 
                       <button onClick={handleContactZalo} className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${pkg.tier === 'vip' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:brightness-110' : 'bg-indigo-600 text-white hover:bg-indigo-700'} `} > 
                         <MessageCircle className="w-4 h-4" /> MUA NGAY 
                       </button> 
                     ) : ( 
                       <button disabled className="w-full py-4 bg-gray-50 text-gray-300 rounded-2xl font-black text-xs tracking-widest border border-gray-100 text-center uppercase"> 
                         BẢN MIỄN PHÍ 
                       </button> 
                     )} 
                   </div> 
                 ); 
               })} 
             </div>
          </div>

          {/* Dangerous Zone */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-red-50 p-6 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="text-center sm:text-left">
                  <h3 className="font-black text-red-600 mb-1 text-lg">VÙNG NGUY HIỂM</h3>
                  <p className="text-xs text-gray-400 font-medium"> Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu học tập và cấu hình VIP trên trình duyệt này. </p>
               </div>
               <button onClick={onResetApp} className="w-full sm:w-auto px-10 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-xs font-black tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"> 
                 <LogOut className="w-4 h-4" /> RESET TOÀN BỘ APP 
               </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
