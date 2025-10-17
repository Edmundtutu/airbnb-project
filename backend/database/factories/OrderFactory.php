<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        $deliveryTypes = ['pickup', 'delivery', 'express'];
        
        $total = $this->faker->randomFloat(2, 20, 500);
        
        return [
            'user_id' => User::factory()->customer(),
            'shop_id' => Shop::factory(),
            'total' => $total,
            'status' => $this->faker->randomElement($statuses),
            'delivery_type' => $this->faker->randomElement($deliveryTypes),
            'delivery_address' => $this->faker->address(),
            'notes' => $this->faker->optional(0.3)->sentence(), // 30% chance of having notes
        ];
    }
}
