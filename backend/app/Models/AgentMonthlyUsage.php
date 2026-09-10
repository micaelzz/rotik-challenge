<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentMonthlyUsage extends Model
{
    use HasUuids;

    protected $fillable = ['agent_id', 'year', 'month', 'execution_count'];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'execution_count' => 'integer',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
