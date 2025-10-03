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

describe('Review API', function () {
    it('allows guests to review listings', function () {
        $reviewData = [
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => 'listing',
            'rating' => 5,
            'comment' => 'Excellent listing! Highly recommended.',
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'rating',
                    'comment',
                    'user' => [
                        'id',
                        'name',
                    ],
                    'reviewable' => [
                        'id',
                        'name',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 5,
        ]);
    });

    it('allows guests to review properties', function () {
        $reviewData = [
            'reviewable_id' => $this->property->id,
            'reviewable_type' => 'property',
            'rating' => 4,
            'comment' => 'Great property with excellent service.',
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->property->id,
            'reviewable_type' => Property::class,
            'rating' => 4,
        ]);
    });

    it('lists reviews for a listing', function () {
        Review::factory()->count(3)->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/listings/{$this->listing->id}/reviews");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'rating',
                        'comment',
                        'user' => [
                            'id',
                            'name',
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);
    });

    it('lists reviews for a property', function () {
        Review::factory()->count(3)->create([
            'reviewable_id' => $this->property->id,
            'reviewable_type' => Property::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/properties/{$this->property->id}/reviews");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
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
            ]);
    });

    it('shows a specific review', function () {
        $review = Review::factory()->create([
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'rating',
                    'comment',
                    'user' => [
                        'id',
                        'name',
                    ],
                    'reviewable' => [
                        'id',
                        'name',
                    ]
                ]
            ]);
    });

    it('allows users to update their own reviews', function () {
        $review = Review::factory()->create([
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $updateData = [
            'rating' => 3,
            'comment' => 'Updated review comment',
        ];

        $response = $this->actingAs($this->guest)
            ->putJson("/api/v1/reviews/{$review->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'rating' => 3,
                'comment' => 'Updated review comment',
            ]);

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'rating' => 3,
            'comment' => 'Updated review comment',
        ]);
    });

    it('prevents users from updating other users reviews', function () {
        $otherCustomer = User::factory()->customer()->create();
        $review = Review::factory()->create([
            'user_id' => $otherCustomer->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $updateData = [
            'rating' => 1,
            'comment' => 'Hacked review',
        ];

        $response = $this->actingAs($this->guest)
            ->putJson("/api/v1/reviews/{$review->id}", $updateData);

        $response->assertStatus(403);
    });

    it('allows users to delete their own reviews', function () {
        $review = Review::factory()->create([
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->deleteJson("/api/v1/reviews/{$review->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('reviews', [
            'id' => $review->id,
        ]);
    });

    it('prevents users from deleting other users reviews', function () {
        $otherCustomer = User::factory()->customer()->create();
        $review = Review::factory()->create([
            'user_id' => $otherCustomer->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->deleteJson("/api/v1/reviews/{$review->id}");

        $response->assertStatus(403);
    });

    it('prevents duplicate reviews from same user on same item', function () {
        Review::factory()->create([
            'user_id' => $this->guest->id,
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $reviewData = [
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => 'listing',
            'rating' => 3,
            'comment' => 'Duplicate review attempt',
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(409)
            ->assertJson([
                'message' => 'You have already reviewed this item.'
            ]);
    });

    it('requires authentication for review operations', function () {
        $review = Review::factory()->create();

        // Create review
        $this->postJson('/api/v1/reviews', [])
            ->assertStatus(401);

        // Show review
        $this->getJson("/api/v1/reviews/{$review->id}")
            ->assertStatus(401);

        // Update review
        $this->putJson("/api/v1/reviews/{$review->id}", [])
            ->assertStatus(401);

        // Delete review
        $this->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating review', function () {
        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reviewable_id', 'reviewable_type', 'rating']);
    });

    it('validates rating range', function () {
        $reviewData = [
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => 'listing',
            'rating' => 6, // Invalid rating > 5
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    });

    it('validates reviewable_type values', function () {
        $reviewData = [
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => 'invalid_type',
            'rating' => 5,
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reviewable_type']);
    });

    it('validates that reviewable_id exists', function () {
        $reviewData = [
            'reviewable_id' => '999999',
            'reviewable_type' => 'listing',
            'rating' => 5,
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/reviews', $reviewData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reviewable_id']);
    });

    it('returns 404 for non-existent review', function () {
        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/reviews/999999');

        $response->assertStatus(404);
    });

    it('filters reviews by rating', function () {
        Review::factory()->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 5,
        ]);

        Review::factory()->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 3,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/listings/{$this->listing->id}/reviews?rating=5");

        $response->assertStatus(200);
        
        $reviews = $response->json('data');
        foreach ($reviews as $review) {
            expect($review['rating'])->toBe(5);
        }
    });

    it('sorts reviews by rating', function () {
        Review::factory()->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 2,
        ]);

        Review::factory()->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 5,
        ]);

        Review::factory()->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
            'rating' => 3,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/listings/{$this->listing->id}/reviews?sort=rating&order=desc");

        $response->assertStatus(200);
        
        $reviews = $response->json('data');
        $ratings = collect($reviews)->pluck('rating');
        
        expect($ratings->toArray())->toBe($ratings->sortDesc()->values()->toArray());
    });

    it('paginates reviews list', function () {
        Review::factory()->count(25)->create([
            'reviewable_id' => $this->listing->id,
            'reviewable_type' => Listing::class,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/listings/{$this->listing->id}/reviews");

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });
});
