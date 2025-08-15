
import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { storage } from './storage';
import { sendEmail } from './email';

// Mock queue for development when Redis is not available
class MockQueue {
  constructor(public name: string, public options?: any) {}
  
  async add(jobName: string, data: any, options?: any): Promise<any> {
    console.log(`Mock job queued: ${this.name}/${jobName}`, data);
    // Process immediately in development
    setTimeout(() => this.processJob(data), 100);
    return { id: Date.now().toString() };
  }
  
  private async processJob(data: any) {
    // Simple immediate processing for development
    console.log(`Processing mock job:`, data);
  }
}

// Create queues with fallback to mock when Redis is unavailable
function createQueue(name: string, options: any) {
  try {
    if (redis && typeof redis.ping === 'function') {
      return new Queue(name, { connection: redis, ...options });
    }
  } catch (error) {
    console.warn(`Failed to create ${name} queue, using mock queue`);
  }
  return new MockQueue(name, options);
}

// Job queues
export const notificationQueue = createQueue('notifications', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
});

export const slaQueue = createQueue('sla-monitoring', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
});

export const automationQueue = createQueue('automations', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
});

// Job types
export interface NotificationJobData {
  type: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_ASSIGNED' | 'SLA_BREACH' | 'APPROVAL_REQUESTED' | 'CSAT_REQUEST';
  ticketId: string;
  userIds?: string[];
  message: string;
  templateKey?: string;
  metadata?: Record<string, any>;
}

export interface SLAJobData {
  ticketId: string;
  type: 'CHECK_FIRST_RESPONSE' | 'CHECK_RESOLUTION';
  dueAt: Date;
}

export interface AutomationJobData {
  ruleId: string;
  ticketId: string;
  trigger: string;
  context: Record<string, any>;
}

// Workers
const notificationWorker = new Worker('notifications', async (job: Job<NotificationJobData>) => {
  const { type, ticketId, userIds, message, templateKey } = job.data;
  
  try {
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) {
      console.error(`Ticket not found: ${ticketId}`);
      return;
    }

    let recipients = userIds || [];
    
    // Determine recipients based on notification type
    if (!recipients.length) {
      switch (type) {
        case 'TICKET_CREATED':
          // Notify team members
          if (ticket.teamId) {
            const memberships = await storage.getTeamMemberships(ticket.teamId);
            recipients = memberships.map(m => m.userId);
          }
          break;
        case 'TICKET_ASSIGNED':
          // Notify assignee
          if (ticket.assigneeId) {
            recipients = [ticket.assigneeId];
          }
          break;
        case 'SLA_BREACH':
          // Notify team lead and assignee
          if (ticket.assigneeId) {
            recipients = [ticket.assigneeId];
          }
          break;
      }
    }

    // Send notifications
    for (const userId of recipients) {
      const user = await storage.getUser(userId);
      if (user && user.isActive) {
        await sendEmail({
          to: user.email,
          subject: `[ServiceDesk] ${ticket.code} - ${message}`,
          html: generateNotificationEmail(type, ticket, message),
        });
      }
    }

    console.log(`Notification sent for ticket ${ticket.code}: ${message}`);
  } catch (error) {
    console.error('Failed to process notification job:', error);
    throw error;
  }
}, { connection: redis });

const slaWorker = new Worker('sla-monitoring', async (job: Job<SLAJobData>) => {
  const { ticketId, type, dueAt } = job.data;
  
  try {
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) return;

    // Check if ticket is still in breach
    const now = new Date();
    if (now < dueAt) return; // Not yet due

    // Check current status
    if (['RESOLVED', 'CLOSED', 'CANCELED'].includes(ticket.status)) {
      return; // Ticket already resolved
    }

    // Create SLA breach notification
    await notificationQueue.add('sla-breach', {
      type: 'SLA_BREACH',
      ticketId,
      message: `SLA breach detected for ${type.toLowerCase().replace('_', ' ')}`,
    });

    // Update ticket with SLA breach flag
    await storage.updateTicket(ticketId, {
      // Add SLA breach metadata
      metadata: {
        ...ticket.metadata,
        slaBreach: true,
        slaBreachType: type,
        slaBreachAt: now,
      }
    });

  } catch (error) {
    console.error('Failed to process SLA job:', error);
    throw error;
  }
}, { connection: redis });

const automationWorker = new Worker('automations', async (job: Job<AutomationJobData>) => {
  const { ruleId, ticketId, trigger, context } = job.data;
  
  try {
    const rule = await storage.getAutomationRule(ruleId);
    const ticket = await storage.getTicket(ticketId);
    
    if (!rule || !rule.isActive || !ticket) return;

    // Process automation actions
    for (const action of rule.actions) {
      switch (action.type) {
        case 'ASSIGN_TEAM':
          await storage.updateTicket(ticketId, { teamId: action.value });
          break;
        case 'ASSIGN_USER':
          await storage.updateTicket(ticketId, { assigneeId: action.value });
          break;
        case 'SET_PRIORITY':
          await storage.updateTicket(ticketId, { priority: action.value });
          break;
        case 'ADD_COMMENT':
          await storage.createTicketComment({
            ticketId,
            authorId: 'system',
            visibility: 'INTERNAL',
            body: action.value,
          });
          break;
        case 'SEND_NOTIFICATION':
          await notificationQueue.add('automation-notification', {
            type: 'TICKET_UPDATED',
            ticketId,
            message: action.value || 'Ticket updated by automation rule',
          });
          break;
      }
    }

    console.log(`Automation rule ${rule.name} executed for ticket ${ticket.code}`);
  } catch (error) {
    console.error('Failed to process automation job:', error);
    throw error;
  }
}, { connection: redis });

// Helper functions
function generateNotificationEmail(type: string, ticket: any, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">ServiceDesk - Notificação</h2>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Chamado:</strong> ${ticket.code}</p>
        <p><strong>Assunto:</strong> ${ticket.subject}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><strong>Prioridade:</strong> ${ticket.priority}</p>
      </div>
      <p><strong>Mensagem:</strong> ${message}</p>
      <hr style="margin: 24px 0;">
      <p style="color: #64748b; font-size: 14px;">
        Esta é uma notificação automática do sistema ServiceDesk.
      </p>
    </div>
  `;
}

// Schedule SLA checks for existing tickets
export async function scheduleSLAChecks() {
  try {
    const openTickets = await storage.getTickets({
      status: ['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_APPROVAL'],
      limit: 1000,
    });

    for (const ticket of openTickets) {
      if (ticket.dueAt && ticket.dueAt > new Date()) {
        // Schedule SLA check
        const delay = ticket.dueAt.getTime() - Date.now();
        await slaQueue.add(
          'sla-check',
          {
            ticketId: ticket.id,
            type: 'CHECK_RESOLUTION',
            dueAt: ticket.dueAt,
          },
          { delay }
        );
      }
    }

    console.log(`Scheduled SLA checks for ${openTickets.length} tickets`);
  } catch (error) {
    console.error('Failed to schedule SLA checks:', error);
  }
}

// Export queues for external use
export { notificationQueue as jobQueue };

// Graceful shutdown
process.on('SIGTERM', async () => {
  await notificationWorker.close();
  await slaWorker.close();
  await automationWorker.close();
});
