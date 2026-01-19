<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ReviewKYCRequest extends FormRequest
{
    public function authorize(): bool
    {
        $admin = Auth::guard('admin')->user();
        $action = $this->route()->getActionMethod();
        
        if ($action === 'approve') {
            return $admin && ($admin->hasPermission('kyc.approve') || $admin->hasRole('super_admin'));
        }
        
        if ($action === 'reject') {
            return $admin && ($admin->hasPermission('kyc.reject') || $admin->hasRole('super_admin'));
        }
        
        return false;
    }

    public function rules(): array
    {
        $action = $this->route()->getActionMethod();
        
        if ($action === 'approve') {
            return [
                'notes' => 'nullable|string|max:1000',
            ];
        }
        
        if ($action === 'reject') {
            return [
                'notes' => 'required|string|max:1000',
            ];
        }
        
        return [];
    }

    public function messages(): array
    {
        return [
            'notes.required' => 'Review notes are required when rejecting a KYC submission.',
            'notes.max' => 'Review notes cannot exceed 1000 characters.',
        ];
    }
}
