<?php

namespace Tests\Feature;

use App\Enums\AgentStatus;
use App\Enums\AgentType;
use App\Models\Agent;
use App\Models\Client;
use App\Models\Plan;
use App\Models\PlanAgentLimit;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;

    protected User $userB;

    protected Agent $agentA;

    protected Agent $agentB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DemoSeeder::class);

        $this->userA = User::where('email', 'demo@rotik.com')->first();
        $this->agentA = Agent::where('client_id', $this->userA->client_id)->first();

        // Create second client B with its user and agent
        $planB = Plan::create(['name' => 'STARTER']);
        PlanAgentLimit::create([
            'plan_id' => $planB->id,
            'agent_type' => AgentType::SUPPORT,
            'monthly_execution_limit' => 500,
        ]);

        $clientB = Client::create([
            'name' => 'Other Corp',
            'plan_id' => $planB->id,
        ]);

        $this->userB = User::create([
            'name' => 'User B',
            'email' => 'userb@other.com',
            'password' => 'password',
            'client_id' => $clientB->id,
        ]);

        $this->agentB = Agent::create([
            'client_id' => $clientB->id,
            'name' => 'Secret Bot B',
            'type' => AgentType::SUPPORT,
            'monthly_execution_limit' => 500,
            'status' => AgentStatus::ACTIVE,
        ]);
    }

    public function test_user_b_cannot_see_agent_a_in_list(): void
    {
        $response = $this->actingAs($this->userB)
            ->getJson('/api/agents');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonMissing(['id' => $this->agentA->id]);
    }

    public function test_user_b_gets_404_when_accessing_agent_a_details(): void
    {
        $response = $this->actingAs($this->userB)
            ->getJson("/api/agents/{$this->agentA->id}");

        $response->assertStatus(404)
            ->assertJson([
                'error' => [
                    'code' => 'RESOURCE_NOT_FOUND',
                ],
            ]);
    }

    public function test_user_b_gets_404_when_executing_agent_a(): void
    {
        $response = $this->actingAs($this->userB)
            ->postJson("/api/agents/{$this->agentA->id}/executions");

        $response->assertStatus(404)
            ->assertJson([
                'error' => [
                    'code' => 'RESOURCE_NOT_FOUND',
                ],
            ]);
    }

    public function test_user_b_gets_404_when_listing_executions_of_agent_a(): void
    {
        $response = $this->actingAs($this->userB)
            ->getJson("/api/agents/{$this->agentA->id}/executions");

        $response->assertStatus(404)
            ->assertJson([
                'error' => [
                    'code' => 'RESOURCE_NOT_FOUND',
                ],
            ]);
    }
}
