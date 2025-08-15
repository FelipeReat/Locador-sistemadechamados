import { useEffect } from "react";
import { useLocation } from "wouter";
import { authService } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLocation("/login");
      return;
    }

    if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
      setLocation("/"); // Redirect to dashboard if no permission
      return;
    }
  }, [setLocation, requiredRoles]);

  if (!authService.isAuthenticated()) {
    return null;
  }

  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}
