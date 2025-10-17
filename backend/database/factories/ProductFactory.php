<?php

namespace Database\Factories;

use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
                $categories = [
            'Electronics' => ['Smartphone', 'Laptop', 'Headphones', 'Camera', 'Tablet'],
            'Fashion' => ['T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Handbag'],
            'Home & Garden' => ['Sofa', 'Coffee Table', 'Plant Pot', 'Lamp', 'Rug'],
            'Beauty' => ['Lipstick', 'Foundation', 'Perfume', 'Skincare Set', 'Hair Product'],
            'Sports' => ['Running Shoes', 'Yoga Mat', 'Dumbbells', 'Sports Jersey', 'Water Bottle'],
            'Books' => ['Novel', 'Cookbook', 'Self-Help Book', 'Children\'s Book', 'Magazine']
        ];

        $category = $this->faker->randomElement(array_keys($categories));
        $productType = $this->faker->randomElement($categories[$category]);
        
        // Price ranges based on category
        $priceRanges = [
            'Electronics' => [50, 2000],
            'Fashion' => [15, 300],
            'Home & Garden' => [25, 800],
            'Beauty' => [10, 150],
            'Sports' => [20, 500],
            'Books' => [5, 50]
        ];

        $priceRange = $priceRanges[$category];
        $images = [];
        $imageCount = $this->faker->numberBetween(1, 3);
        for ($i = 0; $i < $imageCount; $i++) {
            $images[] = 'https://picsum.photos/seed/' . $this->faker->uuid . '/400/400';
        }

        $tags = $this->faker->randomElements([
            'popular', 'new', 'sale', 'featured', 'bestseller', 
            'eco-friendly', 'handmade', 'premium', 'limited-edition'
        ], $this->faker->numberBetween(1, 4));

        return [
            'shop_id' => Shop::factory(),
            'name' => $productType . ' - ' . $this->faker->words(2, true),
            'description' => $this->faker->realText(300),
            'price' => $this->faker->randomFloat(2, $priceRange[0], $priceRange[1]),
            'images' => $images,
            'category' => $category,
            'stock' => $this->faker->numberBetween(0, 50),
            'tags' => $tags,
        ];
    }
}
