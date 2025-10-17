<?php

namespace App\Http\Controllers\Api\V1\PostHandlers;

use App\Models\Post;
use App\Http\Controllers\Controller;
use App\Models\Like;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\Api\V1\PostResource;
use App\Http\Requests\Api\V1\StorePostRequest;
use App\Http\Requests\Api\V1\UpdatePostRequest;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index()
    {
        return PostResource::collection(Post::with(['user', 'product.shop', 'likes', 'comments'])->latest()->paginate(10));
    }

    public function store(StorePostRequest $request)
    {
        $this->authorize('create', Post::class);

        $post = Post::create(array_merge($request->validated(), ['user_id' => Auth::id()]));

        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('post_images', 'public');
                $imagePaths[] = $path;
            }

            // Update the post with image paths
            $post->update(['images' => $imagePaths]);
        }

        return new PostResource($post);
    }

    public function show(Post $post)
    {
        return new PostResource($post->load(['user', 'product.shop', 'likes', 'comments']));
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());

        return new PostResource($post);
    }

    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->noContent();
    }

    public function likeOrUnlike(Post $post)
    {
        $userId = Auth::id();

        if ($post->likes()->where('user_id', $userId)->exists()) {
            $post->likes()->where('user_id', $userId)->delete();
        } else {
            $post->likes()->create(['user_id' => $userId]);
        }

        $newLikesCount = $post->likes()->count();
        return response()->json(['message' => 'Like status updated', 'likes_count' => $newLikesCount]);
    }
}
