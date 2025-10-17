import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Package, Settings, Folder, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DynamicToolbarProps {
  onAddNode: (type: string) => void;
  selectedNodeType: string;
  onSelectNodeType: (type: string) => void;
}

export function DynamicToolbar({ onAddNode, selectedNodeType, onSelectNodeType }: DynamicToolbarProps) {
  const nodeTypes = [
    { value: 'category', label: 'Category', icon: Folder, color: 'text-purple-500' },
    { value: 'product', label: 'Product', icon: Star, color: 'text-blue-500' },
    { value: 'modification', label: 'Modification', icon: Settings, color: 'text-orange-500' },
    // keep ingredients disabled per current backend scope
  ];

  const selectedType = nodeTypes.find(type => type.value === selectedNodeType);

  return (
    <Card className="p-4 bg-card border-border shadow-card">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Add New Node</h3>
        
        <Select value={selectedNodeType} onValueChange={onSelectNodeType}>
          <SelectTrigger className="w-40">
            <SelectValue>
              <div className="flex items-center gap-2">
                {selectedType && (
                  <>
                    <selectedType.icon className={`h-4 w-4 ${selectedType.color}`} />
                    <span>{selectedType.label}</span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {nodeTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className={`h-4 w-4 ${type.color}`} />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => onAddNode(selectedNodeType)}
          className="w-full bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {selectedType?.label}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>💡 Tips:</div>
          <div>• Connect nodes to show relationships</div>
          <div>• Edit nodes by clicking the edit icon</div>
          <div>• Drag to rearrange your inventory flow</div>
        </div>
      </div>
    </Card>
  );
}