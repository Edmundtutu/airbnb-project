<?php

namespace App\Http\Controllers\Api\V1\Uploads;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload dish images
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadPropertyImages(Request $request)
    {
        $request->validate([
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,webp|max:5120', // 5MB max
        ]);

        $uploadedFiles = [];

        foreach ($request->file('images') as $file) {
            // Generate unique filename
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Store in public disk under property-images directory
            $path = $file->storeAs('property-images', $filename, 'public');
            
            // Get the public URL - ensure it's absolute using APP_URL
            // This ensures URLs are like: http://localhost:8000/storage/propert-images/... or https://domain.com/storage/propert-images/...
            $baseUrl = rtrim(config('app.url'), '/');
            $url = $baseUrl . '/storage/' . $path;

            $uploadedFiles[] = [
                'url' => $url,
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ];
        }

        return response()->json([
            'data' => $uploadedFiles,
            'message' => 'Images uploaded successfully'
        ], 201);
    }
}

