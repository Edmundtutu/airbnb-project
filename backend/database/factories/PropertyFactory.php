<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Property>
 */
class PropertyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $propertyTypes = [
            'Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Studio',
            'Loft', 'Cottage', 'Cabin', 'Mansion', 'Penthouse', 'Duplex'
        ];

        $amenities = [
            'WiFi', 'Kitchen', 'Parking', 'Pool', 'Gym', 'Hot Tub',
            'Air Conditioning', 'Heating', 'Washer', 'Dryer', 'TV',
            'Balcony', 'Garden', 'Fireplace', 'Pet Friendly', 'Smoking Allowed'
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
            'host_id' => User::factory()->host(),
            'name' => $this->faker->randomElement($propertyTypes) . ' - ' . $this->faker->lastName(),
            'description' => $this->faker->realText(200),
            'address' => $this->faker->address(),
            'lat' => rad2deg($newLat),
            'lng' => rad2deg($newLng),
            'avatar' => 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400',
            'cover_image' => 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400',
            'phone' => $this->faker->phoneNumber(),
            'category' => $this->faker->randomElement($propertyTypes),
            'verified' => $this->faker->boolean(30), // 30% chance of being verified
        ];
    }
}
