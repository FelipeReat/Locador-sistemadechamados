
export enum TicketStatus {
  NEW = 'NEW',
  TRIAGE = 'TRIAGE', 
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED'
}

export interface TicketTransition {
  from: TicketStatus;
  to: TicketStatus;
  conditions?: string[];
  actions?: string[];
}

export const TICKET_TRANSITIONS: TicketTransition[] = [
  // From NEW
  { from: TicketStatus.NEW, to: TicketStatus.TRIAGE },
  { from: TicketStatus.NEW, to: TicketStatus.WAITING_APPROVAL, conditions: ['requiresApproval'] },
  { from: TicketStatus.NEW, to: TicketStatus.CANCELED },

  // From TRIAGE  
  { from: TicketStatus.TRIAGE, to: TicketStatus.IN_PROGRESS, conditions: ['hasAssignee'] },
  { from: TicketStatus.TRIAGE, to: TicketStatus.WAITING_APPROVAL, conditions: ['requiresApproval'] },
  { from: TicketStatus.TRIAGE, to: TicketStatus.CANCELED },

  // From IN_PROGRESS
  { from: TicketStatus.IN_PROGRESS, to: TicketStatus.WAITING_CUSTOMER },
  { from: TicketStatus.IN_PROGRESS, to: TicketStatus.ON_HOLD },
  { from: TicketStatus.IN_PROGRESS, to: TicketStatus.RESOLVED, actions: ['setResolvedAt'] },
  { from: TicketStatus.IN_PROGRESS, to: TicketStatus.CANCELED },

  // From WAITING_CUSTOMER
  { from: TicketStatus.WAITING_CUSTOMER, to: TicketStatus.IN_PROGRESS },
  { from: TicketStatus.WAITING_CUSTOMER, to: TicketStatus.CLOSED, actions: ['setClosedAt'] },

  // From WAITING_APPROVAL
  { from: TicketStatus.WAITING_APPROVAL, to: TicketStatus.IN_PROGRESS, conditions: ['isApproved'] },
  { from: TicketStatus.WAITING_APPROVAL, to: TicketStatus.CANCELED, conditions: ['isRejected'] },

  // From ON_HOLD
  { from: TicketStatus.ON_HOLD, to: TicketStatus.IN_PROGRESS },
  { from: TicketStatus.ON_HOLD, to: TicketStatus.CANCELED },

  // From RESOLVED
  { from: TicketStatus.RESOLVED, to: TicketStatus.CLOSED, actions: ['setClosedAt'] },
  { from: TicketStatus.RESOLVED, to: TicketStatus.IN_PROGRESS }, // Reopen

  // From CLOSED (limited transitions)
  { from: TicketStatus.CLOSED, to: TicketStatus.IN_PROGRESS }, // Reopen
];

export class TicketStateMachine {
  static canTransition(from: TicketStatus, to: TicketStatus, context?: Record<string, any>): boolean {
    const transition = TICKET_TRANSITIONS.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      return false;
    }

    // Check conditions if any
    if (transition.conditions && context) {
      return transition.conditions.every(condition => {
        switch (condition) {
          case 'requiresApproval':
            return context.requiresApproval === true;
          case 'hasAssignee':
            return !!context.assigneeId;
          case 'isApproved':
            return context.approvalStatus === 'APPROVED';
          case 'isRejected':
            return context.approvalStatus === 'REJECTED';
          default:
            return true;
        }
      });
    }

    return true;
  }

  static getValidTransitions(from: TicketStatus): TicketStatus[] {
    return TICKET_TRANSITIONS
      .filter(t => t.from === from)
      .map(t => t.to);
  }

  static getTransitionActions(from: TicketStatus, to: TicketStatus): string[] {
    const transition = TICKET_TRANSITIONS.find(t => t.from === from && t.to === to);
    return transition?.actions || [];
  }

  static validateTransition(from: TicketStatus, to: TicketStatus, context?: Record<string, any>): { valid: boolean; error?: string } {
    if (!this.canTransition(from, to, context)) {
      const validTransitions = this.getValidTransitions(from);
      return {
        valid: false,
        error: `Invalid transition from ${from} to ${to}. Valid transitions: ${validTransitions.join(', ')}`
      };
    }

    return { valid: true };
  }
}
