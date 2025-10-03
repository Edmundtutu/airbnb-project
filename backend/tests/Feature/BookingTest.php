<?php

use App\Models\User;
use App\Models\Property;
use App\Models\Listing;
use App\Models\Booking;

beforeEach(function () {
    $this->seed();
    $this->host = User::factory()->host()->create();
    $this->guest = User::factory()->guest()->create();
    $this->property = Property::factory()->create(['host_id' => $this->host->id]);
    $this->listing = Listing::factory()->create(['property_id' => $this->property->id]);
    $this->booking = Booking::factory()->create([
        'user_id' => $this->guest->id,
        'property_id' => $this->property->id,
    ]);
});

describe('Booking API', function () {
    it('allows guests to create bookings', function () {
        $bookingData = [
            'property_id' => $this->property->id,
            'check_in' => '2024-12-01',
            'check_out' => '2024-12-05',
            'guests' => 2,
            'special_requests' => 'Please provide extra towels'
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'check_in',
                    'check_out',
                    'guests',
                    'total',
                    'status',
                    'special_requests',
                    'property' => [
                        'id',
                        'name',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $this->guest->id,
            'property_id' => $this->property->id,
            'check_in' => '2024-12-01',
            'check_out' => '2024-12-05',
            'guests' => 2,
        ]);
    });

    it('calculates booking total correctly', function () {
        $listing = Listing::factory()->create([
            'property_id' => $this->property->id,
            'price_per_night' => 100.00
        ]);

        $bookingData = [
            'property_id' => $this->property->id,
            'check_in' => '2024-12-01',
            'check_out' => '2024-12-04', // 3 nights
            'guests' => 2,
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(201);

        $booking = Booking::latest()->first();
        expect($booking->total)->toBe(300.00); // 3 * 100.00
    });

    it('lists guest bookings', function () {
        Booking::factory()->count(3)->create(['user_id' => $this->guest->id]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/bookings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'check_in',
                        'check_out',
                        'guests',
                        'total',
                        'status',
                        'property' => [
                            'id',
                            'name',
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);
    });

    it('shows specific booking details', function () {
        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/bookings/{$this->booking->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'check_in',
                    'check_out',
                    'guests',
                    'total',
                    'status',
                    'special_requests',
                    'property' => [
                        'id',
                        'name',
                        'host' => [
                            'id',
                            'name',
                        ]
                    ]
                ]
            ]);
    });

    it('allows guests to update their pending bookings', function () {
        $updateData = [
            'special_requests' => 'Updated special requests',
        ];

        $response = $this->actingAs($this->guest)
            ->putJson("/api/v1/bookings/{$this->booking->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'special_requests' => 'Updated special requests',
            ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $this->booking->id,
            'special_requests' => 'Updated special requests',
        ]);
    });

    it('prevents updating non-pending bookings', function () {
        $this->booking->update(['status' => 'confirmed']);

        $updateData = [
            'special_requests' => 'Should not update',
        ];

        $response = $this->actingAs($this->guest)
            ->putJson("/api/v1/bookings/{$this->booking->id}", $updateData);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending bookings can be updated.'
            ]);
    });

    it('allows guests to cancel their pending bookings', function () {
        $response = $this->actingAs($this->guest)
            ->deleteJson("/api/v1/bookings/{$this->booking->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Booking cancelled successfully.'
            ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $this->booking->id,
            'status' => 'cancelled',
        ]);
    });

    it('prevents cancelling non-pending bookings', function () {
        $this->booking->update(['status' => 'checked_in']);

        $response = $this->actingAs($this->guest)
            ->deleteJson("/api/v1/bookings/{$this->booking->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Only pending bookings can be cancelled.'
            ]);
    });

    it('allows property owners to view their property bookings', function () {
        Booking::factory()->count(3)->create(['property_id' => $this->property->id]);

        $response = $this->actingAs($this->host)
            ->getJson("/api/v1/properties/{$this->property->id}/bookings");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'check_in',
                        'check_out',
                        'guests',
                        'total',
                        'status',
                        'user' => [
                            'id',
                            'name',
                        ]
                    ]
                ]
            ]);
    });

    it('allows property owners to update booking status', function () {
        $response = $this->actingAs($this->host)
            ->putJson("/api/v1/bookings/{$this->booking->id}/status", [
                'status' => 'confirmed'
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'confirmed'
            ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $this->booking->id,
            'status' => 'confirmed',
        ]);
    });

    it('prevents non-property-owners from updating booking status', function () {
        $otherHost = User::factory()->host()->create();

        $response = $this->actingAs($otherHost)
            ->putJson("/api/v1/bookings/{$this->booking->id}/status", [
                'status' => 'confirmed'
            ]);

        $response->assertStatus(403);
    });

    it('prevents guests from accessing other guests bookings', function () {
        $otherGuest = User::factory()->guest()->create();

        $response = $this->actingAs($otherGuest)
            ->getJson("/api/v1/bookings/{$this->booking->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for booking operations', function () {
        // List bookings
        $this->getJson('/api/v1/bookings')
            ->assertStatus(401);

        // Show booking
        $this->getJson("/api/v1/bookings/{$this->booking->id}")
            ->assertStatus(401);

        // Create booking
        $this->postJson('/api/v1/bookings', [])
            ->assertStatus(401);

        // Update booking
        $this->putJson("/api/v1/bookings/{$this->booking->id}", [])
            ->assertStatus(401);

        // Cancel booking
        $this->deleteJson("/api/v1/bookings/{$this->booking->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating booking', function () {
        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['property_id', 'check_in', 'check_out', 'guests']);
    });

    it('validates check-in date is in the future', function () {
        $bookingData = [
            'property_id' => $this->property->id,
            'check_in' => '2020-01-01', // Past date
            'check_out' => '2024-12-05',
            'guests' => 2,
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['check_in']);
    });

    it('validates check-out date is after check-in', function () {
        $bookingData = [
            'property_id' => $this->property->id,
            'check_in' => '2024-12-05',
            'check_out' => '2024-12-01', // Before check-in
            'guests' => 2,
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['check_out']);
    });

    it('validates guest count', function () {
        $bookingData = [
            'property_id' => $this->property->id,
            'check_in' => '2024-12-01',
            'check_out' => '2024-12-05',
            'guests' => 0, // Invalid
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['guests']);
    });

    it('validates booking status transitions', function () {
        $response = $this->actingAs($this->host)
            ->putJson("/api/v1/bookings/{$this->booking->id}/status", [
                'status' => 'invalid_status'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    });

    it('filters bookings by status', function () {
        Booking::factory()->create(['user_id' => $this->guest->id, 'status' => 'pending']);
        Booking::factory()->create(['user_id' => $this->guest->id, 'status' => 'confirmed']);
        Booking::factory()->create(['user_id' => $this->guest->id, 'status' => 'checked_out']);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/bookings?status=pending');

        $response->assertStatus(200);
        
        $bookings = $response->json('data');
        foreach ($bookings as $booking) {
            expect($booking['status'])->toBe('pending');
        }
    });

    it('paginates bookings list', function () {
        Booking::factory()->count(25)->create(['user_id' => $this->guest->id]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/bookings');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });
});
