import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, AppPermission } from './usePermissions';

export interface RoleAssignment {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  granted_at: string;
}

/** Quién tiene qué rol. Requiere 'roles.view'. */
export const useRoleAssignments = () => {
  return useQuery({
    queryKey: ['role-assignments'],
    queryFn: async (): Promise<RoleAssignment[]> => {
      const { data, error } = await supabase.rpc('list_role_assignments');
      if (error) throw error;
      return (data ?? []) as RoleAssignment[];
    },
  });
};

/** La matriz rol → permisos, para pintar qué implica cada rol. */
export const useRolePermissions = () => {
  return useQuery({
    queryKey: ['role-permissions'],
    staleTime: 30 * 60 * 1000, // el reglamento casi nunca cambia
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission');
      if (error) throw error;

      return (data ?? []).reduce<Record<string, AppPermission[]>>((acc, row) => {
        (acc[row.role] ??= []).push(row.permission);
        return acc;
      }, {});
    },
  });
};

/** Busca un usuario por email exacto. Requiere 'roles.manage'. */
export const useFindUserByEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('find_user_by_email', { _email: email });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
    },
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
    },
  });
};
