<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_agent_limits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->string('agent_type');
            $table->unsignedInteger('monthly_execution_limit');
            $table->timestamps();

            $table->unique(['plan_id', 'agent_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_agent_limits');
    }
};
