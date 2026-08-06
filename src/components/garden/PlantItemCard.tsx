import { useNavigate } from 'react-router-dom';
import { PlantItem } from '@/hooks/garden/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Leaf,
  Bell,
  BellOff,
  MoreVertical,
  MapPin,
  ShoppingCart,
  Eye,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ExternalLink,
  Trash2,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateWishlistItem, useMoveWishlistItem, useDeleteWishlistItem } from '@/hooks/wishlist/useWishlistItems';
import { useUpdateOwnedPlant } from '@/hooks/collection/useOwnedPlants';
import { useDeleteStockNotification } from '@/hooks/collection/useStockNotifications';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlantItemCardProps {
  item: PlantItem;
  variant?: 'list' | 'kanban';
}

const statusConfig = {
  searching: {
    label: 'En búsqueda',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    icon: Heart,
  },
  available: {
    label: 'Disponible',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    icon: CheckCircle2,
  },
  purchased: {
    label: 'Comprada',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    icon: ShoppingCart,
  },
  in_collection: {
    label: 'En colección',
    color: 'bg-primary/10 text-primary',
    icon: Leaf,
  },
  archived: {
    label: 'Archivada',
    color: 'bg-muted text-muted-foreground',
    icon: Archive,
  },
};

const healthConfig = {
  healthy: { label: 'Saludable', color: 'text-green-600' },
  okay: { label: 'Aceptable', color: 'text-yellow-600' },
  concern: { label: 'Preocupante', color: 'text-orange-600' },
  critical: { label: 'Crítico', color: 'text-red-600' },
};

// Viability helpers (used by kanban variant)
const getViabilityScore = (item: PlantItem): number => {
  if (item.collectionData?.lastObservation) {
    const conditionScores = {
      healthy: 90,
      okay: 70,
      concern: 45,
      critical: 20,
    };
    return conditionScores[item.collectionData.lastObservation.condition] || 70;
  }
  return 70;
};

const getViabilityColor = (score: number): string => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const getViabilityLabel = (score: number): string => {
  if (score >= 70) return 'text-green-700 dark:text-green-400';
  if (score >= 50) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
};

const formatAddedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `Añadida ${formatDistanceToNow(date, { addSuffix: false, locale: es })}`;
  }
  return `Añadida el ${format(date, "d MMM yyyy", { locale: es })}`;
};

