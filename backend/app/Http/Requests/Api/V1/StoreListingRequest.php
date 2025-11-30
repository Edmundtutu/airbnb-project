<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreListingRequest extends FormRequest
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
            'property_id' => 'required|ulid|exists:properties,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string|min:20',
            'price_per_night' => 'required|numeric|min:10',
            'category' => 'required|string|max:50',
            'max_guests' => 'required|integer|min:1|max:50',
            'bedrooms' => 'nullable|integer|min:0|max:20',
            'bathrooms' => 'nullable|numeric|min:0|max:20',
            'images' => 'nullable|array',
            'images.*' => 'string|url|max:500',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string|max:100',
            'house_rules' => 'nullable|array',
            'house_rules.*' => 'string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'instant_book' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ];
    }
}
