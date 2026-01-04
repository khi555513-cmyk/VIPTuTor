
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
import { ChatSession, SavedKnowledgeItem, Message, Role, AppNotification, GameData, UserProfile, DailyUsage } from './types';
import { TIER_LIMITS } from './constants';
import { Menu, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const isResettingRef = useRef(false);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('tutor_sessions');
      return saved ? JSON.parse(saved) : [{ id: 'default', title: 'New Session', createdAt: Date.now(), messages: [] }];
    } catch (e) { return [{ id: 'default', title: 'New Session', createdAt: Date.now(), messages: [] }]; }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const savedSessions = localStorage.getItem('tutor_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[parsed.length - 1].id;
      }
      return 'default';
    } catch (e) { return 'default'; }
  });

  const [savedItems, setSavedItems] = useState<SavedKnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem('tutor_saved');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('tutor_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('tutor_profile');
      const defaultProfile: UserProfile = { 
        name: 'Học Viên Mới', 
        joinDate: Date.now(), 
        target: 'IELTS 8.0',
        accountTier: 'basic', 
        subscriptionExpiry: null,
        usedCodes: [] 
      };
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch (e) { return { name: 'Học Viên Mới', joinDate: Date.now(), target: 'IELTS 8.0', accountTier: 'basic', subscriptionExpiry: null, usedCodes: [] }; }
  });

  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => {
    try {
      const saved = localStorage.getItem('tutor_usage');
      const today = new Date().toISOString().split('T')[0];
      if (saved) {
        const parsed: DailyUsage = JSON.parse(saved);
        if (parsed.date === today) return parsed;
      }
      return { date: today, messagesCount: 0, testsGenerated: 0, gamesPlayed: 0 };
    } catch (e) { return { date: new Date().toISOString().split('T')[0], messagesCount: 0, testsGenerated: 0, gamesPlayed: 0 }; }
  });

  const [currentView, setCurrentView] = useState<'chat' | 'saved' | 'notifications' | 'test-prep' | 'profile' | 'live'>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fullScreenGameData, setFullScreenGameData] = useState<GameData | null>(null);
  
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');

  // Auto-downgrade check on expiry
  useEffect(() => {
    if (userProfile.subscriptionExpiry && userProfile.subscriptionExpiry < Date.now()) {
      setUserProfile(prev => ({ ...prev, accountTier: 'basic', subscriptionExpiry: null }));
      handleAddNotification({
        id: Date.now().toString(),
        title: 'Gói cước đã hết hạn',
        message: 'Gói cước của bạn đã hết hạn. Tài khoản đã tự động chuyển về gói CƠ BẢN.',
        type: 'admin',
        timestamp: Date.now(),
        isRead: false
      });
    }
  }, [userProfile.subscriptionExpiry]);

  useEffect(() => { if (!isResettingRef.current) localStorage.setItem('tutor_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { if (!isResettingRef.current) localStorage.setItem('tutor_saved', JSON.stringify(savedItems)); }, [savedItems]);
  useEffect(() => { if (!isResettingRef.current) localStorage.setItem('tutor_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { if (!isResettingRef.current) localStorage.setItem('tutor_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { if (!isResettingRef.current) localStorage.setItem('tutor_usage', JSON.stringify(dailyUsage)); }, [dailyUsage]);

  const handleAddNotification = (note: AppNotification) => { setNotifications(prev => [note, ...prev]); };

  const checkLimit = (type: 'message' | 'test' | 'game'): boolean => {
    const limits = TIER_LIMITS[userProfile.accountTier];
    let current = 0;
    let max = 0;
    let label = '';

    if (type === 'message') { current = dailyUsage.messagesCount; max = limits.messages; label = 'tin nhắn'; }
    else if (type === 'test') { current = dailyUsage.testsGenerated; max = limits.tests; label = 'lượt tạo đề thi'; }
    else if (type === 'game') { current = dailyUsage.gamesPlayed; max = limits.games; label = 'lượt chơi game'; }

    if (current >= max) {
      setLimitModalMessage(`Bạn đã sử dụng hết hạn mức ${label} trong ngày (${max}/${max}). Hãy nâng cấp gói Pro/VIP để tiếp tục trải nghiệm không giới hạn!`);
      setIsLimitModalOpen(true);
      return false;
    }
    return true;
  };

  const incrementUsage = (type: 'message' | 'test' | 'game') => {
    setDailyUsage(prev => {
      const today = new Date().toISOString().split('T')[0];
      const base = prev.date === today ? prev : { date: today, messagesCount: 0, testsGenerated: 0, gamesPlayed: 0 };
      return {
        ...base,
        messagesCount: type === 'message' ? base.messagesCount + 1 : base.messagesCount,
        testsGenerated: type === 'test' ? base.testsGenerated + 1 : base.testsGenerated,
        gamesPlayed: type === 'game' ? base.gamesPlayed + 1 : base.gamesPlayed
      };
    });
  };

  const setMessages = (updateFn: React.SetStateAction<Message[]>) => {
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === currentSessionId) {
        const newMessages = typeof updateFn === 'function' ? updateFn(session.messages) : updateFn;
        return { ...session, messages: newMessages };
      }
      return session;
    }));
  };

  const handleNewSession = () => {
    const newId = Date.now().toString();
    setSessions(prev => [...prev, { id: newId, title: 'Đoạn chat mới', createdAt: Date.now(), messages: [] }]);
    setCurrentSessionId(newId);
    setCurrentView('chat');
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'test-prep': return <TestPrepSystem onBack={() => setCurrentView('chat')} checkLimit={() => checkLimit('test')} incrementUsage={() => incrementUsage('test')} />;
      case 'saved': return <SavedView items={savedItems} onDelete={(id) => setSavedItems(prev => prev.filter(i => i.id !== id))} />;
      case 'notifications': return <NotificationView notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))} />;
      case 'profile': return <UserProfileView profile={userProfile} onUpdateProfile={setUserProfile} dailyUsage={dailyUsage} onCancelSubscription={() => { if(confirm('Hủy gói cước?')) setUserProfile(prev => ({...prev, accountTier: 'basic', subscriptionExpiry: null})); }} onResetApp={() => { if(confirm('Reset toàn bộ?')) { isResettingRef.current = true; localStorage.clear(); window.location.reload(); } }} onManageApiKey={() => {}} />;
      case 'live': return <LiveTutor onClose={() => setCurrentView('chat')} userProfile={userProfile} checkLimit={() => checkLimit('message')} incrementUsage={() => incrementUsage('message')} />;
      default: return <ChatInterface currentSessionId={currentSessionId} onSaveKnowledge={(item) => setSavedItems(prev => [...prev, item])} messages={sessions.find(s => s.id === currentSessionId)?.messages || []} setMessages={setMessages} onPlayGame={(data) => { if(checkLimit('game')) { incrementUsage('game'); setFullScreenGameData(data); } }} onAddNotification={handleAddNotification} checkLimit={() => checkLimit('message')} incrementUsage={() => incrementUsage('message')} onToggleSidebar={() => setIsMobileMenuOpen(true)} onOpenProfile={() => setCurrentView('profile')} />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-gray-100 overflow-hidden relative">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <LimitReachedModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} onUpgrade={() => { setIsLimitModalOpen(false); setCurrentView('profile'); }} message={limitModalMessage} />

      {fullScreenGameData && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
          <MiniGame data={fullScreenGameData} isFullScreenMode={true} onCloseFullScreen={() => setFullScreenGameData(null)} />
        </div>
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <Sidebar sessions={sessions} currentSessionId={currentSessionId} onNewSession={handleNewSession} onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileMenuOpen(false); }} onDeleteSession={() => {}} savedItems={savedItems} currentView={currentView} setCurrentView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} onOpenHelp={() => setIsHelpOpen(true)} unreadNotificationsCount={notifications.filter(n => !n.isRead).length} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>

      <main className="flex-1 flex flex-col h-full w-full min-w-0">
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
