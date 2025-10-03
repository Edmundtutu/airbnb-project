<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => fake()->randomElement(['guest', 'host']),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'lat' => fake()->latitude(-1.5, 1.5), // Kenya/East Africa region
            'lng' => fake()->longitude(36, 42), // Kenya/East Africa region
            'avatar' => fake()->imageUrl(200, 200, 'people'),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Create a host user who will own properties.
     */
    public function host(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'host',
        ]);
    }

    /**
     * Create a guest user who will make bookings.
     */
    public function guest(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'guest',
        ]);
    }

    /**
     * Legacy method for backward compatibility.
     * @deprecated Use host() instead
     */
    public function vendor(): static
    {
        return $this->host();
    }

    /**
     * Legacy method for backward compatibility.
     * @deprecated Use guest() instead
     */
    public function customer(): static
    {
        return $this->guest();
    }
}
