
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './simple-storage';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'simple-service-desk-secret';

// Middleware de autenticação
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e senha são obrigatórios' });
    }

    console.log('Tentativa de login para:', username);

    // Buscar usuário
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log('Usuário não encontrado:', username);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log('Usuário encontrado:', user.username, 'Role:', user.role);

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Senha inválida para usuário:', username);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login bem-sucedido para:', username, 'Role:', user.role);

    // Retornar dados do usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token atual
router.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Logout
router.post('/api/auth/logout', (req, res) => {
  // Como estamos usando JWT, o logout é feito no cliente removendo o token
  res.json({ message: 'Logout realizado com sucesso' });
});

// Buscar tickets do usuário atual
router.get('/api/tickets', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    let tickets;

    if (user.role === 'ADMIN' || user.role === 'AGENT') {
      // Admin e agentes veem todos os tickets
      tickets = await storage.getAllTickets();
    } else {
      // Usuários convencionais veem apenas seus próprios tickets
      tickets = await storage.getTicketsByUserId(user.id);
    }

    res.json(tickets);
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    res.status(500).json({ message: 'Erro ao buscar tickets' });
  }
});

// Buscar todos os tickets (apenas para admin/agent)
router.get('/api/tickets/all', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const tickets = await storage.getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Erro ao buscar todos os tickets:', error);
    res.status(500).json({ message: 'Erro ao buscar tickets' });
  }
});

// Criar ticket
router.post('/api/tickets', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const ticketData = {
      ...req.body,
      userId: user.id,
      status: 'NEW'
    };

    const ticket = await storage.createTicket(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ message: 'Erro ao criar ticket' });
  }
});

// Buscar ticket específico
router.get('/api/tickets/:id', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const ticketId = req.params.id;

    const ticket = await storage.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }

    // Verificar permissões
    if (user.role !== 'ADMIN' && user.role !== 'AGENT' && ticket.userId !== user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    res.status(500).json({ message: 'Erro ao buscar ticket' });
  }
});

// Atualizar ticket
router.put('/api/tickets/:id', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const ticketId = req.params.id;

    const ticket = await storage.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }

    // Verificar permissões para atualização
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Apenas agentes e administradores podem atualizar tickets' });
    }

    const updatedTicket = await storage.updateTicket(ticketId, req.body);
    res.json(updatedTicket);
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ message: 'Erro ao atualizar ticket' });
  }
});

// Buscar agentes (para assignar tickets)
router.get('/api/users/agents', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const agents = await storage.getAgents();
    res.json(agents);
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    res.status(500).json({ message: 'Erro ao buscar agentes' });
  }
});

export default router;
