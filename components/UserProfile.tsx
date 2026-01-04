
import React, { useState } from 'react';
import { UserProfile, DailyUsage, ApiKeyInfo } from '../types';
import { User, Edit2, AlertTriangle, GraduationCap } from 'lucide-react';

interface UserProfileProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  dailyUsage: DailyUsage;
  onCancelSubscription: () => void;
  onResetApp: () => void;
  // Kept for backward compatibility with App.tsx state but UI removed
  apiKeys: ApiKeyInfo[];
  onAddApiKey: (info: ApiKeyInfo) => void;
  onRemoveApiKey: (id: string) => void;
  activeKeyId: string | null;
  onSetActiveKey: (id: string) => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ 
  profile, onUpdateProfile, onResetApp
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="h-16 border-b flex items-center px-6 bg-white shadow-sm shrink-0">
        <h1 className="font-bold text-xl text-gray-800">Cài đặt & Hồ sơ</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* User Info */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative"></div>
             <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 gap-6 mb-8">
                   <div className="relative group">
                      <div className="w-32 h-32 rounded-[2.5rem] border-8 border-white bg-slate-200 overflow-hidden shadow-2xl">
                         {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" /> : <User className="w-full h-full p-6 text-slate-400" />}
                      </div>
                      <button onClick={() => setIsEditing(true)} className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg border-4 border-white"><Edit2 className="w-4 h-4" /></button>
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-black text-slate-900">{formData.name}</h2>
                      <p className="text-slate-500 font-medium">Thành viên từ {new Date(formData.joinDate).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Họ tên hiển thị</label>
                      <input disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700" />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mục tiêu học tập</label>
                      <select disabled={!isEditing} value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700">
                         <option>Giao tiếp cơ bản</option>
                         <option>IELTS 7.5+</option>
                         <option>Tiếng anh công sở</option>
                      </select>
                   </div>
                </div>
                {isEditing && (
                   <div className="mt-8 flex justify-end gap-3">
                      <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Hủy</button>
                      <button onClick={() => { onUpdateProfile(formData); setIsEditing(false); }} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">Lưu thay đổi</button>
                   </div>
                )}
             </div>
          </section>

          {/* Dangerous Area */}
          <section className="bg-red-50/50 rounded-[2rem] p-6 md:p-8 border border-red-100">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                   <h3 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
                   <p className="text-xs text-red-600 font-medium">Thao tác này sẽ xóa vĩnh viễn dữ liệu học tập của bạn trên thiết bị này.</p>
                </div>
                <button onClick={onResetApp} className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95">Reset toàn bộ dữ liệu</button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;