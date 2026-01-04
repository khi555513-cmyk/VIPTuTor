
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SavedView from './components/SavedView';
import NotificationView from './components/NotificationView';
import TestPrepSystem from './components/TestPrepSystem';
import HelpModal from './components/HelpModal';
import MiniGame from './components/MiniGame';
import UserProfileView from './components/UserProfile';
import LiveTutor from './components/LiveTutor';
import SubscriptionExpiredModal from './components/SubscriptionExpiredModal';
import LimitReachedModal from './components/LimitReachedModal';
import { ChatSession, SavedKnowledgeItem, Message, Role, AppNotification, GameData, UserProfile, DailyUsage, ApiKeyInfo } from './types';
import { TIER_LIMITS } from './constants';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const isResettingRef = useRef(false);
  // Default authorized as API key is now strictly from environment
  const [isAuthorized] = useState<boolean>(true);
  
  // API key states removed to strictly follow GenAI guidelines
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>(() => {
    const saved = localStorage.getItem('vip_tutor_api_keys');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeKeyId, setActiveKeyId] = useState<string | null>(() => {
    return localStorage.getItem('vip_tutor_active_key_id');
  });

  // Persist keys to localStorage (backward compatibility)
  useEffect(() => {
    localStorage.setItem('vip_tutor_api_keys', JSON.stringify(apiKeys));
    if (activeKeyId) localStorage.setItem('vip_tutor_active_key_id', activeKeyId);
  }, [apiKeys, activeKeyId]);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('vip_tutor_sessions');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [{ id: 'default', title: 'New Session', createdAt: Date.now(), messages: [] }];
    } catch (e) {
      return [{ id: 'default', title: 'New Session', createdAt: Date.now(), messages: [] }];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const savedSessions = localStorage.getItem('vip_tutor_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[parsed.length - 1].id; 
      }
      return 'default';
    } catch (e) {
      return 'default';
    }
  });

  const [savedItems, setSavedItems] = useState<SavedKnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem('vip_tutor_saved');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('vip_tutor_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('vip_tutor_profile');
      const defaultProfile: UserProfile = { 
        name: 'Bạn Học Viên', joinDate: Date.now(), target: 'Giao tiếp cơ bản',
        accountTier: 'basic', subscriptionExpiry: null, usedCodes: [] 
      };
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch (e) {
      return { name: 'Bạn Học Viên', joinDate: Date.now(), target: 'Giao tiếp cơ bản', accountTier: 'basic', subscriptionExpiry: null, usedCodes: [] };
    }
  });

  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => {
    try {
      const saved = localStorage.getItem('vip_tutor_usage');
      const today = new Date().toISOString().split('T')[0];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed;
      }
      return { date: today, messagesCount: 0, testsGenerated: 0, gamesPlayed: 0 };
    } catch (e) {
      return { date: new Date().toISOString().split('T')[0], messagesCount: 0, testsGenerated: 0, gamesPlayed: 0 };
    }
  });

  const [currentView, setCurrentView] = useState<'chat' | 'saved' | 'notifications' | 'test-prep' | 'profile' | 'live'>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fullScreenGameData, setFullScreenGameData] = useState<GameData | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiredPackageName] = useState('');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');

  useEffect(() => {
    if (!isResettingRef.current) localStorage.setItem('vip_tutor_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!isResettingRef.current) localStorage.setItem('vip_tutor_saved', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (!isResettingRef.current) localStorage.setItem('vip_tutor_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (!isResettingRef.current) localStorage.setItem('vip_tutor_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!isResettingRef.current) localStorage.setItem('vip_tutor_usage', JSON.stringify(dailyUsage));
  }, [dailyUsage]);

  const handleAddNotification = (note: AppNotification) => {
    setNotifications(prev => [note, ...prev]);
  };

  const handleAddApiKey = (info: ApiKeyInfo) => {
    setApiKeys(prev => [info, ...prev]);
    if (!activeKeyId) setActiveKeyId(info.id);
  };

  const handleRemoveApiKey = (id: string) => {
    const updated = apiKeys.filter(k => k.id !== id);
    setApiKeys(updated);
    if (activeKeyId === id) {
      setActiveKeyId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleApiError = () => {
    console.error("Critical: Gemini API error encountered.");
    alert("Có lỗi xảy ra khi kết nối tới Gemini API. Vui lòng kiểm tra lại cấu hình hệ thống.");
  };

  const checkLimit = (type: 'message' | 'test' | 'game'): boolean => {
    const limits = TIER_LIMITS[userProfile.accountTier];
    if (type === 'message' && dailyUsage.messagesCount >= limits.messages) return false;
    if (type === 'test' && dailyUsage.testsGenerated >= limits.tests) return false;
    if (type === 'game' && dailyUsage.gamesPlayed >= limits.games) return false;
    return true;
  };

  const incrementUsage = (type: 'message' | 'test' | 'game') => {
    setDailyUsage(prev => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.date !== today) return { date: today, messagesCount: type === 'message' ? 1 : 0, testsGenerated: type === 'test' ? 1 : 0, gamesPlayed: type === 'game' ? 1 : 0 };
      return {
        ...prev,
        messagesCount: type === 'message' ? prev.messagesCount + 1 : prev.messagesCount,
        testsGenerated: type === 'test' ? prev.testsGenerated + 1 : prev.testsGenerated,
        gamesPlayed: type === 'game' ? prev.gamesPlayed + 1 : prev.gamesPlayed
      };
    });
  };

  const getCurrentMessages = () => sessions.find(s => s.id === currentSessionId)?.messages || [];

  const setMessages = (updateFn: React.SetStateAction<Message[]>) => {
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === currentSessionId) {
        const newMessages = typeof updateFn === 'function' ? updateFn(session.messages) : updateFn;
        let newTitle = session.title;
        if (session.title === 'New Session' && newMessages.length > 0) {
           const firstUserMsg = newMessages.find(m => m.role === Role.USER);
           if (firstUserMsg) newTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        }
        return { ...session, messages: newMessages, title: newTitle };
      }
      return session;
    }));
  };

  const handleNewSession = () => {
    const newId = Date.now().toString();
    setSessions(prev => [...prev, { id: newId, title: 'New Session', createdAt: Date.now(), messages: [] }]);
    setCurrentSessionId(newId);
    setCurrentView('chat');
    setIsMobileMenuOpen(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!window.confirm("Xóa lịch sử đoạn chat này?")) return;
    const remaining = sessions.filter(s => s.id !== sessionId);
    if (remaining.length === 0) {
      const newId = Date.now().toString();
      setSessions([{ id: newId, title: 'New Session', createdAt: Date.now(), messages: [] }]);
      setCurrentSessionId(newId);
    } else {
      setSessions(remaining);
      if (sessionId === currentSessionId) setCurrentSessionId(remaining[remaining.length - 1].id);
    }
  };

  const handleSaveKnowledge = (item: SavedKnowledgeItem) => {
    setSavedItems(prev => [...prev, item]);
    handleAddNotification({ id: Date.now().toString(), title: 'Đã lưu kiến thức', message: `Đã lưu "${item.title}" vào thư viện.`, type: 'system', timestamp: Date.now(), isRead: false });
  };

  return (
    <div className="flex h-[100dvh] bg-gray-100 overflow-hidden relative">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SubscriptionExpiredModal isOpen={showExpiryModal} onClose={() => setShowExpiryModal(false)} onRenew={() => { setShowExpiryModal(false); setCurrentView('profile'); }} expiredPackageName={expiredPackageName} />
      <LimitReachedModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} onUpgrade={() => { setIsLimitModalOpen(false); setCurrentView('profile'); }} message={limitModalMessage} />

      {fullScreenGameData && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
          <MiniGame data={fullScreenGameData} isFullScreenMode={true} onCloseFullScreen={() => setFullScreenGameData(null)} />
        </div>
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <Sidebar sessions={sessions} currentSessionId={currentSessionId} onNewSession={handleNewSession} onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileMenuOpen(false); }} onDeleteSession={handleDeleteSession} savedItems={savedItems} currentView={currentView} setCurrentView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} onOpenHelp={() => setIsHelpOpen(true)} unreadNotificationsCount={notifications.filter(n => !n.isRead).length} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>

      <main className="flex-1 flex flex-col h-full w-full min-w-0" role="main">
        {currentView !== 'chat' && (
          <header className="md:hidden h-14 bg-white border-b flex items-center px-4 justify-between flex-shrink-0">
             <span className="font-bold text-gray-800">VIP Tutor</span>
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600"> <Menu className="w-6 h-6" /> </button>
          </header>
        )}
        <div className="flex-1 overflow-hidden relative">
          {currentView === 'test-prep' ? <TestPrepSystem onBack={() => setCurrentView('chat')} checkLimit={() => checkLimit('test')} incrementUsage={() => incrementUsage('test')} onApiError={handleApiError} /> : 
           currentView === 'saved' ? <SavedView items={savedItems} onDelete={(id) => setSavedItems(prev => prev.filter(i => i.id !== id))} /> :
           currentView === 'notifications' ? <NotificationView notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))} /> :
           currentView === 'profile' ? <UserProfileView profile={userProfile} onUpdateProfile={setUserProfile} dailyUsage={dailyUsage} onCancelSubscription={() => setUserProfile(p => ({...p, accountTier: 'basic', subscriptionExpiry: null}))} onResetApp={() => { if(confirm('Reset app?')) { isResettingRef.current = true; localStorage.clear(); window.location.reload(); } }} apiKeys={apiKeys} onAddApiKey={handleAddApiKey} onRemoveApiKey={handleRemoveApiKey} activeKeyId={activeKeyId} onSetActiveKey={setActiveKeyId} /> :
           currentView === 'live' ? <LiveTutor onClose={() => setCurrentView('chat')} userProfile={userProfile} checkLimit={() => checkLimit('message')} incrementUsage={() => incrementUsage('message')} /> :
           <ChatInterface currentSessionId={currentSessionId} onSaveKnowledge={handleSaveKnowledge} messages={getCurrentMessages()} setMessages={setMessages} onPlayGame={(data) => { if (checkLimit('game')) { incrementUsage('game'); setFullScreenGameData(data); } else { setLimitModalMessage("Hết lượt chơi game."); setIsLimitModalOpen(true); } }} onAddNotification={handleAddNotification} checkLimit={() => checkLimit('message')} incrementUsage={() => incrementUsage('message')} onToggleSidebar={() => setIsMobileMenuOpen(true)} onOpenProfile={() => setCurrentView('profile')} onApiError={handleApiError} />}
        </div>
      </main>
    </div>
  );
};

export default App;