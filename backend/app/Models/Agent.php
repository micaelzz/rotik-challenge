<?php

namespace App\Models;

use App\Enums\AgentStatus;
use App\Enums\AgentType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Agent extends Model
{
    use HasUuids;

    protected $fillable = [
        'client_id',
        'name',
        'type',
        'monthly_execution_limit',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type' => AgentType::class,
            'status' => AgentStatus::class,
            'monthly_execution_limit' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(Execution::class);
    }

    public function monthlyUsages(): HasMany
    {
        return $this->hasMany(AgentMonthlyUsage::class);
    }

    public function currentMonthUsage(): HasOne
    {
        return $this->hasOne(AgentMonthlyUsage::class)
            ->where('year', now()->year)
            ->where('month', now()->month);
    }
}
