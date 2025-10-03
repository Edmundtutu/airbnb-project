<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                // Reviews can be for listings or properties (polymorphic)
        $reviewableType = $this->faker->randomElement([
            Listing::class,
            Property::class,
        ]);

        $reviewable = $reviewableType::inRandomOrder()->first();

        return [
            'user_id' => User::inRandomOrder()->first()->id,
            'reviewable_id' => $reviewable->id,
            'reviewable_type' => $reviewableType,
            'rating' => $this->faker->numberBetween(1, 5),
            'comment' => $this->faker->paragraph(),
        ];
    }
}
