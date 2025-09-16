import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { IngredientNode } from './nodes/IngredientNode';
import { ModifierNode } from './nodes/ModifierNode';
import { ProductNode } from './nodes/ProductNode';
import { CategoryNode } from './nodes/CategoryNode';
import { PriceEdge } from './edges/PriceEdge';
import { DynamicToolbar } from './DynamicToolbar';
import { InventoryStats } from './InventoryStats';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Grid3X3, Layers, Settings, Plus, Square } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import inventoryService from '@/services/inventoryService';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { modificationService } from '@/services/modificationService';
import { addonService } from '@/services/addonService';
import { getEcho } from '@/services/realtime';

type ApiNode = import('@/services/inventoryService').InventoryNode;
type ApiEdge = import('@/services/inventoryService').InventoryNodeEdge;

const nodeTypes = {
  ingredient: IngredientNode,
  modifier: ModifierNode,
  product: ProductNode,
  category: CategoryNode,
};

const edgeTypes = {
  price: PriceEdge,
};

interface Layer {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}
const initialNodes: Node[] = [
  // Categories
  {
    id: 'cat-1',
    type: 'category',
    position: { x: 100, y: 50 },
    data: { 
      label: 'Local Dishes',
      color: '#4F46E5',
      itemCount: 3
    },
  },
  {
    id: 'cat-2',
    type: 'category',
    position: { x: 400, y: 50 },
    data: { 
      label: 'Beverages',
      color: '#059669',
      itemCount: 2
    },
  },

  // Products
  {
    id: 'prod-1',
    type: 'product',
    position: { x: 50, y: 200 },
    data: { 
      label: 'Adobo Rice Bowl',
      basePrice: 12.99,
      image: '🍛',
      available: true,
      category: 'cat-1'
    },
  },
  {
    id: 'prod-2',
    type: 'product',
    position: { x: 250, y: 200 },
    data: { 
      label: 'Grilled Fish',
      basePrice: 15.99,
      image: '🐟',
      available: true,
      category: 'cat-1'
    },
  },
  {
    id: 'prod-3',
    type: 'product',
    position: { x: 450, y: 200 },
    data: { 
      label: 'Fresh Juice',
      basePrice: 4.99,
      image: '🥤',
      available: true,
      category: 'cat-2'
    },
  },

  // Ingredients
  {
    id: 'ing-1',
    type: 'ingredient',
    position: { x: 50, y: 400 },
    data: { 
      label: 'Pork',
      stock: 50,
      unit: 'lbs',
      cost: 3.50,
      lowStockThreshold: 10
    },
  },
  {
    id: 'ing-2',
    type: 'ingredient',
    position: { x: 200, y: 400 },
    data: { 
      label: 'Rice',
      stock: 100,
      unit: 'cups',
      cost: 0.50,
      lowStockThreshold: 20
    },
  },
  {
    id: 'ing-3',
    type: 'ingredient',
    position: { x: 350, y: 400 },
    data: { 
      label: 'Fresh Fish',
      stock: 25,
      unit: 'lbs',
      cost: 8.00,
      lowStockThreshold: 5
    },
  },
  {
    id: 'ing-4',
    type: 'ingredient',
    position: { x: 500, y: 400 },
    data: { 
      label: 'Orange',
      stock: 80,
      unit: 'pieces',
      cost: 0.75,
      lowStockThreshold: 15
    },
  },

  // Modifiers
  {
    id: 'mod-1',
    type: 'modifier',
    position: { x: 100, y: 600 },
    data: { 
      label: 'Extra Protein',
      priceChange: 3.00,
      type: 'addon'
    },
  },
  {
    id: 'mod-2',
    type: 'modifier',
    position: { x: 300, y: 600 },
    data: { 
      label: 'Large Size',
      priceChange: 2.50,
      type: 'size'
    },
  },
  {
    id: 'mod-3',
    type: 'modifier',
    position: { x: 500, y: 600 },
    data: { 
      label: 'Extra Fresh',
      priceChange: 1.50,
      type: 'addon'
    },
  },
];

