<?php

namespace Database\Factories;

use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Listing>
 */
class ListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roomTypes = [
            'Entire place',
            'Private room',
            'Shared room'
        ];

        $images = [];
        $imageCount = $this->faker->numberBetween(3, 8);

        // Absolute path to the storage folder
        $imageFolder = storage_path('app/public/property-images');

        // Get all image files in that folder
        $availableImages = glob($imageFolder . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);

        // If no images found, fallback to empty array to avoid errors
        if (!empty($availableImages)) {
            for ($i = 0; $i < $imageCount; $i++) {
                // Pick random file
                $randomImage = $this->faker->randomElement($availableImages);

                // Convert absolute path to a storage-relative URL or path
                $images[] = 'storage/property-images/' . basename($randomImage);
            }
        }
        


        $tags = $this->faker->randomElements([
            'popular',
            'new',
            'featured',
            'luxury',
            'budget-friendly',
            'family-friendly',
            'pet-friendly',
            'business-travel',
            'romantic',
            'cozy'
        ], $this->faker->numberBetween(1, 4));

        return [
            'property_id' => Property::factory(),
            'name' => $this->faker->words(3, true) . ' ' . $this->faker->randomElement(['Apartment', 'House', 'Villa', 'Condo']),
            'description' => $this->faker->realText(300),
            'price_per_night' => $this->faker->randomFloat(2, 25, 500),
            'images' => $images,
            'category' => $this->faker->randomElement($roomTypes),
            'bedrooms' => $this->faker->numberBetween(1, 6),
            'bathrooms' => $this->faker->numberBetween(1, 4),
            'max_guests' => $this->faker->numberBetween(1, 12),
            'tags' => $tags,
            'is_active' => $this->faker->boolean(85), // 85% chance of being active
        ];
    }
}
