<?php

namespace App\Http\Controllers;

use App\Support\Totp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorAuthenticationController extends Controller
{
    public function status(Request $request): array
    {
        return ['enabled' => $request->user()->two_factor_enabled_at !== null];
    }

    public function setup(Request $request): array
    {
        $user = $request->user();
        abort_if($user->two_factor_enabled_at, Response::HTTP_CONFLICT, 'Two-factor authentication is already enabled.');

        if (!$user->two_factor_secret) {
            $user->forceFill(['two_factor_secret' => Totp::generateSecret()])->save();
        }

        $issuer = config('app.name', 'CanteenOS');
        $account = $user->email ?: $user->username;
        $label = rawurlencode($issuer.':'.$account);
        $uri = 'otpauth://totp/'.$label.'?'.http_build_query([
            'secret' => $user->two_factor_secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => 6,
            'period' => 30,
        ], '', '&', PHP_QUERY_RFC3986);

        return [
            'secret' => $user->two_factor_secret,
            'otpauth_url' => $uri,
        ];
    }

    public function confirm(Request $request): array|JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();
        abort_if($user->two_factor_enabled_at, Response::HTTP_CONFLICT, 'Two-factor authentication is already enabled.');

        if (!$user->two_factor_secret || !Totp::verify($user->two_factor_secret, $validated['code'])) {
            return response()->json(['message' => 'The authenticator code is invalid or expired.'], 422);
        }

        $user->forceFill(['two_factor_enabled_at' => now()])->save();

        return ['enabled' => true];
    }

    public function disable(Request $request): array|JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();

        if (!$user->two_factor_enabled_at || !$user->two_factor_secret
            || !Totp::verify($user->two_factor_secret, $validated['code'])) {
            return response()->json(['message' => 'The authenticator code is invalid or expired.'], 422);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_enabled_at' => null,
        ])->save();

        return ['enabled' => false];
    }
}
