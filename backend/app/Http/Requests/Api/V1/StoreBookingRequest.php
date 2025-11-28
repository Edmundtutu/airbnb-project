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
            'check_in_date' => 'required|date|after:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'guest_count' => 'required|integer|min:1|max:50',
            'notes' => 'nullable|string|max:500',
            'details' => 'required|array|min:1',
            'details.*.listing_id' => 'required|ulid|exists:listings,id',
            'details.*.nights' => 'required|integer|min:1',
            'details.*.price_per_night' => 'nullable|numeric|min:0',
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
            'check_in_date.after' => 'Check-in date must be in the future.',
            'check_out_date.after' => 'Check-out date must be after check-in date.',
            'guest_count.min' => 'At least 1 guest is required.',
            'guest_count.max' => 'Maximum 50 guests allowed.',
            'details.required' => 'At least one listing is required for a booking.',
            'details.*.listing_id.exists' => 'One of the listings could not be found.',
            'details.*.nights.min' => 'Each listing must be booked for at least one night.',
        ];
    }
}
