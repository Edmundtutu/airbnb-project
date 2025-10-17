<?php

namespace App\Providers;

use App\Models\Like;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Order;
use App\Models\Follow;
use App\Models\Review;
use App\Models\Comment;
use App\Models\Product;
use App\Policies\NodePolicy;
use App\Models\InventoryNodeEdge;
use App\Policies\Api\V1\EdgePolicy;
use App\Models\Category;
use App\Policies\Api\V1\CategoryPolicy;
use App\Models\InventoryNode;
use Illuminate\Support\Facades\DB;
use App\Policies\Api\V1\LikePolicy;
use App\Policies\Api\V1\PostPolicy;
use App\Policies\Api\V1\ShopPolicy;
use App\Policies\Api\V1\OrderPolicy;
use Illuminate\Support\Facades\Gate;
use App\Policies\Api\V1\FollowPolicy;
use App\Policies\Api\V1\ReviewPolicy;
use App\Policies\Api\V1\CommentPolicy;
use App\Policies\Api\V1\ProductPolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
        public function boot(): void
    {
        if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
            DB::connection()->getPdo()->sqliteCreateFunction('ST_Distance_Sphere', function ($lng1, $lat1, $lng2, $lat2) {
                $earthRadius = 6371000; // meters

                $latFrom = deg2rad($lat1);
                $lonFrom = deg2rad($lng1);
                $latTo = deg2rad($lat2);
                $lonTo = deg2rad($lng2);

                $lonDelta = $lonTo - $lonFrom;
                $a = pow(cos($latTo) * sin($lonDelta), 2) +
                     pow(cos($latFrom) * sin($latTo) - sin($latFrom) * cos($latTo) * cos($lonDelta), 2);
                $b = sin($latFrom) * sin($latTo) + cos($latFrom) * cos($latTo) * cos($lonDelta);

                $angle = atan2(sqrt($a), $b);
                return $angle * $earthRadius;
            });
        }
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        Gate::policy(Shop::class, ShopPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Post::class, PostPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Review::class, ReviewPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(Like::class, LikePolicy::class);
        Gate::policy(Follow::class, FollowPolicy::class);
        Gate::policy(InventoryNode::class, NodePolicy::class);
        Gate::policy(InventoryNodeEdge::class, EdgePolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
    }
}
