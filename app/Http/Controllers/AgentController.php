<?php

namespace App\Http\Controllers;

use App\Enums\AgentType;
use App\Http\Requests\StoreAgentRequest;
use App\Http\Resources\AgentResource;
use App\Http\Resources\AvailableTypeResource;
use App\Models\Agent;
use App\Services\AgentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AgentController extends Controller
{
    public function __construct(
        protected AgentService $agentService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $agents = Agent::query()
            ->where('client_id', $user->client_id)
            ->with(['currentMonthUsage'])
            ->orderBy('created_at', 'desc')
            ->get();

        return AgentResource::collection($agents);
    }

    public function store(StoreAgentRequest $request): AgentResource
    {
        $user = $request->user();
        $type = AgentType::from($request->validated('type'));

        $agent = $this->agentService->createAgent(
            user: $user,
            name: $request->validated('name'),
            type: $type
        );

        $agent->load('currentMonthUsage');

        return new AgentResource($agent);
    }

    public function show(Request $request, string $id): AgentResource
    {
        $user = $request->user();

        $agent = Agent::query()
            ->where('client_id', $user->client_id)
            ->where('id', $id)
            ->with(['currentMonthUsage'])
            ->firstOrFail();

        return new AgentResource($agent);
    }

    public function availableTypes(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $plan = $user->client->plan;

        $limits = $plan->agentLimits;

        return AvailableTypeResource::collection($limits);
    }
}
