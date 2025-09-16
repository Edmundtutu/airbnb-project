import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Edit3, Check, X, Settings } from 'lucide-react';

interface ModifierData {
  label?: string;
  priceChange?: number;
  type?: 'addon' | 'size' | 'customization';
}

export const ModifierNode = memo(({ data }: NodeProps) => {
  const nodeData = (data || {}) as ModifierData;
  const [editData, setEditData] = useState(nodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isPositive = nodeData.priceChange > 0;
  const priceColor = isPositive ? 'text-success' : nodeData.priceChange < 0 ? 'text-destructive' : 'text-muted-foreground';
  const priceIcon = isPositive ? Plus : nodeData.priceChange < 0 ? Minus : null;

  const typeColors = {
    addon: 'bg-warning-light text-warning border-warning/20',
    size: 'bg-info-light text-info border-info/20',
    customization: 'bg-accent-light text-accent border-accent/20'
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(nodeData);
    setIsEditing(false);
  };

  return (
    <Card className="w-64 p-4 bg-card border-border shadow-card hover:shadow-elevated transition-all duration-200">
      <Handle type="target" position={Position.Top} className="!bg-warning !border-warning" />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-warning" />
            <Badge className={typeColors[nodeData.type]} variant="outline">
              {nodeData.type}
            </Badge>
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
          <div className="space-y-3">
            <Input
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="h-8 text-sm"
              placeholder="Modifier name"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                value={editData.priceChange}
                onChange={(e) => setEditData({ ...editData, priceChange: Number(e.target.value) })}
                className="h-8 text-sm"
                placeholder="Price change"
              />
              <Select 
                value={editData.type} 
                onValueChange={(value: 'addon' | 'size' | 'customization') => 
                  setEditData({ ...editData, type: value })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="addon">Add-on</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="customization">Custom</SelectItem>
                </SelectContent>
              </Select>
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
            <h3 className="font-semibold text-sm text-foreground">{nodeData.label}</h3>
            
            <div className="space-y-2">
              <div className={`flex items-center gap-1 font-semibold ${priceColor}`}>
                {priceIcon && React.createElement(priceIcon, { className: "h-4 w-4" })}
                <span>${Math.abs(nodeData.priceChange).toFixed(2)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {isPositive ? 'Adds to base price' : 
                 nodeData.priceChange < 0 ? 'Discount from base price' : 'No price change'}
              </div>
            </div>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-warning !border-warning" />
    </Card>
  );
});