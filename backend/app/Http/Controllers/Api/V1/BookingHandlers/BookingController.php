<?php

namespace App\Http\Controllers\Api\V1\BookingHandlers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBookingRequest;
use App\Http\Requests\Api\V1\UpdateBookingRequest;
use App\Http\Resources\Api\V1\BookingResource;
use App\Http\Resources\Api\V1\BookingReservationResource;
use App\Http\Resources\Api\V1\ListingCalendarReservationResource;
use App\Models\Booking;
use App\Models\Listing;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class BookingController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', Booking::class);

        $bookings = Booking::where('guest_id', Auth::id())
            ->with('details.listing')
            ->latest()
            ->paginate();

        return BookingResource::collection($bookings);
    }

    /**
     * Display paginated bookings for the authenticated guest with optional filters.
     */
    public function guestBookings(Request $request)
    {
        $this->authorize('viewAny', Booking::class);

        $query = Booking::query()
            ->where('guest_id', Auth::id())
            ->with(['details.listing', 'property'])
            ->latest('check_in_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $today = Carbon::today();

        if ($request->boolean('upcoming')) {
            $query->whereDate('check_in_date', '>=', $today);
        }

        if ($request->boolean('past')) {
            $query->whereDate('check_out_date', '<', $today);
        }

        $perPage = (int) $request->query('per_page', 15);

        $bookings = $query->paginate($perPage)->appends($request->query());

        return BookingResource::collection($bookings);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookingRequest $request)
    {
        $this->authorize('create', Booking::class);

        $validated = $request->validated();

        $detailPayload = collect($validated['details']);
        $listingIds = $detailPayload->pluck('listing_id')->unique();
        $listings = Listing::whereIn('id', $listingIds)->get()->keyBy('id');

        if ($listings->count() !== $listingIds->count()) {
            throw ValidationException::withMessages([
                'details' => ['One or more listings could not be found.'],
            ]);
        }

        foreach ($listingIds as $listingId) {
            $listing = $listings->get($listingId);
            if ($listing->property_id !== $validated['property_id']) {
                throw ValidationException::withMessages([
                    'details' => ['All listings must belong to the specified property.'],
                ]);
            }
        }

        $details = $detailPayload->map(function (array $detail) use ($listings) {
            $listing = $listings->get($detail['listing_id']);
            $pricePerNight = $detail['price_per_night'] ?? $listing->price_per_night;

            return [
                'listing' => $listing,
                'nights' => (int) $detail['nights'],
                'price_per_night' => (float) $pricePerNight,
            ];
        });

        $booking = DB::transaction(function () use ($validated, $details) {
            $booking = Booking::create([
                'guest_id' => Auth::id(),
                'property_id' => $validated['property_id'],
                'check_in_date' => $validated['check_in_date'],
                'check_out_date' => $validated['check_out_date'],
                'guest_count' => $validated['guest_count'],
                'notes' => $validated['notes'] ?? null,
                'total' => 0,
                'status' => 'pending',
            ]);

            $total = 0;

            foreach ($details as $detail) {
                $lineTotal = $detail['price_per_night'] * $detail['nights'];

                $booking->details()->create([
                    'listing_id' => $detail['listing']->id,
                    'nights' => $detail['nights'],
                    'price_per_night' => $detail['price_per_night'],
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
        $this->authorize('confirm', $booking);

        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Only pending bookings can be confirmed.'], 422);
        }

        $booking->update(['status' => 'confirmed']);

        return response()->json(['message' => 'Booking confirmed successfully.']);
    }

    /**
     * Reject booking When not available, cancel and revert Transaction
     */
    public function rejectBooking(Booking $booking): JsonResponse
    {
        $this->authorize('confirm', $booking);

        if (! in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Booking cannot be rejected in its current state.'], 422);
        }

        $booking->update(['status' => 'cancelled']);

        // TODO When Transactions features are added under payment, revert the transaction here.

        return response()->json(['message' => 'Booking rejected successfully.']);
    }

    /**
     * Fetch existing reservations for a property to drive availability calendars.
     */
    public function listingReservations(Listing $listing)
    {
        $bookings = Booking::whereHas('details', fn ($query) => $query->where('listing_id', $listing->id))
            ->with(['details' => fn ($query) => $query
                ->select('id', 'booking_id', 'listing_id')
                ->where('listing_id', $listing->id)
            ])
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->orderBy('check_in_date')
            ->get(['id', 'property_id', 'check_in_date', 'check_out_date', 'status', 'guest_count']);

        $bookings->each(fn ($booking) => $booking->setAttribute('listing_id', $listing->id));

        return BookingReservationResource::collection($bookings);
    }

    public function hostListingReservations(Request $request)
    {
        $this->authorize('viewAny', Booking::class);

        $month = (int) $request->query('month', (int) now()->format('m'));
        $year = (int) $request->query('year', (int) now()->format('Y'));

        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = (clone $start)->endOfMonth();

        $bookings = Booking::with([
                'property:id,name,host_id',
                'details.listing:id,name,property_id',
                'guest:id,name',
            ])
            ->whereHas('property', fn ($query) => $query->where('host_id', Auth::id()))
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('check_in_date', [$start, $end])
                    ->orWhereBetween('check_out_date', [$start, $end])
                    ->orWhere(function ($subQuery) use ($start, $end) {
                        $subQuery->where('check_in_date', '<', $start)
                            ->where('check_out_date', '>', $end);
                    });
            })
            ->get();

        $reservations = $bookings->flatMap(function (Booking $booking) {
            return $booking->details->map(function ($detail) use ($booking) {
                return [
                    'id' => (string) $detail->id,
                    'booking_id' => $booking->id,
                    'listing_id' => $detail->listing_id,
                    'listing_name' => optional($detail->listing)->name,
                    'property_id' => $booking->property_id,
                    'property_name' => optional($booking->property)->name,
                    'guest_id' => $booking->guest_id,
                    'guest_name' => optional($booking->guest)->name,
                    'guest_count' => $booking->guest_count,
                    'status' => $booking->status,
                    'check_in_date' => optional($booking->check_in_date)->toDateString(),
                    'check_out_date' => optional($booking->check_out_date)->toDateString(),
                ];
            });
        })->values();

        return ListingCalendarReservationResource::collection($reservations);
    }
}
