# Booking Subsystem Stabilization Report

**Project:** Cavayo (Airbnb-like Platform)  
**Date:** January 21, 2025  
**Phase:** Pre-Notification System Stabilization  
**Status:** ✅ COMPLETE

---

## Executive Summary

This report documents the comprehensive stabilization work performed on the Cavayo booking subsystem. The stabilization was required before implementing a notification system to ensure correctness, determinism, and contract alignment across the frontend-backend boundary.

**Key Outcomes:**
- ✅ All ID type mismatches resolved (ULID alignment)
- ✅ API drift eliminated (unsupported methods stubbed)
- ✅ Server-side availability protection with row locking
- ✅ Server-authoritative pricing computation
- ✅ Canonical booking states with transition guards
- ✅ Domain events and activity logging infrastructure

---

## 1. System Health Report

### 1.1 Risks Eliminated

| Risk | Severity | Resolution |
|------|----------|------------|
| **ID Type Mismatch** | HIGH | Changed all frontend booking IDs from `number` to `string` to match backend ULIDs |
| **API Contract Drift** | MEDIUM | Stubbed 7 unsupported frontend methods with deprecation warnings |
| **Race Condition in Bookings** | HIGH | Implemented `lockForUpdate()` in availability validation |
| **Client-Trusted Pricing** | HIGH | Server now computes pricing from database; client values ignored |
| **Unguarded State Transitions** | MEDIUM | State machine enforces valid transition matrix |
| **No Audit Trail** | MEDIUM | Domain events + activity logging table added |

### 1.2 Remaining Risks / Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| Backend routes for checkin/checkout/complete | LOW | State machine supports these states; routes can be added when needed |
| Payment integration | LOW | TODOs remain for transaction handling on reject/cancel |
| BookingStats aggregation | LOW | Stubbed in frontend; backend route pending |
| Frontend cache invalidation | LOW | Consider adding React Query invalidation after mutations |

---

## 2. Contract Alignment Summary

### 2.1 Final API Surface

#### Supported Endpoints (Backend Routes Exist)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/bookings` | List guest's bookings |
| `POST` | `/api/v1/bookings` | Create new booking (with server pricing) |
| `GET` | `/api/v1/bookings/{id}` | Show booking details |
| `PUT` | `/api/v1/bookings/{id}` | Update booking |
| `DELETE` | `/api/v1/bookings/{id}` | Cancel booking (guest action) |
| `GET` | `/api/v1/guest/bookings` | Paginated guest bookings with filters |
| `GET` | `/api/v1/host/bookings` | Host's property bookings |
| `POST` | `/api/v1/bookings/{id}/confirm` | Confirm booking (host action) |
| `POST` | `/api/v1/bookings/{id}/reject` | Reject booking (host action) |
| `GET` | `/api/v1/listings/{id}/reservations` | Listing availability calendar |
| `GET` | `/api/v1/host/listing-reservations` | Host calendar view |

#### Stubbed Methods (No Backend Route)

These methods exist in `src/services/bookingService.ts` but are marked as **unsupported stubs**:

```typescript
// @deprecated - No backend route exists
acceptBooking(bookingId: string)     // Use confirmBooking instead
markAsCheckedIn(bookingId: string)   // Route pending
markAsCheckedOut(bookingId: string)  // Route pending
markAsCompleted(bookingId: string)   // Route pending
getBookingStats()                    // Route pending
processPayment(bookingId: string)    // Route pending
refundBooking(bookingId: string)     // Route pending
```

### 2.2 Booking Model Shape

#### Frontend (`src/types/bookings.ts`)

```typescript
interface Booking {
  id: string;                    // ULID (was number)
  guest_id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  notes?: string | null;
  total: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  details: BookingDetail[];
  property?: Property;
}

interface BookingDetail {
  id: string;                    // ULID (was number)
  booking_id: string;            // ULID (was number)
  listing_id: string;
  nights: number;
  price_per_night: number;
  listing?: Listing;
}
```

