<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')->constrained('agents');
            $table->timestamp('executed_at');
            $table->string('status');
            $table->timestamp('created_at')->nullable();

            $table->index(['agent_id', 'executed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('executions');
    }
};
