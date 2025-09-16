import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Folder, Edit3, Check, X, ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryData {
  label?: string;
  color?: string;
  itemCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CategoryNode = memo(({ data }: NodeProps) => {
  const nodeData = (data || {}) as CategoryData;
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
    <Card 
      className={`w-64 bg-card border-border shadow-card hover:shadow-elevated transition-all duration-200 ${
        nodeData.collapsed ? 'opacity-50' : ''
      }`}
      style={{ borderTopColor: nodeData.color, borderTopWidth: '3px' }}
    >
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <Folder className="h-4 w-4" style={{ color: nodeData.color }} />
                  <Badge variant="secondary" className="text-xs">
                    {nodeData.itemCount} items
                  </Badge>
                </div>
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>

          <CollapsibleContent className="space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editData.label}
                  onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Category name"
                />
                <Input
                  type="color"
                  value={editData.color}
                  onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                  className="h-8 w-full"
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
                <h3 className="font-semibold text-foreground">{nodeData.label}</h3>
                <div className="text-xs text-muted-foreground">
                  Organize your products into categories for better customer experience
                </div>
              </>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Handle type="source" position={Position.Bottom} style={{ backgroundColor: nodeData.color }} />
    </Card>
  );
});