#### Backend (`App\Models\Booking`)

```php
// Uses HasUlids trait - all IDs are ULIDs
protected $fillable = [
    'guest_id', 'property_id', 'check_in_date', 'check_out_date',
    'guest_count', 'notes', 'total', 'status'
];

protected $casts = [
    'check_in_date' => 'date',
    'check_out_date' => 'date',
    'total' => 'decimal:2',
];
```

---

## 3. Lifecycle & State Specification

### 3.1 Canonical Booking States

| State | Description | Terminal? |
|-------|-------------|-----------|
| `pending` | Booking created, awaiting host decision | No |
| `confirmed` | Host approved the booking | No |
| `rejected` | Host declined the booking | Yes |
| `cancelled` | Guest or host cancelled | Yes |
| `checked_in` | Guest has arrived | No |
| `checked_out` | Guest has departed | No |
| `completed` | Stay finished, review period ended | Yes |

### 3.2 State Transition Matrix

```
┌─────────────┬───────────────────────────────────────────────────────┐
│ From State  │ Allowed Transitions                                   │
├─────────────┼───────────────────────────────────────────────────────┤
│ pending     │ → confirmed, rejected, cancelled                      │
│ confirmed   │ → checked_in, cancelled, rejected (exceptional)       │
│ checked_in  │ → checked_out                                         │
│ checked_out │ → completed                                           │
│ rejected    │ (none - terminal)                                     │
│ cancelled   │ (none - terminal)                                     │
│ completed   │ (none - terminal)                                     │
└─────────────┴───────────────────────────────────────────────────────┘
```

### 3.3 State Transition Guards

All state transitions are enforced by `BookingService::transitionStatus()`:

```php
public function transitionStatus(
    Booking $booking,
    string $newStatus,
    ?string $triggeredBy = null,
    ?string $reason = null,
    array $metadata = []
): Booking {
    // Validates against ALLOWED_TRANSITIONS matrix
    // Dispatches appropriate domain event
    // Returns fresh booking instance
}
```

**Invalid transitions throw `ValidationException` with:**
```json
{
  "errors": {
    "status": ["Cannot transition booking from 'confirmed' to 'pending'. Allowed transitions: checked_in, cancelled, rejected"]
  }
}
```

---

## 4. Domain Events

### 4.1 Event Classes

| Event | Trigger | Key Data |
|-------|---------|----------|
| `BookingCreated` | Booking store | booking, guest_id |
| `BookingConfirmed` | Host confirms | booking, previous_status, host_id |
| `BookingRejected` | Host rejects | booking, previous_status, reason |
| `BookingCancelled` | Guest/host cancels | booking, cancelled_by, reason |
| `BookingStatusChanged` | Other transitions | booking, previous_status, new_status |

### 4.2 Event Payload Structure

All events extend `BookingEvent` and provide:

```php
public function getPayload(): array {
    return [
        'event_type' => $this->eventType,
        'booking_id' => $this->booking->id,
        'property_id' => $this->booking->property_id,
        'guest_id' => $this->booking->guest_id,
        'status' => $this->booking->status,
        'check_in_date' => $this->booking->check_in_date,
        'check_out_date' => $this->booking->check_out_date,
        'triggered_by' => $this->triggeredBy,
        'reason' => $this->reason,
        'metadata' => $this->metadata,
        'timestamp' => now()->toIso8601String(),
    ];
}
```

### 4.3 Activity Logging

All events are captured to `booking_activity_logs` table via `LogBookingActivity` subscriber:

```sql
CREATE TABLE booking_activity_logs (
    id              ULID PRIMARY KEY,
    booking_id      ULID REFERENCES bookings(id) ON DELETE CASCADE,
    event_type      VARCHAR(50),
    previous_status VARCHAR(30),
    new_status      VARCHAR(30),
    triggered_by    ULID REFERENCES users(id),
    actor_type      VARCHAR(20),  -- guest, host, system, admin
    reason          TEXT,
    metadata        JSON,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);
```

