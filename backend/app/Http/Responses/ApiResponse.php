<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponse
{
    /**
     * Return a standardized success JSON response.
     */
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = Response::HTTP_OK, array $meta = []): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a standardized paginated response.
     */
    public static function paginated(mixed $resourceCollection, string $message = 'Success'): JsonResponse
    {
        $paginated = $resourceCollection->response()->getData(true);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $paginated['data'] ?? $resourceCollection,
            'meta' => [
                'current_page' => $paginated['meta']['current_page'] ?? null,
                'last_page' => $paginated['meta']['last_page'] ?? null,
                'per_page' => $paginated['meta']['per_page'] ?? null,
                'total' => $paginated['meta']['total'] ?? null,
            ],
            'links' => $paginated['links'] ?? null,
        ]);
    }

    /**
     * Return a standardized error response.
     */
    public static function error(string $message = 'An error occurred', int $statusCode = Response::HTTP_BAD_REQUEST, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }
}
