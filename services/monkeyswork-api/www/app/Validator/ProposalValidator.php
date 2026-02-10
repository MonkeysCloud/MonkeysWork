<?php
declare(strict_types=1);

namespace App\Validator;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;

/**
 * ProposalValidator — validates proposal submission input.
 *
 * Rules:
 *   job_id                   — required, UUID
 *   cover_letter             — required, 50+ characters
 *   bid_amount               — required, positive number
 *   estimated_duration_weeks — required, 1-52
 */
final class ProposalValidator
{
    public function validate(array $data): array
    {
        $errors = [];

        // job_id
        if (empty($data['job_id'])) {
            $errors['job_id'] = 'Job ID is required.';
        } elseif (!preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $data['job_id']
        )) {
            $errors['job_id'] = 'Job ID must be a valid UUID.';
        }

        // cover_letter
        if (empty($data['cover_letter'])) {
            $errors['cover_letter'] = 'Cover letter is required.';
        } elseif (mb_strlen($data['cover_letter']) < 50) {
            $errors['cover_letter'] = 'Cover letter must be at least 50 characters.';
        }

        // bid_amount
        if (!isset($data['bid_amount'])) {
            $errors['bid_amount'] = 'Bid amount is required.';
        } elseif (!is_numeric($data['bid_amount']) || (float) $data['bid_amount'] <= 0) {
            $errors['bid_amount'] = 'Bid amount must be a positive number.';
        }

        // estimated_duration_weeks
        if (!isset($data['estimated_duration_weeks'])) {
            $errors['estimated_duration_weeks'] = 'Estimated duration is required.';
        } elseif (
            !is_numeric($data['estimated_duration_weeks'])
            || (int) $data['estimated_duration_weeks'] < 1
            || (int) $data['estimated_duration_weeks'] > 52
        ) {
            $errors['estimated_duration_weeks'] = 'Estimated duration must be between 1 and 52 weeks.';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    public function validateOrFail(array $data): ?ResponseInterface
    {
        $result = $this->validate($data);
        if (!$result['valid']) {
            return new JsonResponse([
                'error'   => 'Validation failed',
                'details' => $result['errors'],
            ], 422);
        }
        return null;
    }
}
