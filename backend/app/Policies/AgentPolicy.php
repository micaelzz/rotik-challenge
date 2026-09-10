<?php

namespace App\Policies;

use App\Models\Agent;
use App\Models\User;

class AgentPolicy
{
    /**
     * Users can only view agents belonging to their client.
     */
    public function view(User $user, Agent $agent): bool
    {
        return $user->client_id === $agent->client_id;
    }

    /**
     * Any authenticated user can create agents for their client.
     */
    public function create(User $user): bool
    {
        return true;
    }
}
