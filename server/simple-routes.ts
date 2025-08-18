import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './simple-storage';
import { insertUserSchema, insertTicketSchema, insertCommentSchema } from '../shared/simple-schema';

export const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'simple-secret-key';

// Middleware for authentication
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth routes
router.post('/api/auth/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/api/auth/me', requireAuth, async (req: any, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Ticket routes
router.get('/api/tickets', requireAuth, async (req: any, res) => {
  try {
    const tickets = await storage.getTickets();
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/api/tickets/:id', requireAuth, async (req: any, res) => {
  try {
    const ticket = await storage.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/api/tickets', requireAuth, async (req: any, res) => {
  try {
    const ticketData = insertTicketSchema.parse({
      ...req.body,
      requesterId: req.user.id
    });
    
    const ticket = await storage.createTicket(ticketData);
    const fullTicket = await storage.getTicketById(ticket.id);
    
    res.status(201).json(fullTicket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/api/tickets/:id', requireAuth, async (req: any, res) => {
  try {
    const updates = req.body;
    
    // Only agents and admins can assign tickets
    if (updates.assigneeId && !['AGENT', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    
    const ticket = await storage.updateTicket(req.params.id, updates);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const fullTicket = await storage.getTicketById(ticket.id);
    res.json(fullTicket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Comment routes
router.post('/api/tickets/:id/comments', requireAuth, async (req: any, res) => {
  try {
    const commentData = insertCommentSchema.parse({
      ...req.body,
      ticketId: req.params.id,
      userId: req.user.id
    });
    
    const comment = await storage.addComment(commentData);
    
    // Return comment with user info
    const commentWithUser = {
      ...comment,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    };
    
    res.status(201).json(commentWithUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Users routes
router.get('/api/users/agents', requireAuth, async (req: any, res) => {
  try {
    const agents = await storage.getAgents();
    const agentsWithoutPassword = agents.map(({ password, ...agent }) => agent);
    res.json(agentsWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;