<?php

use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\DailyBazarCostController;
use App\Http\Controllers\DailyMealItemController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DayWiseMealController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MealRateController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MemberRegistrationController;
use App\Http\Controllers\MonthlyStatementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderMealController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PaymentDetailsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PlatformAdminController;
use App\Http\Controllers\PublicTenantController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TenantRegistrationController;
use App\Http\Controllers\TenantSignupVerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:auth-login')->group(function () {
    Route::post('/login', [LoginController::class, 'onLogin']);
    Route::post('/admin_login', [LoginController::class, 'AdminLogin']);
    Route::post('/platform/login', [LoginController::class, 'PlatformLogin']);
    Route::post('/tenant/register', TenantRegistrationController::class);
});
Route::middleware('throttle:10,1')->prefix('tenant/register')->group(function () {
    Route::post('/send-otp', [TenantSignupVerificationController::class, 'send']);
    Route::post('/resend-otp', [TenantSignupVerificationController::class, 'send']);
    Route::post('/verify-otp', [TenantSignupVerificationController::class, 'verify']);
});
Route::middleware('throttle:60,1')->get('/public/tenants', [PublicTenantController::class, 'index']);
Route::middleware('throttle:10,1')->prefix('member/register')->group(function () {
    Route::post('/send-otp', [MemberRegistrationController::class, 'sendVerificationCode']);
    Route::post('/resend-otp', [MemberRegistrationController::class, 'sendVerificationCode']);
    Route::post('/verify-otp', [MemberRegistrationController::class, 'verifyEmail']);
    Route::post('/', [MemberRegistrationController::class, 'register']);
});

Route::middleware(['auth:sanctum', 'role:platform_admin'])->prefix('platform')->group(function () {
    Route::get('/tenants', [PlatformAdminController::class, 'tenants']);
    Route::post('/tenants', [PlatformAdminController::class, 'createTenant']);
    Route::get('/tenants/{tenant}', [PlatformAdminController::class, 'showTenant']);
    Route::patch('/tenants/{tenant}', [PlatformAdminController::class, 'updateTenant']);
    Route::delete('/tenants/{tenant}', [PlatformAdminController::class, 'deleteTenant']);
    Route::get('/tenants/{tenant}/users', [PlatformAdminController::class, 'users']);
    Route::get('/tenants/{tenant}/impersonations', [PlatformAdminController::class, 'impersonations']);
    Route::post('/tenants/{tenant}/users', [PlatformAdminController::class, 'createUser']);
    Route::patch('/tenants/{tenant}/users/{userId}', [PlatformAdminController::class, 'updateUser']);
    Route::delete('/tenants/{tenant}/users/{userId}', [PlatformAdminController::class, 'deleteUser']);
    Route::post('/tenants/{tenant}/users/{userId}/password-reset', [PlatformAdminController::class, 'sendUserPasswordReset'])
        ->middleware('throttle:password-reset');
    Route::post('/impersonations', [PlatformAdminController::class, 'startImpersonation'])->middleware('throttle:10,1');
    Route::post('/impersonations/{impersonation}/end', [PlatformAdminController::class, 'endImpersonation']);
    Route::get('/payments', [PlatformAdminController::class, 'payments']);
    Route::get('/plans', [PlatformAdminController::class, 'plans']);
    Route::post('/plans', [PlatformAdminController::class, 'savePlan']);
    Route::put('/plans/{plan}', [PlatformAdminController::class, 'savePlan']);
});
Route::middleware('auth:sanctum')->post('/impersonations/{impersonation}/end', [PlatformAdminController::class, 'endImpersonation']);

Route::middleware('throttle:password-reset')->group(function () {
    Route::post('/EmailVerification', [PasswordController::class, 'EmailVerification']);
    Route::post('/GetOTPExpiration', [PasswordController::class, 'GetOTPExpiration']);
    Route::post('/OTPVerification', [PasswordController::class, 'OTPVerification']);
    Route::post('/ResetPassword', [PasswordController::class, 'ResetPassword']);
});

