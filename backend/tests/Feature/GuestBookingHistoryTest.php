<?php

use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

it('returns only the authenticated guest bookings', function () {
	$guest = User::factory()->guest()->create();
	$otherGuest = User::factory()->guest()->create();

	$matchingBooking = Booking::factory()->create([
		'guest_id' => $guest->id,
		'status' => 'confirmed',
		'check_in_date' => Carbon::now()->addDays(3),
		'check_out_date' => Carbon::now()->addDays(5),
	]);

	$otherBooking = Booking::factory()->create([
		'guest_id' => $otherGuest->id,
		'status' => 'confirmed',
		'check_in_date' => Carbon::now()->addDays(4),
		'check_out_date' => Carbon::now()->addDays(6),
	]);

	Sanctum::actingAs($guest);

	$response = $this->getJson('/api/v1/guest/bookings');

	$response->assertOk();

	$bookingIds = collect($response->json('data'))->pluck('id');

	expect($bookingIds)
		->toContain($matchingBooking->id);

	expect($bookingIds)
		->not->toContain($otherBooking->id);
});

it('supports status and timeframe filters for guest bookings', function () {
	$guest = User::factory()->guest()->create();

	$upcoming = Booking::factory()->create([
		'guest_id' => $guest->id,
		'status' => 'confirmed',
		'check_in_date' => Carbon::now()->addDays(7),
		'check_out_date' => Carbon::now()->addDays(10),
	]);

	$past = Booking::factory()->create([
		'guest_id' => $guest->id,
		'status' => 'completed',
		'check_in_date' => Carbon::now()->subDays(10),
		'check_out_date' => Carbon::now()->subDays(7),
	]);

	Sanctum::actingAs($guest);

	$upcomingResponse = $this->getJson('/api/v1/guest/bookings?status=confirmed&upcoming=1');
	$upcomingResponse->assertOk();

	$upcomingIds = collect($upcomingResponse->json('data'))->pluck('id');
	expect($upcomingIds)->toContain($upcoming->id);
	expect($upcomingIds)->not->toContain($past->id);

	$pastResponse = $this->getJson('/api/v1/guest/bookings?past=1');
	$pastResponse->assertOk();

	$pastIds = collect($pastResponse->json('data'))->pluck('id');
	expect($pastIds)->toContain($past->id);
	expect($pastIds)->not->toContain($upcoming->id);
});
