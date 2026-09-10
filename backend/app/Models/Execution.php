<?php

namespace App\Models;

use App\Enums\ExecutionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Execution extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['agent_id', 'executed_at', 'status', 'created_at'];

    protected function casts(): array
    {
        return [
            'status' => ExecutionStatus::class,
            'executed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