Route::get('/GetPublicProfileInfo', [AdminProfileController::class, 'GetPublicProfileInfo']);
Route::get('/GetDailyMealItem', [DailyMealItemController::class, 'GetDayWiseMealItem']);
Route::get('/GetMealRate', [MealRateController::class, 'GetMealRate']);

Route::middleware(['auth:sanctum', 'tenant.member', 'tenant.subscribed', 'role:user', 'owned.api'])->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::get('/PaymentDetailsByUser/{token_no}', [PaymentDetailsController::class, 'PaymentDetailsByUser']);
    Route::post('/PaymentDetailsFilterByDate', [PaymentDetailsController::class, 'PaymentDetailsFilterByDate']);

    Route::get('/CountDashboardSummary/{user_id}', [DashboardController::class, 'CountDashboardSummary']);
    Route::get('/LastFivePaymentDetails/{token_no}', [DashboardController::class, 'LastFivePaymentDetails']);
    Route::get('/LastFiveMonthsStatements/{token_no}', [DashboardController::class, 'LastFiveMonthsStatements']);
    Route::get('/LastSevenDaysMealReport/{user_id}', [DashboardController::class, 'LastSevenDaysMealReport']);

    Route::get('/GetTodayOrderInfo/{user_id}/{token_no}', [OrderMealController::class, 'GetTodayOrderInfo']);

    Route::get('/GetYearsAndMonths', [MonthlyStatementController::class, 'GetYearsAndMonths']);
    Route::get('/GetAllMonthlyStatement/{token_no}', [MonthlyStatementController::class, 'GetAllMonthlyStatement']);
    Route::post('/GetMonthlyStatementByKey', [MonthlyStatementController::class, 'GetMonthlyStatementByKey']);

    Route::get('/GetAllMealByUser/{user_id}', [DayWiseMealController::class, 'GetAllMealByUser']);
    Route::post('/GetMealFilterByDate', [DayWiseMealController::class, 'GetMealFilterByDate']);

    Route::post('/UpdateProfile', [ProfileController::class, 'UpdateProfile']);
});

Route::middleware(['auth:sanctum', 'tenant.member', 'owned.api'])->group(function () {
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()?->delete();

        return 1;
    });
    Route::post('/ChangePassword', [PasswordController::class, 'ChangePassword']);
    Route::get('/GetUserProfile/{id}', [ProfileController::class, 'GetUserProfile']);
    Route::post('/OrderDailyMeal', [OrderMealController::class, 'OrderDailyMeal']);
    Route::post('/ChangeOrderedMeal', [OrderMealController::class, 'ChangeOrderedMeal']);
    Route::get('/DeleteTodayOrderedMeal/{order_id}', [OrderMealController::class, 'DeleteTodayOrderedMeal']);
    Route::get('/RestoreTodayOrderedMeal/{order_id}', [OrderMealController::class, 'RestoreTodayOrderedMeal']);
    Route::get('/GetMealByOrderId/{order_id}', [DayWiseMealController::class, 'GetMealByOrderId']);
    Route::post('/SendMessage', [NotificationController::class, 'InsertNotification']);
    Route::get('/GetAdminNotificationByUser/{user_id}', [NotificationController::class, 'GetAdminNotificationByUser']);
    Route::get('/GetSelfCreatedNotification/{user_id}', [NotificationController::class, 'GetSelfCreatedNotification']);
    Route::get('/CountLastestNotification/{user_id}', [NotificationController::class, 'CountLastestNotification']);
    Route::get('/SetUnreadStatus/{user_id}', [NotificationController::class, 'SetUnreadStatus']);
    Route::get('/SetReadStatus/{user_id}/{notification_id}', [NotificationController::class, 'SetReadStatus']);
});

