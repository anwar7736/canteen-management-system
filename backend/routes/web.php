<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SslCommerzPaymentController;
use App\Http\Controllers\SubscriptionController;


//Home page
Route::view('/', 'welcome');

    // SSLCOMMERZ Start
    // Route::get('/example1', [SslCommerzPaymentController::class, 'exampleEasyCheckout']);
    Route::get('/online-payment', [SslCommerzPaymentController::class, 'onlineSSLPayment'])
        ->middleware('throttle:60,1');

    Route::post('/pay', [SslCommerzPaymentController::class, 'index'])
        ->middleware('throttle:10,1');
    // Route::post('/pay-via-ajax', [SslCommerzPaymentController::class, 'payViaAjax']);

    Route::post('/success', [SslCommerzPaymentController::class, 'success']);
    Route::post('/fail', [SslCommerzPaymentController::class, 'fail']);
    Route::post('/cancel', [SslCommerzPaymentController::class, 'cancel']);

    Route::post('/ipn', [SslCommerzPaymentController::class, 'ipn']);
    Route::post('/subscription/success', [SubscriptionController::class, 'success']);
    Route::post('/subscription/fail', [SubscriptionController::class, 'fail']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscription/ipn', [SubscriptionController::class, 'ipn']);
    //SSLCOMMERZ END


Route::fallback(function () {
    abort(404);
});
