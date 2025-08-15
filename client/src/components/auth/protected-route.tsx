
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { authService } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        setLocation("/login");
        return;
      }

      if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
        setLocation("/dashboard"); // Redirect to dashboard if no permission
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [setLocation, requiredRoles]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return null;
  }

  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}
