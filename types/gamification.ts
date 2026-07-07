export interface BonusTier {
  id: string;
  minPoints: number;
  maxPoints: number | null;
  bonusAmount: number;
  bonusPerPoint?: number;
  tierName: string;
  tierColor: string;
}

export interface POSRoleDistribution {
  id: string;
  role: string;
  percentage: number;
  color: string;
}

export const DEFAULT_POS_ROLE_DISTRIBUTION: POSRoleDistribution[] = [
  { id: 'role-1', role: 'Store Manager', percentage: 30, color: 'yellow' },
  { id: 'role-2', role: 'Assistant Manager', percentage: 20, color: 'purple' },
  { id: 'role-3', role: 'Senior Cashier', percentage: 15, color: 'cyan' },
  { id: 'role-4', role: 'Cashier', percentage: 12, color: 'blue' },
  { id: 'role-5', role: 'Sales Associate', percentage: 10, color: 'green' },
  { id: 'role-6', role: 'Stock Clerk', percentage: 8, color: 'amber' },
  { id: 'role-8', role: 'Support Staff', percentage: 2, color: 'gray' },
];

export interface WarehousePointRule {
  id: string;
  action: 'PICK' | 'PACK' | 'PUTAWAY' | 'TRANSFER' | 'DISPATCH' | 'ITEM_BONUS' | 'ACCURACY_100' | 'ACCURACY_95' | 'STREAK_3' | 'STREAK_7' | 'STREAK_30';
  points: number;
  description: string;
  enabled: boolean;
}

export const DEFAULT_WAREHOUSE_POINT_RULES: WarehousePointRule[] = [
  { id: 'wpr-1', action: 'PICK', points: 15, description: 'Base points for picking a job', enabled: true },
  { id: 'wpr-2', action: 'PACK', points: 10, description: 'Base points for packing a job', enabled: true },
  { id: 'wpr-3', action: 'PUTAWAY', points: 8, description: 'Base points for putaway a job', enabled: true },
  { id: 'wpr-4', action: 'TRANSFER', points: 10, description: 'Base points for transfer a job', enabled: true },
  { id: 'wpr-5', action: 'DISPATCH', points: 8, description: 'Base points for dispatch a job', enabled: true },
  { id: 'wpr-6', action: 'ITEM_BONUS', points: 2, description: 'Points per item processed', enabled: true },
  { id: 'wpr-7', action: 'ACCURACY_100', points: 50, description: 'Bonus for 100% accuracy', enabled: true },
  { id: 'wpr-8', action: 'ACCURACY_95', points: 25, description: 'Bonus for 95%+ accuracy', enabled: true },
  { id: 'wpr-9', action: 'STREAK_3', points: 25, description: 'Bonus for 3-day active streak', enabled: true },
  { id: 'wpr-10', action: 'STREAK_7', points: 75, description: 'Bonus for 7-day active streak', enabled: true },
  { id: 'wpr-11', action: 'STREAK_30', points: 300, description: 'Bonus for 30-day active streak', enabled: true },
];

export const DEFAULT_POS_BONUS_TIERS: BonusTier[] = [
  { id: 'pos-tier-1', minPoints: 0, maxPoints: 499, bonusAmount: 0, bonusPerPoint: 0, tierName: 'Starting', tierColor: 'gray' },
  { id: 'pos-tier-2', minPoints: 500, maxPoints: 1499, bonusAmount: 2000, bonusPerPoint: 0.5, tierName: 'Bronze', tierColor: 'amber' },
  { id: 'pos-tier-3', minPoints: 1500, maxPoints: 2999, bonusAmount: 5000, bonusPerPoint: 0.75, tierName: 'Silver', tierColor: 'gray' },
  { id: 'pos-tier-4', minPoints: 3000, maxPoints: 5999, bonusAmount: 10000, bonusPerPoint: 1.0, tierName: 'Gold', tierColor: 'yellow' },
  { id: 'pos-tier-5', minPoints: 6000, maxPoints: 9999, bonusAmount: 20000, bonusPerPoint: 1.25, tierName: 'Platinum', tierColor: 'cyan' },
  { id: 'pos-tier-6', minPoints: 10000, maxPoints: null, bonusAmount: 40000, bonusPerPoint: 1.5, tierName: 'Diamond', tierColor: 'purple' },
];

export interface StorePoints {
  id: string;
  siteId: string;
  siteName: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  totalTransactions: number;
  totalRevenue: number;
  averageTicketSize: number;
  customerSatisfaction: number;
  lastTransactionAt?: string;
  lastUpdated: string;
  currentTier?: string;
  estimatedBonus?: number;
}

export interface WorkerBonusShare {
  employeeId: string;
  employeeName: string;
  role: string;
  rolePercentage: number;
  storeBonus: number;
  personalShare: number;
  siteId: string;
}

export type PointRuleType = 'category' | 'product' | 'revenue' | 'quantity' | 'promotion';

export interface StorePointRule {
  id: string;
  name: string;
  type: PointRuleType;
  enabled: boolean;
  categoryId?: string;
  productId?: string;
  productSku?: string;
  pointsPerUnit: number;
  pointsPerRevenue?: number;
  revenueThreshold?: number;
  minQuantity?: number;
  maxPointsPerTransaction?: number;
  multiplier?: number;
  validFrom?: string;
  validTo?: string;
  daysOfWeek?: number[];
  description?: string;
  color?: string;
  priority?: number;
}

