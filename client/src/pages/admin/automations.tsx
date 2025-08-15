import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Settings, Bot, Calendar, Play, Pause } from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/use-api";

export default function AdminAutomations() {
  const [search, setSearch] = useState("");

  const { data: automations = [], isLoading } = useAuthenticatedQuery(
    ['automations'],
    '/automations'
  );

  const filteredAutomations = automations.filter((automation: any) =>
    automation.name?.toLowerCase().includes(search.toLowerCase()) ||
    automation.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getTriggerLabel = (triggers: any) => {
    if (!triggers) return "Sem gatilho";
    
    const triggerTypes = Object.keys(triggers);
    if (triggerTypes.length === 0) return "Sem gatilho";
    
    return triggerTypes.map(type => {
      switch (type) {
        case 'TICKET_CREATED': return 'Criação de Chamado';
        case 'TICKET_UPDATED': return 'Atualização de Chamado';
        case 'SLA_BREACH': return 'Violação de SLA';
        case 'TIME_BASED': return 'Baseado em Tempo';
        default: return type;
      }
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Automações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure regras de automação para agilizar o fluxo de trabalho
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar automações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Automações Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAutomations.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'Nenhuma automação encontrada' : 'Nenhuma automação configurada'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {search ? 'Tente ajustar sua busca' : 'Crie sua primeira automação para agilizar o atendimento'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Gatilho</TableHead>
                  <TableHead>Ações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead className="text-right">Opções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAutomations.map((automation: any) => (
                  <TableRow key={automation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{automation.name}</div>
                        {automation.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {automation.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTriggerLabel(automation.triggers)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {automation.actions?.length || 0} ação(ões)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={automation.isActive} 
                          disabled
                        />
                        <span className="text-sm">
                          {automation.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {automation.lastRunAt ? 
                          new Date(automation.lastRunAt).toLocaleDateString('pt-BR') : 
                          'Nunca'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          {automation.isActive ? (
                            <>
                              <Pause className="w-3 h-3 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}