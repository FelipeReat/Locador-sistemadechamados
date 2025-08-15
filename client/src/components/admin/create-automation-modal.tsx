
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";

const createAutomationSchema = z.object({
  name: z.string().min(2, "Nome da automação deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  triggers: z.object({
    type: z.enum(["TICKET_CREATED", "TICKET_UPDATED", "SLA_BREACH", "TIME_BASED"]),
    conditions: z.record(z.any()).optional(),
  }),
  actions: z.array(z.object({
    type: z.enum(["ASSIGN_TICKET", "UPDATE_STATUS", "SEND_EMAIL", "ADD_COMMENT"]),
    parameters: z.record(z.any()).optional(),
  })).min(1, "Deve ter pelo menos uma ação"),
  isActive: z.boolean().default(true),
});

type CreateAutomationFormData = z.infer<typeof createAutomationSchema>;

const TRIGGER_TYPES = [
  { value: "TICKET_CREATED", label: "Chamado Criado" },
  { value: "TICKET_UPDATED", label: "Chamado Atualizado" },
  { value: "SLA_BREACH", label: "Violação de SLA" },
  { value: "TIME_BASED", label: "Baseado em Tempo" },
];

const ACTION_TYPES = [
  { value: "ASSIGN_TICKET", label: "Atribuir Chamado" },
  { value: "UPDATE_STATUS", label: "Atualizar Status" },
  { value: "SEND_EMAIL", label: "Enviar Email" },
  { value: "ADD_COMMENT", label: "Adicionar Comentário" },
];

interface CreateAutomationModalProps {
  children?: React.ReactNode;
}

export default function CreateAutomationModal({ children }: CreateAutomationModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateAutomationFormData>({
    resolver: zodResolver(createAutomationSchema),
    defaultValues: {
      name: "",
      description: "",
      triggers: {
        type: "TICKET_CREATED",
        conditions: {},
      },
      actions: [{
        type: "ADD_COMMENT",
        parameters: {},
      }],
      isActive: true,
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (data: CreateAutomationFormData) => {
      return apiRequest("POST", "/api/automations", data);
    },
    onSuccess: () => {
      toast({
        title: "Automação criada com sucesso",
        description: "A automação foi criada e está ativa no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAutomationFormData) => {
    createAutomationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Automação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Automação</DialogTitle>
          <DialogDescription>
            Configure regras de automação para agilizar o fluxo de trabalho.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Automação</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da automação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o que esta automação faz"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triggers.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gatilho</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de gatilho" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actions.0.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de ação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTION_TYPES.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Automação ativa</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAutomationMutation.isPending}
              >
                {createAutomationMutation.isPending ? "Criando..." : "Criar Automação"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
