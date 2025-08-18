import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Zap, Shield, Eye, Terminal } from 'lucide-react';
import { useLocation } from 'wouter';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo ao sistema de chamados!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    toast({
      title: 'Credenciais preenchidas',
      description: 'Clique em "Entrar" para fazer login',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background cyberpunk elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 neon-cyan opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 neon-purple opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-screen h-screen hologram opacity-10"></div>
      </div>

      <Card className="w-full max-w-md cyber-card backdrop-blur-lg border-2 border-primary/30">
        <CardHeader className="space-y-6 text-center">
          <div className="flex items-center justify-center mb-6 relative">
            <div className="neon-border rounded-full p-6 bg-primary/10">
              <Terminal className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-display glitch-text neon-text" data-text="NEXUS DESK">
              NEXUS DESK
            </CardTitle>
            <CardDescription className="text-lg font-cyber text-muted-foreground">
              // Sistema Revolucionário de Tickets //
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-cyber text-primary flex items-center gap-2">
                <Eye className="h-4 w-4" />
                USER_ID
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite sua identificação..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
                className="bg-secondary/50 border-2 border-primary/30 font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-cyber text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" />
                ACCESS_KEY
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Chave de acesso..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
                className="bg-secondary/50 border-2 border-primary/30 font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full neon-button font-cyber text-lg py-6" 
              disabled={isLoading} 
              data-testid="button-login"
            >
              <Zap className="h-5 w-5 mr-2" />
              {isLoading ? 'CONECTANDO...' : 'INICIAR SESSÃO'}
            </Button>
          </form>

          <div className="mt-8 p-6 cyber-card border border-primary/20">
            <p className="text-sm font-cyber text-primary mb-4 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              CREDENCIAIS DE TESTE:
            </p>
            <div className="space-y-3">
              <div 
                className="cursor-pointer hover:bg-primary/10 p-3 rounded-lg border border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                onClick={() => fillCredentials('admin', 'admin123')}
              >
                <p className="text-sm font-cyber text-sky-400 font-bold">ADMIN SYSTEM:</p>
                <p className="text-xs font-mono text-muted-foreground">admin / admin123</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-primary/10 p-3 rounded-lg border border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                onClick={() => fillCredentials('usuario', '123456')}
              >
                <p className="text-sm font-cyber text-emerald-400 font-bold">USER ACCESS:</p>
                <p className="text-xs font-mono text-muted-foreground">usuario / 123456</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-cyber text-muted-foreground text-center">
              {'>'} Clique nas credenciais para preenchimento automático {'<'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}