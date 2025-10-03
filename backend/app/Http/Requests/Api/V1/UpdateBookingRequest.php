<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
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
            'check_in' => 'sometimes|date|after:today',
            'check_out' => 'sometimes|date|after:check_in',
            'guests' => 'sometimes|integer|min:1|max:50',
            'status' => 'sometimes|string|in:pending,confirmed,checked_in,checked_out,cancelled',
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
            'status.in' => 'Status must be one of: pending, confirmed, checked_in, checked_out, cancelled.',
        ];
    }
}
