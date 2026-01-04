
import { TutorMode, AccountTier } from './types';

// --- CONFIG ---
export const ZALO_CONSULTATION_URL = 'https://zalo.me/0368132628';

// --- LIMITS & PACKAGES ---

export const TIER_LIMITS: Record<AccountTier, { messages: number; tests: number; games: number }> = {
  basic: {
    messages: 15,
    tests: 0,
    games: 1
  },
  pro: {
    messages: 100,
    tests: 5,
    games: 10
  },
  vip: {
    messages: 9999, // Unlimited effectively
    tests: 9999,
    games: 9999
  }
};

export interface SubscriptionPackage {
  id: string;
  name: string;
  durationMonths: number;
  tier: AccountTier;
  priceVND: number;
  isLifetime?: boolean;
  features: string[];
  isPopular?: boolean;
}

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pack_basic',
    name: 'Gói Cơ Bản (Free)',
    durationMonths: 0,
    tier: 'basic',
    priceVND: 0,
    features: ['15 tin nhắn/ngày', '1 Game/ngày', 'Lưu bài học cơ bản', 'Quảng cáo nhẹ']
  },
  {
    id: 'pack_1_month',
    name: 'Gói 1 Tháng',
    durationMonths: 1,
    tier: 'pro',
    priceVND: 49000,
    features: ['100 tin nhắn/ngày', '5 đề thi/ngày', '10 Games/ngày', 'Không quảng cáo']
  },
  {
    id: 'pack_5_months',
    name: 'Gói 5 Tháng',
    durationMonths: 5,
    tier: 'pro',
    priceVND: 199000,
    features: ['Tiết kiệm 20%', 'Đầy đủ tính năng Pro', 'Hỗ trợ 24/7 qua Zalo'],
    isPopular: true
  },
  {
    id: 'pack_1_year',
    name: 'Gói 1 Năm',
    durationMonths: 12,
    tier: 'vip',
    priceVND: 499000,
    features: ['Không giới hạn tính năng', 'Ưu tiên phản hồi AI', 'Huy hiệu VIP Pro']
  },
  {
    id: 'pack_lifetime',
    name: 'Gói Vĩnh Viễn',
    durationMonths: 999,
    tier: 'vip',
    priceVND: 999000,
    isLifetime: true,
    features: ['Thanh toán 1 lần', 'Sở hữu trọn đời', 'Mọi tính năng tương lai']
  }
];

// --- ACTIVATION CODES ---
// Logic: Tên mã: { cấp độ, số tháng cộng thêm }
export const ACTIVATION_CODES: Record<string, { tier: AccountTier, months: number }> = {
  // PRO CODES
  "PRO1M-A82B": { tier: 'pro', months: 1 },
  "PRO5M-C93D": { tier: 'pro', months: 5 },
  "PRO1Y-E20F": { tier: 'pro', months: 12 },
  
  // VIP CODES
  "VIP1Y-X001": { tier: 'vip', months: 12 },
  "VIPFOREVER-99": { tier: 'vip', months: 999 },
  
  // TEST CODES
  "FREE-PRO-7D": { tier: 'pro', months: 0.25 },
};

// --- PROMPTS ---

export const EXERCISE_SOLVER_PROMPT = `...`; // Giữ nguyên prompt cũ
export const THEORY_EXPERT_PROMPT = `...`; // Giữ nguyên prompt cũ
export const GENERAL_TUTOR_PROMPT = `...`; // Giữ nguyên prompt cũ
export const GAME_MASTER_PROMPT = `...`; // Giữ nguyên prompt cũ
export const TEST_GENERATOR_PROMPT = `...`; // Giữ nguyên prompt cũ
export const TEST_GRADER_PROMPT = `...`; // Giữ nguyên prompt cũ

export const getSystemInstruction = (mode: TutorMode): string => {
  switch (mode) {
    case TutorMode.EXERCISE: return EXERCISE_SOLVER_PROMPT;
    case TutorMode.THEORY: return THEORY_EXPERT_PROMPT;
    case TutorMode.GAME: return GAME_MASTER_PROMPT;
    case TutorMode.TEST_PREP: return TEST_GENERATOR_PROMPT;
    case TutorMode.GENERAL:
    default: return GENERAL_TUTOR_PROMPT;
  }
};
