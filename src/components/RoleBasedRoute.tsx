import { ReactNode } from "react";
import { useRole, AppRole } from "@/hooks/useRole";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallbackPath?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = "/dashboard" 
}: RoleBasedRouteProps) {
  const { role, loading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      navigate(fallbackPath);
    }
  }, [role, loading, allowedRoles, fallbackPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}