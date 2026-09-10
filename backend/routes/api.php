<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ExecutionController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/agents/available-types', [AgentController::class, 'availableTypes']);
    Route::get('/agents', [AgentController::class, 'index']);
    Route::post('/agents', [AgentController::class, 'store']);
    Route::get('/agents/{agent}', [AgentController::class, 'show']);

    Route::post('/agents/{agent}/executions', [ExecutionController::class, 'store']);
    Route::get('/agents/{agent}/executions', [ExecutionController::class, 'index']);
});
