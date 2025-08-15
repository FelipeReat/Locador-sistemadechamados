import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { authenticateToken, requireRole, hashPassword, comparePassword, generateToken, type AuthenticatedRequest } from "./auth";
import { jobQueue, scheduleSLAChecks } from "./jobs";
import { sendEmail, emailTemplates } from "./email";
import {
  loginSchema,
  registerSchema,
  insertTicketSchema,
  insertTicketCommentSchema,
  insertServiceCatalogSchema,
  insertKnowledgeArticleSchema,
  insertAutomationRuleSchema,
  insertSLASchema,
  insertTeamSchema,
  insertUserSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if organization domain already exists
      const existingOrg = await storage.getOrganizationByDomain(data.orgDomain);
      if (existingOrg) {
        return res.status(400).json({ message: "Organization domain already exists" });
      }

      // Create organization
      const org = await storage.createOrganization({
        name: data.orgName,
        domain: data.orgDomain,
        isActive: true,
      });

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        orgId: org.id,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        mfaSecret: null,
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
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

      // Add user as admin
      await storage.createMembership({
        userId: user.id,
        teamId: team.id,
        roles: ["ADMIN"],
        isActive: true,
      });

      const token = generateToken(user.id);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: user.orgId,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      const token = generateToken(user.id);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: user.orgId,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Protected routes
  app.use("/api", authenticateToken);

  // User routes
  app.get("/api/me", async (req: AuthenticatedRequest, res) => {
    try {
      const memberships = await storage.getUserMemberships(req.user!.id);
      const teams = await Promise.all(
        memberships.map(async (m) => {
          const team = await storage.getTeam(m.teamId);
          return { ...team, roles: m.roles };
        })
      );

      res.json({
        ...req.user,
        password: undefined, // Don't send password
        teams,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", async (req: AuthenticatedRequest, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.user!.orgId);
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/tickets-by-status", async (req: AuthenticatedRequest, res) => {
    try {
      const data = await storage.getTicketsByStatus(req.user!.orgId);
      res.json(data);
    } catch (error) {
      console.error("Tickets by status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/recent-tickets", async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tickets = await storage.getRecentTickets(req.user!.orgId, limit);
      
      // Enrich with user data
      const enrichedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          const requester = await storage.getUser(ticket.requesterId);
          const assignee = ticket.assigneeId ? await storage.getUser(ticket.assigneeId) : null;
          return {
            ...ticket,
            requester: requester ? { id: requester.id, name: requester.name, email: requester.email } : null,
            assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
          };
        })
      );

      res.json(enrichedTickets);
    } catch (error) {
      console.error("Recent tickets error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (req: AuthenticatedRequest, res) => {
    try {
      const filters = {
        orgId: req.user!.orgId,
        status: req.query.status as string,
        priority: req.query.priority as string,
        teamId: req.query.teamId as string,
        assigneeId: req.query.assigneeId as string,
        requesterId: req.query.requesterId as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const tickets = await storage.getTickets(filters);
      
      // Enrich with user data
      const enrichedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          const requester = await storage.getUser(ticket.requesterId);
          const assignee = ticket.assigneeId ? await storage.getUser(ticket.assigneeId) : null;
          const team = ticket.teamId ? await storage.getTeam(ticket.teamId) : null;
          return {
            ...ticket,
            requester: requester ? { id: requester.id, name: requester.name, email: requester.email } : null,
            assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
            team: team ? { id: team.id, name: team.name } : null,
          };
        })
      );

      res.json(enrichedTickets);
    } catch (error) {
      console.error("Get tickets error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tickets/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket || ticket.orgId !== req.user!.orgId) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Get enriched data
      const requester = await storage.getUser(ticket.requesterId);
      const assignee = ticket.assigneeId ? await storage.getUser(ticket.assigneeId) : null;
      const team = ticket.teamId ? await storage.getTeam(ticket.teamId) : null;
      const comments = await storage.getTicketComments(ticket.id);
      const events = await storage.getTicketEvents(ticket.id);

      // Enrich comments with user data
      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const author = await storage.getUser(comment.authorId);
          return {
            ...comment,
            author: author ? { id: author.id, name: author.name, email: author.email } : null,
          };
        })
      );

      res.json({
        ...ticket,
        requester: requester ? { id: requester.id, name: requester.name, email: requester.email } : null,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
        team: team ? { id: team.id, name: team.name } : null,
        comments: enrichedComments,
        events,
      });
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTicketSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
        requesterId: req.user!.id,
      });

      // Calculate SLA due date based on priority
      const slaMinutes = {
        P1: 240, // 4 hours
        P2: 480, // 8 hours
        P3: 2880, // 2 days
        P4: 7200, // 5 days
        P5: 14400, // 10 days
      };

      const dueAt = new Date(Date.now() + slaMinutes[data.priority] * 60 * 1000);

      const ticket = await storage.createTicket({
        ...data,
        dueAt,
      });

      // Send notification emails
      jobQueue.addJob('SEND_NOTIFICATION', {
        type: 'TICKET_CREATED',
        ticketId: ticket.id,
        message: `New ticket created: ${ticket.subject}`,
      });

      // Schedule SLA checks
      const slaCheckTime = new Date(dueAt.getTime() - 60 * 60 * 1000); // 1 hour before
      if (slaCheckTime > new Date()) {
        jobQueue.addJob('CHECK_SLA_BREACH', { ticketId: ticket.id }, slaCheckTime);
      }
      jobQueue.addJob('CHECK_SLA_BREACH', { ticketId: ticket.id }, dueAt);

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Create ticket error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket || ticket.orgId !== req.user!.orgId) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const updates = req.body;
      
      // Handle status changes
      if (updates.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
        updates.resolvedAt = new Date();
        
        // Schedule CSAT survey
        const csatDelay = 30 * 60 * 1000; // 30 minutes after resolution
        jobQueue.addJob('SEND_CSAT_SURVEY', { ticketId: ticket.id }, new Date(Date.now() + csatDelay));
      }

      if (updates.status === 'CLOSED' && ticket.status !== 'CLOSED') {
        updates.closedAt = new Date();
      }

      const updatedTicket = await storage.updateTicket(req.params.id, updates);

      // Send notification if assignee changed
      if (updates.assigneeId && updates.assigneeId !== ticket.assigneeId) {
        jobQueue.addJob('SEND_NOTIFICATION', {
          type: 'TICKET_ASSIGNED',
          ticketId: ticket.id,
          message: `Ticket assigned to you`,
          userIds: [updates.assigneeId],
        });
      }

      res.json(updatedTicket);
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tickets/:id/comments", async (req: AuthenticatedRequest, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket || ticket.orgId !== req.user!.orgId) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const data = insertTicketCommentSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        authorId: req.user!.id,
      });

      const comment = await storage.createTicketComment(data);

      // Get author data for response
      const author = await storage.getUser(comment.authorId);

      res.status(201).json({
        ...comment,
        author: author ? { id: author.id, name: author.name, email: author.email } : null,
      });
    } catch (error) {
      console.error("Create comment error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service Catalog routes
  app.get("/api/catalog", async (req: AuthenticatedRequest, res) => {
    try {
      const catalog = await storage.getServiceCatalog(req.user!.orgId);
      res.json(catalog);
    } catch (error) {
      console.error("Get catalog error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/catalog", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertServiceCatalogSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
      });

      const item = await storage.createServiceCatalogItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create catalog item error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Knowledge Base routes
  app.get("/api/kb", async (req: AuthenticatedRequest, res) => {
    try {
      const status = req.query.status as string;
      const articles = await storage.getKnowledgeArticles(req.user!.orgId, status);
      res.json(articles);
    } catch (error) {
      console.error("Get knowledge articles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/kb/:slug", async (req: AuthenticatedRequest, res) => {
    try {
      const article = await storage.getKnowledgeArticleBySlug(req.params.slug);
      if (!article || article.orgId !== req.user!.orgId) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Get knowledge article error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/kb", requireRole(['ADMIN', 'AGENT']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertKnowledgeArticleSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
        createdById: req.user!.id,
      });

      const article = await storage.createKnowledgeArticle(data);
      res.status(201).json(article);
    } catch (error) {
      console.error("Create knowledge article error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req: AuthenticatedRequest, res) => {
    try {
      const teams = await storage.getTeamsByOrg(req.user!.orgId);
      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/teams", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertTeamSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
      });

      const team = await storage.createTeam(data);
      res.status(201).json(team);
    } catch (error) {
      console.error("Create team error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/users", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getUsersByOrg(req.user!.orgId);
      const usersWithoutPasswords = users.map(user => ({
        ...user,
        password: undefined,
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
      });

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      res.status(201).json({
        ...user,
        password: undefined,
      });
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SLA routes
  app.get("/api/sla", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const slas = await storage.getSLAs(req.user!.orgId);
      res.json(slas);
    } catch (error) {
      console.error("Get SLAs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sla", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertSLASchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
      });

      const sla = await storage.createSLA(data);
      res.status(201).json(sla);
    } catch (error) {
      console.error("Create SLA error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Automation routes
  app.get("/api/automations", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const rules = await storage.getAutomationRules(req.user!.orgId);
      res.json(rules);
    } catch (error) {
      console.error("Get automation rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/automations", requireRole(['ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAutomationRuleSchema.parse({
        ...req.body,
        orgId: req.user!.orgId,
      });

      const rule = await storage.createAutomationRule(data);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Create automation rule error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Initialize periodic jobs
  setTimeout(() => {
    scheduleSLAChecks();
  }, 5000); // Start after 5 seconds

  const httpServer = createServer(app);
  return httpServer;
}
