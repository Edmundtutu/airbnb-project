<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateListingRequest extends FormRequest
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
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price_per_night' => 'sometimes|numeric|min:0',
            'images' => 'nullable|array',
            'images.*' => 'string|max:255',
            'room_type' => 'sometimes|string|in:Entire place,Private room,Shared room',
            'bedrooms' => 'sometimes|integer|min:0|max:20',
            'bathrooms' => 'sometimes|integer|min:0|max:20',
            'max_guests' => 'sometimes|integer|min:1|max:50',
            'beds' => 'sometimes|integer|min:1|max:20',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'available' => 'boolean',
        ];
    }
}
