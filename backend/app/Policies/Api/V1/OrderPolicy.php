<?php

namespace App\Policies\Api\V1;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        // Vendors: can view their shop's orders
        // Customers: can view their own orders
        return $user->isVendor() || $user->isCustomer();
    }

    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->user_id   // customer sees own order
            || ($user->isVendor() && $user->id === $order->shop->user_id); // vendor sees shop order
    }

    public function create(User $user): bool
    {
        // Only customers can create new orders
        return $user->isCustomer();
    }

    public function update(User $user, Order $order): bool
    {
        // Vendors can update their shop’s orders
        return $user->isVendor() && $user->id === $order->shop->user_id;
    }

    public function delete(User $user, Order $order): bool
    {
        // Customers can cancel their own order if still pending
        return $user->isCustomer()
            && $user->id === $order->user_id
            && $order->status === 'pending';
    }

    public function restore(User $user, Order $order): bool
    {
        return false;
    }

    public function forceDelete(User $user, Order $order): bool
    {
        return false;
    }

    public function confirm(User $user, Order $order): bool
    {
        // Vendor confirms only pending orders
        return $user->isVendor()
            && $order->status === 'pending';
    }
}
