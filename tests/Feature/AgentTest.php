<?php

namespace Tests\Feature;

use App\Enums\AgentType;
use App\Models\Agent;
use App\Models\Client;
use App\Models\Plan;
use App\Models\PlanAgentLimit;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DemoSeeder::class);
        $this->user = User::where('email', 'demo@rotik.com')->first();
    }

    public function test_user_can_list_agents(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/agents');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_creating_agent_copies_limit_from_plan(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/agents', [
                'name' => 'New Support Bot',
                'type' => 'SUPPORT',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'name' => 'New Support Bot',
                    'type' => 'SUPPORT',
                    'monthlyExecutionLimit' => 2000,
                    'status' => 'ACTIVE',
                ],
            ]);

        $this->assertDatabaseHas('agents', [
            'name' => 'New Support Bot',
            'type' => 'SUPPORT',
            'monthly_execution_limit' => 2000,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_creating_agent_fails_when_type_not_available_in_plan(): void
    {
        // Create a client with a restricted plan (only SUPPORT available)
        $restrictedPlan = Plan::create(['name' => 'BASIC']);
        PlanAgentLimit::create([
            'plan_id' => $restrictedPlan->id,
            'agent_type' => AgentType::SUPPORT,
            'monthly_execution_limit' => 100,
        ]);

        $restrictedClient = Client::create([
            'name' => 'Restricted Client',
            'plan_id' => $restrictedPlan->id,
        ]);

        $restrictedUser = User::create([
            'name' => 'Restricted User',
            'email' => 'restricted@rotik.com',
            'password' => 'password',
            'client_id' => $restrictedClient->id,
        ]);

        $response = $this->actingAs($restrictedUser)
            ->postJson('/api/agents', [
                'name' => 'Sales Bot',
                'type' => 'SALES',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'error' => [
                    'code' => 'AGENT_TYPE_NOT_AVAILABLE',
                ],
            ]);
    }

    public function test_can_fetch_available_types_for_client_plan(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/agents/available-types');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment([
                'type' => 'SUPPORT',
                'monthlyExecutionLimit' => 2000,
            ]);
    }

    public function test_can_show_single_agent(): void
    {
        $agent = Agent::where('client_id', $this->user->client_id)->first();

        $response = $this->actingAs($this->user)
            ->getJson("/api/agents/{$agent->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                ],
            ]);
    }
}
