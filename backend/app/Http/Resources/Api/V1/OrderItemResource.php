<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use App\Http\Resources\Api\V1\ProductResource;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @deprecated Use BookingDetailResource instead
 */
class OrderItemResource extends JsonResource
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
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'price' => $this->price,
            'product' => $this->whenLoaded('product', new ProductResource($this->product)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
