import api from './api';

export interface InventoryNode {
  id: string;
  shop_id: string;
  entity_type: 'category' | 'product' | 'ingredient' | 'modifier';
  entity_id: string | null;
  x: number;
  y: number;
  display_name: string | null;
  color_code: string | null;
  icon: string | null;
  metadata: Record<string, any> | null;
}

export interface InventoryNodeEdge {
  id: string;
  shop_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  metadata: Record<string, any> | null;
}

export interface GraphData {
  nodes: InventoryNode[];
  edges: InventoryNodeEdge[];
}
const apiVersion = import.meta.env.VITE_API_VERSION;
const inventoryService = {
  async getGraph(shopId: string): Promise<GraphData> {
    const response = await api.get(`${apiVersion}/inventory/${shopId}/graph`);
    const payload = response.data as any;
    const nodes = Array.isArray(payload.nodes) ? payload.nodes : (payload.nodes?.data ?? []);
    const edges = Array.isArray(payload.edges) ? payload.edges : (payload.edges?.data ?? []);
    return { nodes, edges } as GraphData;
  },

  async createNode(
    shopId: string,
    type: 'category' | 'product' | 'modification' | 'addon',
    x: number,
    y: number,
    data: Record<string, any>
  ): Promise<InventoryNode> {
    const payload = {
      shop_id: shopId,
      entity_type: type,
      entity_id: data.entity_id ?? null,
      x,
      y,
      display_name: data.label || null,
      color_code: data.color || null,
      icon: data.image || null,
      metadata: data,
    };
    const response = await api.post(`${apiVersion}/inventory/nodes`, payload);
    return response.data.data; // Laravel resources often wrap data in a 'data' key
  },

  async updateNode(
    nodeId: string,
    updates: {
      x?: number;
      y?: number;
      display_name?: string;
      color_code?: string;
      icon?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<InventoryNode> {
    const response = await api.patch(`${apiVersion}/inventory/nodes/${nodeId}`, updates);
    return response.data.data;
  },

  async updateNodePosition(nodeId: string, x: number, y: number): Promise<void> {
    await api.patch(`${apiVersion}/nodes/${nodeId}/position`, { x, y });
  },

  async deleteNode(nodeId: string): Promise<void> {
    await api.delete(`${apiVersion}/inventory/nodes/${nodeId}`);
  },

  async createEdge(
    shopId: string,
    sourceNodeId: string,
    targetNodeId: string,
    label: string | null,
    data: Record<string, any>
  ): Promise<InventoryNodeEdge> {
    const payload = {
      shop_id: shopId,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      label: label,
      metadata: data,
    };
    const response = await api.post(`${apiVersion}/inventory/edges`, payload);
    return response.data.data;
  },

  async deleteEdge(edgeId: string): Promise<void> {
    await api.delete(`${apiVersion}/inventory/edges/${edgeId}`);
  },
};

export default inventoryService;
