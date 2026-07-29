<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReferralAgentController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $agent = $this->resolve($request);

        return response()->json($this->withStats($agent));
    }

    public function rotate(Request $request): JsonResponse
    {
        $agent = $this->resolve($request);
        $agent->update(['qr_code_token' => Str::random(24)]);

        return response()->json($this->withStats($agent));
    }

    private function resolve(Request $request): ReferralAgent
    {
        return ReferralAgent::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['qr_code_token' => Str::random(24)],
        );
    }

    private function withStats(ReferralAgent $agent): array
    {
        return [
            'qr_code_token' => $agent->qr_code_token,
            'registrations_count' => $agent->registrations()->count(),
        ];
    }
}
