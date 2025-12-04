<?php

/**
 * Firebase Configuration
 * 
 * Place this file in: backend/config/firebase.php
 * 
 * This configuration file sets up Firebase Admin SDK for Laravel.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Firebase Credentials
    |--------------------------------------------------------------------------
    |
    | Path to your Firebase service account JSON file.
    | Download this from Firebase Console > Project Settings > Service Accounts
    |
    */

    'credentials' => [
        'file' => env('FIREBASE_CREDENTIALS', storage_path('app/chattered-firebase-adminsdk-fbsvc-af2d37514c.json')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Firebase Project ID
    |--------------------------------------------------------------------------
    |
    | Your Firebase project ID
    |
    */

    'project_id' => env('FIREBASE_PROJECT_ID', ''),

    /*
    |--------------------------------------------------------------------------
    | Firebase Database URL
    |--------------------------------------------------------------------------
    |
    | Your Firebase Realtime Database URL
    |
    */

    'database_url' => env('FIREBASE_DATABASE_URL', ''),

    /*
    |--------------------------------------------------------------------------
    | Firebase Storage Bucket
    |--------------------------------------------------------------------------
    |
    | Your Firebase Storage bucket (for future file uploads)
    |
    */

    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET', ''),

];
