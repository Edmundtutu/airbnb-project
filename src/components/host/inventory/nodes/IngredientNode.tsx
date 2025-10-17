import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Package, Edit3, Check, X } from 'lucide-react';

interface IngredientData {
  label?: string;
  stock?: number;
  unit?: string;
  cost?: number;
  lowStockThreshold?: number;
}

export const IngredientNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const nodeData = (data || {}) as IngredientData;
  const [editData, setEditData] = useState(nodeData);

  const isLowStock = nodeData.stock <= nodeData.lowStockThreshold;
  const stockLevel = nodeData.stock === 0 ? 'out' : isLowStock ? 'low' : 'good';

  const stockColors = {
    good: 'bg-success-light text-success border-success/20',
    low: 'bg-warning-light text-warning border-warning/20',
    out: 'bg-destructive/5 text-destructive border-destructive/20'
  };

  const handleSave = () => {
    // In a real app, this would update the node data
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(nodeData);
    setIsEditing(false);
  };

  return (
    <Card className="w-64 p-4 bg-card border-border shadow-card hover:shadow-elevated transition-all duration-200">
      <Handle type="target" position={Position.Top} className="!bg-success !border-success" />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-success" />
            {isLowStock && <AlertTriangle className="h-4 w-4 text-warning" />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="h-8 text-sm"
              placeholder="Ingredient name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={editData.stock}
                onChange={(e) => setEditData({ ...editData, stock: Number(e.target.value) })}
                className="h-8 text-sm"
                placeholder="Stock"
              />
              <Input
                value={editData.unit}
                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                className="h-8 text-sm"
                placeholder="Unit"
              />
            </div>
            <Input
              type="number"
              step="0.01"
              value={editData.cost}
              onChange={(e) => setEditData({ ...editData, cost: Number(e.target.value) })}
              className="h-8 text-sm"
              placeholder="Cost per unit"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={handleSave} className="h-7 px-2">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 px-2">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-sm text-foreground">{nodeData.label}</h3>
            
            <div className="space-y-2">
              <Badge className={stockColors[stockLevel]} variant="outline">
                {nodeData.stock} {nodeData.unit}
              </Badge>
              
              <div className="text-xs text-muted-foreground">
                <div>Cost: ${nodeData.cost.toFixed(2)}/{nodeData.unit}</div>
                <div>Total Value: ${(nodeData.stock * nodeData.cost).toFixed(2)}</div>
              </div>

              {isLowStock && (
                <div className="text-xs text-warning">
                  ⚠️ Below threshold ({nodeData.lowStockThreshold} {nodeData.unit})
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-success !border-success" />
    </Card>
  );
});