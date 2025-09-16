<?php

namespace App\Http\Controllers\Api\V1\ShopHandlers\Inventory;

use App\Events\EdgeCreated;
use App\Events\EdgeDeleted;
use App\Events\NodeCreated;
use App\Events\NodeDeleted;
use App\Events\NodeUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\InventoryNodeEdgeResource;
use App\Http\Resources\Api\V1\InventoryNodeResource;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function getGraph($shopId)
    {
        $nodes = InventoryNode::where('shop_id', $shopId)->get();
        $edges = InventoryNodeEdge::with(['sourceNode', 'targetNode'])
            ->where('shop_id', $shopId)
            ->get();

        return response()->json([
            'nodes' => InventoryNodeResource::collection($nodes),
            'edges' => InventoryNodeEdgeResource::collection($edges)
        ]);
    }

    public function storeNode(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|ulid|exists:shops,id',
            'entity_type' => 'required|in:category,product,modification,addon',
            'entity_id' => 'nullable|ulid',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'display_name' => 'nullable|string|max:120',
            'color_code' => 'nullable|string|max:16',
            'icon' => 'nullable|string|max:64',
            'metadata' => 'nullable|array',
        ]);

        // Authorize shop ownership
        $shop = Shop::findOrFail($validated['shop_id']);
        $this->authorize('update', $shop);

        $node = InventoryNode::create($validated);
        event(new NodeCreated($node));

        return new InventoryNodeResource($node);
    }

    public function updateNode(Request $request, InventoryNode $node)
    {
        $this->authorize('update', $node);

        $validated = $request->validate([
            'x' => 'sometimes|required|integer',
            'y' => 'sometimes|required|integer',
            'display_name' => 'sometimes|nullable|string|max:120',
            'color_code' => 'sometimes|nullable|string|max:16',
            'icon' => 'sometimes|nullable|string|max:64',
            'metadata' => 'sometimes|nullable|array',
        ]);

        $node->update($validated);
        event(new NodeUpdated($node));

        return new InventoryNodeResource($node);
    }

    public function destroyNode(InventoryNode $node)
    {
        $this->authorize('delete', $node);

        $shopId = $node->shop_id;
        $nodeId = $node->id;

        DB::transaction(function () use ($node) {
            $node->sourceEdges()->delete();
            $node->targetEdges()->delete();
            $node->delete();
        });

        event(new NodeDeleted($nodeId, $shopId));

        return response()->json(['message' => 'Node and associated edges deleted']);
    }

    public function storeEdge(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|ulid|exists:shops,id',
            'source_node_id' => 'required|ulid|exists:inventory_nodes,id',
            'target_node_id' => 'required|ulid|exists:inventory_nodes,id',
            'label' => 'nullable|string|max:50',
            'metadata' => 'nullable|array',
        ]);

        // Ensure source_node_id !== target_node_id
        if ($validated['source_node_id'] === $validated['target_node_id']) {
            return response()->json(['message' => 'Source and target nodes cannot be the same.'], 422);
        }

        // Authorize shop ownership
        $shop = Shop::findOrFail($validated['shop_id']);
        $this->authorize('update', $shop);

        // Ensure source and target nodes belong to the same shop
        $sourceShopId = InventoryNode::where('id', $validated['source_node_id'])->value('shop_id');
        $targetShopId = InventoryNode::where('id', $validated['target_node_id'])->value('shop_id');
        if ($sourceShopId !== $validated['shop_id'] || $targetShopId !== $validated['shop_id']) {
            return response()->json(['message' => 'Source and target nodes must belong to the same shop.'], 422);
        }

        $edge = InventoryNodeEdge::create($validated);
        event(new EdgeCreated($edge));

        return new InventoryNodeEdgeResource($edge);
    }

    public function destroyEdge(InventoryNodeEdge $edge)
    {
        $this->authorize('delete', $edge);

        $shopId = $edge->shop_id;
        $edgeId = $edge->id;

        $edge->delete();

        event(new EdgeDeleted($edgeId, $shopId));

        return response()->json(['message' => 'Edge deleted']);
    }

    public function updateNodePosition(Request $request, InventoryNode $node)
    {
        $this->authorize('update', $node);

        $validated = $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer'
        ]);

        $node->update($validated);
        event(new \App\Events\NodePositionUpdated($node));

        return response()->json(['message' => 'Position updated']);
    }
}
