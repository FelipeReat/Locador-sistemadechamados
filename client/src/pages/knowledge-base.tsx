import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Eye, Calendar, User } from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articles = [], isLoading } = useAuthenticatedQuery(
    ['kb'],
    '/kb'
  );

  const filteredArticles = articles.filter((article: any) =>
    article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Base de Conhecimento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Encontre respostas e soluções para problemas comuns
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredArticles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum artigo encontrado</p>
                <p>Tente ajustar sua busca ou explore outras categorias.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article: any) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {article.title || 'Artigo sem título'}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(article.status)}
                      <Badge variant="outline" className="text-xs">
                        v{article.version || 1}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {article.body ? 
                    article.body.replace(/<[^>]*>/g, '').substring(0, 150) + '...' :
                    'Sem conteúdo disponível'
                  }
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{article.createdBy?.name || 'Autor desconhecido'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>
                      {article.createdAt ? 
                        format(new Date(article.createdAt), 'dd/MM/yyyy', { locale: ptBR }) :
                        'Data desconhecida'
                      }
                    </span>
                  </div>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Ler artigo
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}