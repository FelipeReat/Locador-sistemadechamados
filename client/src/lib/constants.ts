
export const PRIORITY_LABELS = {
  P1: 'Crítico',
  P2: 'Alto',
  P3: 'Médio',
  P4: 'Baixo',
  P5: 'Muito Baixo',
} as const;

export const STATUS_LABELS = {
  NEW: 'Novo',
  TRIAGE: 'Triagem',
  IN_PROGRESS: 'Em Andamento',
  WAITING_CUSTOMER: 'Aguardando Cliente',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  ON_HOLD: 'Em Espera',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
  CANCELED: 'Cancelado',
} as const;

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  AGENT: 'Agente',
  APPROVER: 'Aprovador',
  REQUESTER: 'Solicitante',
  AUDITOR: 'Auditor',
} as const;

export const PRIORITY_COLORS = {
  P1: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-red-100/50 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-300 dark:border-red-700',
  P2: 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-red-200 shadow-red-100/30 dark:from-red-900/10 dark:to-pink-900/10 dark:text-red-400 dark:border-red-800',
  P3: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-blue-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-300 dark:border-blue-600',
  P4: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-300 dark:border-emerald-600',
  P5: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200 shadow-slate-100/50 dark:from-slate-800/50 dark:to-gray-800/50 dark:text-slate-300 dark:border-slate-600',
} as const;

export const STATUS_COLORS = {
  NEW: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300 shadow-slate-100/50 dark:from-slate-800/50 dark:to-gray-800/50 dark:text-slate-300 dark:border-slate-600',
  TRIAGE: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300 shadow-blue-100/50 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-300 dark:border-blue-600',
  IN_PROGRESS: 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300 shadow-indigo-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 dark:text-indigo-300 dark:border-indigo-600',
  WAITING_CUSTOMER: 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-300 shadow-violet-100/50 dark:from-violet-900/20 dark:to-purple-900/20 dark:text-violet-300 dark:border-violet-600',
  WAITING_APPROVAL: 'bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-300 shadow-pink-100/50 dark:from-pink-900/20 dark:to-rose-900/20 dark:text-pink-300 dark:border-pink-600',
  ON_HOLD: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-300 shadow-gray-100/50 dark:from-gray-800/50 dark:to-slate-800/50 dark:text-gray-300 dark:border-gray-600',
  RESOLVED: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 shadow-emerald-100/50 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-300 dark:border-emerald-600',
  CLOSED: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300 shadow-green-100/50 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-300 dark:border-green-600',
  CANCELED: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 shadow-red-100/50 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-300 dark:border-red-600',
} as const;

export const SLA_TIME_LIMITS = {
  P1: { response: 15, resolution: 240 }, // 15min, 4h
  P2: { response: 30, resolution: 480 }, // 30min, 8h  
  P3: { response: 240, resolution: 2880 }, // 4h, 2d
  P4: { response: 1440, resolution: 7200 }, // 1d, 5d
  P5: { response: 2880, resolution: 14400 }, // 2d, 10d
} as const;

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  
  return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPriorityIcon = (priority: keyof typeof PRIORITY_LABELS): string => {
  switch (priority) {
    case 'P1': return '🔴';
    case 'P2': return '🟡';
    case 'P3': return '🔵';
    case 'P4': return '🟢';
    case 'P5': return '⚪';
    default: return '⚪';
  }
};

export const getStatusIcon = (status: keyof typeof STATUS_LABELS): string => {
  switch (status) {
    case 'NEW': return '🆕';
    case 'TRIAGE': return '🔍';
    case 'IN_PROGRESS': return '⚙️';
    case 'WAITING_CUSTOMER': return '⏳';
    case 'WAITING_APPROVAL': return '✋';
    case 'ON_HOLD': return '⏸️';
    case 'RESOLVED': return '✅';
    case 'CLOSED': return '🔒';
    case 'CANCELED': return '❌';
    default: return '❓';
  }
};

// Novos utilitários para a interface moderna
export const THEME_COLORS = {
  primary: 'from-blue-500 to-indigo-600',
  secondary: 'from-violet-500 to-purple-600',
  success: 'from-emerald-500 to-green-600',
  warning: 'from-amber-500 to-orange-600',
  danger: 'from-red-500 to-rose-600',
  info: 'from-cyan-500 to-blue-600',
} as const;

export const ANIMATION_DELAYS = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
} as const;
