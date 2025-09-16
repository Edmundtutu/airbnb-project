<?php

namespace App\Http\Controllers\Api\V1\BookingHandlers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBookingRequest;
use App\Http\Requests\Api\V1\UpdateBookingRequest;
use App\Http\Resources\Api\V1\BookingResource;
use App\Models\Booking;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', Booking::class);

        $bookings = Auth::user()->bookings()->with('details.listing')->latest()->paginate();

        return BookingResource::collection($bookings);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookingRequest $request)
    {
        $this->authorize('create', Booking::class);

        $validated = $request->validated();

        $booking = DB::transaction(function () use ($validated) {
            $booking = Booking::create([
                'guest_id' => Auth::id(),
                'property_id' => $validated['property_id'],
                'check_in_date' => $validated['check_in_date'],
                'check_out_date' => $validated['check_out_date'],
                'guest_count' => $validated['guest_count'],
                'notes' => $validated['notes'] ?? null,
                'total' => 0, // Will be calculated next
                'status' => 'pending',
            ]);

            $total = 0;
            foreach ($validated['details'] as $detail) {
                $listing = Listing::findOrFail($detail['listing_id']);
                $pricePerNight = $detail['price_per_night'] ?? $listing->price_per_night;

                $lineTotal = $pricePerNight * $detail['nights'];

                $booking->details()->create([
                    'listing_id' => $listing->id,
                    'nights' => $detail['nights'],
                    'price_per_night' => $pricePerNight,
                ]);

                $total += $lineTotal;
            }

            $booking->update(['total' => $total]);

            return $booking;
        });

        return new BookingResource($booking->load('details.listing'));
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        return new BookingResource($booking->load('details.listing'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookingRequest $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        $validated = $request->validated();

        $booking->update($validated);

        return new BookingResource($booking->load('details.listing'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking)
    {
        $this->authorize('delete', $booking);

        // Instead of deleting, we can cancel the booking
        if (in_array($booking->status, ['pending', 'processing'])) {
            $booking->update(['status' => 'cancelled']);
            return response()->json(['message' => 'Booking cancelled successfully.']);
        }

        return response()->json(['message' => 'Booking cannot be cancelled.'], 400);
    }

    /**
     * Display a listing of the bookings for the authenticated host's properties.
     */
    public function hostBookings()
    {
        $this->authorize('viewAny', Booking::class); // Using the same policy action for now, adjust if needed

        $host = Auth::user();
        $propertyIds = $host->properties->pluck('id'); // Assuming a host has a properties relationship
        $bookings = Booking::whereIn('property_id', $propertyIds)->with(['details.listing', 'guest'])->latest()->paginate();

        return BookingResource::collection($bookings);
    }

    /**
     * Confirm a Booking with availability check
     */
    public function confirmBooking(Booking $booking): JsonResponse
    {
       if( ! $this->authorize('confirm', $booking)) {
         return response()->json(['message' => 'Some error about authpolicy.'], 403);
       }
       $booking->update(['status' => 'processing']);
        return response()->json(['message' => 'Booking confirmed successfully.']);

    }

    /**
     * Reject booking When not available, cancel and revert Transaction
    */
    public function rejectBooking(Booking $booking): JsonResponse
    {
        $this->authorize('confirm', $booking);
        // TODO When Transactions features are added under payment, revert the transaction here.

        $booking->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Booking rejected successfully.']);
    }
}
