
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  Clock,
  User,
  Plus,
  Filter,
  TrendingUp,
  FileText,
  Lightbulb,
  HelpCircle
} from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function KnowledgeBase() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useAuthenticatedQuery(
    ['knowledge-articles'],
    '/knowledge-base/articles'
  );

  const { data: categories = [], isLoading: categoriesLoading } = useAuthenticatedQuery(
    ['knowledge-categories'],
    '/knowledge-base/categories'
  );

  const { data: popularArticles = [] } = useAuthenticatedQuery(
    ['popular-articles'],
    '/knowledge-base/popular'
  );

  const filteredArticles = articles.filter((article: any) => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            Base de Conhecimento
          </h1>
          <p className="text-muted-foreground mt-2">
            Encontre soluções e documentações para abastecimento
          </p>
        </div>
        <Button onClick={() => setLocation("/knowledge-base/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                size="sm"
              >
                Todos
              </Button>
              {!categoriesLoading && categories.map((category: any) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="popular">Mais Populares</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Articles */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredArticles.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                      <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                        Nenhum artigo encontrado
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tente ajustar sua busca ou explore as categorias disponíveis.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredArticles.map((article: any) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                              {article.title || 'Artigo sem título'}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {article.excerpt || article.content?.substring(0, 150) + '...'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {article.category || 'Geral'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              <span>{article.author?.name || 'Anônimo'}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {article.publishedAt ? 
                                  format(new Date(article.publishedAt), 'dd/MM/yyyy', { locale: ptBR }) : 
                                  'Não publicado'
                                }
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              <span>{article.views || 0} visualizações</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" className="h-6 p-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span className="ml-1 text-xs">{article.likes || 0}</span>
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 p-1">
                              <ThumbsDown className="w-3 h-3" />
                              <span className="ml-1 text-xs">{article.dislikes || 0}</span>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => setLocation(`/knowledge-base/${article.id}`)}
                          >
                            Ler artigo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Artigos Populares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularArticles.slice(0, 5).map((article: any, index: number) => (
                      <div 
                        key={article.id} 
                        className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                        onClick={() => setLocation(`/knowledge-base/${article.id}`)}
                      >
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {article.views || 0} visualizações
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Ajuda Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/tickets/new")}
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Criar Chamado
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/catalog")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Catálogo de Serviços
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/dashboard")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArticles.map((article: any, index: number) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      {article.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {article.views || 0} views
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {article.excerpt || article.content?.substring(0, 100) + '...'}
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setLocation(`/knowledge-base/${article.id}`)}
                  >
                    Ler artigo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {articles.slice(0, 10).map((article: any) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {article.excerpt || article.content?.substring(0, 150) + '...'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{article.author?.name}</span>
                      <span>•</span>
                      <span>
                        {article.publishedAt ? 
                          format(new Date(article.publishedAt), 'dd/MM/yyyy', { locale: ptBR }) : 
                          'Rascunho'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/knowledge-base/${article.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="space-y-4">
            {[
              {
                question: "Como redefinir minha senha?",
                answer: "Para redefinir sua senha, vá até a página de login e clique em 'Esqueci minha senha'. Um email será enviado com instruções."
              },
              {
                question: "Como criar um novo chamado?",
                answer: "Acesse o menu 'Chamados' e clique em 'Novo Chamado'. Preencha todos os campos obrigatórios e descreva o problema detalhadamente."
              },
              {
                question: "Qual o tempo de resposta para chamados?",
                answer: "O tempo varia conforme a prioridade: P1 (1h), P2 (4h), P3 (8h), P4 (24h), P5 (72h)."
              },
              {
                question: "Como acompanhar meus chamados?",
                answer: "Acesse 'Meus Chamados' no menu principal. Lá você pode ver o status e histórico de todos os seus chamados."
              },
              {
                question: "Como solicitar acesso a um sistema?",
                answer: "Use o Catálogo de Serviços e selecione 'Acesso a Sistemas'. Preencha o formulário com as informações necessárias."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 pl-7">
                      {faq.answer}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
