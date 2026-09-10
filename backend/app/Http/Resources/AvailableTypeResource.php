<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => $this->agent_type->value,
            'monthlyExecutionLimit' => $this->monthly_execution_limit,
        ];
    }
}
