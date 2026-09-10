<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'description'];

    public function agentLimits(): HasMany
    {
        return $this->hasMany(PlanAgentLimit::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }
}
