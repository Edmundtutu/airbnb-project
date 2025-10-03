<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Follow>
 */
class FollowFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                $user = User::inRandomOrder()->first();
        
        // Users can follow other users or properties
        $followableType = $this->faker->randomElement([
            User::class,
            Property::class,
        ]);

        $followable = $followableType::inRandomOrder()->first();
        
        // Ensure a user cannot follow themselves
        if ($followableType === User::class && $user->id === $followable->id) {
            $followable = User::where('id', '!=', $user->id)->inRandomOrder()->first();
        }

        return [
            'user_id' => $user->id,
            'followable_id' => $followable->id,
            'followable_type' => $followableType,
        ];
    }
}
