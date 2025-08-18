
import bcrypt from 'bcrypt';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  createdAt: Date;
}

interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

class SimpleStorage {
  private users: Map<string, User> = new Map();
  private tickets: Map<string, Ticket> = new Map();

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Criar usuários padrão
      const adminPassword = await bcrypt.hash('admin123', 10);
      const userPassword = await bcrypt.hash('123456', 10);

      const admin: User = {
        id: 'admin-1',
        username: 'admin',
        name: 'Administrador',
        email: 'admin@servicedesk.com',
        password: adminPassword,
        role: 'ADMIN',
        createdAt: new Date()
      };

      const user: User = {
        id: 'user-1',
        username: 'usuario',
        name: 'Usuário Convencional',
        email: 'usuario@servicedesk.com',
        password: userPassword,
        role: 'USER',
        createdAt: new Date()
      };

      this.users.set(admin.id, admin);
      this.users.set(user.id, user);

      // Criar tickets de exemplo
      const ticket1: Ticket = {
        id: 'ticket-1',
        userId: user.id,
        title: 'Problema com e-mail',
        description: 'Não consigo acessar minha conta de e-mail corporativo',
        status: 'NEW',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ticket2: Ticket = {
        id: 'ticket-2',
        userId: user.id,
        title: 'Solicitação de acesso',
        description: 'Preciso de acesso ao sistema de vendas',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedTo: admin.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.tickets.set(ticket1.id, ticket1);
      this.tickets.set(ticket2.id, ticket2);

      console.log('✅ Dados inicializados com sucesso');
      console.log('📋 Usuários criados:');
      console.log('   - Admin: admin / admin123');
      console.log('   - Usuário: usuario / 123456');

    } catch (error) {
      console.error('❌ Erro ao inicializar dados:', error);
    }
  }

  // Métodos de usuário
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const user: User = {
      ...userData,
      id,
      createdAt: new Date()
    };

    this.users.set(id, user);
    return user;
  }

  async getAgents(): Promise<User[]> {
    const agents: User[] = [];
    for (const user of this.users.values()) {
      if (user.role === 'AGENT' || user.role === 'ADMIN') {
        const { password, ...userWithoutPassword } = user;
        agents.push(userWithoutPassword as User);
      }
    }
    return agents;
  }

  // Métodos de ticket
  async getTicketById(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getTicketsByUserId(userId: string): Promise<Ticket[]> {
    const userTickets: Ticket[] = [];
    for (const ticket of this.tickets.values()) {
      if (ticket.userId === userId) {
        userTickets.push(ticket);
      }
    }
    return userTickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const id = 'ticket-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const ticket: Ticket = {
      ...ticketData,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      return undefined;
    }

    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date()
    };

    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
}

export const storage = new SimpleStorage();