export const PlantItemCard = ({ item, variant = 'list' }: PlantItemCardProps) => {
  const navigate = useNavigate();
  const updateWishlist = useUpdateWishlistItem();
  const moveWishlist = useMoveWishlistItem();
  const deleteWishlist = useDeleteWishlistItem();
  const updateOwned = useUpdateOwnedPlant();
  const deleteStockNotification = useDeleteStockNotification();

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;
  const isKanban = variant === 'kanban';
  const viabilityScore = isKanban ? getViabilityScore(item) : 0;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardClick = () => {
    if (isKanban) {
      // Kanban navigation logic
      if (item.sourceType === 'owned') {
        navigate(`/garden/plant/${item.sourceId}`);
      } else if (item.sourceType === 'stock_notification') {
        navigate(`/plant/${item.sourceId}`);
      } else if (item.wishlistData?.catalogProductId) {
        navigate(`/plant/${item.wishlistData.catalogProductId}`);
      }
    } else {
      // List navigation logic
      if (item.sourceType === 'owned') {
        navigate(`/collection/plant/${item.sourceId}`);
      } else if (item.sourceType === 'stock_notification') {
        navigate(`/plant/${item.sourceId}`);
      } else {
        navigate(`/garden/plant/${item.sourceId}?type=wishlist`);
      }
    }
  };

  const handleToggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.wishlistData) {
      updateWishlist.mutate({
        id: item.sourceId,
        notify_availability: !item.wishlistData.notifyAvailability,
      }, {
        onSuccess: () => {
          toast.success(item.wishlistData?.notifyAvailability
            ? 'Alertas desactivadas'
            : 'Te avisaremos cuando esté disponible'
          );
        },
      });
    }
  };

  const handleMarkPurchased = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveWishlist.mutate({
      id: item.sourceId,
      status: 'acquired',
    }, {
      onSuccess: () => {
        toast.success('¡Planta marcada como adquirida!');
      },
    });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.sourceType === 'owned') {
      updateOwned.mutate({
        id: item.sourceId,
        status: 'removed',
      }, {
        onSuccess: () => {
          toast.success('Planta archivada');
        },
      });
    }
  };

  const handleViewCatalog = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productId = item.wishlistData?.catalogProductId ||
                      (item.sourceType === 'stock_notification' ? item.sourceId : null);
    if (productId) {
      navigate(`/plant/${productId}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.sourceType === 'stock_notification') {
      deleteStockNotification.mutate(item.sourceId, {
        onSuccess: () => {
          toast.success(isKanban ? 'Planta eliminada' : 'Notificación eliminada');
        },
      });
    } else if (item.sourceType === 'wishlist') {
      deleteWishlist.mutate(item.sourceId, {
        onSuccess: () => {
          toast.success(isKanban ? 'Planta eliminada' : 'Planta eliminada de búsqueda');
        },
      });
    }
  };

  // Get source label (list variant only)
  const getSourceLabel = () => {
    if (item.sourceType === 'wishlist') {
      if (item.wishlistData?.sourcePreference === 'frondaprima') {
        return 'Catálogo The Remainder';
      } else if (item.wishlistData?.providerName) {
        return item.wishlistData.providerName;
      } else {
        return 'Planta externa';
      }
    } else if (item.sourceType === 'stock_notification') {
      return 'Catálogo The Remainder';
    }
    return null;
  };

  const sourceLabel = !isKanban ? getSourceLabel() : null;

  // ─── Kanban compact variant ────────────────────────────────────
  if (isKanban) {
    return (
      <Card
        className="hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
        draggable
        onDragStart={handleDragStart}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Image with drag handle overlay */}
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {/* Drag indicator on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <GripVertical className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  {/* Scientific Name (Title) */}
                  <h4 className="font-semibold text-sm text-foreground truncate leading-tight">
                    {item.scientificName || item.name}
                  </h4>
                  {/* Common Name */}
                  {item.commonName && item.scientificName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.commonName}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 -mr-1 -mt-1">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {item.sourceType === 'wishlist' && (
                      <>
                        {item.wishlistData?.catalogProductId && (
                          <DropdownMenuItem onClick={handleViewCatalog}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Ver en catálogo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleMarkPurchased}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar como adquirida
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleRemove}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Ya no me interesa
                        </DropdownMenuItem>
                      </>
                    )}
                    {item.sourceType === 'stock_notification' && (
                      <>
                        <DropdownMenuItem onClick={handleViewCatalog}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ver en catálogo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleRemove}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                    {item.sourceType === 'owned' && (
                      <>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/collection/plant/${item.sourceId}`);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver ficha completa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleArchive}
                          className="text-destructive"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archivar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Viability Score */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Viabilidad</span>
                  <span className={cn("text-xs font-medium", getViabilityLabel(viabilityScore))}>
                    {viabilityScore}%
                  </span>
                </div>
                <Progress
                  value={viabilityScore}
                  className="h-1.5"
                  indicatorClassName={getViabilityColor(viabilityScore)}
                />
              </div>

              {/* Added Date */}
              <p className="text-[10px] text-muted-foreground mt-2">
                {formatAddedDate(item.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── List expanded variant (default) ──────────────────────────
  return (
    <Card
      className="hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                {item.scientificName && (
                  <p className="text-sm text-muted-foreground italic truncate">
                    {item.scientificName}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {item.sourceType === 'wishlist' && (
                    <>
                      <DropdownMenuItem onClick={handleToggleNotifications}>
                        {item.wishlistData?.notifyAvailability ? (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Desactivar alertas
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Activar alertas
                          </>
                        )}
                      </DropdownMenuItem>
                      {item.wishlistData?.catalogProductId && (
                        <DropdownMenuItem onClick={handleViewCatalog}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ver en catálogo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleMarkPurchased}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marcar como comprada
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleRemove}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ya no me interesa
                      </DropdownMenuItem>
                    </>
                  )}
                  {item.sourceType === 'stock_notification' && (
                    <>
                      <DropdownMenuItem onClick={handleViewCatalog}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver en catálogo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleRemove}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar notificación
                      </DropdownMenuItem>
                    </>
                  )}
                  {item.sourceType === 'owned' && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/collection/plant/${item.sourceId}`);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver ficha completa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleArchive}
                        className="text-destructive"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archivar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status badge and indicators */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className={cn("text-xs", config.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>

              {/* Wishlist indicators */}
              {item.sourceType === 'wishlist' && item.wishlistData && (
                <>
                  {item.wishlistData.notifyAvailability && (
                    <Badge variant="outline" className="text-xs">
                      <Bell className="h-3 w-3 mr-1 text-primary" />
                      Alerta
                    </Badge>
                  )}
                  {item.status === 'available' && item.wishlistData.catalogPrice && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {item.wishlistData.catalogPrice.toFixed(2)}€
                    </Badge>
                  )}
                </>
              )}

              {/* Stock notification indicators */}
              {item.sourceType === 'stock_notification' && item.stockNotificationData && (
                <>
                  <Badge variant="outline" className="text-xs">
                    <Bell className="h-3 w-3 mr-1 text-primary" />
                    Alerta
                  </Badge>
                  {item.status === 'available' && item.stockNotificationData.price && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {item.stockNotificationData.price.toFixed(2)}€
                    </Badge>
                  )}
                </>
              )}

              {/* Collection indicators */}
              {item.sourceType === 'owned' && item.collectionData && (
                <>
                  {item.collectionData.lastObservation && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs", healthConfig[item.collectionData.lastObservation.condition].color)}
                    >
                      {healthConfig[item.collectionData.lastObservation.condition].label}
                    </Badge>
                  )}
                  {item.collectionData.plantStatus === 'sick' && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </>
              )}
            </div>

            {/* Secondary info */}
            <div className="mt-2">
              {item.sourceType === 'owned' && item.collectionData?.locationName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{item.collectionData.locationName}</span>
                </div>
              )}
              {(item.sourceType === 'wishlist' || item.sourceType === 'stock_notification') && sourceLabel && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{sourceLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantItemCard;
