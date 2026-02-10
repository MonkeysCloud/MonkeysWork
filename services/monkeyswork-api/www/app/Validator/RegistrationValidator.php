<?php
declare(strict_types=1);

namespace App\Validator;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;

/**
 * RegistrationValidator — validates user registration input.
 *
 * Rules:
 *   email         — required, valid email format
 *   password      — required, min 8 characters
 *   display_name  — required, 2-100 characters
 *   role          — required, one of: freelancer, client
 */
final class RegistrationValidator
{
    /**
     * Validate registration data.
     *
     * @param  array $data  Parsed request body
     * @return array{valid: bool, errors: array<string, string>}
     */
    public function validate(array $data): array
    {
        $errors = [];

        // email
        if (empty($data['email'])) {
            $errors['email'] = 'Email is required.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format.';
        }

        // password
        if (empty($data['password'])) {
            $errors['password'] = 'Password is required.';
        } elseif (mb_strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters.';
        }

        // display_name
        if (empty($data['display_name'])) {
            $errors['display_name'] = 'Display name is required.';
        } else {
            $len = mb_strlen($data['display_name']);
            if ($len < 2 || $len > 100) {
                $errors['display_name'] = 'Display name must be between 2 and 100 characters.';
            }
        }

        // role
        $allowedRoles = ['freelancer', 'client'];
        if (empty($data['role'])) {
            $errors['role'] = 'Role is required.';
        } elseif (!in_array($data['role'], $allowedRoles, true)) {
            $errors['role'] = 'Role must be one of: ' . implode(', ', $allowedRoles) . '.';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    /**
     * Validate and return a JSON error response if invalid.
     *
     * @return ResponseInterface|null  Null if valid, JsonResponse if invalid.
     */
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
