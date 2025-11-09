<?php

namespace App\Http\Controllers\Api\V1\UserHandlers;

use Illuminate\Http\Request;
use App\Mail\SubscriptionAutoReply;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Mail;

class SubscriberController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->input('email');
        $name = ''; // Not gona stress on extracting names from email for now
        // Send to the internal mailing List
        Mail::raw('New Subscriber: ' . $email, function ($message) use ($email) {
            $message->to('newsletter@yocava.com')
                ->subject('New Subscriber');
        });

        // Auto reply to the subscriber
        Mail::to($email)->send(new SubscriptionAutoReply($name));

        return response()->json([
            'message' => 'Subscription successful.'
        ], 201);
    }
}
