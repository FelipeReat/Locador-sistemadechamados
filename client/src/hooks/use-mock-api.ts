import { useMemo } from "react";

// Mock user for development
export const mockUser = {
  id: "1",
  username: "admin",
  name: "Administrador",
  email: "admin@sistema.com",
  orgId: "1",
  role: "ADMIN",
  teams: [{ 
    id: "1", 
    name: "Administradores", 
    roles: ["ADMIN"] 
  }]
};

// Mock data for development
export function useMockApi() {
  const mockData = useMemo(() => ({
    // Dashboard metrics
    metrics: {
      totalTickets: 156,
      openTickets: 23,
      resolvedTickets: 133,
      avgResolutionTime: "2.4h"
    },
    
    // Recent tickets
    recentTickets: [
      {
        id: "1",
        title: "Sistema lento na área de vendas",
        status: "OPEN",
        priority: "HIGH",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        requester: { name: "João Silva", email: "joao@empresa.com" }
      },
      {
        id: "2", 
        title: "Problema com impressora HP",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        requester: { name: "Maria Santos", email: "maria@empresa.com" }
      },
      {
        id: "3",
        title: "Acesso ao sistema ERP",
        status: "RESOLVED",
        priority: "LOW", 
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        requester: { name: "Pedro Costa", email: "pedro@empresa.com" }
      }
    ],
    
    // Tickets by status
    ticketsByStatus: [
      { status: "OPEN", count: 23, color: "#ef4444" },
      { status: "IN_PROGRESS", count: 15, color: "#f59e0b" },
      { status: "RESOLVED", count: 133, color: "#10b981" },
      { status: "CLOSED", count: 89, color: "#6b7280" }
    ],
    
    // Service catalog
    serviceCategories: [
      {
        id: "1",
        name: "TI e Infraestrutura",
        description: "Serviços relacionados a tecnologia",
        services: [
          {
            id: "1",
            name: "Novo Usuário no Sistema",
            description: "Criação de conta para novo funcionário",
            category: "Acesso"
          },
          {
            id: "2", 
            name: "Suporte Hardware",
            description: "Manutenção e reparo de equipamentos",
            category: "Hardware"
          }
        ]
      }
    ],
    
    // Knowledge base
    knowledgeArticles: [
      {
        id: "1",
        title: "Como resetar sua senha",
        content: "Siga os passos para redefinir sua senha...",
        category: "Acesso",
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ]
  }), []);
  
  return mockData;
}

// Function to simulate API delay
export const mockDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));