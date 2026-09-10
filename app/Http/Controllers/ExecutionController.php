<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExecutionResource;
use App\Models\Agent;
use App\Models\Execution;
use App\Services\ExecutionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExecutionController extends Controller
{
    public function __construct(
        protected ExecutionService $executionService
    ) {}

    public function store(Request $request, string $agentId): ExecutionResource
    {
        $user = $request->user();

        $agent = Agent::query()
            ->where('client_id', $user->client_id)
            ->where('id', $agentId)
            ->firstOrFail();

        $execution = $this->executionService->execute($agent);

        return new ExecutionResource($execution);
    }

    public function index(Request $request, string $agentId): AnonymousResourceCollection
    {
        $user = $request->user();

        $agent = Agent::query()
            ->where('client_id', $user->client_id)
            ->where('id', $agentId)
            ->firstOrFail();

        $perPage = (int) $request->query('per_page', 15);

        $executions = Execution::query()
            ->where('agent_id', $agent->id)
            ->orderBy('executed_at', 'desc')
            ->paginate($perPage);

        return ExecutionResource::collection($executions);
    }
}
