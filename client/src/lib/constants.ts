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
  P1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  P2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  P3: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  P4: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  P5: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
} as const;

export const STATUS_COLORS = {
  NEW: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  TRIAGE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  WAITING_CUSTOMER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  WAITING_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ON_HOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CLOSED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
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
    case 'P3': return '🔵';
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
