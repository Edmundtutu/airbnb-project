<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Listing;
use App\Models\Post;
use App\Models\Property;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding realistic Airbnb-style rental platform data...');

        // === PHASE 1: Create Core Users ===
        $this->command->info('👥 Creating users with roles...');

        // Create specific test users
        $testGuest = User::factory()->guest()->create([
            'name' => 'John Guest',
            'email' => 'guest@test.com',
        ]);

        $testHost = User::factory()->host()->create([
            'name' => 'Jane Host',
            'email' => 'host@test.com',
        ]);

        // Create realistic user base: 70% guests, 30% hosts
        $guests = User::factory()->guest()->count(14)->create();
        $hosts = User::factory()->host()->count(6)->create();

        $allGuests = $guests->concat([$testGuest]);
        $allHosts = $hosts->concat([$testHost]);
        $allUsers = $allGuests->merge($allHosts);

        // === PHASE 2: Create Properties (Only hosts own properties) ===
        $this->command->info('🏠 Creating host properties...');

        $properties = collect();
        $allHosts->each(function ($host) use (&$properties) {
            $property = Property::factory()->create(['host_id' => $host->id]);
            $properties = $properties->concat([$property]);
        });

        // === PHASE 3: Create Listings (1-3 listings per property) ===
        $this->command->info('📋 Creating property listings...');

        $allListings = collect();
        $properties->each(function ($property) use (&$allListings) {
            $listingCount = fake()->numberBetween(1, 3);
            $listings = Listing::factory()->count($listingCount)->create([
                'property_id' => $property->id
            ]);
            $allListings = $allListings->merge($listings);
        });

        // === PHASE 4: Create Social Content (Posts) ===
        $this->command->info('📝 Creating social posts...');

        // Hosts create more posts (promoting their properties)
        $hostPosts = collect();
        $allHosts->each(function ($host) use (&$hostPosts) {
            $postCount = fake()->numberBetween(2, 5);
            $posts = Post::factory()->count($postCount)->create([
                'user_id' => $host->id
            ]);
            $hostPosts = $hostPosts->merge($posts);
        });

        // Guests create fewer posts
        $guestPosts = collect();
        $allGuests->take(10)->each(function ($guest) use (&$guestPosts) {
            $postCount = fake()->numberBetween(0, 2);
            if ($postCount > 0) {
                $posts = Post::factory()->count($postCount)->create([
                    'user_id' => $guest->id
                ]);
                $guestPosts = $guestPosts->merge($posts);
            }
        });

        $allPosts = $hostPosts->merge($guestPosts);

        // === PHASE 5: Create Bookings (Guests book properties) ===
        $this->command->info('🏨 Creating guest bookings...');

        $allBookings = collect();
        $allGuests->each(function ($guest) use ($properties, &$allBookings) {
            $bookingCount = fake()->numberBetween(1, 4);
            for ($i = 0; $i < $bookingCount; $i++) {
                $property = $properties->random();
                $booking = Booking::factory()->create([
                    'guest_id' => $guest->id,
                    'property_id' => $property->id,
                ]);
                $allBookings->push($booking);
            }
        });

        // === PHASE 6: Create Reviews (Guests review listings and properties) ===
        $this->command->info('⭐ Creating listing and property reviews...');

        $allGuests->each(function ($guest) use ($allListings, $properties) {
            $reviewCount = fake()->numberBetween(0, 3);
            for ($i = 0; $i < $reviewCount; $i++) {
                $reviewableType = fake()->randomElement([Listing::class, Property::class]);
                $reviewable = $reviewableType === Listing::class
                    ? $allListings->random()
                    : $properties->random();

                Review::factory()->create([
                    'user_id' => $guest->id,
                    'reviewable_id' => $reviewable->id,
                    'reviewable_type' => $reviewableType,
                ]);
            }
        });

        // === PHASE 7: Create Social Interactions ===
        $this->command->info('💬 Creating social interactions...');

        // Comments on posts and listings
        $allUsers->each(function ($user) use ($allPosts, $allListings) {
            $commentCount = fake()->numberBetween(0, 5);
            for ($i = 0; $i < $commentCount; $i++) {
                $commentableType = fake()->randomElement([Post::class, Listing::class]);
                $commentable = $commentableType === Post::class
                    ? $allPosts->random()
                    : $allListings->random();

                Comment::factory()->create([
                    'user_id' => $user->id,
                    'commentable_id' => $commentable->id,
                    'commentable_type' => $commentableType,
                ]);
            }
        });

        // Likes on posts and comments
        $allComments = Comment::all();
        $allUsers->each(function ($user) use ($allPosts, $allComments) {
            $likeCount = fake()->numberBetween(2, 10);
            for ($i = 0; $i < $likeCount; $i++) {
                $likeableType = fake()->randomElement([Post::class, Comment::class]);
                $likeable = $likeableType === Post::class
                    ? $allPosts->random()
                    : $allComments->random();

                // Avoid duplicate likes
                $existingLike = Like::where([
                    'user_id' => $user->id,
                    'likeable_id' => $likeable->id,
                    'likeable_type' => $likeableType,
                ])->first();

                if (!$existingLike) {
                    Like::factory()->create([
                        'user_id' => $user->id,
                        'likeable_id' => $likeable->id,
                        'likeable_type' => $likeableType,
                    ]);
                }
            }
        });

        // Follow relationships (users follow other users and properties)
        $allUsers->each(function ($user) use ($allUsers, $properties) {
            $followCount = fake()->numberBetween(1, 8);

            // Follow other users
            $usersToFollow = $allUsers->where('id', '!=', $user->id)->random(min($followCount - 2, $allUsers->count() - 1));
            foreach ($usersToFollow as $userToFollow) {
                // Avoid duplicate follows
                $existingFollow = Follow::where([
                    'user_id' => $user->id,
                    'followable_id' => $userToFollow->id,
                    'followable_type' => User::class,
                ])->first();

                if (!$existingFollow) {
                    Follow::factory()->create([
                        'user_id' => $user->id,
                        'followable_id' => $userToFollow->id,
                        'followable_type' => User::class,
                    ]);
                }
            }

            // Follow some properties (especially if user is a guest)
            if ($user->role === 'guest') {
                $propertiesToFollow = $properties->random(min(3, $properties->count()));
                foreach ($propertiesToFollow as $propertyToFollow) {
                    // Avoid duplicate follows
                    $existingFollow = Follow::where([
                        'user_id' => $user->id,
                        'followable_id' => $propertyToFollow->id,
                        'followable_type' => Property::class,
                    ])->first();

                    if (!$existingFollow) {
                        Follow::factory()->create([
                            'user_id' => $user->id,
                            'followable_id' => $propertyToFollow->id,
                            'followable_type' => Property::class,
                        ]);
                    }
                }
            }
        });

        // === SUMMARY ===
        $this->command->info('✅ Seeding completed!');
        $this->command->table(
            ['Entity', 'Count'],
            [
                ['Users (Total)', User::count()],
                ['- Guests', User::where('role', 'guest')->count()],
                ['- Hosts', User::where('role', 'host')->count()],
                ['Properties', Property::count()],
                ['Listings', Listing::count()],
                ['Posts', Post::count()],
                ['Bookings', Booking::count()],
                ['Reviews', Review::count()],
                ['Comments', Comment::count()],
                ['Likes', Like::count()],
                ['Follows', Follow::count()],
            ]
        );
    }
}