const initialEdges: Edge[] = [
  // Category connections
  { id: 'e-cat-prod-1', source: 'cat-1', target: 'prod-1', type: 'price', data: { relationship: 'contains' } },
  { id: 'e-cat-prod-2', source: 'cat-1', target: 'prod-2', type: 'price', data: { relationship: 'contains' } },
  { id: 'e-cat-prod-3', source: 'cat-2', target: 'prod-3', type: 'price', data: { relationship: 'contains' } },

  // Product-Ingredient connections
  { id: 'e-prod-ing-1', source: 'prod-1', target: 'ing-1', type: 'price', data: { relationship: 'requires', quantity: 0.5 } },
  { id: 'e-prod-ing-2', source: 'prod-1', target: 'ing-2', type: 'price', data: { relationship: 'requires', quantity: 1 } },
  { id: 'e-prod-ing-3', source: 'prod-2', target: 'ing-3', type: 'price', data: { relationship: 'requires', quantity: 0.75 } },
  { id: 'e-prod-ing-4', source: 'prod-2', target: 'ing-2', type: 'price', data: { relationship: 'requires', quantity: 1 } },
  { id: 'e-prod-ing-5', source: 'prod-3', target: 'ing-4', type: 'price', data: { relationship: 'requires', quantity: 3 } },

  // Modifier connections
  { id: 'e-mod-prod-1', source: 'mod-1', target: 'prod-1', type: 'price', data: { relationship: 'modifies' } },
  { id: 'e-mod-prod-2', source: 'mod-1', target: 'prod-2', type: 'price', data: { relationship: 'modifies' } },
  { id: 'e-mod-prod-3', source: 'mod-2', target: 'prod-3', type: 'price', data: { relationship: 'modifies' } },
  { id: 'e-mod-prod-4', source: 'mod-3', target: 'prod-3', type: 'price', data: { relationship: 'modifies' } },
];

interface Props {
  shopId: string;
  initialGraph: { nodes: ApiNode[]; edges: ApiEdge[] };
}

