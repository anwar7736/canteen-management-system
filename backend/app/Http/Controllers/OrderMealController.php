<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\OrderMeal;
use App\Models\MealRate;
use App\Models\Payment;
use App\Models\User;
use App\Models\MonthlyStatement;
use App\Tenancy\TenantContext;
use Illuminate\Validation\ValidationException;

class OrderMealController extends Controller
{
    public $delivery_charge = 10;

    public function CountSummary($token_no)
    {
        $now = now('Asia/Dhaka');
        $first_day = $now->copy()->startOfMonth()->toDateString();
        $last_day = $now->copy()->endOfMonth()->toDateString();

        $meal_rate = MealRate::select('lunch_rate', 'dinner_rate')->first();
        abort_unless($meal_rate, 503, 'Meal rates are not configured.');
        $order_summary = OrderMeal::where('token_no', $token_no)
            ->whereBetween('meal_given_date', [$first_day, $last_day])
            ->selectRaw(
                'COALESCE(SUM(lunch), 0) as total_lunch,
                 COALESCE(SUM(dinner), 0) as total_dinner,
                 COALESCE(SUM(delivery_charge), 0) as total_delivery_cost'
            )
            ->first();
        $total_lunch = $order_summary->total_lunch;
        $lunch_cost = $meal_rate->lunch_rate * $total_lunch;
        $total_dinner = $order_summary->total_dinner;
        $total_delivery_cost = $order_summary->total_delivery_cost;
        $dinner_cost = $meal_rate->dinner_rate * $total_dinner;

        $total_meal = $total_lunch + $total_dinner;

        $total_cost = $lunch_cost +  $dinner_cost + $total_delivery_cost;

        $total_payment = Payment::settled()
            ->where('token_no', (string) $token_no)
            ->whereBetween('payment_date', [$first_day, $last_day])
            ->sum('amount');

        $give_take = $total_cost - $total_payment;

        $give = '';
        $take = '';

        if($give_take < 0)
        {
            $take = abs($give_take);
            $give = 0;
        }
        else {
            $take = 0;
            $give = $give_take;
        }

        $year = $now->year;
        $months = ["January", "February", "March", 
        "April", "May", "June", 
        "July", "August", "September", 
        "October", "November", "December"];
        $month = $months[$now->month - 1];
        return array(
            "total_lunch" => $total_lunch, 
            "lunch_cost" => $lunch_cost,  
            "total_dinner" => $total_dinner, 
            "dinner_cost" => $dinner_cost, 
            "total_meal" => $total_meal,
            "total_cost" => $total_cost,
            "total_payment" => $total_payment,
            "give" => $give,
            "take" => $take,
            "year"  =>  $year,
            "month" => $month,
        );
    }
    public function OrderDailyMeal(Request $req)
    {
        $validated = $req->validate([
            'token_no' => ['required', 'string', 'max:50'],
            'lunch' => ['required', 'integer', 'min:0', 'max:5'],
            'dinner' => ['required', 'integer', 'min:0', 'max:5'],
            'parcel' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        if ((int) $validated['lunch'] === 0 && (int) $validated['dinner'] === 0) {
            throw ValidationException::withMessages([
                'meal' => 'Choose at least one meal quantity.',
            ]);
        }

        $actor = $req->user();
        $token_no = $actor->role === 'user' ? (string) $actor->token_no : $validated['token_no'];
        $lunch = (int) $validated['lunch'];
        $dinner = (int) $validated['dinner'];
        $parcel = (bool) $validated['parcel'];
        $notes = $validated['notes'] ?? null;
        $total_meal      =  $lunch + $dinner;
        
        $user = User::where('token_no', $token_no)->first();
        abort_unless($user, 404, 'The selected member could not be found.');
        $user_id = $user->getKey();

        $meal_given_date = now('Asia/Dhaka')->addDay()->toDateString();

        $meal_rates    =  MealRate::first();
        abort_unless($meal_rates, 503, 'Meal rates are not configured.');
        $lunch_rate    =  $meal_rates->lunch_rate;
        $dinner_rate   =  $meal_rates->dinner_rate;
        $lunch_amount  =  $lunch_rate * $lunch ;
        $dinner_amount =  $dinner_rate * $dinner;
        $total_amount  =  $lunch_amount + $dinner_amount;

        $order_count = OrderMeal::where([
                        'user_id'=>$user_id, 
                        'token_no'=>$token_no, 
                        'meal_given_date'=> $meal_given_date
                        ])->first();
        if ($order_count) {
            return response()->json(['message' => "Today's order has already been placed."], 409);
        } else {
            $order = new OrderMeal;
            $order->user_id = $user_id;
            $order->token_no = $token_no;
            $order->lunch = $lunch;
            $order->lunch_amount = $lunch_amount;
            $order->dinner = $dinner;
            $order->dinner_amount = $dinner_amount;
            $order->total_meal = $total_meal;
            if($parcel)
            {
                $order->delivery_charge = $this->delivery_charge;
                $order->is_parcel = 'Yes';
                $order->total_amount = $total_amount + $this->delivery_charge;
            }
            else{
                $order->total_amount = $total_amount;
            }
            $order->notes = $notes;
            $order->meal_given_date = $meal_given_date;
            $result = $order->save();

            if($result)
            {
                $summary = $this->CountSummary($token_no);
                $rowCount = MonthlyStatement::where([
                                            'year'=>$summary['year'],
                                            'month'=>$summary['month'],
                                            'token_no'=>$token_no
                                            ])->count();


                if($rowCount > 0)
                {
                    $updated = MonthlyStatement::where([
                        'year'=>$summary['year'],
                        'month'=>$summary['month'],
                        'token_no'=>$token_no
                        ])->update([
                        'total_lunch' => $summary['total_lunch'],
                        'lunch_cost' => $summary['lunch_cost'],
                        'total_dinner' => $summary['total_dinner'],
                        'dinner_cost' => $summary['dinner_cost'],
                        'total_meal' => $summary['total_meal'],
                        'total_cost' => $summary['total_cost'],
                        'total_payment' => $summary['total_payment'],
                        'give' => $summary['give'],
                        'take' => $summary['take'],
                ]);

                }   
                else{
                    //Insert
                   $inserted = MonthlyStatement::insert([
                                        'tenant_id' => app(TenantContext::class)->id(),
                                        'year'=>$summary['year'],
                                        'month'=>$summary['month'],
                                        'token_no' => $token_no,
                                        'total_lunch' => $summary['total_lunch'],
                                        'lunch_cost' => $summary['lunch_cost'],
                                        'total_dinner' => $summary['total_dinner'],
                                        'dinner_cost' => $summary['dinner_cost'],
                                        'total_meal' => $summary['total_meal'],
                                        'total_cost' => $summary['total_cost'],
                                        'total_payment' => $summary['total_payment'],
                                        'give' => $summary['give'],
                                        'take' => $summary['take'],
                                ]);

                }
                return $result;
            }
        }
    }

    public function GetTodayOrderInfo(Request $req)
    {
        $user_id = $req->user_id;
        $token_no = $req->token_no;
        $meal_given_date = now('Asia/Dhaka')->addDay()->toDateString();
        $today_order_info = OrderMeal::where([
            'user_id'=>$user_id, 
            'token_no'=>$token_no, 
            'meal_given_date'=> $meal_given_date
            ])->get();

        return  $today_order_info;
    }
    
    public function GetTodayOrderInfoByOrderId(Request $req)
    {
        $order_id = $req->order_id;
        $meal_given_date = now('Asia/Dhaka')->addDay()->toDateString();
        $today_order_info = OrderMeal::where([
            'id'=>$order_id, 
            'meal_given_date'=> $meal_given_date
            ])->get();

        return  $today_order_info;
    }


    public function GetTodayAllOrderInfo(Request $req)
    {
        $meal_given_date = now('Asia/Dhaka')->addDay()->toDateString();
        $today_order_info = OrderMeal::where([
            'meal_given_date'=> $meal_given_date
            ])->get();

        return  $today_order_info;
    }

    public function ChangeOrderedMeal(Request $req)
    {
        $validated = $req->validate([
            'order_id' => ['required', 'integer'],
            'token_no' => ['required', 'string', 'max:50'],
            'lunch' => ['required', 'integer', 'min:0', 'max:5'],
            'dinner' => ['required', 'integer', 'min:0', 'max:5'],
            'parcel' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        if ((int) $validated['lunch'] === 0 && (int) $validated['dinner'] === 0) {
            throw ValidationException::withMessages([
                'meal' => 'Choose at least one meal quantity.',
            ]);
        }
        $order_id = $validated['order_id'];
        $lunch = (int) $validated['lunch'];
        $dinner = (int) $validated['dinner'];
        $parcel = (bool) $validated['parcel'];
        $total_meal    =  $lunch + $dinner;
        $notes         =  $validated['notes'] ?? null;
        $meal_rates    =  MealRate::first();
        abort_unless($meal_rates, 503, 'Meal rates are not configured.');
        $lunch_rate    =  $meal_rates->lunch_rate;
        $dinner_rate   =  $meal_rates->dinner_rate;
        $lunch_amount  =  $lunch_rate * $lunch ;
        $dinner_amount =  $dinner_rate * $dinner;
        $total_amount  =  $lunch_amount + $dinner_amount;
        
        $ordered_meal = OrderMeal::whereKey($order_id)
            ->whereDate('meal_given_date', now('Asia/Dhaka')->addDay()->toDateString())
            ->firstOrFail();
        $actor = $req->user();
        if ($actor->role === 'user') {
            abort_unless((int) $ordered_meal->user_id === (int) $actor->getKey(), 403);
        }
        $token_no = (string) $ordered_meal->token_no;
        $ordered_meal->lunch  = $lunch;
        $ordered_meal->lunch_amount = $lunch_amount;
        $ordered_meal->dinner = $dinner;
        $ordered_meal->dinner_amount = $dinner_amount;
        $ordered_meal->total_meal = $total_meal;
        if($parcel)
        {
            $ordered_meal->delivery_charge = $this->delivery_charge;
            $ordered_meal->is_parcel = 'Yes';
            $ordered_meal->total_amount = $total_amount + $this->delivery_charge;
        }
        else{
            $ordered_meal->delivery_charge = 0;
            $ordered_meal->is_parcel = 'No';
            $ordered_meal->total_amount = $total_amount;
        }
        $ordered_meal->notes = $notes;
        $result = $ordered_meal->save();
        if($result)
        {
            $summary = $this->CountSummary($token_no);
            $updated = MonthlyStatement::where([
                'year'=>$summary['year'],
                'month'=>$summary['month'],
                'token_no'=>$token_no
                ])->update([
                'total_lunch' => $summary['total_lunch'],
                'lunch_cost' => $summary['lunch_cost'],
                'total_dinner' => $summary['total_dinner'],
                'dinner_cost' => $summary['dinner_cost'],
                'total_meal' => $summary['total_meal'],
                'total_cost' => $summary['total_cost'],
                'total_payment' => $summary['total_payment'],
                'give' => $summary['give'],
                'take' => $summary['take'],
        ]);
            return $result;
        }
    }

    public function ChangeMealStatus(Request $req)
    {
        $order_id = $req->order_id;
        $meal_status = $req->meal_status;
        $result = OrderMeal::where('id', $order_id)->update(['status'=>$meal_status]);
        return $result;
    }

    public function DeleteTodayOrderedMeal(Request $req)
    {
        $order_id = $req->order_id;
        $order = OrderMeal::where('id', $order_id)->first();
        $token_no =  $order->token_no;
        $result   = OrderMeal::find($order_id)->delete();
        if($result)
        {
            $summary = $this->CountSummary($token_no);
            $updated = MonthlyStatement::where([
                'year'=>$summary['year'],
                'month'=>$summary['month'],
                'token_no'=>$token_no
                ])->update([
                'total_lunch' => $summary['total_lunch'],
                'lunch_cost' => $summary['lunch_cost'],
                'total_dinner' => $summary['total_dinner'],
                'dinner_cost' => $summary['dinner_cost'],
                'total_meal' => $summary['total_meal'],
                'total_cost' => $summary['total_cost'],
                'total_payment' => $summary['total_payment'],
                'give' => $summary['give'],
                'take' => $summary['take'],
        ]);
            return $result;
        }
       
    }
    
    public function RestoreTodayOrderedMeal(Request $req)
    {
        $order_id = $req->order_id;
        $order = OrderMeal::where('id', $order_id)->withTrashed()->first();
        $token_no =  $order->token_no;
        $result   = OrderMeal::withTrashed()->find($order_id)->restore();
        if($result)
        {
            $summary = $this->CountSummary($token_no);
            $updated = MonthlyStatement::where([
                'year'=>$summary['year'],
                'month'=>$summary['month'],
                'token_no'=>$token_no
                ])->update([
                'total_lunch' => $summary['total_lunch'],
                'lunch_cost' => $summary['lunch_cost'],
                'total_dinner' => $summary['total_dinner'],
                'dinner_cost' => $summary['dinner_cost'],
                'total_meal' => $summary['total_meal'],
                'total_cost' => $summary['total_cost'],
                'total_payment' => $summary['total_payment'],
                'give' => $summary['give'],
                'take' => $summary['take'],
        ]);
            return $result;
        }
    }
}
