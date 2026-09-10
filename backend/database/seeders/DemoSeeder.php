<?php

namespace Database\Seeders;

use App\Enums\AgentStatus;
use App\Enums\AgentType;
use App\Enums\ExecutionStatus;
use App\Models\Agent;
use App\Models\AgentMonthlyUsage;
use App\Models\Client;
use App\Models\Execution;
use App\Models\Plan;
use App\Models\PlanAgentLimit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Skip seeding if demo user already exists (idempotent seeder)
        if (User::where('email', 'demo@rotik.com')->exists()) {
            return;
        }

        // 1. Create Plan
        $plan = Plan::create([
            'name' => 'PRO',
            'description' => 'Professional plan with high execution limits.',
        ]);

        // 2. Create PlanAgentLimits
        PlanAgentLimit::create([
            'plan_id' => $plan->id,
            'agent_type' => AgentType::SUPPORT,
            'monthly_execution_limit' => 2000,
        ]);

        PlanAgentLimit::create([
            'plan_id' => $plan->id,
            'agent_type' => AgentType::SALES,
            'monthly_execution_limit' => 1000,
        ]);

        PlanAgentLimit::create([
            'plan_id' => $plan->id,
            'agent_type' => AgentType::GENERAL,
            'monthly_execution_limit' => 500,
        ]);

        // 3. Create Client
        $client = Client::create([
            'name' => 'Acme Corp',
            'plan_id' => $plan->id,
        ]);

        // 4. Create Demo User
        User::create([
            'name' => 'Demo User',
            'email' => 'demo@rotik.com',
            'password' => Hash::make('password'),
            'client_id' => $client->id,
        ]);

        // 5. Create Agents
        $supportAgent = Agent::create([
            'client_id' => $client->id,
            'name' => 'Customer Support Bot',
            'type' => AgentType::SUPPORT,
            'monthly_execution_limit' => 2000,
            'status' => AgentStatus::ACTIVE,
        ]);

        $salesAgent = Agent::create([
            'client_id' => $client->id,
            'name' => 'Sales Assistant AI',
            'type' => AgentType::SALES,
            'monthly_execution_limit' => 1000,
            'status' => AgentStatus::ACTIVE,
        ]);

        $blockedAgent = Agent::create([
            'client_id' => $client->id,
            'name' => 'General Task Processor',
            'type' => AgentType::GENERAL,
            'monthly_execution_limit' => 500,
            'status' => AgentStatus::BLOCKED,
        ]);

        $now = now();
        $year = $now->year;
        $month = $now->month;

        // 6. Create AgentMonthlyUsages
        AgentMonthlyUsage::create([
            'agent_id' => $supportAgent->id,
            'year' => $year,
            'month' => $month,
            'execution_count' => 1450,
        ]);

        AgentMonthlyUsage::create([
            'agent_id' => $salesAgent->id,
            'year' => $year,
            'month' => $month,
            'execution_count' => 320,
        ]);

        AgentMonthlyUsage::create([
            'agent_id' => $blockedAgent->id,
            'year' => $year,
            'month' => $month,
            'execution_count' => 500,
        ]);

        // 7. Create sample executions for Support Agent
        for ($i = 0; $i < 20; $i++) {
            Execution::create([
                'agent_id' => $supportAgent->id,
                'executed_at' => $now->copy()->subMinutes($i * 15),
                'status' => $i % 7 === 0 ? ExecutionStatus::FAILED : ExecutionStatus::SUCCESS,
                'created_at' => $now->copy()->subMinutes($i * 15),
            ]);
        }

        // Sample executions for Sales Agent
        for ($i = 0; $i < 10; $i++) {
            Execution::create([
                'agent_id' => $salesAgent->id,
                'executed_at' => $now->copy()->subHours($i),
                'status' => ExecutionStatus::SUCCESS,
                'created_at' => $now->copy()->subHours($i),
            ]);
        }

        // Sample executions for Blocked Agent (recent failed attempt after hitting limit)
        for ($i = 0; $i < 5; $i++) {
            Execution::create([
                'agent_id' => $blockedAgent->id,
                'executed_at' => $now->copy()->subHours($i * 2),
                'status' => $i === 0 ? ExecutionStatus::FAILED : ExecutionStatus::SUCCESS,
                'created_at' => $now->copy()->subHours($i * 2),
            ]);
        }
    }
}
