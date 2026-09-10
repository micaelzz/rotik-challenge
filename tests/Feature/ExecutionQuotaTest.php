<?php

namespace Tests\Feature;

use App\Enums\AgentStatus;
use App\Enums\ExecutionStatus;
use App\Models\Agent;
use App\Models\AgentMonthlyUsage;
use App\Models\Execution;
use App\Models\User;
use App\Services\ExecutionService;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExecutionQuotaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Agent $agent;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DemoSeeder::class);
        $this->user = User::where('email', 'demo@rotik.com')->first();
        $this->agent = Agent::where('client_id', $this->user->client_id)
            ->where('status', AgentStatus::ACTIVE)
            ->first();
    }

    public function test_execution_success_records_execution_and_increments_usage(): void
    {
        $initialUsage = AgentMonthlyUsage::where('agent_id', $this->agent->id)
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->first()->execution_count ?? 0;

        $response = $this->actingAs($this->user)
            ->postJson("/api/agents/{$this->agent->id}/executions");

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'agentId' => $this->agent->id,
                    'status' => 'SUCCESS',
                ],
            ]);

        $newUsage = AgentMonthlyUsage::where('agent_id', $this->agent->id)
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->first()->execution_count;

        $this->assertEquals($initialUsage + 1, $newUsage);
    }

    public function test_execution_failed_records_execution_without_incrementing_usage(): void
    {
        $executionService = app(ExecutionService::class);

        $initialUsage = AgentMonthlyUsage::where('agent_id', $this->agent->id)
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->first()->execution_count ?? 0;

        $failedExecution = $executionService->recordFailure($this->agent);

        $this->assertEquals(ExecutionStatus::FAILED, $failedExecution->status);

        $newUsage = AgentMonthlyUsage::where('agent_id', $this->agent->id)
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->first()->execution_count ?? 0;

        $this->assertEquals($initialUsage, $newUsage);
    }

    public function test_execution_blocked_and_agent_marked_blocked_when_limit_reached(): void
    {
        // Set agent limit to 2 and usage count to 1
        $this->agent->update(['monthly_execution_limit' => 2]);

        $usage = AgentMonthlyUsage::updateOrCreate(
            ['agent_id' => $this->agent->id, 'year' => now()->year, 'month' => now()->month],
            ['execution_count' => 1]
        );

        // First execution succeeds -> usage reaches 2 (limit) -> agent status becomes BLOCKED
        $response1 = $this->actingAs($this->user)
            ->postJson("/api/agents/{$this->agent->id}/executions");

        $response1->assertStatus(201);

        $this->agent->refresh();
        $this->assertEquals(AgentStatus::BLOCKED, $this->agent->status);

        // Second execution fails with 429 EXECUTION_LIMIT_REACHED
        $response2 = $this->actingAs($this->user)
            ->postJson("/api/agents/{$this->agent->id}/executions");

        $response2->assertStatus(429)
            ->assertJson([
                'error' => [
                    'code' => 'EXECUTION_LIMIT_REACHED',
                ],
            ]);
    }

    public function test_execution_history_returns_paginated_data(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/agents/{$this->agent->id}/executions?per_page=5");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'agentId', 'executedAt', 'status'],
                ],
                'links',
                'meta' => ['current_page', 'per_page', 'total'],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_new_month_allows_execution_for_previously_blocked_agent(): void
    {
        // Block agent in previous month
        $previousMonth = now()->subMonth();
        $this->agent->update(['status' => AgentStatus::BLOCKED, 'monthly_execution_limit' => 10]);

        AgentMonthlyUsage::create([
            'agent_id' => $this->agent->id,
            'year' => $previousMonth->year,
            'month' => $previousMonth->month,
            'execution_count' => 10,
        ]);

        // Fast forward to current month (where current month usage is 0)
        // Ensure current month usage does not exist yet
        AgentMonthlyUsage::where('agent_id', $this->agent->id)
            ->where('year', now()->year)
            ->where('month', now()->month)
            ->delete();

        // Attempt execution in current month
        $response = $this->actingAs($this->user)
            ->postJson("/api/agents/{$this->agent->id}/executions");

        $response->assertStatus(201);

        // Agent should now be unblocked and ACTIVE again
        $this->agent->refresh();
        $this->assertEquals(AgentStatus::ACTIVE, $this->agent->status);
    }
}
