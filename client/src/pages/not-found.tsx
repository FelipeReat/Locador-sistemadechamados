import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
            404
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Página não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}