---

## 5. Notification Readiness Assessment

### 5.1 Prerequisites Met ✅

| Requirement | Status |
|-------------|--------|
| Deterministic state transitions | ✅ State machine with guards |
| Reliable event dispatch | ✅ Domain events after each transition |
| Actor identification | ✅ `triggered_by` user ID in all events |
| Audit trail | ✅ `booking_activity_logs` table |
| Consistent data shapes | ✅ ID types aligned, contracts documented |

### 5.2 Notification System Entry Points

The notification system should subscribe to these events:

```php
// In EventServiceProvider or dedicated NotificationSubscriber
BookingCreated::class => [
    // Notify host of new booking request
    SendNewBookingNotificationToHost::class,
],
BookingConfirmed::class => [
    // Notify guest of confirmation
    SendBookingConfirmedToGuest::class,
],
BookingRejected::class => [
    // Notify guest of rejection
    SendBookingRejectedToGuest::class,
],
BookingCancelled::class => [
    // Notify the OTHER party (host if guest cancelled, guest if host cancelled)
    SendBookingCancelledNotification::class,
],
```

### 5.3 Recommended Next Steps

1. **Create notification channels** (email, push, in-app)
2. **Implement `Notifiable` trait** on User model (if not present)
3. **Create notification classes** that consume booking events
4. **Add user notification preferences** table
5. **Set up queue workers** for async notification delivery

---

## 6. Files Changed

### Frontend

| File | Changes |
|------|---------|
| `src/types/bookings.ts` | ID types: `number` → `string` |
| `src/services/bookingService.ts` | All `bookingId` params → `string`; 7 methods stubbed |
| `src/pages/host/Bookings.tsx` | Mutation types updated |
| `src/hooks/useBookingChat.ts` | Removed `String()` wrappers |
| `src/components/shared/BookingCard.tsx` | Removed `.toString()` |
| `src/pages/chats/ChatRoomPage.tsx` | Removed `String()` wrapper |

### Backend

| File | Changes |
|------|---------|
| `app/Services/BookingService.php` | NEW - Availability, pricing, state machine |
| `app/Http/Controllers/.../BookingController.php` | Uses BookingService, dispatches events |
| `app/Events/BookingEvent.php` | NEW - Base event class |
| `app/Events/BookingCreated.php` | NEW - Created event |
| `app/Events/BookingConfirmed.php` | NEW - Confirmed event |
| `app/Events/BookingRejected.php` | NEW - Rejected event |
| `app/Events/BookingCancelled.php` | NEW - Cancelled event |
| `app/Events/BookingStatusChanged.php` | NEW - Generic transition event |
| `app/Listeners/LogBookingActivity.php` | NEW - Activity logging subscriber |
| `app/Models/BookingActivityLog.php` | NEW - Activity log model |
| `app/Providers/EventServiceProvider.php` | NEW - Event/listener registration |
| `database/migrations/..._create_booking_activity_logs_table.php` | NEW - Activity log schema |
| `bootstrap/providers.php` | Added EventServiceProvider |

---

## 7. Migration Notes

### Run Pending Migration

```bash
cd backend
php artisan migrate
```

This creates the `booking_activity_logs` table.

### Clear Caches (if needed)

```bash
php artisan config:clear
php artisan cache:clear
```

---

## 8. Conclusion

The booking subsystem is now **stabilized and ready for notification system implementation**. All structural risks have been addressed:

- **Type safety:** Frontend and backend now agree on ID formats
- **Contract clarity:** Unsupported methods are explicitly stubbed
- **Data integrity:** Server-side availability and pricing enforcement
- **State correctness:** Guarded transitions prevent invalid states
- **Observability:** Domain events + activity logs provide audit trail

The notification system can now safely subscribe to booking events knowing that:
1. Events fire only after successful state transitions
2. All necessary context (actor, reason, booking data) is included
3. The activity log provides a reliable event source for debugging

---

*Generated as part of the Pre-Notification Stabilization Task*
