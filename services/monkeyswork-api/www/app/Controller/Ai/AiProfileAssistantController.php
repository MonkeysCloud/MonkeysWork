<?php
declare(strict_types=1);

namespace App\Controller\Ai;

use App\Controller\ApiController;
use MonkeysLegion\Database\Contracts\ConnectionInterface;
use MonkeysLegion\Http\Message\JsonResponse;
use MonkeysLegion\Router\Attributes\Middleware;
use MonkeysLegion\Router\Attributes\Route;
use MonkeysLegion\Router\Attributes\RoutePrefix;
use Psr\Http\Message\ServerRequestInterface;

#[RoutePrefix('/api/v1/ai/profile')]
#[Middleware('auth')]
final class AiProfileAssistantController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    /**
     * AI-generate an optimized headline and bio for the freelancer.
     */
    #[Route('POST', '/enhance', name: 'ai.profile.enhance', summary: 'AI-generate profile headline and bio', tags: ['AI'])]
    public function enhance(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        // Fetch current profile data
        $user = ['display_name' => '', 'bio' => '', 'headline' => '', 'experience_years' => 0];
        try {
            $stmt = $this->db->pdo()->prepare(
                'SELECT u.display_name, fp.bio, fp.headline, fp.experience_years
                 FROM "user" u
                 LEFT JOIN "freelancer_profile" fp ON fp.user_id = u.id
                 WHERE u.id = :uid'
            );
            $stmt->execute(['uid' => $userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC) ?: $user;
        } catch (\Throwable) {
        }

        // Fetch freelancer skills
        $skills = [];
        try {
            $skillStmt = $this->db->pdo()->prepare(
                'SELECT s.name FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id WHERE fs.freelancer_id = :uid'
            );
            $skillStmt->execute(['uid' => $userId]);
            $skills = $skillStmt->fetchAll(\PDO::FETCH_COLUMN);
        } catch (\Throwable) {
        }

        $aiUrl = getenv('AI_PROFILE_URL') ?: 'http://ai-scope-assistant:8080/api/v1/profile/enhance';

        $payload = [
            'name' => $user['display_name'] ?? '',
            'current_headline' => $data['current_headline'] ?? ($user['headline'] ?? ''),
            'current_bio' => $data['current_bio'] ?? ($user['bio'] ?? ''),
            'skills' => !empty($data['skills']) ? $data['skills'] : $skills,
            'experience_years' => (int) ($data['experience_years'] ?? $user['experience_years'] ?? 0),
            'tone' => $data['tone'] ?? 'professional',
        ];

        $ch = curl_init($aiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 15000,
            CURLOPT_CONNECTTIMEOUT_MS => 2000,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json([
                'data' => [
                    'headline' => '',
                    'bio' => '',
                    'status' => 'ai_service_unavailable',
                ]
            ]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }

    /**
     * AI-suggest skills based on the freelancer's profile.
     */
    #[Route('POST', '/suggest-skills', name: 'ai.profile.suggest_skills', summary: 'AI-suggest relevant skills', tags: ['AI'])]
    public function suggestSkills(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        // Fetch current profile data
        $user = ['headline' => '', 'bio' => '', 'experience_years' => 0];
        try {
            $stmt = $this->db->pdo()->prepare(
                'SELECT fp.headline, fp.bio, fp.experience_years
                 FROM "freelancer_profile" fp WHERE fp.user_id = :uid'
            );
            $stmt->execute(['uid' => $userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC) ?: $user;
        } catch (\Throwable) {
        }

        // Fetch current skills
        $currentSkills = [];
        try {
            $skillStmt = $this->db->pdo()->prepare(
                'SELECT s.name FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id WHERE fs.freelancer_id = :uid'
            );
            $skillStmt->execute(['uid' => $userId]);
            $currentSkills = $skillStmt->fetchAll(\PDO::FETCH_COLUMN);
        } catch (\Throwable) {
        }

        $aiUrl = getenv('AI_SKILLS_URL') ?: 'http://ai-scope-assistant:8080/api/v1/profile/suggest-skills';

        $payload = [
            'headline' => $data['headline'] ?? ($user['headline'] ?? ''),
            'bio' => $data['bio'] ?? ($user['bio'] ?? ''),
            'experience_years' => (int) ($data['experience_years'] ?? $user['experience_years'] ?? 0),
            'current_skills' => !empty($data['current_skills']) ? $data['current_skills'] : $currentSkills,
        ];

        $ch = curl_init($aiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT_MS => 15000,
            CURLOPT_CONNECTTIMEOUT_MS => 2000,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            return $this->json([
                'data' => [
                    'suggested_skills' => [],
                    'status' => 'ai_service_unavailable',
                ]
            ]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
