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
                'message' => __('O tipo de agente solicitado não está disponível no plano da sua empresa.'),
            ],
        ], 422);
    }
}
