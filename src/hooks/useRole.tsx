import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 'extensionista' | 'admin' | 'backoffice' | 'empresa_fomentadora' | 'agrodealer';

interface UseRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isBackoffice: boolean;
  isExtensionista: boolean;
  isEmpresaFomentadora: boolean;
  isAgrodealer: boolean;
  hasBackofficeAccess: boolean;
  hasLoanReviewAccess: boolean;
}

export function useRole(): UseRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole || null);
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, authLoading]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isBackoffice: role === 'backoffice',
    isExtensionista: role === 'extensionista',
    isEmpresaFomentadora: role === 'empresa_fomentadora',
    isAgrodealer: role === 'agrodealer',
    hasBackofficeAccess: role === 'admin' || role === 'backoffice',
    hasLoanReviewAccess: role === 'admin' || role === 'empresa_fomentadora',
  };
}