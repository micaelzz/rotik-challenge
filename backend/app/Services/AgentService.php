<?php

namespace App\Services;

use App\Enums\AgentStatus;
use App\Enums\AgentType;
use App\Exceptions\AgentTypeNotAvailableException;
use App\Models\Agent;
use App\Models\User;

class AgentService
{
    /**
     * Create a new agent for the authenticated user's client.
     * The monthly execution limit is copied from the plan's configuration.
     */
    public function createAgent(User $user, string $name, AgentType $type): Agent
    {
        $client = $user->client;
        $plan = $client->plan;

        $planLimit = $plan->agentLimits()
            ->where('agent_type', $type->value)
            ->first();

        if (! $planLimit) {
            throw new AgentTypeNotAvailableException;
        }

        return Agent::create([
            'client_id' => $client->id,
            'name' => $name,
            'type' => $type,
            'monthly_execution_limit' => $planLimit->monthly_execution_limit,
            'status' => AgentStatus::ACTIVE,
        ]);
    }
}
