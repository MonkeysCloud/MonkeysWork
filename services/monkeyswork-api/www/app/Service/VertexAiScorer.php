<?php
declare(strict_types=1);

namespace App\Service;

/**
 * Content moderation scorer using Google Vertex AI (Gemini).
 *
 * In dev:  Uses a deterministic heuristic-based simulator.
 * In prod: Calls the Vertex AI Gemini REST API for real content analysis.
 *
 * Environment variables:
 *   APP_ENV            - 'dev' for simulation, anything else for real AI
 *   GCP_PROJECT_ID     - GCP project (default: 'monkeyswork')
 *   GCP_REGION         - Vertex AI region (default: 'us-central1')
 *   VERTEX_AI_MODEL    - Model name (default: 'gemini-2.0-flash')
 */
final class VertexAiScorer
{
    private string $env;
    private string $projectId;
    private string $region;
    private string $model;

    public function __construct()
    {
        $this->env       = getenv('APP_ENV') ?: 'prod';
        $this->projectId = getenv('GCP_PROJECT_ID') ?: 'monkeyswork';
        $this->region    = getenv('GCP_REGION') ?: 'us-central1';
        $this->model     = getenv('VERTEX_AI_MODEL') ?: 'gemini-3-flash-preview';
    }

    public function isSimulated(): bool
    {
        return $this->env === 'dev';
    }

    /* ================================================================== */
    /*  JOB MODERATION                                                     */
    /* ================================================================== */

    /**
     * Score a job posting for content quality and policy compliance.
     *
     * @param  array $job Associative array with title, description, budget_min, budget_max, etc.
     * @return array{confidence: float, quality: float, flags: string[], model: string}
     */
    public function scoreJob(array $job): array
    {
        if ($this->isSimulated()) {
            return $this->simulateJobScore($job);
        }

        return $this->vertexJobScore($job);
    }

    /* ================================================================== */
    /*  VERIFICATION SCORING                                               */
    /* ================================================================== */

    /**
     * Score a freelancer verification submission.
     *
     * @param  string $type  Verification type (identity, skill_assessment, portfolio, etc.)
     * @param  array  $data  Type-specific data payload
     * @return float  0.0–1.0 confidence score
     */
    public function scoreVerification(string $type, array $data = []): float
    {
        if ($this->isSimulated()) {
            return $this->simulateVerificationScore($type);
        }

        return $this->vertexVerificationScore($type, $data);
    }

    /* ================================================================== */
    /*  SIMULATED SCORERS (dev only)                                        */
    /* ================================================================== */

    private function simulateJobScore(array $job): array
    {
        $flags   = [];
        $quality = 0.5;

        // Title quality
        $titleLen = strlen($job['title'] ?? '');
        if ($titleLen >= 10) $quality += 0.1;
        if ($titleLen >= 25) $quality += 0.05;
        if ($titleLen < 5) { $flags[] = 'title_too_short'; $quality -= 0.2; }

        // Description quality
        $descLen = strlen(strip_tags($job['description'] ?? ''));
        if ($descLen >= 100) $quality += 0.15;
        if ($descLen >= 300) $quality += 0.1;
        if ($descLen < 30)  { $flags[] = 'description_too_short'; $quality -= 0.3; }

        // Budget reasonableness
        $budgetMin = (float)($job['budget_min'] ?? 0);
        $budgetMax = (float)($job['budget_max'] ?? 0);
        if ($budgetMax > 0 && $budgetMin > 0) {
            $quality += 0.1;
            if ($budgetMin > $budgetMax) { $flags[] = 'budget_invalid'; $quality -= 0.2; }
            if ($budgetMax > 1000000)    { $flags[] = 'budget_suspicious'; $quality -= 0.1; }
        }

        // Category & experience
        if (!empty($job['category_id']))       $quality += 0.05;
        if (!empty($job['experience_level']))   $quality += 0.05;

        // Random variance ±8%
        $variance = mt_rand(-8, 8) / 100.0;
        $confidence = max(0.0, min(1.0, $quality + $variance));

        return [
            'confidence' => round($confidence, 4),
            'quality'    => round($quality, 4),
            'flags'      => $flags,
            'model'      => 'simulated-dev-v1.0',
        ];
    }

    private function simulateVerificationScore(string $type): float
    {
        $baseScores = [
            'identity'         => 0.88,
            'skill_assessment' => 0.85,
            'portfolio'        => 0.90,
            'work_history'     => 0.82,
            'payment_method'   => 0.92,
        ];
        $base     = $baseScores[$type] ?? 0.80;
        $variance = mt_rand(-10, 10) / 100.0;

        return max(0.0, min(1.0, $base + $variance));
    }

    /* ================================================================== */
    /*  VERTEX AI (Gemini) SCORERS (prod)                                  */
    /* ================================================================== */

