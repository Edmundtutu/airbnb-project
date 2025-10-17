<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\V1\OrderItemResource;
use App\Http\Resources\Api\V1\UserResource;

/**
 * @deprecated Use BookingResource instead
 */
class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'shop_id' => $this->shop_id,
            'total' => $this->total,
            'status' => $this->status,
            'delivery_address' => $this->delivery_address,
            'delivery_lat' => $this->delivery_lat,
            'delivery_lng' => $this->delivery_lng,
            'notes' => $this->notes,
            'user' => $this->when(str_contains($request->route()->uri(), 'vendor/orders'), new UserResource($this->whenLoaded('user'))),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
