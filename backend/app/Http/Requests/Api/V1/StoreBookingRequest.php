<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
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
            'check_in' => 'required|date|after:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'required|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'check_in.after' => 'Check-in date must be in the future.',
            'check_out.after' => 'Check-out date must be after check-in date.',
            'guests.min' => 'At least 1 guest is required.',
            'guests.max' => 'Maximum 50 guests allowed.',
        ];
    }
}
