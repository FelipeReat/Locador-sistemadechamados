import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, SearchIcon, SettingsIcon, BotIcon, CalendarIcon, PlayIcon, PauseIcon } from "lucide-react";
import { formatDateTime } from "@/lib/constants";

export default function AdminAutomations() {
  const [search, setSearch] = useState("");

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["/api/automations"],
  });

  const filteredAutomations = automations.filter((automation: any) =>
    automation.name.toLowerCase().includes(search.toLowerCase()) ||
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
        case 'PRIORITY_CHANGED': return 'Mudança de Prioridade';
        default: return type;
      }
    }).join(', ');
  };

  const getActionLabel = (actions: any) => {
    if (!actions) return "Sem ação";
    
    const actionTypes = Object.keys(actions);
    if (actionTypes.length === 0) return "Sem ação";
    
    return actionTypes.map(type => {
      switch (type) {
        case 'ASSIGN_TEAM': return 'Atribuir Equipe';
        case 'SEND_NOTIFICATION': return 'Enviar Notificação';
        case 'ESCALATE': return 'Escalar';
        case 'SET_PRIORITY': return 'Definir Prioridade';
        default: return type;
      }
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
          <BotIcon className="w-8 h-8" />
          <span>Automações</span>
        </h1>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <BotIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <PlayIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {automations.filter((a: any) => a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <PauseIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {automations.filter((a: any) => !a.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
          <CardTitle>Regras de Automação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation: any) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {automation.description || "Sem descrição"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getTriggerLabel(automation.triggersJson)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getActionLabel(automation.actionsJson)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch checked={automation.isActive} />
                      {automation.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inativa</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {formatDateTime(new Date(automation.createdAt))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Testar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAutomations.length === 0 && (
            <div className="text-center py-12">
              <BotIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma automação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Zap
} from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/use-api";

export default function AdminAutomations() {
  const { data: automations = [], isLoading } = useAuthenticatedQuery(
    ['automations'],
    '/automations'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
          <Settings className="w-8 h-8" />
          <span>Automações</span>
        </h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {automations.filter((a: any) => a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <Pause className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {automations.filter((a: any) => !a.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Automação</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              Carregando automações...
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma automação configurada</p>
              <p>Crie sua primeira regra de automação para otimizar o atendimento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Ações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.map((automation: any) => (
                  <TableRow key={automation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{automation.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {automation.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {automation.trigger}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {automation.actions?.length || 0} ação(ões)
                      </div>
                    </TableCell>
                    <TableCell>
                      {automation.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Play className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Pause className="w-3 h-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {automation.executionCount || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
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
