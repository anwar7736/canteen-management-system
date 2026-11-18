<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\OrderMeal;
use App\Models\DailyBazarCost;
use App\Models\MealRate;
use App\Models\User;
use App\Models\Notification;
use App\Models\NotificationDetail;
use App\Models\Payment;
use App\Models\MonthlyStatement;

class DashboardController extends Controller
{
    public function AdminDashboardSummary(Request $req)
    {
        $total_customer = User::where('role', 'user')->count();
        $today = now('Asia/Dhaka')->toDateString();
        $first_day = now('Asia/Dhaka')->startOfMonth()->toDateString();
        $last_day = now('Asia/Dhaka')->endOfMonth()->toDateString();

        $meal_summary = OrderMeal::withTrashed()
            ->whereBetween('meal_given_date', [$first_day, $last_day])
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN total_meal ELSE 0 END), 0) as total_meal,
                 COALESCE(SUM(total_meal), 0) as total_meals,
                 COALESCE(SUM(CASE WHEN meal_given_date = ? AND deleted_at IS NULL THEN lunch ELSE 0 END), 0) as today_lunch_order,
                 COALESCE(SUM(CASE WHEN meal_given_date = ? AND deleted_at IS NULL THEN dinner ELSE 0 END), 0) as today_dinner_order',
                [$today, $today]
            )
            ->first();
        $total_meal = $meal_summary->total_meal;
        $total_meals = $meal_summary->total_meals;
        $total_cancel_meal = $total_meals - $total_meal;

        $total_bazar_cost = DailyBazarCost::whereBetween('date', [$first_day, $last_day])
                                            ->sum('amount'); 

        $total_payments = Payment::whereBetween('payment_date', [$first_day, $last_day])
                                            ->sum('amount');

        $statement_summary = MonthlyStatement::selectRaw(
            'COALESCE(SUM(take), 0) as total_due, COALESCE(SUM(give), 0) as total_user_due'
        )->first();

        $total_earnings = $total_payments - $statement_summary->total_due;
        $total_user_due = $statement_summary->total_user_due;

        return array(
                    "total_customer" => $total_customer,
                    "total_meal" => $total_meal,
                    "total_cancel_meal" => $total_cancel_meal,
                    "total_bazar_cost" => round($total_bazar_cost),
                    "total_earnings" => round($total_earnings),
                    "total_user_due" => round($total_user_due),
                    "today_lunch_order" => $meal_summary->today_lunch_order,
                    "today_dinner_order" => $meal_summary->today_dinner_order,

                    );
       

    }

    public function CountDashboardSummary(Request $req)
    {
        $user = $req->user();
        $user_id = $user->id;
        $first_day = now('Asia/Dhaka')->startOfMonth()->toDateString();
        $last_day = now('Asia/Dhaka')->endOfMonth()->toDateString();

        $meal_rate = MealRate::select('lunch_rate', 'dinner_rate')->get();
        $meal_summary = OrderMeal::where('user_id', $user_id)
            ->whereBetween('meal_given_date', [$first_day, $last_day])
            ->selectRaw(
                'COALESCE(SUM(lunch), 0) as total_lunch,
                 COALESCE(SUM(dinner), 0) as total_dinner,
                 COALESCE(SUM(total_amount), 0) as total_cost'
            )
            ->first();
        $total_lunch = $meal_summary->total_lunch;
        $total_dinner = $meal_summary->total_dinner;
        $total_meal = $total_lunch + $total_dinner;
        $total_cost = $meal_summary->total_cost;
        $total_working_day = (int) now('Asia/Dhaka')->format('d');
        $month_last_date = (int) now('Asia/Dhaka')->endOfMonth()->format('d');
        $Remaining_working_day =  $month_last_date -  $total_working_day;
        $unread_notification = NotificationDetail::where('user_id', $user_id)
                                                 ->whereIn('status', ['Latest', 'Unread'])
                                                 ->count();

        $total_sending_message = Notification::where('author_id', $user_id)->count();

        $total_payment = Payment::where('token_no', $user->token_no)
            ->whereBetween('payment_date', [$first_day, $last_day])
            ->sum('amount');

        return array(
            "Meal_Rate" => $meal_rate,
            "Lunch" => $total_lunch, 
            "Dinner" => $total_dinner, 
            "Total_Meal" => $total_meal,
            "Total_Cost" => $total_cost,
            "Total_Payment" => $total_payment,
            "Total_Due" => "0",
            "Total_Working_Day" => $total_working_day,
            "Remaining_Working_Day" => $Remaining_working_day,
            "Unread_Notification" => $unread_notification,
            "Total_Sending_Message" => $total_sending_message,
        
        );
    }

    public function LastFivePaymentDetails(Request $req)
    {
        $token_no = $req->token_no;
        $payments = Payment::where('token_no', $token_no)
                            ->orderBy('id', 'desc')
                            ->limit(5)
                            ->get();
        return $payments;
    }
    
    public function LastFiveMonthsStatements(Request $req)
    {
        $token_no = $req->token_no;
        $statements = MonthlyStatement::where('token_no', $token_no)
                            ->orderBy('id', 'desc')
                            ->limit(5)
                            ->get();
        return $statements;
    }
    
    public function LastSevenDaysMealReport(Request $req)
    {
        $user_id = $req->user_id;
        $meal_report = OrderMeal::where('user_id', $user_id)
                            ->orderBy('id', 'desc')
                            ->limit(7)
                            ->get();
        return $meal_report;
    }


}