export const DEFAULT_STORE_POINT_RULES: StorePointRule[] = [
  {
    id: 'rule-base',
    name: 'Base Points',
    type: 'quantity',
    enabled: true,
    categoryId: 'all',
    pointsPerUnit: 1,
    description: 'Earn 1 point for each item sold',
    color: 'blue',
    priority: 1,
  },
  {
    id: 'rule-revenue',
    name: 'Revenue Bonus',
    type: 'revenue',
    enabled: true,
    pointsPerUnit: 0,
    pointsPerRevenue: 1,
    revenueThreshold: 100,
    description: 'Earn 1 bonus point per 100 ETB in sales',
    color: 'green',
    priority: 2,
  },
  {
    id: 'rule-premium',
    name: 'Premium Products',
    type: 'category',
    enabled: true,
    categoryId: 'Electronics',
    pointsPerUnit: 5,
    description: 'Earn 5 points per electronics item (high-value category)',
    color: 'purple',
    priority: 3,
  },
  {
    id: 'rule-grocery',
    name: 'Grocery Items',
    type: 'category',
    enabled: true,
    categoryId: 'Groceries',
    pointsPerUnit: 2,
    description: 'Earn 2 points per grocery item',
    color: 'emerald',
    priority: 3,
  },
  {
    id: 'rule-bulk',
    name: 'Bulk Sale Bonus',
    type: 'quantity',
    enabled: true,
    categoryId: 'all',
    pointsPerUnit: 0,
    minQuantity: 10,
    multiplier: 1.5,
    description: 'Get 1.5x points when selling 10+ items in one transaction',
    color: 'amber',
    priority: 10,
  },
];

export const DEFAULT_BONUS_TIERS: BonusTier[] = [
  { id: 'tier-1', minPoints: 0, maxPoints: 99, bonusAmount: 0, bonusPerPoint: 0, tierName: 'Training', tierColor: 'gray' },
  { id: 'tier-2', minPoints: 100, maxPoints: 299, bonusAmount: 500, bonusPerPoint: 0.5, tierName: 'Bronze', tierColor: 'amber' },
  { id: 'tier-3', minPoints: 300, maxPoints: 599, bonusAmount: 1200, bonusPerPoint: 0.75, tierName: 'Silver', tierColor: 'gray' },
  { id: 'tier-4', minPoints: 600, maxPoints: 999, bonusAmount: 2500, bonusPerPoint: 1.0, tierName: 'Gold', tierColor: 'yellow' },
  { id: 'tier-5', minPoints: 1000, maxPoints: 1999, bonusAmount: 5000, bonusPerPoint: 1.25, tierName: 'Platinum', tierColor: 'cyan' },
  { id: 'tier-6', minPoints: 2000, maxPoints: null, bonusAmount: 10000, bonusPerPoint: 1.5, tierName: 'Diamond', tierColor: 'purple' },
];

export const DEFAULT_WAREHOUSE_POINTS_ROLES: { role: string; enabled: boolean; label: string }[] = [
  { role: 'picker', enabled: true, label: 'Picker' },
  { role: 'dispatcher', enabled: true, label: 'Dispatcher' },
  { role: 'warehouse_manager', enabled: true, label: 'Warehouse Manager' },
  { role: 'inventory_specialist', enabled: true, label: 'Inventory Specialist' },
  { role: 'forklift_operator', enabled: true, label: 'Forklift Operator' },
  { role: 'receiver', enabled: true, label: 'Receiver' },
  { role: 'packer', enabled: true, label: 'Packer' },
];

export type AchievementType =
  | 'first_job'
  | 'speed_demon'
  | 'perfect_accuracy'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'centurion'
  | 'veteran'
  | 'legend'
  | 'early_bird'
  | 'night_owl'
  | 'team_player';

export interface WorkerAchievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  pointsAwarded: number;
}

export interface WorkerPoints {
  id: string;
  siteId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  totalJobsCompleted: number;
  totalItemsPicked: number;
  averageAccuracy: number;
  averageTimePerJob: number;
  currentStreak: number;
  longestStreak: number;
  lastJobCompletedAt?: string;
  lastUpdated: string;
  achievements: WorkerAchievement[];
  rank: number;
  level: number;
  levelTitle: string;
  currentBonusTier?: string;
  estimatedBonus?: number;
  bonusPeriodPoints?: number;
}

export interface PointsTransaction {
  id: string;
  employeeId: string;
  jobId?: string;
  points: number;
  type: 'JOB_COMPLETE' | 'BONUS' | 'ACHIEVEMENT' | 'SPEED_BONUS' | 'ACCURACY_BONUS' | 'STREAK_BONUS';
  description: string;
  timestamp: string;
}

export const POINTS_CONFIG = {
  JOB_PICK: 15,
  JOB_PACK: 10,
  JOB_PUTAWAY: 8,
  JOB_TRANSFER: 10,
  JOB_DISPATCH: 8,
  ITEM_BONUS: 2,
  ACCURACY_100_BONUS: 50,
  ACCURACY_95_BONUS: 25,
  SPEED_BONUS_FAST: 15,
  SPEED_BONUS_QUICK: 8,
  STREAK_3_DAYS: 25,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 300,
  LEVELS: [
    { level: 1, points: 0, title: 'Rookie' },
    { level: 2, points: 100, title: 'Apprentice' },
    { level: 3, points: 300, title: 'Worker' },
    { level: 4, points: 600, title: 'Skilled' },
    { level: 5, points: 1000, title: 'Expert' },
    { level: 6, points: 2000, title: 'Pro' },
    { level: 7, points: 4000, title: 'Master' },
    { level: 8, points: 7000, title: 'Elite' },
    { level: 9, points: 12000, title: 'Champion' },
    { level: 10, points: 20000, title: 'Legend' },
  ],
};
