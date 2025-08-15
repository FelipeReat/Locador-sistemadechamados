import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { SearchIcon, PlusIcon, BookIcon, FileTextIcon, EyeIcon } from "lucide-react";
import { authService } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/constants";

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const canCreateArticles = authService.hasAnyRole(['ADMIN', 'AGENT']);

  const { data: publishedArticles = [], isLoading: publishedLoading } = useQuery({
    queryKey: ["/api/kb", { status: "PUBLISHED" }],
  });

  const { data: draftArticles = [], isLoading: draftLoading } = useQuery({
    queryKey: ["/api/kb", { status: "DRAFT" }],
    enabled: canCreateArticles,
  });

  const { data: allArticles = [], isLoading: allLoading } = useQuery({
    queryKey: ["/api/kb"],
    enabled: canCreateArticles,
  });

  const filterArticles = (articles: any[]) => {
    return articles.filter((article: any) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.body.toLowerCase().includes(search.toLowerCase()) ||
      article.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Publicado</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'REVIEW':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Em Revisão</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const ArticleCard = ({ article }: { article: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-2">{article.title}</CardTitle>
          {getStatusBadge(article.status)}
        </div>
        <CardDescription className="line-clamp-2">
          {article.body.replace(/[#*`]/g, '').substring(0, 150)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Versão {article.version}</span>
          <span>{formatRelativeTime(new Date(article.updatedAt))}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <EyeIcon className="w-3 h-3 mr-1" />
            ID: {article.id.substring(0, 8)}
          </div>
          <Button size="sm" variant="outline">
            Ver Artigo
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
          <BookIcon className="w-8 h-8" />
          <span>Base de Conhecimento</span>
        </h1>
        {canCreateArticles && (
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar artigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published" className="flex items-center space-x-2">
            <FileTextIcon className="w-4 h-4" />
            <span>Publicados</span>
            <Badge variant="secondary" className="ml-1">{publishedArticles.length}</Badge>
          </TabsTrigger>
          {canCreateArticles && (
            <>
              <TabsTrigger value="drafts" className="flex items-center space-x-2">
                <span>Rascunhos</span>
                <Badge variant="secondary" className="ml-1">{draftArticles.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <span>Todos</span>
                <Badge variant="secondary" className="ml-1">{allArticles.length}</Badge>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="published" className="space-y-4">
          <ArticlesList articles={filterArticles(publishedArticles)} isLoading={publishedLoading} />
        </TabsContent>

        {canCreateArticles && (
          <>
            <TabsContent value="drafts" className="space-y-4">
              <ArticlesList articles={filterArticles(draftArticles)} isLoading={draftLoading} />
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <ArticlesList articles={filterArticles(allArticles)} isLoading={allLoading} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );

  function ArticlesList({ articles, isLoading }: { articles: any[], isLoading: boolean }) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <BookIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum artigo encontrado</p>
              <p>Tente ajustar sua busca ou crie o primeiro artigo.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  }
}
