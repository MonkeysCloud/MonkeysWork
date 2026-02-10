<?php
declare(strict_types=1);

namespace App\Middleware;

use MonkeysLegion\Http\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use MonkeysLegion\Router\Middleware\MiddlewareInterface;

/**
 * RoleGuard — lightweight role-based access control middleware.
 *
 * Used via route attribute: #[Middleware('role:admin')] or #[Middleware('role:admin,ops')]
 * Checks `user.role` from the request attributes set by AuthMiddleware.
 *
 * The framework's AuthorizationMiddleware uses reflection + attributes;
 * this is a simpler inline guard for route-level role checks.
 */
final class RoleGuard implements MiddlewareInterface
{
    /** @var string[] */
    private array $allowedRoles;

    /**
     * @param string $roles  Comma-separated list of allowed roles, e.g. "admin,ops"
     */
    public function __construct(string $roles)
    {
        $this->allowedRoles = array_map('trim', explode(',', $roles));
    }

    public function process(ServerRequestInterface $request, callable $next): ResponseInterface
    {
        $user = $request->getAttribute('user');

        if (!$user) {
            return new JsonResponse(['error' => 'Unauthenticated'], 401);
        }

        // Support both property access and method access
        $role = match (true) {
            method_exists($user, 'getRole') => (string) $user->getRole(),
            isset($user->role)              => (string) $user->role,
            default                         => '',
        };

        // Handle backed enum values
        if (is_object($role) && property_exists($role, 'value')) {
            $role = $role->value;
        }

        if (!in_array($role, $this->allowedRoles, true)) {
            return new JsonResponse([
                'error'   => 'Forbidden',
                'message' => 'Insufficient role. Required: ' . implode(' or ', $this->allowedRoles),
            ], 403);
        }

        return $next($request);
    }
}
