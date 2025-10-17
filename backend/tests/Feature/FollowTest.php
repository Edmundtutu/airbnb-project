<?php

use App\Models\User;
use App\Models\Shop;
use App\Models\Follow;

beforeEach(function () {
    $this->seed();
    $this->customer = User::factory()->customer()->create();
    $this->vendor = User::factory()->vendor()->create();
    $this->shop = Shop::factory()->create(['owner_id' => $this->vendor->id]);
    $this->otherUser = User::factory()->customer()->create();
});

describe('Follow API', function () {
    it('allows users to follow other users', function () {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/follows', [
                'user_id' => $this->vendor->id,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Successfully followed the user.'
            ]);

        $this->assertDatabaseHas('follows', [
            'user_id' => $this->customer->id,
            'followable_id' => $this->vendor->id,
            'followable_type' => User::class,
        ]);
    });

    it('prevents users from following themselves', function () {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/follows', [
                'user_id' => $this->customer->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    });

    it('prevents duplicate follows', function () {
        // First follow
        Follow::factory()->create([
            'user_id' => $this->customer->id,
            'followable_id' => $this->vendor->id,
            'followable_type' => User::class,
        ]);

        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/follows', [
                'user_id' => $this->vendor->id,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'message' => 'You are already following this user.'
            ]);
    });

    it('allows users to unfollow other users', function () {
        $follow = Follow::factory()->create([
            'user_id' => $this->customer->id,
            'followable_id' => $this->vendor->id,
            'followable_type' => User::class,
        ]);

        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/v1/follows/{$this->vendor->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Successfully unfollowed the user.'
            ]);

        $this->assertDatabaseMissing('follows', [
            'id' => $follow->id,
        ]);
    });

    it('returns 404 when trying to unfollow non-followed user', function () {
        $response = $this->actingAs($this->customer)
            ->deleteJson("/api/v1/follows/{$this->vendor->id}");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'You are not following this user.'
            ]);
    });

    it('lists followers of a user', function () {
        // Create some followers
        $follower1 = User::factory()->create();
        $follower2 = User::factory()->create();

        Follow::factory()->create([
            'user_id' => $follower1->id,
            'followable_id' => $this->vendor->id,
            'followable_type' => User::class,
        ]);

        Follow::factory()->create([
            'user_id' => $follower2->id,
            'followable_id' => $this->vendor->id,
            'followable_type' => User::class,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/users/{$this->vendor->id}/followers");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'avatar',
                        'shop' => [
                            'id',
                            'name',
                            'description',
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);

        expect($response->json('data'))->toHaveCount(2);
    });

    it('lists users that a user is following', function () {
        // Create some follows
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        Follow::factory()->create([
            'user_id' => $this->customer->id,
            'followable_id' => $user1->id,
            'followable_type' => User::class,
        ]);

        Follow::factory()->create([
            'user_id' => $this->customer->id,
            'followable_id' => $user2->id,
            'followable_type' => User::class,
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/users/{$this->customer->id}/following");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'avatar',
                        'shop' => [
                            'id',
                            'name',
                            'description',
                        ]
                    ]
                ],
                'links',
                'meta'
            ]);

        expect($response->json('data'))->toHaveCount(2);
    });

    it('requires authentication for following', function () {
        $response = $this->postJson('/api/v1/follows', [
            'user_id' => $this->vendor->id,
        ]);

        $response->assertStatus(401);
    });

    it('requires authentication for unfollowing', function () {
        $response = $this->deleteJson("/api/v1/follows/{$this->vendor->id}");

        $response->assertStatus(401);
    });

    it('requires authentication for viewing followers', function () {
        $response = $this->getJson("/api/v1/users/{$this->vendor->id}/followers");

        $response->assertStatus(401);
    });

    it('requires authentication for viewing following', function () {
        $response = $this->getJson("/api/v1/users/{$this->customer->id}/following");

        $response->assertStatus(401);
    });

    it('validates required fields for following', function () {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/follows', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    });

    it('validates that user_id exists', function () {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/follows', [
                'user_id' => '999999',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    });

    it('returns 404 for non-existent user in followers endpoint', function () {
        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/users/999999/followers');

        $response->assertStatus(404);
    });

    it('returns 404 for non-existent user in following endpoint', function () {
        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/users/999999/following');

        $response->assertStatus(404);
    });

    it('paginates followers list', function () {
        // Create many followers
        $followers = User::factory()->count(25)->create();
        
        foreach ($followers as $follower) {
            Follow::factory()->create([
                'user_id' => $follower->id,
                'followable_id' => $this->vendor->id,
                'followable_type' => User::class,
            ]);
        }

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/users/{$this->vendor->id}/followers");

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['meta']['total'])->toBe(25);
        expect($data['links'])->toHaveKey('next');
    });

    it('paginates following list', function () {
        // Create many users to follow
        $usersToFollow = User::factory()->count(25)->create();
        
        foreach ($usersToFollow as $userToFollow) {
            Follow::factory()->create([
                'user_id' => $this->customer->id,
                'followable_id' => $userToFollow->id,
                'followable_type' => User::class,
            ]);
        }

        $response = $this->actingAs($this->customer)
            ->getJson("/api/v1/users/{$this->customer->id}/following");

        $response->assertStatus(200);
        
        $data = $response->json();
        expect($data['data'])->toHaveCount(15); // Default pagination
        expect($data['meta']['total'])->toBe(25);
        expect($data['links'])->toHaveKey('next');
    });
});
