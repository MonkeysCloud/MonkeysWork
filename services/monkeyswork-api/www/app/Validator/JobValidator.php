<?php
declare(strict_types=1);

namespace App\Validator;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;

/**
 * JobValidator — validates job creation / update input.
 *
 * Rules:
 *   title            — required, 3-200 characters
 *   description      — required, 20+ characters
 *   budget_type      — required, one of: fixed, hourly
 *   budget_min       — required, positive number
 *   budget_max       — required, positive number, >= budget_min
 *   category_id      — required, UUID
 *   experience_level — optional, one of: entry, intermediate, expert
 */
final class JobValidator
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

        // description
        if (empty($data['description'])) {
            $errors['description'] = 'Description is required.';
        } elseif (mb_strlen($data['description']) < 20) {
            $errors['description'] = 'Description must be at least 20 characters.';
        }

        // budget_type
        $budgetTypes = ['fixed', 'hourly'];
        if (empty($data['budget_type'])) {
            $errors['budget_type'] = 'Budget type is required.';
        } elseif (!in_array($data['budget_type'], $budgetTypes, true)) {
            $errors['budget_type'] = 'Budget type must be one of: ' . implode(', ', $budgetTypes) . '.';
        }

        // budget_min
        if (!isset($data['budget_min'])) {
            $errors['budget_min'] = 'Minimum budget is required.';
        } elseif (!is_numeric($data['budget_min']) || (float) $data['budget_min'] <= 0) {
            $errors['budget_min'] = 'Minimum budget must be a positive number.';
        }

        // budget_max
        if (!isset($data['budget_max'])) {
            $errors['budget_max'] = 'Maximum budget is required.';
        } elseif (!is_numeric($data['budget_max']) || (float) $data['budget_max'] <= 0) {
            $errors['budget_max'] = 'Maximum budget must be a positive number.';
        } elseif (
            isset($data['budget_min'])
            && is_numeric($data['budget_min'])
            && (float) $data['budget_max'] < (float) $data['budget_min']
        ) {
            $errors['budget_max'] = 'Maximum budget must be greater than or equal to minimum budget.';
        }

        // category_id
        if (empty($data['category_id'])) {
            $errors['category_id'] = 'Category is required.';
        } elseif (!preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $data['category_id']
        )) {
            $errors['category_id'] = 'Category ID must be a valid UUID.';
        }

        // experience_level (optional)
        if (!empty($data['experience_level'])) {
            $levels = ['entry', 'intermediate', 'expert'];
            if (!in_array($data['experience_level'], $levels, true)) {
                $errors['experience_level'] = 'Experience level must be one of: ' . implode(', ', $levels) . '.';
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
