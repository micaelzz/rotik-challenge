<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_monthly_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')->constrained('agents');
            $table->unsignedSmallInteger('year');
            $table->unsignedSmallInteger('month');
            $table->unsignedInteger('execution_count')->default(0);
            $table->timestamps();

            $table->unique(['agent_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_monthly_usages');
    }
};
