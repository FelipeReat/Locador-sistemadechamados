import {
  type User,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Team,
  type InsertTeam,
  type Ticket,
  type InsertTicket,
  type ServiceCatalog,
  type InsertServiceCatalog,
  type TicketComment,
  type InsertTicketComment,
  type KnowledgeArticle,
  type InsertKnowledgeArticle,
  type AutomationRule,
  type InsertAutomationRule,
  type SLA,
  type InsertSLA,
  type TicketEvent,
  type Attachment,
  type Membership,
  type Department,
  type Approval,
  type SLAClock,
  type WebhookEndpoint,
  type Notification,
  type CSATSurvey,
} from "@shared/schema";
import { randomUUID } from "crypto";
import redis from './redis';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getUsersByOrg(orgId: string): Promise<User[]>;

  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByDomain(domain: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization>;

  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByOrg(orgId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team>;

  // Memberships
  getUserMemberships(userId: string): Promise<Membership[]>;
  getTeamMemberships(teamId: string): Promise<Membership[]>;
  createMembership(membership: Omit<Membership, 'id' | 'createdAt'>): Promise<Membership>;
  updateMembership(id: string, updates: Partial<Membership>): Promise<Membership>;

  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByCode(code: string): Promise<Ticket | undefined>;
  getTickets(filters: {
    orgId: string;
    status?: string;
    priority?: string;
    teamId?: string;
    assigneeId?: string;
    requesterId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;
  getTicketEvents(ticketId: string): Promise<TicketEvent[]>;
  createTicketEvent(event: Omit<TicketEvent, 'id' | 'createdAt'>): Promise<TicketEvent>;

  // Ticket Comments
  getTicketComments(ticketId: string): Promise<TicketComment[]>;
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;

  // Service Catalog
  getServiceCatalog(orgId: string): Promise<ServiceCatalog[]>;
  getServiceCatalogItem(id: string): Promise<ServiceCatalog | undefined>;
  createServiceCatalogItem(item: InsertServiceCatalog): Promise<ServiceCatalog>;
  updateServiceCatalogItem(id: string, updates: Partial<ServiceCatalog>): Promise<ServiceCatalog>;

  // Knowledge Base
  getKnowledgeArticles(orgId: string, status?: string): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  getKnowledgeArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle>;

  // Automation Rules
  getAutomationRules(orgId: string): Promise<AutomationRule[]>;
  getAutomationRule(id: string): Promise<AutomationRule | undefined>;
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule>;

  // SLA
  getSLAs(orgId: string): Promise<SLA[]>;
  getSLA(id: string): Promise<SLA | undefined>;
  createSLA(sla: InsertSLA): Promise<SLA>;
  updateSLA(id: string, updates: Partial<SLA>): Promise<SLA>;

  // Dashboard metrics
  getDashboardMetrics(orgId: string): Promise<{
    openTickets: number;
    slaAtRisk: number;
    resolvedToday: number;
    avgCSAT: number;
  }>;

  // Reports
  getTicketsByStatus(orgId: string): Promise<{ status: string; count: number }[]>;
  getRecentTickets(orgId: string, limit: number): Promise<Ticket[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private teams: Map<string, Team> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private ticketEvents: Map<string, TicketEvent> = new Map();
  private ticketComments: Map<string, TicketComment> = new Map();
  private serviceCatalog: Map<string, ServiceCatalog> = new Map();
  private knowledgeArticles: Map<string, KnowledgeArticle> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private slas: Map<string, SLA> = new Map();
  private departments: Map<string, Department> = new Map();
  private ticketCounter = 1;

  private cacheGet = async (key: string): Promise<any> => {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Redis cache get failed:', error);
      return null;
    }
  };

  private cacheSet = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.warn('Redis cache set failed:', error);
    }
  };

  private cacheDel = async (pattern: string): Promise<void> => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Redis cache delete failed:', error);
    }
  };

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample organization
    const org: Organization = {
      id: "org-1",
      name: "Acme Corporation",
      domain: "acme.com",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(org.id, org);

    // Create sample departments
    const dept1: Department = {
      id: "dept-1",
      orgId: org.id,
      name: "Tecnologia da Informação",
      description: "Departamento de TI",
      isActive: true,
      createdAt: new Date(),
    };
    this.departments.set(dept1.id, dept1);

    // Create sample teams
    const team1: Team = {
      id: "team-1",
      orgId: org.id,
      departmentId: dept1.id,
      name: "Suporte N1",
      description: "Equipe de suporte nível 1",
      isActive: true,
      createdAt: new Date(),
    };

    const team2: Team = {
      id: "team-2",
      orgId: org.id,
      departmentId: dept1.id,
      name: "Suporte N2",
      description: "Equipe de suporte nível 2",
      isActive: true,
      createdAt: new Date(),
    };

    this.teams.set(team1.id, team1);
    this.teams.set(team2.id, team2);

    // Create sample users
    const admin: User = {
      id: "user-1",
      orgId: org.id,
      email: "admin@acme.com",
      name: "Administrador do Sistema",
      password: "$2b$10$tedq4kySn0U6sSGCVMCiFuEeqxD31gEv//fw/AZw2syfxKYmQiRo.", // admin123
      mfaSecret: null,
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo",
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const agent1: User = {
      id: "user-2",
      orgId: org.id,
      email: "roberto.silva@acme.com",
      name: "Roberto Silva",
      password: "$2b$10$hash",
      mfaSecret: null,
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo",
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(admin.id, admin);
    this.users.set(agent1.id, agent1);

    // Create sample memberships
    const adminMembership: Membership = {
      id: "mem-1",
      userId: admin.id,
      teamId: team1.id,
      roles: ["ADMIN"],
      isActive: true,
      createdAt: new Date(),
    };

    const agentMembership: Membership = {
      id: "mem-2",
      userId: agent1.id,
      teamId: team1.id,
      roles: ["AGENT"],
      isActive: true,
      createdAt: new Date(),
    };

    this.memberships.set(adminMembership.id, adminMembership);
    this.memberships.set(agentMembership.id, agentMembership);

    // Create sample service catalog
    const catalogItems: ServiceCatalog[] = [
      {
        id: "cat-1",
        orgId: org.id,
        name: "Solicitação de Hardware",
        description: "Solicitação de equipamentos, manutenção e substituição",
        category: "Hardware",
        subcategory: "Equipamentos",
        defaultPriority: "P3",
        requiresApproval: true,
        formJson: {
          fields: [
            { name: "equipment_type", label: "Tipo de Equipamento", type: "select", required: true },
            { name: "justification", label: "Justificativa", type: "textarea", required: true },
          ]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-2",
        orgId: org.id,
        name: "Acesso a Sistemas",
        description: "Liberação de acesso, criação de usuários e permissões",
        category: "Segurança",
        subcategory: "Acesso",
        defaultPriority: "P2",
        requiresApproval: true,
        formJson: {
          fields: [
            { name: "system", label: "Sistema", type: "select", required: true },
            { name: "access_level", label: "Nível de Acesso", type: "select", required: true },
          ]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    catalogItems.forEach(item => this.serviceCatalog.set(item.id, item));

    // Create sample tickets
    const sampleTickets: Ticket[] = [
      {
        id: "ticket-1",
        orgId: org.id,
        code: "SD-2024-0001",
        requesterId: admin.id,
        assigneeId: agent1.id,
        teamId: team1.id,
        catalogId: "cat-1",
        priority: "P1",
        status: "IN_PROGRESS",
        subject: "Sistema de email fora do ar",
        description: "O sistema de email corporativo está completamente inacessível desde as 14:30.",
        customFieldsJson: {},
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        resolvedAt: null,
        closedAt: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(),
      },
      {
        id: "ticket-2",
        orgId: org.id,
        code: "SD-2024-0002",
        requesterId: admin.id,
        assigneeId: null,
        teamId: team1.id,
        catalogId: "cat-2",
        priority: "P3",
        status: "NEW",
        subject: "Solicitação de acesso ao sistema",
        description: "Preciso de acesso ao sistema de RH para consultar informações de funcionários.",
        customFieldsJson: { system: "RH", access_level: "Leitura" },
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        resolvedAt: null,
        closedAt: null,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(),
      },
    ];

    sampleTickets.forEach(ticket => this.tickets.set(ticket.id, ticket));

    // Create sample SLA
    const defaultSLA: SLA = {
      id: "sla-1",
      orgId: org.id,
      name: "SLA Padrão",
      appliesToJson: { priority: ["P1", "P2", "P3", "P4", "P5"] },
      firstResponseMins: 30,
      resolutionMins: 240,
      calendarJson: { businessHours: "09:00-18:00", timezone: "America/Sao_Paulo" },
      isActive: true,
      createdAt: new Date(),
    };

    this.slas.set(defaultSLA.id, defaultSLA);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const user = this.users.get(id);
    if (user) {
      await this.cacheSet(cacheKey, user, 300); // 5 minutes
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const cacheKey = `user:email:${email}`;

    // Try cache first
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const user = Array.from(this.users.values()).find(user => user.email === email);

    // Cache the result
    if (user) {
      await this.cacheSet(cacheKey, user, 300); // 5 minutes
    }

    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    await this.cacheDel(`user:*`); // Clear user cache
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    await this.cacheDel(`user:${id}`); // Clear specific user cache
    await this.cacheDel(`user:email:${user.email}`); // Clear email cache
    return updatedUser;
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    const cacheKey = `users:org:${orgId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const users = Array.from(this.users.values()).filter(user => user.orgId === orgId);
    await this.cacheSet(cacheKey, users, 300); // 5 minutes
    return users;
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const cacheKey = `organization:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const org = this.organizations.get(id);
    if (org) {
      await this.cacheSet(cacheKey, org, 300); // 5 minutes
    }
    return org;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    const cacheKey = `organization:domain:${domain}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const org = Array.from(this.organizations.values()).find(org => org.domain === domain);
    if (org) {
      await this.cacheSet(cacheKey, org, 300); // 5 minutes
    }
    return org;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(id, org);
    await this.cacheDel(`organization:*`); // Clear organization cache
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error("Organization not found");

    const updatedOrg = { ...org, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updatedOrg);
    await this.cacheDel(`organization:${id}`); // Clear specific org cache
    if (org.domain) {
      await this.cacheDel(`organization:domain:${org.domain}`); // Clear domain cache
    }
    return updatedOrg;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    const cacheKey = `team:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const team = this.teams.get(id);
    if (team) {
      await this.cacheSet(cacheKey, team, 300); // 5 minutes
    }
    return team;
  }

  async getTeamsByOrg(orgId: string): Promise<Team[]> {
    const cacheKey = `teams:org:${orgId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const teams = Array.from(this.teams.values()).filter(team => team.orgId === orgId);
    await this.cacheSet(cacheKey, teams, 300); // 5 minutes
    return teams;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      ...insertTeam,
      id,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    await this.cacheDel(`teams:org:${team.orgId}`); // Clear org team cache
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id);
    if (!team) throw new Error("Team not found");

    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    await this.cacheDel(`team:${id}`); // Clear specific team cache
    await this.cacheDel(`teams:org:${team.orgId}`); // Clear org team cache
    return updatedTeam;
  }

  // Membership methods
  async getUserMemberships(userId: string): Promise<Membership[]> {
    const cacheKey = `memberships:user:${userId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const memberships = Array.from(this.memberships.values()).filter(mem => mem.userId === userId);
    await this.cacheSet(cacheKey, memberships, 300); // 5 minutes
    return memberships;
  }

  async getTeamMemberships(teamId: string): Promise<Membership[]> {
    const cacheKey = `memberships:team:${teamId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const memberships = Array.from(this.memberships.values()).filter(mem => mem.teamId === teamId && mem.isActive);
    await this.cacheSet(cacheKey, memberships, 300); // 5 minutes
    return memberships;
  }

  async createMembership(insertMembership: Omit<Membership, 'id' | 'createdAt'>): Promise<Membership> {
    const id = randomUUID();
    const membership: Membership = {
      ...insertMembership,
      id,
      createdAt: new Date(),
    };
    this.memberships.set(id, membership);
    await this.cacheDel(`memberships:user:${membership.userId}`);
    await this.cacheDel(`memberships:team:${membership.teamId}`);
    return membership;
  }

  async updateMembership(id: string, updates: Partial<Membership>): Promise<Membership> {
    const membership = this.memberships.get(id);
    if (!membership) throw new Error("Membership not found");

    const updatedMembership = { ...membership, ...updates };
    this.memberships.set(id, updatedMembership);
    await this.cacheDel(`memberships:user:${membership.userId}`);
    await this.cacheDel(`memberships:team:${membership.teamId}`);
    return updatedMembership;
  }

  // Ticket methods
  async getTicket(id: string): Promise<Ticket | undefined> {
    const cacheKey = `ticket:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const ticket = this.tickets.get(id);
    if (ticket) {
      await this.cacheSet(cacheKey, ticket, 300); // 5 minutes
    }
    return ticket;
  }

  async getTicketByCode(code: string): Promise<Ticket | undefined> {
    const cacheKey = `ticket:code:${code}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const ticket = Array.from(this.tickets.values()).find(ticket => ticket.code === code);
    if (ticket) {
      await this.cacheSet(cacheKey, ticket, 300); // 5 minutes
    }
    return ticket;
  }

  async getTickets(filters: {
    orgId: string;
    status?: string;
    priority?: string;
    teamId?: string;
    assigneeId?: string;
    requesterId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Ticket[]> {
    // Cache key based on filters
    const cacheKey = `tickets:org:${filters.orgId}:${filters.status || 'all'}:${filters.priority || 'all'}:${filters.teamId || 'all'}:${filters.assigneeId || 'all'}:${filters.requesterId || 'all'}:${filters.search || 'none'}:${filters.limit || 'nolimit'}:${filters.offset || 'nooffset'}`;

    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    let tickets = Array.from(this.tickets.values()).filter(ticket => ticket.orgId === filters.orgId);

    if (filters.status) {
      tickets = tickets.filter(ticket => ticket.status === filters.status);
    }

    if (filters.priority) {
      tickets = tickets.filter(ticket => ticket.priority === filters.priority);
    }

    if (filters.teamId) {
      tickets = tickets.filter(ticket => ticket.teamId === filters.teamId);
    }

    if (filters.assigneeId) {
      tickets = tickets.filter(ticket => ticket.assigneeId === filters.assigneeId);
    }

    if (filters.requesterId) {
      tickets = tickets.filter(ticket => ticket.requesterId === filters.requesterId);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      tickets = tickets.filter(ticket =>
        ticket.subject.toLowerCase().includes(search) ||
        ticket.description.toLowerCase().includes(search) ||
        ticket.code.toLowerCase().includes(search)
      );
    }

    // Sort by creation date (newest first)
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters.offset) {
      tickets = tickets.slice(filters.offset);
    }

    if (filters.limit) {
      tickets = tickets.slice(0, filters.limit);
    }

    await this.cacheSet(cacheKey, tickets, 300); // 5 minutes
    return tickets;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const code = `SD-${new Date().getFullYear()}-${String(this.ticketCounter++).padStart(4, '0')}`;

    const ticket: Ticket = {
      ...insertTicket,
      id,
      code,
      resolvedAt: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tickets.set(id, ticket);

    // Create initial event
    await this.createTicketEvent({
      ticketId: id,
      actorId: insertTicket.requesterId,
      eventType: "CREATED",
      oldValue: null,
      newValue: "NEW",
      description: "Chamado criado",
    });

    await this.cacheDel(`tickets:org:${ticket.orgId}`); // Invalidate tickets list cache for the org
    await this.cacheDel(`ticket:code:${ticket.code}`); // Invalidate ticket by code cache

    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.tickets.get(id);
    if (!ticket) throw new Error("Ticket not found");

    const updatedTicket = { ...ticket, ...updates, updatedAt: new Date() };
    this.tickets.set(id, updatedTicket);

    // Create event for status changes
    if (updates.status && updates.status !== ticket.status) {
      await this.createTicketEvent({
        ticketId: id,
        actorId: null, // System action
        eventType: "STATUS_CHANGED",
        oldValue: ticket.status,
        newValue: updates.status,
        description: `Status alterado de ${ticket.status} para ${updates.status}`,
      });
    }

    // Clear cache
    await this.cacheDel(`ticket:${id}`);
    await this.cacheDel(`ticket:code:${ticket.code}`);
    await this.cacheDel(`tickets:org:${ticket.orgId}`);

    return updatedTicket;
  }

  async getTicketEvents(ticketId: string): Promise<TicketEvent[]> {
    const cacheKey = `ticketEvents:${ticketId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const events = Array.from(this.ticketEvents.values())
      .filter(event => event.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    await this.cacheSet(cacheKey, events, 300); // 5 minutes
    return events;
  }

  async createTicketEvent(insertEvent: Omit<TicketEvent, 'id' | 'createdAt'>): Promise<TicketEvent> {
    const id = randomUUID();
    const event: TicketEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.ticketEvents.set(id, event);
    await this.cacheDel(`ticketEvents:${insertEvent.ticketId}`); // Invalidate ticket events cache
    return event;
  }

  // Ticket Comment methods
  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    const cacheKey = `ticketComments:${ticketId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const comments = Array.from(this.ticketComments.values())
      .filter(comment => comment.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    await this.cacheSet(cacheKey, comments, 300); // 5 minutes
    return comments;
  }

  async createTicketComment(insertComment: InsertTicketComment): Promise<TicketComment> {
    const id = randomUUID();
    const comment: TicketComment = {
      ...insertComment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ticketComments.set(id, comment);
    await this.cacheDel(`ticketComments:${insertComment.ticketId}`); // Invalidate ticket comments cache
    return comment;
  }

  // Service Catalog methods
  async getServiceCatalog(orgId: string): Promise<ServiceCatalog[]> {
    const cacheKey = `serviceCatalog:org:${orgId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const items = Array.from(this.serviceCatalog.values())
      .filter(item => item.orgId === orgId && item.isActive);

    await this.cacheSet(cacheKey, items, 300); // 5 minutes
    return items;
  }

  async getServiceCatalogItem(id: string): Promise<ServiceCatalog | undefined> {
    const cacheKey = `serviceCatalogItem:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const item = this.serviceCatalog.get(id);
    if (item) {
      await this.cacheSet(cacheKey, item, 300); // 5 minutes
    }
    return item;
  }

  async createServiceCatalogItem(insertItem: InsertServiceCatalog): Promise<ServiceCatalog> {
    const id = randomUUID();
    const item: ServiceCatalog = {
      ...insertItem,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serviceCatalog.set(id, item);
    await this.cacheDel(`serviceCatalog:org:${item.orgId}`); // Invalidate org catalog cache
    return item;
  }

  async updateServiceCatalogItem(id: string, updates: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const item = this.serviceCatalog.get(id);
    if (!item) throw new Error("Service catalog item not found");

    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.serviceCatalog.set(id, updatedItem);
    await this.cacheDel(`serviceCatalogItem:${id}`); // Invalidate item cache
    await this.cacheDel(`serviceCatalog:org:${item.orgId}`); // Invalidate org catalog cache
    return updatedItem;
  }

  // Knowledge Base methods
  async getKnowledgeArticles(orgId: string, status?: string): Promise<KnowledgeArticle[]> {
    const cacheKey = `knowledgeArticles:org:${orgId}:${status || 'all'}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    let articles = Array.from(this.knowledgeArticles.values())
      .filter(article => article.orgId === orgId);

    if (status) {
      articles = articles.filter(article => article.status === status);
    }

    const sortedArticles = articles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    await this.cacheSet(cacheKey, sortedArticles, 300); // 5 minutes
    return sortedArticles;
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const cacheKey = `knowledgeArticle:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const article = this.knowledgeArticles.get(id);
    if (article) {
      await this.cacheSet(cacheKey, article, 300); // 5 minutes
    }
    return article;
  }

  async getKnowledgeArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    const cacheKey = `knowledgeArticle:slug:${slug}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const article = Array.from(this.knowledgeArticles.values()).find(article => article.slug === slug);
    if (article) {
      await this.cacheSet(cacheKey, article, 300); // 5 minutes
    }
    return article;
  }

  async createKnowledgeArticle(insertArticle: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const id = randomUUID();
    const article: KnowledgeArticle = {
      ...insertArticle,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.knowledgeArticles.set(id, article);
    await this.cacheDel(`knowledgeArticles:org:${article.orgId}`); // Invalidate org knowledge articles cache
    return article;
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const article = this.knowledgeArticles.get(id);
    if (!article) throw new Error("Knowledge article not found");

    const updatedArticle = { ...article, ...updates, updatedAt: new Date() };
    this.knowledgeArticles.set(id, updatedArticle);
    await this.cacheDel(`knowledgeArticle:${id}`); // Invalidate article cache
    await this.cacheDel(`knowledgeArticles:org:${article.orgId}`); // Invalidate org articles cache
    if (article.slug) {
      await this.cacheDel(`knowledgeArticle:slug:${article.slug}`); // Invalidate slug cache
    }
    return updatedArticle;
  }

  // Automation Rules methods
  async getAutomationRules(orgId: string): Promise<AutomationRule[]> {
    const cacheKey = `automationRules:org:${orgId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const rules = Array.from(this.automationRules.values())
      .filter(rule => rule.orgId === orgId);

    await this.cacheSet(cacheKey, rules, 300); // 5 minutes
    return rules;
  }

  async getAutomationRule(id: string): Promise<AutomationRule | undefined> {
    const cacheKey = `automationRule:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const rule = this.automationRules.get(id);
    if (rule) {
      await this.cacheSet(cacheKey, rule, 300); // 5 minutes
    }
    return rule;
  }

  async createAutomationRule(insertRule: InsertAutomationRule): Promise<AutomationRule> {
    const id = randomUUID();
    const rule: AutomationRule = {
      ...insertRule,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.automationRules.set(id, rule);
    await this.cacheDel(`automationRules:org:${rule.orgId}`); // Invalidate org rules cache
    return rule;
  }

  async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const rule = this.automationRules.get(id);
    if (!rule) throw new Error("Automation rule not found");

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.automationRules.set(id, updatedRule);
    await this.cacheDel(`automationRule:${id}`); // Invalidate rule cache
    await this.cacheDel(`automationRules:org:${rule.orgId}`); // Invalidate org rules cache
    return updatedRule;
  }

  // SLA methods
  async getSLAs(orgId: string): Promise<SLA[]> {
    const cacheKey = `slas:org:${orgId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const slas = Array.from(this.slas.values())
      .filter(sla => sla.orgId === orgId && sla.isActive);

    await this.cacheSet(cacheKey, slas, 300); // 5 minutes
    return slas;
  }

  async getSLA(id: string): Promise<SLA | undefined> {
    const cacheKey = `sla:${id}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const sla = this.slas.get(id);
    if (sla) {
      await this.cacheSet(cacheKey, sla, 300); // 5 minutes
    }
    return sla;
  }

  async createSLA(insertSLA: InsertSLA): Promise<SLA> {
    const id = randomUUID();
    const sla: SLA = {
      ...insertSLA,
      id,
      createdAt: new Date(),
    };
    this.slas.set(id, sla);
    await this.cacheDel(`slas:org:${sla.orgId}`); // Invalidate org SLAs cache
    return sla;
  }

  async updateSLA(id: string, updates: Partial<SLA>): Promise<SLA> {
    const sla = this.slas.get(id);
    if (!sla) throw new Error("SLA not found");

    const updatedSLA = { ...sla, ...updates };
    this.slas.set(id, updatedSLA);
    await this.cacheDel(`sla:${id}`); // Invalidate SLA cache
    await this.cacheDel(`slas:org:${sla.orgId}`); // Invalidate org SLAs cache
    return updatedSLA;
  }

  // Dashboard methods
  async getDashboardMetrics(orgId: string): Promise<{
    openTickets: number;
    slaAtRisk: number;
    resolvedToday: number;
    avgCSAT: number;
  }> {
    const tickets = Array.from(this.tickets.values()).filter(ticket => ticket.orgId === orgId);

    const openTickets = tickets.filter(ticket =>
      !['RESOLVED', 'CLOSED', 'CANCELED'].includes(ticket.status)
    ).length;

    const slaAtRisk = tickets.filter(ticket => {
      if (!ticket.dueAt || ticket.status === 'RESOLVED') return false;
      const now = new Date();
      const timeLeft = ticket.dueAt.getTime() - now.getTime();
      return timeLeft < 2 * 60 * 60 * 1000; // Less than 2 hours
    }).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = tickets.filter(ticket =>
      ticket.resolvedAt && ticket.resolvedAt >= today
    ).length;

    return {
      openTickets,
      slaAtRisk,
      resolvedToday,
      avgCSAT: 4.2, // Mock CSAT data
    };
  }

  async getTicketsByStatus(orgId: string): Promise<{ status: string; count: number }[]> {
    const tickets = Array.from(this.tickets.values()).filter(ticket => ticket.orgId === orgId);
    const statusCounts = new Map<string, number>();

    tickets.forEach(ticket => {
      const count = statusCounts.get(ticket.status) || 0;
      statusCounts.set(ticket.status, count + 1);
    });

    return Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));
  }

  async getRecentTickets(orgId: string, limit: number = 10): Promise<Ticket[]> {
    const cacheKey = `recentTickets:org:${orgId}:limit:${limit}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const tickets = Array.from(this.tickets.values())
      .filter(ticket => ticket.orgId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    await this.cacheSet(cacheKey, tickets, 300); // 5 minutes
    return tickets;
  }
}

export const storage = new MemStorage();