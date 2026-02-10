<?php
declare(strict_types=1);

namespace App\Service;

/**
 * SocketEvent — Publishes real-time events to Redis for Socket.IO relay.
 *
 * The Socket.IO server subscribes to the `mw:events` Redis channel and
 * forwards events to the correct Socket.IO namespace/room.
 *
 * Usage:
 *   $socket = new SocketEvent($redis);
 *   $socket->toUser($userId, 'notification:new', ['title' => 'Hello']);
 *   $socket->toConversation($conversationId, 'message:new', [...]);
 *   $socket->toContract($contractId, 'milestone:status', [...]);
 */
class SocketEvent
{
    private const CHANNEL = 'mw:events';

    private const NS_NOTIFICATIONS = '/notifications';
    private const NS_MESSAGES      = '/messages';
    private const NS_CONTRACTS     = '/contracts';

    public function __construct(
        private readonly \Redis $redis,
    ) {}

    // ── High-level emitters ──

    /**
     * Send a notification event to a specific user.
     */
    public function toUser(string $userId, string $event, array $data): void
    {
        $this->emit(self::NS_NOTIFICATIONS, $event, "user:{$userId}", $data);
    }

    /**
     * Send a message event to a conversation room.
     */
    public function toConversation(string $conversationId, string $event, array $data): void
    {
        $this->emit(self::NS_MESSAGES, $event, "conversation:{$conversationId}", $data);
    }

    /**
     * Send a contract-related event (milestone, escrow, dispute, invoice).
     */
    public function toContract(string $contractId, string $event, array $data): void
    {
        $this->emit(self::NS_CONTRACTS, $event, "contract:{$contractId}", $data);
    }

    // ── Core publish ──

    /**
     * Publish a raw event to Redis for Socket.IO relay.
     *
     * @param string $namespace  Socket.IO namespace (e.g. /notifications)
     * @param string $event      Event name (e.g. notification:new)
     * @param string $room       Target room (e.g. user:<uuid>)
     * @param array  $data       Event payload
     */
    public function emit(string $namespace, string $event, string $room, array $data): void
    {
        $payload = json_encode([
            'namespace' => $namespace,
            'event'     => $event,
            'room'      => $room,
            'data'      => $data,
        ], JSON_THROW_ON_ERROR);

        $this->redis->publish(self::CHANNEL, $payload);
    }
}
