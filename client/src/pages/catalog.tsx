import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { SearchIcon, PlusIcon, LaptopIcon, KeyIcon, DownloadIcon, TriangleAlert, ClockIcon } from "lucide-react";
import { authService } from "@/lib/auth";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const isAdmin = authService.isAdmin();

  const { data: catalogItems = [], isLoading } = useQuery({
    queryKey: ["/api/catalog"],
  });

  const filteredItems = catalogItems.filter((item: any) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hardware':
        return <LaptopIcon className="w-6 h-6" />;
      case 'segurança':
      case 'security':
        return <KeyIcon className="w-6 h-6" />;
      case 'software':
        return <DownloadIcon className="w-6 h-6" />;
      default:
        return <TriangleAlert className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hardware':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200';
      case 'segurança':
      case 'security':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200';
      case 'software':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Catálogo de Serviços
        </h1>
        {isAdmin && (
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar serviços..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
            </div>
            <span>{category}</span>
            <Badge variant="secondary">{items.length}</Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <Link key={item.id} href={`/tickets/new?catalogId=${item.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary-200 dark:hover:border-primary-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      {item.requiresApproval && (
                        <Badge variant="outline" className="text-xs">
                          Requer Aprovação
                        </Badge>
                      )}
                    </div>
                    {item.subcategory && (
                      <CardDescription>{item.subcategory}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Prioridade padrão: {item.defaultPriority}
                      </div>
                      <Button size="sm">
                        Solicitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filteredItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium mb-2">Nenhum serviço encontrado</p>
              <p>Tente ajustar sua busca ou entre em contato com o administrador.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Clock, Star } from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/use-api";
import { useLocation } from "wouter";

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  const { data: catalogItems = [], isLoading } = useAuthenticatedQuery(
    ['catalog'],
    '/catalog'
  );

  const filteredItems = catalogItems.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Catálogo de Serviços
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Solicite serviços e acesse recursos disponíveis
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Catalog Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum serviço encontrado</p>
                  <p>Tente ajustar sua busca ou entre em contato com o administrador.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <Badge variant="outline">
                    {item.category}
                  </Badge>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>SLA: {item.sla || 'Não definido'}</span>
                  </div>
                  
                  {item.rating && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}/5</span>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    onClick={() => setLocation('/tickets/new')}
                  >
                    Solicitar Serviço
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
