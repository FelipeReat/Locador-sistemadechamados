import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BellIcon, ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
// Mock user for development
const mockUser = {
  id: "1",
  username: "admin",
  name: "Administrador",
  email: "admin@sistema.com",
  teams: [{ id: "1", name: "Administradores", roles: ["ADMIN"] }]
};
import { useLocation } from "wouter";

export default function Header() {
  const [, setLocation] = useLocation();
  const user = mockUser;

  const handleLogout = () => {
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Sistema Operacional
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="h-5 w-5 text-gray-400" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-sm bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-200">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {user?.name || "Usuário"}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
