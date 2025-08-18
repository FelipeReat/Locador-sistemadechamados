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
  P1: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  P2: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  P3: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
  P4: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
  P5: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
} as const;

export const STATUS_COLORS = {
  NEW: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  TRIAGE: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  IN_PROGRESS: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  WAITING_CUSTOMER: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
  WAITING_APPROVAL: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  ON_HOLD: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  CLOSED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  CANCELED: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
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
