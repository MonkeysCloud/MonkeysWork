<?php
declare(strict_types=1);

namespace App\Event;

final class ReviewCreated extends DomainEvent
{
    public function __construct(
        public readonly string $reviewId,
        public readonly string $contractId,
        public readonly string $reviewerId,
        public readonly string $revieweeId,
        public readonly int    $rating,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'review.created'; }
    public function getTopic(): string { return self::TOPIC_AUDIT; }

    protected function payload(): array
    {
        return [
            'review_id'   => $this->reviewId,
            'contract_id' => $this->contractId,
            'reviewer_id' => $this->reviewerId,
            'reviewee_id' => $this->revieweeId,
            'rating'      => $this->rating,
        ];
    }
}
