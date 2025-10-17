<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Order;
use App\Models\Post;
use App\Models\Product;
use App\Models\Review;
use App\Models\Shop;
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
        $this->command->info('🌱 Seeding realistic social commerce data...');

        // === PHASE 1: Create Core Users ===
        $this->command->info('👥 Creating users with roles...');

        // Create specific test users
        $testCustomer = User::factory()->customer()->create([
            'name' => 'John Customer',
            'email' => 'customer@test.com',
        ]);

        $testVendor = User::factory()->vendor()->create([
            'name' => 'Jane Vendor',
            'email' => 'vendor@test.com',
        ]);

        // Create realistic user base: 70% customers, 30% vendors
        $customers = User::factory()->customer()->count(14)->create();
        $vendors = User::factory()->vendor()->count(6)->create();

        $allCustomers = $customers->concat([$testCustomer]);
        $allVendors = $vendors->concat([$testVendor]);
        $allUsers = $allCustomers->merge($allVendors);

        // === PHASE 2: Create ShopHandlers (Only vendors own shops) ===
        $this->command->info('🏪 Creating vendor shops...');

        $shops = collect();
        $allVendors->each(function ($vendor) use (&$shops) {
            $shop = Shop::factory()->create(['owner_id' => $vendor->id]);
            $shops = $shops->concat([$shop]);
        });

        // === PHASE 3: Create Products (3-8 products per shop) ===
        $this->command->info('📦 Creating shop products...');

        $allProducts = collect();
        $shops->each(function ($shop) use (&$allProducts) {
            $productCount = fake()->numberBetween(3, 8);
            $products = Product::factory()->count($productCount)->create([
                'shop_id' => $shop->id
            ]);
            $allProducts = $allProducts->merge($products);
        });

        // === PHASE 4: Create Social Content (PostHandlers) ===
        $this->command->info('📝 Creating social posts...');

        // Vendors create more posts (promoting their products)
        $vendorPosts = collect();
        $allVendors->each(function ($vendor) use (&$vendorPosts) {
            $postCount = fake()->numberBetween(2, 5);
            $posts = Post::factory()->count($postCount)->create([
                'user_id' => $vendor->id
            ]);
            $vendorPosts = $vendorPosts->merge($posts);
        });

        // Customers create fewer posts
        $customerPosts = collect();
        $allCustomers->take(10)->each(function ($customer) use (&$customerPosts) {
            $postCount = fake()->numberBetween(0, 2);
            if ($postCount > 0) {
                $posts = Post::factory()->count($postCount)->create([
                    'user_id' => $customer->id
                ]);
                $customerPosts = $customerPosts->merge($posts);
            }
        });

        $allPosts = $vendorPosts->merge($customerPosts);

        // === PHASE 5: Create OrderHandlers (Customers buy from vendors) ===
        $this->command->info('🛒 Creating customer orders...');

        $allOrders = collect();
        $allCustomers->each(function ($customer) use ($shops, &$allOrders) {
            $orderCount = fake()->numberBetween(1, 4);
            for ($i = 0; $i < $orderCount; $i++) {
                $shop = $shops->random();
                $order = Order::factory()->create([
                    'user_id' => $customer->id,
                    'shop_id' => $shop->id,
                ]);
                $allOrders->push($order);
            }
        });

        // === PHASE 6: Create Reviews (Customers review products and shops) ===
        $this->command->info('⭐ Creating product and shop reviews...');

        $allCustomers->each(function ($customer) use ($allProducts, $shops) {
            $reviewCount = fake()->numberBetween(0, 3);
            for ($i = 0; $i < $reviewCount; $i++) {
                $reviewableType = fake()->randomElement([Product::class, Shop::class]);
                $reviewable = $reviewableType === Product::class
                    ? $allProducts->random()
                    : $shops->random();

                Review::factory()->create([
                    'user_id' => $customer->id,
                    'reviewable_id' => $reviewable->id,
                    'reviewable_type' => $reviewableType,
                ]);
            }
        });

        // === PHASE 7: Create Social Interactions ===
        $this->command->info('💬 Creating social interactions...');

        // Comments on posts and products
        $allUsers->each(function ($user) use ($allPosts, $allProducts) {
            $commentCount = fake()->numberBetween(0, 5);
            for ($i = 0; $i < $commentCount; $i++) {
                $commentableType = fake()->randomElement([Post::class, Product::class]);
                $commentable = $commentableType === Post::class
                    ? $allPosts->random()
                    : $allProducts->random();

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

        // Follow relationships (users follow other users and shops)
        $allUsers->each(function ($user) use ($allUsers, $shops) {
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

            // Follow some shops (especially if user is a customer)
            if ($user->role === 'customer') {
                $shopsToFollow = $shops->random(min(3, $shops->count()));
                foreach ($shopsToFollow as $shopToFollow) {
                    // Avoid duplicate follows
                    $existingFollow = Follow::where([
                        'user_id' => $user->id,
                        'followable_id' => $shopToFollow->id,
                        'followable_type' => Shop::class,
                    ])->first();

                    if (!$existingFollow) {
                        Follow::factory()->create([
                            'user_id' => $user->id,
                            'followable_id' => $shopToFollow->id,
                            'followable_type' => Shop::class,
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
                ['- Customers', User::where('role', 'customer')->count()],
                ['- Vendors', User::where('role', 'vendor')->count()],
                ['ShopHandlers', Shop::count()],
                ['Products', Product::count()],
                ['PostHandlers', Post::count()],
                ['OrderHandlers', Order::count()],
                ['Reviews', Review::count()],
                ['Comments', Comment::count()],
                ['Likes', Like::count()],
                ['Follows', Follow::count()],
            ]
        );
    }
}
