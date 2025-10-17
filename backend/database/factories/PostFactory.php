<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $images = []; 

        if ($this->faker->boolean(60)) { // 40% chance of having images
            $imageCount = $this->faker->numberBetween(1, 3);

            for ($i = 0; $i < $imageCount; $i++) {
                // Use random images from Lorem Picsum
                $images[] = 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400';
            }
        }

        return [
            'user_id' => User::factory(),
            'content' => $this->faker->realText(300),
            'images' => $images,
            'product_id' => $this->faker->optional(0.3)->passthrough(null), // Will be set in seeder if needed
            'shop_id' => $this->faker->optional(0.2)->passthrough(null), // Will be set in seeder if needed
        ];
    }
}
