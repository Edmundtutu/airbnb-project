<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\Admin;
use App\Models\VendorOnboardingState;
use App\Services\Admin\ActivityLogService;

class VendorOnboardingService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    public function submitForReview(User $user): VendorOnboardingState
    {
        $state = VendorOnboardingState::firstOrCreate(
            ['user_id' => $user->id],
            ['state' => 'pending']
        );

        if ($state->state === 'pending') {
            $state->update([
                'state' => 'under_review',
                'previous_state' => 'pending',
                'submitted_at' => now(),
            ]);

            $user->update(['onboarding_state_id' => $state->id]);
        }

        return $state->fresh();
    }

    public function approve(User $user, Admin $admin, ?string $notes = null): VendorOnboardingState
    {
        $state = $user->onboardingState ?? VendorOnboardingState::where('user_id', $user->id)->first();

        if (!$state || !$state->canTransitionTo('approved')) {
            throw new \Exception('Cannot approve vendor from current state.');
        }

        $previousState = $state->state;
        $state->update([
            'state' => 'approved',
            'previous_state' => $previousState,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'internal_notes' => $notes,
        ]);

        $user->update(['onboarding_state_id' => $state->id]);

        $this->activityLogService->log(
            admin: $admin,
            action: 'vendor.approved',
            entity: $user,
            description: "Vendor {$user->name} approved by {$admin->name}",
            metadata: ['previous_state' => $previousState, 'notes' => $notes]
        );

        return $state->fresh();
    }

    public function reject(User $user, Admin $admin, string $reason): VendorOnboardingState
    {
        $state = $user->onboardingState ?? VendorOnboardingState::where('user_id', $user->id)->first();

        if (!$state || !$state->canTransitionTo('rejected')) {
            throw new \Exception('Cannot reject vendor from current state.');
        }

        $previousState = $state->state;
        $state->update([
            'state' => 'rejected',
            'previous_state' => $previousState,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        $user->update(['onboarding_state_id' => $state->id]);

        $this->activityLogService->log(
            admin: $admin,
            action: 'vendor.rejected',
            entity: $user,
            description: "Vendor {$user->name} rejected by {$admin->name}",
            metadata: ['previous_state' => $previousState, 'reason' => $reason]
        );

        return $state->fresh();
    }

    public function suspend(User $user, Admin $admin, string $reason): VendorOnboardingState
    {
        $state = $user->onboardingState ?? VendorOnboardingState::where('user_id', $user->id)->first();

        if (!$state || !$state->canTransitionTo('suspended')) {
            throw new \Exception('Cannot suspend vendor from current state.');
        }

        $previousState = $state->state;
        $state->update([
            'state' => 'suspended',
            'previous_state' => $previousState,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'suspension_reason' => $reason,
        ]);

        $user->update(['onboarding_state_id' => $state->id]);

        $this->activityLogService->log(
            admin: $admin,
            action: 'vendor.suspended',
            entity: $user,
            description: "Vendor {$user->name} suspended by {$admin->name}",
            metadata: ['previous_state' => $previousState, 'reason' => $reason]
        );

        return $state->fresh();
    }

    public function requestResubmission(User $user, Admin $admin, string $instructions): VendorOnboardingState
    {
        $state = $user->onboardingState ?? VendorOnboardingState::where('user_id', $user->id)->first();

        if (!$state || $state->state !== 'rejected') {
            throw new \Exception('Can only request resubmission from rejected state.');
        }

        $state->update([
            'state' => 'pending',
            'previous_state' => 'rejected',
            'rejection_reason' => null,
        ]);

        $this->activityLogService->log(
            admin: $admin,
            action: 'vendor.resubmission_requested',
            entity: $user,
            description: "Resubmission requested for vendor {$user->name} by {$admin->name}",
            metadata: ['instructions' => $instructions]
        );

        return $state->fresh();
    }
}
