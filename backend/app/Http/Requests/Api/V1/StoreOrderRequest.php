<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'shop_id' => 'required|ulid|exists:shops,id',
            'delivery_address' => 'required|string|max:255',
            'delivery_lat' => 'required|numeric|between:-90,90',
            'delivery_lng' => 'required|numeric|between:-180,180',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|ulid|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.base_price' => 'nullable|numeric|min:0',
            'items.*.add_ons' => 'nullable|array',
            'items.*.add_ons.*.product_id' => 'required_with:items.*.add_ons|ulid|exists:products,id',
            'items.*.add_ons.*.quantity' => 'required_with:items.*.add_ons|integer|min:1',
            'items.*.add_ons.*.original_price' => 'required_with:items.*.add_ons|numeric|min:0',
            'items.*.add_ons.*.discounted_price' => 'required_with:items.*.add_ons|numeric|min:0',
        ];
    }
}
