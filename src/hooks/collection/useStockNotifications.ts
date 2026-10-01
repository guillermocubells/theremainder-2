import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StockNotification {
  id: string;
  user_id: string;
  plant_id: string;
  email: string;
  notified_at: string | null;
  created_at: string;
  // Derived from local plants data
  plantData?: {
    id: string;
    name: string;
    scientificName: string;
    thumbnailUrl: string | undefined;
    price: number | undefined;
    stockQty: number;
  } | null;
}

export const useStockNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stock-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('stock_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Los datos de cada planta salen de la base, no del array de prueba de
      // `data/plants.ts`: ese solo tiene 6 fichas, asi que casi todos los avisos
      // se quedaban con `plantData: null` y el que acertaba mostraba un precio
      // que no era el de venta.
      // `plant_id` es el UUID de `plants.id`, no el slug.
      const ids = [...new Set(data.map((n) => n.plant_id))];
      const { data: rows } = ids.length
        ? await supabase
            .from('plants')
            .select('id, slug, name, common_name, images, primary_image, price, sale_price, stock_qty')
            .in('id', ids)
        : { data: [] };

      const byId = new Map((rows ?? []).map((p) => [p.id, p]));

      return data.map(notification => {
        const p = byId.get(notification.plant_id);
        return {
          ...notification,
          plantData: p ? {
            id: p.slug,
            name: p.name,
            scientificName: p.common_name ?? p.name,
            thumbnailUrl: p.primary_image ?? p.images?.[0],
            price: p.sale_price ?? p.price,
            stockQty: p.stock_qty ?? 0,
          } : null,
        } as StockNotification;
      });
    },
    enabled: !!user,
  });
};

export const useDeleteStockNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('stock_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('plant_id', plantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-notifications'] });
    },
  });
};
