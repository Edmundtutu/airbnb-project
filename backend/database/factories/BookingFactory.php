<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
        
        $checkIn = $this->faker->dateTimeBetween('now', '+30 days');
        $checkOut = $this->faker->dateTimeBetween($checkIn->format('Y-m-d') . ' +1 day', $checkIn->format('Y-m-d') . ' +7 days');
        
        $nights = $checkIn->diff($checkOut)->days;
        $pricePerNight = $this->faker->randomFloat(2, 25, 500);
        $total = $nights * $pricePerNight;
        
        return [
            'guest_id' => User::factory()->guest(),
            'property_id' => Property::factory(),
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guests' => $this->faker->numberBetween(1, 8),
            'nights' => $nights,
            'price_per_night' => $pricePerNight,
            'total_price' => $total,
            'cleaning_fee' => $this->faker->randomFloat(2, 0, 50),
            'service_fee' => $this->faker->randomFloat(2, 0, 30),
            'status' => $this->faker->randomElement($statuses),
            'special_requests' => $this->faker->optional(0.3)->sentence(), // 30% chance of having special requests
        ];
    }
}
