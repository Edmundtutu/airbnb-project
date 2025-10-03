<?php

use App\Models\User;
use App\Models\Property;
use App\Models\Listing;

beforeEach(function () {
    $this->seed();
    $this->host = User::factory()->host()->create();
    $this->guest = User::factory()->guest()->create();
    $this->property = Property::factory()->create(['host_id' => $this->host->id]);
});

describe('Property API', function () {
    it('lists all properties', function () {
        Property::factory()->count(5)->create();

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/properties');

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
                        'category',
                        'verified',
                        'host' => [
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

    it('shows a specific property with listings', function () {
        Listing::factory()->count(3)->create(['property_id' => $this->property->id]);

        $response = $this->actingAs($this->guest)
            ->getJson("/api/v1/properties/{$this->property->id}");

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
                    'category',
                    'verified',
                    'host' => [
                        'id',
                        'name',
                        'email',
                    ],
                    'listings' => [
                        '*' => [
                            'id',
                            'name',
                            'description',
                            'price_per_night',
                            'images',
                            'category',
                            'bedrooms',
                            'bathrooms',
                            'max_guests',
                            'tags',
                        ]
                    ]
                ]
            ]);
    });

    it('allows hosts to create properties', function () {
        $propertyData = [
            'name' => 'Beautiful Beach House',
            'description' => 'A stunning beach house with ocean views',
            'address' => '123 Beach Road, Mombasa',
            'lat' => -4.0435,
            'lng' => 39.6682,
            'phone' => '+254700123456',
            'category' => 'House'
        ];

        $response = $this->actingAs($this->host)
            ->postJson('/api/v1/properties', $propertyData);

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
                    'category',
                    'verified',
                    'host' => [
                        'id',
                        'name',
                        'email',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('properties', [
            'name' => 'Beautiful Beach House',
            'host_id' => $this->host->id,
        ]);
    });

    it('prevents guests from creating properties', function () {
        $propertyData = [
            'name' => 'Test Property',
            'description' => 'A test property',
            'address' => '123 Test Street',
            'lat' => -4.0435,
            'lng' => 39.6682,
            'category' => 'House',
        ];

        $response = $this->actingAs($this->guest)
            ->postJson('/api/v1/properties', $propertyData);

        $response->assertStatus(403);
    });

    it('allows property owners to update their properties', function () {
        $updateData = [
            'name' => 'Updated Property Name',
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($this->host)
            ->putJson("/api/v1/properties/{$this->property->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Updated Property Name',
                'description' => 'Updated description',
            ]);

        $this->assertDatabaseHas('properties', [
            'id' => $this->property->id,
            'name' => 'Updated Property Name',
        ]);
    });

    it('prevents non-owners from updating properties', function () {
        $otherHost = User::factory()->host()->create();
        
        $updateData = [
            'name' => 'Hacked Property Name',
        ];

        $response = $this->actingAs($otherHost)
            ->putJson("/api/v1/properties/{$this->property->id}", $updateData);

        $response->assertStatus(403);
    });

    it('allows property owners to delete their properties', function () {
        $response = $this->actingAs($this->host)
            ->deleteJson("/api/v1/properties/{$this->property->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('properties', [
            'id' => $this->property->id,
        ]);
    });

    it('prevents non-owners from deleting properties', function () {
        $otherHost = User::factory()->host()->create();

        $response = $this->actingAs($otherHost)
            ->deleteJson("/api/v1/properties/{$this->property->id}");

        $response->assertStatus(403);
    });

    it('requires authentication for property operations', function () {
        // Create property
        $this->postJson('/api/v1/properties', [])
            ->assertStatus(401);

        // Update property
        $this->putJson("/api/v1/properties/{$this->property->id}", [])
            ->assertStatus(401);

        // Delete property
        $this->deleteJson("/api/v1/properties/{$this->property->id}")
            ->assertStatus(401);
    });

    it('validates required fields when creating property', function () {
        $response = $this->actingAs($this->host)
            ->postJson('/api/v1/properties', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'description', 'address', 'lat', 'lng', 'category']);
    });

    it('validates coordinates format', function () {
        $propertyData = [
            'name' => 'Test Property',
            'description' => 'Test description',
            'address' => 'Test address',
            'lat' => 'invalid',
            'lng' => 'invalid',
            'category' => 'House',
        ];

        $response = $this->actingAs($this->host)
            ->postJson('/api/v1/properties', $propertyData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng']);
    });

    it('returns 404 for non-existent property', function () {
        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/properties/999999');

        $response->assertStatus(404);
    });

    it('paginates properties list', function () {
        Property::factory()->count(25)->create();

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/properties');

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['links'])->toHaveKey('next');
    });

    it('filters properties by location', function () {
        // Create properties in different locations
        Property::factory()->create([
            'name' => 'Nairobi Property',
            'lat' => -1.2921,
            'lng' => 36.8219,
        ]);

        Property::factory()->create([
            'name' => 'Mombasa Property',
            'lat' => -4.0435,
            'lng' => 39.6682,
        ]);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/properties?lat=-1.2921&lng=36.8219&radius=50');

        $response->assertStatus(200);
        
        // Should return properties within 50km of Nairobi
        $properties = $response->json('data');
        expect(collect($properties)->pluck('name'))->toContain('Nairobi Property');
    });

    it('searches properties by name', function () {
        Property::factory()->create(['name' => 'Luxury Villa Paradise']);
        Property::factory()->create(['name' => 'Cozy Apartment Hub']);

        $response = $this->actingAs($this->guest)
            ->getJson('/api/v1/properties?search=Luxury');

        $response->assertStatus(200);
        
        $properties = $response->json('data');
        expect(collect($properties)->pluck('name'))->toContain('Luxury Villa Paradise');
        expect(collect($properties)->pluck('name'))->not->toContain('Cozy Apartment Hub');
    });
});