export function DynamicInventoryFlow({ shopId, initialGraph }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('product');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<string>('all');
  const [activeTool, setActiveTool] = useState<string>('select');
  const [isCreatingLayer, setIsCreatingLayer] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedLayerColor, setSelectedLayerColor] = useState('#ef4444');
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [resizingLayer, setResizingLayer] = useState<{ layerId: string; handle: string } | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  
  // Dialog states for modification and addon creation
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [showAddonDialog, setShowAddonDialog] = useState(false);
  const [selectedProductForMod, setSelectedProductForMod] = useState<string>('');
  const [modificationData, setModificationData] = useState({ name: '', cost: 0 });
  const [addonData, setAddonData] = useState({ name: '', price: 0 });

  const onConnect = useCallback(
    async (params: Connection) => {
      // Determine relationship based on node types
      const source = nodes.find(n => n.id === params.source);
      const target = nodes.find(n => n.id === params.target);
      
      let relationship = 'contains'; // default
      if (source?.type === 'category' && target?.type === 'product') {
        relationship = 'contains';
      } else if (source?.type === 'modifier' && target?.type === 'product') {
        relationship = 'modifies';
      } else if (source?.type === 'addon' && target?.type === 'product') {
        relationship = 'adds';
      } else if (source?.type === 'product' && target?.type === 'modifier') {
        relationship = 'modifies';
      } else if (source?.type === 'product' && target?.type === 'addon') {
        relationship = 'adds';
      }

      // optimistic add
      const optimistic: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: 'price',
        data: { relationship },
      } as Edge;
      setEdges((eds) => addEdge(optimistic, eds));
      try {
        // If connecting a category node to a product node, sync category_ids on backend
        const categoryNode = source?.type === 'category' ? source : (target?.type === 'category' ? target : undefined);
        const productNode = source?.type === 'product' ? source : (target?.type === 'product' ? target : undefined);

        if (categoryNode && productNode) {
          // Fetch existing categories for the product is not available; rely on echo sync or assume add
          const catId = (categoryNode as any).data?.entity_id ?? categoryNode.id;
          const prodId = productNode.id; // Inventory node id; backend expects product id
          // If entity_id for product nodes is available in metadata, prefer that
          const productEntityId = (productNode as any).data?.entity_id ?? prodId;
          await productService.attachCategories(productEntityId, [catId]);
        }
        await inventoryService.createEdge(
          shopId,
          params.source!,
          params.target!,
          null,
          { relationship }
        );
      } catch (e) {
        // revert on error
        setEdges((eds) => eds.filter((e2) => e2.id !== optimistic.id));
      }
    },
    [setEdges, shopId, nodes]
  );

  const addNode = useCallback(async (type: string) => {
    // Handle special cases for modification and addon
    if (type === 'modifier') {
      setShowModificationDialog(true);
      return;
    }
    if (type === 'addon') {
      setShowAddonDialog(true);
      return;
    }

    const pos = { x: Math.round(Math.random() * 400 + 100), y: Math.round(Math.random() * 200 + 300) };
    // optimistic local
    const tempId = `${type}-${Date.now()}`;
    const newNode: Node = { id: tempId, type, position: pos, data: getDefaultNodeData(type) };
    setNodes((nds) => nds.concat(newNode));
    try {
      let entityType = type;
      let dataToPersist = newNode.data as any;

      // if creating a category, first create the Category entity, then create node with entity_id and display_name
      if (type === 'category') {
        const createdCategory = await categoryService.create(shopId, dataToPersist.label ?? 'New Category');
        dataToPersist = { ...dataToPersist, entity_id: createdCategory.id };
      }

      const created = await inventoryService.createNode(shopId, entityType as any, pos.x, pos.y, dataToPersist);
      // replace temp with server id
      setNodes((nds) => nds.map(n => n.id === tempId ? mapApiNodeToFlow(created) : n));
    } catch (e) {
      setNodes((nds) => nds.filter(n => n.id !== tempId));
    }
  }, [setNodes, shopId]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, [setNodes]);

  const toggleSectionCollapse = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const getZoneNodes = useCallback((zone: string) => {
    if (zone === 'all') return nodes;
    return nodes.filter(node => {
      if (zone === 'categories' && node.type === 'category') return true;
      if (zone === 'products' && node.type === 'product') return true;
      if (zone === 'ingredients' && node.type === 'ingredient') return true;
      if (zone === 'modifiers' && node.type === 'modifier') return true;
      return false;
    });
  }, [nodes, activeZone]);

  const filteredNodes = useMemo(() => {
    const zoneNodes = getZoneNodes(activeZone);
    return zoneNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        collapsed: collapsedSections.has(node.type || ''),
        onToggleCollapse: () => toggleSectionCollapse(node.type || '')
      }
    }));
  }, [nodes, activeZone, collapsedSections, getZoneNodes, toggleSectionCollapse]);

  const stats = useMemo(() => {
    const products = nodes.filter(n => n.type === 'product');
    const ingredients = nodes.filter(n => n.type === 'ingredient');
    const lowStockItems = ingredients.filter(n => 
      typeof n.data.stock === 'number' && 
      typeof n.data.lowStockThreshold === 'number' && 
      n.data.stock <= n.data.lowStockThreshold
    );
    const totalValue = ingredients.reduce((sum, n) => {
      const stock = typeof n.data.stock === 'number' ? n.data.stock : 0;
      const cost = typeof n.data.cost === 'number' ? n.data.cost : 0;
      return sum + (stock * cost);
    }, 0);
    
    return {
      totalProducts: products.length,
      totalIngredients: ingredients.length,
      lowStockItems: lowStockItems.length,
      totalValue: totalValue
    };
  }, [nodes]);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSelectedLayer(null);
  }, []);
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (activeTool === 'layer') {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const startPos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setDragStart(startPos);
      setCurrentMousePos(startPos);
      setIsCreatingLayer(true);
    }
  }, [activeTool]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (activeTool === 'layer' && isCreatingLayer && dragStart) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setCurrentMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
  }, [activeTool, isCreatingLayer, dragStart]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent) => {
    if (isCreatingLayer && dragStart) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;
      
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        x: Math.min(dragStart.x, endX),
        y: Math.min(dragStart.y, endY),
        width: Math.abs(endX - dragStart.x),
        height: Math.abs(endY - dragStart.y),
        color: selectedLayerColor,
        name: `Layer ${layers.length + 1}`,
      };
      
      if (newLayer.width > 10 && newLayer.height > 10) {
        setLayers(prev => [...prev, newLayer]);
      }
      
      setIsCreatingLayer(false);
      setDragStart(null);
      setCurrentMousePos(null);
      setActiveTool('select');
    }
  }, [isCreatingLayer, dragStart, selectedLayerColor]);

  const handleLayerMouseDown = useCallback((event: React.MouseEvent, layerId: string) => {
    event.stopPropagation();
    setSelectedLayer(layerId);
  }, []);

  const handleResizeStart = useCallback((event: React.MouseEvent, layerId: string, handle: string) => {
    event.stopPropagation();
    setResizingLayer({ layerId, handle });
    setSelectedLayer(layerId);
  }, []);

  const handleResizeMove = useCallback((event: React.MouseEvent) => {
    if (!resizingLayer) return;
    
    const layer = layers.find(l => l.id === resizingLayer.layerId);
    if (!layer) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let updates: Partial<Layer> = {};

    switch (resizingLayer.handle) {
      case 'nw':
        updates = {
          x: Math.min(mouseX, layer.x + layer.width - 20),
          y: Math.min(mouseY, layer.y + layer.height - 20),
          width: Math.max(20, layer.width + (layer.x - mouseX)),
          height: Math.max(20, layer.height + (layer.y - mouseY)),
        };
        break;
      case 'ne':
        updates = {
          y: Math.min(mouseY, layer.y + layer.height - 20),
          width: Math.max(20, mouseX - layer.x),
          height: Math.max(20, layer.height + (layer.y - mouseY)),
        };
        break;
      case 'sw':
        updates = {
          x: Math.min(mouseX, layer.x + layer.width - 20),
          width: Math.max(20, layer.width + (layer.x - mouseX)),
          height: Math.max(20, mouseY - layer.y),
        };
        break;
      case 'se':
        updates = {
          width: Math.max(20, mouseX - layer.x),
          height: Math.max(20, mouseY - layer.y),
        };
        break;
    }

    updateLayer(resizingLayer.layerId, updates);
  }, [resizingLayer, layers, updateLayer]);

  const handleResizeEnd = useCallback(() => {
    setResizingLayer(null);
  }, []);

  // Initialize from API graph
  useEffect(() => {
    const mappedNodes = (initialGraph.nodes ?? []).map(mapApiNodeToFlow);
    const mappedEdges = (initialGraph.edges ?? []).map(mapApiEdgeToFlow);
    setNodes(mappedNodes);
    setEdges(mappedEdges);
  }, [initialGraph, setNodes, setEdges]);

  // Subscribe to realtime updates
  useEffect(() => {
    const echo = getEcho();
    const channel = echo.private(`shopInventory.${shopId}`);

    channel.listen('.node.created', (payload: ApiNode) => {
      setNodes((nds) => nds.concat(mapApiNodeToFlow(payload)));
    });
    channel.listen('.node.updated', (payload: ApiNode) => {
      setNodes((nds) => nds.map(n => n.id === payload.id ? mapApiNodeToFlow(payload) : n));
    });
    channel.listen('.node.deleted', (payload: { id: string }) => {
      setNodes((nds) => nds.filter(n => n.id !== payload.id));
      setEdges((eds) => eds.filter(e => e.source !== payload.id && e.target !== payload.id));
    });
    channel.listen('.node.position.updated', (payload: { id: string; x: number; y: number }) => {
      setNodes((nds) => nds.map(n => n.id === payload.id ? { ...n, position: { x: payload.x, y: payload.y } } : n));
    });
    channel.listen('.edge.created', (payload: ApiEdge) => {
      setEdges((eds) => addEdge(mapApiEdgeToFlow(payload), eds));
    });
    channel.listen('.edge.deleted', (payload: { id: string }) => {
      setEdges((eds) => eds.filter(e => e.id !== payload.id));
    });

    return () => {
      try { channel.stopListening('.node.created'); } catch {}
      try { channel.stopListening('.node.updated'); } catch {}
      try { channel.stopListening('.node.deleted'); } catch {}
      try { channel.stopListening('.node.position.updated'); } catch {}
      try { channel.stopListening('.edge.created'); } catch {}
      try { channel.stopListening('.edge.deleted'); } catch {}
      // @ts-ignore
      try { echo.leave(`private-shopInventory.${shopId}`); } catch {}
    };
  }, [shopId, setNodes, setEdges]);
  // Calculate preview layer dimensions
  const previewLayer = useMemo(() => {
    if (!isCreatingLayer || !dragStart || !currentMousePos) return null;
    
    return {
      x: Math.min(dragStart.x, currentMousePos.x),
      y: Math.min(dragStart.y, currentMousePos.y),
      width: Math.abs(currentMousePos.x - dragStart.x),
      height: Math.abs(currentMousePos.y - dragStart.y),
    };
  }, [isCreatingLayer, dragStart, currentMousePos]);

  return (
    <div className="h-screen bg-background relative">
      {/* Main Canvas Area */}
      <div className="h-full relative">
        {/* Layers */}
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`absolute border-2 border-dashed transition-all duration-200 ${
              selectedLayer === layer.id 
                ? 'opacity-60 border-solid shadow-lg z-20' 
                : 'opacity-30 hover:opacity-50 z-10'
            }`}
            style={{
              left: layer.x,
              top: layer.y,
              width: layer.width,
              height: layer.height,
              backgroundColor: layer.color,
              borderColor: layer.color,
              cursor: selectedLayer === layer.id ? 'move' : 'pointer',
            }}
            onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
          >
            {/* Layer Name */}
            <div className="absolute -top-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-auto">
              {editingLayerName === layer.id ? (
                <Input
                  value={layer.name}
                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                  onBlur={() => setEditingLayerName(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingLayerName(null);
                  }}
                  className="h-5 text-xs w-20 bg-transparent border-none text-white p-0"
                  autoFocus
                />
              ) : (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLayerName(layer.id);
                  }}
                  className="cursor-text"
                >
                  {layer.name}
                </span>
              )}
            </div>

            {/* Resize Handles - only show when selected */}
            {selectedLayer === layer.id && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize"
                  onMouseDown={(e) => handleResizeStart(e, layer.id, 'nw')}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize"
                  onMouseDown={(e) => handleResizeStart(e, layer.id, 'ne')}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize"
                  onMouseDown={(e) => handleResizeStart(e, layer.id, 'sw')}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(e, layer.id, 'se')}
                />
              </>
            )}
          </div>
        ))}

        {/* Preview Layer (shown while dragging) */}
        {previewLayer && previewLayer.width > 5 && previewLayer.height > 5 && (
          <div
            className="absolute pointer-events-none border-2 border-dashed opacity-50 z-10"
            style={{
              left: previewLayer.x,
              top: previewLayer.y,
              width: previewLayer.width,
              height: previewLayer.height,
              backgroundColor: selectedLayerColor,
              borderColor: selectedLayerColor,
              boxShadow: `0 0 0 1px ${selectedLayerColor}40`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {Math.round(previewLayer.width)} × {Math.round(previewLayer.height)}
              </span>
            </div>
          </div>
        )}

        {/* Zone Background Overlays */}
        {activeZone !== 'all' && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className={`h-full w-full ${
              activeZone === 'categories' ? 'bg-gradient-to-br from-violet-500/10 to-violet-300/5' :
              activeZone === 'products' ? 'bg-gradient-to-br from-blue-500/10 to-blue-300/5' :
              activeZone === 'ingredients' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-300/5' :
              'bg-gradient-to-br from-amber-500/10 to-amber-300/5'
            }`} />
          </div>
        )}
        
        <div 
          className="h-full w-full"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{
            cursor: activeTool === 'layer' 
              ? isCreatingLayer 
                ? 'crosshair' 
                : 'crosshair'
              : 'default'
          }}
        >
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              // persist position updates when dragging stops
              changes.forEach((c) => {
                if (c.type === 'position' && c.dragging === false && c.id) {
                  const n = nodes.find(n => n.id === c.id);
                  if (n) {
                    inventoryService.updateNodePosition(c.id, Math.round(n.position.x), Math.round(n.position.y)).catch(() => {});
                  }
                }
              });
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              changes.forEach((c: any) => {
                if (c.type === 'remove' && c.id) {
                  inventoryService.deleteEdge(c.id).catch(() => {});
                }
              });
            }}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="dynamic-inventory-flow"
            style={{ 
              backgroundColor: 'transparent',
            }}
          >
            <Controls className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-card" />
            <MiniMap 
              className="bg-card/90 backdrop-blur-sm border border-border rounded-lg"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'product': return '#3B82F6';
                  case 'ingredient': return '#10B981';
                  case 'modifier': return '#F59E0B';
                  case 'category': return '#8B5CF6';
                  default: return '#6B7280';
                }
              }}
            />
            <Background gap={20} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </div>
      </div>

      {/* Right Collapsible Toolbar */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex items-center gap-2">
          {/* Collapsed Toolbar */}
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2">
            <div className="flex flex-col gap-2">
              {/* Tool Icons */}
              <Button
                variant={activeTool === 'select' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setActiveTool('select')}
                className="h-8 w-8"
              >
                <Square className="h-4 w-4" />
              </Button>
              
              <Button
                variant={activeTool === 'layer' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setActiveTool('layer')}
                className="h-8 w-8"
              >
                <Layers className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => addNode(selectedNodeType)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expandable Panel */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 overflow-y-auto max-h-screen">
              <div className="space-y-6 py-6">
                <InventoryStats stats={stats} />
                
                {/* Layer Management */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Layers ({layers.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {layers.map((layer) => (
                      <div
                        key={layer.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          selectedLayer === layer.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedLayer(layer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded border"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-xs font-medium">{layer.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round(layer.width)} × {Math.round(layer.height)}px
                        </div>
                      </div>
                    ))}
                    {layers.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No layers created yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Layer Settings</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Layer Color</label>
                    <Select value={selectedLayerColor} onValueChange={setSelectedLayerColor}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#ef4444">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500" />
                            Critical (Red)
                          </div>
                        </SelectItem>
                        <SelectItem value="#10b981">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500" />
                            Stable (Green)
                          </div>
                        </SelectItem>
                        <SelectItem value="#f59e0b">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500" />
                            Warning (Yellow)
                          </div>
                        </SelectItem>
                        <SelectItem value="#3b82f6">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            Info (Blue)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Zone Focus</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { key: 'all', label: 'All Items', icon: Grid3X3 },
                      { key: 'categories', label: 'Categories', icon: Layers },
                      { key: 'products', label: 'Products', icon: Eye },
                      { key: 'ingredients', label: 'Ingredients', icon: Eye },
                      { key: 'modifiers', label: 'Modifiers', icon: Eye }
                    ].map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={activeZone === key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveZone(key)}
                        className="justify-start text-xs h-8"
                      >
                        <Icon className="h-3 w-3 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Section Controls</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {['category', 'product', 'ingredient', 'modifier'].map((type) => (
                      <Button
                        key={type}
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionCollapse(type)}
                        className="justify-start text-xs h-8"
                      >
                        {collapsedSections.has(type) ? (
                          <EyeOff className="h-3 w-3 mr-2" />
                        ) : (
                          <Eye className="h-3 w-3 mr-2" />
                        )}
                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                      </Button>
                    ))}
                  </div>
                </div>

                <DynamicToolbar 
                  onAddNode={addNode}
                  selectedNodeType={selectedNodeType}
                  onSelectNodeType={setSelectedNodeType}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Layer Creation Instructions */}
      {activeTool === 'layer' && (
        <div className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded border-2 border-dashed"
              style={{ 
                backgroundColor: selectedLayerColor,
                borderColor: selectedLayerColor 
              }}
            />
            <span className="text-sm font-medium text-foreground">Layer Tool Active</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {isCreatingLayer 
              ? 'Release to create layer' 
              : 'Click and drag to create a colored layer'
            }
          </p>
          {previewLayer && (
            <p className="text-xs text-primary font-medium">
              Size: {Math.round(previewLayer.width)} × {Math.round(previewLayer.height)}px
            </p>
        )}
      </div>
    )}
    {/* Layer Selection Instructions */}
    {selectedLayer && activeTool === 'select' && (
      <div className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-4 h-4 rounded border-2"
            style={{ 
              backgroundColor: layers.find(l => l.id === selectedLayer)?.color,
              borderColor: layers.find(l => l.id === selectedLayer)?.color 
            }}
          />
          <span className="text-sm font-medium text-foreground">
            {layers.find(l => l.id === selectedLayer)?.name} Selected
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click layer name to rename</p>
          <p>• Drag corners to resize</p>
          <p>• Click elsewhere to deselect</p>
        </div>
      </div>
    )}
    {/* Modification Creation Dialog */}
    <Dialog open={showModificationDialog} onOpenChange={setShowModificationDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Modification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-select">Product</Label>
            <Select value={selectedProductForMod} onValueChange={setSelectedProductForMod}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {nodes.filter(n => n.type === 'product').map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {(product.data as any)?.label || 'Unnamed Product'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="mod-name">Name</Label>
            <Input
              id="mod-name"
              value={modificationData.name}
              onChange={(e) => setModificationData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Extra Spicy"
            />
          </div>
          <div>
            <Label htmlFor="mod-cost">Cost</Label>
            <Input
              id="mod-cost"
              type="number"
              step="0.01"
              value={modificationData.cost}
              onChange={(e) => setModificationData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                if (!selectedProductForMod || !modificationData.name) return;
                
                try {
                  // Create the modification entity
                  const productEntityId = (nodes.find(n => n.id === selectedProductForMod) as any)?.data?.entity_id ?? selectedProductForMod;
                  const createdMod = await modificationService.create(productEntityId, modificationData.name, modificationData.cost);
                  
                  // Create the Inventory node
                  const pos = { x: Math.round(Math.random() * 400 + 100), y: Math.round(Math.random() * 200 + 300) };
                  const tempId = `modifier-${Date.now()}`;
                  const newNode: Node = { 
                    id: tempId, 
                    type: 'modifier', 
                    position: pos, 
                    data: { 
                      label: modificationData.name,
                      cost: modificationData.cost,
                      entity_id: createdMod.id
                    } 
                  };
                  setNodes((nds) => nds.concat(newNode));
                  
                  const createdNode = await inventoryService.createNode(shopId, 'modification', pos.x, pos.y, { 
                    label: modificationData.name,
                    cost: modificationData.cost,
                    entity_id: createdMod.id
                  });
                  
                  // Replace temp with server id
                  setNodes((nds) => nds.map(n => n.id === tempId ? mapApiNodeToFlow(createdNode) : n));
                  
                  // Create edge to product
                  const edgeTempId = `e-${createdNode.id}-${selectedProductForMod}`;
                  const optimisticEdge: Edge = {
                    id: edgeTempId,
                    source: createdNode.id,
                    target: selectedProductForMod,
                    type: 'price',
                    data: { relationship: 'modifies' }
                  } as Edge;
                  setEdges((eds) => addEdge(optimisticEdge, eds));
                  
                  await inventoryService.createEdge(shopId, createdNode.id, selectedProductForMod, null, { relationship: 'modifies' });
                  
                  // Reset form
                  setModificationData({ name: '', cost: 0 });
                  setSelectedProductForMod('');
                  setShowModificationDialog(false);
                } catch (e) {
                  console.error('Failed to create modification:', e);
                }
              }}
              disabled={!selectedProductForMod || !modificationData.name}
            >
              Create Modification
            </Button>
            <Button variant="outline" onClick={() => setShowModificationDialog(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Addon Creation Dialog */}
    <Dialog open={showAddonDialog} onOpenChange={setShowAddonDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Addon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="addon-product-select">Product</Label>
            <Select value={selectedProductForMod} onValueChange={setSelectedProductForMod}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {nodes.filter(n => n.type === 'product').map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {(product.data as any)?.label || 'Unnamed Product'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="addon-name">Name</Label>
            <Input
              id="addon-name"
              value={addonData.name}
              onChange={(e) => setAddonData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Extra Cheese"
            />
          </div>
          <div>
            <Label htmlFor="addon-price">Price</Label>
            <Input
              id="addon-price"
              type="number"
              step="0.01"
              value={addonData.price}
              onChange={(e) => setAddonData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                if (!selectedProductForMod || !addonData.name) return;
                
                try {
                  // Create the addon entity
                  const productEntityId = (nodes.find(n => n.id === selectedProductForMod) as any)?.data?.entity_id ?? selectedProductForMod;
                  const createdAddon = await addonService.create(productEntityId, addonData.name, addonData.price);
                  
                  // Create the Inventory node
                  const pos = { x: Math.round(Math.random() * 400 + 100), y: Math.round(Math.random() * 200 + 300) };
                  const tempId = `addon-${Date.now()}`;
                  const newNode: Node = { 
                    id: tempId, 
                    type: 'addon', 
                    position: pos, 
                    data: { 
                      label: addonData.name,
                      price: addonData.price,
                      entity_id: createdAddon.id
                    } 
                  };
                  setNodes((nds) => nds.concat(newNode));
                  
                  const createdNode = await inventoryService.createNode(shopId, 'addon', pos.x, pos.y, { 
                    label: addonData.name,
                    price: addonData.price,
                    entity_id: createdAddon.id
                  });
                  
                  // Replace temp with server id
                  setNodes((nds) => nds.map(n => n.id === tempId ? mapApiNodeToFlow(createdNode) : n));
                  
                  // Create edge to product
                  const edgeTempId = `e-${createdNode.id}-${selectedProductForMod}`;
                  const optimisticEdge: Edge = {
                    id: edgeTempId,
                    source: createdNode.id,
                    target: selectedProductForMod,
                    type: 'price',
                    data: { relationship: 'adds' }
                  } as Edge;
                  setEdges((eds) => addEdge(optimisticEdge, eds));
                  
                  await inventoryService.createEdge(shopId, createdNode.id, selectedProductForMod, null, { relationship: 'adds' });
                  
                  // Reset form
                  setAddonData({ name: '', price: 0 });
                  setSelectedProductForMod('');
                  setShowAddonDialog(false);
                } catch (e) {
                  console.error('Failed to create addon:', e);
                }
              }}
              disabled={!selectedProductForMod || !addonData.name}
            >
              Create Addon
            </Button>
            <Button variant="outline" onClick={() => setShowAddonDialog(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Close main container div */}
  </div>
  );
}

function getDefaultNodeData(type: string) {
  switch (type) {
    case 'product':
      return {
        label: 'New Product',
        basePrice: 10.00,
        image: '🍽️',
        available: true
      };
    case 'ingredient':
      return {
        label: 'New Ingredient',
        stock: 50,
        unit: 'units',
        cost: 1.00,
        lowStockThreshold: 10
      };
    case 'modifier':
      return {
        label: 'New Modifier',
        priceChange: 1.00,
        type: 'addon'
      };
    case 'category':
      return {
        label: 'New Category',
        color: '#6B7280',
        itemCount: 0
      };
    default:
      return {};
  }
}

function mapApiNodeToFlow(n: ApiNode): Node {
  const data: any = {
    label: n.display_name ?? n.metadata?.label ?? n.entity_type,
    color: n.color_code ?? n.metadata?.color,
    image: n.icon ?? n.metadata?.image,
    ...n.metadata,
  };
  return {
    id: n.id,
    type: n.entity_type as any,
    position: { x: n.x, y: n.y },
    data,
  };
}

function mapApiEdgeToFlow(e: ApiEdge): Edge {
  return {
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    type: 'price',
    data: e.metadata ?? {},
  } as Edge;
}