    private function vertexJobScore(array $job): array
    {
        $title       = $job['title'] ?? '';
        $description = strip_tags($job['description'] ?? '');
        $budgetMin   = $job['budget_min'] ?? 'N/A';
        $budgetMax   = $job['budget_max'] ?? 'N/A';
        $experience  = $job['experience_level'] ?? 'N/A';

        $prompt = <<<PROMPT
You are an AI content moderator for a freelance marketplace called MonkeysWork.
Evaluate this job posting for quality, legitimacy, and policy compliance.

JOB POSTING:
- Title: {$title}
- Description: {$description}
- Budget Range: \${$budgetMin} – \${$budgetMax}
- Experience Level: {$experience}

EVALUATE for:
1. Content quality (clear title, detailed description, reasonable budget)
2. Policy compliance (no spam, scam, discrimination, illegal content, personal info sharing)
3. Legitimacy (real job, not misleading, reasonable expectations)

Respond in STRICT JSON format only, no markdown, no text before or after:
{
  "confidence": <float 0.0-1.0, overall confidence the job is legitimate and high-quality>,
  "quality": <float 0.0-1.0, content quality score>,
  "flags": [<array of issue strings, empty if none>],
  "reasoning": "<brief 1-2 sentence explanation>"
}
PROMPT;

        $result = $this->callGemini($prompt);

        if ($result === null) {
            // Fallback to simulation if Vertex AI fails
            error_log('[VertexAiScorer] Gemini call failed for job scoring, falling back to simulation');
            return $this->simulateJobScore($job);
        }

        return [
            'confidence' => (float)($result['confidence'] ?? 0.5),
            'quality'    => (float)($result['quality'] ?? 0.5),
            'flags'      => (array)($result['flags'] ?? []),
            'model'      => "vertex-ai/{$this->model}",
        ];
    }

    private function vertexVerificationScore(string $type, array $data): float
    {
        $dataJson = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        $prompt = <<<PROMPT
You are an AI verifier for a freelance marketplace called MonkeysWork.
Evaluate this {$type} verification submission.

SUBMISSION DATA:
{$dataJson}

EVALUATE for:
1. Completeness of the submitted information
2. Consistency and plausibility
3. Signs of fraud or suspicious content

Respond in STRICT JSON format only, no markdown, no text before or after:
{
  "confidence": <float 0.0-1.0, confidence the verification is legitimate>,
  "reasoning": "<brief 1-2 sentence explanation>"
}
PROMPT;

        $result = $this->callGemini($prompt);

        if ($result === null) {
            error_log('[VertexAiScorer] Gemini call failed for verification scoring, falling back to simulation');
            return $this->simulateVerificationScore($type);
        }

        return (float)($result['confidence'] ?? 0.5);
    }

    /* ================================================================== */
    /*  VERTEX AI REST API (Gemini)                                        */
    /* ================================================================== */

    /**
     * Call Gemini via the Vertex AI REST API.
     * Uses application default credentials (workload identity on GKE).
     *
     * @param  string $prompt  The prompt text
     * @return array|null      Parsed JSON response, or null on failure
     */
    private function callGemini(string $prompt): ?array
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                error_log('[VertexAiScorer] Could not obtain access token');
                return null;
            }

            $url = sprintf(
                'https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent',
                $this->region,
                $this->projectId,
                $this->region,
                $this->model
            );

            $payload = [
                'contents' => [
                    [
                        'role'  => 'user',
                        'parts' => [['text' => $prompt]],
                    ],
                ],
                'generationConfig' => [
                    'temperature'     => 0.1,       // Low temperature for consistent scoring
                    'maxOutputTokens' => 512,
                    'topP'            => 0.8,
                    'responseMimeType' => 'application/json',
                ],
                'safetySettings' => [
                    ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
                ],
            ];

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload, JSON_THROW_ON_ERROR),
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    "Authorization: Bearer {$accessToken}",
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_CONNECTTIMEOUT => 10,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr  = curl_error($ch);
            curl_close($ch);

            if ($curlErr) {
                error_log("[VertexAiScorer] cURL error: {$curlErr}");
                return null;
            }

            if ($httpCode !== 200) {
                error_log("[VertexAiScorer] Vertex AI returned HTTP {$httpCode}: " . substr($response, 0, 500));
                return null;
            }

            $body = json_decode($response, true);
            $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$text) {
                error_log('[VertexAiScorer] No text in Gemini response');
                return null;
            }

            // Strip potential markdown fences
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```\s*$/', '', $text);

            $parsed = json_decode(trim($text), true);
            if (!is_array($parsed)) {
                error_log('[VertexAiScorer] Could not parse Gemini JSON: ' . substr($text, 0, 200));
                return null;
            }

            return $parsed;
        } catch (\Throwable $e) {
            error_log('[VertexAiScorer] Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Obtain a GCP access token using workload identity (GKE)
     * or application default credentials.
     */
    private function getAccessToken(): ?string
    {
        // 1. Try the GKE metadata server (workload identity)
        $ch = curl_init('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token');
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => ['Metadata-Flavor: Google'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 2,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (!empty($data['access_token'])) {
                return $data['access_token'];
            }
        }

        // 2. Fallback: try gcloud CLI (for local dev with prod credentials)
        $token = trim((string)shell_exec('gcloud auth print-access-token 2>/dev/null'));
        if ($token && strlen($token) > 20) {
            return $token;
        }

        return null;
    }
}
