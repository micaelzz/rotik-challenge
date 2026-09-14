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
                'message' => __('O limite mensal de execuções deste agente foi atingido.'),
            ],
        ], 429);
    }
}
