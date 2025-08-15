
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";

const createTeamSchema = z.object({
  name: z.string().min(2, "Nome da equipe deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamModalProps {
  children?: React.ReactNode;
}

export default function CreateTeamModal({ children }: CreateTeamModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamFormData) => {
      return apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      toast({
        title: "Equipe criada com sucesso",
        description: "A equipe foi criada e está disponível para atribuições.",
      });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar equipe",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    createTeamMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Equipe</DialogTitle>
          <DialogDescription>
            Crie uma nova equipe para organizar os agentes e chamados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Equipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da equipe" {...field} />
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
                      placeholder="Digite uma descrição para a equipe"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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
                  <FormLabel>Equipe ativa</FormLabel>
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
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? "Criando..." : "Criar Equipe"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
