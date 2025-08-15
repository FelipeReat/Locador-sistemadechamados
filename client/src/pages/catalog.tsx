import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Star, Clock } from "lucide-react";
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
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Service Items */}
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
        ) : filteredItems.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum serviço encontrado</p>
                <p>Tente ajustar sua busca ou entre em contato com o administrador.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name || 'Serviço sem nome'}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.category || 'Categoria não definida'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {item.defaultPriority || 'P3'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {item.description || 'Sem descrição disponível'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>SLA: {item.slaTime || 'Não definido'}</span>
                  </div>
                  {item.requiresApproval && (
                    <Badge variant="secondary" className="text-xs">
                      Requer aprovação
                    </Badge>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setLocation(`/tickets/new?service=${item.id}`)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Solicitar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}