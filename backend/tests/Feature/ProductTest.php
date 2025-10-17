<?php

use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Review;

beforeEach(function () {
    $this->seed();
    $this->vendor = User::factory()->vendor()->create();
    $this->customer = User::factory()->customer()->create();
    $this->shop = Shop::factory()->create(['owner_id' => $this->vendor->id]);
    $this->product = Product::factory()->create(['shop_id' => $this->shop->id]);
});

describe('Product API', function () {
    it('lists all products', function () {
        Product::factory()->count(5)->create();

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'price',
                        'images',
                        'category',
                        'stock',
                        'tags',
                        'shop' => [
                            'id',
                            'name',
                            'owner' => [
                                'id',
                                'name',
                            ]
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);
    });

    it('shows a specific product with reviews', function () {
        Review::factory()->count(3)->create([
            'reviewable_id' => $this->product->id,
            'reviewable_type' => Product::class,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/products/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'price',
                    'images',
                    'category',
                    'stock',
                    'tags',
                    'shop' => [
                        'id',
                        'name',
                        'owner' => [
                            'id',
                            'name',
                        ]
                    ],
                    'reviews' => [
                        '*' => [
                            'id',
                            'rating',
                            'comment',
                            'user' => [
                                'id',
                                'name',
                            ]
                        ]
                    ]
                ]
            ]);
    });

    it('allows shop owners to create products', function () {
        $productData = [
            'name' => 'iPhone 15 Pro',
            'description' => 'Latest iPhone with amazing features',
            'price' => 999.99,
            'category' => 'Electronics',
            'stock' => 10,
            'images' => [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg'
            ],
            'tags' => ['smartphone', 'apple', 'premium']
        ];

        $response = $this->actingAs($this->vendor)
            ->postJson("/api/v1/shops/{$this->shop->id}/products", $productData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'price',
                    'images',
                    'category',
                    'stock',
                    'tags',
                    'shop' => [
                        'id',
                        'name',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'name' => 'iPhone 15 Pro',
            'shop_id' => $this->shop->id,
            'price' => 999.99,
        ]);
    });

    it('prevents non-owners from creating products in shops', function () {
        $otherVendor = User::factory()->vendor()->create();
        
        $productData = [
            'name' => 'Unauthorized Product',
            'description' => 'This should not be created',
            'price' => 100,
            'category' => 'Test',
            'stock' => 5,
        ];

        $response = $this->actingAs($otherVendor)
            ->postJson("/api/v1/shops/{$this->shop->id}/products", $productData);

        $response->assertStatus(403);
    });

    it('allows shop owners to update their products', function () {
        $updateData = [
            'name' => 'Updated Product Name',
            'price' => 199.99,
            'stock' => 25,
        ];

        $response = $this->actingAs($this->vendor)
            ->putJson("/api/v1/products/{$this->product->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Product Name',
                'price' => '199.99',
                'stock' => 25,
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $this->product->id,
            'name' => 'Updated Product Name',
            'price' => 199.99,
        ]);
    });

    it('prevents non-owners from updating products', function () {
        $otherVendor = User::factory()->vendor()->create();
        
        $updateData = [
            'name' => 'Hacked Product Name',
        ];

        $response = $this->actingAs($otherVendor)
            ->putJson("/api/v1/products/{$this->product->id}", $updateData);

        $response->assertStatus(403);
    });

    it('allows shop owners to delete their products', function () {
        $response = $this->actingAs($this->vendor)
            ->deleteJson("/api/v1/products/{$this->product->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('products', [
            'id' => $this->product->id,
        ]);
    });

    it('prevents non-owners from deleting products', function () {
        $otherVendor = User::factory()->vendor()->create();

        $response = $this->actingAs($otherVendor)
            ->deleteJson("/api/v1/products/{$this->product->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for product operations', function () {
        // List products
        $this->getJson('/api/v1/products')
            ->assertStatus(401);

        // Show product
        $this->getJson("/api/v1/products/{$this->product->id}")
            ->assertStatus(401);

        // Create product
        $this->postJson("/api/v1/shops/{$this->shop->id}/products", [])
            ->assertStatus(401);

        // Update product
        $this->putJson("/api/v1/products/{$this->product->id}", [])
            ->assertStatus(401);

        // Delete product
        $this->deleteJson("/api/v1/products/{$this->product->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating product', function () {
        $response = $this->actingAs($this->vendor)
            ->postJson("/api/v1/shops/{$this->shop->id}/products", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'description', 'price', 'category', 'stock']);
    });

    it('validates price format', function () {
        $productData = [
            'name' => 'Test Product',
            'description' => 'Test description',
            'price' => 'invalid_price',
            'category' => 'Test',
            'stock' => 10,
        ];

        $response = $this->actingAs($this->vendor)
            ->postJson("/api/v1/shops/{$this->shop->id}/products", $productData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    });

    it('validates stock is non-negative', function () {
        $productData = [
            'name' => 'Test Product',
            'description' => 'Test description',
            'price' => 99.99,
            'category' => 'Test',
            'stock' => -5,
        ];

        $response = $this->actingAs($this->vendor)
            ->postJson("/api/v1/shops/{$this->shop->id}/products", $productData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock']);
    });

    it('returns 404 for non-existent product', function () {
        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products/999999');

        $response->assertStatus(404);
    });

    it('filters products by category', function () {
        Product::factory()->create(['category' => 'Electronics']);
        Product::factory()->create(['category' => 'Fashion']);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products?category=Electronics');

        $response->assertStatus(200);
        
        $products = $response->json('data');
        foreach ($products as $product) {
            expect($product['category'])->toBe('Electronics');
        }
    });

    it('searches products by name', function () {
        Product::factory()->create(['name' => 'iPhone 15 Pro Max']);
        Product::factory()->create(['name' => 'Samsung Galaxy S24']);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products?search=iPhone');

        $response->assertStatus(200);
        
        $products = $response->json('data');
        expect(collect($products)->pluck('name'))->toContain('iPhone 15 Pro Max');
    });

    it('filters products by price range', function () {
        Product::factory()->create(['name' => 'Cheap Product', 'price' => 10.00]);
        Product::factory()->create(['name' => 'Expensive Product', 'price' => 1000.00]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products?min_price=50&max_price=500');

        $response->assertStatus(200);
        
        $products = $response->json('data');
        foreach ($products as $product) {
            expect((float) $product['price'])->toBeGreaterThanOrEqual(50);
            expect((float) $product['price'])->toBeLessThanOrEqual(500);
        }
    });

    it('sorts products by price', function () {
        Product::factory()->create(['name' => 'Product A', 'price' => 100.00]);
        Product::factory()->create(['name' => 'Product B', 'price' => 50.00]);
        Product::factory()->create(['name' => 'Product C', 'price' => 200.00]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products?sort=price&order=asc');

        $response->assertStatus(200);
        
        $products = $response->json('data');
        $prices = collect($products)->pluck('price')->map(fn($price) => (float) $price);
        
        expect($prices->toArray())->toBe($prices->sort()->values()->toArray());
    });

    it('shows only in-stock products when filtered', function () {
        Product::factory()->create(['name' => 'In Stock Product', 'stock' => 10]);
        Product::factory()->create(['name' => 'Out of Stock Product', 'stock' => 0]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products?in_stock=true');

        $response->assertStatus(200);
        
        $products = $response->json('data');
        foreach ($products as $product) {
            expect($product['stock'])->toBeGreaterThan(0);
        }
    });

    it('paginates products list', function () {
        Product::factory()->count(25)->create();

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/products');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });
});
