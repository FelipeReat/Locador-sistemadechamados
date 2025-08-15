
import { storage } from './storage';
import { randomUUID } from 'crypto';

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  messageId: string;
  date: Date;
}

export class EmailProcessor {
  async processIncomingEmail(email: ParsedEmail): Promise<string | null> {
    try {
      // Extract ticket code from subject if it's a reply
      const ticketCodeMatch = email.subject.match(/\[([A-Z]+-\d+)\]/);
      
      if (ticketCodeMatch) {
        // This is a reply to existing ticket
        return await this.processTicketReply(ticketCodeMatch[1], email);
      } else {
        // This is a new ticket
        return await this.createTicketFromEmail(email);
      }
    } catch (error) {
      console.error('Error processing email:', error);
      return null;
    }
  }

  private async processTicketReply(ticketCode: string, email: ParsedEmail): Promise<string> {
    // Find ticket by code
    const ticket = await storage.getTicketByCode(ticketCode);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketCode}`);
    }

    // Find user by email
    const user = await storage.getUserByEmail(email.from);
    if (!user) {
      throw new Error(`User not found: ${email.from}`);
    }

    // Create comment
    const comment = await storage.createTicketComment({
      ticketId: ticket.id,
      authorId: user.id,
      visibility: 'PUBLIC',
      body: this.extractEmailBody(email),
    });

    // Update ticket status if it was waiting for customer
    if (ticket.status === 'WAITING_CUSTOMER') {
      await storage.updateTicket(ticket.id, {
        status: 'IN_PROGRESS',
      });
    }

    return ticket.id;
  }

  private async createTicketFromEmail(email: ParsedEmail): Promise<string> {
    // Find user by email
    let user = await storage.getUserByEmail(email.from);
    
    if (!user) {
      // Create a new user if not found
      const domain = email.from.split('@')[1];
      let org = await storage.getOrganizationByDomain(domain);
      
      if (!org) {
        // Create organization for the domain
        org = await storage.createOrganization({
          name: domain,
          domain: domain,
          isActive: true,
        });

        // Create default team
        const team = await storage.createTeam({
          orgId: org.id,
          departmentId: null,
          name: "Suporte Geral",
          description: "Equipe de suporte geral",
          isActive: true,
        });
      }

      // Create user
      user = await storage.createUser({
        orgId: org.id,
        email: email.from,
        name: email.from.split('@')[0], // Use email prefix as name
        password: randomUUID(), // Random password, user will need to reset
        mfaSecret: null,
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
        isActive: true,
      });

      // Add as requester
      await storage.createMembership({
        userId: user.id,
        teamId: org.id, // Use any team ID for now
        roles: ["REQUESTER"],
        isActive: true,
      });
    }

    // Create ticket
    const ticket = await storage.createTicket({
      orgId: user.orgId,
      code: await this.generateTicketCode(user.orgId),
      requesterId: user.id,
      assigneeId: null,
      teamId: null,
      catalogId: null,
      priority: 'P3', // Default priority
      status: 'NEW',
      subject: email.subject,
      description: this.extractEmailBody(email),
      customFields: {},
      dueAt: this.calculateDueDate('P3'),
    });

    return ticket.id;
  }

  private extractEmailBody(email: ParsedEmail): string {
    // Remove email signatures and previous conversation
    let body = email.text || '';
    
    // Common signature separators
    const signatureSeparators = [
      '\n--\n',
      '\n-- \n',
      '\nSent from',
      '\nEnviado do',
      '\n-----Original Message-----',
      '\n-----Mensagem Original-----',
    ];

    for (const separator of signatureSeparators) {
      const index = body.indexOf(separator);
      if (index > 0) {
        body = body.substring(0, index);
        break;
      }
    }

    return body.trim();
  }

  private async generateTicketCode(orgId: string): Promise<string> {
    const org = await storage.getOrganization(orgId);
    if (!org) throw new Error('Organization not found');
    
    const prefix = org.domain.split('.')[0].toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    
    return `${prefix}-${timestamp}`;
  }

  private calculateDueDate(priority: string): Date {
    const slaMinutes = {
      P1: 240, // 4 hours
      P2: 480, // 8 hours
      P3: 2880, // 2 days
      P4: 7200, // 5 days
      P5: 14400, // 10 days
    };

    return new Date(Date.now() + (slaMinutes[priority] || 2880) * 60 * 1000);
  }
}

export const emailProcessor = new EmailProcessor();
