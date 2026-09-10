<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ExecutionLimitReachedException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'EXECUTION_LIMIT_REACHED',
                'message' => 'Monthly execution limit has been reached for this agent.',
            ],
        ], 429);
    }
}
