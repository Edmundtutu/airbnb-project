<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                $commentableType = $this->faker->randomElement([
            Post::class,
            Product::class,
        ]);

        $commentable = $commentableType::inRandomOrder()->first();

        return [
            'user_id' => User::inRandomOrder()->first()->id,
            'body' => $this->faker->paragraph(),
            'commentable_id' => $commentable->id,
            'commentable_type' => $commentableType,
        ];
    }
}
