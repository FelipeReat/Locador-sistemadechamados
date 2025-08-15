
import { storage } from './storage';

export interface ReportFilters {
  orgId: string;
  from?: Date;
  to?: Date;
  teamIds?: string[];
  userIds?: string[];
  priorities?: string[];
  categories?: string[];
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  slaBreaches: number;
  avgResolutionTime: number; // in hours
  avgFirstResponseTime: number; // in hours
  csatScore: number;
  topCategories: Array<{ category: string; count: number }>;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    assignedTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
  }>;
}

export interface SLAReport {
  totalTickets: number;
  slaCompliant: number;
  slaBreached: number;
  complianceRate: number;
  breachesByPriority: Record<string, number>;
  breachesByCategory: Record<string, number>;
  avgResolutionTimeByPriority: Record<string, number>;
}

export interface VolumeReport {
  totalTickets: number;
  ticketsByDay: Array<{ date: string; count: number }>;
  ticketsByStatus: Array<{ status: string; count: number }>;
  ticketsByPriority: Array<{ priority: string; count: number }>;
  ticketsByCategory: Array<{ category: string; count: number }>;
  ticketsByTeam: Array<{ teamId: string; teamName: string; count: number }>;
}

class ReportService {
  async getDashboardMetrics(filters: ReportFilters): Promise<DashboardMetrics> {
    const tickets = await this.getFilteredTickets(filters);
    
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => ['NEW', 'TRIAGE', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_APPROVAL', 'ON_HOLD'].includes(t.status)).length;
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;
    
    // Calculate SLA breaches (simplified)
    const slaBreaches = tickets.filter(t => 
      t.dueAt && 
      new Date() > t.dueAt && 
      !['RESOLVED', 'CLOSED'].includes(t.status)
    ).length;

    // Calculate average resolution time
    const resolvedWithTimes = tickets.filter(t => t.resolvedAt && t.createdAt);
    const avgResolutionTime = resolvedWithTimes.length > 0 
      ? resolvedWithTimes.reduce((acc, t) => acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedWithTimes.length / (1000 * 60 * 60)
      : 0;

    // Calculate average first response time (simplified - would need first response tracking)
    const avgFirstResponseTime = 0; // TODO: Implement first response tracking

    // Get CSAT score
    const { csatService } = await import('./csat');
    const csatMetrics = await csatService.getCSATMetrics(filters.orgId, 
      filters.from && filters.to ? { from: filters.from, to: filters.to } : undefined
    );
    
    // Top categories
    const categoryCount = new Map<string, number>();
    for (const ticket of tickets) {
      if (ticket.catalogId) {
        const catalog = await storage.getServiceCatalogItem(ticket.catalogId);
        if (catalog) {
          const current = categoryCount.get(catalog.category) || 0;
          categoryCount.set(catalog.category, current + 1);
        }
      }
    }
    
    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Agent performance
    const agentMap = new Map<string, { 
      name: string; 
      assigned: number; 
      resolved: number; 
      totalResolutionTime: number; 
    }>();

    for (const ticket of tickets) {
      if (ticket.assigneeId) {
        const current = agentMap.get(ticket.assigneeId) || { 
          name: '', 
          assigned: 0, 
          resolved: 0, 
          totalResolutionTime: 0 
        };
        
        if (!current.name) {
          const user = await storage.getUser(ticket.assigneeId);
          current.name = user?.name || 'Unknown';
        }
        
        current.assigned += 1;
        
        if (ticket.status === 'RESOLVED' && ticket.resolvedAt) {
          current.resolved += 1;
          current.totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        }
        
        agentMap.set(ticket.assigneeId, current);
      }
    }

    const agentPerformance = Array.from(agentMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.name,
      assignedTickets: data.assigned,
      resolvedTickets: data.resolved,
      avgResolutionTime: data.resolved > 0 ? data.totalResolutionTime / data.resolved / (1000 * 60 * 60) : 0,
    }));

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      slaBreaches,
      avgResolutionTime,
      avgFirstResponseTime,
      csatScore: csatMetrics.averageScore,
      topCategories,
      agentPerformance,
    };
  }

  async getSLAReport(filters: ReportFilters): Promise<SLAReport> {
    const tickets = await this.getFilteredTickets(filters);
    
    const totalTickets = tickets.length;
    
    // Calculate SLA compliance (simplified)
    const slaCompliant = tickets.filter(t => 
      !t.dueAt || 
      (t.resolvedAt && t.resolvedAt <= t.dueAt) ||
      (t.status === 'CLOSED' && t.closedAt && t.closedAt <= t.dueAt)
    ).length;
    
    const slaBreached = totalTickets - slaCompliant;
    const complianceRate = totalTickets > 0 ? (slaCompliant / totalTickets) * 100 : 0;

    // Breaches by priority
    const breachesByPriority: Record<string, number> = {};
    const breachesByCategory: Record<string, number> = {};
    const avgResolutionTimeByPriority: Record<string, number> = {};

    for (const ticket of tickets) {
      const isBreached = ticket.dueAt && 
        ((ticket.resolvedAt && ticket.resolvedAt > ticket.dueAt) ||
         (!ticket.resolvedAt && new Date() > ticket.dueAt));

      if (isBreached) {
        breachesByPriority[ticket.priority] = (breachesByPriority[ticket.priority] || 0) + 1;
        
        if (ticket.catalogId) {
          const catalog = await storage.getServiceCatalogItem(ticket.catalogId);
          if (catalog) {
            breachesByCategory[catalog.category] = (breachesByCategory[catalog.category] || 0) + 1;
          }
        }
      }

      // Calculate average resolution time by priority
      if (ticket.resolvedAt) {
        const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        if (!avgResolutionTimeByPriority[ticket.priority]) {
          avgResolutionTimeByPriority[ticket.priority] = resolutionTime / (1000 * 60 * 60);
        } else {
          avgResolutionTimeByPriority[ticket.priority] = 
            (avgResolutionTimeByPriority[ticket.priority] + resolutionTime / (1000 * 60 * 60)) / 2;
        }
      }
    }

    return {
      totalTickets,
      slaCompliant,
      slaBreached,
      complianceRate,
      breachesByPriority,
      breachesByCategory,
      avgResolutionTimeByPriority,
    };
  }

  async getVolumeReport(filters: ReportFilters): Promise<VolumeReport> {
    const tickets = await this.getFilteredTickets(filters);
    
    // Tickets by day
    const dailyCount = new Map<string, number>();
    for (const ticket of tickets) {
      const dateKey = ticket.createdAt.toISOString().split('T')[0];
      dailyCount.set(dateKey, (dailyCount.get(dateKey) || 0) + 1);
    }

    const ticketsByDay = Array.from(dailyCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Tickets by status
    const statusCount = new Map<string, number>();
    for (const ticket of tickets) {
      statusCount.set(ticket.status, (statusCount.get(ticket.status) || 0) + 1);
    }

    const ticketsByStatus = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }));

    // Tickets by priority
    const priorityCount = new Map<string, number>();
    for (const ticket of tickets) {
      priorityCount.set(ticket.priority, (priorityCount.get(ticket.priority) || 0) + 1);
    }

    const ticketsByPriority = Array.from(priorityCount.entries())
      .map(([priority, count]) => ({ priority, count }));

    // Tickets by category
    const categoryCount = new Map<string, number>();
    for (const ticket of tickets) {
      if (ticket.catalogId) {
        const catalog = await storage.getServiceCatalogItem(ticket.catalogId);
        if (catalog) {
          categoryCount.set(catalog.category, (categoryCount.get(catalog.category) || 0) + 1);
        }
      }
    }

    const ticketsByCategory = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }));

    // Tickets by team
    const teamCount = new Map<string, { name: string; count: number }>();
    for (const ticket of tickets) {
      if (ticket.teamId) {
        if (!teamCount.has(ticket.teamId)) {
          const team = await storage.getTeam(ticket.teamId);
          teamCount.set(ticket.teamId, { name: team?.name || 'Unknown', count: 0 });
        }
        const current = teamCount.get(ticket.teamId)!;
        current.count += 1;
      }
    }

    const ticketsByTeam = Array.from(teamCount.entries())
      .map(([teamId, data]) => ({ teamId, teamName: data.name, count: data.count }));

    return {
      totalTickets: tickets.length,
      ticketsByDay,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByTeam,
    };
  }

  private async getFilteredTickets(filters: ReportFilters) {
    // This would be a database query in a real implementation
    const allTickets = await storage.getTickets({ orgId: filters.orgId, limit: 10000 });
    
    return allTickets.filter(ticket => {
      // Date filter
      if (filters.from && ticket.createdAt < filters.from) return false;
      if (filters.to && ticket.createdAt > filters.to) return false;
      
      // Team filter
      if (filters.teamIds && filters.teamIds.length > 0 && 
          (!ticket.teamId || !filters.teamIds.includes(ticket.teamId))) return false;
      
      // User filter
      if (filters.userIds && filters.userIds.length > 0 && 
          (!ticket.assigneeId || !filters.userIds.includes(ticket.assigneeId))) return false;
      
      // Priority filter
      if (filters.priorities && filters.priorities.length > 0 && 
          !filters.priorities.includes(ticket.priority)) return false;
      
      return true;
    });
  }
}

export const reportService = new ReportService();
