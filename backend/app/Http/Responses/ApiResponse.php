<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
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
     * Return a standardized 201 Created JSON response.
     */
    public static function created(mixed $data = null, string $message = 'Resource created successfully.'): JsonResponse
    {
        return self::success($data, $message, Response::HTTP_CREATED);
    }

    /**
     * Return a standardized paginated response.
     */
    public static function paginated(mixed $paginatedData, string $message = 'Success'): JsonResponse
    {
        if ($paginatedData instanceof LengthAwarePaginator) {
            $array = $paginatedData->toArray();
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $array['data'],
                'meta' => [
                    'current_page' => $array['current_page'],
                    'last_page' => $array['last_page'],
                    'per_page' => $array['per_page'],
                    'total' => $array['total'],
                ],
                'links' => [
                    'first' => $array['first_page_url'],
                    'last' => $array['last_page_url'],
                    'prev' => $array['prev_page_url'],
                    'next' => $array['next_page_url'],
                ],
            ]);
        }

        // Fallback or Resource collection
        if (is_object($paginatedData) && method_exists($paginatedData, 'response')) {
            $array = $paginatedData->response()->getData(true);
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $array['data'] ?? $paginatedData,
                'meta' => $array['meta'] ?? [],
                'links' => $array['links'] ?? [],
            ]);
        }

        return self::success($paginatedData, $message);
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
