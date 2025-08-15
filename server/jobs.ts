import { storage } from './storage';
import { sendEmail } from './email';

interface Job {
  id: string;
  type: string;
  data: any;
  scheduledFor: Date;
  completed: boolean;
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;
    
    console.log('Starting job queue...');
    this.intervalId = setInterval(() => {
      this.processJobs();
    }, 30000); // Process jobs every 30 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addJob(type: string, data: any, scheduledFor: Date = new Date()) {
    const job: Job = {
      id: `job-${Date.now()}-${Math.random()}`,
      type,
      data,
      scheduledFor,
      completed: false,
    };

    this.jobs.set(job.id, job);
    console.log(`Job ${job.id} scheduled for ${scheduledFor}`);
    return job.id;
  }

  private async processJobs() {
    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => !job.completed && job.scheduledFor <= now);

    for (const job of pendingJobs) {
      try {
        await this.executeJob(job);
        job.completed = true;
        console.log(`Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        // For now, mark as completed to avoid infinite retries
        job.completed = true;
      }
    }

    // Clean up completed jobs older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    Array.from(this.jobs.values())
      .filter(job => job.completed && job.scheduledFor < oneHourAgo)
      .forEach(job => this.jobs.delete(job.id));
  }

  private async executeJob(job: Job) {
    switch (job.type) {
      case 'CHECK_SLA_BREACH':
        await this.checkSLABreach(job.data);
        break;
      case 'SEND_NOTIFICATION':
        await this.sendNotification(job.data);
        break;
      case 'AUTO_ESCALATE':
        await this.autoEscalate(job.data);
        break;
      case 'SEND_CSAT_SURVEY':
        await this.sendCSATSurvey(job.data);
        break;
      default:
        console.warn(`Unknown job type: ${job.type}`);
    }
  }

  private async checkSLABreach(data: { ticketId: string }) {
    const ticket = await storage.getTicket(data.ticketId);
    if (!ticket || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return;
    }

    if (ticket.dueAt && new Date() > ticket.dueAt) {
      console.log(`SLA breach detected for ticket ${ticket.code}`);
      
      // Send notification about SLA breach
      this.addJob('SEND_NOTIFICATION', {
        type: 'SLA_BREACH',
        ticketId: ticket.id,
        message: `SLA breach detected for ticket ${ticket.code}`,
      });

      // Auto-escalate if configured
      this.addJob('AUTO_ESCALATE', {
        ticketId: ticket.id,
        reason: 'SLA_BREACH',
      });
    }
  }

  private async sendNotification(data: {
    type: string;
    ticketId: string;
    message: string;
    userIds?: string[];
  }) {
    const ticket = await storage.getTicket(data.ticketId);
    if (!ticket) return;

    let recipients: string[] = [];

    if (data.userIds) {
      recipients = data.userIds;
    } else {
      // Default recipients based on notification type
      switch (data.type) {
        case 'TICKET_CREATED':
          if (ticket.assigneeId) recipients.push(ticket.assigneeId);
          break;
        case 'TICKET_ASSIGNED':
          if (ticket.assigneeId) recipients.push(ticket.assigneeId);
          break;
        case 'SLA_BREACH':
          // Send to team managers and admins
          const memberships = await storage.getTeamMemberships(ticket.teamId || '');
          recipients = memberships
            .filter(m => m.roles.includes('ADMIN') || m.roles.includes('AGENT'))
            .map(m => m.userId);
          break;
      }
    }

    for (const userId of recipients) {
      const user = await storage.getUser(userId);
      if (user && user.isActive) {
        try {
          await sendEmail({
            to: user.email,
            subject: `[ServiceDesk] ${data.message}`,
            html: `
              <h2>Notificação do ServiceDesk</h2>
              <p><strong>Chamado:</strong> ${ticket.code} - ${ticket.subject}</p>
              <p><strong>Prioridade:</strong> ${ticket.priority}</p>
              <p><strong>Status:</strong> ${ticket.status}</p>
              <p><strong>Mensagem:</strong> ${data.message}</p>
              <hr>
              <p>Esta é uma notificação automática do sistema ServiceDesk.</p>
            `,
          });
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }
    }
  }

  private async autoEscalate(data: { ticketId: string; reason: string }) {
    const ticket = await storage.getTicket(data.ticketId);
    if (!ticket) return;

    // Find the next level team (simplified logic)
    const teams = await storage.getTeamsByOrg(ticket.orgId);
    const currentTeam = teams.find(t => t.id === ticket.teamId);
    
    if (currentTeam?.name.includes('N1')) {
      // Escalate to N2
      const n2Team = teams.find(t => t.name.includes('N2'));
      if (n2Team) {
        await storage.updateTicket(ticket.id, {
          teamId: n2Team.id,
          assigneeId: null, // Unassign to let team pick up
        });

        console.log(`Ticket ${ticket.code} escalated from ${currentTeam.name} to ${n2Team.name}`);

        // Send notification about escalation
        this.addJob('SEND_NOTIFICATION', {
          type: 'TICKET_ESCALATED',
          ticketId: ticket.id,
          message: `Ticket escalated to ${n2Team.name} due to ${data.reason}`,
        });
      }
    }
  }

  private async sendCSATSurvey(data: { ticketId: string }) {
    const ticket = await storage.getTicket(data.ticketId);
    if (!ticket || ticket.status !== 'RESOLVED') return;

    const requester = await storage.getUser(ticket.requesterId);
    if (!requester) return;

    try {
      await sendEmail({
        to: requester.email,
        subject: `[ServiceDesk] Avalie nosso atendimento - ${ticket.code}`,
        html: `
          <h2>Como foi nosso atendimento?</h2>
          <p>Olá ${requester.name},</p>
          <p>Seu chamado <strong>${ticket.code} - ${ticket.subject}</strong> foi resolvido.</p>
          <p>Por favor, avalie nosso atendimento:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="#" style="display: inline-block; margin: 5px; padding: 10px 15px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px;">😞 Muito Ruim</a>
            <a href="#" style="display: inline-block; margin: 5px; padding: 10px 15px; background: #f97316; color: white; text-decoration: none; border-radius: 5px;">😐 Ruim</a>
            <a href="#" style="display: inline-block; margin: 5px; padding: 10px 15px; background: #eab308; color: white; text-decoration: none; border-radius: 5px;">😊 Regular</a>
            <a href="#" style="display: inline-block; margin: 5px; padding: 10px 15px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px;">😄 Bom</a>
            <a href="#" style="display: inline-block; margin: 5px; padding: 10px 15px; background: #16a34a; color: white; text-decoration: none; border-radius: 5px;">😍 Excelente</a>
          </div>
          <p>Obrigado por usar nossos serviços!</p>
        `,
      });
    } catch (error) {
      console.error(`Failed to send CSAT survey to ${requester.email}:`, error);
    }
  }
}

export const jobQueue = new JobQueue();

// Schedule periodic SLA checks for all active tickets
export async function scheduleSLAChecks() {
  try {
    // This is a simplified approach - in production you'd want more efficient querying
    const orgs = ['org-1']; // Get from storage in real implementation
    
    for (const orgId of orgs) {
      const tickets = await storage.getTickets({
        orgId,
        status: 'IN_PROGRESS',
      });

      for (const ticket of tickets) {
        if (ticket.dueAt) {
          // Check SLA 1 hour before breach
          const checkTime = new Date(ticket.dueAt.getTime() - 60 * 60 * 1000);
          if (checkTime > new Date()) {
            jobQueue.addJob('CHECK_SLA_BREACH', { ticketId: ticket.id }, checkTime);
          }

          // Also check at breach time
          jobQueue.addJob('CHECK_SLA_BREACH', { ticketId: ticket.id }, ticket.dueAt);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling SLA checks:', error);
  }
}

// Auto-start the job queue
jobQueue.start();