Route::middleware(['auth:sanctum', 'tenant.member', 'role:admin'])->prefix('tenant')->group(function () {
    Route::get('/plans', [SubscriptionController::class, 'plans']);
    Route::get('/subscription', [SubscriptionController::class, 'current']);
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout']);
});

Route::middleware(['auth:sanctum', 'tenant.member', 'tenant.subscribed', 'role:admin'])->group(function () {
    Route::get('/GetProfileInfo', [AdminProfileController::class, 'GetProfileInfo']);
    Route::get('/AdminDashboardSummary', [DashboardController::class, 'AdminDashboardSummary']);

    Route::post('/AddPayment', [PaymentDetailsController::class, 'AddPayment']);
    Route::post('/EditPayment', [PaymentDetailsController::class, 'EditPayment']);
    Route::delete('/DeletePayment/{payment_id}', [PaymentDetailsController::class, 'DeletePayment']);
    Route::get('/GetAllPayments', [PaymentDetailsController::class, 'GetAllPayments']);
    Route::post('/GetAllPaymentByDate', [PaymentDetailsController::class, 'GetAllPaymentByDate']);
    Route::get('/GetPaymentById/{payment_id}', [PaymentDetailsController::class, 'GetPaymentById']);

    Route::get('/GetAllBazarCost', [DailyBazarCostController::class, 'GetAllBazarCost']);
    Route::post('/GetBazarCostByDate', [DailyBazarCostController::class, 'GetBazarCostByDate']);
    Route::get('/GetBazarCostById/{cost_id}', [DailyBazarCostController::class, 'GetBazarCostById']);
    Route::post('/AddDailyBazarCost', [DailyBazarCostController::class, 'AddDailyBazarCost']);
    Route::post('/EditDailyBazarCost', [DailyBazarCostController::class, 'EditDailyBazarCost']);
    Route::get('/DeleteDailyBazarCost/{cost_id}', [DailyBazarCostController::class, 'DeleteDailyBazarCost']);

    Route::get('/all_members', [MemberController::class, 'AllMembers']);
    Route::post('/add_member', [MemberController::class, 'AddNewMember']);
    Route::get('/view_member_by_id/{user_id}', [MemberController::class, 'ViewMemberById']);
    Route::post('/edit_member', [MemberController::class, 'EditMember']);
    Route::get('/delete_member/{user_id}', [MemberController::class, 'DeleteMember']);

    Route::post('/UpdateAdminProfile', [AdminProfileController::class, 'UpdateAdminProfile']);
    Route::get('/DayWiseMealItemById/{id}', [DailyMealItemController::class, 'DayWiseMealItemById']);
    Route::post('/EditDayWiseMealItem', [DailyMealItemController::class, 'EditDayWiseMealItem']);
    Route::post('/ChangeMealRate', [MealRateController::class, 'ChangeMealRate']);

    Route::get('/GetTodayAllOrderInfo', [OrderMealController::class, 'GetTodayAllOrderInfo']);
    Route::get('/GetTodayOrderInfoByOrderId/{order_id}', [OrderMealController::class, 'GetTodayOrderInfoByOrderId']);
    Route::post('/ChangeMealStatus', [OrderMealController::class, 'ChangeMealStatus']);

    Route::get('/GetAllMealDetails', [DayWiseMealController::class, 'GetAllMealDetails']);
    Route::post('/GetMealByFilter', [DayWiseMealController::class, 'GetMealByFilter']);

    Route::post('/SendEmailNotification', [NotificationController::class, 'SendEmailNotification'])->middleware('throttle:10,1');
    Route::get('/GetAllNotificationForAdmin/{author_id}', [NotificationController::class, 'GetAllNotificationForAdmin']);
    Route::post('/EditNotification', [NotificationController::class, 'EditNotification']);
    Route::get('/DeleteNotification/{notify_id}', [NotificationController::class, 'DeleteNotification']);
    Route::get('/GetNotification/{notify_id}', [NotificationController::class, 'GetNotification']);
});

Route::fallback(fn () => abort(404));
