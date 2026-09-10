<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class AgentTypeNotAvailableException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json([
            'error' => [
                'code' => 'AGENT_TYPE_NOT_AVAILABLE',
                'message' => 'The requested agent type is not available in your plan.',
            ],
        ], 422);
    }
}
