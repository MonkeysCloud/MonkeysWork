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

#[RoutePrefix('/api/v1/ai/proposal')]
#[Middleware('auth')]
final class AiProposalAssistantController
{
    use ApiController;

    public function __construct(private ConnectionInterface $db)
    {
    }

    #[Route('POST', '/generate', name: 'ai.proposal.generate', summary: 'AI-generate a proposal draft', tags: ['AI'])]
    public function generate(ServerRequestInterface $request): JsonResponse
    {
        $userId = $this->userId($request);
        $data = $this->body($request);

        if (empty($data['job_id'])) {
            return $this->error('job_id is required');
        }

        // Fetch job details
        $stmt = $this->db->pdo()->prepare(
            'SELECT j.id, j.title, j.description, j.budget_type, j.budget_min, j.budget_max,
                    j.experience_level, c.name as category_name
             FROM "job" j
             LEFT JOIN "category" c ON c.id = j.category_id
             WHERE j.id = :id'
        );
        $stmt->execute(['id' => $data['job_id']]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$job) {
            return $this->notFound('Job');
        }

        // Fetch job skills
        $requiredSkills = [];
        try {
            $skillStmt = $this->db->pdo()->prepare(
                'SELECT s.name FROM "job_skill" js JOIN "skill" s ON s.id = js.skill_id WHERE js.job_id = :jid'
            );
            $skillStmt->execute(['jid' => $job['id']]);
            $requiredSkills = $skillStmt->fetchAll(\PDO::FETCH_COLUMN);
        } catch (\Throwable) {
        }

        // Fetch freelancer profile (display_name from user, bio/headline from freelancer_profile)
        $user = ['display_name' => '', 'bio' => '', 'headline' => ''];
        try {
            $userStmt = $this->db->pdo()->prepare(
                'SELECT u.display_name, fp.bio, fp.headline
                 FROM "user" u
                 LEFT JOIN "freelancer_profile" fp ON fp.user_id = u.id
                 WHERE u.id = :uid'
            );
            $userStmt->execute(['uid' => $userId]);
            $user = $userStmt->fetch(\PDO::FETCH_ASSOC) ?: $user;
        } catch (\Throwable) {
        }

        // Fetch freelancer skills
        $freelancerSkills = [];
        try {
            $fSkillStmt = $this->db->pdo()->prepare(
                'SELECT s.name FROM "freelancer_skills" fs JOIN "skill" s ON s.id = fs.skill_id WHERE fs.freelancer_id = :uid'
            );
            $fSkillStmt->execute(['uid' => $userId]);
            $freelancerSkills = $fSkillStmt->fetchAll(\PDO::FETCH_COLUMN);
        } catch (\Throwable) {
        }

        $proposalUrl = getenv('AI_PROPOSAL_URL') ?: 'http://ai-scope-assistant:8080/api/v1/proposal/generate';

        $payload = [
            'job_title' => $job['title'] ?? '',
            'job_description' => $job['description'] ?? '',
            'category' => $job['category_name'] ?? '',
            'required_skills' => $requiredSkills,
            'budget_min' => isset($job['budget_min']) ? (float) $job['budget_min'] : null,
            'budget_max' => isset($job['budget_max']) ? (float) $job['budget_max'] : null,
            'experience_level' => $job['experience_level'] ?? '',
            'freelancer_name' => $user['display_name'] ?? '',
            'freelancer_skills' => $freelancerSkills,
            'freelancer_bio' => $user['bio'] ?? ($user['headline'] ?? ''),
            'highlights' => $data['highlights'] ?? '',
            'tone' => $data['tone'] ?? 'professional',
        ];

        $ch = curl_init($proposalUrl);
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
                    'cover_letter' => '',
                    'suggested_bid' => 0,
                    'suggested_milestones' => [],
                    'suggested_duration_weeks' => 4,
                    'key_talking_points' => [],
                    'status' => 'ai_service_unavailable',
                ]
            ]);
        }

        return $this->json(['data' => json_decode($response, true)]);
    }
}
