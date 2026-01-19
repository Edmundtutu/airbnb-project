<?php

namespace App\Services\Admin;

use App\Models\KYCSubmission;
use App\Models\Admin;
use App\Models\User;
use App\Services\Admin\ActivityLogService;

class KYCReviewService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    public function reviewSubmission(KYCSubmission $submission, Admin $admin, string $decision, ?string $notes = null): KYCSubmission
    {
        if (!in_array($decision, ['approved', 'rejected'])) {
            throw new \Exception('Invalid decision. Must be approved or rejected.');
        }

        $submission->update([
            'status' => $decision,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'review_notes' => $notes,
        ]);

        // Update vendor onboarding state if all KYC documents are approved
        if ($decision === 'approved') {
            $this->checkAllKYCApproved($submission->user, $admin);
        }

        $this->activityLogService->log(
            admin: $admin,
            action: "kyc.{$decision}",
            entity: $submission,
            description: "KYC submission {$submission->document_type} {$decision} by {$admin->name}",
            metadata: ['submission_id' => $submission->id, 'notes' => $notes]
        );

        return $submission->fresh();
    }

    public function bulkReview(array $submissionIds, Admin $admin, string $decision): array
    {
        $submissions = KYCSubmission::whereIn('id', $submissionIds)
            ->where('status', 'pending')
            ->get();

        $results = [];
        foreach ($submissions as $submission) {
            try {
                $results[] = $this->reviewSubmission($submission, $admin, $decision);
            } catch (\Exception $e) {
                // Log error but continue with other submissions
                \Log::error("Failed to review KYC submission {$submission->id}: " . $e->getMessage());
            }
        }

        return $results;
    }

    public function requestAdditionalDocuments(User $user, Admin $admin, array $requiredTypes): void
    {
        $this->activityLogService->log(
            admin: $admin,
            action: 'kyc.additional_documents_requested',
            entity: $user,
            description: "Additional KYC documents requested for {$user->name} by {$admin->name}",
            metadata: ['required_types' => $requiredTypes]
        );
    }

    private function checkAllKYCApproved(User $user, Admin $admin): void
    {
        $pendingCount = KYCSubmission::where('user_id', $user->id)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount === 0) {
            $onboardingState = $user->onboardingState;
            if ($onboardingState && $onboardingState->state === 'under_review') {
                $onboardingState->update([
                    'kyc_verified_at' => now(),
                    'kyc_verified_by' => $admin->id,
                ]);
            }
        }
    }
}
