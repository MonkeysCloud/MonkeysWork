<?php
declare(strict_types=1);

namespace App\Event;

/**
 * Base class for all MonkeysWork domain events.
 *
 * Follows the same pattern as MonkeysLegion\Auth\Event\AuthEvent.
 * Each event carries entity IDs, a Pub/Sub topic, and metadata.
 */
abstract class DomainEvent
{
    /* ── Pub/Sub Topics ─────────────────────────────── */
    public const TOPIC_JOB           = 'job-events';
    public const TOPIC_PROPOSAL      = 'proposal-events';
    public const TOPIC_MILESTONE     = 'milestone-events';
    public const TOPIC_VERIFICATION  = 'verification-events';
    public const TOPIC_FRAUD         = 'fraud-events';
    public const TOPIC_AUDIT         = 'audit-events';

    public readonly int $occurredAt;
    public array $metadata = [];

    public function __construct()
    {
        $this->occurredAt = time();
    }

    public function withMetadata(array $metadata): static
    {
        $this->metadata = array_merge($this->metadata, $metadata);
        return $this;
    }

    /** Unique event name, e.g. "job.created". */
    abstract public function getName(): string;

    /** Pub/Sub topic this event should be published to. */
    abstract public function getTopic(): string;

    /** Serialise to array for Pub/Sub / audit sink. */
    public function toArray(): array
    {
        return [
            'event'       => $this->getName(),
            'topic'       => $this->getTopic(),
            'occurred_at' => $this->occurredAt,
            'metadata'    => $this->metadata,
            'payload'     => $this->payload(),
        ];
    }

    /** Override in subclasses to include entity-specific data. */
    abstract protected function payload(): array;
}
