<?php

namespace App\Services;

use App\Enums\AgentStatus;
use App\Enums\ExecutionStatus;
use App\Exceptions\ExecutionLimitReachedException;
use App\Models\Agent;
use App\Models\AgentMonthlyUsage;
use App\Models\Execution;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExecutionService
{
    /**
     * Execute an agent action with concurrency-safe quota enforcement.
     *
     * Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent
     * concurrent requests from exceeding the monthly limit.
     */
    public function execute(Agent $agent): Execution
    {
        return DB::transaction(function () use ($agent) {
            // Lock the agent row to prevent concurrent modifications
            $agent = Agent::lockForUpdate()->findOrFail($agent->id);

            $now = now();
            $year = $now->year;
            $month = $now->month;

            // Get or create monthly usage with lock
            // Using updateOrCreate with lockForUpdate on the query
            $usage = AgentMonthlyUsage::lockForUpdate()
                ->firstOrCreate(
                    ['agent_id' => $agent->id, 'year' => $year, 'month' => $month],
                    ['execution_count' => 0]
                );

            // If agent was blocked in a previous month but new month has quota available,
            // automatically unblock it
            if ($agent->status === AgentStatus::BLOCKED) {
                if ($usage->execution_count < $agent->monthly_execution_limit) {
                    $agent->update(['status' => AgentStatus::ACTIVE]);
                } else {
                    Log::warning('Execution blocked: agent has reached monthly limit', [
                        'agent_id' => $agent->id,
                        'year' => $year,
                        'month' => $month,
                        'usage' => $usage->execution_count,
                        'limit' => $agent->monthly_execution_limit,
                    ]);

                    throw new ExecutionLimitReachedException;
                }
            }

            // Check quota before proceeding
            if ($usage->execution_count >= $agent->monthly_execution_limit) {
                $agent->update(['status' => AgentStatus::BLOCKED]);

                Log::warning('Execution blocked: agent has reached monthly limit', [
                    'agent_id' => $agent->id,
                    'year' => $year,
                    'month' => $month,
                    'usage' => $usage->execution_count,
                    'limit' => $agent->monthly_execution_limit,
                ]);

                throw new ExecutionLimitReachedException;
            }

            // Record SUCCESS execution
            $execution = Execution::create([
                'agent_id' => $agent->id,
                'executed_at' => $now,
                'status' => ExecutionStatus::SUCCESS,
                'created_at' => $now,
            ]);

            // Increment usage count
            $usage->increment('execution_count');

            // Block agent if limit is now reached
            if ($usage->execution_count >= $agent->monthly_execution_limit) {
                $agent->update(['status' => AgentStatus::BLOCKED]);

                Log::info('Agent blocked: monthly limit reached', [
                    'agent_id' => $agent->id,
                    'year' => $year,
                    'month' => $month,
                ]);
            }

            return $execution;
        });
    }

    /**
     * Record a failed execution without consuming quota.
     */
    public function recordFailure(Agent $agent): Execution
    {
        Log::warning('Execution failed', ['agent_id' => $agent->id]);

        return Execution::create([
            'agent_id' => $agent->id,
            'executed_at' => now(),
            'status' => ExecutionStatus::FAILED,
            'created_at' => now(),
        ]);
    }
}
