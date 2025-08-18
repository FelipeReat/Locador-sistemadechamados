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
  P1: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700',
  P2: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-700',
  P3: 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600',
  P4: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600',
  P5: 'bg-stone-50 text-stone-700 border-stone-300 dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-600',
} as const;

export const STATUS_COLORS = {
  NEW: 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600',
  TRIAGE: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-700',
  WAITING_CUSTOMER: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700',
  WAITING_APPROVAL: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-700',
  ON_HOLD: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600',
  RESOLVED: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700',
  CANCELED: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700',
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
    case 'P2': return '🟠';
    case 'P3': return '🟣';
    case 'P4': return '⚪';
    case 'P5': return '⚫';
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
