
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum TutorMode {
  GENERAL = 'General Chat',
  EXERCISE = 'Exercise Solver',
  THEORY = 'Theory Expert',
  GAME = 'Mini Game Challenge',
  TEST_PREP = 'Test Prep System',
  LIVE = 'Live AI Tutor',
}

export interface Attachment {
  mimeType: string;
  data: string;
  name?: string;
  isText?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  modeUsed?: TutorMode;
  isGameData?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

export interface SavedKnowledgeItem {
  id: string;
  title: string;
  content: string;
  savedAt: number;
  tags?: string[];
}

// Game Types
export interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GameData {
  title: string;
  topic: string;
  difficulty: string;
  questions: GameQuestion[];
}

// Test Prep Types
export interface TestConfig {
  gradeLevel: string;
  examFormat: string;
  topics: string;
  duration: number;
  referenceContent?: string;
}

export interface TestQuestion {
  id: number;
  type: 'multiple_choice' | 'essay' | 'fill_blank';
  content: string;
  options?: string[];
  correctAnswer?: string;
}

export interface TestSection {
  title: string;
  description?: string;
  passageContent?: string;
  questions: TestQuestion[];
}

export interface ExamData {
  title: string;
  subtitle: string;
  duration: number;
  sections: TestSection[];
}

export interface ExamResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  teacherComment: string;
  detailedAnalysis: string;
  improvementPlan: string;
}

export type NotificationType = 'system' | 'admin' | 'achievement' | 'tip';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  isRead: boolean;
}

// User Profile
export type AccountTier = 'basic' | 'pro' | 'vip';

export interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  target?: string;
  avatar?: string;
  joinDate: number;
  accountTier: AccountTier;
  subscriptionExpiry?: number | null; 
  usedCodes?: string[]; 
}

// Usage Stats
export interface DailyUsage {
  date: string; 
  messagesCount: number;
  testsGenerated: number;
  gamesPlayed: number;
}

// Added missing ClientConnectionInfo for synchronization features in AdminConnect
export interface ClientConnectionInfo {
  clientId: string;
  channelName: string;
  status: 'online' | 'offline';
  serverUrl?: string;
  serverApiKey?: string;
  lastSync?: number;
}
