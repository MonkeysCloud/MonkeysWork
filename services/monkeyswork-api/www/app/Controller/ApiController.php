<?php
declare(strict_types=1);

namespace App\Controller;

use MonkeysLegion\Http\Message\JsonResponse;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Shared helpers for all API controllers.
 */
trait ApiController
{
    /**
     * Return a success JSON response.
     */
    protected function json(mixed $data, int $status = 200): JsonResponse
    {
        return new JsonResponse($data, $status);
    }

    /**
     * Return a JSON error response.
     */
    protected function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $payload = ['error' => true, 'message' => $message];
        if ($errors) {
            $payload['errors'] = $errors;
        }
        return new JsonResponse($payload, $status);
    }

    /**
     * Return a 404 Not Found response.
     */
    protected function notFound(string $entity = 'Resource'): JsonResponse
    {
        return $this->error("{$entity} not found", 404);
    }

    /**
     * Return a 403 Forbidden response.
     */
    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403);
    }

    /**
     * Return a 201 Created response.
     */
    protected function created(mixed $data): JsonResponse
    {
        return new JsonResponse($data, 201);
    }

    /**
     * Return a 204 No Content response.
     */
    protected function noContent(): JsonResponse
    {
        return new JsonResponse(null, 204);
    }

    /**
     * Get the authenticated user ID from the request.
     */
    protected function userId(ServerRequestInterface $request): ?string
    {
        return $request->getAttribute('user_id');
    }

    /**
     * Get the authenticated user object from the request.
     */
    protected function user(ServerRequestInterface $request): ?object
    {
        return $request->getAttribute('user');
    }

    /**
     * Get parsed JSON body as associative array.
     */
    protected function body(ServerRequestInterface $request): array
    {
        $body = $request->getParsedBody();
        if (is_array($body)) {
            return $body;
        }
        $content = (string) $request->getBody();
        return $content ? (json_decode($content, true) ?? []) : [];
    }

    /**
     * Build pagination params from query string.
     *
     * @return array{page: int, per_page: int, offset: int}
     */
    protected function pagination(ServerRequestInterface $request, int $default = 20, int $max = 100): array
    {
        $query   = $request->getQueryParams();
        $page    = max(1, (int) ($query['page'] ?? 1));
        $perPage = min($max, max(1, (int) ($query['per_page'] ?? $default)));
        $offset  = ($page - 1) * $perPage;

        return compact('page', 'perPage', 'offset');
    }

    /**
     * Wrap a paginated result set.
     */
    protected function paginated(array $items, int $total, int $page, int $perPage): JsonResponse
    {
        return $this->json([
            'data' => $items,
            'meta' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }
}
