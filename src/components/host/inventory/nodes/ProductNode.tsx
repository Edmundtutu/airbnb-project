import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Star, Edit3, Check, X, Clock } from 'lucide-react';

interface ProductData {
  label?: string;
  basePrice?: number;
  image?: string;
  available?: boolean;
  category?: string;
}

export const ProductNode = memo(({ data }: NodeProps) => {
  const nodeData = (data || {}) as ProductData;
  const [editData, setEditData] = useState(nodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(nodeData);
    setIsEditing(false);
  };

  return (
    <Card className="w-72 p-4 bg-card border-border shadow-card hover:shadow-elevated transition-all duration-200">
      <Handle type="target" position={Position.Top} className="!bg-primary !border-primary" />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{nodeData.image}</span>
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={nodeData.available ? "default" : "secondary"} className="text-xs">
              {nodeData.available ? "Available" : "Unavailable"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="h-8 text-sm"
              placeholder="Product name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={editData.image}
                onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                className="h-8 text-sm"
                placeholder="Emoji"
              />
              <Input
                type="number"
                step="0.01"
                value={editData.basePrice}
                onChange={(e) => setEditData({ ...editData, basePrice: Number(e.target.value) })}
                className="h-8 text-sm"
                placeholder="Price"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Available</label>
              <Switch
                checked={editData.available}
                onCheckedChange={(checked) => setEditData({ ...editData, available: checked })}
              />
            </div>
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
            <div>
              <h3 className="font-semibold text-foreground mb-1">{nodeData.label}</h3>
              <p className="text-2xl font-bold text-primary">${nodeData.basePrice.toFixed(2)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Base price • Modifiers can adjust</span>
              </div>
              
              {!nodeData.available && (
                <div className="text-xs text-warning">
                  ⚠️ Currently unavailable
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-primary" />
    </Card>
  );
});