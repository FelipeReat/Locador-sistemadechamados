import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";
import {
  Headset,
  LayoutDashboard,
  TicketIcon,
  ListIcon,
  GridIcon,
  BookIcon,
  BarChart3Icon,
  UsersIcon,
  Users,
  BotIcon,
  ClockIcon,
  SettingsIcon
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Meus Chamados",
    href: "/tickets",
    icon: TicketIcon,
    badge: "3", // This would be dynamic in a real app
  },
  {
    name: "Fila do Time",
    href: "/tickets?view=team",
    icon: ListIcon,
    badge: "12", // This would be dynamic in a real app
    requiredRoles: ['ADMIN', 'AGENT'],
  },
  {
    name: "Catálogo de Serviços",
    href: "/catalog",
    icon: GridIcon,
  },
  {
    name: "Base de Conhecimento",
    href: "/knowledge",
    icon: BookIcon,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3Icon,
    requiredRoles: ['ADMIN', 'AGENT'],
  },
];

const adminNavigation = [
  {
    name: "Usuários",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    name: "Equipes",
    href: "/admin/teams",
    icon: Users,
  },
  {
    name: "Automações",
    href: "/admin/automations",
    icon: BotIcon,
  },
  {
    name: "SLA",
    href: "/admin/sla",
    icon: ClockIcon,
  },
  {
    name: "Configurações",
    href: "/admin/settings",
    icon: SettingsIcon,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();

  const isActive = (href: string) => {
    if (href === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location.startsWith(href) && href !== "/dashboard";
  };

  const canAccess = (requiredRoles?: string[]) => {
    if (!requiredRoles) return true;
    return authService.hasAnyRole(requiredRoles);
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 fixed h-full z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Headset className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              ServiceDesk Pro
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              if (!canAccess(item.requiredRoles)) return null;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                      isActive(item.href)
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive(item.href)
                          ? "text-primary-500"
                          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                      )}
                    />
                    {item.name}
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Administração
              </h3>
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                        isActive(item.href)
                          ? "bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5",
                          isActive(item.href)
                            ? "text-primary-500"
                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                        )}
                      />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
