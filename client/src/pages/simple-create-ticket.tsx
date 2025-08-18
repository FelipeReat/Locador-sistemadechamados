import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: 'Chamado criado com sucesso!',
        description: `Seu chamado #${newTicket.id.slice(0, 8)} foi criado.`,
      });
      navigate(`/tickets/${newTicket.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar chamado',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e descrição.',
        variant: 'destructive',
      });
      return;
    }

    createTicketMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/tickets')}
              className="mr-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Descreva seu problema</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Chamado *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Não consigo acessar o sistema"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  data-testid="input-title"
                />
                <p className="text-sm text-gray-500">
                  {title.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o problema que você está enfrentando. Inclua passos para reproduzir o erro, mensagens de erro, e qualquer informação relevante."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  data-testid="textarea-description"
                />
                <p className="text-sm text-gray-500">
                  {description.length}/1000 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa - Não urgente</SelectItem>
                    <SelectItem value="MEDIUM">Média - Normal</SelectItem>
                    <SelectItem value="HIGH">Alta - Importante</SelectItem>
                    <SelectItem value="URGENT">Urgente - Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/tickets')}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit"
                >
                  {createTicketMutation.isPending ? (
                    'Criando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Criar Chamado
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Dicas para um bom chamado</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ul className="space-y-2 text-sm">
              <li>• Seja específico sobre o problema</li>
              <li>• Inclua passos para reproduzir o erro</li>
              <li>• Mencione quando o problema começou</li>
              <li>• Descreva o que você esperava que acontecesse</li>
              <li>• Adicione screenshots se necessário (em comentários)</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}