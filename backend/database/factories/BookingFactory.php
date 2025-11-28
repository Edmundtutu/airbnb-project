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
        $statuses = ['pending', 'processing', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'rejected'];

        $checkIn = $this->faker->dateTimeBetween('now', '+30 days');
        $checkOut = $this->faker->dateTimeBetween($checkIn->format('Y-m-d') . ' +1 day', $checkIn->format('Y-m-d') . ' +7 days');

        $nights = max(1, $checkIn->diff($checkOut)->days);
        $pricePerNight = $this->faker->randomFloat(2, 25, 500);
        $total = $nights * $pricePerNight;

        return [
            'guest_id' => User::factory()->guest(),
            'property_id' => Property::factory(),
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
            'guest_count' => $this->faker->numberBetween(1, 8),
            'notes' => $this->faker->optional(0.2)->sentence(),
            'total' => $total,
            'status' => $this->faker->randomElement($statuses),
        ];
    }
}
