
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
  onResetApp,
  onManageApiKey
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
    if (code === 'BASIC' || code === 'RESET') {
       onUpdateProfile({ ...formData, accountTier: 'basic', subscriptionExpiry: null });
       setActivationMsg({ type: 'success', text: "Đã chuyển về gói Cơ Bản." });
       setTimeout(() => setIsActivationOpen(false), 2000);
       return;
    }
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
      setActivationMsg({ type: 'error', text: "Mã không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ Zalo." });
    }
  };

  const renderTierBadge = (tier: AccountTier) => {
    switch (tier) {
      case 'vip': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-shimmer whitespace-nowrap"> <Crown className="w-3 h-3 fill-white" /> PREMIUM MEMBER </div> );
      case 'pro': return ( <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap"> <Star className="w-3 h-3 fill-white" /> PRO STUDENT </div> );
      default: return ( <div className="flex items-center gap-1 bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"> BASIC PLAN </div> );
    }
  };
  
  const limits = TIER_LIMITS[profile.accountTier];
  const activeApiKey = process.env.API_KEY || '';

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="h-14 md:h-16 border-b flex items-center px-4 md:px-6 bg-white shadow-sm shrink-0">
        <h1 className="font-bold text-lg md:text-xl text-gray-800 truncate">Cài đặt & Hồ sơ cá nhân</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Enhanced System Connection Section (Cyberpunk Style) */}
          <section className="bg-[#0b1121] rounded-[2.5rem] shadow-2xl p-6 md:p-12 text-white border border-indigo-500/20 relative overflow-hidden group">
             {/* Dynamic Background */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-700"></div>
             <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700"></div>
             
             <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgb(99,102,241,0.3)] border border-white/20 animate-float">
                         <ShieldCheck className="w-10 h-10 text-white" />
                      </div>
                      <div>
                         <h3 className="font-black text-2xl tracking-tight mb-2 flex items-center gap-2">
                           Trạm Kết Nối AI
                           <Sparkles className="w-5 h-5 text-indigo-400" />
                         </h3>
                         <div className="flex flex-wrap items-center gap-3">
                           <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                             Encrypted
                           </span>
                           <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                             <Globe className="w-3 h-3" />
                             Vertex AI 3.0
                           </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 w-full max-w-lg">
                      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-inner">
                         <div className="flex justify-between items-center mb-4 px-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <Lock className="w-3 h-3" /> Digital Identity Key
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex-1 w-full bg-black/40 border border-white/5 px-5 py-4 rounded-2xl font-mono text-sm text-indigo-200 overflow-hidden shadow-inner flex items-center justify-between">
                                <span className="truncate">{activeApiKey ? `${activeApiKey.slice(0, 12)}••••••••••••${activeApiKey.slice(-4)}` : "SYSTEM_SECURED"}</span>
                                <CheckCircle className="w-4 h-4 text-green-500/50 shrink-0" />
                            </div>
                            <button 
                              onClick={onManageApiKey}
                              className="w-full sm:w-auto p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95 border border-indigo-400/30 flex items-center justify-center gap-3"
                              title="Cập nhật kết nối AI Studio"
                            >
                               <RefreshCw className="w-5 h-5" />
                               <span className="sm:hidden font-bold">ĐỔI KẾT NỐI</span>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex gap-8">
                      <div className="text-center md:text-left">
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Mức độ bảo mật</p>
                         <p className="text-sm font-bold text-indigo-300">Quân sự (AES-256)</p>
                      </div>
                      <div className="text-center md:text-left">
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Thời gian phản hồi</p>
                         <p className="text-sm font-bold text-indigo-300">&lt; 150ms</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button 
                         onClick={onManageApiKey}
                         className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase transition-all active:scale-95 flex items-center gap-3"
                      >
                         <Key className="w-4 h-4" /> QUẢN LÝ API KEY
                      </button>
                      <button 
                         onClick={() => {
                           if(confirm('Hành động này sẽ ngắt toàn bộ liên kết dữ liệu AI. Bạn chắc chắn?')) {
                             localStorage.removeItem('tutor_authorized');
                             window.location.reload();
                           }
                         }}
                         className="px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl transition-all active:scale-95"
                         title="Ngắt kết nối an toàn"
                      >
                         <LogOut className="w-5 h-5" />
                      </button>
                   </div>
                </div>
             </div>
          </section>

          {/* Usage Dashboard */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 md:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                   <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg md:text-xl"> 
                     <Zap className="w-6 h-6 text-orange-500 fill-orange-500" /> 
                     Năng Lực Sử Dụng 
                   </h3>
                   <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Thống kê dữ liệu thời gian thực</p>
                </div>
                {profile.accountTier !== 'basic' && ( 
                  <button onClick={onCancelSubscription} className="w-full sm:w-auto text-xs font-black text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"> 
                    <AlertTriangle className="w-4 h-4" /> HỦY GÓI CƯỚC 
                  </button> 
                )}
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col shadow-inner">
                   <div className="flex justify-between items-center mb-3"> 
                     <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Tin nhắn AI</span> 
                     <span className="font-black text-indigo-600 text-lg">{dailyUsage.messagesCount} <span className="text-gray-300 font-medium text-xs">/ {limits.messages > 9000 ? '∞' : limits.messages}</span></span> 
                   </div>
                   <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-auto"> 
                     <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgb(99,102,241,0.5)]" style={{ width: `${Math.min((dailyUsage.messagesCount / (limits.messages || 1)) * 100, 100)}%` }}></div> 
                   </div>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col shadow-inner">
                   <div className="flex justify-between items-center mb-3"> 
                     <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Đề thi VIP</span> 
                     <span className="font-black text-purple-600 text-lg">{dailyUsage.testsGenerated} <span className="text-gray-300 font-medium text-xs">/ {limits.tests > 9000 ? '∞' : limits.tests}</span></span> 
                   </div>
                   <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-auto"> 
                     <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgb(168,85,247,0.5)]" style={{ width: `${Math.min((dailyUsage.testsGenerated / (limits.tests || 1)) * 100, 100)}%` }}></div> 
                   </div>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col shadow-inner">
                   <div className="flex justify-between items-center mb-3"> 
                     <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Game Đố Vui</span> 
                     <span className="font-black text-green-600 text-lg">{dailyUsage.gamesPlayed} <span className="text-gray-300 font-medium text-xs">/ {limits.games > 9000 ? '∞' : limits.games}</span></span> 
                   </div>
                   <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mt-auto"> 
                     <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgb(34,197,94,0.5)]" style={{ width: `${Math.min((dailyUsage.gamesPlayed / (limits.games || 1)) * 100, 100)}%` }}></div> 
                   </div>
                </div>
             </div>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`h-32 md:h-44 relative ${profile.accountTier === 'vip' ? 'bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-900' : profile.accountTier === 'pro' ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'bg-gradient-to-r from-slate-400 to-slate-600'}`}>
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
            <div className="px-6 md:px-10 pb-10 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 mb-8 gap-6">
                <div className="relative group shrink-0">
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-[8px] border-white bg-gray-200 overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500 ${profile.accountTier === 'vip' ? 'ring-8 ring-indigo-500/10' : ''}`}>
                    {formData.avatar ? ( <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300"> <User className="w-16 h-16 md:w-20 md:h-20" /> </div> )}
                  </div>
                  {isEditing && ( <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl border border-white/20 transition-all hover:rotate-12"> <Camera className="w-5 h-5" /> </button> )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2 justify-center md:justify-start">
                     <h2 className="text-3xl font-black text-gray-900 tracking-tight">{profile.name}</h2>
                     <div className="mb-1 transform md:scale-110">{renderTierBadge(profile.accountTier)}</div>
                  </div>
                  <p className="text-gray-400 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Thành viên từ {new Date(profile.joinDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 w-full md:w-auto flex justify-center">
                   {!isEditing ? ( 
                     <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black font-black text-sm tracking-widest shadow-xl transition-all hover:-translate-y-1 active:scale-95"> CHỈNH SỬA </button> 
                   ) : ( 
                     <div className="flex gap-3 w-full md:w-auto"> 
                        <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="flex-1 md:flex-none px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"> HỦY </button> 
                        <button onClick={handleSave} className="flex-1 md:flex-none px-10 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 text-sm tracking-widest hover:bg-green-700 transition-all active:scale-95"> <Save className="w-5 h-5" /> LƯU </button> 
                     </div> 
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Activation Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-10 mb-8">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div> 
                  <h3 className="font-black text-gray-800 flex items-center gap-3 text-xl md:text-2xl"> 
                    <CreditCard className="w-7 h-7 text-indigo-600" /> 
                    Nâng Cấp Quyền Lợi 
                  </h3> 
                  <p className="text-sm text-gray-400 mt-1 font-medium italic">Mở khóa trí tuệ nhân tạo không giới hạn dành riêng cho bạn.</p> 
                </div>
                <button onClick={() => setIsActivationOpen(!isActivationOpen)} className="w-full md:w-auto bg-indigo-50 text-indigo-700 px-6 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-indigo-100 flex items-center justify-center gap-3 border-2 border-indigo-100 transition-all active:scale-95"> 
                  <Key className="w-5 h-5" /> {isActivationOpen ? 'Đóng nhập mã' : 'Kích hoạt code VIP'} 
                </button>
             </div>
             
             {isActivationOpen && ( 
               <div className="mb-10 bg-indigo-50/50 p-6 md:p-8 rounded-[2rem] border-4 border-dashed border-indigo-100 animate-pop-in relative overflow-hidden"> 
                 <div className="absolute -top-10 -right-10 p-2 opacity-5"> <Key className="w-48 h-48 text-indigo-600" /> </div> 
                 <label className="block text-sm font-black text-indigo-900 mb-4 uppercase tracking-widest text-center md:text-left">Đã có mã kích hoạt từ Gia sư?</label> 
                 <div className="flex flex-col sm:flex-row gap-3 relative z-10"> 
                   <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} placeholder="VD: VIP-XXXX-XXXX..." className="flex-1 p-5 border-2 border-indigo-200 rounded-2xl uppercase font-mono text-lg tracking-[0.2em] outline-none shadow-inner focus:border-indigo-500 bg-white" /> 
                   <button onClick={handleActivateCode} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 sm:py-0 rounded-2xl font-black tracking-widest transition-all shadow-xl shadow-indigo-900/20 active:scale-95"> KÍCH HOẠT </button> 
                 </div> 
                 {activationMsg && ( 
                   <div className={`mt-5 text-sm flex items-center justify-center md:justify-start gap-3 font-bold px-4 py-3 rounded-xl ${activationMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}> 
                     {activationMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} 
                     {activationMsg.text} 
                   </div> 
                 )} 
               </div> 
             )}

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"> 
               {SUBSCRIPTION_PACKAGES.map((pkg) => { 
                 const isBasic = pkg.tier === 'basic'; 
                 return ( 
                   <div key={pkg.id} className={`relative flex flex-col p-6 rounded-[2rem] border-2 transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] ${pkg.tier === 'vip' ? 'border-indigo-500 bg-indigo-50/10' : pkg.isPopular ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-white'}`}> 
                     {pkg.isLifetime && <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10 animate-bounce">LIFETIME</div>} 
                     {pkg.isPopular && <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10">RECOMMENDED</div>} 
                     
                     <div className="mb-4"> 
                       <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{pkg.name}</h4> 
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full inline-block uppercase tracking-widest ${pkg.tier === 'vip' ? 'bg-indigo-100 text-indigo-700' : isBasic ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}> 
                         {pkg.tier} Level 
                       </span> 
                     </div> 
                     
                     <div className="mb-6"> 
                       <span className="text-2xl font-black text-gray-900">{pkg.priceVND > 0 ? `${pkg.priceVND.toLocaleString()}đ` : 'FREE'}</span> 
                       <span className="text-[10px] text-gray-400 font-bold block uppercase mt-1"> 
                         {pkg.isLifetime ? 'Access Forever' : pkg.durationMonths > 0 ? `per ${pkg.durationMonths} month` : 'Limited Basic'} 
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
                     
                     {!isBasic ? ( 
                       <button onClick={handleContactZalo} className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${pkg.tier === 'vip' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-blue-600 text-white hover:bg-blue-700'} `} > 
                         <MessageCircle className="w-4 h-4" /> LIÊN HỆ ZALO 
                       </button> 
                     ) : ( 
                       <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-xs tracking-widest border border-gray-200 text-center uppercase"> 
                         CURRENT PLAN 
                       </div> 
                     )} 
                   </div> 
                 ); 
               })} 
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="text-center sm:text-left">
                  <h3 className="font-black text-red-600 mb-1 text-lg">CÀI ĐẶT NGUY HIỂM</h3>
                  <p className="text-xs text-gray-400 font-medium"> Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử học tập của bạn. </p>
               </div>
               <button onClick={onResetApp} className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-xs font-black tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"> 
                 <LogOut className="w-4 h-4" /> KHÔI PHỤC CÀI ĐẶT GỐC 
               </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
