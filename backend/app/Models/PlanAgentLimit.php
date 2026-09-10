<?php

namespace App\Models;

use App\Enums\AgentType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanAgentLimit extends Model
{
    use HasUuids;

    protected $fillable = ['plan_id', 'agent_type', 'monthly_execution_limit'];

    protected function casts(): array
    {
        return [
            'agent_type' => AgentType::class,
            'monthly_execution_limit' => 'integer',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
