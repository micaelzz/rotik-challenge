<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUsage = $this->whenLoaded('currentMonthUsage');

        $executionCount = $currentUsage ? $currentUsage->execution_count : 0;
        $percentage = $this->monthly_execution_limit > 0
            ? round(($executionCount / $this->monthly_execution_limit) * 100, 1)
            : 0;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'monthlyExecutionLimit' => $this->monthly_execution_limit,
            'currentMonthUsage' => [
                'executionCount' => $executionCount,
                'percentage' => $percentage,
            ],
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
