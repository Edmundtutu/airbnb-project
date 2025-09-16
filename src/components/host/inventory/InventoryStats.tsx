import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingUp, Layers } from 'lucide-react';

interface InventoryStatsProps {
  stats: {
    totalProducts: number;
    totalIngredients: number;
    lowStockItems: number;
    totalValue: number;
  };
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <Card className="p-4 bg-card border-border shadow-card">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Inventory Overview
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-purple-500" />
              <span className="text-xs text-muted-foreground">Products</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.totalProducts}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Ingredients</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.totalIngredients}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-warning" />
              <span className="text-xs text-muted-foreground">Low Stock</span>
            </div>
            <Badge 
              variant={stats.lowStockItems > 0 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {stats.lowStockItems}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Total Value</span>
            </div>
            <Badge variant="default" className="text-xs bg-primary-glow text-primary">
              ${stats.totalValue.toFixed(0)}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Real-time inventory tracking with dynamic relationships
        </div>
      </div>
    </Card>
  );
}