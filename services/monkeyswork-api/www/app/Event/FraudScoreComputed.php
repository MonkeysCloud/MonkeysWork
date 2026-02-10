<?php
declare(strict_types=1);

namespace App\Event;

final class FraudScoreComputed extends DomainEvent
{
    public function __construct(
        public readonly string $entityType,
        public readonly string $entityId,
        public readonly float  $score,
        public readonly string $riskTier,
        public readonly string $recommendedAction,
    ) {
        parent::__construct();
    }

    public function getName(): string { return 'fraud.score_computed'; }
    public function getTopic(): string { return self::TOPIC_FRAUD; }

    protected function payload(): array
    {
        return [
            'entity_type'        => $this->entityType,
            'entity_id'          => $this->entityId,
            'score'              => $this->score,
            'risk_tier'          => $this->riskTier,
            'recommended_action' => $this->recommendedAction,
        ];
    }
}
