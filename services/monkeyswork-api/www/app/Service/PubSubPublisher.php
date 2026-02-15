<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Publishes domain events to Google Cloud Pub/Sub.
 *
 * In dev: uses the Pub/Sub emulator (PUBSUB_EMULATOR_HOST env).
 * In prod: uses real Pub/Sub with service-account credentials.
 *
 * The PHP API publishes fire-and-forget; AI services subscribe.
 */
final class PubSubPublisher
{
    private string $projectId;
    private ?string $emulatorHost;

    /** @var array<string, bool>  topics we've already confirmed exist */
    private array $ensuredTopics = [];

    public function __construct()
    {
        $this->projectId    = getenv('GCP_PROJECT_ID') ?: 'monkeyswork';
        $this->emulatorHost = getenv('PUBSUB_EMULATOR_HOST') ?: null;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Publish a message to a Pub/Sub topic.
     *
     * @param string $topic   Topic name, e.g. "user-registered"
     * @param array  $payload Associative array — will be JSON-encoded
     * @param array  $attrs   Optional Pub/Sub message attributes
     */
    public function publish(string $topic, array $payload, array $attrs = []): void
    {
        $this->ensureTopic($topic);

        $message = [
            'messages' => [
                [
                    'data'       => base64_encode(json_encode($payload, JSON_THROW_ON_ERROR)),
                    'attributes' => $attrs ?: new \stdClass(),
                ],
            ],
        ];

        $url = $this->baseUrl() . "/v1/projects/{$this->projectId}/topics/{$topic}:publish";

        $this->httpPost($url, $message);
    }

    /* ------------------------------------------------------------------ */
    /*  Convenience methods for specific events                            */
    /* ------------------------------------------------------------------ */

    public function userRegistered(string $userId, string $role, string $email): void
    {
        $this->publish('user-registered', [
            'event'     => 'user_registered',
            'user_id'   => $userId,
            'role'      => $role,
            'email'     => $email,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    public function verificationSubmitted(string $verificationId, string $userId, string $type): void
    {
        $this->publish('verification-submitted', [
            'event'           => 'verification_submitted',
            'verification_id' => $verificationId,
            'user_id'         => $userId,
            'type'            => $type,
            'timestamp'       => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    public function profileReady(string $userId): void
    {
        $this->publish('profile-ready', [
            'event'     => 'profile_ready',
            'user_id'   => $userId,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    public function jobPublished(string $jobId, array $jobData): void
    {
        $this->publish('job-published', array_merge([
            'event'     => 'job_published',
            'job_id'    => $jobId,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ], $jobData));
    }

    public function proposalSubmitted(string $proposalId, string $jobId, string $freelancerId): void
    {
        $this->publish('proposal-submitted', [
            'event'         => 'proposal_submitted',
            'proposal_id'   => $proposalId,
            'job_id'        => $jobId,
            'freelancer_id' => $freelancerId,
            'timestamp'     => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  HTTP helpers (curl-based, no extra dependencies)                    */
    /* ------------------------------------------------------------------ */

    private function ensureTopic(string $topic): void
    {
        if (isset($this->ensuredTopics[$topic])) {
            return;
        }

        // Only auto-create on emulator (dev)
        if ($this->emulatorHost) {
            $url = $this->baseUrl() . "/v1/projects/{$this->projectId}/topics/{$topic}";
            $this->httpPut($url);

            // Also ensure a default subscription so messages aren't dropped
            $subUrl = $this->baseUrl()
                . "/v1/projects/{$this->projectId}/subscriptions/{$topic}-sub";
            $this->httpPut($subUrl, [
                'topic' => "projects/{$this->projectId}/topics/{$topic}",
            ]);
        }

        $this->ensuredTopics[$topic] = true;
    }

    private function baseUrl(): string
    {
        if ($this->emulatorHost) {
            return "http://{$this->emulatorHost}";
        }
        return 'https://pubsub.googleapis.com';
    }

    private function httpPost(string $url, array $body): void
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($body, JSON_THROW_ON_ERROR),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 2,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    private function httpPut(string $url, array $body = []): void
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => 'PUT',
            CURLOPT_POSTFIELDS     => json_encode($body ?: new \stdClass(), JSON_THROW_ON_ERROR),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 2,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
