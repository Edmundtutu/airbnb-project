<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class SuspendVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $admin = Auth::guard('admin')->user();
        return $admin && ($admin->hasPermission('vendor.suspend') || $admin->hasRole('super_admin'));
    }

    public function rules(): array
    {
        return [
            'reason' => 'required|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'A suspension reason is required.',
            'reason.max' => 'The suspension reason cannot exceed 1000 characters.',
        ];
    }
}
