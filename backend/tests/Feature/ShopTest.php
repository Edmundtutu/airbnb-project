<?php

use App\Models\User;
use App\Models\Shop;
use App\Models\Product;

beforeEach(function () {
    $this->seed();
    $this->vendor = User::factory()->vendor()->create();
    $this->customer = User::factory()->customer()->create();
    $this->shop = Shop::factory()->create(['owner_id' => $this->vendor->id]);
});

describe('Shop API', function () {
    it('lists all shops', function () {
        Shop::factory()->count(5)->create();

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/shops');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'address',
                        'lat',
                        'lng',
                        'avatar',
                        'cover_image',
                        'phone',
                        'hours',
                        'verified',
                        'owner' => [
                            'id',
                            'name',
                            'email',
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);
    });

    it('shows a specific shop with products', function () {
        Product::factory()->count(3)->create(['shop_id' => $this->shop->id]);

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/shops/{$this->shop->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'address',
                    'lat',
                    'lng',
                    'avatar',
                    'cover_image',
                    'phone',
                    'hours',
                    'verified',
                    'owner' => [
                        'id',
                        'name',
                        'email',
                    ],
                    'products' => [
                        '*' => [
                            'id',
                            'name',
                            'description',
                            'price',
                            'images',
                            'category',
                            'stock',
                            'tags',
                        ]
                    ]
                ]
            ]);
    });

    it('allows vendors to create shops', function () {
        $shopData = [
            'name' => 'Test Electronics Store',
            'description' => 'A great electronics store',
            'address' => '123 Test Street, Nairobi',
            'lat' => -1.2921,
            'lng' => 36.8219,
            'phone' => '+254700123456',
            'hours' => [
                'monday' => ['open' => '08:00', 'close' => '18:00'],
                'tuesday' => ['open' => '08:00', 'close' => '18:00'],
            ]
        ];

        $response = $this->actingAs($this->vendor)
            ->postJson('/api/v1/shops', $shopData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'address',
                    'lat',
                    'lng',
                    'phone',
                    'hours',
                    'verified',
                    'owner' => [
                        'id',
                        'name',
                        'email',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('shops', [
            'name' => 'Test Electronics Store',
            'owner_id' => $this->vendor->id,
        ]);
    });

    it('prevents customers from creating shops', function () {
        $shopData = [
            'name' => 'Test Shop',
            'description' => 'A test shop',
            'address' => '123 Test Street',
        ];

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/shops', $shopData);

        $response->assertStatus(403);
    });

    it('allows shop owners to update their shops', function () {
        $updateData = [
            'name' => 'Updated Shop Name',
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($this->vendor)
            ->putJson("/api/v1/shops/{$this->shop->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Shop Name',
                'description' => 'Updated description',
            ]);

        $this->assertDatabaseHas('shops', [
            'id' => $this->shop->id,
            'name' => 'Updated Shop Name',
        ]);
    });

    it('prevents non-owners from updating shops', function () {
        $otherVendor = User::factory()->vendor()->create();
        
        $updateData = [
            'name' => 'Hacked Shop Name',
        ];

        $response = $this->actingAs($otherVendor)
            ->putJson("/api/v1/shops/{$this->shop->id}", $updateData);

        $response->assertStatus(403);
    });

    it('allows shop owners to delete their shops', function () {
        $response = $this->actingAs($this->vendor)
            ->deleteJson("/api/v1/shops/{$this->shop->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('shops', [
            'id' => $this->shop->id,
        ]);
    });

    it('prevents non-owners from deleting shops', function () {
        $otherVendor = User::factory()->vendor()->create();

        $response = $this->actingAs($otherVendor)
            ->deleteJson("/api/v1/shops/{$this->shop->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for shop operations', function () {
        // Create shop
        $this->postJson('/api/v1/shops', [])
            ->assertStatus(401);

        // Update shop
        $this->putJson("/api/v1/shops/{$this->shop->id}", [])
            ->assertStatus(401);

        // Delete shop
        $this->deleteJson("/api/v1/shops/{$this->shop->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating shop', function () {
        $response = $this->actingAs($this->vendor)
            ->postJson('/api/v1/shops', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'description', 'address', 'lat', 'lng']);
    });

    it('validates coordinates format', function () {
        $shopData = [
            'name' => 'Test Shop',
            'description' => 'Test description',
            'address' => 'Test address',
            'lat' => 'invalid',
            'lng' => 'invalid',
        ];

        $response = $this->actingAs($this->vendor)
            ->postJson('/api/v1/shops', $shopData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng']);
    });

    it('returns 404 for non-existent shop', function () {
        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/shops/999999');

        $response->assertStatus(404);
    });

    it('paginates shops list', function () {
        Shop::factory()->count(25)->create();

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/shops');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });

    it('filters shops by location', function () {
        // Create shops in different locations
        Shop::factory()->create([
            'name' => 'Nairobi Shop',
            'lat' => -1.2921,
            'lng' => 36.8219,
        ]);

        Shop::factory()->create([
            'name' => 'Mombasa Shop',
            'lat' => -4.0435,
            'lng' => 39.6682,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/shops?lat=-1.2921&lng=36.8219&radius=50');

        $response->assertStatus(200);
        
        // Should return shops within 50km of Nairobi
        $shops = $response->json('data');
        expect(collect($shops)->pluck('name'))->toContain('Nairobi Shop');
    });

    it('searches shops by name', function () {
        Shop::factory()->create(['name' => 'Electronics Paradise']);
        Shop::factory()->create(['name' => 'Fashion Hub']);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/shops?search=Electronics');

        $response->assertStatus(200);
        
        $shops = $response->json('data');
        expect(collect($shops)->pluck('name'))->toContain('Electronics Paradise');
        expect(collect($shops)->pluck('name'))->not->toContain('Fashion Hub');
    });
});
