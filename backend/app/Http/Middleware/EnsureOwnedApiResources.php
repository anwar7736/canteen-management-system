<?php

namespace App\Http\Middleware;

use App\Models\NotificationDetail;
use App\Models\OrderMeal;
use App\Models\Payment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOwnedApiResources
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        if ($user->role !== 'admin') {
            foreach (['id', 'user_id'] as $key) {
                $value = $this->requestValue($request, $key);
                if ($value !== null && (string) $value !== (string) $user->getKey()) {
                    abort(403);
                }
            }

            $tokenNo = $this->requestValue($request, 'token_no');
            if ($tokenNo !== null && (string) $tokenNo !== (string) $user->token_no) {
                abort(403);
            }

            $orderId = $this->requestValue($request, 'order_id');
            if ($orderId !== null && !OrderMeal::withTrashed()
                ->whereKey($orderId)
                ->where('user_id', $user->getKey())
                ->exists()) {
                abort(403);
            }

            $paymentId = $this->requestValue($request, 'payment_id');
            if ($paymentId !== null && !Payment::whereKey($paymentId)
                ->where('token_no', $user->token_no)
                ->exists()) {
                abort(403);
            }

            foreach (['notification_id', 'notify_id'] as $key) {
                $notificationId = $this->requestValue($request, $key);
                if ($notificationId !== null && !NotificationDetail::where('notification_id', $notificationId)
                    ->where('user_id', $user->getKey())
                    ->exists()) {
                    abort(403);
                }
            }
        }

        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response;
    }

    private function requestValue(Request $request, string $key): mixed
    {
        $value = $request->route($key);
        if ($value === null) {
            $value = $request->input($key);
        }

        if ($value !== null && !is_scalar($value)) {
            abort(403);
        }

        return $value;
    }
}
