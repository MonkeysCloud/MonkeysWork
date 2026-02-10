<?php
declare(strict_types=1);

namespace App\Validator;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;

/**
 * MilestoneValidator — validates milestone creation / update input.
 *
 * Rules:
 *   title    — required, 3-200 characters
 *   amount   — required, positive number
 *   due_date — required, valid date (Y-m-d), must be in the future
 */
final class MilestoneValidator
{
    public function validate(array $data): array
    {
        $errors = [];

        // title
        if (empty($data['title'])) {
            $errors['title'] = 'Title is required.';
        } else {
            $len = mb_strlen($data['title']);
            if ($len < 3 || $len > 200) {
                $errors['title'] = 'Title must be between 3 and 200 characters.';
            }
        }

        // amount
        if (!isset($data['amount'])) {
            $errors['amount'] = 'Amount is required.';
        } elseif (!is_numeric($data['amount']) || (float) $data['amount'] <= 0) {
            $errors['amount'] = 'Amount must be a positive number.';
        }

        // due_date
        if (empty($data['due_date'])) {
            $errors['due_date'] = 'Due date is required.';
        } else {
            $date = \DateTimeImmutable::createFromFormat('Y-m-d', $data['due_date']);
            if (!$date || $date->format('Y-m-d') !== $data['due_date']) {
                $errors['due_date'] = 'Due date must be a valid date in Y-m-d format.';
            } elseif ($date <= new \DateTimeImmutable('today')) {
                $errors['due_date'] = 'Due date must be in the future.';
            }
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
