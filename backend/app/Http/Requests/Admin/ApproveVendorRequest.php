<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ApproveVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $admin = Auth::guard('admin')->user();
        return $admin && ($admin->hasPermission('vendor.approve') || $admin->hasRole('super_admin'));
    }

    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
