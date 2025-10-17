<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shop>
 */
class ShopFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                $businessTypes = [
            'Electronics Store', 'Fashion Boutique', 'Home & Garden', 'Beauty Salon',
            'Restaurant', 'Grocery Store', 'Bookstore', 'Jewelry Shop',
            'Sports Equipment', 'Pet Store', 'Pharmacy', 'Coffee Shop'
        ];

        $businessHours = [
            'monday' => ['open' => '08:00', 'close' => '18:00'],
            'tuesday' => ['open' => '08:00', 'close' => '18:00'],
            'wednesday' => ['open' => '08:00', 'close' => '18:00'],
            'thursday' => ['open' => '08:00', 'close' => '18:00'],
            'friday' => ['open' => '08:00', 'close' => '20:00'],
            'saturday' => ['open' => '09:00', 'close' => '20:00'],
            'sunday' => ['open' => '10:00', 'close' => '16:00'],
        ];

        $baseLat = -0.6152; // Mbarara University
        $baseLng = 30.6586;
    
        // Distance in km between 5 and 10
        $distanceKm = $this->faker->randomFloat(3, 5, 10);
    
        // Random bearing (direction) in radians
        $bearing = deg2rad($this->faker->numberBetween(0, 359));
    
        // Earth radius in km
        $earthRadius = 6371;
    
        // Calculate new lat/lng
        $newLat = asin(
            sin(deg2rad($baseLat)) * cos($distanceKm / $earthRadius) +
            cos(deg2rad($baseLat)) * sin($distanceKm / $earthRadius) * cos($bearing)
        );
    
        $newLng = deg2rad($baseLng) + atan2(
            sin($bearing) * sin($distanceKm / $earthRadius) * cos(deg2rad($baseLat)),
            cos($distanceKm / $earthRadius) - sin(deg2rad($baseLat)) * sin($newLat)
        );

        return [
            'owner_id' => User::factory()->vendor(),
            'name' => $this->faker->randomElement($businessTypes) . ' - ' . $this->faker->lastName(),
            'description' => $this->faker->realText(200),
            'address' => $this->faker->address(),
            'lat' => rad2deg($newLat),
            'lng' => rad2deg($newLng),
            'avatar' => 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400',
            'cover_image' => 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400',
            'phone' => $this->faker->phoneNumber(),
            'hours' => $businessHours,
            'category' => $this->faker->randomElement($businessTypes),
            'verified' => $this->faker->boolean(30), // 30% chance of being verified
        ];
    }
}
