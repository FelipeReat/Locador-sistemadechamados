
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
      try {
        if (!authService.isAuthenticated()) {
          console.log('Not authenticated, redirecting to login');
          setLocation("/login");
          return;
        }

        // Try to fetch fresh user data if we have a token but no teams
        const user = authService.getUser();
        if (user && (!user.teams || user.teams.length === 0)) {
          console.log('Fetching fresh user data...');
          const freshUser = await authService.fetchUserData();
          if (!freshUser) {
            console.log('Failed to fetch user data, redirecting to login');
            setLocation("/login");
            return;
          }
        }

        if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
          console.log('User does not have required roles, redirecting to dashboard');
          setLocation("/dashboard");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation("/login");
      }
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
