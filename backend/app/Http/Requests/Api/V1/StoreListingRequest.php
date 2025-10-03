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
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_per_night' => 'required|numeric|min:0',
            'images' => 'nullable|array',
            'images.*' => 'string|max:255',
            'room_type' => 'required|string|in:Entire place,Private room,Shared room',
            'bedrooms' => 'required|integer|min:0|max:20',
            'bathrooms' => 'required|integer|min:0|max:20',
            'max_guests' => 'required|integer|min:1|max:50',
            'beds' => 'required|integer|min:1|max:20',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'available' => 'boolean',
        ];
    }
}
