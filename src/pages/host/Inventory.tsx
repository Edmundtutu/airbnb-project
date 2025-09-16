import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';
import { DynamicInventoryFlow } from '@/components/vendor/inventory/DynamicInventoryFlow';
import { useQuery } from '@tanstack/react-query';
import inventoryService from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { shopService } from '@/services/shopService';
const VendorInventory: React.FC = () => {
  const { user } = useAuth();

  // Load current vendor's first shop as the active shop
  const { data: shops } = useQuery({
    enabled: !!user,
    queryKey: ['vendorShops', user?.id],
    queryFn: async () => {
      const res = await shopService.getShops({ owner_id: user!.id });
      return res.data;
    },
    staleTime: 30_000,
  });

  const activeShopId = useMemo(() => shops?.[0]?.id as string | undefined, [shops]);

  const { data: graph, isLoading } = useQuery({
    enabled: !!activeShopId,
    queryKey: ['inventoryGraph', activeShopId],
    queryFn: () => inventoryService.getGraph(activeShopId!),
    staleTime: 10_000,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-8">
          {!activeShopId ? (
            <>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No shop found</h3>
              <p className="text-muted-foreground mb-4">Create a shop to manage inventory.</p>
            </>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : !graph || (graph.nodes?.length ?? 0) + (graph.edges?.length ?? 0) === 0 ? (
            <>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start your inventory map</h3>
              <p className="text-muted-foreground mb-4">Add nodes and connect them to build your flow.</p>
              <DynamicInventoryFlow shopId={activeShopId} initialGraph={{ nodes: [], edges: [] }} />
            </>
          ) : (
            <DynamicInventoryFlow shopId={activeShopId} initialGraph={graph} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorInventory;