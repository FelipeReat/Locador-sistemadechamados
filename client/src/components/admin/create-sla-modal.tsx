
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

const createSlaSchema = z.object({
  name: z.string().min(2, "Nome da regra deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  priority: z.enum(["P1", "P2", "P3", "P4", "P5"]),
  firstResponseTime: z.number().min(1, "Tempo de primeira resposta deve ser maior que 0"),
  resolutionTime: z.number().min(1, "Tempo de resolução deve ser maior que 0"),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

type CreateSlaFormData = z.infer<typeof createSlaSchema>;

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Crítica" },
  { value: "P2", label: "P2 - Alta" },
  { value: "P3", label: "P3 - Média" },
  { value: "P4", label: "P4 - Baixa" },
  { value: "P5", label: "P5 - Planejamento" },
];

interface CreateSlaModalProps {
  children?: React.ReactNode;
}

export default function CreateSlaModal({ children }: CreateSlaModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateSlaFormData>({
    resolver: zodResolver(createSlaSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "P3",
      firstResponseTime: 60, // 1 hour in minutes
      resolutionTime: 480, // 8 hours in minutes
      conditions: {},
      isActive: true,
    },
  });

  const createSlaMutation = useMutation({
    mutationFn: async (data: CreateSlaFormData) => {
      return apiRequest("POST", "/api/sla", data);
    },
    onSuccess: () => {
      toast({
        title: "Regra de SLA criada com sucesso",
        description: "A regra de SLA foi criada e está ativa no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["sla"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar regra de SLA",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSlaFormData) => {
    createSlaMutation.mutate(data);
  };

  const formatTimeLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} horas`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra SLA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Regra SLA</DialogTitle>
          <DialogDescription>
            Defina os tempos de resposta e resolução para diferentes tipos de chamados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da regra SLA" {...field} />
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
                      placeholder="Descreva quando esta regra se aplica"
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstResponseTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primeira Resposta (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      {formatTimeLabel(field.value || 0)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolutionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolução (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      {formatTimeLabel(field.value || 0)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <FormLabel>Regra ativa</FormLabel>
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
                disabled={createSlaMutation.isPending}
              >
                {createSlaMutation.isPending ? "Criando..." : "Criar Regra"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
