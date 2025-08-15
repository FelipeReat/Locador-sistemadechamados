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
      name: "João Silva",
      password: "$2b$10$hash", // Should be hashed
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
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
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
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.orgId === orgId);
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.domain === domain);
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
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error("Organization not found");
    
    const updatedOrg = { ...org, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByOrg(orgId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.orgId === orgId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      ...insertTeam,
      id,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id);
    if (!team) throw new Error("Team not found");
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Membership methods
  async getUserMemberships(userId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values()).filter(mem => mem.userId === userId);
  }

  async getTeamMemberships(teamId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values()).filter(mem => mem.teamId === teamId);
  }

  async createMembership(insertMembership: Omit<Membership, 'id' | 'createdAt'>): Promise<Membership> {
    const id = randomUUID();
    const membership: Membership = {
      ...insertMembership,
      id,
      createdAt: new Date(),
    };
    this.memberships.set(id, membership);
    return membership;
  }

  async updateMembership(id: string, updates: Partial<Membership>): Promise<Membership> {
    const membership = this.memberships.get(id);
    if (!membership) throw new Error("Membership not found");
    
    const updatedMembership = { ...membership, ...updates };
    this.memberships.set(id, updatedMembership);
    return updatedMembership;
  }

  // Ticket methods
  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByCode(code: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(ticket => ticket.code === code);
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

    return updatedTicket;
  }

  async getTicketEvents(ticketId: string): Promise<TicketEvent[]> {
    return Array.from(this.ticketEvents.values())
      .filter(event => event.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createTicketEvent(insertEvent: Omit<TicketEvent, 'id' | 'createdAt'>): Promise<TicketEvent> {
    const id = randomUUID();
    const event: TicketEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.ticketEvents.set(id, event);
    return event;
  }

  // Ticket Comment methods
  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return Array.from(this.ticketComments.values())
      .filter(comment => comment.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
    return comment;
  }

  // Service Catalog methods
  async getServiceCatalog(orgId: string): Promise<ServiceCatalog[]> {
    return Array.from(this.serviceCatalog.values())
      .filter(item => item.orgId === orgId && item.isActive);
  }

  async getServiceCatalogItem(id: string): Promise<ServiceCatalog | undefined> {
    return this.serviceCatalog.get(id);
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
    return item;
  }

  async updateServiceCatalogItem(id: string, updates: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const item = this.serviceCatalog.get(id);
    if (!item) throw new Error("Service catalog item not found");
    
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.serviceCatalog.set(id, updatedItem);
    return updatedItem;
  }

  // Knowledge Base methods
  async getKnowledgeArticles(orgId: string, status?: string): Promise<KnowledgeArticle[]> {
    let articles = Array.from(this.knowledgeArticles.values())
      .filter(article => article.orgId === orgId);

    if (status) {
      articles = articles.filter(article => article.status === status);
    }

    return articles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    return this.knowledgeArticles.get(id);
  }

  async getKnowledgeArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    return Array.from(this.knowledgeArticles.values()).find(article => article.slug === slug);
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
    return article;
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const article = this.knowledgeArticles.get(id);
    if (!article) throw new Error("Knowledge article not found");
    
    const updatedArticle = { ...article, ...updates, updatedAt: new Date() };
    this.knowledgeArticles.set(id, updatedArticle);
    return updatedArticle;
  }

  // Automation Rules methods
  async getAutomationRules(orgId: string): Promise<AutomationRule[]> {
    return Array.from(this.automationRules.values())
      .filter(rule => rule.orgId === orgId);
  }

  async getAutomationRule(id: string): Promise<AutomationRule | undefined> {
    return this.automationRules.get(id);
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
    return rule;
  }

  async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const rule = this.automationRules.get(id);
    if (!rule) throw new Error("Automation rule not found");
    
    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.automationRules.set(id, updatedRule);
    return updatedRule;
  }

  // SLA methods
  async getSLAs(orgId: string): Promise<SLA[]> {
    return Array.from(this.slas.values())
      .filter(sla => sla.orgId === orgId && sla.isActive);
  }

  async getSLA(id: string): Promise<SLA | undefined> {
    return this.slas.get(id);
  }

  async createSLA(insertSLA: InsertSLA): Promise<SLA> {
    const id = randomUUID();
    const sla: SLA = {
      ...insertSLA,
      id,
      createdAt: new Date(),
    };
    this.slas.set(id, sla);
    return sla;
  }

  async updateSLA(id: string, updates: Partial<SLA>): Promise<SLA> {
    const sla = this.slas.get(id);
    if (!sla) throw new Error("SLA not found");
    
    const updatedSLA = { ...sla, ...updates };
    this.slas.set(id, updatedSLA);
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
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.orgId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
