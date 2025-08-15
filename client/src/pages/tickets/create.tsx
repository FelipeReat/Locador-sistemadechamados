import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PRIORITY_LABELS } from "@/lib/constants";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "wouter";

const createTicketSchema = z.object({
  catalogId: z.string().min(1, "Categoria é obrigatória"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.enum(["P1", "P2", "P3", "P4", "P5"]),
  customFieldsJson: z.record(z.string()).optional(),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

export default function CreateTicket() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);

  const { data: catalogItems = [] } = useQuery({
    queryKey: ["/api/catalog"],
  });

  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      catalogId: new URLSearchParams(searchParams).get('catalogId') || "",
      subject: "",
      description: "",
      priority: "P3",
      customFieldsJson: {},
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormData) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: (result) => {
      const ticket = result.json();
      toast({
        title: "Chamado criado com sucesso",
        description: `Chamado ${ticket.code} foi criado e está sendo processado.`,
      });
      setLocation("/tickets");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar chamado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const handleCatalogChange = (catalogId: string) => {
    const item = catalogItems.find((item: any) => item.id === catalogId);
    setSelectedCatalogItem(item);

    if (item) {
      form.setValue("priority", item.defaultPriority || "P3");
    }
  };

  const renderCustomFields = () => {
    if (!selectedCatalogItem?.formJson?.fields) return null;

    return selectedCatalogItem.formJson.fields.map((field: any) => (
      <div key={field.name}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === "text" && (
          <Input
            placeholder={field.placeholder || field.label}
            onChange={(e) => {
              const current = form.getValues("customFieldsJson") || {};
              form.setValue("customFieldsJson", {
                ...current,
                [field.name]: e.target.value,
              });
            }}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            placeholder={field.placeholder || field.label}
            rows={3}
            onChange={(e) => {
              const current = form.getValues("customFieldsJson") || {};
              form.setValue("customFieldsJson", {
                ...current,
                [field.name]: e.target.value,
              });
            }}
          />
        )}

        {field.type === "select" && (
          <Select
            onValueChange={(value) => {
              const current = form.getValues("customFieldsJson") || {};
              form.setValue("customFieldsJson", {
                ...current,
                [field.name]: value,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecionar ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/tickets">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Novo Chamado</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="catalogId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de Serviço</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCatalogChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Selecione um serviço</SelectItem>
                          {catalogItems.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.category}
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
                          <SelectItem value="none">Selecione uma prioridade</SelectItem>
                          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {key} - {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                      <Input placeholder="Descreva brevemente o problema ou solicitação" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente o problema ou solicitação"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Fields */}
              {selectedCatalogItem && selectedCatalogItem.formJson?.fields && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Informações Adicionais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderCustomFields()}
                  </div>
                </div>
              )}

              {/* Service Info */}
              {selectedCatalogItem && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                      Informações do Serviço
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      {selectedCatalogItem.description}
                    </p>
                    {selectedCatalogItem.requiresApproval && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ⚠️ Este serviço requer aprovação antes do atendimento
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/tickets">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? "Criando..." : "Criar Chamado"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Upload } from "lucide-react";

const ticketSchema = z.object({
  subject: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  priority: z.string().min(1, "Selecione uma prioridade"),
  urgency: z.string().optional(),
  impact: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function CreateTicket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "",
      priority: "P3",
      urgency: "MEDIUM",
      impact: "MEDIUM",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Chamado criado com sucesso!",
        description: `Chamado #${response.id?.slice(0, 8)} foi criado.`,
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setLocation("/tickets");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar chamado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setLocation("/tickets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Criar Novo Chamado
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Descreva o problema ou solicitação detalhadamente
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Chamado</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Subject */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título do Chamado *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Problema com impressora do setor financeiro"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Acesso">Acesso a Sistemas</SelectItem>
                            <SelectItem value="Rede">Rede e Conectividade</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Impressao">Impressão</SelectItem>
                            <SelectItem value="Telefonia">Telefonia</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Detalhada *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o problema ou solicitação em detalhes..."
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="P1">P1 - Crítica</SelectItem>
                              <SelectItem value="P2">P2 - Alta</SelectItem>
                              <SelectItem value="P3">P3 - Média</SelectItem>
                              <SelectItem value="P4">P4 - Baixa</SelectItem>
                              <SelectItem value="P5">P5 - Planejamento</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Urgency */}
                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a urgência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Baixa</SelectItem>
                              <SelectItem value="MEDIUM">Média</SelectItem>
                              <SelectItem value="HIGH">Alta</SelectItem>
                              <SelectItem value="CRITICAL">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/tickets")}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Criando..." : "Criar Chamado"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas para um bom chamado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Seja específico no título - exemplo: "Impressora HP do 2º andar não imprime"
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Inclua passos para reproduzir o problema
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Mencione quando o problema começou
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Anexe prints ou arquivos relevantes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guia de Prioridades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  P1 - Crítica
                </Badge>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sistema completamente indisponível
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  P2 - Alta
                </Badge>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Impacto significativo no trabalho
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  P3 - Média
                </Badge>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Problema moderado, tem alternativa
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  P4 - Baixa
                </Badge>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Melhoria ou problema menor
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
