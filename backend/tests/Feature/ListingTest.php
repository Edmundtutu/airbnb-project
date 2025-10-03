<?php

use App\Models\User;
use App\Models\Property;
use App\Models\Listing;
use App\Models\Review;

beforeEach(function () {
    $this->seed();
    $this->host = User::factory()->host()->create();
    $this->guest = User::factory()->guest()->create();
    $this->property = Property::factory()->create(['host_id' => $this->host->id]);
    $this->listing = Listing::factory()->create(['property_id' => $this->property->id]);
});

describe('Listing API', function () {
    it('lists all listings', function () {
        Listing::factory()->count(5)->create();

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'price_per_night',
                        'images',
                        'room_type',
                        'bedrooms',
                        'bathrooms',
                        'max_guests',
                        'beds',
                        'tags',
                        'property' => [
                            'id',
                            'name',
                            'host' => [
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

    it('shows a specific listing with reviews', function () {
        Review::factory()->count(3)->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/listings/{$this->listing->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'price_per_night',
                    'images',
                    'room_type',
                    'bedrooms',
                    'bathrooms',
                    'max_guests',
                    'beds',
                    'tags',
                    'property' => [
                        'id',
                        'name',
                        'host' => [
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

    it('allows property owners to create listings', function () {
        $listingData = [
            'title' => 'Luxury Beachfront Villa',
            'description' => 'Stunning villa with private beach access',
            'price_per_night' => 299.99,
            'room_type' => 'Entire place',
            'bedrooms' => 4,
            'bathrooms' => 3,
            'max_guests' => 8,
            'beds' => 4,
            'images' => [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg'
            ],
            'tags' => ['luxury', 'beachfront', 'villa']
        ];

        $response = $this->actingAs($this->host)
            ->postJson("/api/v1/properties/{$this->property->id}/listings", $listingData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'price_per_night',
                    'images',
                    'room_type',
                    'bedrooms',
                    'bathrooms',
                    'max_guests',
                    'beds',
                    'tags',
                    'property' => [
                        'id',
                        'name',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('listings', [
            'title' => 'Luxury Beachfront Villa',
            'property_id' => $this->property->id,
            'price_per_night' => 299.99,
        ]);
    });

    it('prevents non-owners from creating listings in properties', function () {
        $otherHost = User::factory()->host()->create();
        
        $listingData = [
            'title' => 'Unauthorized Listing',
            'description' => 'This should not be created',
            'price_per_night' => 100,
            'room_type' => 'Entire place',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'max_guests' => 4,
            'beds' => 2,
        ];

        $response = $this->actingAs($otherHost)
            ->postJson("/api/v1/properties/{$this->property->id}/listings", $listingData);

        $response->assertStatus(403);
    });

    it('allows property owners to update their listings', function () {
        $updateData = [
            'title' => 'Updated Listing Title',
            'price_per_night' => 199.99,
            'max_guests' => 6,
        ];

        $response = $this->actingAs($this->host)
            ->putJson("/api/v1/listings/{$this->listing->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'title' => 'Updated Listing Title',
                'price_per_night' => '199.99',
                'max_guests' => 6,
            ]);

        $this->assertDatabaseHas('listings', [
            'id' => $this->listing->id,
            'title' => 'Updated Listing Title',
            'price_per_night' => 199.99,
        ]);
    });

    it('prevents non-owners from updating listings', function () {
        $otherHost = User::factory()->host()->create();
        
        $updateData = [
            'title' => 'Hacked Listing Title',
        ];

        $response = $this->actingAs($otherHost)
            ->putJson("/api/v1/listings/{$this->listing->id}", $updateData);

        $response->assertStatus(403);
    });

    it('allows property owners to delete their listings', function () {
        $response = $this->actingAs($this->host)
            ->deleteJson("/api/v1/listings/{$this->listing->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('listings', [
            'id' => $this->listing->id,
        ]);
    });

    it('prevents non-owners from deleting listings', function () {
        $otherHost = User::factory()->host()->create();

        $response = $this->actingAs($otherHost)
            ->deleteJson("/api/v1/listings/{$this->listing->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for listing operations', function () {
        // List listings
        $this->getJson('/api/v1/listings')
            ->assertStatus(401);

        // Show listing
        $this->getJson("/api/v1/listings/{$this->listing->id}")
            ->assertStatus(401);

        // Create listing
        $this->postJson("/api/v1/properties/{$this->property->id}/listings", [])
            ->assertStatus(401);

        // Update listing
        $this->putJson("/api/v1/listings/{$this->listing->id}", [])
            ->assertStatus(401);

        // Delete listing
        $this->deleteJson("/api/v1/listings/{$this->listing->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating listing', function () {
        $response = $this->actingAs($this->host)
            ->postJson("/api/v1/properties/{$this->property->id}/listings", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'price_per_night', 'room_type', 'bedrooms', 'bathrooms', 'max_guests', 'beds']);
    });

    it('validates price format', function () {
        $listingData = [
            'title' => 'Test Listing',
            'description' => 'Test description',
            'price_per_night' => 'invalid_price',
            'room_type' => 'Entire place',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'max_guests' => 4,
            'beds' => 2,
        ];

        $response = $this->actingAs($this->host)
            ->postJson("/api/v1/properties/{$this->property->id}/listings", $listingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price_per_night']);
    });

    it('validates room type', function () {
        $listingData = [
            'title' => 'Test Listing',
            'description' => 'Test description',
            'price_per_night' => 99.99,
            'room_type' => 'Invalid Type',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'max_guests' => 4,
            'beds' => 2,
        ];

        $response = $this->actingAs($this->host)
            ->postJson("/api/v1/properties/{$this->property->id}/listings", $listingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['room_type']);
    });

    it('returns 404 for non-existent listing', function () {
        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings/999999');

        $response->assertStatus(404);
    });

    it('filters listings by room type', function () {
        Listing::factory()->create(['room_type' => 'Entire place']);
        Listing::factory()->create(['room_type' => 'Private room']);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings?room_type=Entire place');

        $response->assertStatus(200);
        
        $listings = $response->json('data');
        foreach ($listings as $listing) {
            expect($listing['room_type'])->toBe('Entire place');
        }
    });

    it('searches listings by title', function () {
        Listing::factory()->create(['title' => 'Luxury Beach Villa']);
        Listing::factory()->create(['title' => 'Cozy Mountain Cabin']);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings?search=Luxury');

        $response->assertStatus(200);
        
        $listings = $response->json('data');
        expect(collect($listings)->pluck('title'))->toContain('Luxury Beach Villa');
    });

    it('filters listings by price range', function () {
        Listing::factory()->create(['title' => 'Budget Listing', 'price_per_night' => 50.00]);
        Listing::factory()->create(['title' => 'Luxury Listing', 'price_per_night' => 500.00]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings?min_price=100&max_price=300');

        $response->assertStatus(200);
        
        $listings = $response->json('data');
        foreach ($listings as $listing) {
            expect((float) $listing['price_per_night'])->toBeGreaterThanOrEqual(100);
            expect((float) $listing['price_per_night'])->toBeLessThanOrEqual(300);
        }
    });

    it('sorts listings by price', function () {
        Listing::factory()->create(['title' => 'Listing A', 'price_per_night' => 200.00]);
        Listing::factory()->create(['title' => 'Listing B', 'price_per_night' => 100.00]);
        Listing::factory()->create(['title' => 'Listing C', 'price_per_night' => 300.00]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings?sort=price_per_night&order=asc');

        $response->assertStatus(200);
        
        $listings = $response->json('data');
        $prices = collect($listings)->pluck('price_per_night')->map(fn($price) => (float) $price);
        
        expect($prices->toArray())->toBe($prices->sort()->values()->toArray());
    });

    it('shows only available listings when filtered', function () {
        Listing::factory()->create(['title' => 'Available Listing', 'available' => true]);
        Listing::factory()->create(['title' => 'Unavailable Listing', 'available' => false]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings?available=true');

        $response->assertStatus(200);
        
        $listings = $response->json('data');
        foreach ($listings as $listing) {
            expect($listing['available'])->toBe(true);
        }
    });

    it('paginates listings list', function () {
        Listing::factory()->count(25)->create();

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/listings');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });
});
