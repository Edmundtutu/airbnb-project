<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'address' => 'sometimes|string|max:255',
            'lat' => 'sometimes|numeric|between:-90,90',
            'lng' => 'sometimes|numeric|between:-180,180',
            'avatar' => 'nullable|string|max:255',
            'cover_image' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'property_type' => 'sometimes|string|max:100',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string|max:100',
        ];
    }
}
