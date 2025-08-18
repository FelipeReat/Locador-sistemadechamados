import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and, or } from 'drizzle-orm';
import { users, tickets, comments, attachments } from '../shared/simple-schema';
import type { User, Ticket, Comment, Attachment, InsertUser, InsertTicket, InsertComment, InsertAttachment, TicketWithDetails } from '../shared/simple-schema';

const sql = neon(process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/servicedesk');
export const db = drizzle(sql);

export class SimpleStorage {
  // Users
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getAgents(): Promise<User[]> {
    const agents = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    }).from(users).where(or(eq(users.role, 'AGENT'), eq(users.role, 'ADMIN')));
    return agents;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async getAgents(): Promise<User[]> {
    return await db.select().from(users).where(and(
      eq(users.isActive, true),
      eq(users.role, 'AGENT')
    ));
  }

  // Tickets
  async createTicket(data: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(data).returning();
    return ticket;
  }

  async getTicketById(id: string): Promise<TicketWithDetails | null> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return null;

    const [requester] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email
    }).from(users).where(eq(users.id, ticket.requesterId));

    let assignee = null;
    if (ticket.assigneeId) {
      const [assigneeData] = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
      }).from(users).where(eq(users.id, ticket.assigneeId));
      assignee = assigneeData;
    }

    const ticketComments = await db.select({
      id: comments.id,
      ticketId: comments.ticketId,
      userId: comments.userId,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.name,
      userEmail: users.email
    }).from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.ticketId, id))
      .orderBy(comments.createdAt);

    const ticketAttachments = await db.select().from(attachments).where(eq(attachments.ticketId, id));

    return {
      ...ticket,
      requester,
      assignee,
      comments: ticketComments.map(c => ({
        id: c.id,
        ticketId: c.ticketId,
        userId: c.userId,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.userId,
          name: c.userName || '',
          email: c.userEmail || ''
        }
      })),
      attachments: ticketAttachments
    };
  }

  async getTickets(): Promise<TicketWithDetails[]> {
    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    
    const ticketsWithDetails = await Promise.all(
      allTickets.map(async (ticket) => {
        const [requester] = await db.select({
          id: users.id,
          name: users.name,
          email: users.email
        }).from(users).where(eq(users.id, ticket.requesterId));

        let assignee = null;
        if (ticket.assigneeId) {
          const [assigneeData] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email
          }).from(users).where(eq(users.id, ticket.assigneeId));
          assignee = assigneeData;
        }

        return {
          ...ticket,
          requester,
          assignee,
          comments: [],
          attachments: []
        };
      })
    );

    return ticketsWithDetails;
  }

  async getAllTickets(): Promise<Ticket[]> {
    const allTickets = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    
    const ticketsWithDetails = await Promise.all(
      allTickets.map(async (ticket) => {
        const [requester] = await db.select().from(users).where(eq(users.id, ticket.requesterId));
        const assignee = ticket.assigneeId 
          ? (await db.select().from(users).where(eq(users.id, ticket.assigneeId)))[0]
          : null;
        
        const ticketComments = await db.select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.ticketId, ticket.id))
        .orderBy(comments.createdAt);

        return {
          ...ticket,
          requester: requester ? { id: requester.id, name: requester.name, email: requester.email } : null,
          assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
          comments: ticketComments,
          attachments: []
        };
      })
    );

    return ticketsWithDetails;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    const userTickets = await db.select().from(tickets)
      .where(eq(tickets.requesterId, userId))
      .orderBy(desc(tickets.createdAt));
    
    const ticketsWithDetails = await Promise.all(
      userTickets.map(async (ticket) => {
        const [requester] = await db.select().from(users).where(eq(users.id, ticket.requesterId));
        const assignee = ticket.assigneeId 
          ? (await db.select().from(users).where(eq(users.id, ticket.assigneeId)))[0]
          : null;
        
        const ticketComments = await db.select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.ticketId, ticket.id))
        .orderBy(comments.createdAt);

        return {
          ...ticket,
          requester: requester ? { id: requester.id, name: requester.name, email: requester.email } : null,
          assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
          comments: ticketComments,
          attachments: []
        };
      })
    );

    return ticketsWithDetails;
  }

  async updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket | null> {
    const [ticket] = await db.update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket || null;
  }

  // Comments
  async addComment(data: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  }

  // Attachments
  async addAttachment(data: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(data).returning();
    return attachment;
  }

  async getAttachment(id: string): Promise<Attachment | null> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment || null;
  }
}

export const storage = new SimpleStorage();